import { aiSettingsManager, type AIBackend } from './AISettingsManager';
import { apiClient, type PromptRequest } from './ApiClient';
import { ollamaClient, type OllamaStatus } from './OllamaClient';

export interface AIRouterStatus {
  settings: ReturnType<typeof aiSettingsManager.getSafeSettings>;
  cloudConfigured: boolean;
  local: OllamaStatus;
  canToggle: boolean;
}

export interface AIRouterResult {
  text: string;
  backend: AIBackend;
  model: string;
  duration: number;
}

export class AIRouter {
  async getStatus(): Promise<AIRouterStatus> {
    const settings = aiSettingsManager.load();
    const local = await ollamaClient.getStatus(settings);
    const cloudConfigured = Boolean(settings.cloud.apiKey && settings.cloud.model && settings.cloud.apiUrl);
    return {
      settings: aiSettingsManager.redact(settings),
      cloudConfigured,
      local,
      canToggle: cloudConfigured && local.running && local.modelDownloaded,
    };
  }

  async setActiveBackend(activeBackend: AIBackend) {
    return aiSettingsManager.redact(aiSettingsManager.save({ activeBackend }));
  }

  async executePrompt(userPrompt: string, options: Omit<PromptRequest, 'userPrompt'> = {}): Promise<AIRouterResult> {
    const settings = aiSettingsManager.load();
    const started = Date.now();
    const request = { ...options, userPrompt };
    const activeBackend = settings.activeBackend || settings.backendSelection;

    if (activeBackend === 'local') {
      const status = await ollamaClient.getStatus(settings);
      if (!status.running) throw new Error('Ollama is not running at http://localhost:11434.');
      if (!status.modelDownloaded) throw new Error(`${settings.local.model} is not downloaded in Ollama.`);
      return {
        text: await ollamaClient.execute(settings, request),
        backend: 'local',
        model: settings.local.model,
        duration: Date.now() - started,
      };
    }

    return {
      text: await apiClient.execute(settings, request),
      backend: 'cloud',
      model: settings.cloud.model,
      duration: Date.now() - started,
    };
  }
}

export const aiRouter = new AIRouter();
