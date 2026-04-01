import React from 'react';
import { ChevronRight, MapPin, Clock, Banknote, Zap } from 'lucide-react';
import Tag from './Tag';

const ProjectCard = ({ project, onClick }) => {
  return (
    <div 
      className="bg-white rounded-2xl p-5 cursor-pointer card-hover border border-gray-100/50 shadow-card"
      onClick={() => onClick(project)}
    >
      {/* Header: Company & Date */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-primary">{project.company_name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">{project.company_name}</h3>
            <p className="text-xs text-gray-400">{project.created_at} 发布</p>
          </div>
        </div>
        {project.is_urgent && (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-accent/30 text-amber-700 text-xs font-bold rounded-lg flex-shrink-0">
            <Zap className="w-3 h-3" />
            急招
          </span>
        )}
      </div>
      
      {/* Position Title - 更突出 */}
      <h4 className="text-sm font-bold text-gray-800 mb-3 leading-relaxed">{project.position}</h4>
      
      {/* Tags - 更活泼的配色 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {project.company_tags.slice(0, 3).map((tag, index) => (
          <span 
            key={index} 
            className={`tag ${
              index === 0 ? 'bg-primary/10 text-primary' : 
              index === 1 ? 'bg-secondary/10 text-secondary' : 
              'bg-gray-100 text-gray-600'
            }`}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Description - 简洁 */}
      <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
        {project.description}
      </p>

      {/* Meta Info - 更清晰的分组 */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-secondary/10 flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-secondary" />
          </div>
          <span>{project.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-primary" />
          </div>
          <span>{project.deadline}</span>
        </div>
      </div>
      
      {/* Footer - 薪资突出 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <Banknote className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-primary">{project.salary}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <span className="text-xs">查看详情</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;