import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Globe, Calendar, Building2, Briefcase, MessageCircle, BookOpen } from 'lucide-react';
import rawJobsData from '../data/jobs.json';

// ===== localStorage 覆盖（管理后台写入） =====
const STORAGE_KEY = 'remote_q_admin_overrides';
function getOverrides() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}
function applyOverrides(jobs) {
  const ov = getOverrides();
  return jobs.map(job => {
    const o = ov[job.id];
    if (!o) return job;
    return {
      ...job,
      ...(o.hidden !== undefined && { hidden: o.hidden }),
      ...(o.title !== undefined && { title: o.title }),
      ...(o.company !== undefined && { company: o.company }),
      ...(o.type !== undefined && { type: o.type }),
      ...(o.location !== undefined && { location: o.location }),
      ...(o.salary !== undefined && { salary: o.salary }),
      ...(o.salaryNote !== undefined && { salaryNote: o.salaryNote }),
      ...(o.fullDescription !== undefined && { fullDescription: o.fullDescription }),
      ...(o.requirements !== undefined && { requirements: o.requirements }),
      ...(o.comments !== undefined && { comments: o.comments }),
      ...(o.deadline !== undefined && { deadline: o.deadline }),
      ...(o.status !== undefined && { status: o.status }),
      ...(o.caseStudies !== undefined && { caseStudies: o.caseStudies }),
      ...(o.adminNote !== undefined && { adminNote: o.adminNote }),
    };
  });
}

// 社群案例库（硬编码映射，后续可改从API读取）
// 数据来源：MEMORY.md 外语人就业去哪儿案例库
const caseLibrary = {
  // ===== 公司名精确匹配 =====
  '沐瞳': [
    {
      title: '沐瞳 | 从转行开始进入游戏本地化全攻略',
      author: '冬天吃西瓜 · 社群编号5710',
      url: 'https://mp.weixin.qq.com/s/j2YJeiiy88z5P9Bi5yi-ug',
      summary: '2019年物联网工程毕业→教培愤而离职→B站字幕翻译起步→读圈圈公众号自学→火星测试→22-25年兼职翻译250万字→25年末沐瞳外包招募→投简历做题面试→入职上海'
    }
  ],
  '网易': [
    {
      title: '从网易到米哈游：游戏本地化in-house译员的成长路径',
      author: 'James',
      url: 'https://mp.weixin.qq.com/s/d73WbrQh5tZavEYBgdfAPw',
      summary: '武汉大学口笔译本科→巴斯大学硕士→网易游戏翻译兼本地化（某未公开3A项目）→米哈游in-house口笔译员。CATTI二口二笔（大三）+一口（工作后），从0到1搭建本地化管线。'
    }
  ],
  '米哈游': [
    {
      title: '从网易到米哈游：游戏本地化in-house译员的成长路径',
      author: 'James',
      url: 'https://mp.weixin.qq.com/s/wmuaJXaZu8qsf8ty_gH__Q',
      summary: '武汉大学口笔译本科→巴斯大学硕士→网易游戏翻译兼本地化（某未公开3A项目）→米哈游in-house口笔译员。米哈游一小时现场笔译+创译考核。'
    }
  ],
  'FunPlus': [
    {
      title: '本地化项目经理入门必读 | 从自由译员到T0游戏大厂本地化',
      author: 'Lucian · 社群编号3049',
      url: 'https://mp.weixin.qq.com/s/F2VKs37QT2MGdy5_Twv40A',
      summary: '汉语言文学→自由译员→上海游戏公司英语本地化（半年转岗PM）→头部游戏大厂本地化项目经理（负责MMO旗舰产品，16薪起步）。本地化管理案例登上飞书官网。'
    }
  ],

  // ===== 行业关键词匹配 =====
  '游戏本地化': [
    {
      title: '本地化项目经理入门必读 | 从自由译员到T0游戏大厂本地化',
      author: 'Lucian · 社群编号3049',
      url: 'https://mp.weixin.qq.com/s/FKHpkPQjz8oUsK2EumWBeg',
      summary: '汉语言文学→自由译员→上海游戏公司英语本地化（半年转岗PM）→头部游戏大厂本地化项目经理（负责MMO旗舰产品，16薪起步）'
    },
    {
      title: '从网易到米哈游：游戏本地化in-house译员的成长路径',
      author: 'James',
      url: 'https://mp.weixin.qq.com/s/d73WbrQh5tZavEYBgdfAPw',
      summary: '武汉大学口笔译本科→巴斯大学硕士→网易游戏翻译兼本地化→米哈游in-house口笔译员'
    }
  ],
  '广告投放': [
    {
      title: '从零开始到游戏公司海外投放的全攻略',
      author: 'Roxy · 社群编号1688',
      url: 'https://mp.weixin.qq.com/s?__biz=MzU1OTk2MDQzMA==&mid=2247511995&idx=1&sn=c563965bfc8cde806b059db5877747b5',
      summary: '普通院校英专→学生时代接翻译活→投500+份简历→游戏运营实习→海外广告投放（月入2.5万*14薪）→在职拿到英国市场营销硕士Offer。00后，3年年薪35万+。'
    }
  ],
  '翻译': [
    {
      title: '本地化项目经理入门必读 | 从自由译员到T0游戏大厂本地化',
      author: 'Lucian · 社群编号3049',
      url: 'https://mp.weixin.qq.com/s/FKHpkPQjz8oUsK2EumWBeg',
      summary: '汉语言文学→CATTI→自由译员→游戏公司译员→头部大厂本地化项目经理。3年走完全程。'
    },
    {
      title: '从网易到米哈游：游戏本地化in-house译员的成长路径',
      author: 'James',
      url: 'https://mp.weixin.qq.com/s/d73WbrQh5tZavEYBgdfAPw',
      summary: '武汉大学口笔译本科→巴斯大学硕士→网易游戏翻译兼本地化→米哈游in-house口笔译员'
    }
  ],
  '内容创作': [
    {
      title: '审美是语言从业者最后的护城河 | 从英专到三联/芭莎撰稿人',
      author: '小季 Eloise Ji · 社群编号3050',
      url: 'https://mp.weixin.qq.com/s/d73WbrQh5tZavEYBgdfAPw',
      summary: '本科英专→UCL社科硕士→小红书1.7万+粉娱乐影视博主→三联生活周刊19篇+芭莎1篇时尚撰稿人→时尚创译与本地化。99年INTJ，用"审美"作为核心护城河。'
    }
  ],
  '教培': [
    {
      title: '法语本转NLP硕士，兼职教培走向AI产品经理',
      author: '神仙不留名 · 社群编号5610',
      url: 'https://mp.weixin.qq.com/s/d73WbrQh5tZavEYBgdfAPw',
      summary: '法语本科→法国交换→索邦大学NLP硕士→兼职法语教培（目标AI产品经理）'
    }
  ]
};

