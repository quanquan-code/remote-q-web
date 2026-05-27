import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Download, Upload, CheckSquare, Square, BarChart3, Users, Briefcase, Settings, Globe, Tag, MapPin, LayoutDashboard, ExternalLink, Search, Filter, X, Save, TrendingUp } from 'lucide-react';
import jobsData from '../data/jobs.json';

const STORAGE_KEY = 'remote_q_admin_overrides';
const TOKEN_KEY = 'remote_q_github_token';
const ADMIN_PASSWORD = 'quanquan2025';
const STATS_KEY = 'remote_q_site_stats';

/* ===== 工具函数 ===== */
function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}
function saveOverrides(overrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}
function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ''; }
  catch { return ''; }
}
function saveToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); }
  catch { }
}

// 统计模拟（实际可接 Google Analytics / umami / 自建）
function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { }
  return {
    totalUV: 0, totalPV: 0,
    todayUV: 0, todayPV: 0, todayNew: 0, todayEvents: 0,
    last7UV: 0, last7PV: 0, last7Clicks: 0, last7Applies: 0,
    devices: { mobile: 0, desktop: 0, tablet: 0 },
    os: { iOS: 0, Android: 0, Mac: 0, Windows: 0 },
  };
}

function exportJobsJson(overrides) {
  const merged = jobsData.map(job => {
    const ov = overrides[job.id] || {};
    return {
      ...job,
      ...(ov.hidden !== undefined && { hidden: ov.hidden }),
      ...(ov.title !== undefined && { title: ov.title }),
      ...(ov.company !== undefined && { company: ov.company }),
      ...(ov.salary !== undefined && { salary: ov.salary }),
      ...(ov.salaryNote !== undefined && { salaryNote: ov.salaryNote }),
      ...(ov.deadline !== undefined && { deadline: ov.deadline }),
      ...(ov.location !== undefined && { location: ov.location }),
      ...(ov.type !== undefined && { type: ov.type }),
      ...(ov.fullDescription !== undefined && { fullDescription: ov.fullDescription }),
      ...(ov.requirements !== undefined && { requirements: ov.requirements }),
    };
  });
  return JSON.stringify(merged, null, 2);
}

async function publishToGitHub(token, contentJson) {
  const repo = 'quanquan-code/remote-q-web';
  const path = 'src/data/jobs.json';
  const apiBase = 'https://api.github.com';

  const getRes = await fetch(`${apiBase}/repos/${repo}/contents/${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!getRes.ok) throw new Error('获取文件信息失败，请检查 Token 权限');
  const fileInfo = await getRes.json();

  const putRes = await fetch(`${apiBase}/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `admin: update jobs.json via dashboard`,
      content: btoa(unescape(encodeURIComponent(contentJson))),
      sha: fileInfo.sha,
    }),
  });
  if (!putRes.ok) {
    const err = await putRes.text();
    throw new Error(`发布失败: ${err}`);
  }
  return await putRes.json();
}

/* ===== 登录页 ===== */
function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) onLogin();
    else setErr(true);
  };
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Remote Q 管理后台</h1>
        <p className="text-sm text-gray-400 mb-6">请输入密码进入</p>
        <form onSubmit={submit}>
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setErr(false); }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 mb-3"
            placeholder="密码"
            autoFocus
          />
          {err && <p className="text-xs text-red-600 mb-3">密码错误</p>}
          <button type="submit" className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
            进入后台
          </button>
        </form>
      </div>
    </div>
  );
}

/* ===== 统计卡片 ===== */
function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-gray-300" />}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

/* ===== 侧边导航 ===== */
function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { key: 'jobs', label: '职位管理', icon: Briefcase },
    { key: 'stats', label: '统计概览', icon: BarChart3 },
    { key: 'settings', label: '设置', icon: Settings },
  ];
  return (
    <div className="w-56 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h1 className="text-sm font-bold text-gray-900">Remote Q Admin</h1>
        <p className="text-xs text-gray-400 mt-0.5">远程工作职位管理</p>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === item.key
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-2 border-t border-gray-100">
        <Link
          to="/"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          前往前台
        </Link>
      </div>
    </div>
  );
}

