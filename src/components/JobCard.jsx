import React from 'react';
import { MapPin, Clock, DollarSign, Globe, ChevronRight } from 'lucide-react';
import Tag from './Tag';

const JobCard = ({ job, onClick }) => {
  // 岗位形式标签颜色映射
  const typeColorMap = {
    '全职': 'blue',
    '兼职': 'green',
    '外包': 'orange',
    '线上': 'purple',
    '线下': 'red',
    '实习': 'gray'
  };

  // 内部岗位特殊样式
  const isInternal = job.internalOnly;

  return (
    <div 
      className={`bg-white rounded-xl p-4 mb-3 cursor-pointer active:scale-98 transition-transform hover:shadow-md ${
        isInternal ? 'border-l-4 border-orange-400' : ''
      }`}
      onClick={() => onClick(job)}
    >
      {/* 头部：岗位名称 + 薪资 */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-gray-900">{job.title}</h3>
            {isInternal && (
              <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 text-xs rounded border border-orange-100">
                社群专享
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {job.type?.map((t, index) => (
              <Tag key={index} variant={typeColorMap[t] || 'default'}>
                {t}
              </Tag>
            ))}
          </div>
        </div>
        <div className="text-right ml-3">
          <div className="text-lg font-bold text-orange-500">{job.salary}</div>
        </div>
      </div>

      {/* 岗位元信息 */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-500">
        {job.location && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{job.location}</span>
          </div>
        )}
        {job.languagePair && (
          <div className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            <span>{job.languagePair}</span>
          </div>
        )}
        {job.gameType && (
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
              {job.gameType}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{job.postedAt || '近期'}</span>
        </div>
      </div>

      {/* 岗位描述摘要 */}
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
        {isInternal ? '该岗位仅限社群会员查看详细信息，加入后可了解完整岗位描述与投递方式。' : job.description}
      </p>

      {/* 岗位要求要点 */}
      {job.requirements && job.requirements.length > 0 && (
        <div className="mb-3">
          <ul className="space-y-1">
            {job.requirements.slice(0, 3).map((req, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 shrink-0" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 底部：查看详情 */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          编号 #{job.id}
        </span>
        <div className="flex items-center text-orange-500 text-sm font-medium">
          <span>了解详情</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export default JobCard;
