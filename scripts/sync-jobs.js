import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 从环境变量读取凭证（GitHub Actions）或本地配置文件
const APP_ID = process.env.FEISHU_APP_ID || '';
const APP_SECRET = process.env.FEISHU_APP_SECRET || '';
const APP_TOKEN = process.env.FEISHU_APP_TOKEN || 'YRafbYwZdamWrbs3Tf1cfzCjngh';
const TABLE_ID = process.env.FEISHU_TABLE_ID || 'tblwTldArcyMpOOP';

if (!APP_ID || !APP_SECRET) {
  console.error('❌ 缺少 FEISHU_APP_ID 或 FEISHU_APP_SECRET 环境变量');
  process.exit(1);
}

async function getTenantToken() {
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`Tenant token error: ${JSON.stringify(data)}`);
  return data.tenant_access_token;
}

async function fetchRecords(token) {
  const records = [];
  let pageToken = null;
  while (true) {
    const url = new URL(`https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records`);
    url.searchParams.set('page_size', '500');
    if (pageToken) url.searchParams.set('page_token', pageToken);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.code !== 0) throw new Error(`Fetch error: ${JSON.stringify(data)}`);
    records.push(...(data.data?.items || []));
    if (!data.data?.has_more) break;
    pageToken = data.data.page_token;
  }
  return records;
}

// ========== 处理逻辑（复用 github-sync.js 核心逻辑）==========

const KNOWN_MAP = [
  ['网易', '知名游戏大厂（杭州）'],
  ['腾讯', '头部互联网公司'],
  ['米哈游', '二次元游戏头部公司'],
  ['莉莉丝', '头部游戏出海公司'],
  ['库洛', '新兴游戏公司（广州）'],
  ['悠星', '二次元游戏发行公司（上海）'],
  ['金山', '老牌游戏公司（珠海）'],
  ['叠纸', '女性向游戏头部公司（上海）'],
  ['祖龙', '知名游戏研发公司'],
  ['布鲁可', '文创科技公司（上海）'],
  ['心语', '游戏本地化服务商'],
  ['火星语盟', '专业翻译公司（深圳）'],
  ['创凌', '知名本地化公司（上海）'],
  ['linguitronics', '知名本地化公司（上海）'],
  ['舜禹', '大型翻译公司（江苏）'],
  ['transphere', '大型翻译公司（江苏）'],
  ['诺谦', '游戏本地化服务商（厦门）'],
  ['uni-spect', '游戏本地化服务商（厦门）'],
  ['onesky', '全球化本地化平台'],
  ['lcplocalizations', '海外本地化公司'],
  ['langlink', '专业本地化公司'],
  ['ea', '国际知名游戏公司（上海）'],
  ['叮咚', '教育机构（上海）'],
  ['阅友', '网文出海公司（北京）'],
  ['天屹', '数字科技公司（杭州）'],
  ['行星波', '文化传播公司（广州）'],
  ['xieyezhai', '文化传播公司（广州）'],
  ['速魔', '科技公司（深圳）'],
  ['稻谷娱加', '短剧出海公司（汕头）'],
  ['亮语', '翻译公司（沈阳）'],
  ['职未', '咨询公司（上海）'],
  ['译树', '翻译公司（长沙）'],
  ['interpretree', '翻译公司（长沙）'],
  ['中电金信', '大型IT服务公司'],
  ['外经实业', '建设工程公司（河南）'],
  ['智程', '咨询公司（上海）'],
  ['美国石油', '国际行业协会'],
  ['天然气', '国际行业协会'],
];

function getFieldText(fields, name) {
  // 先尝试精确匹配
  let val = fields[name];
  // 再尝试忽略大小写和空格匹配
  if (val === undefined) {
    const keys = Object.keys(fields);
    const lowerTarget = name.toLowerCase().replace(/\s+/g, '');
    const key = keys.find(k => k.toLowerCase().replace(/\s+/g, '') === lowerTarget);
    if (key) val = fields[key];
  }
  // 最后尝试包含匹配（字段名包含目标名，或目标名包含字段名）
  if (val === undefined) {
    const keys = Object.keys(fields);
    const lowerTarget = name.toLowerCase().replace(/\s+/g, '');
    const key = keys.find(k => {
      const lowerKey = k.toLowerCase().replace(/\s+/g, '');
      return lowerKey.includes(lowerTarget) || lowerTarget.includes(lowerKey);
    });
    if (key) {
      console.log(`  📌 字段匹配成功: "${name}" -> "${key}"`);
      val = fields[key];
    }
  }
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(v => typeof v === 'string' ? v : v?.text || '').join(' ').trim();
  return String(val || '');
}

