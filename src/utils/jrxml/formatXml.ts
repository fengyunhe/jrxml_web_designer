/**
 * 使用 DOMParser 将 JRXML 字符串格式化为缩进一致、可读性好的 XML。
 *
 * 格式规则：
 * - 每个子元素另起一行，缩进 2 空格
 * - 自闭合标签（无子元素、无文本）保持单行
 * - 叶节点的文本内容（如 CDATA）保持在同一行（如 <text>内容</text>）
 * - 属性 ≤2 个时放同一行；≥3 个时换行对齐（4 空格缩进）
 */
export function formatXML(xml: string): string {
  if (!xml) return xml;

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml.trim(), 'application/xml');

  // XML 解析失败，原样返回
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) return xml;

  const INDENT = '  ';

  function formatDecl(): string {
    const impl = doc.implementation;
    const dt = doc.doctype;
    let decl = `<?xml version="${impl?.documentVersion ?? '1.0'}" encoding="UTF-8"?>`;
    if (dt) {
      decl += `\n<!DOCTYPE ${dt.name}`;
      if (dt.publicId) decl += ` PUBLIC "${dt.publicId}"`;
      if (dt.systemId) decl += ` "${dt.systemId}"`;
      decl += '>';
    }
    return decl;
  }

  function escape(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * 检查子节点中是否包含元素节点（区分"纯文本叶节点"和"有子元素的节点"）
   */
  function hasElementChildren(node: Node): boolean {
    for (let i = 0; i < node.childNodes.length; i++) {
      if (node.childNodes[i].nodeType === Node.ELEMENT_NODE) return true;
    }
    return false;
  }

  /**
   * 格式化属性列表。
   * ≤5 个属性时放同一行；>5 个时每个属性换行对齐（4 空格缩进）。
   * reportElement (4 attrs), band (4 attrs) 保持单行；
   * jasperReport (10+ attrs) 换行以提升可读性。
   */
  function formatAttributes(el: Element): string {
    if (el.attributes.length === 0) return '';
    const attrs: string[] = [];
    for (let i = 0; i < el.attributes.length; i++) {
      const a = el.attributes[i];
      attrs.push(`${a.name}="${a.value}"`);
    }
    if (el.attributes.length <= 5) {
      return ' ' + attrs.join(' ');
    }
    // 大量属性（如 jasperReport）：每个属性换行，4 空格缩进
    return '\n' + attrs.map(a => `    ${a}`).join('\n');
  }

  /**
   * 格式化一个元素节点，返回带正确缩进的字符串
   */
  function formatElement(el: Element, level: number): string {
    const pad = INDENT.repeat(level);
    const tag = el.tagName;
    const attrs = formatAttributes(el);
    const hasElemChildren = hasElementChildren(el);

    // 自闭合标签：无子元素、无文本内容
    if (!hasElemChildren && el.childNodes.length === 0) {
      return attrs ? `${pad}<${tag}${attrs}/>` : `${pad}<${tag}/>`;
    }

    // 叶节点：只有文本/CDATA 内容，无子元素（如 <text>Report Title</text>）
    if (!hasElemChildren && el.childNodes.length > 0) {
      const content = serializeTextContent(el);
      return `${pad}<${tag}${attrs}>${content}</${tag}>`;
    }

    // 有子元素
    let xml = attrs ? `${pad}<${tag}${attrs}>` : `${pad}<${tag}>`;
    xml += serializeChildren(el, level + 1);
    xml += `${pad}</${tag}>`;
    return xml;
  }

  /**
   * 序列化纯文本内容（含 CDATA 节点检测，保留 <![CDATA[...]]> 格式）
   */
  function serializeTextContent(el: Node): string {
    let result = '';
    for (let i = 0; i < el.childNodes.length; i++) {
      const child = el.childNodes[i];
      if (child.nodeType === Node.CDATA_SECTION_NODE) {
        result += `<![CDATA[${child.textContent ?? ''}]]>`;
      } else {
        result += escape(child.textContent ?? '');
      }
    }
    return result;
  }

  /**
   * 序列化子节点（适用于有子元素的节点）
   */
  function serializeChildren(parent: Node, level: number): string {
    let result = '';
    for (let i = 0; i < parent.childNodes.length; i++) {
      const child = parent.childNodes[i];
      switch (child.nodeType) {
        case Node.ELEMENT_NODE:
          result += '\n' + formatElement(child as Element, level);
          break;
        case Node.TEXT_NODE: {
          const text = (child.textContent ?? '').trim();
          if (text) {
            result += '\n' + `${INDENT.repeat(level)}${escape(text)}`;
          }
          // 纯空白节点：完全忽略，不输出任何内容
          break;
        }
        case Node.CDATA_SECTION_NODE:
          result += '\n' + `${INDENT.repeat(level)}<![CDATA[${child.textContent ?? ''}]]>`;
          break;
        case Node.COMMENT_NODE:
          result += '\n' + `${INDENT.repeat(level)}<!--${child.textContent ?? ''}-->`;
          break;
        default:
          break;
      }
    }
    return result;
  }

  let result = formatDecl();
  if (doc.documentElement) {
    result += '\n' + formatElement(doc.documentElement, 0) + '\n';
  }
  return result;
}
