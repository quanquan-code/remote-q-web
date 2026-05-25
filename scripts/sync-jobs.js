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
  const val = fields[name];
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(v => typeof v === 'string' ? v : v?.text || '').join(' ').trim();
  return String(val || '');
}

function getFieldArray(fields, name) {
  const val = fields[name];
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

  // 优先从飞书「岗位形式」字段读取
  if (formText.includes('全职') || formText.includes('正编')) types.push('全职');
  if (formText.includes('兼职')) types.push('兼职');
  if (formText.includes('外包')) types.push('外包');
  if (formText.includes('线上') || formText.includes('远程')) types.push('线上');
  if (formText.includes('线下')) types.push('线下');
  if (formText.includes('实习')) types.push('实习');

  if (types.length > 0) return [...new Set(types)];

  // fallback：从岗位名称中推断
  const nameText = (jobName || '').toLowerCase();
  if (nameText.includes('全职') || nameText.includes('正编')) types.push('全职');
  if (nameText.includes('兼职') || nameText.includes('part-time')) types.push('兼职');
  if (nameText.includes('外包') || nameText.includes('outsourced') || nameText.includes('freelance')) types.push('外包');
  if (nameText.includes('线上') || nameText.includes('远程') || nameText.includes('remote')) types.push('线上');
  if (nameText.includes('线下') || nameText.includes('坐班') || nameText.includes('现场') || nameText.includes('on-site')) types.push('线下');
  if (nameText.includes('实习生') || nameText.includes('实习')) types.push('实习');

  if (types.length === 0) {
    if (nameText.includes('翻译') || nameText.includes('lqa')) types.push('兼职', '线上');
    else types.push('兼职');
  }
  return [...new Set(types)];
}

