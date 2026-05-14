/**
 * AI Model Manager
 * Handles multi-model AI with intelligent fallback chain
 * Primary: Gemini 2.0 Flash
 * Secondary: OpenAI GPT-4o  
 * Tertiary: Ollama (local, offline)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { IPCErrorCode } from '../ipc-types';

export type AIModelType = 'gemini' | 'openai' | 'ollama';

export interface AIResponse {
  text: string;
  model: AIModelType;
  tokensUsed?: number;
  duration: number;
}

export interface AIConfig {
  gemini?: {
    apiKey: string;
    model: string;
  };
  openai?: {
    apiKey: string;
    model: string;
  };
  ollama?: {
    baseUrl: string;
    model: string;
  };
}

/**
 * AI Manager - Fallback chain orchestration
 */
export class AIManager {
  private geminiClient: GoogleGenerativeAI | null = null;
  private openaiClient: any = null;
  private ollamaBaseUrl = 'http://localhost:11434';

  private modelChain: AIModelType[] = ['gemini', 'openai', 'ollama'];
  private modelStats = {
    gemini: { attempts: 0, successes: 0, lastError: null as any },
    openai: { attempts: 0, successes: 0, lastError: null as any },
    ollama: { attempts: 0, successes: 0, lastError: null as any },
  };

  constructor() {
    this.initializeClients();
  }

