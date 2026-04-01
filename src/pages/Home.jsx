import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, SlidersHorizontal } from 'lucide-react';
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

  const filteredProjects = activeFilter === '全部' 
    ? projects 
    : projects.filter(p => p.company_tags.includes(activeFilter) || p.position.includes(activeFilter));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Remote Q</h1>
            <p className="text-sm text-gray-500">翻译项目直推平台</p>
          </div>
          <button className="relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
        
        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchBar 
              onFocus={handleSearchFocus}
              value={searchValue}
              onChange={setSearchValue}
              placeholder="搜索项目、公司、标签"
            />
          </div>
          <button className="flex items-center justify-center w-11 h-11 bg-gray-100 rounded-xl">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                activeFilter === filter 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Project List */}
      <div className="px-4 mt-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold text-gray-900">最新项目</h2>
          <span className="text-sm text-gray-500">共 {filteredProjects.length} 个</span>
        </div>
        
        {filteredProjects.map(project => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            onClick={handleProjectClick}
          />
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;