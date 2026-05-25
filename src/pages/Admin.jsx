import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Download, Save } from 'lucide-react';
import jobsData from '../data/jobs.json';

const STORAGE_KEY = 'remote_q_admin_overrides';

function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
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
      ...(ov.fullDescription !== undefined && { fullDescription: ov.fullDescription }),
    };
  });
  return JSON.stringify(merged, null, 2);
}

const Admin = () => {
  const [overrides, setOverrides] = useState(loadOverrides);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('postedAt');
  const [filterHidden, setFilterHidden] = useState('all'); // all | visible | hidden
  const [savedId, setSavedId] = useState(null); // 显示保存提示

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            返回前台
          </Link>
          <h1 className="text-lg font-bold text-gray-900">管理后台</h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-gray-400">
              显示 {visibleCount} / 隐藏 {hiddenCount} / 共 {jobsData.length}
            </span>
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
            >
              <Download className="w-4 h-4" />
              导出 jobs.json
            </button>
          </div>
        </div>
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
                  <label className="text-xs text-gray-400 block mb-1">岗位描述（岗位要求）</label>
                  <textarea
                    value={overrides[job.id]?.fullDescription ?? job.fullDescription ?? ''}
                    onChange={e => updateField(job.id, 'fullDescription', e.target.value)}
                    rows={4}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-gray-400 font-mono"
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
