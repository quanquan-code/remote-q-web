#!/usr/bin/env node
/**
 * GitHub Actions 自动同步脚本
 * 从飞书多维表格拉取帮招数据，匿名化后生成 jobs.json
 * 
 * 环境变量（必需）：
 * FEISHU_PERSONAL_ACCESS_TOKEN - 飞书 personal_access_token
 * FEISHU_APP_TOKEN - 多维表格 app_token
 * FEISHU_TABLE_ID - 数据表 ID
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 配置
const CONFIG = {
  appToken: process.env.FEISHU_APP_TOKEN || 'YRafbYwZdamWrbs3Tf1cfzCjngh',
  tableId: process.env.FEISHU_TABLE_ID || 'tblwTldArcyMpOOP',
  outputFile: path.join(PROJECT_ROOT, 'src', 'data', 'jobs.json'),
};

const FEISHU_TOKEN = process.env.FEISHU_PERSONAL_ACCESS_TOKEN;

if (!FEISHU_TOKEN) {
  console.error('❌ 缺少环境变量 FEISHU_PERSONAL_ACCESS_TOKEN');
  console.error('   请在 GitHub Repo → Settings → Secrets → Actions 中添加');
  process.exit(1);
}

/**
 * 调用飞书 API
 */
async function feishuApi(endpoint, options = {}) {
  const url = `https://open.feishu.cn/open-apis${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${FEISHU_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`飞书 API 错误 ${res.status}: ${text}`);
  }
  
  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`飞书业务错误 ${data.code}: ${data.msg}`);
  }
  
  return data.data;
}

/**
 * 拉取多维表格全部记录
 */
async function fetchAllRecords() {
  console.log('📡 从飞书多维表格拉取数据...');
  
  const allRecords = [];
  let hasMore = true;
  let pageToken = null;
  
  while (hasMore) {
    const params = new URLSearchParams({
      page_size: '500',
    });
    if (pageToken) params.set('page_token', pageToken);
    
    const data = await feishuApi(
      `/bitable/v1/apps/${CONFIG.appToken}/tables/${CONFIG.tableId}/records?${params}`
    );
    
    allRecords.push(...(data.items || []));
    hasMore = data.has_more;
    pageToken = data.page_token;
    
    console.log(`   已拉取 ${allRecords.length} 条记录...`);
  }
  
  console.log(`✅ 共拉取 ${allRecords.length} 条记录`);
  return allRecords;
}

// ========== 匿名化逻辑（复用 process-jobs.js）==========

function anonymizeCompany(company, jobDesc = '') {
  const c = (company || '').toLowerCase();
  const d = (jobDesc || '').toLowerCase();
  
  const knownMap = [
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
  
  for (const [keyword, alias] of knownMap) {
    if (c.includes(keyword)) return alias;
  }
  
  if (c.includes('个人') || c === '个人翻译需求' || c === '个人成立的本地化团队') {
    if (d.includes('游戏')) return '优质游戏客户';
    if (d.includes('口译')) return '优质口译客户';
    if (d.includes('翻译')) return '优质翻译客户';
    return '优质客户';
  }
  
  if (c.includes('邱天烨') || c.includes('meowcalization')) {
    return '专业本地化工作室';
  }
  
  if (d.includes('游戏') || d.includes('lqa') || d.includes('本地化')) return '某游戏公司';
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
  const locations = [];
  
  const cityMap = ['上海', '北京', '广州', '深圳', '杭州', '成都', '苏州', '珠海', '长沙', '厦门', '汕头', '南京', '武汉', '郑州', '东京'];
  for (const city of cityMap) {
    if (text.includes(city)) locations.push(city);
  }
  if (text.includes('远程') || text.includes('线上') || text.includes('线上兼职')) locations.push('远程');
  
  if (locations.length === 0) {
    if (text.includes('线下') || text.includes('坐班')) return '线下（具体待定）';
    return '远程';
  }
  
  return locations.join('/') || '远程';
}

function extractLanguagePair(description) {
  const d = (description || '').toLowerCase();
  const pairs = [];
  
  if (d.includes('中') && d.includes('英')) pairs.push('中↔英');
  if (d.includes('中') && d.includes('日')) pairs.push('中↔日');
  if (d.includes('中') && d.includes('韩')) pairs.push('中↔韩');
  if (d.includes('英') && d.includes('日')) pairs.push('英↔日');
  if (d.includes('英') && d.includes('韩')) pairs.push('英↔韩');
  if (d.includes('日') && d.includes('英')) pairs.push('日→英');
  if (d.includes('韩') && d.includes('英')) pairs.push('韩→英');
  if (d.includes('中') && d.includes('俄')) pairs.push('中↔俄');
  if (d.includes('中') && d.includes('法')) pairs.push('中↔法');
  if (d.includes('中') && d.includes('德')) pairs.push('中↔德');
  if (d.includes('中') && d.includes('西')) pairs.push('中↔西');
  if (d.includes('中') && d.includes('葡')) pairs.push('中↔葡');
  if (d.includes('英') && d.includes('韩') && d.includes('听')) pairs.push('英韩听译');
  
  return pairs[0] || null;
}

function extractSalary(salaryField) {
  if (!salaryField || salaryField.length === 0) return '薪资面议';
  
  const texts = salaryField.map(s => {
    if (typeof s === 'string') return s;
    if (s && s.text) return s.text;
    return '';
  }).filter(Boolean);
  
  if (texts.length === 0) return '薪资面议';
  
  let salary = texts[0].replace(/^\s+/, '').replace(/\s+$/, '');
  if (salary.includes('私聊') || salary.includes('面议') || salary.includes('详谈')) return '薪资面议';
  
  return salary;
}

function extractRequirements(description) {
  if (!description || description.length === 0) return [];
  
  const texts = description.map(d => {
    if (typeof d === 'string') return d;
    if (d && d.text) return d.text;
    return '';
  }).filter(Boolean);
  
  const fullText = texts.join('\n');
  const lines = fullText.split(/\n/).filter(l => l.trim());
  const requirements = [];
  
  for (const line of lines) {
    const l = line.trim();
    if (l.match(/^(\d+[.、]|[-•·*]|【要求】|【任职要求】|Requirements|Qualifications)/i)) {
      const clean = l.replace(/^(\d+[.、]|[-•·*]|\s)+/, '').trim();
      if (clean && clean.length > 5 && clean.length < 100) requirements.push(clean);
    }
    if (requirements.length >= 5) break;
  }
  
  if (requirements.length === 0) {
    for (const line of lines) {
      const l = line.trim();
      if (l.includes('经验') || l.includes('证书') || l.includes('学历') || 
          l.includes('能力') || l.includes('优先') || l.includes('负责') ||
          l.includes('要求') || l.includes('熟悉') || l.includes('精通')) {
        if (l.length > 5 && l.length < 100) requirements.push(l);
      }
      if (requirements.length >= 3) break;
    }
  }
  
  return requirements.slice(0, 5);
}

function extractPostChannel(channelField) {
  if (!channelField || channelField.length === 0) return '社群内部';
  
  const texts = channelField.map(c => {
    if (typeof c === 'string') return c;
    if (c && c.text) return c.text;
    return '';
  }).filter(Boolean);
  
  return texts.join(' ') || '社群内部';
}

function isInternalOnly(channelField) {
  const channel = extractPostChannel(channelField).toLowerCase();
  return channel.includes('社群内部') || channel.includes('internal community');
}

function heavyAnonymize(job, descField) {
  const desc = ((descField || []).map(d => d.text || d).join(' ')).toLowerCase();
  
  let genericTitle = '翻译/本地化岗位';
  if (desc.includes('游戏') || desc.includes('lqa') || desc.includes('localization')) genericTitle = '游戏本地化岗位';
  else if (desc.includes('口译') || desc.includes('interpreter')) genericTitle = '口译岗位';
  else if (desc.includes('笔译') || desc.includes('翻译')) genericTitle = '笔译岗位';
  
  let genericSalary = job.salary;
  if (job.salary && !job.salary.includes('面议') && job.salary.match(/\d{4,}/)) {
    genericSalary = '具有竞争力的薪资';
  }
  
  return {
    ...job,
    title: genericTitle,
    company: '某优质客户',
    description: desc.includes('游戏') 
      ? '游戏本地化相关岗位，适合有游戏翻译经验的译者。'
      : '翻译/本地化相关岗位，具体要求请联系社群管理员了解。',
    requirements: [],
    location: job.location.includes('远程') ? '远程' : '主要城市',
    salary: genericSalary,
    isInternalOnly: true,
  };
}

function extractDescription(description) {
  if (!description || description.length === 0) return '';
  
  const texts = description.map(d => {
    if (typeof d === 'string') return d;
    if (d && d.text) return d.text;
    return '';
  }).filter(Boolean);
  
  const fullText = texts.join(' ').replace(/\s+/g, ' ').trim();
  if (fullText.length <= 150) return fullText;
  return fullText.substring(0, 150) + '...';
}

function extractJobName(jobNameField) {
  if (!jobNameField || jobNameField.length === 0) return '翻译/本地化岗位';
  
  const texts = jobNameField.map(n => {
    if (typeof n === 'string') return n;
    if (n && n.text) return n.text;
    return '';
  }).filter(Boolean);
  
  for (const text of texts) {
    const t = text.trim();
    if (t && t.length > 2 && !t.match(/^(线上|线下|全职|兼职|外包|远程)$/)) {
      return t.substring(0, 50);
    }
  }
  
  return '翻译/本地化岗位';
}

function getFieldText(fields, fieldName) {
  const val = fields[fieldName];
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    return val.map(v => {
      if (typeof v === 'string') return v;
      if (v && v.text) return v.text;
      return '';
    }).join(' ');
  }
  return String(val);
}

function getFieldArray(fields, fieldName) {
  const val = fields[fieldName];
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

function processRecord(record, index) {
  const fields = record.fields || {};
  
  const company = getFieldText(fields, '公司/个人 Company/Individual Name');
  const jobNameField = getFieldArray(fields, '招募岗位名称');
  const title = extractJobName(jobNameField);
  const descField = getFieldArray(fields, '岗位要求Job Description');
  const channelField = getFieldArray(fields, '希望发布渠道 Where to post your job?');
  const internalOnly = isInternalOnly(channelField);
  
  const anonymizedCompany = anonymizeCompany(company, getFieldText(fields, '岗位要求Job Description'));
  
  const formField = getFieldArray(fields, '岗位形式（兼职/外包/全职/线上/线下）Recruitment Positions (Part-time/Outsourced/Full-time/Remote/On-site)');
  const type = extractType(title, formField);
  const location = extractLocation(title, getFieldText(fields, '其他补充说明 Other comments'));
  const salary = extractSalary(getFieldArray(fields, '薪资区间（请标注按原文/译文千字/时薪/天/月等）Salary Bands (per word count/hour/day/month/project etc.)'));
  const languagePair = extractLanguagePair(getFieldText(fields, '岗位要求Job Description'));
  const description = extractDescription(getFieldArray(fields, '岗位要求Job Description'));
  const requirements = extractRequirements(getFieldArray(fields, '岗位要求Job Description'));
  
  const submitTime = fields['提交时间'];
  const postedAt = submitTime 
    ? new Date(submitTime).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];
  
  let job = {
    id: String(record.record_id || index + 1),
    title,
    company: anonymizedCompany,
    type,
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
    job = heavyAnonymize(job, getFieldArray(fields, '岗位要求Job Description'));
  }
  
  return job;
}

// ========== 主流程 ==========

async function main() {
  console.log('🚀 帮招数据自动同步开始...\n');
  
  try {
    // 1. 拉取飞书数据
    const records = await fetchAllRecords();
    
    if (records.length === 0) {
      console.log('⚠️  飞书表格暂无记录，跳过处理');
      process.exit(0);
    }
    
    // 2. 处理数据
    console.log('\n🔒 开始匿名化处理...');
    const jobs = records.map((record, i) => processRecord(record, i));
    
    // 按时间倒序
    jobs.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
    
    // 3. 写入文件
    const outputDir = path.dirname(CONFIG.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(jobs, null, 2), 'utf-8');
    
    // 4. 统计输出
    const internalCount = jobs.filter(j => j.internalOnly).length;
    const publicCount = jobs.length - internalCount;
    
    console.log('\n✅ 同步完成！');
    console.log(`📊 共处理 ${jobs.length} 条岗位`);
    console.log(`   ├─ 公开展示：${publicCount} 条`);
    console.log(`   └─ 社群专享（重度匿名）：${internalCount} 条`);
    console.log(`\n💾 输出：${CONFIG.outputFile}`);
    
    // 5. 类型分布
    const typeCount = {};
    jobs.forEach(job => {
      job.type.forEach(t => {
        typeCount[t] = (typeCount[t] || 0) + 1;
      });
    });
    console.log('\n📋 岗位类型分布：');
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}个`);
    });
    
  } catch (error) {
    console.error('\n❌ 同步失败：', error.message);
    if (error.message.includes('unauthorized') || error.message.includes('invalid')) {
      console.error('\n💡 提示：请检查 FEISHU_PERSONAL_ACCESS_TOKEN 是否有效');
    }
    process.exit(1);
  }
}

main();
