import React, { useMemo } from 'react';
import { computeDiff } from '../utils/diff';

interface DiffViewerProps {
  original: string;
  modified: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ original, modified }) => {
  const diffs = useMemo(() => computeDiff(original, modified), [original, modified]);

  return (
    <div className="w-full h-full p-6 overflow-y-auto text-lg leading-relaxed font-serif bg-white whitespace-pre-wrap text-midnight-800 animate-fade-in-up">
      {diffs.map((part, index) => {
        if (part.type === 'insert') {
          return (
            <span key={index} className="bg-emerald-100 text-emerald-800 border-b-2 border-emerald-200 decoration-clone px-0.5 rounded-sm mx-0.5 font-medium">
              {part.value}
            </span>
          );
        }
        if (part.type === 'delete') {
          return (
            <span key={index} className="bg-rose-100 text-rose-400 line-through decoration-rose-400/50 decoration-2 px-0.5 mx-0.5 text-base select-none opacity-80">
              {part.value}
            </span>
          );
        }
        return <span key={index}>{part.value}</span>;
      })}
    </div>
  );
};