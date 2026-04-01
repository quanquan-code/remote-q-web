import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, MapPin, Clock, Banknote, Building2, Mail, MessageCircle } from 'lucide-react';
import Tag from '../components/Tag';
import { projects, companies } from '../data/mockData';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(false);
  
  const project = projects.find(p => p.id === parseInt(id));
  
  if (!project) {
    return <div className="p-4">项目不存在</div>;
  }

  // 查找对应的公司评价
  const company = companies.find(c => project.company_name.includes(c.name) || c.name.includes(project.company_name));

  const handleUnlock = () => {
    setUnlocked(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold truncate">{project.position}</h1>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="mx-4 mt-4 space-y-3">
        {/* Company Card */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">{project.company_name}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {project.company_tags.map((tag, index) => (
                  <Tag key={index} variant="primary">{tag}</Tag>
                ))}
              </div>
            </div>
            {company && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-primary font-medium">{company.rating}</span>
                  <span className="text-gray-400">({company.reviewCount}条评价)</span>
                </div>
              </div>
            )}
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{project.location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>截止：{project.deadline}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Banknote className="w-4 h-4" />
              <span>{project.salary}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-gray-400">付款：</span>
              <span>{project.payment_terms}</span>
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-2">项目详情</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{project.description}</p>
          
          <h4 className="font-medium text-gray-900 mb-2">任职要求</h4>
          <p className="text-sm text-gray-600 leading-relaxed">{project.requirements}</p>
        </div>

        {/* Contact Info - Locked */}
        {unlocked ? (
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-3">联系方式</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">微信/电话</p>
                  <p className="font-medium text-gray-900">{project.contact}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">邮箱</p>
                  <p className="font-medium text-gray-900">{project.email}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-primary-light to-orange-50 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">解锁联系方式</h3>
            <p className="text-sm text-gray-500 mb-4">支付 ¥9.9 查看完整联系方式</p>
            
            <button 
              onClick={handleUnlock}
              className="w-full bg-primary text-white py-3 rounded-full font-medium"
            >
              立即解锁
            </button>
            
            <p className="text-xs text-gray-400 mt-3">已帮助 2,847 位译者成功对接项目</p>
          </div>
        )}

        {/* Company Reviews Preview */}
        {company && (
          <div className="bg-white rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-900">公司评价</h3>
              <span className="text-sm text-primary">查看全部 ></span>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900">{company.rating}</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${
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
              <span className="text-sm text-gray-400">{company.reviewCount} 条评价</span>
            </div>
            
            <p className="text-sm text-gray-600">{company.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;