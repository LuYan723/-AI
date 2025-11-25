export enum Language {
  AUTO = '自动检测',
  ENGLISH = '英语',
  CHINESE = '中文'
}

export enum Tone {
  ACADEMIC = '学术 (正式)',
  CASUAL = '通俗 (易读)',
  CONCISE = '简洁 (直接)'
}

export interface PolishOptions {
  reduceAIDetection: boolean;
  humanizeStrength: number; // 0 to 100
  language: Language;
  tone: Tone;
}

export interface PolishResult {
  original: string;
  polished: string;
  changesSummary?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ChatResponse {
  textResponse: string;
  editorUpdate?: string; // Optional field: if present, it means the AI wants to update the text editor
}