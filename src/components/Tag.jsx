import React from 'react';

const Tag = ({ children, variant = 'default' }) => {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 text-xs rounded-full';
  
  const variants = {
    default: 'bg-gray-100 text-gray-600',
    primary: 'bg-primary-light text-gray-700',
    highlight: 'bg-orange-100 text-orange-600',
    outline: 'border border-gray-300 text-gray-600'
  };

  return (
    <span className={`${baseStyles} ${variants[variant]}`}>
      {children}
    </span>
  );
};

export default Tag;