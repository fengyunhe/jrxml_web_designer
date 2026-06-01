import type { ReportParameter, ReportField } from '../types';

// --- Data Pools ---

const CHINESE_SURNAMES = [
  '王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
  '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
  '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧',
  '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕',
  '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎',
];

const CHINESE_GIVEN_CHARS = [
  '伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋',
  '艳', '勇', '军', '杰', '娟', '涛', '超', '明', '秀兰', '霞',
  '平', '刚', '桂英', '文', '华', '飞', '玲', '小红', '志强', '建国',
  '建华', '建国', '建军', '秀珍', '玉兰', '慧', '丽华', '国强', '国华', '建军',
  '志强', '志明', '志伟', '思远', '浩然', '子轩', '子涵', '雨萱', '欣怡', '紫萱',
  '梓萱', '语嫣', '若曦', '诗涵', '可欣', '美琪', '雅琪', '佳琪', '梦琪', '晓峰',
  '天宇', '俊杰', '嘉豪', '宇轩', '泽宇', '浩宇', '锦程', '嘉诚', '逸飞', '晨曦',
];

const CHINESE_PROVINCES = [
  '北京市', '上海市', '广东省', '江苏省', '浙江省', '山东省', '河南省',
  '四川省', '湖北省', '湖南省', '福建省', '安徽省', '江西省', '辽宁省',
  '陕西省', '重庆市', '天津市', '河北省', '山西省', '吉林省', '黑龙江省',
  '海南省', '贵州省', '云南省', '甘肃省', '青海省', '台湾省',
  '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区',
];

const CHINESE_CITIES: Record<string, string[]> = {
  '北京市': ['朝阳区', '海淀区', '东城区', '西城区', '丰台区'],
  '上海市': ['浦东新区', '黄浦区', '徐汇区', '静安区', '长宁区'],
  '广东省': ['广州市', '深圳市', '东莞市', '佛山市', '珠海市'],
  '江苏省': ['南京市', '苏州市', '无锡市', '常州市', '南通市'],
  '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市'],
  '山东省': ['济南市', '青岛市', '烟台市', '潍坊市', '临沂市'],
  '河南省': ['郑州市', '洛阳市', '开封市', '新乡市', '南阳市'],
  '四川省': ['成都市', '绵阳市', '德阳市', '宜宾市', '泸州市'],
  '湖北省': ['武汉市', '宜昌市', '襄阳市', '荆州市', '黄冈市'],
  '湖南省': ['长沙市', '株洲市', '湘潭市', '衡阳市', '岳阳市'],
};

const STATUS_OPTIONS = ['已完成', '进行中', '待处理', '已取消'];

const COMPANY_NAMES = [
  '华信科技', '星辰贸易', '远东信息', '天成文化', '博雅教育',
  '仁和医疗', '金鼎金融', '宏达制造', '瑞丰电子', '盛通物流',
  '恒达实业', '创想科技', '鑫源贸易', '正泰电器', '中联重科',
];

const STREET_NAMES = ['中山路', '人民路', '解放路', '建设路', '和平路', '幸福路', '文化路', '科技路'];

const DESCRIPTIONS = [
  '项目进展顺利，各项工作按计划推进',
  '需要进一步优化方案，提高工作效率',
  '已完成初步审核，等待最终确认',
  '数据已整理完毕，准备提交审批',
  '本季度业绩表现良好，超出预期目标',
  '建议加强团队协作，提升项目管理水平',
  '已完成需求分析，进入开发阶段',
  '各项指标均达到预期标准',
];

const EMAIL_DOMAINS = ['example.com', 'test.cn', 'demo.com', 'sample.org'];

const GIVEN_NAME_CHARS = '伟芳娜敏静丽强磊洋艳勇军杰涛超明霞文华飞玲红远宁安怡乐康泰瑞祥福禄寿喜春晓晨旭阳辉昊辰宇帆睿哲';

// --- Helper Functions ---

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomChineseName(): string {
  const surname = randomPick(CHINESE_SURNAMES);
  const givenLen = Math.random() > 0.5 ? 2 : 1;
  let given = '';
  for (let i = 0; i < givenLen; i++) {
    given += randomPick(Array.from(GIVEN_NAME_CHARS));
  }
  return surname + given;
}

function randomPhone(): string {
  const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139',
    '150', '151', '152', '153', '155', '156', '157', '158', '159',
    '170', '176', '177', '178',
    '180', '181', '182', '183', '184', '185', '186', '187', '188', '189'];
  const prefix = randomPick(prefixes);
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += randomInt(0, 9);
  }
  return prefix + suffix;
}

