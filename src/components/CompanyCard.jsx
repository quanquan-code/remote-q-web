import React from 'react';
import { ChevronRight } from 'lucide-react';
import Tag from './Tag';

const CompanyCard = ({ company, onClick }) => {
  return (
    <div 
      className="bg-white rounded-xl p-4 mb-3 cursor-pointer active:scale-98 transition-transform"
      onClick={() => onClick(company)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-base font-semibold text-gray-900">{company.name}</h3>
        <span className="text-xs text-gray-400">{company.timeAgo}</span>
      </div>
      
      <div className="flex flex-wrap gap-1.5 mb-2">
        {company.tags.map((tag, index) => (
          <Tag key={index} variant={index < 2 ? 'primary' : 'default'}>
            {tag}
          </Tag>
        ))}
      </div>
      
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
        {company.description}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {company.rating}
          </span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= Math.floor(company.rating)
                    ? 'text-primary fill-primary'
                    : 'text-gray-300'
                }`}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-gray-400">
            ({company.reviewCount})
          </span>
        </div>
        
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
};

export default CompanyCard;