#!/usr/bin/env node
/**
 * 帮招数据同步脚本
 * 从飞书多维表格拉取岗位数据，生成匿名化的 JSON 供网站展示
 * 
 * 使用方法：
 * node scripts/sync-jobs.js
 * 
 * 环境变量（可选）：
 * FEISHU_APP_TOKEN - 多维表格的 app_token
 * FEISHU_TABLE_ID - 数据表 ID
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 配置
const CONFIG = {
  outputFile: path.join(PROJECT_ROOT, 'src', 'data', 'jobs.json'),
  // 飞书 API 配置 - 优先从环境变量读取
  appToken: process.env.FEISHU_APP_TOKEN || 'YRafbYwZdamWrbs3Tf1cfzCjngh',
  tableId: process.env.FEISHU_TABLE_ID || 'tblwTldArcyMpOOP',
};

/**
 * 从飞书多维表格拉取数据
 * 注意：此脚本需要配合飞书 API 使用
 * 实际使用时可以通过 feishu_bitable_app_table_record API 获取数据
 */
async function fetchJobsFromFeishu() {
  console.log('📡 从飞书拉取帮招数据...');
  
  // 这里我们通过读取现有的数据文件来模拟
  // 实际使用时，可以通过以下方式调用飞书 API：
  // 1. 使用 OpenClaw 的 feishu_bitable_app_table_record 工具
  // 2. 或者配置飞书自建应用的 access_token 直接调用 API
  
  // 为了演示，我们创建一个示例数据结构
  // 实际使用时，替换为真实的 API 调用
  console.log('⚠️  请手动触发飞书 API 获取数据，或使用以下方式：');
  console.log('   1. 在 OpenClaw 中执行：feishu_bitable_app_table_record list');
  console.log('   2. 将结果保存为 src/data/jobs-raw.json');
  console.log('   3. 运行 node scripts/process-jobs.js');
  
  return [];
}

/**
 * 匿名化岗位数据
 * 隐藏公司名、联系方式等敏感信息
 */
function anonymizeJobs(jobs) {
  return jobs.map(job => {
    const anonymized = { ...job };
    
    // 隐藏公司名，替换为模糊描述
    if (anonymized.company) {
      const company = anonymized.company;
      // 如果是知名公司，保留品牌特征但模糊化
      if (company.includes('网易')) anonymized.company = '知名游戏大厂';
      else if (company.includes('腾讯')) anonymized.company = '头部互联网公司';
      else if (company.includes('米哈游')) anonymized.company = '二次元游戏头部公司';
      else if (company.includes('莉莉丝')) anonymized.company = '头部游戏出海公司';
      else if (company.includes('EA')) anonymized.company = '国际知名游戏公司';
      else if (company.includes('库洛')) anonymized.company = '新兴游戏公司';
      else if (company.includes('悠星')) anonymized.company = '二次元发行公司';
      else if (company.includes('金山')) anonymized.company = '老牌游戏公司';
      else if (company.includes('叠纸')) anonymized.company = '女性向游戏头部公司';
      else if (company.includes('翻译')) anonymized.company = '专业翻译公司';
      else if (company.includes('本地化')) anonymized.company = '本地化服务商';
      else if (company.includes('个人')) anonymized.company = '优质客户';
      else {
        // 其他公司显示为 "某XXX公司"
        const industry = detectIndustry(job);
        anonymized.company = `某${industry}`;
      }
    }
    
    // 移除联系方式
    delete anonymized.contact;
    delete anonymized.contactPerson;
    delete anonymized.email;
    delete anonymized.phone;
    delete anonymized.wechat;
    
    return anonymized;
  });
}

/**
 * 根据岗位内容推断行业
 */
function detectIndustry(job) {
  const desc = (job.description || job.title || '').toLowerCase();
  
  if (desc.includes('游戏') || desc.includes('lqa') || desc.includes('本地化')) {
    return '游戏公司';
  } else if (desc.includes('翻译') || desc.includes('口译') || desc.includes('笔译')) {
    return '翻译需求方';
  } else if (desc.includes('教育') || desc.includes('老师') || desc.includes('教学')) {
    return '教育机构';
  } else if (desc.includes('科技') || desc.includes('互联网')) {
    return '科技公司';
  } else {
    return '优质企业';
  }
}

/**
 * 生成示例数据（用于开发测试）
 */
function generateSampleData() {
  return [
    {
      id: '1',
      title: '中英游戏本地化译员',
      company: '某游戏大厂',
      type: ['兼职', '线上'],
      location: '远程',
      salary: '200-300元/千字',
      languagePair: '中→英',
      gameType: 'RPG',
      description: '负责游戏文本翻译与校对，熟悉游戏术语，有3A游戏经验优先。',
      requirements: [
        '3年以上游戏本地化经验',
        '熟悉CAT工具（Trados/MemoQ）',
        '热爱游戏，了解游戏文化'
      ],
      postedAt: '2026-05-01'
    },
    {
      id: '2',
      title: '日语LQA测试专员',
      company: '二次元游戏头部公司',
      type: ['兼职', '线下'],
      location: '上海',
      salary: '25-40元/小时',
      languagePair: '中→日',
      gameType: '二次元/RPG',
      description: '负责游戏内日语内容的LQA测试，发现并记录本地化问题。',
      requirements: [
        '日语N1，热爱二次元文化',
        '有游戏测试经验优先',
        '细心负责，沟通顺畅'
      ],
      postedAt: '2026-05-05'
    },
    {
      id: '3',
      title: '英韩翻译 + 韩英听译',
      company: '某科技公司',
      type: ['兼职', '线上'],
      location: '远程',
      salary: '90 USD/60分钟',
      languagePair: '英↔韩',
      gameType: null,
      description: '生命科学相关内容的听译与翻译，需按时交付。',
      requirements: [
        '能稳定配合长期项目',
        '2个工作日内交付',
        '生命科学背景优先'
      ],
      postedAt: '2026-05-08'
    }
  ];
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 帮招数据同步开始...\n');
  
  try {
    // 确保输出目录存在
    const outputDir = path.dirname(CONFIG.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 尝试读取原始数据（如果有的话）
    const rawDataPath = path.join(PROJECT_ROOT, 'src', 'data', 'jobs-raw.json');
    let jobs = [];
    
    if (fs.existsSync(rawDataPath)) {
      console.log('📄 发现原始数据文件，正在处理...');
      const rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf-8'));
      jobs = anonymizeJobs(rawData);
    } else {
      console.log('⚠️  未发现原始数据，生成示例数据...');
      jobs = generateSampleData();
    }
    
    // 写入输出文件
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(jobs, null, 2), 'utf-8');
    
    console.log('\n✅ 同步完成！');
    console.log(`📊 共处理 ${jobs.length} 条岗位数据`);
    console.log(`💾 输出文件：${CONFIG.outputFile}`);
    console.log('\n💡 提示：');
    console.log('   1. 如需更新数据，请将飞书数据保存到 src/data/jobs-raw.json');
    console.log('   2. 然后重新运行此脚本');
    console.log('   3. 匿名化规则可在 scripts/sync-jobs.js 中自定义');
    
  } catch (error) {
    console.error('\n❌ 同步失败：', error.message);
    process.exit(1);
  }
}

main();
