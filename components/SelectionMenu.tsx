import React from 'react';

interface SelectionMenuProps {
  text: string;
  top: number;
  left: number;
  onAction: (action: string, text: string) => void;
}

export const SelectionMenu: React.FC<SelectionMenuProps> = ({ text, top, left, onAction }) => {
  return (
    <div 
      className="fixed z-50 flex items-center gap-1 p-1 bg-white rounded-lg shadow-xl border border-midnight-100 animate-in fade-in zoom-in-95 duration-200"
      style={{ top: top, left: left, transform: 'translate(-50%, -100%)', marginTop: '-10px' }}
    >
        <button 
            onClick={() => onAction('ask', text)}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-midnight-700 hover:bg-midnight-50 rounded-md transition-colors"
        >
            <svg className="w-3.5 h-3.5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            询问
        </button>
        <div className="w-px h-3 bg-midnight-100 mx-0.5"></div>
        <button 
            onClick={() => onAction('explain', text)}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-midnight-700 hover:bg-midnight-50 rounded-md transition-colors"
        >
            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            解释
        </button>
        <div className="w-px h-3 bg-midnight-100 mx-0.5"></div>
        <button 
            onClick={() => onAction('rewrite', text)}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-midnight-700 hover:bg-midnight-50 rounded-md transition-colors"
        >
            <svg className="w-3.5 h-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            重写
        </button>
    </div>
  );
};