import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, Clock, Globe, Briefcase, Filter, Heart, X, ChevronDown, Users } from 'lucide-react';
import rawJobsData from '../data/jobs.json';

/* ===== 工具函数 ===== */
function getOverrides() {
  try { return JSON.parse(localStorage.getItem('remote_q_admin_overrides') || '{}'); }
  catch { return {}; }
}
function applyOverrides(jobs) {
  const overrides = getOverrides();
  return jobs.map(job => {
    const ov = overrides[job.id] || {};
    return { ...job, ...(ov.hidden !== undefined && { hidden: ov.hidden }) };
  }).filter(job => !job.hidden);
}

function parseDeadline(deadline, postedAt) {
  if (!deadline) return { type: 'unknown' };
  const dl = String(deadline).toLowerCase().trim();
  
  // 急招关键词
  if (['急招', '急聘', '紧急招聘', 'urgent hiring'].some(k => dl.includes(k))) {
    return { type: 'urgent' };
  }
  
  // 长期关键词
  if (['长期', 'long term', 'longterm', 'no time limitation', 'until we hired', 'n/a'].some(k => dl.includes(k))) {
    return { type: 'longterm' };
  }
  
  // YYYY-MM-DD
  let m = dl.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) return { type: 'date', date: new Date(parseInt(m[1]), parseInt(m[2])-1, parseInt(m[3])) };
  
  // YYYY年M月D日
  m = dl.match(/(\d{4})年(\d{1,2})月(\d{1,2})日?/);
  if (m) return { type: 'date', date: new Date(parseInt(m[1]), parseInt(m[2])-1, parseInt(m[3])) };
  
  // YYYY年M.D
  m = dl.match(/(\d{4})年(\d{1,2})\.(\d{1,2})/);
  if (m) return { type: 'date', date: new Date(parseInt(m[1]), parseInt(m[2])-1, parseInt(m[3])) };
  
  // M月D日 / M/D（按 postedAt 推断年份）
  m = dl.match(/(\d{1,2})月(\d{1,2})日?/) || dl.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (m && postedAt) {
    const year = postedAt.match(/(\d{4})/)?.[1] || new Date().getFullYear().toString();
    return { type: 'date', date: new Date(parseInt(year), parseInt(m[1])-1, parseInt(m[2])) };
  }
  
  // YYYY年M月
  m = dl.match(/(\d{4})年(\d{1,2})月/);
  if (m) {
    const d = new Date(parseInt(m[1]), parseInt(m[2])-1, 1);
    d.setMonth(d.getMonth() + 1, 0);
    return { type: 'date', date: d };
  }
  
  // M月（按 postedAt 推断年份，取月末）
  m = dl.match(/(\d{1,2})月/);
  if (m && postedAt) {
    const year = postedAt.match(/(\d{4})/)?.[1] || new Date().getFullYear().toString();
    const d = new Date(parseInt(year), parseInt(m[1])-1, 1);
    d.setMonth(d.getMonth() + 1, 0);
    return { type: 'date', date: d };
  }
  
  return { type: 'unknown' };
}

function getDeadlineStatus(deadline, postedAt) {
  const p = parseDeadline(deadline, postedAt);
  if (p.type === 'urgent') return 'urgent';
  if (p.type === 'longterm') return 'longterm';
  if (p.type === 'date') {
    const today = new Date();
    today.setHours(0,0,0,0);
    if (p.date < today) return 'expired';
    return 'open';
  }
  return 'open';
}

// 格式化日期
function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

const jobsData = applyOverrides(rawJobsData);