/* ===== 主页面 ===== */
const Admin = () => {
  useEffect(() => { document.title = 'Remote Q 后台'; }, []);
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('rq_admin_auth') === '1');
  const [activeTab, setActiveTab] = useState('jobs');
  const [overrides, setOverrides] = useState(loadOverrides);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('postedAt');
  const [savedId, setSavedId] = useState(null);
  const [token, setTokenState] = useState(getToken);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const stats = useMemo(loadStats, []);

  const handleLogin = () => {
    sessionStorage.setItem('rq_admin_auth', '1');
    setAuthed(true);
  };

  const updateField = (id, field, value) => {
    setOverrides(prev => {
      const next = { ...prev, [id]: { ...prev[id], [field]: value } };
      saveOverrides(next);
      setSavedId(id + field);
      setTimeout(() => setSavedId(s => s === id + field ? null : s), 800);
      return next;
    });
  };

  const toggleHidden = (id) => {
    const current = overrides[id]?.hidden ?? jobsData.find(j => j.id === id)?.hidden ?? false;
    updateField(id, 'hidden', !current);
  };

  const markFilled = (id) => {
    updateField(id, 'deadline', '已招到');
  };

  const bulkHide = () => {
    selectedIds.forEach(id => updateField(id, 'hidden', true));
    setSelectedIds(new Set());
  };
  const bulkShow = () => {
    selectedIds.forEach(id => updateField(id, 'hidden', false));
    setSelectedIds(new Set());
  };
  const bulkFilled = () => {
    selectedIds.forEach(id => updateField(id, 'deadline', '已招到'));
    setSelectedIds(new Set());
  };
  const bulkExpired = () => {
    selectedIds.forEach(id => updateField(id, 'deadline', '已到期'));
    setSelectedIds(new Set());
  };
  const bulkUrgent = () => {
    selectedIds.forEach(id => updateField(id, 'deadline', '急招'));
    setSelectedIds(new Set());
  };
  const bulkLongterm = () => {
    selectedIds.forEach(id => updateField(id, 'deadline', '长期'));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAll = (ids) => {
    if (selectedIds.size === ids.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(ids));
  };

  const sortedJobs = useMemo(() => {
    let jobs = [...jobsData];
    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.company?.toLowerCase().includes(q) ||
        j.id?.toLowerCase().includes(q)
      );
    }
    if (filterStatus === 'visible') {
      jobs = jobs.filter(j => !(overrides[j.id]?.hidden ?? j.hidden));
    } else if (filterStatus === 'hidden') {
      jobs = jobs.filter(j => overrides[j.id]?.hidden ?? j.hidden);
    } else if (filterStatus === 'filled') {
      jobs = jobs.filter(j => (overrides[j.id]?.deadline ?? j.deadline) === '已招到');
    } else if (filterStatus === 'expired') {
      jobs = jobs.filter(j => getDeadlineStatus(j.deadline, j.postedAt) === 'expired');
    } else if (filterStatus === 'urgent') {
      jobs = jobs.filter(j => (overrides[j.id]?.deadline ?? j.deadline) === '急招');
    } else if (filterStatus === 'longterm') {
      jobs = jobs.filter(j => (overrides[j.id]?.deadline ?? j.deadline) === '长期');
    } else if (filterStatus === 'active') {
      jobs = jobs.filter(j => {
        const d = overrides[j.id]?.deadline ?? j.deadline;
        return d !== '已招到' && !(overrides[j.id]?.hidden ?? j.hidden);
      });
    }
    jobs.sort((a, b) => {
      if (sortBy === 'postedAt') return b.postedAt.localeCompare(a.postedAt);
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'company') return (a.company || '').localeCompare(b.company || '');
      return 0;
    });
    return jobs;
  }, [search, filterStatus, sortBy, overrides]);

  const visibleCount = jobsData.filter(j => !(overrides[j.id]?.hidden ?? j.hidden)).length;
  const hiddenCount = jobsData.length - visibleCount;
  const filledCount = jobsData.filter(j => (overrides[j.id]?.deadline ?? j.deadline) === '已招到').length;
  const expiredCount = jobsData.filter(j => getDeadlineStatus(j.deadline, j.postedAt) === 'expired').length;
  const urgentCount = jobsData.filter(j => (overrides[j.id]?.deadline ?? j.deadline) === '急招').length;
  const longtermCount = jobsData.filter(j => (overrides[j.id]?.deadline ?? j.deadline) === '长期').length;

  const handleExport = () => {
    const json = exportJobsJson(overrides);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jobs.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePublish = async () => {
    if (!token) { setPublishMsg({ type: 'error', text: '请先设置 GitHub Token' }); return; }
    setPublishing(true);
    setPublishMsg(null);
    try {
      const json = exportJobsJson(overrides);
      await publishToGitHub(token, json);
      setPublishMsg({ type: 'success', text: '发布成功！Vercel 正在自动部署，约 1-2 分钟后生效' });
    } catch (err) {
      setPublishMsg({ type: 'error', text: err.message });
    } finally {
      setPublishing(false);
    }
  };

  if (!authed) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 min-w-0">
        {/* 顶部栏 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-base font-semibold text-gray-900">
                {activeTab === 'jobs' && '职位管理'}
                {activeTab === 'stats' && '统计概览'}
                {activeTab === 'settings' && '设置'}
              </h2>
              {activeTab === 'jobs' && (
                <span className="text-xs text-gray-400">
                  显示 {visibleCount} / 隐藏 {hiddenCount} / 🔥急招 {urgentCount} / 📌长期 {longtermCount} / ✅已招到 {filledCount} / ⏰已到期 {expiredCount} / 共 {jobsData.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'jobs' && (
                <>
                  <button onClick={handleExport} className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800">
                    <Download className="w-4 h-4" />
                    导出 JSON
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-white ${publishing ? 'bg-gray-400' : 'bg-[#fd8e2a] hover:bg-[#e57f1f]'}`}
                  >
                    <Upload className="w-4 h-4" />
                    {publishing ? '发布中...' : '发布到网站'}
                  </button>
                </>
              )}
            </div>
          </div>
          {publishMsg && (
            <div className={`px-6 py-2 text-xs ${publishMsg.type === 'success' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
              {publishMsg.text}
            </div>
          )}
        </div>

        <div className="p-6">
          {/* ========== 职位管理 ========== */}
          {activeTab === 'jobs' && (
            <>
              {/* 筛选栏 */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="text"
                    placeholder="搜索岗位或公司..."
                    className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-64 outline-none focus:border-gray-400"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">状态</span>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                  >
                    <option value="all">全部</option>
                    <option value="active">在招中</option>
                    <option value="urgent">🔥 急招</option>
                    <option value="longterm">📌 长期</option>
                    <option value="filled">已招到</option>
                    <option value="expired">已到期</option>
                    <option value="visible">显示中</option>
                    <option value="hidden">已隐藏</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">排序</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                  >
                    <option value="postedAt">发布日期</option>
                    <option value="title">岗位名称</option>
                    <option value="company">公司名</option>
                  </select>
                </div>
                {/* 批量操作 */}
                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-gray-500">已选 {selectedIds.size} 个</span>
                    <button onClick={bulkHide} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200">
                      批量隐藏
                    </button>
                    <button onClick={bulkShow} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200">
                      批量显示
                    </button>
                    <button onClick={bulkUrgent} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs hover:bg-orange-100">
                      批量急招
                    </button>
                    <button onClick={bulkLongterm} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs hover:bg-blue-100">
                      批量长期
                    </button>
                    <button onClick={bulkFilled} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs hover:bg-green-100">
                      批量已招到
                    </button>
                    <button onClick={bulkExpired} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs hover:bg-red-100">
                      批量已到期
                    </button>
                    <button onClick={() => setSelectedIds(new Set())} className="px-2 py-1.5 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* 职位列表 - 卡片式 */}
              <div className="space-y-3">
                {/* 表头 */}
                <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400">
                  <button
                    onClick={() => selectAll(sortedJobs.map(j => j.id))}
                    className="w-5 h-5 flex items-center justify-center"
                  >
                    {selectedIds.size === sortedJobs.length && sortedJobs.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-gray-900" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  <div className="w-8">状态</div>
                  <div className="flex-1 min-w-0">岗位信息</div>
                  <div className="w-32">薪资</div>
                  <div className="w-36">状态</div>
                  <div className="w-32">操作</div>
                </div>

                {sortedJobs.map(job => {
                  const isHidden = overrides[job.id]?.hidden ?? job.hidden ?? false;
                  const deadline = overrides[job.id]?.deadline ?? job.deadline ?? '';
                  const isFilled = deadline === '已招到';
                  const isSelected = selectedIds.has(job.id);
                  const isEditing = editingId === job.id;

                  return (
                    <div
                      key={job.id}
                      className={`bg-white rounded-xl border p-4 transition-all ${
                        isHidden ? 'border-gray-200 opacity-60' : 'border-gray-100'
                      } ${isSelected ? 'ring-1 ring-gray-900' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* 选择框 */}
                        <button
                          onClick={() => toggleSelect(job.id)}
                          className="w-5 h-5 flex items-center justify-center shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-gray-900" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-300" />
                          )}
                        </button>

                        {/* 状态标签 */}
                        <div className="w-8 shrink-0">
                          {isFilled ? (
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                              已招到
                            </span>
                          ) : isHidden ? (
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                              隐藏
                            </span>
                          ) : getDeadlineStatus(job.deadline, job.postedAt) === 'expired' ? (
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-600">
                              已到期
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                              在招
                            </span>
                          )}
                        </div>

                        {/* 岗位信息 */}
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={overrides[job.id]?.title ?? job.title ?? ''}
                                  onChange={e => updateField(job.id, 'title', e.target.value)}
                                  className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-gray-400"
                                  placeholder="岗位名称"
                                />
                                <input
                                  type="text"
                                  value={overrides[job.id]?.company ?? job.company ?? ''}
                                  onChange={e => updateField(job.id, 'company', e.target.value)}
                                  className="w-48 px-2 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-gray-400"
                                  placeholder="公司名"
                                />
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={overrides[job.id]?.location ?? job.location ?? ''}
                                  onChange={e => updateField(job.id, 'location', e.target.value)}
                                  className="w-32 px-2 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-gray-400"
                                  placeholder="地点"
                                />
                                <input
                                  type="text"
                                  value={overrides[job.id]?.type ? overrides[job.id].type.join(',') : (job.type?.join(',') ?? '')}
                                  onChange={e => updateField(job.id, 'type', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                  className="w-40 px-2 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-gray-400"
                                  placeholder="类型，如：全职,远程"
                                />
                              </div>
                              <textarea
                                value={overrides[job.id]?.fullDescription ?? job.fullDescription ?? ''}
                                onChange={e => updateField(job.id, 'fullDescription', e.target.value)}
                                rows={3}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-gray-400"
                                placeholder="岗位描述"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs hover:bg-gray-800"
                                >
                                  完成
                                </button>
                                <button
                                  onClick={() => {
                                    updateField(job.id, 'deadline', '已招到');
                                    setEditingId(null);
                                  }}
                                  className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs hover:bg-green-100"
                                >
                                  标记已招到
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-900">{job.title}</span>
                                <span className="text-xs text-gray-400">@{job.company || '未知公司'}</span>
                                {job.type?.map(t => (
                                  <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500">{t}</span>
                                ))}
                                {job.location && (
                                  <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                                    <MapPin className="w-3 h-3" />{job.location}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-1 line-clamp-1">{job.description || job.fullDescription || ''}</p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                                <span>ID: {job.id}</span>
                                <span>·</span>
                                <span>发布: {job.postedAt}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 薪资 */}
                        <div className="w-32 shrink-0 text-sm text-gray-700">
                          {isEditing ? (
                            <input
                              type="text"
                              value={overrides[job.id]?.salary ?? job.salary ?? ''}
                              onChange={e => updateField(job.id, 'salary', e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-gray-400"
                              placeholder="薪资"
                            />
                          ) : (
                            <span className={!job.salary ? 'text-gray-300' : ''}>
                              {job.salary || '待议'}
                            </span>
                          )}
                        </div>

                        {/* 状态 / 截止日期 */}
                        <div className="w-36 shrink-0">
                          {isEditing ? (
                            <div className="space-y-1">
                              <select
                                value={(() => {
                                  const d = overrides[job.id]?.deadline ?? job.deadline ?? '';
                                  if (d === '已招到') return 'filled';
                                  if (d === '已到期') return 'expired';
                                  if (d === '长期') return 'longterm';
                                  if (d === '急招') return 'urgent';
                                  if (d && !['已招到','已到期','长期','急招'].includes(d)) return 'custom';
                                  return 'open';
                                })()}
                                onChange={e => {
                                  const v = e.target.value;
                                  if (v === 'open') updateField(job.id, 'deadline', '');
                                  else if (v === 'urgent') updateField(job.id, 'deadline', '急招');
                                  else if (v === 'longterm') updateField(job.id, 'deadline', '长期');
                                  else if (v === 'filled') updateField(job.id, 'deadline', '已招到');
                                  else if (v === 'expired') updateField(job.id, 'deadline', '已到期');
                                }}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-gray-400"
                              >
                                <option value="open">在招</option>
                                <option value="urgent">🔥 急招</option>
                                <option value="longterm">📌 长期</option>
                                <option value="filled">✅ 已招到</option>
                                <option value="expired">⏰ 已到期</option>
                                <option value="custom">自定义日期</option>
                              </select>
                              {(overrides[job.id]?.deadline ?? job.deadline ?? '') === 'custom' && (
                                <input
                                  type="text"
                                  value={overrides[job.id]?.deadline ?? job.deadline ?? ''}
                                  onChange={e => updateField(job.id, 'deadline', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-gray-400"
                                  placeholder="例：2026-06-15"
                                />
                              )}
                            </div>
                          ) : (
                            <span className={`text-xs ${isFilled ? 'text-gray-400' : 'text-gray-600'}`}>
                              {deadline || '未设置'}
                            </span>
                          )}
                        </div>

                        {/* 操作 */}
                        <div className="w-32 shrink-0 flex items-center gap-1 flex-wrap">
                          <button
                            onClick={() => setEditingId(isEditing ? null : job.id)}
                            className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-900 rounded hover:bg-gray-100"
                            title="快速编辑"
                          >
                            {isEditing ? '完成' : '编辑'}
                          </button>
                          {!isEditing && (
                            <>
                              <button
                                onClick={() => toggleHidden(job.id)}
                                className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-900 rounded hover:bg-gray-100"
                                title={isHidden ? '显示' : '隐藏'}
                              >
                                {isHidden ? '显示' : '隐藏'}
                              </button>
                              {!isFilled && (
                                <>
                                  <button
                                    onClick={() => updateField(job.id, 'deadline', '急招')}
                                    className="px-2 py-1.5 text-xs text-orange-600 hover:text-orange-700 rounded hover:bg-orange-50"
                                    title="标记急招"
                                  >
                                    急招
                                  </button>
                                  <button
                                    onClick={() => updateField(job.id, 'deadline', '长期')}
                                    className="px-2 py-1.5 text-xs text-blue-600 hover:text-blue-700 rounded hover:bg-blue-50"
                                    title="标记长期"
                                  >
                                    长期
                                  </button>
                                  <button
                                    onClick={() => markFilled(job.id)}
                                    className="px-2 py-1.5 text-xs text-green-600 hover:text-green-700 rounded hover:bg-green-50"
                                    title="标记已招到"
                                  >
                                    已招到
                                  </button>
                                </>
                              )}
                              {!isFilled && getDeadlineStatus(job.deadline, job.postedAt) === 'expired' && (
                                <button
                                  onClick={() => {
                                    updateField(job.id, 'deadline', '已到期');
                                  }}
                                  className="px-2 py-1.5 text-xs text-red-600 hover:text-red-700 rounded hover:bg-red-50"
                                  title="标记已到期"
                                >
                                  已到期
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {sortedJobs.length === 0 && (
                <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
                  没有匹配岗位
                </div>
              )}
            </>
          )}

          {/* ========== 统计概览 ========== */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* 今日概览 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">今日</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="UV（独立访客）" value={stats.todayUV} sub="今日访问" icon={Users} />
                  <StatCard label="PV（页面浏览）" value={stats.todayPV} sub="今日浏览" icon={TrendingUp} />
                  <StatCard label="新访客" value={stats.todayNew} sub="首次访问" icon={Users} />
                  <StatCard label="总事件" value={stats.todayEvents} sub="点击 / 投递" icon={BarChart3} />
                </div>
              </div>

              {/* 累计数据 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">全时累计</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="累计 UV" value={stats.totalUV} sub="自上线以来独立访客" icon={Users} />
                  <StatCard label="累计 PV" value={stats.totalPV} sub="自上线以来页面浏览" icon={TrendingUp} />
                </div>
              </div>

              {/* 近 7 天 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">近 7 天</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="UV" value={stats.last7UV} icon={Users} />
                  <StatCard label="PV" value={stats.last7PV} icon={TrendingUp} />
                  <StatCard label="卡片点击" value={stats.last7Clicks} icon={Briefcase} />
                  <StatCard label="投递数" value={stats.last7Applies} icon={Upload} />
                </div>
              </div>

              {/* 浏览最多的岗位 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">浏览最多的岗位（本设备）</h3>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  {(() => {
                    const views = JSON.parse(localStorage.getItem('rq_job_views') || '{}');
                    const sorted = Object.entries(views)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10);
                    if (sorted.length === 0) {
                      return (
                        <div className="p-8 text-center text-sm text-gray-400">
                          暂无浏览数据
                        </div>
                      );
                    }
                    return (
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">排名</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">岗位</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">公司</th>
                            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">浏览次数</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {sorted.map(([jobId, count], idx) => {
                            const job = jobsData.find(j => j.id === jobId);
                            if (!job) return null;
                            return (
                              <tr key={jobId} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-xs text-gray-400">{idx + 1}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{job.title}</td>
                                <td className="px-4 py-3 text-xs text-gray-500">{job.company || '-'}</td>
                                <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{count}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>

              {/* 设备分布 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">设备类型</h4>
                  <div className="space-y-3">
                    {[
                      { label: '手机', value: stats.devices.mobile, color: 'bg-gray-900' },
                      { label: '电脑', value: stats.devices.desktop, color: 'bg-gray-400' },
                      { label: '平板', value: stats.devices.tablet, color: 'bg-gray-200' },
                    ].map(d => {
                      const total = stats.devices.mobile + stats.devices.desktop + stats.devices.tablet || 1;
                      const pct = Math.round((d.value / total) * 100);
                      return (
                        <div key={d.label} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-10">{d.label}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${d.color} rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-12 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">操作系统</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'iOS', value: stats.os.iOS },
                      { label: 'Android', value: stats.os.Android },
                      { label: 'Mac', value: stats.os.Mac },
                      { label: 'Windows', value: stats.os.Windows },
                    ].map(o => {
                      const total = stats.os.iOS + stats.os.Android + stats.os.Mac + stats.os.Windows || 1;
                      const pct = Math.round((o.value / total) * 100);
                      return (
                        <div key={o.label} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-14">{o.label}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-12 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800">
                <p className="font-medium mb-1">统计功能说明</p>
                <p className="text-xs text-amber-600">
                  当前为本地模拟数据。如需真实统计，建议接入 Google Analytics、Umami 或自建统计服务。
                  数据会自动从访客浏览器上报到 localStorage，仅供演示。
                </p>
              </div>
            </div>
          )}

          {/* ========== 设置 ========== */}
          {activeTab === 'settings' && (
            <div className="max-w-xl">
              <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">GitHub Token</h3>
                  <p className="text-xs text-gray-400 mb-3">用于直接发布修改到 GitHub，自动触发 Vercel 部署</p>
                  {showTokenInput ? (
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={token}
                        onChange={e => { setTokenState(e.target.value); saveToken(e.target.value); }}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      />
                      <button onClick={() => setShowTokenInput(false)} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-900">
                        收起
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowTokenInput(true)}
                      className="text-sm text-gray-500 hover:text-gray-900 underline"
                    >
                      {token ? '已设置 Token，点击修改' : '设置 GitHub Token'}
                    </button>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">数据管理</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                    >
                      <Download className="w-4 h-4" />
                      导出 JSON
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('确定清空所有本地修改？此操作不可恢复。')) {
                          localStorage.removeItem(STORAGE_KEY);
                          setOverrides({});
                          alert('已清空');
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100"
                    >
                      <XCircle className="w-4 h-4" />
                      清空本地修改
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
