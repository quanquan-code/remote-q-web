import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ onFocus, onChange, value, placeholder = '搜索公司/关键词' }) => {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="w-full bg-gray-100 rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/20"
      />
    </div>
  );
};

export default SearchBar;