function getRelatedCases(job) {
  const cases = [];
  const existingUrls = new Set();

  // 1. 优先读取后台配置的自定义案例链接
  const customCases = job.caseStudies;
  if (customCases && Array.isArray(customCases) && customCases.length > 0) {
    for (const url of customCases) {
      if (url && !existingUrls.has(url)) {
        cases.push({
          title: '相关案例',
          author: '社群案例',
          url: url,
          summary: ''
        });
        existingUrls.add(url);
      }
    }
    return cases;
  }

  // 2. 按公司名精确匹配
  if (job.company && caseLibrary[job.company]) {
    for (const c of caseLibrary[job.company]) {
      if (!existingUrls.has(c.url)) {
        cases.push(c);
        existingUrls.add(c.url);
      }
    }
  }

  // 3. 按行业关键词匹配
  const text = `${job.title || ''} ${job.description || ''} ${job.fullDescription || ''}`;
  const keywords = [
    { key: '游戏本地化', patterns: ['游戏', 'Game', '本地化', 'LQA', 'localiz', 'translat', '译员', '翻译'] },
    { key: '广告投放', patterns: ['投放', '广告', 'marketing', '增长', '买量', 'UA', '用户获取'] },
    { key: '翻译', patterns: ['翻译', '译员', 'translat', '口译', '笔译', 'localiz', '审校'] },
    { key: '内容创作', patterns: ['内容', '创作', '撰稿', '文案', '编辑', '新媒体', '博主', '自媒体'] },
    { key: '教培', patterns: ['教师', '老师', '教培', '教学', '家教', '辅导', '教育'] }
  ];

  for (const { key, patterns } of keywords) {
    if (caseLibrary[key] && patterns.some(p => text.toLowerCase().includes(p.toLowerCase()))) {
      for (const kc of caseLibrary[key]) {
        if (!existingUrls.has(kc.url)) {
          cases.push(kc);
          existingUrls.add(kc.url);
        }
      }
    }
  }

  // 4. 没有匹配时返回空数组，不再硬塞默认案例
  return cases;
}

