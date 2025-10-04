
import React from 'react';

interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({ title, description, children, className = '', icon, noPadding = false }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {(title || icon) && (
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center">
            {icon && <div className="mr-3 text-primary">{icon}</div>}
            <div>
                {title && <h2 className="text-xl font-bold text-gray-800">{title}</h2>}
                {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
            </div>
        </div>
      )}
      <div className={noPadding ? '' : 'p-6 space-y-4'}>
        {children}
      </div>
    </div>
  );
};

export default Card;
