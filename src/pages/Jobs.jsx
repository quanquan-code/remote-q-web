import React, { useState, useMemo } from 'react';
import { Search, MapPin, Clock, Globe, Building2, Briefcase } from 'lucide-react';
import jobsData from '../data/jobs.json';

const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('全部');
  const [selectedType, setSelectedType] = useState('全部');
  const [selectedStatus, setSelectedStatus] = useState('全部');

  // 筛选选项
  const locationFilters = ['全部', '远程', '线下'];
  const typeFilters = ['全部', '兼职', '全职', '外包', '正编'];
  const statusFilters = ['全部', '在招'];

  // 提取所有公司
  const companies = useMemo(() => {
    const companyMap = new Map();
    jobsData.forEach(job => {
      if (!companyMap.has(job.company)) {
        companyMap.set(job.company, {
          name: job.company,
          jobs: [],
          location: job.location
        });
      }
      companyMap.get(job.company).jobs.push(job);
    });
    return Array.from(companyMap.values());
  }, []);

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
    
    // 公司筛选
    if (selectedCompany) {
      jobs = jobs.filter(job => job.company === selectedCompany);
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
    
    // 在招筛选
    if (selectedStatus === '在招') {
      jobs = jobs.filter(job => !job.internalOnly);
    }
    
    return jobs;
  }, [searchQuery, selectedCompany, selectedLocation, selectedType, selectedStatus]);

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
    <div className="min-h-screen bg-gray-50">
      {/* 顶部搜索栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900 shrink-0">Remote Q</h1>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索公司、职位、语种..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* 左侧公司列表 */}
          <div className="w-64 shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  公司列表
                </h2>
                <p className="text-xs text-gray-500 mt-1">共 {companies.length} 家公司</p>
              </div>
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                <button
                  onClick={() => setSelectedCompany(null)}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors border-b border-gray-50 ${
                    selectedCompany === null ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  全部公司
                  <span className="ml-2 text-xs text-gray-400">({jobsData.length})</span>
                </button>
                {companies.map(company => (
                  <button
                    key={company.name}
                    onClick={() => setSelectedCompany(company.name)}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors border-b border-gray-50 ${
                      selectedCompany === company.name ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{company.name}</span>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">{company.jobs.length}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧职位列表 */}
          <div className="flex-1">
            {/* 筛选标签 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <div className="flex flex-wrap gap-4">
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
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  在招职位
                </h2>
                <span className="text-sm text-gray-500">共 {filteredJobs.length} 个岗位</span>
              </div>

              {filteredJobs.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredJobs.map(job => (
                    <div 
                      key={job.id} 
                      className="px-4 py-4 flex items-start justify-between group hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-xs font-bold text-gray-500">
                          {job.company?.slice(0, 2) || '公司'}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                            {job.title}
                          </h3>
                          
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <span>{job.company}</span>
                            <span className="text-gray-300">·</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {job.location}
                            </span>
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
                          </div>
                        </div>
                      </div>

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
        </div>
      </div>
    </div>
  );
};

export default Jobs;