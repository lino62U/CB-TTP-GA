
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  icon?: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, id, icon, children, ...props }) => {
  const isMultiple = props.multiple;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
       <div className="relative">
        {icon && (
             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">{icon}</span>
            </div>
        )}
      <select
        id={id}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-light focus:ring-primary-light sm:text-sm p-3 bg-white ${icon ? 'pl-10' : ''}`}
        {...props}
      >
        {children}
      </select>
       </div>
    </div>
  );
};

export default Select;
