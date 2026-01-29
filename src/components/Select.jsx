import React from 'react';

const Select = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  disabled = false,
  required = false,
  className = ''
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          input-field appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2364748b" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>')] bg-no-repeat bg-[length:20px] bg-[right_12px_center]
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}
          ${disabled ? 'bg-secondary-50 cursor-not-allowed' : ''}
        `}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default Select;
