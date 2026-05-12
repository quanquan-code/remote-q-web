/**
 * 处理飞书帮招数据，匿名化后生成 jobs.json
 * 
 * 使用方法：
 * 1. 从飞书导出原始数据到 src/data/jobs-raw.json
 * 2. 运行 node scripts/process-jobs.js
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const RAW_FILE = path.join(PROJECT_ROOT, 'src', 'data', 'jobs-raw.json');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src', 'data', 'jobs.json');

/**
 * 匿名化公司名
 */
function anonymizeCompany(company, jobDesc = '') {
  const c = (company || '').toLowerCase();
  const d = (jobDesc || '').toLowerCase();
  
  // 知名游戏公司
  if (c.includes('网易')) return '知名游戏大厂（杭州）';
  if (c.includes('腾讯')) return '头部互联网公司';
  if (c.includes('米哈游')) return '二次元游戏头部公司';
  if (c.includes('莉莉丝')) return '头部游戏出海公司';
  if (c.includes('库洛')) return '新兴游戏公司（广州）';
  if (c.includes('悠星')) return '二次元游戏发行公司（上海）';
  if (c.includes('金山')) return '老牌游戏公司（珠海）';
  if (c.includes('叠纸')) return '女性向游戏头部公司（上海）';
  if (c.includes('祖龙')) return '知名游戏研发公司';
  if (c.includes('布鲁可')) return '文创科技公司（上海）';
  if (c.includes('心语')) return '游戏本地化服务商';
  if (c.includes('火星语盟')) return '专业翻译公司（深圳）';
  if (c.includes('创凌') || c.includes('linguitronics')) return '知名本地化公司（上海）';
  if (c.includes('舜禹') || c.includes('transphere')) return '大型翻译公司（江苏）';
  if (c.includes('诺谦') || c.includes('uni-spect')) return '游戏本地化服务商（厦门）';
  if (c.includes('onesky')) return '全球化本地化平台';
  if (c.includes('lcplocalizations')) return '海外本地化公司';
  if (c.includes('langlink')) return '专业本地化公司';
  if (c.includes('ea')) return '国际知名游戏公司（上海）';
  if (c.includes('叮咚')) return '教育机构（上海）';
  if (c.includes('阅友')) return '网文出海公司（北京）';
  if (c.includes('天屹')) return '数字科技公司（杭州）';
  if (c.includes('行星波') || c.includes('xieyezhai')) return '文化传播公司（广州）';
  if (c.includes('速魔')) return '科技公司（深圳）';
  if (c.includes('稻谷娱加')) return '短剧出海公司（汕头）';
  if (c.includes('亮语')) return '翻译公司（沈阳）';
  if (c.includes('职未')) return '咨询公司（上海）';
  if (c.includes('译树') || c.includes('interpretree')) return '翻译公司（长沙）';
  if (c.includes('中电金信')) return '大型IT服务公司';
  if (c.includes('外经实业')) return '建设工程公司（河南）';
  if (c.includes('智程')) return '咨询公司（上海）';
  if (c.includes('美国石油') || c.includes('天然气')) return '国际行业协会';
  
  // 个人/团队
  if (c.includes('个人') || c === '个人翻译需求' || c === '个人成立的本地化团队') {
    if (d.includes('游戏')) return '优质游戏客户';
    if (d.includes('口译')) return '优质口译客户';
    if (d.includes('翻译')) return '优质翻译客户';
    return '优质客户';
  }
  
  // 邱天烨团队
  if (c.includes('邱天烨') || c.includes('meowcalization')) {
    return '专业本地化工作室';
  }
  
  // 默认：根据描述推断
  if (d.includes('游戏') || d.includes('lqa') || d.includes('本地化')) {
    return '某游戏公司';
  }
  if (d.includes('口译')) return '某口译需求方';
  if (d.includes('翻译')) return '某翻译需求方';
  if (d.includes('教育') || d.includes('老师')) return '某教育机构';
  if (d.includes('科技') || d.includes('互联网')) return '某科技公司';
  
  return '某优质企业';
}

/**
 * 提取岗位形式
 */
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
    // 默认推断
    if (text.includes('翻译') || text.includes('lqa')) types.push('兼职', '线上');
    else types.push('兼职');
  }
  
  return [...new Set(types)];
}

/**
 * 提取工作地点
 */