function randomEmail(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let name = '';
  const len = randomInt(4, 10);
  for (let i = 0; i < len; i++) {
    name += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${name}@${randomPick(EMAIL_DOMAINS)}`;
}

function randomAddress(): string {
  const province = randomPick(Object.keys(CHINESE_CITIES));
  const city = randomPick(CHINESE_CITIES[province] || ['市区']);
  const street = randomPick(STREET_NAMES);
  const num = randomInt(1, 200);
  return `${province}${city}${street}${num}号`;
}

function randomDate(): string {
  const now = Date.now();
  const threeYears = 3 * 365 * 24 * 60 * 60 * 1000;
  const ts = now - Math.random() * threeYears;
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function randomCompanyName(): string {
  const prefix = randomPick(['华', '中', '东', '新', '大', '盛', '恒', '金', '瑞', '鑫']);
  const name = randomPick(COMPANY_NAMES);
  const suffix = randomPick(['有限公司', '股份有限公司', '集团', '科技有限公司']);
  return `${prefix}${name.substring(0, 2)}${suffix}`;
}

let seqId = 1;

function resetSeqId(): void {
  seqId = 1;
}

// --- Name Heuristic Rules ---

interface NameRule {
  patterns: RegExp;
  generator: () => any;
}

const NAME_RULES: NameRule[] = [
  { patterns: /name|姓名|名称|员工|用户|客户|人名/i, generator: randomChineseName },
  { patterns: /phone|tel|电话|手机|联系方式/i, generator: randomPhone },
  { patterns: /email|邮箱|电子邮件/i, generator: randomEmail },
  { patterns: /address|地址|住址|住所|家庭住址/i, generator: randomAddress },
  { patterns: /date|日期|时间|出生|创建时间|更新时间|录入时间|发生时间|申请时间|审批时间/i, generator: randomDate },
  { patterns: /amount|金额|价格|费用|工资|收入|支出|余额|总价|单价|成本|利润|预算|总额/i, generator: () => randomInt(10, 99999) },
  { patterns: /quantity|数量|数目|件数|个数|数量/i, generator: () => randomInt(1, 999) },
  { patterns: /^id$|编号|序号|流水号/i, generator: () => seqId++ },
  { patterns: /status|状态/i, generator: () => randomPick(STATUS_OPTIONS) },
  { patterns: /city|城市/i, generator: () => { const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '重庆']; return randomPick(cities); } },
  { patterns: /province|省份/i, generator: () => randomPick(CHINESE_PROVINCES) },
  { patterns: /company|公司|企业|单位|部门/i, generator: randomCompanyName },
  { patterns: /description|描述|备注|说明|摘要|内容|信息/i, generator: () => randomPick(DESCRIPTIONS) },
  { patterns: /sex|gender|性别/i, generator: () => randomPick(['男', '女']) },
  { patterns: /age|年龄/i, generator: () => randomInt(18, 65) },
];

// --- Type-based Fallback ---

function generateByType(className: string): any {
  switch (className) {
    case 'java.lang.String':
      return `数据${randomInt(1000, 9999)}`;
    case 'java.lang.Integer':
    case 'java.lang.Long':
      return randomInt(1, 9999);
    case 'java.lang.Double':
    case 'java.lang.Float':
      return Math.round(Math.random() * 99999 * 100) / 100;
    case 'java.lang.Boolean':
      return Math.random() > 0.5;
    case 'java.util.Date':
      return randomDate();
    default:
      return `值${randomInt(1, 999)}`;
  }
}

// --- Public API ---

export function generateMockValue(fieldName: string, className: string): any {
  const lowerName = fieldName.toLowerCase();

  for (const rule of NAME_RULES) {
    if (rule.patterns.test(lowerName)) {
      return rule.generator();
    }
  }

  return generateByType(className);
}

export function generateMockParameters(parameters: ReportParameter[]): Record<string, any> {
  resetSeqId();
  const result: Record<string, any> = {};
  for (const param of parameters) {
    if (param.defaultValue) {
      result[param.name] = param.defaultValue;
    } else {
      result[param.name] = generateMockValue(param.name, param.class);
    }
  }
  return result;
}

export function generateMockDataSource(fields: ReportField[], rowCount: number): Record<string, any>[] {
  resetSeqId();
  const rows: Record<string, any>[] = [];
  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, any> = {};
    for (const field of fields) {
      row[field.name] = generateMockValue(field.name, field.class);
    }
    rows.push(row);
  }
  return rows;
}
