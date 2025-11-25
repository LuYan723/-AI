import React from 'react';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange, description }) => {
  return (
    <div className="group flex items-start justify-between py-3 cursor-pointer" onClick={() => onChange(!checked)}>
      <div className="flex flex-col pr-4">
        <span className="text-sm font-medium text-midnight-900 group-hover:text-midnight-700 transition-colors">{label}</span>
        {description && <span className="text-xs text-midnight-400 mt-1 leading-relaxed">{description}</span>}
      </div>
      <button
        type="button"
        className={`${
          checked ? 'bg-midnight-900' : 'bg-midnight-200'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none`}
        role="switch"
        aria-checked={checked}
      >
        <span
          aria-hidden="true"
          className={`${
            checked ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out`}
        />
      </button>
    </div>
  );
};