import fs from 'fs';
import os from 'os';
import path from 'path';

export type AIBackend = 'local' | 'cloud';

export interface AISettings {
  backendSelection: AIBackend;
  activeBackend: AIBackend;
  firstLaunchComplete: boolean;
  cloud: {
    apiKey: string;
    apiUrl: string;
    model: string;
  };
  local: {
    baseUrl: string;
    model: string;
  };
  updatedAt: string;
}

export type SafeAISettings = Omit<AISettings, 'cloud'> & {
  cloud: Omit<AISettings['cloud'], 'apiKey'> & {
    apiKeyConfigured: boolean;
    apiKeyPreview: string;
  };
};

const DEFAULT_SETTINGS: AISettings = {
  backendSelection: 'cloud',
  activeBackend: 'cloud',
  firstLaunchComplete: false,
  cloud: {
    apiKey: '',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
  },
  local: {
    baseUrl: 'http://localhost:11434',
    model: 'qwen2.5-coder:7b',
  },
  updatedAt: new Date(0).toISOString(),
};

export class AISettingsManager {
  private readonly settingsDir = path.join(os.homedir(), '.devops-lite');
  private readonly settingsPath = path.join(this.settingsDir, 'ai-settings.json');

  load(): AISettings {
    try {
      if (!fs.existsSync(this.settingsPath)) {
        return { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() };
      }

      const parsed = JSON.parse(fs.readFileSync(this.settingsPath, 'utf8'));
      return this.normalize(parsed);
    } catch (error) {
      console.warn('[AI Settings] Failed to read settings, using defaults:', error);
      return { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() };
    }
  }

  save(next: Partial<AISettings>): AISettings {
    const current = this.load();
    const merged = this.normalize({
      ...current,
      ...this.definedOnly(next),
      cloud: { ...current.cloud, ...this.definedOnly(next.cloud || {}) },
      local: { ...current.local, ...this.definedOnly(next.local || {}) },
      updatedAt: new Date().toISOString(),
    });

    fs.mkdirSync(this.settingsDir, { recursive: true });
    fs.writeFileSync(this.settingsPath, `${JSON.stringify(merged, null, 2)}\n`, {
      encoding: 'utf8',
      mode: 0o600,
    });
    return merged;
  }

  private definedOnly<T extends Record<string, any>>(value: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
    ) as Partial<T>;
  }

  markSetupComplete(): AISettings {
    const settings = this.load();
    return this.save({
      ...settings,
      firstLaunchComplete: true,
      activeBackend: settings.backendSelection,
    });
  }

  getSafeSettings(): SafeAISettings {
    return this.redact(this.load());
  }

  redact(settings: AISettings): SafeAISettings {
    const key = settings.cloud.apiKey || '';
    return {
      ...settings,
      cloud: {
        apiUrl: settings.cloud.apiUrl,
        model: settings.cloud.model,
        apiKeyConfigured: Boolean(key.trim()),
        apiKeyPreview: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : '',
      },
    };
  }

  private normalize(input: any): AISettings {
    const backendSelection: AIBackend = input?.backendSelection === 'local' ? 'local' : 'cloud';
    const activeBackend: AIBackend = input?.activeBackend === 'local' ? 'local' : backendSelection;
    return {
      backendSelection,
      activeBackend,
      firstLaunchComplete: Boolean(input?.firstLaunchComplete),
      cloud: {
        apiKey: String(input?.cloud?.apiKey || '').trim(),
        apiUrl: String(input?.cloud?.apiUrl || DEFAULT_SETTINGS.cloud.apiUrl).trim(),
        model: String(input?.cloud?.model || DEFAULT_SETTINGS.cloud.model).trim(),
      },
      local: {
        baseUrl: String(input?.local?.baseUrl || DEFAULT_SETTINGS.local.baseUrl).replace(/\/$/, ''),
        model: String(input?.local?.model || DEFAULT_SETTINGS.local.model).trim(),
      },
      updatedAt: String(input?.updatedAt || new Date().toISOString()),
    };
  }
}

export const aiSettingsManager = new AISettingsManager();
