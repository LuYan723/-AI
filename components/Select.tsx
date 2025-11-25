import React from 'react';

interface SelectProps<T> {
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
}

export const Select = <T extends string>({ label, value, options, onChange }: SelectProps<T>) => {
  return (
    <div className="flex flex-col space-y-1.5">
      <label className="text-[10px] font-bold text-midnight-400 uppercase tracking-widest pl-1">{label}</label>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="appearance-none block w-full rounded-lg border border-midnight-200 bg-white py-2.5 pl-3 pr-10 text-sm text-midnight-800 focus:border-midnight-900 focus:outline-none focus:ring-1 focus:ring-midnight-900 shadow-sm transition-all cursor-pointer hover:border-midnight-300"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-midnight-400 group-hover:text-midnight-600 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};