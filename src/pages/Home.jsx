import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, SlidersHorizontal, Search } from 'lucide-react';
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
      {/* Header - 简洁专业 */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Remote Q</h1>
            <p className="text-sm text-gray-500 mt-0.5">翻译 · 本地化 · 远程工作</p>
          </div>
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        {/* Search */}
        <div className="flex gap-2">
          <div 
            className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-gray-100 rounded-lg cursor-text"
            onClick={handleSearchFocus}
          >
            <Search className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">搜索项目、公司、语言...</span>
          </div>
          <button className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <SlidersHorizontal className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                activeFilter === filter 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Project List */}
      <div className="px-4 py-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-medium text-gray-500">共 {filteredProjects.length} 个项目</h2>
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