// components/FormField.js
import React from 'react';

const FormField = ({ 
  label, 
  id, 
  type = "text", 
  as: Component = "input", 
  value, 
  onChange, 
  error, 
  required = false, 
  placeholder, 
  options = [], 
  rows,
  className = "",
  ...props 
}) => {
  const baseClasses = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200";
  const errorClasses = error ? "border-red-300 focus:ring-red-500 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300";
  const finalClasses = `${baseClasses} ${errorClasses} ${className}`;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {Component === "select" ? (
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={finalClasses}
          required={required}
          {...props}
        >
          <option value="">Select {label.toLowerCase()}...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <Component
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          className={finalClasses}
          placeholder={placeholder}
          required={required}
          rows={rows}
          {...props}
        />
      )}
      
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;

