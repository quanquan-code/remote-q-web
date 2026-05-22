import fs from 'fs';
import path from 'path';

const OUTPUT_PATH = path.resolve(process.cwd(), 'src/data/showcase.json');

function extractText(arr) {
  if (!Array.isArray(arr)) return '';
  return arr.map(item => {
    if (typeof item === 'string') return item;
    if (item && item.text) return item.text;
    return '';
  }).join('').trim();
}

function joinText(arr) {
  if (!Array.isArray(arr)) return '';
  return arr.map(item => {
    if (typeof item === 'string') return item;
    if (item && item.text) return item.text;
    return '';
  }).join('\n').trim();
}

function isInternalOnly(channels) {
  if (!Array.isArray(channels) || channels.length === 0) return true;
  const internalKeywords = [
    '社群内部',
    'Our internal community',
    'internal community'
  ];
  const publicKeywords = [
    '公众号',
    '小红书',
    '朋友圈',
    '以上全部渠道',
    'all the channels',
    'Wechat Official Account',
    'Rednote',
    'Wechat moments'
  ];
  const hasPublic = channels.some(c => 
    publicKeywords.some(pk => c.includes(pk))
  );
  if (hasPublic) return false;
  const hasInternal = channels.some(c => 
    internalKeywords.some(ik => c.includes(ik))
  );
  return hasInternal;
}

function getJobType(positions) {
  if (!Array.isArray(positions) || positions.length === 0) return '兼职';
  const typeMap = {
    '全职（正职）': '全职',
    '全职（外包）': '全职',
    '兼职（可注明期限）': '兼职',
    '兼职': '兼职',
    '外包': '外包',
    '线上': '线上',
    '线下（请补充地点）': '线下'
  };
  const types = positions.map(p => typeMap[p] || p).filter(Boolean);
  return [...new Set(types)].join(' / ') || '兼职';
}

function inferDomain(description, title) {
  const text = (description + ' ' + title).toLowerCase();
  if (text.includes('游戏') || text.includes('本地化') || text.includes('lqa') || text.includes('翻译')) return '游戏/本地化';
  if (text.includes('口译') || text.includes('交传') || text.includes('同传') || text.includes('陪同')) return '口译';
  if (text.includes('医学') || text.includes('医药') || text.includes('医疗器械')) return '医学';
  if (text.includes('金融') || text.includes('财报') || text.includes('基金')) return '金融';
  if (text.includes('法律') || text.includes('合同')) return '法律';
  if (text.includes('教育') || text.includes('gre') || text.includes('雅思') || text.includes('托福')) return '教育';
  if (text.includes('ai') || text.includes('数据') || text.includes('计算机')) return 'AI/科技';
  if (text.includes('汽车') || text.includes('车载')) return '汽车';
  if (text.includes('电商') || text.includes('供应链') || text.includes('seo')) return '电商/营销';
  return '翻译/本地化';
}

function inferLanguage(description, title) {
  const text = (description + ' ' + title).toLowerCase();
  const langs = [];
  if (text.includes('英') || text.includes('english') || text.includes('en>')) langs.push('英语');
  if (text.includes('日') || text.includes('japanese') || text.includes('jp') || text.includes('日→')) langs.push('日语');
  if (text.includes('韩') || text.includes('korean') || text.includes('kr')) langs.push('韩语');
  if (text.includes('德') || text.includes('german')) langs.push('德语');
  if (text.includes('法') || text.includes('french')) langs.push('法语');
  if (text.includes('西') || text.includes('spanish')) langs.push('西班牙语');
  if (text.includes('葡') || text.includes('portuguese')) langs.push('葡萄牙语');
  if (text.includes('俄') || text.includes('russian')) langs.push('俄语');
  if (text.includes('泰') || text.includes('thai')) langs.push('泰语');
  if (text.includes('阿') || text.includes('arabic')) langs.push('阿拉伯语');
  if (text.includes('意') || text.includes('italian')) langs.push('意大利语');
  if (text.includes('波兰') || text.includes('polish')) langs.push('波兰语');
  if (text.includes('土耳其') || text.includes('turkish')) langs.push('土耳其语');
  if (text.includes('越南') || text.includes('vietnamese')) langs.push('越南语');
  if (text.includes('印尼') || text.includes('indonesian')) langs.push('印尼语');
  if (text.includes('马来') || text.includes('malay')) langs.push('马来语');
  if (text.includes('繁中') || text.includes('traditional chinese')) langs.push('繁中');
  if (text.includes('中译') || text.includes('英译中') || text.includes('中翻')) langs.push('中英');
  if (langs.length === 0) return '多语种';
  return [...new Set(langs)].join(' / ');
}