function getFieldArray(fields, name) {
  let val = fields[name];
  if (val === undefined) {
    const keys = Object.keys(fields);
    const lowerTarget = name.toLowerCase().replace(/\s+/g, '');
    const key = keys.find(k => k.toLowerCase().replace(/\s+/g, '') === lowerTarget);
    if (key) val = fields[key];
  }
  if (val === undefined) {
    const keys = Object.keys(fields);
    const lowerTarget = name.toLowerCase().replace(/\s+/g, '');
    const key = keys.find(k => {
      const lowerKey = k.toLowerCase().replace(/\s+/g, '');
      return lowerKey.includes(lowerTarget) || lowerTarget.includes(lowerKey);
    });
    if (key) {
      console.log(`  📌 字段匹配成功: "${name}" -> "${key}"`);
      val = fields[key];
    }
  }
  return Array.isArray(val) ? val : (val ? [val] : []);
}

function anonymizeCompany(company, desc) {
  const c = (company || '').toLowerCase();
  const d = (desc || '').toLowerCase();
  for (const [kw, alias] of KNOWN_MAP) {
    if (c.includes(kw)) return alias;
  }
  if (['个人', '个人翻译需求', '个人成立的本地化团队'].includes(c)) {
    if (d.includes('游戏')) return '优质游戏客户';
    if (d.includes('口译')) return '优质口译客户';
    if (d.includes('翻译')) return '优质翻译客户';
    return '优质客户';
  }
  if (c.includes('邱天烨') || c.includes('meowcalization')) return '专业本地化工作室';
  if (d.includes('游戏') || d.includes('lqa') || d.includes('localization')) return '某游戏公司';
  if (d.includes('口译')) return '某口译需求方';
  if (d.includes('翻译')) return '某翻译需求方';
  if (d.includes('教育') || d.includes('老师')) return '某教育机构';
  if (d.includes('科技') || d.includes('互联网')) return '某科技公司';
  return '社群内部需求';
}

function extractType(jobName, formField) {
  const types = [];
  const formTexts = (formField || []).map(f => typeof f === 'string' ? f.toLowerCase() : JSON.stringify(f).toLowerCase());
  const formText = formTexts.join(' ');

  // 优先从飞书「岗位形式」字段读取（每个类型独立判断，允许多选）
  // 注意：远程/线下是地点属性，不放入 type 数组
  if (formText.includes('全职')) types.push('全职');
  if (formText.includes('正编')) types.push('正编');
  if (formText.includes('兼职')) types.push('兼职');
  if (formText.includes('外包')) types.push('外包');
  if (formText.includes('实习')) types.push('实习');

  if (types.length > 0) return [...new Set(types)];

  // fallback：从岗位名称中推断
  const nameText = (jobName || '').toLowerCase();
  if (nameText.includes('全职')) types.push('全职');
  if (nameText.includes('正编')) types.push('正编');
  if (nameText.includes('兼职') || nameText.includes('part-time')) types.push('兼职');
  if (nameText.includes('外包') || nameText.includes('outsourced') || nameText.includes('freelance')) types.push('外包');
  if (nameText.includes('实习生') || nameText.includes('实习')) types.push('实习');

  if (types.length === 0) {
    if (nameText.includes('翻译') || nameText.includes('lqa')) types.push('兼职', '远程');
    else types.push('兼职');
  }
  return [...new Set(types)];
}

