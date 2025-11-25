import { GoogleGenAI } from "@google/genai";
import { PolishOptions, Language, Tone, ChatMessage, ChatResponse } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing from environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const polishText = async (text: string, options: PolishOptions): Promise<string> => {
  if (!text.trim()) return "";

  const ai = getClient();
  
  // Construct a sophisticated prompt based on options
  let systemInstruction = `You are a world-class academic editor and linguistic expert with deep knowledge of Classical Chinese (文言文) and modern academic standards. Your task is to refine the user's input text to meet high academic standards while adhering to specific style constraints.`;
  
  const promptParts = [
    `Input Text:\n"${text}"\n\n`,
    `Task: Polish and rewrite the text above.`,
    `Constraints:`,
  ];

  // Language Handling
  if (options.language !== Language.AUTO) {
    promptParts.push(`- Output Language: STRICTLY ${options.language}.`);
  } else {
    promptParts.push(`- Output Language: Same as the input text (English or Chinese).`);
  }

  // Tone Handling
  if (options.tone === Tone.ACADEMIC) {
    promptParts.push(`- Tone: Formal, authoritative, and precise (Academic). Use advanced vocabulary.`);
    promptParts.push(`
    SPECIFIC INSTRUCTIONS FOR CHINESE OUTPUT (CNKI Style/中国知网风格):
    If the output is in Chinese, adhere strictly to the academic style found in high-quality CNKI papers:
    1. Vocabulary: Use formal, precise academic lexicon (e.g., use "笔者/本文" instead of "我", "旨在" instead of "为了", "显著" instead of "很大", "亟待" instead of "急需").
    2. Sentence Structure: Sentences should be balanced, objective, and information-dense. Avoid loose, oral, or colloquial structures.
    3. Objectivity: Maintain a professional, detached, and rigorous tone. Avoid subjective intensity or emotional adjectives.
    4. Logic & Flow: Use formal transition words (e.g., "鉴于", "综上所述", "基于", "与此同时") to ensure strong logical coherence.
    5. Idioms & Classical Nuance: Appropriately use 4-character idioms (成语) or concise classical structures (文言句式) to enhance the professional depth, provided they fit the modern academic context.
    `);
  } else if (options.tone === Tone.CONCISE) {
    promptParts.push(`- Tone: Concise. Eliminate redundancy. Prioritize brevity without losing meaning.`);
  } else {
    promptParts.push(`- Tone: Casual/Readable. Simplify complex structures for a broader audience.`);
  }

  // CORE FEATURE: Reduce AI Detection & Strength
  if (options.reduceAIDetection) {
    const strength = options.humanizeStrength; // 0 to 100
    
    promptParts.push(`
    CRITICAL OBJECTIVE: HUMANIZE TEXT (Strength Level: ${strength}%)
    The user wants to bypass AI detectors.
    `);

    if (options.tone === Tone.ACADEMIC) {
        promptParts.push(`
        IMPORTANT: Since the tone is ACADEMIC, "Humanizing" means sounding like a senior professor/expert, NOT a casual blogger.
        - Avoid repetitive sentence patterns common in AI (e.g., always starting with "However", "Therefore").
        - Use nuanced transitions and varied sentence lengths (burstiness).
        - For Chinese: ensure the "human" feel comes from deep, idiomatic academic expression (老练的学术笔触), not slang.
        `);
    }

    // Dynamic instructions based on percentage ranges
    if (strength < 30) {
      promptParts.push(`
      - Strategy: Conservative Editing (Level ${strength}%).
      - Keep the original sentence structure mostly intact.
      - Focus on replacing common "AI-sounding" words with more natural, human synonyms.
      - Ensure 100% fidelity to the original meaning.
      `);
    } else if (strength >= 30 && strength < 70) {
      promptParts.push(`
      - Strategy: Balanced Restructuring (Level ${strength}%).
      - Combine or split sentences to vary rhythm significantly.
      - Replace generic transitions (e.g., "Moreover", "In conclusion") with contextual, logical flow.
      - Inject moderate "burstiness" (mix of long/complex and short/simple sentences).
      `);
    } else {
      promptParts.push(`
      - Strategy: Aggressive/Deep Rewriting (Level ${strength}%).
      - Completely restructure paragraphs while preserving core arguments.
      - Use idiomatic phrasing that is typical of a highly educated human writer but rarely used by AI.
      - Deliberately disrupt predictable patterns.
      - You have creative freedom to change the syntax completely as long as the academic fact remains true.
      `);
    }
  } else {
    promptParts.push(`- Focus primarily on correcting grammar, improving flow, and enhancing clarity.`);
  }

  promptParts.push(`- FORMAT: Return ONLY the polished text. No Markdown code blocks, no "Here is the text", no explanations.`);

  // Determine Temperature based on percentage
  // Map 0-100 to 0.6-1.0 range for humanization
  let temperature = 0.3; // Default stable
  if (options.reduceAIDetection) {
    // Linear interpolation: 0% -> 0.6, 100% -> 1.0
    temperature = 0.6 + (options.humanizeStrength / 100) * 0.4;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptParts.join('\n'),
      config: {
        systemInstruction: systemInstruction,
        temperature: temperature,
        topP: 0.95,
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("润色失败，请重试。");
  }
};

// --- CHAT FUNCTIONALITY ---

export const sendChatMessage = async (
  currentMessage: string, 
  history: ChatMessage[], 
  context: { original: string; polished: string }
): Promise<ChatResponse> => {
  const ai = getClient();

  const systemInstruction = `
    ROLE: You are an Interactive Academic Writing Mentor and Chinese Linguistics Scholar (Expert in CNKI Style & Classical Chinese/文言文).
    
    YOUR GOAL: 
    Do not just be a "tool" that silently fixes errors. Be a "collaborator" who guides the user through the rewriting process. 
    Engage the user, explain your strategies, and ask for feedback to ensure the final output matches their vision.

    CONTEXT:
    - Original Draft: ${context.original.substring(0, 3000) || "(Empty)"}
    - Current Editor Content (Polished Version): ${context.polished.substring(0, 3000) || "(Empty)"}

    INTERACTION PROTOCOL:

    1. **Consultative Approach (指导性策略)**:
       - When the user asks for a modification (e.g., "Make this more academic"), briefly explain *how* you plan to achieve it before or while doing it.
       - Example: "To enhance the academic tone, I will replace subjective adjectives with objective data points and use more formal transition words. Here is the revised version..."

    2. **Execution (Direct Modification)**:
       - You have the power to DIRECTLY update the editor.
       - Use the special tags \`<<<UPDATE_TEXT>>>\` and \`<<<END_UPDATE_TEXT>>>\` to enclose the full, updated text.
       - **Rule**: Even if you update the text, you MUST provide a conversational explanation outside the tags.

    3. **Feedback Loop (反馈循环)**:
       - After making a change, ask the user if the direction is correct.
       - Example: "...I've restructured the second paragraph. Does this flow better for you, or should we try a more concise approach?"

    4. **Classical Chinese Capability (文言文)**:
       - If asked to use Classical Chinese, demonstrate deep scholarly knowledge. Explain specific word choices (diction) if they enhance the meaning.

    5. **Handling Vague Requests**:
       - If the user says "Improve this", ask clarifying questions or propose a strategy first.
       - Example: "I can improve this by focusing on grammar, or I can rewrite it completely to be more persuasive. Which do you prefer?" (Or provide a version and explain why you chose that path).

    FORMATTING:
    - Conversational part: Natural, helpful, mentorship tone.
    - Editor update part: \`<<<UPDATE_TEXT>>> [Full Text] <<<END_UPDATE_TEXT>>>\`
  `;

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessage({
      message: currentMessage
    });

    const fullResponse = result.text || "";
    
    // Parse for editor updates
    const updateRegex = /<<<UPDATE_TEXT>>>([\s\S]*?)<<<END_UPDATE_TEXT>>>/;
    const match = fullResponse.match(updateRegex);

    let textResponse = fullResponse;
    let editorUpdate = undefined;

    if (match) {
        editorUpdate = match[1].trim();
        // Remove the technical tags from the conversational response
        textResponse = fullResponse.replace(match[0], '').trim();
    }

    return { textResponse, editorUpdate };

  } catch (error) {
    console.error("Chat Error:", error);
    throw new Error("AI 助手暂时无法回答，请稍后再试。");
  }
};
