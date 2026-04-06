import React from 'react';
import { ChevronRight, MapPin, Clock, Banknote, Zap } from 'lucide-react';

const ProjectCard = ({ project, onClick }) => {
  return (
    <div 
      className="bg-white rounded-xl p-4 cursor-pointer border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
      onClick={() => onClick(project)}
    >
      {/* 顶部：职位标题 + 薪资 */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-[15px] font-semibold text-gray-900 leading-snug flex-1">
          {project.position}
        </h3>
        <span className="text-[13px] font-semibold text-primary whitespace-nowrap">
          {project.salary}
        </span>
      </div>
      
      {/* 公司名 */}
      <p className="text-[13px] text-gray-500 mb-3">{project.company_name}</p>
      
      {/* 标签 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {project.company_tags.slice(0, 4).map((tag, index) => (
          <span 
            key={index} 
            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded"
          >
            {tag}
          </span>
        ))}
        {project.is_urgent && (
          <span className="px-2 py-0.5 bg-accent-light text-accent text-[11px] rounded flex items-center gap-0.5">
            <Zap className="w-3 h-3" />
            急招
          </span>
        )}
      </div>

      {/* 描述 - 精简 */}
      <p className="text-[13px] text-gray-600 line-clamp-1 mb-3">
        {project.description}
      </p>

      {/* 底部信息：地点 + 截止时间 */}
      <div className="flex items-center gap-4 text-[12px] text-gray-400">
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{project.location}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{project.deadline}</span>
        </div>
        <div className="ml-auto flex items-center text-gray-300">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;