function extractLocation(jobName, comments, formField, locationSupplement) {
  // 优先使用飞书表格里「线下（请补充地点）-补充内容」字段
  if (locationSupplement && locationSupplement.trim()) {
    return locationSupplement.trim();
  }

  // 其次读取飞书「岗位形式」字段中的线上/线下信息
  const formText = JSON.stringify(formField || []).toLowerCase();
  const hasRemote = formText.includes('线上') || formText.includes('远程');
  const hasOnsite = formText.includes('线下');
  
  // 同时支持线上和线下 → 显示组合标签
  if (hasRemote && hasOnsite) {
    const text = `${jobName || ''} ${comments || ''}`;
    const cities = ['上海', '北京', '广州', '深圳', '杭州', '成都', '苏州', '珠海', '长沙', '厦门', '汕头', '南京', '武汉', '郑州', '东京'];
    const locations = cities.filter(city => text.includes(city));
    if (locations.length > 0) return `远程&线下(${locations.join('/')})`;
    return '远程&线下';
  }
  
  if (hasRemote) return '远程';
  if (hasOnsite) {
    const text = `${jobName || ''} ${comments || ''}`;
    const cities = ['上海', '北京', '广州', '深圳', '杭州', '成都', '苏州', '珠海', '长沙', '厦门', '汕头', '南京', '武汉', '郑州', '东京'];
    const locations = cities.filter(city => text.includes(city));
    if (locations.length > 0) return locations.join('/');
    return '线下（具体待定）';
  }

  // 从岗位名称和备注中提取城市名和远程关键词
  const text = `${jobName || ''} ${comments || ''}`;
  const cities = ['上海', '北京', '广州', '深圳', '杭州', '成都', '苏州', '珠海', '长沙', '厦门', '汕头', '南京', '武汉', '郑州', '东京'];
  const locations = cities.filter(city => text.includes(city));
  if (text.includes('远程') || text.includes('线上')) locations.push('远程');
  if (locations.length > 0) return locations.join('/');

  // 不明确时不展示，返回空字符串
  return '';
}

function extractLanguagePair(title, description) {
  const rawText = ((title || '') + ' ' + (description || ''));
  const text = rawText.toLowerCase();
  
  // 处理特殊写法：先保留简体/繁体信息，再匹配
  const normalized = text
    .replace(/繁中/g, '繁中').replace(/简中/g, '简中')
    .replace(/英语/g, '英').replace(/日语/g, '日').replace(/韩语/g, '韩').replace(/德语/g, '德').replace(/法语/g, '法').replace(/俄语/g, '俄').replace(/西语/g, '西').replace(/葡语/g, '葡')
    .replace(/\/\s*/g, '/');
  
  // 严格匹配：只认明确的语言对组合词
  // ⚠️ 简中/繁中是独立标识，不缩减为"中"
  const pairs = [
    // 简体中
    { keywords: ['简中↔英', '简中→英', '英→简中', '简中译英', '英译简中', '汉译英', '英译汉', 'chinese-english', 'english-chinese', '中↔英', '中→英', '英→中', '中英', '中译英', '英译中'], pair: '简中↔英' },
    { keywords: ['简中↔日', '简中→日', '日→简中', '简中译日', '日译简中', 'chinese-japanese', 'japanese-chinese', '中↔日', '中→日', '日→中', '中日', '中译日', '日译中'], pair: '简中↔日' },
    { keywords: ['简中↔韩', '简中→韩', '韩→简中', '简中译韩', '韩译简中', 'chinese-korean', 'korean-chinese', '中↔韩', '中→韩', '韩→中', '中韩', '中译韩', '韩译中'], pair: '简中↔韩' },
    // 繁体中
    { keywords: ['繁中↔英', '繁中→英', '英→繁中', '繁中译英', '英译繁中', '繁英', '繁中译英'], pair: '繁中↔英' },
    { keywords: ['繁中↔日', '繁中→日', '日→繁中', '繁中译日', '日译繁中'], pair: '繁中↔日' },
    { keywords: ['繁中↔韩', '繁中→韩', '韩→繁中', '繁中译韩', '韩译繁中'], pair: '繁中↔韩' },
    // 其他语言对
    { keywords: ['英日', '英译日', '日译英', 'english-japanese', 'japanese-english', '英↔日', '英→日', '日→英'], pair: '英↔日' },
    { keywords: ['英韩', '英译韩', '韩译英', 'english-korean', 'korean-english', '英↔韩', '英→韩', '韩→英'], pair: '英↔韩' },
    { keywords: ['中俄', '中译俄', '俄译中', '汉译俄', '俄译汉', 'chinese-russian', 'russian-chinese', '中↔俄', '中→俄', '俄→中'], pair: '中↔俄' },
    { keywords: ['中法', '中译法', '法译中', '汉译法', '法译汉', 'chinese-french', 'french-chinese', '中↔法', '中→法', '法→中'], pair: '中↔法' },
    { keywords: ['中德', '中译德', '德译中', '汉译德', '德译汉', 'chinese-german', 'german-chinese', '中↔德', '中→德', '德→中'], pair: '中↔德' },
    { keywords: ['中西', '中译西', '西译中', '汉译西', '西译汉', 'chinese-spanish', 'spanish-chinese', '中↔西', '中→西', '西→中'], pair: '中↔西' },
    { keywords: ['中葡', '中译葡', '葡译中', '汉译葡', '葡译汉', 'chinese-portuguese', 'portuguese-chinese', '中↔葡', '中→葡', '葡→中'], pair: '中↔葡' },
  ];
  
  for (const item of pairs) {
    if (item.keywords.some(k => normalized.includes(k))) {
      return item.pair;
    }
  }
  return null;
}

