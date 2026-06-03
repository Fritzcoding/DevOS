import type { AISettings } from './AISettingsManager';

export interface PromptRequest {
  systemPrompt?: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export class ApiClient {
  async execute(settings: AISettings, request: PromptRequest): Promise<string> {
    const { apiKey, apiUrl, model } = settings.cloud;
    if (!apiKey) {
      throw new Error('Cloud API key is not configured.');
    }
    if (!model) {
      throw new Error('Cloud model is not configured.');
    }

    const url = apiUrl || 'https://api.openai.com/v1/chat/completions';
    if (url.includes('anthropic.com')) {
      return this.executeAnthropic(url, apiKey, model, request);
    }
    return this.executeOpenAICompatible(url, apiKey, model, request);
  }

  private async executeOpenAICompatible(
    url: string,
    apiKey: string,
    model: string,
    request: PromptRequest,
  ): Promise<string> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.userPrompt },
        ],
        temperature: request.temperature ?? 0.3,
        max_tokens: request.maxTokens ?? 4096,
      }),
    });

    const body = await response.text();
    if (!response.ok) {
      throw new Error(`Cloud API request failed (${response.status}): ${body.slice(0, 500)}`);
    }

    const data = JSON.parse(body);
    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('Cloud API returned an empty response.');
    }
    return String(text);
  }

  private async executeAnthropic(
    url: string,
    apiKey: string,
    model: string,
    request: PromptRequest,
  ): Promise<string> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        system: request.systemPrompt || undefined,
        messages: [{ role: 'user', content: request.userPrompt }],
        temperature: request.temperature ?? 0.3,
        max_tokens: request.maxTokens ?? 4096,
      }),
    });

    const body = await response.text();
    if (!response.ok) {
      throw new Error(`Anthropic API request failed (${response.status}): ${body.slice(0, 500)}`);
    }

    const data = JSON.parse(body);
    const text = data?.content?.map((part: any) => part?.text || '').join('').trim();
    if (!text) {
      throw new Error('Anthropic API returned an empty response.');
    }
    return text;
  }
}

export const apiClient = new ApiClient();