async function generateShowcase() {
  // Try to fetch from Feishu API first
  const token = process.env.FEISHU_PERSONAL_ACCESS_TOKEN;
  let records = [];
  
  if (token) {
    try {
      const baseUrl = 'https://open.feishu.cn/open-apis/bitable/v1/apps/YRafbYwZdamWrbs3Tf1cfzCjngh/tables/tblwTldArcyMpOOP/records';
      let pageToken = '';
      let hasMore = true;
      while (hasMore) {
        const url = pageToken ? `${baseUrl}?page_size=500&page_token=${pageToken}` : `${baseUrl}?page_size=500`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        if (data.data && data.data.items) {
          records = records.concat(data.data.items);
          hasMore = data.data.has_more;
          pageToken = data.data.page_token;
        } else {
          hasMore = false;
        }
      }
      console.log(`Fetched ${records.length} records from Feishu API`);
    } catch (e) {
      console.warn('Failed to fetch from API, trying cache:', e.message);
    }
  }
  
  // Fallback: read from cache
  if (records.length === 0) {
    const cachePath = path.resolve(process.cwd(), 'scripts/showcase-cache.json');
    if (fs.existsSync(cachePath)) {
      records = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      console.log(`Loaded ${records.length} records from cache`);
    } else {
      console.error('No cache found. Please run with FEISHU_PERSONAL_ACCESS_TOKEN or provide a cache file.');
      process.exit(1);
    }
  }
  
  const showcase = [];
  
  for (const record of records) {
    const fields = record.fields || {};
    const channels = fields['希望发布渠道 Where to post your job?'] || [];
    const comments = extractText(fields['其他补充说明 Other comments']);
    
    // Anonymization logic
    const internalOnly = isInternalOnly(channels);
    const explicitlyAnonymous = comments.toLowerCase().includes('匿名');
    const shouldAnonymize = internalOnly || explicitlyAnonymous;
    
    let companyName = extractText(fields['公司/个人 Company/Individual Name']);
    if (shouldAnonymize || !companyName || companyName === '个人' || companyName === '公司') {
      companyName = '匿名客户';
    }
    
    const title = joinText(fields['招募岗位名称']);
    const description = joinText(fields['岗位要求Job Description']);
    const salary = joinText(fields['薪资区间（请标注按原文/译文千字/时薪/天/月等）Salary Bands (per word count/hour/day/month/project etc.)']);
    const deadline = extractText(fields['截止日期 End Date']);
    const paymentCycle = extractText(fields['结算周期​​Payment Cycle']);
    const jobType = getJobType(fields['岗位形式（兼职/外包/全职/线上/线下）Recruitment Positions (Part-time/Outsourced/Full-time/Remote/On-site)']);
    
    showcase.push({
      id: record.record_id,
      company: companyName,
      title: title || '翻译/本地化岗位',
      type: jobType,
      description: description,
      salary: salary,
      deadline: deadline || '长期有效',
      paymentCycle: paymentCycle,
      domain: inferDomain(description, title),
      language: inferLanguage(description, title),
      isAnonymous: shouldAnonymize,
      channels: channels,
      // No contact info exposed
    });
  }
  
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(showcase, null, 2), 'utf8');
  console.log(`Generated ${showcase.length} showcase entries`);
  console.log(`Anonymous: ${showcase.filter(s => s.isAnonymous).length}`);
  console.log(`Named: ${showcase.filter(s => !s.isAnonymous).length}`);
}

generateShowcase().catch(console.error);