function extractLocation(jobName, comments) {
  const text = `${jobName || ''} ${comments || ''}`;
  const locations = [];
  
  if (text.includes('上海')) locations.push('上海');
  if (text.includes('北京')) locations.push('北京');
  if (text.includes('广州')) locations.push('广州');
  if (text.includes('深圳')) locations.push('深圳');
  if (text.includes('杭州')) locations.push('杭州');
  if (text.includes('成都')) locations.push('成都');
  if (text.includes('苏州')) locations.push('苏州');
  if (text.includes('珠海')) locations.push('珠海');
  if (text.includes('长沙')) locations.push('长沙');
  if (text.includes('厦门')) locations.push('厦门');
  if (text.includes('东京')) locations.push('东京');
  if (text.includes('远程') || text.includes('线上') || text.includes('线上兼职')) locations.push('远程');
  
  if (locations.length === 0) {
    if (text.includes('线下') || text.includes('坐班')) return '线下（具体待定）';
    return '远程';
  }
  
  return locations.join('/') || '远程';
}

/**
 * 提取语言对
 */
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

/**
 * 提取薪资
 */
function extractSalary(salaryField) {
  if (!salaryField || salaryField.length === 0) return '薪资面议';
  
  const texts = salaryField.map(s => {
    if (typeof s === 'string') return s;
    if (s && s.text) return s.text;
    return '';
  }).filter(Boolean);
  
  if (texts.length === 0) return '薪资面议';
  
  // 提取第一个非空值
  let salary = texts[0];
  
  // 清理并格式化
  salary = salary.replace(/^\s+/, '').replace(/\s+$/, '');
  
  if (salary.includes('私聊') || salary.includes('面议') || salary.includes('详谈')) {
    return '薪资面议';
  }
  
  return salary;
}

/**
 * 提取岗位要求摘要（前3-5条）
 */
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
    // 匹配常见的岗位要求开头
    if (l.match(/^(\d+[.、]|[-•·*]|【要求】|【任职要求】|Requirements|Qualifications)/i)) {
      const clean = l.replace(/^(\d+[.、]|[-•·*]|\s)+/, '').trim();
      if (clean && clean.length > 5 && clean.length < 100) {
        requirements.push(clean);
      }
    }
    if (requirements.length >= 5) break;
  }
  
  // 如果没有提取到，尝试其他模式
  if (requirements.length === 0) {
    for (const line of lines) {
      const l = line.trim();
      if (l.includes('经验') || l.includes('证书') || l.includes('学历') || 
          l.includes('能力') || l.includes('优先') || l.includes('负责') ||
          l.includes('要求') || l.includes('熟悉') || l.includes('精通')) {
        if (l.length > 5 && l.length < 100) {
          requirements.push(l);
        }
      }
      if (requirements.length >= 3) break;
    }
  }
  
  return requirements.slice(0, 5);
}

/**
 * 提取发布渠道
 */
function extractPostChannel(channelField) {
  if (!channelField || channelField.length === 0) return '社群内部';
  
  const texts = channelField.map(c => {
    if (typeof c === 'string') return c;
    if (c && c.text) return c.text;
    return '';
  }).filter(Boolean);
  
  return texts.join(' ') || '社群内部';
}

/**
 * 判断是否仅社群内部招募
 */
function isInternalOnly(channelField) {
  const channel = extractPostChannel(channelField).toLowerCase();
  return channel.includes('社群内部') || channel.includes('internal community');
}

/**
 * 对仅社群内部的岗位进行重度匿名化
 * 标题泛化、描述极简、去除所有可识别特征
 */
