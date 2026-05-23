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
  return '某优质企业';
}

function extractType(jobName, formField) {
  const types = [];
  const text = `${jobName || ''} ${JSON.stringify(formField || [])}`.toLowerCase();
  if (text.includes('全职') || text.includes('正编')) types.push('全职');
  if (text.includes('兼职') || text.includes('part-time')) types.push('兼职');
  if (text.includes('外包') || text.includes('outsourced') || text.includes('freelance')) types.push('外包');
  if (text.includes('线上') || text.includes('远程') || text.includes('remote')) types.push('线上');
  if (text.includes('线下') || text.includes('坐班') || text.includes('现场') || text.includes('on-site')) types.push('线下');
  if (text.includes('实习生') || text.includes('实习')) types.push('实习');
  if (types.length === 0) {
    if (text.includes('翻译') || text.includes('lqa')) types.push('兼职', '线上');
    else types.push('兼职');
  }
  return [...new Set(types)];
}

function extractLocation(jobName, comments) {
  const text = `${jobName || ''} ${comments || ''}`;
  const cities = ['上海', '北京', '广州', '深圳', '杭州', '成都', '苏州', '珠海', '长沙', '厦门', '汕头', '南京', '武汉', '郑州', '东京'];
  const locations = cities.filter(city => text.includes(city));
  if (text.includes('远程') || text.includes('线上')) locations.push('远程');
  if (locations.length === 0) {
    if (text.includes('线下') || text.includes('坐班')) return '线下（具体待定）';
    return '远程';
  }
  return locations.join('/');
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
  if (!channelField || !channelField.length) return '社群内部';
  return channelField.map(c => typeof c === 'string' ? c : c?.text || '').join(' ').trim() || '社群内部';
}

function isInternalOnly(channelField) {
  const channel = extractPostChannel(channelField).toLowerCase();
  return channel.includes('社群内部') || channel.includes('internal community');
}

function extractDescription(description) {
  if (!description || !description.length) return '';
  const texts = description.map(d => typeof d === 'string' ? d : d?.text || '').filter(Boolean);
  const fullText = texts.join(' ').replace(/\s+/g, ' ').trim();
  if (fullText.length <= 150) return fullText;
  return fullText.slice(0, 150) + '...';
}

function cleanTitle(title) {
  if (!title) return '翻译/本地化岗位';
  
  let cleaned = title.trim();
  
  // 1. 去掉换行符及之后的内容（只保留第一行）
  cleaned = cleaned.split('\n')[0].trim();
  
  // 2. 去掉括号及里面的内容（中文括号和英文括号）
  cleaned = cleaned.replace(/（.*?）/g, '').replace(/\(.*?\)/g, '').trim();
  
  // 3. 去掉常见薪资/地点混入的关键词及之后的内容
  const salaryKeywords = ['k/', '/月', '/小时', '元/', '元/天', '元/千字', '薪资', '月薪', '时薪', '日薪', '元每月', 'k每月'];
  for (const kw of salaryKeywords) {
    const idx = cleaned.toLowerCase().indexOf(kw.toLowerCase());
    if (idx !== -1) {
      cleaned = cleaned.slice(0, idx).trim();
      break;
    }
  }
  
  // 4. 去掉地点混入（常见城市名后跟冒号/括号/横线的情况已在上面处理，这里去掉末尾的冒号/横线）
  cleaned = cleaned.replace(/[：:-]$/, '').trim();
  
  // 5. 截断：中文超过 15 字截断，英文超过 40 字符截断
  const isMostlyChinese = /[\u4e00-\u9fff]/.test(cleaned);
  const maxLen = isMostlyChinese ? 15 : 40;
  if (cleaned.length > maxLen) {
    cleaned = cleaned.slice(0, maxLen) + '...';
  }
  
  return cleaned || '翻译/本地化岗位';
}

function processRecord(record, index) {
  const fields = record.fields || {};
  const company = getFieldText(fields, '公司/个人 Company/Individual Name');
  const jobNameField = getFieldArray(fields, '招募岗位名称');
  const title = cleanTitle(extractJobName(jobNameField));
  const descField = getFieldArray(fields, '岗位要求Job Description');
  const channelField = getFieldArray(fields, '希望发布渠道 Where to post your job?');
  const internalOnly = isInternalOnly(channelField);
  const anonymizedCompany = anonymizeCompany(company, getFieldText(fields, '岗位要求Job Description'));
  const formField = getFieldArray(fields, '岗位形式（兼职/外包/全职/线上/线下）Recruitment Positions (Part-time/Outsourced/Full-time/Remote/On-site)');
  const jobType = extractType(title, formField);
  const location = extractLocation(title, getFieldText(fields, '其他补充说明 Other comments'));
  const salary = extractSalary(getFieldArray(fields, '薪资区间（请标注按原文/译文千字/时薪/天/月等）Salary Bands (per word count/hour/day/month/project etc.)'));
  const languagePair = extractLanguagePair(getFieldText(fields, '岗位要求Job Description'));
  const description = extractDescription(descField);
  const requirements = extractRequirements(descField);
  const submitTime = fields['提交时间'];
  const postedAt = submitTime ? new Date(submitTime).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

  const job = {
    id: String(record.record_id || index + 1),
    title,
    company: anonymizedCompany,
    type: jobType,
    location,
    salary,
    languagePair,
    gameType: null,
    description,
    requirements,
    postedAt,
    internalOnly: false,
  };

  if (internalOnly) {
    const descTexts = descField.map(d => typeof d === 'string' ? d : d?.text || '').join(' ').toLowerCase();
    return {
      ...job,
      title: descTexts.includes('游戏') || descTexts.includes('lqa') || descTexts.includes('localization') ? '游戏本地化岗位' : '翻译/本地化岗位',
      company: '某优质客户',
      description: descTexts.includes('游戏') ? '游戏本地化相关岗位，适合有游戏翻译经验的译者。' : '翻译/本地化相关岗位，具体要求请联系社群管理员了解。',
      requirements: [],
      location: job.location.includes('远程') ? '远程' : '主要城市',
      salary: job.salary && !job.salary.includes('面议') && /\d{4,}/.test(job.salary) ? '具有竞争力的薪资' : job.salary,
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
