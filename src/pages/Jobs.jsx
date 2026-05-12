import React, { useState, useMemo } from 'react';
import { Search, Users, Briefcase, Lock } from 'lucide-react';
import JobCard from '../components/JobCard';
import jobsData from '../data/jobs.json';

const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('全部');
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const jobTypes = ['全部', '全职', '兼职', '外包', '线上', '线下'];

  const filteredJobs = useMemo(() => {
    let jobs = jobsData;
    if (selectedType !== '全部') {
      jobs = jobs.filter(job => job.type?.some(t => t.includes(selectedType)));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      jobs = jobs.filter(job =>
        job.title?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.languagePair?.toLowerCase().includes(query) ||
        job.gameType?.toLowerCase().includes(query)
      );
    }
    return jobs;
  }, [searchQuery, selectedType]);

  const stats = useMemo(() => ({
    total: jobsData.length,
    fullTime: jobsData.filter(j => j.type?.some(t => t.includes('全职'))).length,
    partTime: jobsData.filter(j => j.type?.some(t => t.includes('兼职'))).length,
    remote: jobsData.filter(j => j.type?.some(t => t.includes('线上'))).length,
  }), []);

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setShowMembershipModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部横幅 */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">帮招广场</h1>
            <p className="text-sm text-orange-100 mt-1">优质翻译/本地化岗位聚合</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg p-2 text-center">
            <div className="text-lg font-bold">{stats.total}+</div>
            <div className="text-xs text-orange-100">累计岗位</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
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
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索岗位、语种、游戏类型..."
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

      {/* 类型筛选 */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {jobTypes.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedType === type ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 岗位列表 */}
      <div className="px-4 mt-4">
        {filteredJobs.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">共 {filteredJobs.length} 个岗位</span>
            </div>
            {filteredJobs.map(job => (
              <JobCard key={job.id} job={job} onClick={handleJobClick} />
            ))}
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
      <div className="px-4 mt-6">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
          <div className="flex items-start gap-3">
            <div className="bg-orange-100 rounded-full p-2">
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">加入付费社群</h3>
              <p className="text-sm text-gray-600 mt-1">
                1300+ 译者/本地化人的圈子，解锁全部岗位投递方式
              </p>
              <div className="flex gap-2 mt-3">
                <button 
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm font-medium"
                  onClick={() => window.open('https://mp.weixin.qq.com/s/...', '_blank')}
                >
                  了解社群
                </button>
                <button 
                  className="flex-1 bg-white text-orange-500 border border-orange-200 py-2 rounded-lg text-sm font-medium"
                  onClick={() => window.open('weixin://...', '_blank')}
                >
                  加微信咨询
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 会员弹窗 */}
      {showMembershipModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowMembershipModal(false)}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold">该岗位仅对会员开放</h3>
              <p className="text-sm text-gray-500 mt-1">
                加入圈圈付费社群，解锁完整岗位信息与投递方式
              </p>
            </div>

            {selectedJob && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="text-sm font-medium">{selectedJob.title}</div>
                <div className="text-sm text-orange-500 mt-1">{selectedJob.salary}</div>
              </div>
            )}

            <button 
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium mb-2"
              onClick={() => window.open('https://mp.weixin.qq.com/s/...', '_blank')}
            >
              了解付费社群
            </button>
            <button 
              className="w-full bg-white text-gray-600 py-3 rounded-xl font-medium border border-gray-200"
              onClick={() => setShowMembershipModal(false)}
            >
              再看看其他岗位
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;