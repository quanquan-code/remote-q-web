import React, { useState, useMemo } from 'react';
import { Search, MapPin, Clock, Globe, Building2, Briefcase, Users, Plus, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import rawData from '../data/jobs.json';
const rawJobsData = rawData.jobs || rawData;

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
      ...(o.salary !== undefined && { salary: o.salary }),
      ...(o.salaryNote !== undefined && { salaryNote: o.salaryNote }),
      ...(o.deadline !== undefined && { deadline: o.deadline }),
      ...(o.location !== undefined && { location: o.location }),
      ...(o.type !== undefined && { type: o.type }),
      ...(o.fullDescription !== undefined && { fullDescription: o.fullDescription }),
      ...(o.status !== undefined && { status: o.status }),
    };
  });
}

// 解析截止日期状态
function parseDeadline(deadline, postedAt) {
  if (!deadline || deadline.trim() === '' || deadline === '-') return { type: 'open' };
  const dl = deadline.toLowerCase();

  // 已招到（最高优先级，不再展示）
  if (['已招到', '已录用', '已关闭', '已结束'].some(k => dl.includes(k))) {
    return { type: 'filled' };
  }

  // 已到期
  if (['已到期', '已截止', '已过期', 'expired'].some(k => dl.includes(k))) {
    return { type: 'expired' };
  }

  // 急招类
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
    return { type: 'longterm' };
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

  // YYYY年M.D
  m = deadline.match(/(\d{4})年(\d{1,2})\.(\d{1,2})/);
  if (m) return { type: 'date', date: new Date(`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`) };

  // YYYY年M月
  m = deadline.match(/(\d{4})年(\d{1,2})月/);
  if (m) {
    const d = new Date(parseInt(m[1]), parseInt(m[2])-1, 1);
    d.setMonth(d.getMonth() + 1, 0);
    return { type: 'date', date: d };
  }

  // M月D日（按 postedAt 推断年份）
  m = deadline.match(/(\d{1,2})月(\d{1,2})日/);
  if (m && postedAt) {
    const year = postedAt.match(/(\d{4})/)?.[1] || new Date().getFullYear().toString();
    return { type: 'date', date: new Date(`${year}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`) };
  }

  // M/D（按 postedAt 推断年份）
  m = deadline.match(/(\d{1,2})\/(\d{1,2})/);
  if (m && postedAt) {
    const year = postedAt.match(/(\d{4})/)?.[1] || new Date().getFullYear().toString();
    return { type: 'date', date: new Date(`${year}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`) };
  }

  // M月（按 postedAt 推断年份，取月末）
  m = deadline.match(/(\d{1,2})月/);
  if (m && postedAt) {
    const year = postedAt.match(/(\d{4})/)?.[1] || new Date().getFullYear().toString();
    const d = new Date(parseInt(year), parseInt(m[1])-1, 1);
    d.setMonth(d.getMonth() + 1, 0);
    return { type: 'date', date: d };
  }

  return { type: 'unknown' };
}

