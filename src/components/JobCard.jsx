import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import Tag from './Tag';

const JobCard = ({ job, onClick }) => {
  // 岗位形式标签颜色映射
  const typeColorMap = {
    '全职': 'blue',
    '兼职': 'green',
    '外包': 'orange',
    '线上': 'purple',
    '线下': 'red',
    '实习': 'gray',
    '内部': 'orange',
    '正编': 'blue',
    '公开': 'green'
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
      {/* 第一行：岗位名称 */}
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-base font-semibold text-gray-900 leading-snug">{job.title}</h3>
        {isInternal && (
          <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 text-xs rounded border border-orange-100 shrink-0">
            社群专享
          </span>
        )}
      </div>

      {/* 第二行：薪资（黑色加粗，略小） */}
      <div className="text-sm font-bold text-gray-900 mb-2">
        {job.salary || '面议'}
        {job.salaryNote && <span className="text-xs font-normal text-gray-500 ml-1">{job.salaryNote}</span>}
      </div>

      {/* 第三行：其他要素 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
        {job.company && (
          <span className="truncate max-w-[200px]">{job.company}</span>
        )}
        {job.location && (
          <span className="flex items-center gap-1">
            <span className="text-gray-300">·</span>
            <MapPin className="w-3 h-3" />
            <span>{job.location}</span>
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="text-gray-300">·</span>
          <Clock className="w-3 h-3" />
          <span>{job.postedAt || '近期'}</span>
        </span>
        {job.paymentCycle && (
          <span className="flex items-center gap-1">
            <span className="text-gray-300">·</span>
            <span>{job.paymentCycle}</span>
          </span>
        )}
      </div>

      {/* 标签 */}
      <div className="flex flex-wrap gap-1.5">
        {job.type?.map((t, index) => (
          <Tag key={index} variant={typeColorMap[t] || 'default'}>
            {t}
          </Tag>
        ))}
      </div>
    </div>
  );
};

export default JobCard;