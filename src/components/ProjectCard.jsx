import React from 'react';
import { ChevronRight, MapPin, Clock, Banknote } from 'lucide-react';
import Tag from './Tag';

const ProjectCard = ({ project, onClick }) => {
  return (
    <div 
      className="bg-white rounded-xl p-4 mb-3 cursor-pointer active:scale-98 transition-transform border border-gray-100"
      onClick={() => onClick(project)}
    >
      {/* Header: Company & Urgent Tag */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">{project.company_name}</h3>
          {project.is_urgent && (
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">急招</span>
          )}
        </div>
        <span className="text-xs text-gray-400">{project.created_at}</span>
      </div>
      
      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {project.company_tags.map((tag, index) => (
          <Tag key={index} variant={index < 2 ? 'primary' : 'default'}>
            {tag}
          </Tag>
        ))}
      </div>

      {/* Position Title */}
      <h4 className="text-sm font-medium text-gray-800 mb-2">{project.position}</h4>
      
      {/* Description */}
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
        {project.description}
      </p>

      {/* Meta Info */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{project.location}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>截止：{project.deadline}</span>
        </div>
        <div className="flex items-center gap-1">
          <Banknote className="w-3.5 h-3.5" />
          <span>{project.salary}</span>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          付款周期：{project.payment_terms}
        </span>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
};

export default ProjectCard;