function extractSalary(salaryField, jobType, title, fullDesc) {
  if (!salaryField || !salaryField.length) return { salary: '', benefits: '', salaryNote: '' };
  const texts = salaryField.map(s => typeof s === 'string' ? s : s?.text || '').filter(Boolean);
  if (!texts.length) return { salary: '', benefits: '', salaryNote: '' };
  const raw = texts.join(' ').replace(/\s+/g, ' ').trim();
  if (raw.includes('私聊') || raw.includes('面议') || raw.includes('详谈')) return { salary: '', benefits: '', salaryNote: raw };

  // 如果文本不含明显薪资关键词且过长，视为说明文字而非薪资
  const salaryKeywords = ['元', '¥', '$', 'usd', 'k/', '/月', '/小时', '/天', '/千字', '千字', '时薪', '日薪', '月薪', '底薪', '提成', '佣金', '薪', '元/', '块', 'rmb'];
  const hasSalaryKeyword = salaryKeywords.some(kw => raw.toLowerCase().includes(kw));
  if (!hasSalaryKeyword && raw.length > 30) return { salary: '', benefits: '', salaryNote: raw };

  const isFullTime = (jobType || []).some(t => t.includes('全职') || t.includes('正编'));
  const isPartTime = (jobType || []).some(t => t.includes('兼职') || t.includes('外包'));

  // ========== 全职：XXK*XX薪 ==========
  if (isFullTime) {
    // 匹配月薪范围，如 15-20k, 15k-20k, 15k~20k, 15-20K/月, 15000-20000/月
    const monthlyMatch = raw.match(/(\d+\s*[\-~～至到]\s*\d+|\d+)[\s\/]*[kK千]?(?:\/月|每月|每月 salary)?/);
    const salaryPart = monthlyMatch ? monthlyMatch[0] : raw;

    // 提取数字并转为 K 格式
    const nums = salaryPart.match(/\d+/g);
    let kRange = '';
    if (nums) {
      const kNums = nums.map(n => {
        const v = parseInt(n);
        if (v >= 1000) return (v / 1000).toFixed(0); // 15000 → 15
        return v.toString(); // 15 → 15
      });
      if (kNums.length === 1) kRange = `${kNums[0]}K`;
      else kRange = `${kNums[0]}-${kNums[kNums.length - 1]}K`;
    }

    // 提取薪数（13薪/14薪/16薪/12薪）
    const monthMatch = raw.match(/(\d+)[\s]*薪/);
    const monthBonus = monthMatch ? `*${monthMatch[1]}薪` : '';

    // 提取福利关键词
    const benefitKeywords = ['五险一金', '六险一金', '七险一金', '补充医疗', '商业保险', '公积金', '社保',
      '饭补', '餐补', '交通补', '通讯补', '住房补贴', '租房补贴', '安家费', '节日福利',
      '带薪年假', '弹性工作', '远程办公', '双休', '加班费', '绩效奖金', '年终奖',
      '股票', '期权', '股权', '团建', '旅游', '体检', '健身房', '零食'];
    const foundBenefits = [];
    for (const kw of benefitKeywords) {
      if (raw.includes(kw)) foundBenefits.push(kw);
    }
    const benefits = foundBenefits.join('，');

    const salary = kRange + (monthBonus || '') || raw;
    return { salary, benefits, salaryNote: '' };
  }

  // ========== 兼职/外包：XXX元/千字 ==========
  if (isPartTime || !isFullTime) {
    // 匹配 150-200元/千字, $0.05-0.08/word, 200元/千字原文, etc.
    const unitMatch = raw.match(/[\d\.\s\-~～至到]+(?:元|人民币|RMB|美元|\$|美金|USD)?\s*[\/\-]\s*(?:千字|千字原文|千字译文|千字源文|千字目标文|word|小时|时|天|日|月|个项目|case|单)/i);
    let salary = '';
    if (unitMatch) {
      salary = unitMatch[0].replace(/\s+/g, '').replace(/[\-~～至到]/g, '-');
      // 标准化货币前缀
      salary = salary.replace(/^(\d)/, '¥$1'); // 默认加人民币符号
      salary = salary.replace(/USD\s*|\$\s*/i, '$');
    }

    // 提取额外福利/说明
    const extraKeywords = ['长期合作', '量大', '稳定', '急招', '测试通过', '试译通过', '月结', '周结', '日结',
      '预付', '定金', '尾款', '含税', '税后', '净价'];
    const foundExtras = [];
    for (const kw of extraKeywords) {
      if (raw.includes(kw)) foundExtras.push(kw);
    }
    const benefits = foundExtras.join('，');

    return { salary: salary || raw, benefits, salaryNote: salary ? '' : raw };
  }

  return { salary: raw, benefits: '', salaryNote: '' };
}

