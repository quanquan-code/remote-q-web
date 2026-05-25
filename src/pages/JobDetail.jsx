import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Globe, Calendar, Building2, Briefcase, MessageCircle } from 'lucide-react';
import jobsData from '../data/jobs.json';

const JobDetail = () => {
  const { id } = useParams();
  const [showQrModal, setShowQrModal] = useState(false);

  const job = jobsData.find(j => j.id === id);

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900">岗位未找到</h2>
          <p className="text-sm text-gray-500 mt-1">该岗位可能已下架或链接有误</p>
          <Link to="/" className="mt-4 inline-block text-sm text-gray-900 underline">返回职位列表</Link>
        </div>
      </div>
    );
  }

  const isFullTime = job.type?.some(t => t.includes('全职')) || job.type?.some(t => t.includes('正编'));

  const typeColorMap = {
    '全职': 'bg-blue-50 text-blue-600',
    '兼职': 'bg-green-50 text-green-600',
    '外包': 'bg-orange-50 text-orange-600',
    '线上': 'bg-purple-50 text-purple-600',
    '线下': 'bg-red-50 text-red-600',
    '实习': 'bg-gray-50 text-gray-600',
    '正编': 'bg-indigo-50 text-indigo-600',
    '内部': 'bg-pink-50 text-pink-600'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 二维码弹窗 */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQrModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">添加圈圈微信</h3>
            <p className="text-sm text-gray-500 mb-4">扫码添加圈圈，发送简历即可内推</p>
            <div className="bg-gray-100 rounded-lg w-48 h-48 mx-auto flex items-center justify-center overflow-hidden">
              <img src="/images/wechat-qr.png" alt="圈圈微信二维码" className="w-full h-full object-contain" />
            </div>
            <button 
              onClick={() => setShowQrModal(false)}
              className="mt-4 w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 顶部栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            返回职位列表
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* 岗位标题卡片 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 text-base font-bold text-gray-500">
              {job.company?.slice(0, 2) || '公司'}
            </div>
            <div className="flex-1 min-w-0">
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
              <p className="text-base font-semibold text-gray-900 mt-1">{job.salary}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400">发布日期</span>
              <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {job.postedAt}
              </p>
            </div>
            {job.deadline && job.deadline !== '尽快' && (
              <div>
                <span className="text-xs text-gray-400">截止日期</span>
                <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {job.deadline}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 岗位职责 */}
        {(job.fullDescription || job.description) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4" />
              岗位职责
            </h2>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {job.fullDescription || job.description}
            </div>
          </div>
        )}

        {/* 职位要求 */}
        {job.requirements && job.requirements.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <MessageCircle className="w-4 h-4" />
              职位要求
            </h2>
            <ul className="space-y-3">
              {job.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs font-medium text-gray-500 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 备注要求 */}
        {job.comments && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <MessageCircle className="w-4 h-4" />
              备注要求
            </h2>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-amber-50 rounded-lg p-4 border border-amber-100">
              {job.comments}
            </div>
          </div>
        )}

        {/* 底部 CTA */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {isFullTime ? (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">全职岗位支持内推，添加圈圈微信发送简历</p>
              <button 
                onClick={() => setShowQrModal(true)}
                className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                添加圈圈微信，投递简历
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">感兴趣？加入找工互助群了解更多</p>
              <button 
                onClick={() => setShowQrModal(true)}
                className="w-full py-3 border border-gray-200 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                加入找工互助群
              </button>
            </div>
          )}
          <div className="mt-4 text-center">
            <a 
              href="https://my.feishu.cn/share/base/form/shrcnQXQHrBLSUD39nqRWzTTGYg" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              我也要发布岗位需求
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
