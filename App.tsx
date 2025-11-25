import React, { useState, useCallback, useEffect, useRef } from 'react';
// @ts-ignore
import mammoth from 'mammoth';
import { polishText, sendChatMessage } from './services/geminiService';
import { Language, PolishOptions, Tone, ChatMessage } from './types';
import { Toggle } from './components/Toggle';
import { Button } from './components/Button';
import { Select } from './components/Select';
import { Slider } from './components/Slider';
import { DiffViewer } from './components/DiffViewer';
import { ChatPanel } from './components/ChatPanel';
import { SelectionMenu } from './components/SelectionMenu';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  // outputVersion tracks AI updates to trigger animations. Manual edits do NOT change this.
  const [outputVersion, setOutputVersion] = useState(0);
  
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishError, setPolishError] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [updateFlash, setUpdateFlash] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedCommandIndex, setCopiedCommandIndex] = useState<number | null>(null);

  // Refs for auto-focus and file input
  const outputTextRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selection State
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState<{ text: string; top: number; left: number; source: 'original' | 'polished' } | null>(null);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [options, setOptions] = useState<PolishOptions>({
    reduceAIDetection: false,
    humanizeStrength: 50, // Default to 50%
    language: Language.AUTO,
    tone: Tone.ACADEMIC
  });

  const commonCommands = [
    "请指出这段话的语法错误",
    "让这段文字更加学术化",
    "精简这段内容，保留核心观点",
    "用文言文风格重写",
    "扩充这段论述，增加细节",
    "翻译成地道的学术英文"
  ];

  // Flash animation effect
  useEffect(() => {
    if (updateFlash) {
        const timer = setTimeout(() => setUpdateFlash(false), 1000);
        return () => clearTimeout(timer);
    }
  }, [updateFlash]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.export-menu-container')) {
            setShowExportMenu(false);
        }
        if (!target.closest('.selection-menu-container') && !target.closest('textarea')) {
            setSelection(null);
        }
    };
    // Only listen if necessary
    if (showExportMenu || selection) {
        document.addEventListener('click', handleClickOutside);
    }
    return () => {
        document.removeEventListener('click', handleClickOutside);
    };
  }, [showExportMenu, selection]);

  const handlePolish = async () => {
    if (!inputText.trim()) return;

    setIsPolishing(true);
    setPolishError(null);
    setShowDiff(false);
    setOutputText(''); 

    try {
      const result = await polishText(inputText, options);
      setOutputText(result);
      setOutputVersion(v => v + 1); // Trigger fade-in animation
    } catch (err: any) {
      setPolishError(err.message || "润色过程中发生错误。");
    } finally {
      setIsPolishing(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    const newUserMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: text,
        timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, newUserMsg]);
    setIsChatLoading(true);

    const contextOriginal = inputText;
    const contextPolished = outputText || inputText;

    try {
        const { textResponse, editorUpdate } = await sendChatMessage(text, chatMessages, {
            original: contextOriginal,
            polished: contextPolished
        });

        const newAiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: textResponse,
            timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, newAiMsg]);

        if (editorUpdate) {
            setOutputText(editorUpdate);
            setOutputVersion(v => v + 1); 
            setUpdateFlash(true); 
            setShowDiff(false); 
            
            setTimeout(() => {
                if (outputTextRef.current) {
                    outputTextRef.current.focus();
                }
            }, 50);
        }

    } catch (error) {
        const errorMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: "抱歉，我暂时无法回复。请稍后再试。",
            timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, errorMsg]);
    } finally {
        setIsChatLoading(false);
    }
  };

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const handleCopyCommand = (cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCommandIndex(index);
    setTimeout(() => setCopiedCommandIndex(null), 1500);
  };

  const handleExport = (format: 'doc' | 'md' | 'txt') => {
    if (!outputText) return;

    let content = outputText;
    let mimeType = 'text/plain';
    let extension = 'txt';

    if (format === 'doc') {
        mimeType = 'application/msword';
        extension = 'doc';
        content = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>ScholarPolish Export</title></head>
            <body style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5;">
                ${outputText.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '<br/>').join('')}
            </body>
            </html>
        `;
    } else if (format === 'md') {
        mimeType = 'text/markdown';
        extension = 'md';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scholar_polish_${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        if (file.name.endsWith('.docx')) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            setInputText(result.value);
        } else {
            // Assume text-based (txt, md)
            const text = await file.text();
            setInputText(text);
        }
    } catch (error) {
        console.error("File import failed", error);
        alert("导入文件失败。请确保文件是有效的 .docx, .txt 或 .md 格式。");
    } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Text Selection Handling
  const handleTextSelect = (
    e: React.MouseEvent<HTMLTextAreaElement> | React.UIEvent<HTMLTextAreaElement>, 
    source: 'original' | 'polished'
  ) => {
    const target = e.target as HTMLTextAreaElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;

    if (start !== end) {
        const text = target.value.substring(start, end);
        
        // Simple positioning logic
        let top = 0;
        let left = 0;

        if ('clientY' in e) {
             // MouseEvent
             top = (e as React.MouseEvent).clientY;
             left = (e as React.MouseEvent).clientX;
        } else {
             // Fallback for keyboard selection
             const rect = target.getBoundingClientRect();
             top = rect.top + rect.height / 2;
             left = rect.left + rect.width / 2;
        }

        // Adjust to not be offscreen
        setSelection({
            text,
            top: top, 
            left,
            source
        });
    } else {
        // We delay clearing selection slightly to allow click event on menu to fire
        // But since we use onAction, we handle closing there.
        // For simple click-to-clear, handled in useEffect
    }
  };

  const handleSelectionAction = (action: string, selectedText: string) => {
      setSelection(null);
      setIsChatOpen(true);
      
      let message = "";
      const quote = `> ${selectedText}\n\n`;
      
      switch(action) {
          case 'ask':
              message = `${quote}请问这段话有什么问题？或者如何改进？`;
              break;
          case 'explain':
              message = `${quote}请解释这段话的深层含义和逻辑结构。`;
              break;
          case 'rewrite':
              message = `${quote}请帮我用更学术的方式重写这段话。`;
              break;
          default:
              message = `${quote}`;
      }
      
      handleSendMessage(message);
  };

  const getStrengthLabel = (val: number) => {
      if (val < 30) return "保守调整：主要进行同义词替换，保持原意。";
      if (val < 70) return "平衡改写：优化句式结构与语序。";
      return "激进重写：大幅度改变结构，提升创意度。";
  };

  return (
    <div className="min-h-screen text-midnight-900 font-sans pb-4 bg-[#f8fafc] overflow-x-hidden">
      {/* File Input (Hidden) */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept=".txt,.md,.docx"
      />

      {/* Premium Header */}
      <header className="glass-panel sticky top-0 z-30 border-b border-white/50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-midnight-900 rounded-lg flex items-center justify-center text-gold-50 font-display font-bold text-xl shadow-lg shadow-midnight-900/20">
              S
            </div>
            <h1 className="text-2xl font-display font-bold text-midnight-900 tracking-tight">
              Scholar<span className="text-gold-600 italic">Polish</span> 智能润色
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-xs font-medium text-midnight-400 uppercase tracking-widest hidden lg:block mr-4">高级学术写作助手</span>
             
             <button 
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${isChatOpen ? 'bg-midnight-900 text-gold-50 shadow-md' : 'bg-white text-midnight-700 border border-midnight-200 hover:border-midnight-300'}`}
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="text-sm font-medium">AI 助手</span>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 h-[calc(100vh-80px)]">
        <div className="flex gap-6 h-full items-start relative transition-all duration-500">
          
          {/* Controls Panel (Left) */}
          <div className="w-80 flex-shrink-0 hidden lg:block h-full overflow-y-auto pb-10 scrollbar-hide">
            <div className="glass-panel rounded-2xl shadow-soft border border-white/50 p-6 space-y-8">
              
              <div>
                <h2 className="text-xs font-bold text-midnight-400 uppercase tracking-widest mb-6">润色设置</h2>
                
                <div className="space-y-6">
                   <Select
                    label="目标语气"
                    value={options.tone}
                    options={Object.values(Tone)}
                    onChange={(val) => setOptions(prev => ({ ...prev, tone: val }))}
                  />

                  <Select
                    label="输出语言"
                    value={options.language}
                    options={Object.values(Language)}
                    onChange={(val) => setOptions(prev => ({ ...prev, language: val }))}
                  />
                  
                  <div className="pt-2 border-t border-midnight-100/50"></div>

                  <div>
                      <Toggle
                        label="降低 AI 率 (拟人化)"
                        description="减少 AI 生成特征，提升自然度。"
                        checked={options.reduceAIDetection}
                        onChange={(checked) => setOptions(prev => ({ ...prev, reduceAIDetection: checked }))}
                      />

                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${options.reduceAIDetection ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                          <div className="pl-3 border-l-2 border-gold-300">
                             <Slider
                                label="修改强度"
                                value={options.humanizeStrength}
                                min={0}
                                max={100}
                                step={1}
                                onChange={(val) => setOptions(prev => ({ ...prev, humanizeStrength: val }))}
                             />
                             <p className="text-[10px] text-midnight-400 mt-2 leading-tight">
                                {getStrengthLabel(options.humanizeStrength)}
                             </p>
                          </div>
                      </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handlePolish} 
                  isLoading={isPolishing} 
                  disabled={!inputText.trim()}
                  variant="primary"
                  className="w-full shadow-xl shadow-midnight-900/10"
                >
                  {isPolishing ? '润色中...' : '开始润色'}
                </Button>
              </div>

              {/* Common Commands Section */}
              <div className="pt-6 border-t border-midnight-100/50">
                  <h2 className="text-xs font-bold text-midnight-400 uppercase tracking-widest mb-4">常用指令 (点击复制)</h2>
                  <div className="space-y-2">
                      {commonCommands.map((cmd, idx) => (
                          <button
                              key={idx}
                              onClick={() => handleCopyCommand(cmd, idx)}
                              className="w-full text-left px-3 py-2.5 rounded-lg bg-white border border-midnight-100 text-xs text-midnight-600 hover:border-gold-400 hover:text-midnight-900 transition-all shadow-sm flex items-center justify-between group active:scale-[0.98]"
                          >
                              <span className="truncate mr-2">{cmd}</span>
                              {copiedCommandIndex === idx ? (
                                  <span className="text-emerald-500 font-bold text-[10px] whitespace-nowrap">已复制</span>
                              ) : (
                                  <svg className="w-3.5 h-3.5 text-midnight-300 group-hover:text-gold-500 opacity-0 group-hover:opacity-100 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                  </svg>
                              )}
                          </button>
                      ))}
                  </div>
              </div>

            </div>
            
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-gold-50 to-white border border-gold-100/50 shadow-sm">
                <h4 className="text-xs font-bold text-gold-700 uppercase mb-2">贴士</h4>
                <p className="text-[11px] text-midnight-500 leading-relaxed">
                    选择文本可直接向 AI 助手提问。
                </p>
            </div>
          </div>

          {/* Editors (Center) */}
          <div className="flex-1 flex flex-col gap-6 h-full lg:flex-row transition-all duration-500 min-w-0">
            
            {/* Input Editor */}
            <div className="flex flex-col flex-1 h-full bg-white rounded-2xl shadow-soft border border-white overflow-hidden group hover:shadow-lg transition-shadow duration-500 relative">
              <div className="flex items-center justify-between px-6 py-4 border-b border-midnight-50 bg-white">
                <span className="text-xs font-bold text-midnight-300 uppercase tracking-widest group-hover:text-gold-500 transition-colors">原始草稿</span>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-medium text-midnight-500 hover:text-midnight-800 transition-colors flex items-center gap-1"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        导入
                    </button>
                    {inputText && (
                        <button 
                            onClick={() => setInputText('')}
                            className="text-xs font-medium text-midnight-300 hover:text-rose-500 transition-colors"
                        >
                            清空
                        </button>
                    )}
                </div>
              </div>
              <textarea
                ref={inputRef}
                className="flex-1 w-full p-6 resize-none border-none focus:ring-0 text-midnight-800 leading-relaxed font-serif text-lg outline-none bg-transparent placeholder-midnight-200"
                placeholder="请在此粘贴您的论文内容，或者点击上方“导入”按钮上传文件..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onMouseUp={(e) => handleTextSelect(e, 'original')}
                spellCheck={false}
              />
              <div className="px-6 py-3 border-t border-midnight-50 bg-white text-[10px] text-midnight-300 flex justify-end">
                {inputText.length} 字符
              </div>
            </div>

            {/* Output Editor */}
            <div className={`flex flex-col flex-1 h-full bg-white rounded-2xl shadow-soft border overflow-hidden relative group hover:shadow-lg transition-shadow duration-500 ${updateFlash ? 'ring-2 ring-gold-400' : ''} ${options.reduceAIDetection ? 'border-gold-200' : 'border-white'}`}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-midnight-50 bg-white z-10">
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-midnight-300 uppercase tracking-widest group-hover:text-midnight-800 transition-colors">润色版本</span>
                    {options.reduceAIDetection && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
                        </span>
                    )}
                 </div>
                 
                 <div className="flex items-center gap-3">
                    {outputText && (
                        <div className="flex items-center bg-midnight-50 rounded-lg p-0.5 border border-midnight-100">
                            <button
                                onClick={() => setShowDiff(false)}
                                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${!showDiff ? 'bg-white shadow-sm text-midnight-900' : 'text-midnight-400 hover:text-midnight-700'}`}
                            >
                                预览
                            </button>
                            <button
                                onClick={() => setShowDiff(true)}
                                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${showDiff ? 'bg-white shadow-sm text-gold-600' : 'text-midnight-400 hover:text-midnight-700'}`}
                            >
                                修订对比
                            </button>
                        </div>
                    )}
                    
                    <div className="flex items-center gap-2 export-menu-container relative ml-2 border-l border-midnight-100 pl-4">
                        <button 
                            onClick={() => outputText && setShowExportMenu(!showExportMenu)}
                            disabled={!outputText}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide border rounded-lg transition-all shadow-sm ${
                                !outputText 
                                ? 'text-midnight-300 bg-midnight-50 border-midnight-100 cursor-not-allowed' 
                                : 'text-midnight-600 bg-white border-midnight-200 hover:bg-midnight-50 hover:text-midnight-900 hover:border-midnight-300'
                            }`}
                            title="导出文件"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span>导出</span>
                        </button>
                        
                        {showExportMenu && outputText && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-midnight-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-2 bg-midnight-50/50 border-b border-midnight-100 text-[10px] font-bold text-midnight-400 uppercase tracking-widest">
                                    选择导出格式
                                </div>
                                <button onClick={() => handleExport('doc')} className="w-full text-left px-4 py-3 text-sm text-midnight-700 hover:bg-midnight-50 transition-colors flex items-center gap-3">
                                    <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">W</div>
                                    <span>Word 文档 (.doc)</span>
                                </button>
                                <button onClick={() => handleExport('md')} className="w-full text-left px-4 py-3 text-sm text-midnight-700 hover:bg-midnight-50 transition-colors flex items-center gap-3">
                                    <div className="w-6 h-6 rounded bg-slate-50 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-200 font-mono">M</div>
                                    <span>Markdown (.md)</span>
                                </button>
                                <button onClick={() => handleExport('txt')} className="w-full text-left px-4 py-3 text-sm text-midnight-700 hover:bg-midnight-50 transition-colors flex items-center gap-3">
                                    <div className="w-6 h-6 rounded bg-gray-50 text-gray-500 flex items-center justify-center font-bold text-xs border border-gray-200">T</div>
                                    <span>纯文本 (.txt)</span>
                                </button>
                            </div>
                        )}

                        <button 
                            onClick={() => copyToClipboard(outputText)}
                            disabled={!outputText}
                            className={`ml-1 transition-colors p-2 rounded-lg ${
                                !outputText ? 'text-midnight-200 cursor-not-allowed' : 'text-midnight-400 hover:text-midnight-900 hover:bg-midnight-50'
                            }`}
                            title="复制到剪贴板"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 01-2-2V5" />
                            </svg>
                        </button>
                    </div>
                 </div>
              </div>
              
              <div className="flex-1 relative w-full h-full overflow-hidden">
                {isPolishing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-[2px] z-20 transition-opacity duration-300">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-midnight-100 border-t-midnight-900 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-gold-500 rounded-full"></div>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-midnight-500 mt-6 tracking-wide animate-pulse">
                            {options.reduceAIDetection ? '正在进行拟人化处理...' : '正在优化学术语气...'}
                        </p>
                    </div>
                )}

                {/* Update Flash Overlay */}
                <div className={`absolute inset-0 bg-gold-400/10 pointer-events-none transition-opacity duration-500 z-30 ${updateFlash ? 'opacity-100' : 'opacity-0'}`} />

                {polishError ? (
                    <div className="p-10 flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-midnight-900 font-display font-bold text-lg">分析失败</h3>
                        <p className="text-sm text-midnight-500 mt-2 max-w-xs leading-relaxed">{polishError}</p>
                    </div>
                ) : (
                    <>
                        {!showDiff ? (
                            <textarea
                                key={outputVersion} // Key forces re-mount to trigger animation when AI updates
                                ref={outputTextRef}
                                className="w-full h-full p-6 resize-none border-none focus:ring-0 text-midnight-800 leading-relaxed font-serif text-lg outline-none bg-transparent animate-fade-in-up"
                                placeholder="润色后的内容将显示在这里..."
                                value={outputText}
                                onChange={(e) => setOutputText(e.target.value)}
                                onMouseUp={(e) => handleTextSelect(e, 'polished')}
                            />
                        ) : (
                            <DiffViewer original={inputText} modified={outputText} />
                        )}
                    </>
                )}
              </div>
              
              {showDiff && outputText && (
                  <div className="absolute bottom-0 left-0 right-0 bg-white/95 border-t border-midnight-50 px-6 py-3 flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-midnight-400 backdrop-blur-sm z-10">
                      <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-rose-300 rounded-full"></span>
                          <span>已删除</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                          <span>新增</span>
                      </div>
                  </div>
              )}
            </div>

            {/* Selection Popover Menu */}
            {selection && (
                <SelectionMenu 
                    text={selection.text}
                    top={selection.top}
                    left={selection.left}
                    onAction={handleSelectionAction}
                />
            )}

          </div>

          {/* Chat Panel (Right) - Toggleable */}
          <div className={`fixed inset-y-0 right-0 z-40 w-96 transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:w-[350px] lg:h-full lg:z-auto ${isChatOpen ? 'translate-x-0 lg:block' : 'translate-x-full lg:hidden'}`}>
             <ChatPanel 
                messages={chatMessages} 
                onSendMessage={handleSendMessage} 
                isLoading={isChatLoading}
                onClose={() => setIsChatOpen(false)}
             />
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;