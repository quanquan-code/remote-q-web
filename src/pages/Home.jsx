import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, SlidersHorizontal, Sparkles } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import ProjectCard from '../components/ProjectCard';
import BottomNav from '../components/BottomNav';
import { projects, filters } from '../data/mockData';

const Home = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState('全部');

  const handleProjectClick = (project) => {
    navigate(`/project/${project.id}`);
  };

  const handleSearchFocus = () => {
    navigate('/search');
  };

  const filteredProjects = useMemo(() => {
    const filtered = activeFilter === '全部' 
      ? projects 
      : projects.filter(p => p.company_tags.includes(activeFilter) || p.position.includes(activeFilter));
    
    // 按创建日期从近到远排序
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at + '-01');
      const dateB = new Date(b.created_at + '-01');
      return dateB - dateA;
    });
  }, [activeFilter]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header - Notion 风格，简洁留白 */}
      <div className="bg-white px-5 pt-14 pb-5">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Remote Q</h1>
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-gray-500 font-medium">发现优质翻译机会</p>
          </div>
          <button className="relative p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors btn-active">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
          </button>
        </div>
        
        {/* Search - 更柔和的设计 */}
        <div className="flex gap-3">
          <div className="flex-1">
            <SearchBar 
              onFocus={handleSearchFocus}
              value={searchValue}
              onChange={setSearchValue}
              placeholder="搜索项目、公司、语言..."
            />
          </div>
          <button className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors btn-active">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Quick Filters - 活泼的配色 */}
        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all btn-active ${
                activeFilter === filter 
                  ? 'bg-primary text-white shadow-soft' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Banner - 增加活力感 */}
      <div className="px-5 py-4">
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">今日新增</p>
            <p className="text-lg font-bold text-gray-900">{filteredProjects.length} <span className="text-sm font-normal text-gray-500">个项目</span></p>
          </div>
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-white"></div>
            <div className="w-8 h-8 rounded-full bg-secondary/20 border-2 border-white"></div>
            <div className="w-8 h-8 rounded-full bg-accent/40 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-700">+</div>
          </div>
        </div>
      </div>

      {/* Project List - 更有质感的卡片 */}
      <div className="px-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-900">最新机会</h2>
          <button className="text-sm text-primary font-medium hover:text-primary-dark transition-colors">
            查看全部
          </button>
        </div>
        
        <div className="space-y-3">
          {filteredProjects.map(project => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onClick={handleProjectClick}
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;