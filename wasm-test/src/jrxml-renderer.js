/**
 * JRXML HTML渲染器
 * 将解析后的JRXML对象渲染为HTML预览
 */

class JrxmlRenderer {

    constructor(options = {}) {
        this.options = {
            scale: 1,
            showGrid: false,
            showBorders: true,
            showElementBorders: true,
            maxPreviewSize: 2000,
            ...options,
        };
    }

    /**
     * 渲染JRXML为HTML
     * @param {Object} report - 解析后的报表对象
     * @returns {string} HTML字符串
     */
    render(report) {
        if (!report) {
            return '<div class="error">无效的报表数据</div>';
        }

        const contentWidth = report.pageWidth - report.leftMargin - report.rightMargin;

        let html = `
            <div class="jasper-report" style="
                width: ${report.pageWidth * this.options.scale}px;
                min-height: ${report.pageHeight * this.options.scale}px;
                background: white;
                position: relative;
                margin: 0 auto;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                font-family: Arial, sans-serif;
            ">
                <!-- 页面边距区域 -->
                <div class="page-content" style="
                    padding: ${report.topMargin * this.options.scale}px ${report.rightMargin * this.options.scale}px ${report.bottomMargin * this.options.scale}px ${report.leftMargin * this.options.scale}px;
                    position: relative;
                    min-height: ${(report.pageHeight - report.topMargin - report.bottomMargin) * this.options.scale}px;
                ">
        `;

        // 按顺序渲染各个带区
        const bandOrder = ['title', 'pageHeader', 'columnHeader', 'detail',
                          'columnFooter', 'pageFooter', 'summary', 'background'];

        bandOrder.forEach(bandType => {
            if (report.bands[bandType]) {
                html += this.renderBand(bandType, report.bands[bandType], contentWidth);
            }
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    /**
     * 渲染带区
     */
    renderBand(bandType, band, contentWidth) {
        const scaledHeight = band.height * this.options.scale;

        let html = `
            <div class="band band-${bandType}" style="
                position: relative;
                height: ${scaledHeight}px;
                width: 100%;
                ${this.options.showBorders ? 'border-bottom: 1px dashed #e0e0e0;' : ''}
            ">
                <!-- 带区标签 -->
                <div class="band-label" style="
                    position: absolute;
                    left: -${this.options.scale * 5}px;
                    top: 0;
                    transform: translateX(-100%);
                    font-size: ${10 * this.options.scale}px;
                    color: #999;
                    white-space: nowrap;
                ">${this.getBandDisplayName(bandType)}</div>
        `;

        // 渲染元素
        if (band.elements && band.elements.length > 0) {
            band.elements.forEach(element => {
                html += this.renderElement(element);
            });
        }

        html += '</div>';
        return html;
    }

    /**
     * 渲染单个元素
     */
    renderElement(element) {
        if (!element || !element.type) return '';

        const style = this.buildElementStyle(element);

        switch (element.type) {
            case 'staticText':
                return this.renderStaticText(element, style);
            case 'textField':
                return this.renderTextField(element, style);
            case 'image':
                return this.renderImage(element, style);
            case 'line':
                return this.renderLine(element);
            case 'rectangle':
                return this.renderRectangle(element, style);
            case 'ellipse':
                return this.renderEllipse(element, style);
            case 'frame':
                return this.renderFrame(element, style);
            default:
                return '';
        }
    }

    /**
     * 构建元素基础样式
     */
    buildElementStyle(element) {
        const s = this.options.scale;

        let style = `
            position: absolute;
            left: ${element.x * s}px;
            top: ${element.y * s}px;
            width: ${element.width * s}px;
            height: ${element.height * s}px;
            box-sizing: border-box;
        `;

        // 背景色
        if (element.mode === 'Opaque' && element.backcolor) {
            style += `background-color: ${element.backcolor};`;
        }

        // 前景色
        if (element.forecolor) {
            style += `color: ${element.forecolor};`;
        }

        // 边框
        if (this.options.showElementBorders) {
            style += 'border: 1px solid #ddd;';
        }

        // 边框样式
        if (element.box) {
            style += this.buildBoxStyle(element.box);
        }

        return style;
    }

    /**
     * 构建边框样式
     */
    buildBoxStyle(box) {
        let style = '';

        if (box.border) {
            style += `border: ${box.border};`;
        }
        if (box.borderColor) {
            style += `border-color: ${box.borderColor};`;
        }
        if (box.borderStyle) {
            style += `border-style: ${box.borderStyle};`;
        }

        // 边距
        if (box.topPadding) {
            style += `padding-top: ${box.topPadding}px;`;
        }
        if (box.leftPadding) {
            style += `padding-left: ${box.leftPadding}px;`;
        }
        if (box.bottomPadding) {
            style += `padding-bottom: ${box.bottomPadding}px;`;
        }
        if (box.rightPadding) {
            style += `padding-right: ${box.rightPadding}px;`;
        }

        return style;
    }

    /**
     * 渲染静态文本
     */
    renderStaticText(element, baseStyle) {
        const s = this.options.scale;
        const fontStyle = this.buildFontStyle(element.font, s);
        const textElementStyle = this.buildTextElementStyle(element);

        return `
            <div class="element static-text" style="${baseStyle} ${textElementStyle}">
                <span style="${fontStyle}">${this.escapeHtml(element.text)}</span>
            </div>
        `;
    }

    /**
     * 渲染文本字段
     */
    renderTextField(element, baseStyle) {
        const s = this.options.scale;
        const fontStyle = this.buildFontStyle(element.font, s);
        const textElementStyle = this.buildTextElementStyle(element);

        // 显示表达式
        const displayText = element.expression || '[空表达式]';

        return `
            <div class="element text-field" style="${baseStyle} ${textElementStyle}">
                <span class="expression" style="${fontStyle} color: #1890ff;">
                    ${this.escapeHtml(displayText)}
                </span>
                ${element.pattern ? `<span class="pattern" style="font-size: 10px; color: #999;"> [${element.pattern}]</span>` : ''}
            </div>
        `;
    }

    /**
     * 渲染图片
     */
    renderImage(element, baseStyle) {
        const s = this.options.scale;
        const scaleStyle = this.buildImageScaleStyle(element);
        const alignStyle = this.buildImageAlignStyle(element);

        return `
            <div class="element image" style="${baseStyle} display: flex; ${alignStyle}">
                <div class="image-placeholder" style="
                    width: 100%;
                    height: 100%;
                    background: #f5f5f5;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #999;
                    font-size: ${12 * s}px;
                    ${scaleStyle}
                ">
                    [图片: ${this.escapeHtml(element.expression || '未指定')}]
                </div>
            </div>
        `;
    }

    /**
     * 渲染线条
     */
    renderLine(element) {
        const s = this.options.scale;
        const lineWidth = (element.lineWidth || 1) * s;
        const lineColor = element.lineColor || '#000000';
        const lineStyle = element.lineStyle === 'Dashed' ? 'dashed' : 'solid';

        const isHorizontal = element.width > element.height;

        return `
            <div class="element line" style="
                position: absolute;
                left: ${element.x * s}px;
                top: ${element.y * s}px;
                width: ${element.width * s}px;
                height: ${element.height * s}px;
                overflow: visible;
            ">
                <div style="
                    ${isHorizontal ? `
                        width: 100%;
                        height: ${lineWidth}px;
                        border-top: ${lineWidth}px ${lineStyle} ${lineColor};
                        margin-top: ${-lineWidth / 2}px;
                    ` : `
                        height: 100%;
                        width: ${lineWidth}px;
                        border-left: ${lineWidth}px ${lineStyle} ${lineColor};
                        margin-left: ${-lineWidth / 2}px;
                    `}
                "></div>
            </div>
        `;
    }

    /**
     * 渲染矩形
     */
    renderRectangle(element, baseStyle) {
        const s = this.options.scale;
        const radius = (element.radius || 0) * s;

        let additionalStyle = '';
        if (radius > 0) {
            additionalStyle += `border-radius: ${radius}px;`;
        }

        // 图形元素样式
        if (element.graphicElement) {
            if (element.graphicElement.fill === 'Solid') {
                additionalStyle += `background-color: ${element.backcolor || '#ffffff'};`;
            }
        }

        return `
            <div class="element rectangle" style="${baseStyle} ${additionalStyle}">
            </div>
        `;
    }

    /**
     * 渲染椭圆
     */
    renderEllipse(element, baseStyle) {
        return `
            <div class="element ellipse" style="${baseStyle} border-radius: 50%;">
            </div>
        `;
    }

    /**
     * 渲染框架
     */
    renderFrame(element, baseStyle) {
        const s = this.options.scale;

        let childrenHtml = '';
        if (element.elements && element.elements.length > 0) {
            element.elements.forEach(child => {
                childrenHtml += this.renderElement(child);
            });
        }

        return `
            <div class="element frame" style="${baseStyle} position: relative;">
                ${childrenHtml}
            </div>
        `;
    }

    /**
     * 构建字体样式
     */
    buildFontStyle(font, scale) {
        if (!font) return '';

        let style = '';

        if (font.fontName) {
            style += `font-family: '${font.fontName}', Arial, sans-serif;`;
        }
        if (font.size) {
            style += `font-size: ${font.size * scale}px;`;
        }
        if (font.isBold) {
            style += 'font-weight: bold;';
        }
        if (font.isItalic) {
            style += 'font-style: italic;';
        }
        if (font.isUnderline) {
            style += 'text-decoration: underline;';
        }
        if (font.isStrikeThrough) {
            style += 'text-decoration: line-through;';
        }

        return style;
    }

    /**
     * 构建文本元素样式
     */
    buildTextElementStyle(element) {
        let style = '';

        // 文本对齐
        if (element.textAlignment) {
            const alignMap = {
                'Left': 'left',
                'Center': 'center',
                'Right': 'right',
                'Justified': 'justify',
            };
            style += `text-align: ${alignMap[element.textAlignment] || 'left'};`;
        }

        // 垂直对齐
        if (element.verticalAlignment) {
            const valignMap = {
                'Top': 'flex-start',
                'Middle': 'center',
                'Bottom': 'flex-end',
            };
            style += `display: flex; align-items: ${valignMap[element.verticalAlignment] || 'flex-start'};`;
        }

        // 文本调整
        if (element.textAdjust) {
            switch (element.textAdjust) {
                case 'StretchHeight':
                    style += 'overflow: visible;';
                    break;
                case 'CutText':
                    style += 'overflow: hidden;';
                    break;
                case 'ShrinkToFit':
                    style += 'overflow: hidden; white-space: nowrap;';
                    break;
            }
        }

        // 旋转
        if (element.rotation) {
            switch (element.rotation) {
                case 'Left':
                    style += 'transform: rotate(-90deg);';
                    break;
                case 'Right':
                    style += 'transform: rotate(90deg);';
                    break;
            }
        }

        return style;
    }

    /**
     * 构建图片缩放样式
     */
    buildImageScaleStyle(element) {
        switch (element.scaleImage) {
            case 'FillFrame':
                return 'object-fit: fill;';
            case 'RetainShape':
                return 'object-fit: contain;';
            case 'RealHeight':
            case 'RealSize':
                return 'object-fit: none;';
            case 'Clip':
                return 'object-fit: none; overflow: hidden;';
            default:
                return 'object-fit: contain;';
        }
    }

    /**
     * 构建图片对齐样式
     */
    buildImageAlignStyle(element) {
        let style = '';

        if (element.hAlign) {
            const hAlignMap = {
                'Left': 'justify-content: flex-start;',
                'Center': 'justify-content: center;',
                'Right': 'justify-content: flex-end;',
            };
            style += hAlignMap[element.hAlign] || '';
        }

        if (element.vAlign) {
            const vAlignMap = {
                'Top': 'align-items: flex-start;',
                'Middle': 'align-items: center;',
                'Bottom': 'align-items: flex-end;',
            };
            style += vAlignMap[element.vAlign] || '';
        }

        return style;
    }

    /**
     * 获取带区显示名称
     */
    getBandDisplayName(bandType) {
        const nameMap = {
            'title': '标题',
            'pageHeader': '页头',
            'columnHeader': '列头',
            'detail': '明细',
            'columnFooter': '列尾',
            'pageFooter': '页脚',
            'summary': '汇总',
            'background': '背景',
            'lastPageFooter': '末页页脚',
            'noData': '无数据',
        };
        return nameMap[bandType] || bandType;
    }

    /**
     * HTML转义
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JrxmlRenderer;
} else if (typeof window !== 'undefined') {
    window.JrxmlRenderer = JrxmlRenderer;
}
