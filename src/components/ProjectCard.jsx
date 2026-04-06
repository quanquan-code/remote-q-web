import React from 'react';
import { MapPin, Clock } from 'lucide-react';

// 将日期转换为相对时间
const getRelativeTime = (dateStr) => {
  const date = new Date(dateStr + '-01');
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return '今天';
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 3) return `${diffDays}天前`;
  if (diffDays < 7) return '本周';
  return '更早';
};

const ProjectCard = ({ project, onClick }) => {
  const relativeTime = getRelativeTime(project.created_at);
  
  // 时间颜色：越新越深
  const getTimeColor = (time) => {
    if (time === '今天') return 'text-secondary font-medium';
    if (time === '昨天') return 'text-secondary/80';
    if (time === '3天前' || time === '本周') return 'text-gray-500';
    return 'text-gray-400';
  };
  
  return (
    <div 
      className={`bg-white rounded-xl p-4 cursor-pointer border transition-all duration-200 hover:shadow-md ${
        project.is_urgent 
          ? 'border-accent shadow-sm relative overflow-hidden' 
          : 'border-gray-100 hover:border-gray-200'
      }`}
      onClick={() => onClick(project)}
    >
      {/* 急招左边红线 */}
      {project.is_urgent && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent"></div>
      )}
      
      <div className={project.is_urgent ? 'pl-2' : ''}>
        {/* 顶部：职位标题（两行）+ 时间 */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-[15px] font-semibold text-gray-900 leading-snug flex-1 line-clamp-2">
            {project.position}
          </h3>
          <span className={`text-[11px] whitespace-nowrap mt-0.5 ${getTimeColor(relativeTime)}`}>
            {relativeTime}
          </span>
        </div>
        
        {/* 公司名 */}
        <p className="text-[13px] text-gray-500 mb-2">{project.company_name}</p>
        
        {/* 介绍（两行） */}
        <p className="text-[13px] text-gray-600 line-clamp-2 mb-3 leading-relaxed">
          {project.description}
        </p>
        
        {/* 标签 */}
        <div className="flex flex-wrap gap-1.5">
          {project.company_tags.slice(0, 4).map((tag, index) => (
            <span 
              key={index} 
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded"
            >
              {tag}
            </span>
          ))}
          {project.is_urgent && (
            <span className="px-2 py-0.5 bg-accent-light text-accent text-[11px] rounded">
              急招
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;