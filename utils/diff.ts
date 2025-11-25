export type DiffType = 'equal' | 'insert' | 'delete';

export interface DiffPart {
  type: DiffType;
  value: string;
}

// Tokenize text into words for English/Numbers but characters for CJK
const tokenize = (text: string): string[] => {
  const tokens: string[] = [];
  let currentWord = '';
  
  // Regex to identify CJK characters (Chinese, Japanese, Korean)
  // Range covers common CJK Unified Ideographs
  const isCJK = (char: string) => /[\u4e00-\u9fff\u3040-\u30ff\u3400-\u4dbf]/.test(char);
  
  // Regex for word characters (Latin, numbers, underscore)
  const isWordChar = (char: string) => /[a-zA-Z0-9_]/.test(char);
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (isCJK(char)) {
      // If we were building a word, push it first
      if (currentWord) {
        tokens.push(currentWord);
        currentWord = '';
      }
      // Push CJK character as standalone token
      tokens.push(char);
    } else if (isWordChar(char)) {
      // Build up English words
      currentWord += char;
    } else {
      // Punctuation, spaces, symbols, etc.
      if (currentWord) {
        tokens.push(currentWord);
        currentWord = '';
      }
      tokens.push(char);
    }
  }
  
  // Push remaining word if any
  if (currentWord) {
    tokens.push(currentWord);
  }
  
  return tokens;
};

// O(NM) LCS based diff algorithm using the tokenizer
export const computeDiff = (text1: string, text2: string): DiffPart[] => {
  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);

  const n = tokens1.length;
  const m = tokens2.length;

  // DP Matrix
  const dp: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (tokens1[i - 1] === tokens2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const diffs: DiffPart[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && tokens1[i - 1] === tokens2[j - 1]) {
      diffs.unshift({ type: 'equal', value: tokens1[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffs.unshift({ type: 'insert', value: tokens2[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diffs.unshift({ type: 'delete', value: tokens1[i - 1] });
      i--;
    }
  }

  // Post-processing: Merge adjacent same-type tokens
  const mergedDiffs: DiffPart[] = [];
  if (diffs.length > 0) {
    let current = diffs[0];
    for (let k = 1; k < diffs.length; k++) {
      if (diffs[k].type === current.type) {
        current.value += diffs[k].value;
      } else {
        mergedDiffs.push(current);
        current = diffs[k];
      }
    }
    mergedDiffs.push(current);
  }

  return mergedDiffs;
};