const Jobs = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNav, setSelectedNav] = useState('全部工作');
  const [selectedLocation, setSelectedLocation] = useState('全部');
  const [selectedType, setSelectedType] = useState('全部');
  const [selectedStatus, setSelectedStatus] = useState('全部');
  const [selectedWorkMode, setSelectedWorkMode] = useState('全部');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showRemoteQModal, setShowRemoteQModal] = useState(false);

  // 筛选选项
  const locationFilters = ['全部', '远程', '线下'];
  const workModeFilters = ['全部', '远程', '线下'];
  const typeFilters = ['全部', '兼职', '全职', '外包', '正编'];
  const statusFilters = ['全部', '在招'];

  const filteredJobs = useMemo(() => {
    let jobs = jobsData;
    
    // 过滤已隐藏岗位
    jobs = jobs.filter(job => !job.hidden);
    
    // 左侧导航筛选
    if (selectedNav === '远程工作') {
      jobs = jobs.filter(job => 
        job.location?.includes('远程') || job.type?.some(t => t.includes('线上'))
      );
    }
    
    // 关键词搜索
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      jobs = jobs.filter(job => 
        job.title?.toLowerCase().includes(q) ||
        job.company?.toLowerCase().includes(q) ||
        job.location?.toLowerCase().includes(q) ||
        job.languagePair?.toLowerCase().includes(q) ||
        job.type?.some(t => t.toLowerCase().includes(q))
      );
    }
    
    // 工作地点筛选
    if (selectedLocation !== '全部') {
      jobs = jobs.filter(job => 
        selectedLocation === '远程' 
          ? job.location?.includes('远程')
          : !job.location?.includes('远程')
      );
    }
    
    // 工作模式筛选
    if (selectedWorkMode !== '全部') {
      jobs = jobs.filter(job => 
        selectedWorkMode === '远程' 
          ? job.location?.includes('远程')
          : !job.location?.includes('远程')
      );
    }
    
    // 类型筛选
    if (selectedType !== '全部') {
      jobs = jobs.filter(job => job.type?.includes(selectedType));
    }
    
    // 状态筛选
    if (selectedStatus === '在招') {
      jobs = jobs.filter(job => {
        const status = getDeadlineStatus(job.deadline, job.postedAt);
        return status !== 'expired';
      });
    }
    
    // 排序：过期放最后
    jobs.sort((a, b) => {
      const sa = getDeadlineStatus(a.deadline, a.postedAt);
      const sb = getDeadlineStatus(b.deadline, b.postedAt);
      if (sa === 'expired' && sb !== 'expired') return 1;
      if (sa !== 'expired' && sb === 'expired') return -1;
      
      // 同状态内按发布日期倒序
      const pa = new Date(a.postedAt || 0);
      const pb = new Date(b.postedAt || 0);
      return pb - pa;
    });
    
    return jobs;
  }, [searchQuery, selectedNav, selectedLocation, selectedType, selectedStatus, selectedWorkMode]);

  // 类型颜色映射
  const typeColorMap = {
    '全职': 'bg-green-50 text-green-700',
    '兼职': 'bg-blue-50 text-blue-700',
    '外包': 'bg-orange-50 text-orange-700',
    '实习': 'bg-purple-50 text-purple-700',
    '正编': 'bg-indigo-50 text-indigo-700',
  };

  const jobCount = filteredJobs.length;
  const totalCount = jobsData.filter(j => !j.hidden).length;

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          {/* 左侧：搜索 */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索岗位、公司、语言..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:bg-gray-100 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          
          {/* 右侧：导航按钮 */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowQrModal(true)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              加入社群
            </button>
            <a
              href="https://www.remoteq.xyz/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              管理后台
            </a>
          </div>
        </div>
      </div>

      {/* 主体 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* 左侧导航 */}
          <div className="w-56 shrink-0 space-y-3">
            <button
              onClick={() => setSelectedNav('全部工作')}
              className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                selectedNav === '全部工作' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                全部工作
                <span className="ml-auto text-xs opacity-60">{totalCount}</span>
              </div>
            </button>
            <button
              onClick={() => setSelectedNav('远程工作')}
              className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                selectedNav === '远程工作' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                远程工作
              </div>
            </button>
            
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowQrModal(true)}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-[#fd8e2a] text-white hover:bg-[#e87f1f] transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  社群简介
                </div>
              </button>
              <button
                onClick={() => window.open('https://mp.weixin.qq.com/s/JN3UgXYqmg8F_8E1kE6pMQ', '_blank')}
                className="w-full mt-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  人才帮招
                </div>
              </button>
            </div>
          </div>

          {/* 右侧内容 */}
          <div className="flex-1 min-w-0">
            {/* 筛选栏 */}
            <div className="mb-4 bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">工作模式</span>
                  <div className="flex gap-1">
                    {workModeFilters.map(filter => (
                      <button
                        key={filter}
                        onClick={() => setSelectedWorkMode(filter)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          selectedWorkMode === filter 
                            ? 'bg-gray-900 text-white border-gray-900' 
                            : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">类型</span>
                  <div className="flex gap-1">
                    {typeFilters.map(filter => (
                      <button
                        key={filter}
                        onClick={() => setSelectedType(filter)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          selectedType === filter 
                            ? 'bg-gray-900 text-white border-gray-900' 
                            : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">状态</span>
                  <div className="flex gap-1">
                    {statusFilters.map(filter => (
                      <button
                        key={filter}
                        onClick={() => setSelectedStatus(filter)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          selectedStatus === filter 
                            ? 'bg-gray-900 text-white border-gray-900' 
                            : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 职位列表 */}
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {selectedNav}
                </h2>
                <span className="text-sm text-gray-500">共 {filteredJobs.length} 个岗位</span>
              </div>

              {filteredJobs.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredJobs.map(job => {
                    const p = parseDeadline(job.deadline, job.postedAt);
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const isExpired = p.type === 'date' && p.date < today;
                    return (
                    <div
                      key={job.id}
                      onClick={() => navigate(`/job/${job.id}`)}
                      className={`px-4 py-4 flex items-start justify-between group hover:bg-gray-100 transition-colors cursor-pointer ${isExpired ? 'bg-gray-50' : ''}`}
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-xs font-bold text-gray-500">
                          {job.company?.slice(0, 2) || '公司'}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-700 transition-colors truncate">
                            <Link to={`/job/${job.id}`} className="hover:underline">
                              {job.title?.length > 20 ? job.title.slice(0, 20) + '...' : job.title}
                            </Link>
                          </h3>
                          
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 min-w-0">
                            <span className="truncate max-w-[200px]">{job.company}</span>
                            {job.location && (
                              <>
                                <span className="text-gray-300">·</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {job.location}
                                </span>
                              </>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {job.type?.map((t, i) => (
                              <span 
                                key={i} 
                                className={`px-2 py-0.5 rounded text-xs font-medium ${typeColorMap[t] || 'bg-gray-100 text-gray-600'}`}
                              >
                                {t}
                              </span>
                            ))}
                            {job.languagePair && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {job.languagePair}
                              </span>
                            )}
                            {/* 推动转化标签：EA/沐瞳 小绿心 = 加班少 */}
                            {(job.company?.includes('EA') || job.company?.includes('沐瞳')) && (
                              <span className="text-xs">
                                💚 加班少
                              </span>
                            )}
                            {/* 推动转化标签：沐瞳/趣加 小红心 = 在职群友可咨询 */}
                            {(job.company?.includes('沐瞳') || job.company?.includes('趣加')) && (
                              <span className="text-xs">
                                ❤️ 在职群友可咨询
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                        {job.salary && (
                          <div className="text-sm font-medium text-gray-900">
                            {job.salary.length > 10 ? job.salary.slice(0, 10) + '…' : job.salary}
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-1 mt-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {job.postedAt}
                        </div>
                        {(() => {
                          // 急招：橙色小火苗
                          if (p.type === 'urgent') {
                            return (
                              <div className="mt-1 flex items-center justify-end gap-1 text-xs">
                                <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.69 1.77-.93 2.2-1.99 2.2-1.99s1.09 2.34 1.09 3.64c0 1.99-1.78 3.14-3.88 3.14z"/>
                                </svg>
                                <span className="text-orange-600 font-medium">急招</span>
                              </div>
                            );
                          }

                          // 有明确日期且已过期：红点 + 已过期
                          if (p.type === 'date' && p.date < today) {
                            return (
                              <div className="mt-1 flex items-center justify-end gap-1 text-xs">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span className="text-red-500">已过期</span>
                              </div>
                            );
                          }

                          // 有明确日期且未过期：绿点 + 日期
                          if (p.type === 'date' && p.date >= today) {
                            return (
                              <div className="mt-1 flex items-center justify-end gap-1 text-xs">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span className="text-green-600">{formatDate(p.date)}</span>
                              </div>
                            );
                          }

                          // 长期：绿点 + 长期
                          if (p.type === 'longterm') {
                            return (
                              <div className="mt-1 flex items-center justify-end gap-1 text-xs">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span className="text-green-600">长期</span>
                              </div>
                            );
                          }

                          // 无截止日期/招到即止/尽快/open/unknown：绿点 + 在招
                          return (
                            <div className="mt-1 flex items-center justify-end gap-1 text-xs">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              <span className="text-green-600">在招</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400">暂无匹配岗位</p>
                  <p className="text-sm text-gray-400 mt-1">试试调整筛选条件</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jobs;