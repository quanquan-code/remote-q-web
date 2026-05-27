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
      ...(o.deadline !== undefined && { deadline: o.deadline }),
    };
  });
}

// 社群案例库（硬编码映射，后续可改从API读取）
const caseLibrary = {
  '沐瞳': [
    {
      title: '沐瞳 | 从转行开始进入游戏本地化全攻略',
      author: '冬天吃西瓜 · 社群编号5710',
      url: 'https://mp.weixin.qq.com/s/j2YJeiiy88z5P9Bi5yi-ug',
      summary: '2019年物联网工程毕业→教培愤而离职→B站字幕翻译起步→读圈圈公众号自学→火星测试→22-25年兼职翻译250万字→25年末沐瞳外包招募→投简历做题面试→入职上海'
    }
  ],
  // 通用游戏行业案例
  '游戏': [
    {
      title: '本地化项目经理入门必读 | 从自由译员到T0游戏大厂本地化',
      author: 'Lucian · 社群编号3049',
      url: 'https://mp.weixin.qq.com/s/FKHpkPQjz8oUsK2EumWBeg',
      summary: '汉语言文学→自由译员→上海游戏公司英语本地化（半年转岗PM）→头部游戏大厂本地化项目经理（负责MMO旗舰产品，16薪起步）'
    },
    {
      title: '从零开始到游戏公司海外投放的全攻略',
      author: 'Roxy · 社群编号1688',
      url: 'https://mp.weixin.qq.com/s?__biz=MzU1OTk2MDQzMA==&mid=2247511995&idx=1&sn=c563965bfc8cde806b059db5877747b5',
      summary: '普通院校英专→学生时代接翻译活→投500+份简历→游戏运营实习→海外广告投放（月入2.5万*14薪）→在职拿到英国市场营销硕士Offer'
    }
  ],
  // 教培类案例
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
  // 1. 按公司名精确匹配
  if (job.company && caseLibrary[job.company]) {
    cases.push(...caseLibrary[job.company]);
  }
  // 2. 按行业关键词匹配
  const text = `${job.title} ${job.description || ''} ${job.fullDescription || ''}`;
  const keywords = [
    { key: '游戏', patterns: ['游戏', 'Game', '本地化'] },
    { key: '教培', patterns: ['教师', '老师', '教培', '教学', '家教', '辅导'] }
  ];
  for (const { key, patterns } of keywords) {
    if (caseLibrary[key] && patterns.some(p => text.includes(p))) {
      // 去重
      const existingUrls = new Set(cases.map(c => c.url));
      for (const kc of caseLibrary[key]) {
        if (!existingUrls.has(kc.url)) cases.push(kc);
      }
    }
  }
  // 3. 如果没有任何匹配，显示默认通用案例
  if (cases.length === 0) {
    return caseLibrary['游戏'];
  }
  return cases;
}

// 判断岗位是否属于游戏行业
function isGameJob(job) {
  const text = `${job.title || ''} ${job.description || ''} ${job.fullDescription || ''}`;
  return text.includes('游戏') || text.includes('Game') || text.includes('本地化');
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
  const isExpired = job.deadline === '已到期' || job.deadline === '已过期' || job.deadline === '已截止';
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
                  {job.location || '地点待定'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {job.type?.map((t, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColorMap[t] || 'bg-gray-100 text-gray-600'}`}
                  >
                    {t}
                  </span>
                ))}
                {job.languagePair && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {job.languagePair}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-400">薪资</span>
              <p className="text-base font-semibold text-gray-900 mt-1 whitespace-pre-wrap">
                {job.salary || job.salaryNote || '待议'}
              </p>
            </div>
            {job.deadline && (
              <div>
                <span className="text-xs text-gray-400">截止日期</span>
                <p className="text-sm text-gray-600 mt-1">{job.deadline}</p>
              </div>
            )}
          </div>
        </div>

        {/* 岗位要求（完整内容，不拆分职责和要求） */}
        {job.fullDescription && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              岗位要求
            </h2>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {job.fullDescription}
            </div>
          </div>
        )}

        {/* 备注 */}
        {job.comments && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              备注要求
            </h2>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-amber-50 rounded-lg p-4 border border-amber-100">
              {job.comments}
            </div>
          </div>
        )}

        {/* 推荐阅读 */}
        {(relatedCases.length > 0 || (isFullTime && isGameJob(job))) && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              推荐阅读
            </h2>
            
            {isFullTime && isGameJob(job) && (
              <>
                <p className="text-xs text-gray-400 mb-3 font-medium">圈圈推荐</p>
                {/* 本地化项目经理专属推荐 */}
                {job.title?.includes('本地化项目经理') && (
                  <a 
                    href="https://m.shifangwk.cn/lecture2/33930891?_t=1779782879949" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block p-3 rounded-lg border border-[#fd8e2a]/20 bg-[#fd8e2a]/5 hover:bg-[#fd8e2a]/10 transition-colors mb-4"
                  >
                    <p className="text-sm font-medium text-[#fd8e2a]">付费讲座 | Lucian：从零开始成为T0级游戏大厂本地化项目经理！</p>
                    <p className="text-xs text-gray-400 mt-1">付费课程 · 十方微课</p>
                  </a>
                )}
                {/* 通用游戏本地化推荐 */}
                {!job.title?.includes('本地化项目经理') && (
                  <a 
                    href="https://m.shifangwk.cn/lecture2/32397987?es__at=1779773474370" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block p-3 rounded-lg border border-[#fd8e2a]/20 bg-[#fd8e2a]/5 hover:bg-[#fd8e2a]/10 transition-colors mb-4"
                  >
                    <p className="text-sm font-medium text-[#fd8e2a]">游戏本地化从零入门讲座 by黑神话悟空本地化参与者</p>
                    <p className="text-xs text-gray-400 mt-1">付费课程 · 十方微课</p>
                  </a>
                )}
              </>
            )}
            
            {relatedCases.length > 0 && (
              <>
                <p className="text-xs text-gray-400 mb-3">社群小伙伴成功应聘案例</p>
                <div className="space-y-3">
                  {relatedCases.map((c, i) => (
                    <a key={i} href={c.url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors">
                      <p className="text-sm font-medium text-gray-900">{c.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{c.author}</p>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 底部 CTA */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex gap-3">
            <button
              onClick={() => setShowQrModal(true)}
              className="flex-1 py-3 bg-[#fd8e2a] text-white rounded-xl text-sm font-medium hover:bg-[#e57f1f] transition-colors"
            >
              联系圈圈
            </button>
            <a
              href="https://my.feishu.cn/share/base/form/shrcnQXQHrBLSUD39nqRWzTTGYg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium text-center hover:bg-gray-50 transition-colors"
            >
              我也要发布
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