function extractRequirements(description) {
  if (!description || !description.length) return [];
  const texts = description.map(d => typeof d === 'string' ? d : d?.text || '').filter(Boolean);
  const fullText = texts.join('\n');

  // 策略：先找"岗位要求/任职要求/Requirements"标记，只提取该部分的内容
  const requirementMarkers = ['岗位要求', '任职要求', '【岗位要求】', '【任职要求】', '职位要求', '【职位要求】', 'Requirements', 'Qualifications'];
  const dutyMarkers = ['岗位职责', '【岗位职责】', '工作职责', '【工作职责】', 'Job Responsibilities', 'Responsibilities'];

  let startIdx = -1;
  let endIdx = fullText.length;

  // 找 requirements 部分的起始位置
  for (const marker of requirementMarkers) {
    const idx = fullText.indexOf(marker);
    if (idx !== -1) {
      startIdx = idx + marker.length;
      break;
    }
  }

  // 如果没找到 requirements 标记，返回空（避免把岗位职责混进去）
  if (startIdx === -1) return [];

  // 找结束位置（下一个部分的开头）
  for (const marker of [...dutyMarkers, ...requirementMarkers]) {
    const idx = fullText.indexOf(marker, startIdx);
    if (idx !== -1 && idx > startIdx) {
      endIdx = Math.min(endIdx, idx);
    }
  }

  const requirementSection = fullText.slice(startIdx, endIdx);
  const lines = requirementSection.split('\n').map(l => l.trim()).filter(l => l.length > 5);

  const requirements = [];
  for (const line of lines) {
    // 去掉编号前缀
    const clean = line.replace(/^(\d+[.、]\s*|[-•·*\s]+)/, '').trim();
    if (clean && clean.length > 5 && clean.length < 120 && !clean.includes('：')) {
      requirements.push(clean);
    }
    if (requirements.length >= 8) break;
  }

  return requirements;
}

