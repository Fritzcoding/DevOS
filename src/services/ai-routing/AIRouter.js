"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = exports.AIRouter = void 0;
const AISettingsManager_1 = require("./AISettingsManager");
const ApiClient_1 = require("./ApiClient");
const OllamaClient_1 = require("./OllamaClient");
class AIRouter {
    async getStatus() {
        const settings = AISettingsManager_1.aiSettingsManager.load();
        const local = await OllamaClient_1.ollamaClient.getStatus(settings);
        const cloudConfigured = Boolean(settings.cloud.apiKey && settings.cloud.model && settings.cloud.apiUrl);
        return {
            settings: AISettingsManager_1.aiSettingsManager.redact(settings),
            cloudConfigured,
            local,
            canToggle: cloudConfigured && local.running && local.modelDownloaded,
        };
    }
    async setActiveBackend(activeBackend) {
        return AISettingsManager_1.aiSettingsManager.redact(AISettingsManager_1.aiSettingsManager.save({ activeBackend }));
    }
    async executePrompt(userPrompt, options = {}) {
        const settings = AISettingsManager_1.aiSettingsManager.load();
        const started = Date.now();
        const request = { ...options, userPrompt };
        const activeBackend = settings.activeBackend || settings.backendSelection;
        if (activeBackend === 'local') {
            const status = await OllamaClient_1.ollamaClient.getStatus(settings);
            if (!status.running)
                throw new Error('Ollama is not running at http://localhost:11434.');
            if (!status.modelDownloaded)
                throw new Error(`${settings.local.model} is not downloaded in Ollama.`);
            return {
                text: await OllamaClient_1.ollamaClient.execute(settings, request),
                backend: 'local',
                model: settings.local.model,
                duration: Date.now() - started,
            };
        }
        return {
            text: await ApiClient_1.apiClient.execute(settings, request),
            backend: 'cloud',
            model: settings.cloud.model,
            duration: Date.now() - started,
        };
    }
}
exports.AIRouter = AIRouter;
exports.aiRouter = new AIRouter();
