/**
 * Unified AI Client - Gemini AI integration
 * Uses Google Generative AI (Gemini) for all AI operations
 * All responses must be valid JSON for safety and consistency.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { eventBus } from '../../core/event-bus';

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  tokens?: {
    input: number;
    output: number;
  };
}

class AIClient {
  private apiKey: string;
  private client: GoogleGenerativeAI | null = null;
  private model: string = 'gemini-1.5-flash';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not set. AI features will fail.');
      return;
    }
    
    try {
      this.client = new GoogleGenerativeAI(this.apiKey);
    } catch (error) {
      console.error('Failed to initialize Gemini client:', error);
    }
  }

  /**
   * Generic request to Gemini API
   * Ensures response is valid JSON and parseable
   */
  private async request(systemPrompt: string, userMessage: string, maxTokens: number = 2048): Promise<AIResponse> {
    if (!this.client || !this.apiKey) {
      return {
        success: false,
        error: 'Gemini API key not configured. Set GEMINI_API_KEY environment variable.',
      };
    }

    try {
      const model = this.client.getGenerativeModel({
        model: this.model,
        systemInstruction: systemPrompt,
      });

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: userMessage,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.3,
        },
      });

      const response = result.response;
      const text = response.text();

      // Try to parse as JSON for structured responses
      let data: any;
      try {
        // Clean up markdown JSON fences if present
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
        data = JSON.parse(cleaned);
      } catch {
        // If not JSON, return raw text
        data = text;
      }

      return {
        success: true,
        data,
        tokens: {
          input: result.response.usageMetadata?.promptTokenCount || 0,
          output: result.response.usageMetadata?.candidatesTokenCount || 0,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Gemini API request failed:', message);
      return {
        success: false,
        error: `Request failed: ${message}`,
      };
    }
  }

  /**
   * Code Fixer - receives code + error, returns fix in JSON format
   */
  async fixCode(code: string, error: string | null, language: string = 'typescript'): Promise<AIResponse> {
    const systemPrompt = `You are an expert code repair engine. You receive either an error message with code, or code flagged as broken.

ALWAYS respond with ONLY valid JSON in this exact format:
{
  "language": "typescript",
  "original_snippet": "the exact original code provided",
  "fixed_snippet": "the corrected code",
  "explanation": "One sentence explaining what was wrong and what was fixed.",
  "confidence": 0.95
}

Rules:
- Respond with ONLY JSON, no markdown backticks or explanation
- Preserve the user's code style exactly
- Do not add imports unless absolutely required
- If code cannot be fixed, set confidence to 0.0 and explain why in explanation field
- Use language field to indicate detected or specified language`;

    const userMessage = error 
      ? `Error: ${error}\n\nCode (${language}):\n\`\`\`\n${code}\n\`\`\``
      : `Fix this ${language} code:\n\`\`\`\n${code}\n\`\`\``;

    return this.request(systemPrompt, userMessage, 1024);
  }

  /**
   * Environment Builder - analyzes project, returns setup steps
   */
  async analyzeEnvironment(projectScan: object): Promise<AIResponse> {
    const systemPrompt = `You are a development environment setup expert. You analyze project scans and recommend setup steps.

ALWAYS respond with ONLY valid JSON:
{
  "detected_type": "java-maven|node|python|rust|go|unknown",
  "missing_tools": ["tool1", "tool2"],
  "setup_steps": [
    {
      "step": 1,
      "description": "Install Maven",
      "command": "brew install maven",
      "platform": "mac",
      "required": true
    }
  ],
  "env_vars_needed": ["JAVA_HOME"],
  "estimated_minutes": 5,
  "summary": "Detailed summary of what needs to be set up"
}

Rules:
- Respond with ONLY JSON, no markdown backticks
- Platforms: "mac", "windows", "linux", "universal"
- Only recommend tools actually needed based on files present
- Be specific with commands for each platform
- Set estimated_minutes realistically`;

    const userMessage = `Analyze this project and recommend setup steps:\n${JSON.stringify(projectScan, null, 2)}`;

    return this.request(systemPrompt, userMessage, 2048);
  }

  /**
   * File Organizer - identifies redundancy and misplaced files
   */
  async analyzeFileOrganization(deepScan: object): Promise<AIResponse> {
    const systemPrompt = `You are a project file organization expert. Analyze file trees and identify redundancy.

ALWAYS respond with ONLY valid JSON:
{
  "redundant_files": [
    {
      "path": "src/Foo_backup.java",
      "reason": "Backup of Foo.java, obsolete",
      "action": "DELETE"
    }
  ],
  "moves": [
    {
      "from": "src/query.sql",
      "to": "src/main/resources/db/query.sql",
      "reason": "SQL files belong in resources"
    }
  ],
  "new_dirs_to_create": ["src/main/resources/db"],
  "summary": "Removed 2 files, moved 3 files. Organized into standard structure.",
  "risk_level": "low"
}

Rules:
- Respond with ONLY JSON, no markdown backticks
- Flag files with _backup, _old, _v2, _copy, _test_data suffixes as DELETE if canonical version exists
- Only flag definite redundancy, never guess
- risk_level: "low" (safe), "medium" (review), "high" (risky)
- Return empty arrays if no issues found`;

    const userMessage = `Analyze this file tree for redundancy and misorganization:\n${JSON.stringify(deepScan, null, 2)}`;

    return this.request(systemPrompt, userMessage, 3000);
  }

  /**
   * Update API key at runtime
   */
  setApiKey(key: string): void {
    this.apiKey = key;
    try {
      this.client = new GoogleGenerativeAI(key);
    } catch (error) {
      console.error('Failed to reinitialize Gemini client:', error);
    }
  }

  /**
   * Check if API key is configured
   */
  hasApiKey(): boolean {
    return Boolean(this.apiKey) && Boolean(this.client);
  }
}

export const aiClient = new AIClient();