function heavyAnonymize(job, descField) {
  const desc = ((descField || []).map(d => d.text || d).join(' ')).toLowerCase();
  
  // 泛化标题
  let genericTitle = '翻译/本地化岗位';
  if (desc.includes('游戏') || desc.includes('lqa') || desc.includes('localization')) {
    genericTitle = '游戏本地化岗位';
  } else if (desc.includes('口译') || desc.includes('interpreter')) {
    genericTitle = '口译岗位';
  } else if (desc.includes('笔译') || desc.includes('翻译')) {
    genericTitle = '笔译岗位';
  }
  
  // 泛化公司
  let genericCompany = '某优质客户';
  
  // 泛化描述（仅保留一句话，不含任何项目细节）
  let genericDesc = '翻译/本地化相关岗位，具体要求请联系社群管理员了解。';
  if (desc.includes('游戏')) {
    genericDesc = '游戏本地化相关岗位，适合有游戏翻译经验的译者。';
  }
  
  // 薪资泛化（去掉具体数字，只留范围感）
  let genericSalary = job.salary;
  if (job.salary && !job.salary.includes('面议')) {
    // 将具体薪资替换为模糊表述
    if (job.salary.match(/\d{4,}/)) {
      genericSalary = '具有竞争力的薪资';
    }
  }
  
  return {
    ...job,
    title: genericTitle,
    company: genericCompany,
    description: genericDesc,
    requirements: [], // 内部岗位不在公网展示要求细节
    location: job.location.includes('远程') ? '远程' : '主要城市', // 模糊地点
    salary: genericSalary,
    isInternalOnly: true // 标记，前端可加特殊样式
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
  
  // 取前150字作为摘要
  if (fullText.length <= 150) return fullText;
  return fullText.substring(0, 150) + '...';
}

/**
 * 提取岗位名称
 */
function extractJobName(jobNameField) {
  if (!jobNameField || jobNameField.length === 0) return '翻译/本地化岗位';
  
  const texts = jobNameField.map(n => {
    if (typeof n === 'string') return n;
    if (n && n.text) return n.text;
    return '';
  }).filter(Boolean);
  
  // 取第一个有意义的文本
  for (const text of texts) {
    const t = text.trim();
    if (t && t.length > 2 && !t.match(/^(线上|线下|全职|兼职|外包|远程)$/)) {
      return t.substring(0, 50);
    }
  }
  
  return '翻译/本地化岗位';
}

/**
 * 主处理函数
 */
function processJobs() {
  console.log('🚀 开始处理帮招数据...\n');
  
  try {
    // 读取原始数据
    if (!fs.existsSync(RAW_FILE)) {
      console.log('❌ 未找到原始数据文件：', RAW_FILE);
      console.log('💡 请先将飞书数据保存到 src/data/jobs-raw.json');
      process.exit(1);
    }
    
    const rawData = JSON.parse(fs.readFileSync(RAW_FILE, 'utf-8'));
    
    if (!Array.isArray(rawData)) {
      console.log('❌ 数据格式错误，应为数组');
      process.exit(1);
    }
    
    console.log(`📊 共读取 ${rawData.length} 条原始数据\n`);
    
    // 处理数据
    const processedJobs = rawData.map((record, index) => {
      const fields = record.fields || {};
      
      // 提取公司名
      const companyField = fields['公司/个人 Company/Individual Name'];
      let company = '';
      if (Array.isArray(companyField)) {
        const first = companyField[0];
        if (first && first.text) company = first.text;
        else if (typeof first === 'string') company = first;
      }
      
      // 提取岗位名称
      const jobNameField = fields['招募岗位名称'];
      const title = extractJobName(jobNameField);
      
      // 提取岗位描述
      const descField = fields['岗位要求Job Description'];
      
      // 检查是否仅社群内部招募
      const channelField = fields['希望发布渠道 Where to post your job?'];
      const internalOnly = isInternalOnly(channelField);
      
      // 匿名化公司名
      let anonymizedCompany = anonymizeCompany(company, descField);
      
      // 提取其他字段
      const formField = fields['岗位形式（兼职/外包/全职/线上/线下）Recruitment Positions (Part-time/Outsourced/Full-time/Remote/On-site)'];
      let type = extractType(title, formField);
      let location = extractLocation(title, fields['其他补充说明 Other comments']);
      let salary = extractSalary(fields['薪资区间（请标注按原文/译文千字/时薪/天/月等）Salary Bands (per word count/hour/day/month/project etc.)']);
      const languagePair = extractLanguagePair(descField);
      let description = extractDescription(descField);
      let requirements = extractRequirements(descField);
      
      // 提交时间
      const submitTime = fields['提交时间'];
      const postedAt = submitTime 
        ? new Date(submitTime).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      let job = {
        id: String(fields['编号'] || index + 1),
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
        internalOnly: false
      };
      
      // 对仅社群内部的岗位进行重度匿名化
      if (internalOnly) {
        job = heavyAnonymize(job, descField);
      }
      
      return job;
    });
    
    // 按时间倒序排列
    processedJobs.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
    
    // 写入输出文件
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(processedJobs, null, 2), 'utf-8');
    
    console.log('✅ 处理完成！\n');
    console.log(`📊 共处理 ${processedJobs.length} 条岗位`);
    
    const internalCount = processedJobs.filter(j => j.internalOnly).length;
    const publicCount = processedJobs.length - internalCount;
    console.log(`   ├─ 公开展示：${publicCount} 条`);
    console.log(`   └─ 社群专享（重度匿名）：${internalCount} 条`);
    
    console.log(`\n💾 输出文件：${OUTPUT_FILE}`);
    console.log('\n📋 岗位分布：');
    
    const typeCount = {};
    processedJobs.forEach(job => {
      job.type.forEach(t => {
        typeCount[t] = (typeCount[t] || 0) + 1;
      });
    });
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}个`);
    });
    
    console.log('\n💡 下一步：');
    console.log('   1. 构建项目：npm run build');
    console.log('   2. 部署到 Vercel');
    
  } catch (error) {
    console.error('\n❌ 处理失败：', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

processJobs();
