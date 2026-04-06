import React from 'react';

// 将日期转换为简写时间
const getShortTime = (dateStr) => {
  const date = new Date(dateStr + '-01');
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0 || diffDays === 0) return '今天';
  if (diffDays === 1) return '1D';
  if (diffDays < 7) return `${diffDays}D`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}W`;
  return `${Math.floor(diffDays / 30)}M`;
};

// 时间颜色
const getTimeColor = (timeStr) => {
  if (timeStr === '今天' || timeStr === '1D') return 'text-secondary font-medium';
  return 'text-gray-400';
};

const ProjectCard = ({ project, onClick }) => {
  const shortTime = getShortTime(project.created_at);
  
  return (
    <div 
      className="bg-white rounded-xl p-4 cursor-pointer border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
      onClick={() => onClick(project)}
    >
      {/* 顶部：职位标题 + 时间 */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-[16px] font-semibold text-gray-900 leading-snug flex-1 line-clamp-2">
          {project.position}
        </h3>
        <span className={`text-[12px] whitespace-nowrap ${getTimeColor(shortTime)}`}>
          {shortTime}
        </span>
      </div>
      
      {/* 标签行 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 工作类型标签（灰底） */}
        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded">
          {project.location}
        </span>
        
        {/* 技能/领域标签（最多3个） */}
        {project.company_tags.slice(0, 3).map((tag, index) => (
          <span 
            key={index} 
            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded"
          >
            {tag}
          </span>
        ))}
        
        {/* 急招标签（黄色突出） */}
        {project.is_urgent && (
          <span className="px-2 py-0.5 bg-accent-light text-accent text-[11px] rounded font-medium">
            急招
          </span>
        )}
        
        {/* 公开/私密状态（右侧） */}
        <div className="ml-auto flex items-center gap-1">
          <span className="text-[11px] text-gray-400">公开</span>
          <span className="w-2 h-2 bg-secondary rounded-full"></span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;