function splitJobDescription(description) {
  if (!description || !description.length) return { duties: '', requirements: [] };
  const texts = description.map(d => typeof d === 'string' ? d : d?.text || '').filter(Boolean);
  const fullText = texts.join('\n');

  const dutyMarkers = ['【岗位职责】', '岗位职责', '工作职责', '【工作职责】', 'Job Responsibilities', 'Responsibilities'];
  const reqMarkers = ['【岗位要求】', '【任职要求】', '岗位要求', '任职要求', '职位要求', '【职位要求】', 'Requirements', 'Qualifications'];

  // 找职责和要求的起始位置
  let dutyStart = 0;
  let reqStart = -1;
  for (const marker of reqMarkers) {
    const idx = fullText.indexOf(marker);
    if (idx !== -1) { reqStart = idx; break; }
  }

  // 提取岗位职责：从 dutyStart 到 reqStart 之前
  let duties = reqStart !== -1 ? fullText.slice(dutyStart, reqStart).trim() : fullText.trim();
  // 去掉开头的职责标记
  for (const marker of dutyMarkers) {
    if (duties.startsWith(marker)) {
      duties = duties.slice(marker.length).trim();
      break;
    }
  }

  // 提取岗位要求
  const requirements = [];
  if (reqStart !== -1) {
    let reqSection = fullText.slice(reqStart).trim();
    // 去掉开头的要求标记
    for (const marker of reqMarkers) {
      if (reqSection.startsWith(marker)) {
        reqSection = reqSection.slice(marker.length).trim();
        break;
      }
    }
    const lines = reqSection.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    for (const line of lines) {
      const clean = line.replace(/^(\d+[.、]\s*|[-•·*\s]+)/, '').trim();
      if (clean && clean.length > 5 && clean.length < 120 && !clean.includes('：')) {
        requirements.push(clean);
      }
      if (requirements.length >= 8) break;
    }
  }

  return { duties, requirements };
}

function extractPostChannel(channelField) {
  if (!channelField || !channelField.length) return '';
  return channelField.map(c => typeof c === 'string' ? c : c?.text || '').join(' ').trim();
}

function isInternalOnly(channelField) {
  const channel = extractPostChannel(channelField).toLowerCase();
  // 空字段默认全渠道（保守原则：不匿名化）
  if (!channel) return false;
  // 包含"以上全部渠道" → 全渠道
  if (channel.includes('以上全部渠道') || channel.includes('all the channels')) return false;
  // 仅包含"社群内部" → 内部
  if (channel.includes('社群内部') || channel.includes('internal community')) return true;
  return false;
}

function extractDescription(description) {
  if (!description || !description.length) return '';
  const texts = description.map(d => typeof d === 'string' ? d : d?.text || '').filter(Boolean);
  const fullText = texts.join(' ').replace(/\s+/g, ' ').trim();
  if (fullText.length <= 150) return fullText;
  return fullText.slice(0, 150) + '...';
}

const JOB_KEYWORDS = ['译员', '翻译', '本地化', 'LQA', '审校', '校对', '文案', '编辑', '运营', '销售', '开发', '测试', '项目经理', '产品经理', '助理', '专员', '主管', '总监', '实习生', '辅导', '老师', '专家', '策划', '经理', '顾问', '口译', '笔译'];
const FORM_TAGS = ['线上', '线下', '全职', '兼职', '外包', '远程', '正编', '实习', 'outsource', 'outsourced', 'freelance', 'part-time', 'full-time'];

function hasJobKeyword(text) {
  return JOB_KEYWORDS.some(kw => text.includes(kw));
}

function isPureFormTag(text) {
  const t = text.toLowerCase().replace(/[\/\s\-，,]+/g, ' ').trim();
  const words = t.split(' ').filter(w => w.length > 0);
  if (words.length === 0) return true;
  // 如果所有词都是形式标签，认为是纯形式标签
  return words.every(w => FORM_TAGS.some(tag => w.includes(tag.toLowerCase())));
}

