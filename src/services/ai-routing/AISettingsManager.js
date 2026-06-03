"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiSettingsManager = exports.AISettingsManager = void 0;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const DEFAULT_SETTINGS = {
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
class AISettingsManager {
    settingsDir = path_1.default.join(os_1.default.homedir(), '.devops-lite');
    settingsPath = path_1.default.join(this.settingsDir, 'ai-settings.json');
    load() {
        try {
            if (!fs_1.default.existsSync(this.settingsPath)) {
                return { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() };
            }
            const parsed = JSON.parse(fs_1.default.readFileSync(this.settingsPath, 'utf8'));
            return this.normalize(parsed);
        }
        catch (error) {
            console.warn('[AI Settings] Failed to read settings, using defaults:', error);
            return { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() };
        }
    }
    save(next) {
        const current = this.load();
        const merged = this.normalize({
            ...current,
            ...this.definedOnly(next),
            cloud: { ...current.cloud, ...this.definedOnly(next.cloud || {}) },
            local: { ...current.local, ...this.definedOnly(next.local || {}) },
            updatedAt: new Date().toISOString(),
        });
        fs_1.default.mkdirSync(this.settingsDir, { recursive: true });
        fs_1.default.writeFileSync(this.settingsPath, `${JSON.stringify(merged, null, 2)}\n`, {
            encoding: 'utf8',
            mode: 0o600,
        });
        return merged;
    }
    definedOnly(value) {
        return Object.fromEntries(Object.entries(value).filter(([, entryValue]) => entryValue !== undefined));
    }
    markSetupComplete() {
        const settings = this.load();
        return this.save({
            ...settings,
            firstLaunchComplete: true,
            activeBackend: settings.backendSelection,
        });
    }
    getSafeSettings() {
        return this.redact(this.load());
    }
    redact(settings) {
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
    normalize(input) {
        const backendSelection = input?.backendSelection === 'local' ? 'local' : 'cloud';
        const activeBackend = input?.activeBackend === 'local' ? 'local' : backendSelection;
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
exports.AISettingsManager = AISettingsManager;
exports.aiSettingsManager = new AISettingsManager();
