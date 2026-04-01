import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Edit3 } from 'lucide-react';
import Tag from '../components/Tag';
import { companies } from '../data/mockData';

const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(false);
  
  const company = companies.find(c => c.id === parseInt(id));
  
  if (!company) {
    return <div className="p-4">公司不存在</div>;
  }

  const handleUnlock = () => {
    setUnlocked(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-lg font-semibold">{company.name}</span>
          <span className="text-xs text-gray-400 ml-auto">{company.timeAgo}</span>
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-white mx-4 mt-4 p-4 rounded-xl">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {company.tags.map((tag, index) => (
            <Tag key={index} variant={index < 3 ? 'primary' : 'default'}>
              {tag}
            </Tag>
          ))}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          {company.description}
        </p>

        {/* Contact Info */}
        {unlocked || company.unlocked ? (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">官网：</span>
              <a href={company.website} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                {company.website}
              </a>
            </div>
            <div>
              <span className="text-gray-500">联系方式：</span>
              <span className="text-gray-900">{company.contact}</span>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <Lock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">解锁后查看联系方式和全部评价</p>
            <button 
              onClick={handleUnlock}
              className="bg-primary text-white px-6 py-2 rounded-full text-sm font-medium"
            >
              解锁（消耗1次查询）
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <button className="flex-1 bg-primary text-white py-3 rounded-full text-sm font-medium">
            {unlocked || company.unlocked ? `已解锁点评 (${company.reviewCount})` : '解锁点评'}
          </button>
          <button className="flex items-center justify-center gap-1 px-4 py-3 border border-gray-300 rounded-full text-sm">
            <Edit3 className="w-4 h-4" />
            投稿
          </button>
        </div>
      </div>

      {/* Reviews */}
      {(unlocked || company.unlocked) && company.reviews.length > 0 && (
        <div className="mx-4 mt-4">
          <h3 className="text-base font-semibold mb-3">评价</h3>
          
          {company.reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl p-4 mb-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">{review.date}</span>
                  {review.isPositive && (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1.5 mb-2">
                {review.tags.map((tag, idx) => (
                  <Tag key={idx} variant="default">{tag}</Tag>
                ))}
              </div>
              
              <p className="text-sm text-gray-700 leading-relaxed">{review.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyDetail;