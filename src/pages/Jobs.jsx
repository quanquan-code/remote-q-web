import React, { useState, useMemo } from 'react';
import { Search, MapPin, Clock, ChevronRight, Globe, Briefcase } from 'lucide-react';
import jobsData from '../data/jobs.json';

const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('全部');
  const [selectedType, setSelectedType] = useState('全部');
  const [selectedStatus, setSelectedStatus] = useState('全部');

  // 筛选选项
  const locationFilters = ['全部', '远程', '线下'];
  const typeFilters = ['全部', '兼职', '全职', '外包', '正编'];
  const statusFilters = ['全部', '在招'];

  const filteredJobs = useMemo(() => {
    let jobs = jobsData;
    
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
    if (selectedLocation !== '全部') {
      if (selectedLocation === '远程') {
        jobs = jobs.filter(job => 
          job.location?.includes('远程') || job.type?.some(t => t.includes('线上'))
        );
      } else if (selectedLocation === '线下') {
        jobs = jobs.filter(job => 
          job.location?.includes('北京') || job.location?.includes('上海') || 
          job.location?.includes('广州') || job.location?.includes('深圳') ||
          job.location?.includes('杭州') || job.location?.includes('成都') ||
          job.location?.includes('苏州') || job.location?.includes('珠海') ||
          job.location?.includes('长沙') || job.location?.includes('厦门') ||
          job.location?.includes('汕头') || job.location?.includes('南京') ||
          job.location?.includes('武汉') || job.location?.includes('郑州') ||
          job.location?.includes('东京') || job.type?.some(t => t.includes('线下'))
        );
      }
    }
    
    // 兼职/全职/外包/正编筛选
    if (selectedType !== '全部') {
      jobs = jobs.filter(job => job.type?.some(t => t.includes(selectedType)));
    }
    
    // 在招筛选（暂按全部显示，后续可接入状态字段）
    if (selectedStatus === '在招') {
      // 目前所有数据默认视为在招
      jobs = jobs.filter(job => !job.internalOnly);
    }
    
    return jobs;
  }, [searchQuery, selectedLocation, selectedType, selectedStatus]);

  // 岗位形式标签颜色
  const typeColorMap = {
    '全职': 'bg-blue-50 text-blue-600',
    '兼职': 'bg-green-50 text-green-600',
    '外包': 'bg-orange-50 text-orange-600',
    '线上': 'bg-purple-50 text-purple-600',
    '线下': 'bg-red-50 text-red-600',
    '实习': 'bg-gray-50 text-gray-600',
    '正编': 'bg-indigo-50 text-indigo-600'
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部区域 */}
      <div className="max-w-5xl mx-auto px-6 pt-10 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">在招职位</h1>
        <p className="text-gray-500 text-sm">
          共 {jobsData.length} 个优质翻译/本地化岗位 —— 包含兼职、全职、外包与远程机会。
        </p>
      </div>

      {/* 筛选区 */}
      <div className="max-w-5xl mx-auto px-6 pb-6">
        {/* 搜索 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索岗位、公司、语种..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs hover:text-gray-600"
              onClick={() => setSearchQuery('')}
            >
              清除
            </button>
          )}
        </div>

        {/* 筛选项 */}
        <div className="flex flex-wrap gap-4">
          {/* 远程/线下 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">工作方式</span>
            <div className="flex gap-1">
              {locationFilters.map(filter => (
                <button
                  key={filter}
                  onClick={() => setSelectedLocation(filter)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedLocation === filter 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* 兼职/全职/外包/正编 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">岗位形式</span>
            <div className="flex gap-1">
              {typeFilters.map(filter => (
                <button
                  key={filter}
                  onClick={() => setSelectedType(filter)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedType === filter 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* 在招 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">状态</span>
            <div className="flex gap-1">
              {statusFilters.map(filter => (
                <button
                  key={filter}
                  onClick={() => setSelectedStatus(filter)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedStatus === filter 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="text-sm text-gray-400 mb-4">
          共 {filteredJobs.length} 个岗位
        </div>

        {filteredJobs.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredJobs.map(job => (
              <div 
                key={job.id} 
                className="py-5 flex items-start justify-between group hover:bg-gray-50 transition-colors cursor-pointer rounded-lg px-2 -mx-2"
              >
                {/* 左侧：公司信息 */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* 公司标识占位 */}
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs font-bold text-gray-400">
                    {job.company?.slice(0, 2) || '公司'}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    {/* 职位标题 */}
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                      {job.title}
                    </h3>
                    
                    {/* 公司与地点 */}
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <span>{job.company}</span>
                      <span className="text-gray-300">·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                    </div>
                    
                    {/* 标签 */}
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
                    </div>
                  </div>
                </div>

                {/* 右侧：薪资与时间 */}
                <div className="text-right shrink-0 ml-4">
                  <div className="text-base font-semibold text-gray-900">
                    {job.salary}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {job.postedAt}
                  </div>
                </div>
              </div>
            ))}
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
  );
};

export default Jobs;