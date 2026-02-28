import React from 'react';

interface HandbookCardProps {
  type?: 'info' | 'warning' | 'success' | 'script';
  children: React.ReactNode;
}

const typeStyles = {
  info: 'border-blue-400 bg-blue-50',
  warning: 'border-yellow-400 bg-yellow-50',
  success: 'border-green-400 bg-green-50',
  script: 'border-purple-400 bg-purple-50',
};

const HandbookCard: React.FC<HandbookCardProps> = ({ type = 'info', children }) => (
  <div className={`border-l-4 p-4 my-4 rounded ${typeStyles[type]}`}>
    {children}
  </div>
);

export default HandbookCard; 