function cleanTitle(jobNameField, descriptionField) {
  // 收集所有候选文本
  const candidates = [];
  if (jobNameField && jobNameField.length) {
    for (const n of jobNameField) {
      const text = (typeof n === 'string' ? n : n?.text || '').trim();
      if (text && text.length > 2) {
        // 多行文本拆分成单独的行
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
        candidates.push(...lines);
      }
    }
  }
  
  // 如果招募岗位名称为空，从岗位描述的前几行提取候选标题
  if (!candidates.length && descriptionField && descriptionField.length) {
    for (const d of descriptionField) {
      const text = (typeof d === 'string' ? d : d?.text || '').trim();
      if (text && text.length > 2) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
        // 取前5行作为标题候选
        candidates.push(...lines.slice(0, 5));
      }
    }
  }
  
  if (!candidates.length) return { title: '翻译/本地化岗位', overflow: '' };

  let result;
  // 第一优先：找包含岗位关键词且不是纯形式标签的行
  for (const line of candidates) {
    if (hasJobKeyword(line) && !isPureFormTag(line)) {
      result = finalizeTitle(line);
      break;
    }
  }
  
  // 第二优先：找包含岗位关键词的行（即使看起来像形式标签）
  if (!result) {
    for (const line of candidates) {
      if (hasJobKeyword(line)) {
        result = finalizeTitle(line);
        break;
      }
    }
  }
  
  // 第三优先：找不是纯形式标签的行
  if (!result) {
    for (const line of candidates) {
      if (!isPureFormTag(line)) {
        result = finalizeTitle(line);
        break;
      }
    }
  }
  
  // 兜底：取第一行
  if (!result) {
    result = finalizeTitle(candidates[0]);
  }
  
  return result || { title: '翻译/本地化岗位', overflow: '' };
}

function finalizeTitle(raw) {
  let cleaned = raw.trim();
  
  // 去掉常见前缀（岗位描述里的）
  cleaned = cleaned.replace(/^(岗位|需求|职位|招聘|岗位职责|岗位描述|【岗位描述】|\[Responsibilities\]|Responsibilities)[:：\s]*/i, '');
  cleaned = cleaned.replace(/^\d+[、.\s]+/, '');
  
  // 去掉括号及里面的内容
  cleaned = cleaned.replace(/（.*?）/g, '').replace(/\(.*?\)/g, '').trim();
  
  // 去掉常见薪资/地点混入的关键词及之后的内容
  const salaryKeywords = ['k/', '/月', '/小时', '元/', '元/天', '元/千字', '薪资', '月薪', '时薪', '日薪', '元每月', 'k每月'];
  for (const kw of salaryKeywords) {
    const idx = cleaned.toLowerCase().indexOf(kw.toLowerCase());
    if (idx !== -1) {
      cleaned = cleaned.slice(0, idx).trim();
      break;
    }
  }
  
  // 去掉末尾常见干扰词
  cleaned = cleaned.replace(/(岗位|招募|招聘|需求|急招)[，,]*$/i, '');
  cleaned = cleaned.replace(/[：:\-]$/, '').trim();
  
  // 如果清理后为空，但原始文本有实质内容，尝试取第一行非空内容
  if (!cleaned && raw.trim()) {
    cleaned = raw.trim().split('\n')[0].trim();
    // 再次清理
    cleaned = cleaned.replace(/^(岗位|需求|职位|招聘|岗位职责|岗位描述|【岗位描述】|\[Responsibilities\]|Responsibilities)[:：\s]*/i, '');
    cleaned = cleaned.replace(/^\d+[、.\s]+/, '');
  }
  
  // 不再截断标题——列表页用 CSS truncate，详情页显示完整
  return { title: cleaned || '翻译/本地化岗位', overflow: '' };
}

