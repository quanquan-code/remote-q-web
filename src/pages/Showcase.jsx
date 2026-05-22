import React, { useState, useMemo } from 'react';
import { Search, Users, Briefcase, Globe, Eye } from 'lucide-react';
import showcaseData from '../data/showcase.json';

const domains = ['全部', '游戏/本地化', '口译', '医学', '金融', '教育', '电商/营销', 'AI/科技', '汽车', '法律', '动画/影视'];
const languages = ['全部', '英语', '日语', '韩语', '德语', '法语', '俄语', '西班牙语', '葡萄牙语', '阿拉伯语', '泰语', '繁中', '多语种'];
const jobTypes = ['全部', '全职', '兼职', '外包', '线上', '线下'];

const Showcase = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('全部');
  const [selectedDomain, setSelectedDomain] = useState('全部');
  const [selectedLang, setSelectedLang] = useState('全部');

  const filteredJobs = useMemo(() => {
    let jobs = showcaseData;
    if (selectedType !== '全部') {
      jobs = jobs.filter(job => job.type?.includes(selectedType));
    }
    if (selectedDomain !== '全部') {
      jobs = jobs.filter(job => job.domain === selectedDomain);
    }
    if (selectedLang !== '全部') {
      jobs = jobs.filter(job => job.language?.includes(selectedLang));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      jobs = jobs.filter(job =>
        job.title?.toLowerCase().includes(query) ||
        job.company?.toLowerCase().includes(query) ||
        job.domain?.toLowerCase().includes(query) ||
        job.language?.toLowerCase().includes(query)
      );
    }
    return jobs;
  }, [searchQuery, selectedType, selectedDomain, selectedLang]);

  const stats = useMemo(() => ({
    total: showcaseData.length,
    fullTime: showcaseData.filter(j => j.type?.includes('全职')).length,
    partTime: showcaseData.filter(j => j.type?.includes('兼职')).length,
    remote: showcaseData.filter(j => j.type?.includes('线上')).length,
    named: showcaseData.filter(j => !j.isAnonymous).length,
  }), []);

  const uniqueDomains = useMemo(() => {
    const d = new Set(showcaseData.map(j => j.domain));
    return Array.from(d).filter(Boolean);
  }, []);

  const uniqueLanguages = useMemo(() => {
    const l = new Set();
    showcaseData.forEach(j => {
      if (j.language) {
        j.language.split(' / ').forEach(x => l.add(x.trim()));
      }
    });
    return Array.from(l).filter(Boolean);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部横幅 */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">圈圈翻译社群</h1>
            <p className="text-sm text-orange-100 mt-1">招募机会实力展示</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg p-2 text-center">
            <div className="text-lg font-bold">{stats.total}+</div>
            <div className="text-xs text-orange-100">累计岗位</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/15 backdrop-blur rounded-lg p-2 text-center">
            <div className="text-base font-semibold">{stats.fullTime}</div>
            <div className="text-xs text-orange-100">全职</div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-lg p-2 text-center">
            <div className="text-base font-semibold">{stats.partTime}</div>
            <div className="text-xs text-orange-100">兼职</div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-lg p-2 text-center">
            <div className="text-base font-semibold">{stats.remote}</div>
            <div className="text-xs text-orange-100">远程</div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-lg p-2 text-center">
            <div className="text-base font-semibold">{uniqueLanguages.length}</div>
            <div className="text-xs text-orange-100">语种</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-orange-100">
          <Eye className="w-3.5 h-3.5" />
          <span>以下仅展示岗位概览，联系方式加入社群后解锁</span>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索岗位、公司、语种、领域..."
            className="flex-1 text-sm outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="text-gray-400 text-xs" onClick={() => setSearchQuery('')}>
              清除
            </button>
          )}
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="px-4 mt-4 space-y-3">
        {/* 工作类型 */}
        <div>
          <div className="text-xs text-gray-400 mb-1.5">工作类型</div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {jobTypes.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                  selectedType === type ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 领域 */}
        <div>
          <div className="text-xs text-gray-400 mb-1.5">领域</div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {domains.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDomain(d)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                  selectedDomain === d ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* 语种 */}
        <div>
          <div className="text-xs text-gray-400 mb-1.5">语种</div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {languages.map(l => (
              <button
                key={l}
                onClick={() => setSelectedLang(l)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                  selectedLang === l ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 岗位列表 */}
      <div className="px-4 mt-4">
        {filteredJobs.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">共 {filteredJobs.length} 个岗位</span>
            </div>
            <div className="space-y-3">
              {filteredJobs.map(job => (
                <div
                  key={job.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{job.title}</h3>
                        {job.isAnonymous && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded">匿名</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {job.isAnonymous ? '匿名客户' : job.company}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-orange-500">{job.salary || '面议'}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {job.type?.split(' / ').map(t => (
                      <span key={t} className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded">
                        {t}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">
                      {job.domain}
                    </span>
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded">
                      {job.language}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-gray-400">
                    截止：{job.deadline || '长期有效'}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">暂无匹配岗位</p>
            <p className="text-sm text-gray-400 mt-1">试试其他筛选条件</p>
          </div>
        )}
      </div>

      {/* 底部 CTA */}
      <div className="px-4 mt-6 mb-6">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
          <div className="flex items-start gap-3">
            <div className="bg-orange-100 rounded-full p-2">
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">加入圈圈翻译社群</h3>
              <p className="text-sm text-gray-600 mt-1">
                {stats.total}+ 优质岗位持续更新，{stats.named}+ 家知名企业/团队直招，解锁全部联系方式与投递通道
              </p>
              <div className="flex gap-2 mt-3">
                <button 
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm font-medium"
                  onClick={() => window.open('https://mp.weixin.qq.com/s/3d0v8kYv8K5j3lF2d3gH1A', '_blank')}
                >
                  了解社群
                </button>
                <button 
                  className="flex-1 bg-white text-orange-500 border border-orange-200 py-2 rounded-lg text-sm font-medium"
                  onClick={() => window.open('weixin://dl/chat?quanquan_translation', '_blank')}
                >
                  加微信咨询
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部标语 */}
      <div className="px-4 pb-8 text-center">
        <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
          <Globe className="w-3 h-3" />
          <span>覆盖 {uniqueDomains.length} 个领域 · {uniqueLanguages.length} 个语种 · 全职/兼职/远程灵活选择</span>
        </div>
      </div>
    </div>
  );
};

export default Showcase;
