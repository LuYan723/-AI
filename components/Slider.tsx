import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (val: number) => string;
}

export const Slider: React.FC<SliderProps> = ({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1,
  formatValue = (v) => `${v}%`
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col space-y-3 py-1">
      <div className="flex justify-between items-end">
        <label className="text-[10px] font-bold text-midnight-400 uppercase tracking-widest pl-1">
          {label}
        </label>
        <span className="text-xs font-bold text-gold-600 tabular-nums">
          {formatValue(value)}
        </span>
      </div>
      
      <div className="relative w-full h-6 flex items-center group cursor-pointer">
        {/* Track background */}
        <div className="absolute w-full h-1.5 bg-midnight-100 rounded-full overflow-hidden">
          {/* Progress fill */}
          <div 
            className="h-full bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-150 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Range Input (Invisible but interactive) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
        />

        {/* Custom Thumb (Visual only) */}
        <div 
          className="absolute h-4 w-4 bg-white border-2 border-gold-500 rounded-full shadow-md transform transition-transform duration-150 ease-out pointer-events-none group-hover:scale-110 group-active:scale-95 z-0"
          style={{ 
            left: `calc(${percentage}% - 8px)` 
          }}
        />
      </div>
    </div>
  );
};