const JobDetail = () => {
  const { id } = useParams();
  const [showQrModal, setShowQrModal] = useState(false);

  // 浏览计数
  useEffect(() => {
    if (!id) return;
    const key = 'rq_job_views';
    const views = JSON.parse(localStorage.getItem(key) || '{}');
    views[id] = (views[id] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(views));
  }, [id]);

  const jobsData = applyOverrides(rawJobsData);
  const job = jobsData.find(j => j.id === id);

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">岗位不存在</p>
          <Link to="/" className="text-sm text-gray-900 underline">返回岗位列表</Link>
        </div>
      </div>
    );
  }

  // 已过期岗位不可查看
  const isExpired = job.status === 'expired' || job.deadline === '已到期' || job.deadline === '已过期' || job.deadline === '已截止';
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">该岗位已过期，不可查看</p>
          <Link to="/" className="text-sm text-gray-900 underline">返回岗位列表</Link>
        </div>
      </div>
    );
  }

  const isFullTime = job.type?.some(t => t.includes('全职') || t.includes('正编'));
  const relatedCases = getRelatedCases(job);

  const typeColorMap = {
    '全职': 'border border-gray-200 bg-gray-50 text-gray-600',
    '兼职': 'border border-gray-200 bg-gray-50 text-gray-600',
    '外包': 'border border-gray-200 bg-gray-50 text-gray-600',
    '远程': 'border border-gray-200 bg-gray-50 text-gray-600',
    '线下': 'border border-gray-200 bg-gray-50 text-gray-600',
    '实习': 'border border-gray-200 bg-gray-50 text-gray-600',
    '正编': 'border border-gray-200 bg-gray-50 text-gray-600',
    '内部': 'border border-orange-200 bg-orange-50 text-orange-600'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 二维码弹窗 */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQrModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative" onClick={e => e.stopPropagation()}>
            {/* 右上角关闭按钮 */}
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {isFullTime ? (
              <>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  {job.id === 'recvjSpj8Lknld' ? 'FunPlus英语语言专家内推' : '添加内推微信'}
                </h3>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-gray-900 mb-1 text-center">加入圈圈翻译与本地化社群</h3>
                <p className="text-sm text-gray-500 mb-6 text-center">获取更多行业信息与合作机会</p>
              </>
            )}

            <div className="bg-gray-50 rounded-xl w-64 h-64 mx-auto flex items-center justify-center overflow-hidden">
              <img
                src={job.id === 'recvjSpj8Lknld' ? '/images/funplus-english-expert-qr.jpg' : '/images/wechat-qr.png'}
                alt={job.id === 'recvjSpj8Lknld' ? 'FunPlus英语语言专家内推二维码' : '圈圈微信二维码'}
                className="w-full h-full object-contain"
              />
            </div>

            <p className="mt-6 text-center text-sm text-gray-500">
              来和群友当同事吧！
            </p>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* 返回按钮 */}
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          返回岗位列表
        </Link>

        {/* 岗位标题卡 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {job.company}
                </span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.location}
                </span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {job.postedAt}
                </span>
                {job.salaryRange && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1 text-gray-700 font-medium">
                      <Globe className="w-3.5 h-3.5" />
                      {job.salaryRange}
                    </span>
                  </>
                )}
                {job.paymentCycle && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {job.paymentCycle}
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {job.type?.map(t => (
                  <span key={t} className={`px-2 py-1 rounded-md text-xs font-medium ${typeColorMap[t] || 'border border-gray-200 bg-gray-50 text-gray-600'}`}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 岗位描述 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            岗位详情
          </h2>
          <div className="text-sm text-gray-700 space-y-3 leading-relaxed whitespace-pre-line">
            {job.fullDescription || job.description || '暂无详细描述'}
          </div>
        </div>

        {/* 要求 */}
        {job.requirements && job.requirements.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              岗位要求
            </h2>
            <ul className="space-y-2">
              {job.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 备注要求 */}
        {job.comments && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              备注要求
            </h2>
            <div className="text-sm text-gray-700 space-y-3 leading-relaxed whitespace-pre-line">
              {job.comments}
            </div>
          </div>
        )}

        {/* 关键信息 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            关键信息
          </h2>
          <div className="space-y-2 text-sm">
            {job.salaryRange && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">薪资区间：</span>
                <span className="font-medium text-gray-900">{job.salaryRange}</span>
              </div>
            )}
            {job.paymentCycle && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">结算周期：</span>
                <span className="text-gray-700">{job.paymentCycle}</span>
              </div>
            )}
            {job.languagePair && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">语言对：</span>
                <span className="text-gray-700">{job.languagePair}</span>
              </div>
            )}
            {job.deadline && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">截止日期：</span>
                <span className="text-gray-700">{job.deadline}</span>
              </div>
            )}
          </div>
        </div>

        {/* 知识弹药库 */}
        {relatedCases.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              知识弹药库
            </h2>

            <div className="space-y-4">
              {relatedCases.map((c, i) => (
                <a
                  key={i}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-[#fd8e2a] transition-colors mb-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">{c.author}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{c.summary}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 底部 CTA */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowQrModal(true)}
              className="w-full py-3 bg-[#fd8e2a] text-white rounded-xl text-sm font-medium hover:bg-[#e57f1f] transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              {isFullTime ? '简历内推' : '加入社群'}
            </button>
            <a
              href="https://my.feishu.cn/share/base/form/shrcnQXQHrBLSUD39nqRWzTTGYg"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              我也要发布
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
