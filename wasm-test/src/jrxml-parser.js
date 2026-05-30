/**
 * JRXML解析器 - JavaScript原生实现
 * 用于在浏览器中快速解析和预览JRXML内容
 */

class JrxmlParser {

    constructor() {
        this.parser = new DOMParser();
        this.serializer = new XMLSerializer();
    }

    /**
     * 解析JRXML内容
     * @param {string} jrxmlContent - JRXML字符串
     * @returns {Object} 解析后的报表对象
     */
    parse(jrxmlContent) {
        try {
            const doc = this.parser.parseFromString(jrxmlContent, 'text/xml');

            // 检查解析错误
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                throw new Error('XML解析错误: ' + parseError.textContent);
            }

            const report = doc.querySelector('jasperReport');
            if (!report) {
                throw new Error('无效的JRXML: 缺少jasperReport元素');
            }

            return {
                name: report.getAttribute('name'),
                pageWidth: parseInt(report.getAttribute('pageWidth') || '595'),
                pageHeight: parseInt(report.getAttribute('pageHeight') || '842'),
                leftMargin: parseInt(report.getAttribute('leftMargin') || '20'),
                rightMargin: parseInt(report.getAttribute('rightMargin') || '20'),
                topMargin: parseInt(report.getAttribute('topMargin') || '20'),
                bottomMargin: parseInt(report.getAttribute('bottomMargin') || '20'),
                bands: this.extractBands(report),
                fields: this.extractFields(report),
                parameters: this.extractParameters(report),
                styles: this.extractStyles(report),
                queryString: this.extractQueryString(report),
            };
        } catch (error) {
            console.error('JrxmlParser.parse error:', error);
            throw error;
        }
    }

    /**
     * 提取所有带区
     */
    extractBands(reportElement) {
        const bands = {};
        const bandTypes = [
            'title', 'pageHeader', 'columnHeader', 'detail',
            'columnFooter', 'pageFooter', 'summary', 'background',
            'lastPageFooter', 'noData'
        ];

        bandTypes.forEach(type => {
            const bandElement = reportElement.querySelector(type);
            if (bandElement) {
                const band = bandElement.querySelector('band');
                if (band) {
                    bands[type] = {
                        height: parseInt(band.getAttribute('height') || '0'),
                        splitType: band.getAttribute('splitType'),
                        elements: this.extractElements(band),
                    };
                }
            }
        });

        return bands;
    }

    /**
     * 提取带区中的所有元素
     */
    extractElements(bandElement) {
        const elements = [];

        // 静态文本
        bandElement.querySelectorAll(':scope > staticText').forEach(el => {
            elements.push(this.parseStaticText(el));
        });

        // 文本字段
        bandElement.querySelectorAll(':scope > textField').forEach(el => {
            elements.push(this.parseTextField(el));
        });

        // 图片
        bandElement.querySelectorAll(':scope > image').forEach(el => {
            elements.push(this.parseImage(el));
        });

        // 线条
        bandElement.querySelectorAll(':scope > line').forEach(el => {
            elements.push(this.parseLine(el));
        });

        // 矩形
        bandElement.querySelectorAll(':scope > rectangle').forEach(el => {
            elements.push(this.parseRectangle(el));
        });

        // 椭圆
        bandElement.querySelectorAll(':scope > ellipse').forEach(el => {
            elements.push(this.parseEllipse(el));
        });

        // 框架
        bandElement.querySelectorAll(':scope > frame').forEach(el => {
            elements.push(this.parseFrame(el));
        });

        // 按Y坐标排序
        elements.sort((a, b) => a.y - b.y);

        return elements;
    }

    /**
     * 解析reportElement公共属性
     */
    parseReportElement(element) {
        const reportEl = element.querySelector('reportElement');
        if (!reportEl) return {};

        return {
            uuid: reportEl.getAttribute('uuid'),
            x: parseInt(reportEl.getAttribute('x') || '0'),
            y: parseInt(reportEl.getAttribute('y') || '0'),
            width: parseInt(reportEl.getAttribute('width') || '0'),
            height: parseInt(reportEl.getAttribute('height') || '0'),
            mode: reportEl.getAttribute('mode'),
            forecolor: reportEl.getAttribute('forecolor'),
            backcolor: reportEl.getAttribute('backcolor'),
            printWhenExpression: reportEl.getAttribute('printWhenExpression'),
        };
    }

    /**
     * 解析静态文本
     */
    parseStaticText(element) {
        const reportProps = this.parseReportElement(element);
        const textElement = element.querySelector('textElement');
        const text = element.querySelector('text');

        return {
            type: 'staticText',
            ...reportProps,
            text: text?.textContent || '',
            markup: element.getAttribute('markup'),
            textAdjust: element.getAttribute('textAdjust'),
            rotation: element.getAttribute('rotation'),
            font: this.parseFont(textElement),
            box: this.parseBox(element),
        };
    }

    /**
     * 解析文本字段
     */
    parseTextField(element) {
        const reportProps = this.parseReportElement(element);
        const textElement = element.querySelector('textElement');
        const expression = element.querySelector('textFieldExpression');

        return {
            type: 'textField',
            ...reportProps,
            expression: expression?.textContent || '',
            pattern: element.getAttribute('pattern'),
            isBlankWhenNull: element.getAttribute('isBlankWhenNull') === 'true',
            evaluationTime: element.getAttribute('evaluationTime'),
            evaluationGroup: element.getAttribute('evaluationGroup'),
            hyperlinkType: element.getAttribute('hyperlinkType'),
            hyperlinkReferenceExpression: element.querySelector('hyperlinkReferenceExpression')?.textContent,
            font: this.parseFont(textElement),
            box: this.parseBox(element),
        };
    }

    /**
     * 解析图片
     */
    parseImage(element) {
        const reportProps = this.parseReportElement(element);
        const imageExpression = element.querySelector('imageExpression');

        return {
            type: 'image',
            ...reportProps,
            expression: imageExpression?.textContent || '',
            scaleImage: element.getAttribute('scaleImage'),
            hAlign: element.getAttribute('hAlign'),
            vAlign: element.getAttribute('vAlign'),
            isUsingCache: element.getAttribute('isUsingCache') === 'true',
            isLazy: element.getAttribute('isLazy') === 'true',
            onErrorType: element.getAttribute('onErrorType'),
            hyperlinkType: element.getAttribute('hyperlinkType'),
            box: this.parseBox(element),
        };
    }

    /**
     * 解析线条
     */
    parseLine(element) {
        const reportProps = this.parseReportElement(element);

        return {
            type: 'line',
            ...reportProps,
            direction: element.getAttribute('direction'),
            lineWidth: parseFloat(element.querySelector('graphicElement pen')?.getAttribute('lineWidth') || '1'),
            lineStyle: element.querySelector('graphicElement pen')?.getAttribute('lineStyle'),
            lineColor: element.querySelector('graphicElement pen')?.getAttribute('lineColor'),
        };
    }

    /**
     * 解析矩形
     */
    parseRectangle(element) {
        const reportProps = this.parseReportElement(element);

        return {
            type: 'rectangle',
            ...reportProps,
            radius: parseInt(element.getAttribute('radius') || '0'),
            pen: this.parsePen(element),
            graphicElement: this.parseGraphicElement(element),
        };
    }

    /**
     * 解析椭圆
     */
    parseEllipse(element) {
        const reportProps = this.parseReportElement(element);

        return {
            type: 'ellipse',
            ...reportProps,
            pen: this.parsePen(element),
            graphicElement: this.parseGraphicElement(element),
        };
    }

    /**
     * 解析框架
     */
    parseFrame(element) {
        const reportProps = this.parseReportElement(element);

        return {
            type: 'frame',
            ...reportProps,
            elements: this.extractElements(element),
            box: this.parseBox(element),
        };
    }

    /**
     * 解析字体
     */
    parseFont(textElement) {
        if (!textElement) return null;

        const font = textElement.querySelector('font');
        if (!font) return null;

        return {
            fontName: font.getAttribute('fontName'),
            size: parseInt(font.getAttribute('size') || '10'),
            isBold: font.getAttribute('isBold') === 'true',
            isItalic: font.getAttribute('isItalic') === 'true',
            isUnderline: font.getAttribute('isUnderline') === 'true',
            isStrikeThrough: font.getAttribute('isStrikeThrough') === 'true',
            pdfFontName: font.getAttribute('pdfFontName'),
            pdfEncoding: font.getAttribute('pdfEncoding'),
            isPdfEmbedded: font.getAttribute('isPdfEmbedded') === 'true',
        };
    }

    /**
     * 解析边框
     */
    parseBox(element) {
        const box = element.querySelector('box');
        if (!box) return null;

        const pen = box.querySelector('pen');

        return {
            border: pen?.getAttribute('lineWidth') ? `${pen.getAttribute('lineWidth')}px` : undefined,
            borderColor: pen?.getAttribute('lineColor'),
            borderStyle: pen?.getAttribute('lineStyle'),
            topPadding: parseInt(box.querySelector('topPadding')?.getAttribute('padding') || '0'),
            leftPadding: parseInt(box.querySelector('leftPadding')?.getAttribute('padding') || '0'),
            bottomPadding: parseInt(box.querySelector('bottomPadding')?.getAttribute('padding') || '0'),
            rightPadding: parseInt(box.querySelector('rightPadding')?.getAttribute('padding') || '0'),
            topPen: this.parsePenDetails(box.querySelector('topPen')),
            leftPen: this.parsePenDetails(box.querySelector('leftPen')),
            bottomPen: this.parsePenDetails(box.querySelector('bottomPen')),
            rightPen: this.parsePenDetails(box.querySelector('rightPen')),
        };
    }

    /**
     * 解析笔触详情
     */
    parsePenDetails(penElement) {
        if (!penElement) return null;

        return {
            lineWidth: parseFloat(penElement.getAttribute('lineWidth') || '0'),
            lineStyle: penElement.getAttribute('lineStyle'),
            lineColor: penElement.getAttribute('lineColor'),
        };
    }

    /**
     * 解析笔触
     */
    parsePen(element) {
        const pen = element.querySelector('pen');
        if (!pen) return null;

        return {
            lineWidth: parseFloat(pen.getAttribute('lineWidth') || '1'),
            lineStyle: pen.getAttribute('lineStyle'),
            lineColor: pen.getAttribute('lineColor'),
        };
    }

    /**
     * 解析图形元素
     */
    parseGraphicElement(element) {
        const graphicElement = element.querySelector('graphicElement');
        if (!graphicElement) return null;

        return {
            fill: graphicElement.getAttribute('fill'),
            pen: this.parsePen(element),
        };
    }

    /**
     * 提取字段定义
     */
    extractFields(reportElement) {
        const fields = [];
        reportElement.querySelectorAll('field').forEach(field => {
            const properties = [];
            field.querySelectorAll('property').forEach(prop => {
                properties.push({
                    name: prop.getAttribute('name'),
                    value: prop.getAttribute('value'),
                });
            });

            fields.push({
                name: field.getAttribute('name'),
                class: field.getAttribute('class'),
                description: field.getAttribute('description'),
                properties,
            });
        });
        return fields;
    }

    /**
     * 提取参数定义
     */
    extractParameters(reportElement) {
        const parameters = [];
        reportElement.querySelectorAll('parameter').forEach(param => {
            const defaultValueExpression = param.querySelector('defaultValueExpression');

            parameters.push({
                name: param.getAttribute('name'),
                class: param.getAttribute('class'),
                isForPrompting: param.getAttribute('isForPrompting') === 'true',
                defaultValue: defaultValueExpression?.textContent,
            });
        });
        return parameters;
    }

    /**
     * 提取样式定义
     */
    extractStyles(reportElement) {
        const styles = [];
        reportElement.querySelectorAll('style').forEach(style => {
            styles.push({
                name: style.getAttribute('name'),
                mode: style.getAttribute('mode'),
                forecolor: style.getAttribute('forecolor'),
                backcolor: style.getAttribute('backcolor'),
                parentStyle: style.getAttribute('parentStyle'),
                box: this.parseBox(style),
                font: this.parseFont(style),
                textElement: {
                    textAlignment: style.querySelector('textElement')?.getAttribute('textAlignment'),
                    verticalAlignment: style.querySelector('textElement')?.getAttribute('verticalAlignment'),
                },
            });
        });
        return styles;
    }

    /**
     * 提取查询语句
     */
    extractQueryString(reportElement) {
        const queryString = reportElement.querySelector('queryString');
        if (!queryString) return null;

        return {
            language: queryString.getAttribute('language'),
            text: queryString.textContent,
        };
    }

    /**
     * 验证JRXML语法
     */
    validate(jrxmlContent) {
        const errors = [];

        try {
            const doc = this.parser.parseFromString(jrxmlContent, 'text/xml');

            // 检查XML解析错误
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                errors.push({
                    type: 'xml',
                    message: 'XML语法错误: ' + parseError.textContent,
                });
                return { valid: false, errors };
            }

            // 检查根元素
            const report = doc.querySelector('jasperReport');
            if (!report) {
                errors.push({
                    type: 'structure',
                    message: '缺少jasperReport根元素',
                });
            }

            // 检查必需属性
            if (!report.getAttribute('name')) {
                errors.push({
                    type: 'attribute',
                    message: 'jasperReport缺少name属性',
                });
            }

            // 检查带区
            const bands = report.querySelectorAll('band');
            if (bands.length === 0) {
                errors.push({
                    type: 'structure',
                    message: '报表至少需要一个band',
                });
            }

            // 检查元素引用
            const fields = this.extractFields(report);
            const fieldNames = fields.map(f => f.name);

            report.querySelectorAll('textFieldExpression').forEach(expr => {
                const content = expr.textContent;
                const fieldRefs = content.match(/\$F\{([^}]+)\}/g);
                if (fieldRefs) {
                    fieldRefs.forEach(ref => {
                        const fieldName = ref.substring(3, ref.length - 1);
                        if (!fieldNames.includes(fieldName)) {
                            errors.push({
                                type: 'reference',
                                message: `引用了未定义的字段: ${fieldName}`,
                            });
                        }
                    });
                }
            });

            return {
                valid: errors.length === 0,
                errors,
            };
        } catch (error) {
            errors.push({
                type: 'unknown',
                message: error.message,
            });
            return { valid: false, errors };
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JrxmlParser;
} else if (typeof window !== 'undefined') {
    window.JrxmlParser = JrxmlParser;
}