function processRecord(record, index) {
  const fields = record.fields || {};
  const company = getFieldText(fields, '公司/个人 Company/Individual Name');
  const jobNameField = getFieldArray(fields, '招募岗位名称');
  const descField = getFieldArray(fields, '岗位要求Job Description');
  const titleResult = cleanTitle(jobNameField, descField);
  const title = titleResult.title;
  const titleOverflow = titleResult.overflow;
  const channelField = getFieldArray(fields, '希望发布渠道 Where to post your job?');
  const internalOnly = isInternalOnly(channelField);
  // 全渠道发布显示真实公司名，仅内部发布走匿名化
  const finalCompany = internalOnly 
    ? anonymizeCompany(company, getFieldText(fields, '岗位要求Job Description')) 
    : company;
  const formField = getFieldArray(fields, '岗位形式（兼职/外包/全职/线上/线下）Recruitment Positions (Part-time/Outsourced/Full-time/Remote/On-site)');
  const jobType = extractType(title, formField);
  
  // 舜禹岗位自动标记为内部
  if (finalCompany?.includes('舜禹') && !jobType?.includes('内部')) {
    jobType.push('内部');
  }
  const salaryResult = extractSalary(
    getFieldArray(fields, '薪资区间（请标注按原文/译文千字/时薪/天/月等）Salary Bands (per word count/hour/day/month/project etc.)'),
    jobType,
    title,
    getFieldText(fields, '岗位要求Job Description')
  );
  const locationSupplement = getFieldText(fields, '岗位形式（兼职/外包/全职/线上/线下）Recruitment Positions (Part-time/Outsourced/Full-time/Remote/On-site)-线下（请补充地点）-补充内容');
  const location = extractLocation(title, getFieldText(fields, '其他补充说明 Other comments'), formField, locationSupplement);
  const salary = salaryResult.salary;
  const salaryNote = salaryResult.salaryNote;
  let comments = getFieldText(fields, '其他补充说明 Other comments');
  // 试译内容（如有）——追加到备注栏
  const referenceText = getFieldText(fields, '试译内容（如有）reference');
  if (referenceText) {
    comments = comments ? `${comments}\n\n【试译内容】\n${referenceText}` : `【试译内容】\n${referenceText}`;
  }
  // 把薪资中提取的福利信息追加到备注
  if (salaryResult.benefits) {
    comments = comments ? `${comments}\n\n【待遇】${salaryResult.benefits}` : `【待遇】${salaryResult.benefits}`;
  }
  // 不再拆分岗位职责和岗位要求——全部放进 fullDescription
  const fullDescription = getFieldText(fields, '岗位要求Job Description');
  const requirements = []; // 不再拆分，避免出错
  // 标题溢出内容追加到岗位描述前面
  const finalFullDescription = titleOverflow 
    ? (titleOverflow + (fullDescription ? '\n\n' + fullDescription : '')) 
    : fullDescription;
  const languagePair = extractLanguagePair(title, getFieldText(fields, '岗位要求Job Description'));
  const description = extractDescription(descField);
  const deadline = getFieldText(fields, '截止日期 End Date');
  const submitTime = fields['提交时间'];
  const postedAt = submitTime ? new Date(submitTime).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

  // 联系方式 & 内推类型判断
  const contact = getFieldText(fields, '联系方式 Your contact');
  let referralType = 'circle'; // 默认：圈圈内推
  if (contact) {
    const c = contact.toLowerCase();
    if (c.includes('仅限社群') || c.includes('内部') || c.includes('付费')) {
      referralType = 'internal'; // 仅限社群内部
    } else if (c.includes('内推码') || c.includes('内推') || c.includes('referral') || c.includes('小伙伴')) {
      referralType = 'community'; // 社群小伙伴内推
    }
  }

  const job = {
    id: String(record.record_id || index + 1),
    title,
    company: finalCompany,
    type: jobType,
    location,
    salary,
    salaryNote,
    languagePair,
    gameType: null,
    description,
    fullDescription: finalFullDescription,
    requirements,
    deadline,
    comments,
    contact,
    referralType,
    postedAt,
    internalOnly: false,
  };

  if (internalOnly) {
    return {
      ...job,
      company: '社群内部需求',
      type: [...new Set([...job.type, '内部'])],
      internalOnly: true,
    };
  }

  return job;
}

async function main() {
  const token = await getTenantToken();
  console.log('✅ Got tenant token');
  const records = await fetchRecords(token);
  console.log(`📊 Fetched ${records.length} records`);
  const jobs = records.map((r, i) => processRecord(r, i));
  jobs.sort((a, b) => b.postedAt.localeCompare(a.postedAt));

  const outPath = path.join(__dirname, '..', 'src', 'data', 'jobs.json');
  fs.writeFileSync(outPath, JSON.stringify(jobs, null, 2), 'utf-8');

  const internalCount = jobs.filter(j => j.internalOnly).length;
  console.log(`✅ Written ${jobs.length} jobs to ${outPath}`);
  console.log(`   Public: ${jobs.length - internalCount}`);
  console.log(`   Internal (anonymized): ${internalCount}`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