function getDeadlineStatus(deadline, postedAt, forcedStatus) {
  if (forcedStatus) return forcedStatus;
  const p = parseDeadline(deadline, postedAt);
  if (p.type === 'filled') return 'filled';
  if (p.type === 'expired') return 'expired';
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

// 从岗位名称和描述中提取语种
function extractLanguages(job) {
  const text = `${job.title || ''} ${job.fullDescription || ''} ${job.requirements || ''} ${job.languagePair || ''}`;
  const langs = [];
  const langMap = [
    { keys: ['英语', '英文', 'English'], label: '英' },
    { keys: ['日语', '日文', 'Japanese'], label: '日' },
    { keys: ['韩语', '韩文', 'Korean'], label: '韩' },
    { keys: ['阿拉伯语', 'Arabic'], label: '阿' },
    { keys: ['葡萄牙语', 'Portuguese'], label: '葡' },
    { keys: ['俄语', 'Russian'], label: '俄' },
    { keys: ['德语', 'German'], label: '德' },
    { keys: ['法语', 'French'], label: '法' },
    { keys: ['意大利语', '意语', 'Italian'], label: '意' },
  ];
  for (const { keys, label } of langMap) {
    if (keys.some(k => text.includes(k))) {
      langs.push(label);
    }
  }
  return langs.length > 0 ? langs : ['其他'];
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
  const [selectedLanguage, setSelectedLanguage] = useState('全部');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showRemoteQModal, setShowRemoteQModal] = useState(false);

  // 筛选选项
  const locationFilters = ['全部', '远程', '线下'];
  const workModeFilters = ['全部', '远程', '线下'];
  const typeFilters = ['全部', '兼职', '全职', '外包', '正编'];
  const languageFilters = ['全部', '英', '日', '韩', '阿', '葡', '俄', '德', '法', '意', '其他'];

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
    
    // 搜索
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      jobs = jobs.filter(job =>
        job.title?.toLowerCase().includes(query) ||
        job.company?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.languagePair?.toLowerCase().includes(query)
      );
    }
    
    // 远程/线下筛选
    if (selectedWorkMode !== '全部') {
      if (selectedWorkMode === '远程') {
        jobs = jobs.filter(job => job.location?.includes('远程'));
      } else if (selectedWorkMode === '线下') {
        jobs = jobs.filter(job => 
          job.location && !job.location.includes('远程') && job.location.length > 0
        );
      }
    }
    
    // 兼职/全职/外包/正编筛选
    if (selectedType !== '全部') {
      jobs = jobs.filter(job => job.type?.some(t => t.includes(selectedType)));
    }
    
    // 语种筛选
    if (selectedLanguage !== '全部') {
      jobs = jobs.filter(job => {
        const langs = extractLanguages(job);
        return langs.includes(selectedLanguage);
      });
    }
    
    // 过期岗位和已招到自动沉底，其余按发布日期从新到旧
    jobs.sort((a, b) => {
      const sa = getDeadlineStatus(a.deadline, a.postedAt, a.status);
      const sb = getDeadlineStatus(b.deadline, b.postedAt, b.status);
      // 已招到和已过期沉底
      const aClosed = ['filled', 'expired'].includes(sa);
      const bClosed = ['filled', 'expired'].includes(sb);
      if (aClosed && !bClosed) return 1;
      if (!aClosed && bClosed) return -1;
      return b.postedAt.localeCompare(a.postedAt);
    });
    
    return jobs;
  }, [searchQuery, selectedNav, selectedWorkMode, selectedType, selectedLanguage]);

  // 岗位形式标签颜色
  const typeColorMap = {
    '全职': 'border border-gray-200 bg-gray-50 text-gray-600',
    '兼职': 'border border-gray-200 bg-gray-50 text-gray-600',
    '外包': 'border border-gray-200 bg-gray-50 text-gray-600',
    '远程': 'border border-gray-200 bg-gray-50 text-gray-600',
    '线下': 'border border-gray-200 bg-gray-50 text-gray-600',
    '实习': 'border border-gray-200 bg-gray-50 text-gray-600',
    '正编': 'border border-gray-200 bg-gray-50 text-gray-600',
    '内部': 'border border-orange-400 bg-orange-50 text-orange-600',
    '公开': 'border border-green-200 bg-green-50 text-green-600'
  };

  // 左侧导航
  const navItems = [
    { key: '全部工作', label: '全部工作', count: jobsData.length },
    { key: '远程工作', label: '远程工作', count: jobsData.filter(j => j.location?.includes('远程') || j.type?.some(t => t.includes('线上'))).length },
  ];

  // 处理导航切换
  const handleNavClick = (key) => {
    setSelectedNav(key);
    if (key === '远程工作') {
      setSelectedWorkMode('远程');
    } else if (selectedWorkMode !== '全部') {
      // 切回"全部工作"时，如果工作方式不是"全部"，重置为"全部"
      setSelectedWorkMode('全部');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 二维码弹窗 */}
      {/* 关于我们弹窗 */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQrModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">关于我们</h3>
            <div className="text-sm text-gray-600 space-y-2 mb-5">
              <p>圈圈翻译与本地化社群，运营5年+，汇聚5700+语言服务行业同仁。</p>
              <p>推动外语人兼职实习就业找出路，定期分享行业资讯、岗位内推与职业成长案例。</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500 text-center mb-3">扫码添加圈圈微信，加入社群</p>
              <div className="bg-gray-100 rounded-lg w-48 h-48 mx-auto flex items-center justify-center overflow-hidden">
                <img src="/images/wechat-qr.png" alt="圈圈微信二维码" className="w-full h-full object-contain" />
              </div>
            </div>
            <button 
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Remote Q 小程序弹窗 */}
      {showRemoteQModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRemoteQModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowRemoteQModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 text-center">Remote Q</h3>
            <p className="text-sm text-gray-500 mb-5 text-center">远程工作的大众点评</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500 text-center mb-3">扫码跳转小程序</p>
              <div className="bg-gray-100 rounded-lg w-48 h-48 mx-auto flex items-center justify-center overflow-hidden">
                <img src="/images/remote-q-miniapp-qr.png" alt="Remote Q 小程序二维码" className="w-full h-full object-contain" />
              </div>
            </div>
            <button
              onClick={() => setShowRemoteQModal(false)}
              className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 顶部栏 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-[#fd8e2a] shrink-0">Remote Q</h1>
              <div className="relative w-64 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索公司、职位、语种..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-100 rounded-xl text-sm outline-none focus:border-gray-300 transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowQrModal(true)}
                className="px-4 py-2 bg-[#fd8e2a] text-white rounded-xl text-sm font-medium hover:bg-[#e57f1f] transition-colors inline-flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                加入社群（1300+小伙伴同行）
              </button>
              <a 
                href="https://my.feishu.cn/share/base/form/shrcnQXQHrBLSUD39nqRWzTTGYg" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                人才帮招
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-6 pt-6">
        {/* Hero 区域 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">
            <span className="text-[#fd8e2a]">Remote Q</span> <span className="text-lg font-medium text-gray-600">@圈圈翻译与本地化社群</span>
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">
            5年+，聚集5700+语言服务行业小伙伴，外语人兼职实习就业出路看过来~！
          </p>
        </div>

        <div className="flex gap-6">
          {/* 左侧导航 */}
          <div className="w-64 shrink-0 space-y-4">
            {/* 导航 + CTA 统一卡片 */}
            <div className="bg-white rounded-xl overflow-hidden">
              {/* 导航项 */}
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between ${
                    selectedNav === item.key ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-gray-400">{item.count}</span>
                </button>
              ))}

              {/* 主推CTA：社群知识库 */}
              <a
                href="https://my.feishu.cn/wiki/R8iFwKE0aiBSfKka20rc8HNNnJ6?from=from_copylink"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-3 bg-[#fd8e2a] text-white text-sm font-medium hover:bg-[#e57f1f] transition-colors flex items-center justify-between"
              >
                <span>社群知识库</span>
                <span className="text-xs">→</span>
              </a>

              {/* 次推CTA：人才帮招 */}
              <a
                href="https://my.feishu.cn/share/base/form/shrcnQXQHrBLSUD39nqRWzTTGYg"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-3 text-gray-900 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <span>人才帮招</span>
                <span className="text-xs text-gray-400">我也要发布</span>
              </a>

              {/* Remote Q 小程序 */}
              <button
                onClick={() => setShowRemoteQModal(true)}
                className="w-full px-4 py-3 text-gray-900 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-between border-t border-gray-100"
              >
                <span>Remote Q</span>
                <span className="text-xs text-gray-400">远程工作的大众点评</span>
              </button>
            </div>
          </div>

          {/* 右侧职位列表 */}
          <div className="flex-1">
            {/* 筛选标签 */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">工作方式</span>
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
                  <span className="text-xs text-gray-400 font-medium">岗位形式</span>
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

                {/* 语种筛选 */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">语种</span>
                  <select
                    value={selectedLanguage}
                    onChange={e => setSelectedLanguage(e.target.value)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 bg-white text-gray-600 outline-none focus:border-gray-400 cursor-pointer"
                  >
                    {languageFilters.map(filter => (
                      <option key={filter} value={filter}>{filter}</option>
                    ))}
                  </select>
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
                    const jobStatus = getDeadlineStatus(job.deadline, job.postedAt, job.status);
                    const isClosed = jobStatus === 'expired' || jobStatus === 'filled';
                    return (
                      <div
                        key={job.id}
                        onClick={() => navigate(`/job/${job.id}`)}
                        className={`px-4 py-4 flex items-start justify-between group hover:bg-gray-50 transition-colors cursor-pointer ${isClosed ? 'bg-[#f5f5f5]' : ''} ${job.type?.includes('内部') ? 'border border-orange-400 rounded-xl' : ''}`}
                      >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-xs font-bold text-gray-500">
                          {job.company?.slice(0, 2) || '公司'}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-700 transition-colors truncate">
                              <Link to={`/job/${job.id}`} className="hover:underline">
                                {job.title?.length > 30 ? job.title.slice(0, 30) + '...' : job.title}
                              </Link>
                            </h3>
                            {(job.company?.includes('EA') || job.company?.includes('沐瞳')) && (
                              <span className="text-xs shrink-0">💚 加班少</span>
                            )}
                            {(job.company?.includes('沐瞳') || job.company?.includes('趣加')) && (
                              <span className="text-xs shrink-0">❤️ 在职群友可咨询</span>
                            )}
                          </div>
                          
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
                            {/* 全职且非外包 → 自动补正编标签 */}
                            {job.type?.some(t => t.includes('全职')) && !job.type?.some(t => t.includes('外包')) && !job.type?.some(t => t.includes('正编')) && (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColorMap['正编'] || 'bg-gray-100 text-gray-600'}`}>
                                正编
                              </span>
                            )}
                            {/* 全职/正编岗位且非内部 → 公开标签 */}
                            {job.type?.some(t => t.includes('全职') || t.includes('正编')) && !job.type?.includes('内部') && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium border border-gray-200 bg-gray-50 text-gray-600">
                                公开
                              </span>
                            )}
                            {job.languagePair && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {job.languagePair}
                              </span>
                            )}
                            {/* 语种标签 */}
                            {extractLanguages(job).map(lang => (
                              <span key={lang} className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
                                {lang}
                              </span>
                            ))}
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
                          const status = getDeadlineStatus(job.deadline, job.postedAt, job.status);

                          // 已招到：✅
                          if (status === 'filled') {
                            return (
                              <div className="mt-1 flex items-center justify-end gap-1 text-xs text-gray-500">
                                <span>✅</span>
                                <span>已招到</span>
                              </div>
                            );
                          }

                          // 已过期：灰点
                          if (status === 'expired') {
                            return (
                              <div className="mt-1 flex items-center justify-end gap-1 text-xs text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                <span>已过期</span>
                              </div>
                            );
                          }

                          // 长期：绿点
                          if (status === 'longterm') {
                            return (
                              <div className="mt-1 flex items-center justify-end gap-1 text-xs text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span>长期</span>
                              </div>
                            );
                          }

                          // 其他（包括 open/urgent）统一显示为急招：红点
                          return (
                            <div className="mt-1 flex items-center justify-end gap-1 text-xs text-gray-500">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              <span>急招</span>
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