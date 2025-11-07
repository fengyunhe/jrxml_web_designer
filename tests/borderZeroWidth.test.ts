// 测试当lineWidth为0时，边框是否正确显示为none
import { describe, it, expect } from 'vitest';

// 模拟getBorderStyle函数的实现
const getBorderStyle = (side: string, box?: any): string | undefined => {
  if (!box) return 'none';
  
  // 优先使用sidePen元素（根据xsd定义，这是推荐的方式）
  const penProperty = side === 'top' ? box.topPen : 
                    side === 'left' ? box.leftPen : 
                    side === 'bottom' ? box.bottomPen : 
                    box.rightPen;
  
  // 获取各边边框样式和宽度
  const sideBorderStyle = side === 'top' ? box.topBorderStyle : 
                         side === 'left' ? box.leftBorderStyle : 
                         side === 'bottom' ? box.bottomBorderStyle : 
                         box.rightBorderStyle;
  
  const sideBorderWidth = side === 'top' ? box.topBorderWidth : 
                         side === 'left' ? box.leftBorderWidth : 
                         side === 'bottom' ? box.bottomBorderWidth : 
                         box.rightBorderWidth;
  
  // 其次考虑已弃用的sideBorder属性
  const borderProperty = side === 'top' ? box.topBorder : 
                     side === 'left' ? box.leftBorder : 
                     side === 'bottom' ? box.bottomBorder : 
                     box.rightBorder;
  
  // 如果有sideBorder属性且已经是完整的CSS边框字符串，直接返回
  if (borderProperty && borderProperty.includes(' ')) {
    return borderProperty;
  }
  
  // 如果sideBorder是空字符串，返回none
  if (borderProperty === '') {
    return 'none';
  }
  
  // 如果没有sidePen也没有sideBorder，检查全局pen或border
  // 只有当border属性存在且不为空字符串时才应用边框
  if (!penProperty && !borderProperty && (!box.pen || box.pen === '') && (!box.border || box.border === '')) return 'none';
  
  // 获取边框颜色 - 优先使用sidePen的lineColor，然后是全局pen的lineColor，再然后是已弃用的颜色属性
  const colorProperty = side === 'top' ? box.topBorderColor : 
                     side === 'left' ? box.leftBorderColor : 
                     side === 'bottom' ? box.bottomBorderColor : 
                     box.rightBorderColor;
  const color = penProperty?.lineColor || box.pen?.lineColor || colorProperty || box.borderColor;
  
  // 获取线宽 - 优先使用新的边框宽度属性
  let hasWidth = false;
  let width = '1px'; // 默认宽度

  if (penProperty?.lineWidth !== undefined) {
    width = `${penProperty.lineWidth}px`;
    // 只有当线宽大于0时才标记为有宽度
    hasWidth = penProperty.lineWidth > 0;
  } else if (sideBorderWidth !== undefined) {
    width = `${sideBorderWidth}px`;
    // 只有当线宽大于0时才标记为有宽度
    hasWidth = sideBorderWidth > 0;
  } else if (box.borderWidth !== undefined) {
    width = `${box.borderWidth}px`;
    // 只有当线宽大于0时才标记为有宽度
    hasWidth = box.borderWidth > 0;
  } else if (borderProperty === 'Thin' || borderProperty === '1Point') {
    width = '1px';
    hasWidth = true;
  } else if (borderProperty === '2Point' || borderProperty === 'Medium') {
    width = '2px';
    hasWidth = true;
  } else if (borderProperty === '4Point' || borderProperty === 'Thick') {
    width = '4px';
    hasWidth = true;
  }
  
  // 获取线型 - 优先使用新的边框样式属性
  let hasStyle = false;
  let style = 'solid'; // 默认实线
  
  if (penProperty?.lineStyle) {
    if (penProperty.lineStyle === 'Dashed') style = 'dashed';
    else if (penProperty.lineStyle === 'Dotted') style = 'dotted';
    else if (penProperty.lineStyle === 'Double') style = 'double';
    hasStyle = true;
  } else if (sideBorderStyle) {
    if (sideBorderStyle === 'Dashed') style = 'dashed';
    else if (sideBorderStyle === 'Dotted') style = 'dotted';
    else if (sideBorderStyle === 'Double') style = 'double';
    hasStyle = true;
  } else if (box.borderStyle) {
    if (box.borderStyle === 'Dashed') style = 'dashed';
    else if (box.borderStyle === 'Dotted') style = 'dotted';
    else if (box.borderStyle === 'Double') style = 'double';
    hasStyle = true;
  } else if (borderProperty === 'Dashed') {
    style = 'dashed';
    hasStyle = true;
  } else if (borderProperty === 'Dotted') {
    style = 'dotted';
    hasStyle = true;
  } else if (borderProperty === 'Double') {
    style = 'double';
    hasStyle = true;
  }
  
  // 只有当设置了颜色、宽度或样式中的至少一个时，才显示边框
  // 特别地，如果没有设置宽度（线宽为0或未设置），则不显示边框
  if (!color && !hasWidth && !hasStyle) return 'none';
  
  // 如果没有设置宽度（线宽为0），则不显示边框，即使有颜色或样式
  if (!hasWidth) return 'none';
  
  // 如果没有设置颜色，使用透明色
  const finalColor = color || 'transparent';
  
  return `${width} ${style} ${finalColor}`;
};