function extractLocation(jobName, comments, formField) {
  // 优先读取飞书「岗位形式」字段中的线上/线下信息
  const formText = JSON.stringify(formField || []).toLowerCase();
  if (formText.includes('线上') || formText.includes('远程')) return '远程';
  if (formText.includes('线下')) {
    // 从岗位名称和备注中提取城市名
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

function extractLanguagePair(description) {
  const d = (description || '').toLowerCase();
  if (d.includes('中') && d.includes('英')) return '中↔英';
  if (d.includes('中') && d.includes('日')) return '中↔日';
  if (d.includes('中') && d.includes('韩')) return '中↔韩';
  if (d.includes('英') && d.includes('日')) return '英↔日';
  if (d.includes('英') && d.includes('韩')) return '英↔韩';
  if (d.includes('日') && d.includes('英')) return '日→英';
  if (d.includes('韩') && d.includes('英')) return '韩→英';
  if (d.includes('中') && d.includes('俄')) return '中↔俄';
  if (d.includes('中') && d.includes('法')) return '中↔法';
  if (d.includes('中') && d.includes('德')) return '中↔德';
  if (d.includes('中') && d.includes('西')) return '中↔西';
  if (d.includes('中') && d.includes('葡')) return '中↔葡';
  return null;
}

function extractSalary(salaryField) {
  if (!salaryField || !salaryField.length) return '薪资面议';
  const texts = salaryField.map(s => typeof s === 'string' ? s : s?.text || '').filter(Boolean);
  if (!texts.length) return '薪资面议';
  const salary = texts[0];
  if (salary.includes('私聊') || salary.includes('面议') || salary.includes('详谈')) return '薪资面议';
  return salary;
}

function extractRequirements(description) {
  if (!description || !description.length) return [];
  const texts = description.map(d => typeof d === 'string' ? d : d?.text || '').filter(Boolean);
  const fullText = texts.join('\n');
  const lines = fullText.split('\n').map(l => l.trim()).filter(l => l);
  const requirements = [];
  for (const line of lines) {
    if (/^(\d+[.、]|[-•·*]|【要求】|【任职要求】|Requirements|Qualifications)/i.test(line)) {
      const clean = line.replace(/^(\d+[.、]|[-•·*]|\s)+/, '').trim();
      if (clean && clean.length > 5 && clean.length < 100) requirements.push(clean);
    }
    if (requirements.length >= 5) break;
  }
  if (!requirements.length) {
    for (const line of lines) {
      if (['经验', '证书', '学历', '能力', '优先', '负责', '要求', '熟悉', '精通'].some(kw => line.includes(kw))) {
        if (line.length > 5 && line.length < 100) requirements.push(line);
      }
      if (requirements.length >= 3) break;
    }
  }
  return requirements.slice(0, 5);
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

function cleanTitle(jobNameField) {
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
  
  if (!candidates.length) return '翻译/本地化岗位';

  // 第一优先：找包含岗位关键词且不是纯形式标签的行
  for (const line of candidates) {
    if (hasJobKeyword(line) && !isPureFormTag(line)) {
      return finalizeTitle(line);
    }
  }
  
  // 第二优先：找包含岗位关键词的行（即使看起来像形式标签）
  for (const line of candidates) {
    if (hasJobKeyword(line)) {
      return finalizeTitle(line);
    }
  }
  
  // 第三优先：找不是纯形式标签的行
  for (const line of candidates) {
    if (!isPureFormTag(line)) {
      return finalizeTitle(line);
    }
  }
  
  // 兜底：取第一行
  return finalizeTitle(candidates[0]);
}

function finalizeTitle(raw) {
  let cleaned = raw.trim();
  
  // 去掉常见前缀
  cleaned = cleaned.replace(/^(岗位|需求|职位|招聘)[:：]\s*/i, '');
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
  
  // 保留完整标题，不做截断（前端根据场景自行控制展示长度）
  
  return cleaned || '翻译/本地化岗位';
}

function processRecord(record, index) {
  const fields = record.fields || {};
  const company = getFieldText(fields, '公司/个人 Company/Individual Name');
  const jobNameField = getFieldArray(fields, '招募岗位名称');
  const title = cleanTitle(jobNameField);
  const descField = getFieldArray(fields, '岗位要求Job Description');
  const channelField = getFieldArray(fields, '希望发布渠道 Where to post your job?');
  const internalOnly = isInternalOnly(channelField);
  // 全渠道发布显示真实公司名，仅内部发布走匿名化
  const finalCompany = internalOnly 
    ? anonymizeCompany(company, getFieldText(fields, '岗位要求Job Description')) 
    : company;
  const formField = getFieldArray(fields, '岗位形式（兼职/外包/全职/线上/线下）Recruitment Positions (Part-time/Outsourced/Full-time/Remote/On-site)');
  const jobType = extractType(title, formField);
  const location = extractLocation(title, getFieldText(fields, '其他补充说明 Other comments'), formField);
  const salary = extractSalary(getFieldArray(fields, '薪资区间（请标注按原文/译文千字/时薪/天/月等）Salary Bands (per word count/hour/day/month/project etc.)'));
  const languagePair = extractLanguagePair(getFieldText(fields, '岗位要求Job Description'));
  const description = extractDescription(descField);
  const fullDescription = getFieldText(fields, '岗位要求Job Description');
  const requirements = extractRequirements(descField);
  const deadline = getFieldText(fields, '截止日期 End Date');
  const comments = getFieldText(fields, '其他补充说明 Other comments');
  const submitTime = fields['提交时间'];
  const postedAt = submitTime ? new Date(submitTime).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

  const job = {
    id: String(record.record_id || index + 1),
    title,
    company: finalCompany,
    type: jobType,
    location,
    salary,
    languagePair,
    gameType: null,
    description,
    fullDescription,
    requirements,
    deadline,
    comments,
    postedAt,
    internalOnly: false,
  };

  if (internalOnly) {
    const descTexts = descField.map(d => typeof d === 'string' ? d : d?.text || '').join(' ').toLowerCase();
    return {
      ...job,
      title: descTexts.includes('游戏') || descTexts.includes('lqa') || descTexts.includes('localization') ? '游戏本地化岗位' : '翻译/本地化岗位',
      company: '社群内部需求',
      description: descTexts.includes('游戏') ? '游戏本地化相关岗位，适合有游戏翻译经验的译者。' : '翻译/本地化相关岗位，具体要求请联系社群管理员了解。',
      requirements: [],
      location: job.location.includes('远程') ? '远程' : '主要城市',
      salary: job.salary && !job.salary.includes('面议') && /\d{4,}/.test(job.salary) ? '具有竞争力的薪资' : job.salary,
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
