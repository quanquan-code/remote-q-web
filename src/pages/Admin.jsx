import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Download, Save, Upload } from 'lucide-react';
import jobsData from '../data/jobs.json';

const STORAGE_KEY = 'remote_q_admin_overrides';
const TOKEN_KEY = 'remote_q_github_token';

function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function saveOverrides(overrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
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
      ...(ov.deadline !== undefined && { deadline: ov.deadline }),
      ...(ov.location !== undefined && { location: ov.location }),
      ...(ov.type !== undefined && { type: ov.type }),
      ...(ov.fullDescription !== undefined && { fullDescription: ov.fullDescription }),
      ...(ov.requirements !== undefined && { requirements: ov.requirements }),
    };
  });
  return JSON.stringify(merged, null, 2);
}

function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ''; }
  catch { return ''; }
}

function saveToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); }
  catch { }
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

const Admin = () => {
  const [overrides, setOverrides] = useState(loadOverrides);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('postedAt');
  const [filterHidden, setFilterHidden] = useState('all');
  const [savedId, setSavedId] = useState(null);
  const [token, setTokenState] = useState(getToken);
  const [showTokenInput, setShowTokenInput] = useState(!getToken());
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState(null);

  const updateField = (id, field, value) => {
    setOverrides(prev => {
      const next = {
        ...prev,
        [id]: { ...prev[id], [field]: value }
      };
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
    if (filterHidden === 'visible') {
      jobs = jobs.filter(j => !(overrides[j.id]?.hidden ?? j.hidden));
    } else if (filterHidden === 'hidden') {
      jobs = jobs.filter(j => overrides[j.id]?.hidden ?? j.hidden);
    }
    jobs.sort((a, b) => {
      if (sortBy === 'postedAt') return b.postedAt.localeCompare(a.postedAt);
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'company') return (a.company || '').localeCompare(b.company || '');
      return 0;
    });
    return jobs;
  }, [search, sortBy, filterHidden, overrides]);

  const visibleCount = jobsData.filter(j => !(overrides[j.id]?.hidden ?? j.hidden)).length;
  const hiddenCount = jobsData.length - visibleCount;

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
    if (!token) { setPublishMsg({ type: 'error', text: '请先输入 GitHub Token' }); return; }
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

  const handleSaveToken = (val) => {
    setTokenState(val);
    saveToken(val);
    if (val) setShowTokenInput(false);
  };

  const reqText = (jobId) => {
    const ov = overrides[jobId]?.requirements;
    if (ov !== undefined) return ov.join('\n');
    return (jobsData.find(j => j.id === jobId)?.requirements || []).join('\n');
  };

  const setReqText = (jobId, text) => {
    const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
    updateField(jobId, 'requirements', lines);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            返回前台
          </Link>
          <h1 className="text-lg font-bold text-gray-900">管理后台</h1>
          <div className="ml-auto flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-400">
              显示 {visibleCount} / 隐藏 {hiddenCount} / 共 {jobsData.length}
            </span>
            {showTokenInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  placeholder="GitHub Personal Access Token"
                  value={token}
                  onChange={e => handleSaveToken(e.target.value)}
                  className="px-2 py-1.5 border border-gray-200 rounded text-sm w-48 outline-none focus:border-gray-400"
                />
                <button
                  onClick={() => setShowTokenInput(false)}
                  className="text-xs text-gray-500 hover:text-gray-900"
                >
                  收起
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowTokenInput(true)}
                className="text-xs text-gray-500 hover:text-gray-900 underline"
              >
                {token ? '已设置 Token' : '设置 Token'}
              </button>
            )}
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
            >
              <Download className="w-4 h-4" />
              导出 JSON
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-white ${
                publishing ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Upload className="w-4 h-4" />
              {publishing ? '发布中...' : '发布到网站'}
            </button>
          </div>
        </div>
        {publishMsg && (
          <div className={`max-w-7xl mx-auto px-4 py-2 text-xs ${
            publishMsg.type === 'success' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
          }`}>
            {publishMsg.text}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* 筛选栏 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex flex-wrap items-center gap-4">
          <input
            type="text"
            placeholder="搜索岗位或公司..."
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64 outline-none focus:border-gray-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">筛选</span>
            <div className="flex gap-1">
              {[
                { key: 'all', label: '全部' },
                { key: 'visible', label: '显示中' },
                { key: 'hidden', label: '已隐藏' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilterHidden(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filterHidden === f.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 岗位列表 */}
        <div className="space-y-3">
          {sortedJobs.map(job => {
            const isHidden = overrides[job.id]?.hidden ?? job.hidden ?? false;
            return (
              <div
                key={job.id}
                className={`bg-white rounded-lg border p-4 transition-all ${
                  isHidden ? 'border-gray-200 opacity-60' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <button
                    onClick={() => toggleHidden(job.id)}
                    className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isHidden ? 'bg-gray-100 text-gray-400 hover:bg-gray-200' : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                    title={isHidden ? '点击显示' : '点击隐藏'}
                  >
                    {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400 font-mono">{job.id}</span>
                      {isHidden && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                          已隐藏
                        </span>
                      )}
                    </div>
                  </div>
                  {savedId && savedId.startsWith(job.id) && (
                    <span className="text-xs text-green-600 font-medium animate-pulse">已保存</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">岗位名称</label>
                    <input
                      type="text"
                      value={overrides[job.id]?.title ?? job.title ?? ''}
                      onChange={e => updateField(job.id, 'title', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">公司名</label>
                    <input
                      type="text"
                      value={overrides[job.id]?.company ?? job.company ?? ''}
                      onChange={e => updateField(job.id, 'company', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">类型（逗号分隔）</label>
                    <input
                      type="text"
                      value={overrides[job.id]?.type ? overrides[job.id].type.join(',') : (job.type?.join(',') ?? '')}
                      onChange={e => updateField(job.id, 'type', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-gray-400"
                      placeholder="如：全职,外包,线下"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">地点</label>
                    <input
                      type="text"
                      value={overrides[job.id]?.location ?? job.location ?? ''}
                      onChange={e => updateField(job.id, 'location', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-gray-400"
                      placeholder="如：上海 / 远程"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">薪资</label>
                    <input
                      type="text"
                      value={overrides[job.id]?.salary ?? job.salary ?? ''}
                      onChange={e => updateField(job.id, 'salary', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">截止日期</label>
                    <input
                      type="text"
                      value={overrides[job.id]?.deadline ?? job.deadline ?? ''}
                      onChange={e => updateField(job.id, 'deadline', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-gray-400"
                      placeholder="如：2026-06-30 / 长期"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-xs text-gray-400 block mb-1">岗位描述（岗位职责）</label>
                  <textarea
                    value={overrides[job.id]?.fullDescription ?? job.fullDescription ?? ''}
                    onChange={e => updateField(job.id, 'fullDescription', e.target.value)}
                    rows={4}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-gray-400 font-mono"
                  />
                </div>

                <div className="mt-3">
                  <label className="text-xs text-gray-400 block mb-1">岗位要求（每行一条）</label>
                  <textarea
                    value={reqText(job.id)}
                    onChange={e => setReqText(job.id, e.target.value)}
                    rows={3}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-gray-400 font-mono"
                    placeholder="TEM-8&#10;3-5年游戏本地化经验&#10;有MOBA经验优先"
                  />
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                  <span>地点：{job.location || '未设置'}</span>
                  <span>·</span>
                  <span>类型：{job.type?.join(', ') || '未设置'}</span>
                  <span>·</span>
                  <span>发布：{job.postedAt}</span>
                </div>
              </div>
            );
          })}
        </div>

        {sortedJobs.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            没有匹配岗位
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