describe('边框线宽为0时的显示测试', () => {
  it('当topPen的lineWidth为0时，顶部边框应该不显示', () => {
    const box = {
      topPen: {
        lineWidth: 0,
        lineStyle: 'Solid',
        lineColor: '#000000'
      }
    };
    
    const topBorder = getBorderStyle('top', box);
    expect(topBorder).toBe('none');
  });
  
  it('当leftPen的lineWidth为0时，左侧边框应该不显示', () => {
    const box = {
      leftPen: {
        lineWidth: 0,
        lineStyle: 'Solid',
        lineColor: '#000000'
      }
    };
    
    const leftBorder = getBorderStyle('left', box);
    expect(leftBorder).toBe('none');
  });
  
  it('当bottomPen的lineWidth为0时，底部边框应该不显示', () => {
    const box = {
      bottomPen: {
        lineWidth: 0,
        lineStyle: 'Solid',
        lineColor: '#000000'
      }
    };
    
    const bottomBorder = getBorderStyle('bottom', box);
    expect(bottomBorder).toBe('none');
  });
  
  it('当rightPen的lineWidth为0时，右侧边框应该不显示', () => {
    const box = {
      rightPen: {
        lineWidth: 0,
        lineStyle: 'Solid',
        lineColor: '#000000'
      }
    };
    
    const rightBorder = getBorderStyle('right', box);
    expect(rightBorder).toBe('none');
  });
  
  it('当所有方向的lineWidth都为0时，所有边框都不应该显示', () => {
    const box = {
      topPen: { lineWidth: 0, lineStyle: 'Solid', lineColor: '#000000' },
      leftPen: { lineWidth: 0, lineStyle: 'Solid', lineColor: '#000000' },
      bottomPen: { lineWidth: 0, lineStyle: 'Solid', lineColor: '#000000' },
      rightPen: { lineWidth: 0, lineStyle: 'Solid', lineColor: '#000000' }
    };
    
    const topBorder = getBorderStyle('top', box);
    const leftBorder = getBorderStyle('left', box);
    const bottomBorder = getBorderStyle('bottom', box);
    const rightBorder = getBorderStyle('right', box);
    
    expect(topBorder).toBe('none');
    expect(leftBorder).toBe('none');
    expect(bottomBorder).toBe('none');
    expect(rightBorder).toBe('none');
  });
  
  it('当lineWidth大于0时，边框应该正常显示', () => {
    const box = {
      topPen: {
        lineWidth: 1,
        lineStyle: 'Solid',
        lineColor: '#000000'
      }
    };
    
    const topBorder = getBorderStyle('top', box);
    expect(topBorder).toBe('1px solid #000000');
  });
});