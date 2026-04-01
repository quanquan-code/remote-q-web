import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, TrendingUp, X } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { recentSearches, hotSearches } from '../data/mockData';

const Search = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleBack = () => {
    navigate(-1);
  };

  const handleSearch = (term) => {
    setSearchValue(term);
    // 实际项目中这里会执行搜索
    console.log('Search:', term);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={handleBack} className="p-1">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <SearchBar 
            value={searchValue}
            onChange={setSearchValue}
            placeholder="搜索公司/关键词"
            autoFocus
          />
        </div>
      </div>

      {/* Recent Searches */}
      <div className="px-4 py-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">最近搜索</span>
          </div>
          <button className="text-xs text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {recentSearches.map((term, index) => (
            <button
              key={index}
              onClick={() => handleSearch(term)}
              className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-600"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Hot Searches */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">热门搜索</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {hotSearches.map((term, index) => (
            <button
              key={index}
              onClick={() => handleSearch(term)}
              className="px-3 py-1.5 bg-orange-50 rounded-full text-sm text-orange-600"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Search;