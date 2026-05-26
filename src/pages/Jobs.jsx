import React, { useState, useMemo } from 'react';
import { Search, MapPin, Clock, Globe, Building2, Briefcase } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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
      ...(o.title !== undefined && { title: o.title }),
      ...(o.company !== undefined && { company: o.company }),
      ...(o.salary !== undefined && { salary: o.salary }),
      ...(o.deadline !== undefined && { deadline: o.deadline }),
      ...(o.location !== undefined && { location: o.location }),
      ...(o.type !== undefined && { type: o.type }),
      ...(o.fullDescription !== undefined && { fullDescription: o.fullDescription }),
    };
  });
}

// 解析截止日期状态
function parseDeadline(deadline, postedAt) {
  if (!deadline || deadline.trim() === '' || deadline === '-') return { type: 'open' };
  const dl = deadline.toLowerCase();

  // 急招类（最高优先级）
  if (['急招', '急聘', '紧急招聘', 'urgent hiring'].some(k => dl.includes(k))) {
    return { type: 'urgent' };
  }

  // 长期类
  if (['长期', 'long term', 'longterm', 'no time limitation', 'until we hired'].some(k => dl.includes(k))) {
    return { type: 'longterm' };
  }

  // 尽快/招到即止（无明确截止日期，算开放）
  if (['尽快', '招到即止', '招到为止', '找到合适的即止', 'asap', '不定', '待定'].some(k => dl.includes(k))) {
    return { type: 'open' };
  }

  // 未提供/空
  if (['未提供', '未明确', '无', 'undefined', 'n/a'].some(k => dl.includes(k))) {
    return { type: 'open' };
  }

  // 尝试提取日期
  let m;

  // YYYY-MM-DD / YYYY/MM/DD
  m = deadline.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (m) return { type: 'date', date: new Date(`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`) };

  // YYYY.MM.DD
  m = deadline.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (m) return { type: 'date', date: new Date(`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`) };

  // YYYY年M月D日
  m = deadline.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (m) return { type: 'date', date: new Date(`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`) };

  // YYYY年M月（精确到月，默认该月最后一天）
  m = deadline.match(/(\d{4})年(\d{1,2})月/);
  if (m) {
    const year = parseInt(m[1]);
    const month = parseInt(m[2]);
    const lastDay = new Date(year, month, 0).getDate();
    return { type: 'date', date: new Date(`${year}-${String(month).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`) };
  }

  // M月D日 — 根据发布年份推断
  m = deadline.match(/(\d{1,2})月(\d{1,2})日/);
  if (m) {
    const postedYear = postedAt ? parseInt(postedAt.slice(0, 4)) : null;
    const currentYear = new Date().getFullYear();
    const year = (postedYear && postedYear < currentYear) ? postedYear : currentYear;
    return { type: 'date', date: new Date(`${year}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`) };
  }

  // M月（纯月份，今年/去年，默认该月最后一天）
  m = deadline.match(/^(\d{1,2})月$/);
  if (m) {
    const postedYear = postedAt ? parseInt(postedAt.slice(0, 4)) : null;
    const currentYear = new Date().getFullYear();
    const year = (postedYear && postedYear < currentYear) ? postedYear : currentYear;
    const month = parseInt(m[1]);
    const lastDay = new Date(year, month, 0).getDate();
    return { type: 'date', date: new Date(`${year}-${String(month).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`) };
  }

  // M/D — 同上
  m = deadline.match(/(\d{1,2})\/(\d{1,2})/);
  if (m) {
    const postedYear = postedAt ? parseInt(postedAt.slice(0, 4)) : null;
    const currentYear = new Date().getFullYear();
    const year = (postedYear && postedYear < currentYear) ? postedYear : currentYear;
    return { type: 'date', date: new Date(`${year}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`) };
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

  // 工作模式筛选项
  const workModeFilters = ['全部', '远程', '线下'];

  // ===== 计算筛选条件 =====
  const navItems = ['全部工作', '全职', '兼职', '实习', '外包', '正编', '内部需求'];
  const locationOptions = ['全部', '远程', '线下', ...new Set(jobsData.map(j => j.location).filter(Boolean))];
  const typeOptions = ['全部', '全职', '兼职', '实习', '外包', '正编', '内部'];
  const statusOptions = ['全部', '急招', '在招', '长期', '已过期'];

  const filteredJobs = useMemo(() => {
    return jobsData.filter(job => {
      // 导航筛选
      if (selectedNav === '内部需求') {
        if (!job.type?.includes('内部')) return false;
      } else if (selectedNav !== '全部工作') {
        if (!job.type?.includes(selectedNav)) return false;
      }

      // 搜索
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const match =
          job.title?.toLowerCase().includes(query) ||
          job.company?.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query);
        if (!match) return false;
      }

      // 地点筛选
      if (selectedLocation !== '全部') {
        if (selectedLocation === '远程') {
          if (!job.location?.includes('远程')) return false;
        } else if (selectedLocation === '线下') {
          if (job.location?.includes('远程') && !job.location?.includes('线下')) return false;
        } else {
          if (!job.location?.includes(selectedLocation)) return false;
        }
      }

      // 类型筛选
      if (selectedType !== '全部') {
        if (!job.type?.includes(selectedType)) return false;
      }

      // 状态筛选
      if (selectedStatus !== '全部') {
        const s = getDeadlineStatus(job.deadline, job.postedAt);
        if (selectedStatus === '急招' && s !== 'urgent') return false;
        if (selectedStatus === '在招' && s !== 'open') return false;
        if (selectedStatus === '长期' && s !== 'longterm') return false;
        if (selectedStatus === '已过期' && s !== 'expired') return false;
      }

      // 工作模式筛选
      if (selectedWorkMode !== '全部') {
        if (selectedWorkMode === '远程') {
          if (!job.location?.includes('远程')) return false;
        } else if (selectedWorkMode === '线下') {
          if (!job.location?.includes('线下')) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // 排序：急招 > 在招 > 长期 > 已过期
      const sa = getDeadlineStatus(a.deadline, a.postedAt);
      const sb = getDeadlineStatus(b.deadline, b.postedAt);
      const order = { urgent: 0, open: 1, longterm: 2, expired: 3 };
      return (order[sa] || 99) - (order[sb] || 99);
    });
  }, [searchQuery, selectedNav, selectedLocation, selectedType, selectedStatus, selectedWorkMode]);

  const typeColorMap = {
    '全职': 'bg-blue-50 text-blue-600',
    '兼职': 'bg-green-50 text-green-600',
    '实习': 'bg-purple-50 text-purple-600',
    '外包': 'bg-orange-50 text-orange-600',
    '正编': 'bg-indigo-50 text-indigo-600',
    '内部': 'bg-amber-50 text-amber-600',
    '远程': 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 二维码弹窗 */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQrModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">添加内推微信</h3>
            <p className="text-sm text-gray-500 mb-6">扫码添加圈圈，协助内推</p>
            <div className="bg-gray-50 rounded-xl w-64 h-64 mx-auto flex items-center justify-center overflow-hidden">
              <img src="/images/wechat-qr.png" alt="圈圈微信二维码" className="w-full h-full object-contain" />
            </div>
            <p className="mt-6 text-center text-sm text-gray-500">
              来和群友当同事吧！
            </p>
          </div>
        </div>
      )}

      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">Remote Q</span>
            </Link>
            <div className="flex items-center gap-3">
              <a
                href="https://my.feishu.cn/wiki/R8iFwKE0aiBSfKka20rc8HNNnJ6?from=from_copylink"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#fd8e2a] hover:text-[#e57f1f] font-medium flex items-center gap-1"
              >
                加入社群
              </a>
              <a
                href="https://my.feishu.cn/share/base/form/shrcnQXQHrBLSUD39nqRWzTTGYg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                人才帮招
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero 区域 */}
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              <span className="text-[#fd8e2a]">Remote Q</span> · 远程工作职位列表
            </h1>
            <p className="text-gray-500 text-sm">
              @圈圈翻译与本地化社群 · 5年+ · 5700+同仁 · 外语人兼职实习就业出路
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* 左侧导航 */}
          <div className="w-48 shrink-0 space-y-3">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {navItems.map(item => (
                <button
                  key={item}
                  onClick={() => setSelectedNav(item)}
                  className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors flex items-center justify-between ${
                    selectedNav === item
                      ? 'bg-gray-50 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{item}</span>
                  <span className="text-xs text-gray-400">
                    {item === '全部工作' ? jobsData.length : jobsData.filter(j => {
                      if (item === '内部需求') return j.type?.includes('内部');
                      return j.type?.includes(item);
                    }).length}
                  </span>
                </button>
              ))}

              <a
                href="https://my.feishu.cn/wiki/R8iFwKE0aiBSfKka20rc8HNNnJ6?from=from_copylink"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-3 bg-[#fd8e2a] text-white text-sm font-medium hover:bg-[#e57f1f] transition-colors flex items-center justify-between"
              >
                <span>社群知识库</span>
                <span className="text-xs">→</span>
              </a>

              <button
                onClick={() => setShowQrModal(true)}
                className="w-full px-4 py-3 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-between border-t border-gray-100"
              >
                <span>关于我们</span>
                <span className="text-xs text-gray-400">社群简介</span>
              </button>
            </div>
          </div>

          {/* 右侧内容 */}
          <div className="flex-1 min-w-0">
            {/* 筛选栏 */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索岗位、公司..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">地点:</span>
                  <select
                    value={selectedLocation}
                    onChange={e => setSelectedLocation(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"
                  >
                    {locationOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">类型:</span>
                  <select
                    value={selectedType}
                    onChange={e => setSelectedType(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"
                  >
                    {typeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">状态:</span>
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 工作模式筛选 */}
              <div className="flex flex-wrap gap-2 mt-3">
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
                  {filteredJobs.map(job => (
                    <div
                      key={job.id}
                      onClick={() => navigate(`/job/${job.id}`)}
                      className="px-4 py-4 flex items-start justify-between group hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-xs font-bold text-gray-500">
                          {job.company?.slice(0, 2) || '公司'}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                            <Link to={`/job/${job.id}`} className="hover:underline">
                              {job.title.length > 20 ? job.title.slice(0, 20) + '...' : job.title}
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
                            {/* 推动转化标签：沐瞳 小红心 = 在职群友可咨询 */}
                            {job.company?.includes('沐瞳') && (
                              <span className="text-xs">
                                ❤️ 在职群友可咨询
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-4">
                        {job.salary && (
                          <div className="text-base font-semibold text-gray-900" title={job.salary}>
                            {job.salary.length > 10 ? job.salary.slice(0, 10) + '…' : job.salary}
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-1 mt-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {job.postedAt}
                        </div>
                        {(() => {
                          const p = parseDeadline(job.deadline, job.postedAt);
                          const today = new Date();
                          today.setHours(0,0,0,0);

                          // 急招：火焰图标
                          if (p.type === 'urgent') {
                            return (
                              <div className="mt-1 flex items-center justify-end gap-1 text-xs">
                                <span>🔥</span>
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
                                <span className="text-green-600">{formatDate(p.date)}截止</span>
                              </div>
                            );
                          }

                          // 长期
                          if (p.type === 'longterm') {
                            return (
                              <div className="mt-1 flex items-center justify-end gap-1 text-xs">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <span className="text-blue-600">长期</span>
                              </div>
                            );
                          }

                          return null;
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-12 text-center text-gray-400">
                  <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>暂无符合条件的岗位</p>
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