  /**
   * Initialize all AI clients from environment variables
   */
  private initializeClients(): void {
    // Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        this.geminiClient = new GoogleGenerativeAI(geminiKey);
        console.log('[AI Manager] ✅ Gemini client initialized');
      } catch (e) {
        console.error('[AI Manager] ❌ Failed to initialize Gemini:', e);
      }
    }

    // OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        const { OpenAI } = require('openai');
        this.openaiClient = new OpenAI({ apiKey: openaiKey });
        console.log('[AI Manager] ✅ OpenAI client initialized');
      } catch (e) {
        console.error('[AI Manager] ❌ Failed to initialize OpenAI:', e);
      }
    }

    // Ollama (always available if running locally)
    console.log(`[AI Manager] Ollama: Will check availability on-demand (${this.ollamaBaseUrl})`);
  }

  /**
   * Check if model is available
   */
  private async isModelAvailable(model: AIModelType): Promise<boolean> {
    switch (model) {
      case 'gemini':
        return this.geminiClient !== null;
      case 'openai':
        return this.openaiClient !== null;
      case 'ollama':
        return await this.checkOllamaAvailability();
      default:
        return false;
    }
  }

  /**
   * Check if Ollama is running
   */
  private async checkOllamaAvailability(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      try {
        const response = await fetch(`${this.ollamaBaseUrl}/api/tags`, {
          signal: controller.signal,
        });
        return response.ok;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch {
      return false;
    }
  }

  /**
   * Fix code using fallback chain
   */
  async fixCode(
    code: string,
    language: string,
    prompt: string,
    preferredModel?: AIModelType,
  ): Promise<AIResponse> {
    const systemPrompt = `You are an expert code reviewer and fixer. Your task is to:
1. Fix ALL syntax errors
2. Fix type mismatches
3. Fix logic errors (e.g., division by zero)
4. Fix scope issues (variable declarations)
5. Optimize the code where possible

When responding, provide ONLY the fixed code, followed by a blank line, then a brief explanation of changes made.`;

    const userMessage = `
Language: ${language}
Task: ${prompt}

Original code:
\`\`\`${language}
${code}
\`\`\`

Please fix and improve this code.`;

    // Build fallback chain (preferred model first)
    let chain = [...this.modelChain];
    if (preferredModel && chain.includes(preferredModel)) {
      chain = [preferredModel, ...chain.filter((m) => m !== preferredModel)];
    }

    for (const model of chain) {
      if (!(await this.isModelAvailable(model))) {
        console.log(`[AI Manager] ⏭️  ${model}: Not available, skipping`);
        continue;
      }

      try {
        console.log(`[AI Manager] 🚀 ${model}: Attempting...`);
        const startTime = Date.now();

        const response = await this.callModel(model, systemPrompt, userMessage);
        const duration = Date.now() - startTime;

        this.modelStats[model].attempts++;
        this.modelStats[model].successes++;
        this.modelStats[model].lastError = null;

        console.log(
          `[AI Manager] ✅ ${model}: Success in ${duration}ms (${this.modelStats[model].successes}/${this.modelStats[model].attempts})`,
        );

        return {
          text: response,
          model,
          duration,
        };
      } catch (error: any) {
        this.modelStats[model].attempts++;
        this.modelStats[model].lastError = error;

        const errorMsg = error.message || String(error);
        console.warn(
          `[AI Manager] ⚠️  ${model}: Failed - ${errorMsg}. Trying next model...`,
        );

        // If rate limited, don't try other API-based models
        if (errorMsg.includes('RATE_LIMIT') || errorMsg.includes('429')) {
          console.log(`[AI Manager] 🚫 Rate limited by ${model}, skipping remaining API models`);
          // Only try Ollama
          if (model !== 'ollama') {
            const ollamaAvailable = await this.isModelAvailable('ollama');
            if (ollamaAvailable) {
              try {
                console.log(`[AI Manager] 🚀 ollama: Attempting as rate-limit fallback...`);
                const startTime = Date.now();
                const response = await this.callModel('ollama', systemPrompt, userMessage);
                const duration = Date.now() - startTime;

                this.modelStats.ollama.attempts++;
                this.modelStats.ollama.successes++;
                console.log(`[AI Manager] ✅ ollama: Success in ${duration}ms`);

                return {
                  text: response,
                  model: 'ollama',
                  duration,
                };
              } catch (ollamaError) {
                this.modelStats.ollama.attempts++;
                this.modelStats.ollama.lastError = ollamaError;
                console.error('[AI Manager] ❌ Ollama also failed:', ollamaError);
              }
            }
            break;
          }
        }

        // Continue to next model
        continue;
      }
    }

    // All models failed
    const errors = {
      gemini: this.modelStats.gemini.lastError?.message,
      openai: this.modelStats.openai.lastError?.message,
      ollama: this.modelStats.ollama.lastError?.message,
    };

    throw new Error(
      `All AI models failed. Gemini: ${errors.gemini}. OpenAI: ${errors.openai}. Ollama: ${errors.ollama}`,
    );
  }

  /**
   * Chat with AI using fallback chain
   */
  async chat(
    message: string,
    context: string = '',
    preferredModel?: AIModelType,
  ): Promise<AIResponse> {
    const systemPrompt = `You are a helpful and knowledgeable coding assistant. 
Help developers understand code, fix bugs, and improve their projects.
Be concise but thorough in your explanations.`;

    const userMessage = `${systemPrompt}\n\nContext:\n${context || 'No context provided'}\n\nQuestion: ${message}`;

    // Build fallback chain
    let chain = [...this.modelChain];
    if (preferredModel && chain.includes(preferredModel)) {
      chain = [preferredModel, ...chain.filter((m) => m !== preferredModel)];
    }

    for (const model of chain) {
      if (!(await this.isModelAvailable(model))) continue;

      try {
        const startTime = Date.now();
        const response = await this.callModel(model, '', userMessage);
        const duration = Date.now() - startTime;

        this.modelStats[model].successes++;
        this.modelStats[model].attempts++;

        return {
          text: response,
          model,
          duration,
        };
      } catch (error) {
        this.modelStats[model].attempts++;
        this.modelStats[model].lastError = error;
        continue;
      }
    }

    throw new Error('All AI models failed for chat');
  }

  /**
   * Call specific model
   */
  private async callModel(
    model: AIModelType,
    systemPrompt: string,
    userMessage: string,
  ): Promise<string> {
    switch (model) {
      case 'gemini':
        return this.callGemini(systemPrompt, userMessage);
      case 'openai':
        return this.callOpenAI(systemPrompt, userMessage);
      case 'ollama':
        return this.callOllama(systemPrompt, userMessage);
      default:
        throw new Error(`Unknown model: ${model}`);
    }
  }

  /**
   * Gemini API call
   */
  private async callGemini(systemPrompt: string, userMessage: string): Promise<string> {
    if (!this.geminiClient) throw new Error('Gemini client not initialized');

    const model = this.geminiClient.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt || undefined,
    });

    const response = await model.generateContent(userMessage);
    const text = response.response.text();

    if (!text) throw new Error('Empty response from Gemini');
    return text;
  }

  /**
   * OpenAI API call
   */
  private async callOpenAI(systemPrompt: string, userMessage: string): Promise<string> {
    if (!this.openaiClient) throw new Error('OpenAI client not initialized');

    const message = await this.openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    });

    const text = message.choices[0]?.message?.content;
    if (!text) throw new Error('Empty response from OpenAI');
    return text;
  }

  /**
   * Ollama API call (local)
   */
  private async callOllama(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral', // Default model, could be configurable
        prompt: `${systemPrompt}\n\n${userMessage}`,
        stream: false,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.response;

    if (!text) throw new Error('Empty response from Ollama');
    return text;
  }

  /**
   * Get model statistics for monitoring
   */
  getStats() {
    return {
      models: this.modelStats,
      available: {
        gemini: this.geminiClient !== null,
        openai: this.openaiClient !== null,
        ollama: '(checked on-demand)',
      },
      chain: this.modelChain,
    };
  }

  /**
   * Set preferred model chain order
   */
  setModelChain(chain: AIModelType[]): void {
    this.modelChain = chain.filter((m) => chain.includes(m));
    console.log(`[AI Manager] Model chain updated: ${this.modelChain.join(' → ')}`);
  }
}

// Single global instance
export const aiManager = new AIManager();

export default aiManager;
