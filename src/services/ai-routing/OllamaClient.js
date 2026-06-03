"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ollamaClient = exports.OllamaClient = void 0;
const child_process_1 = require("child_process");
class OllamaClient {
    activeCancel = null;
    async getStatus(settings) {
        try {
            const response = await fetch(`${settings.local.baseUrl}/api/tags`, {
                signal: AbortSignal.timeout(2500),
            });
            if (!response.ok) {
                return {
                    running: false,
                    modelDownloaded: false,
                    models: [],
                    error: `Ollama returned ${response.status}`,
                };
            }
            const data = await response.json();
            const models = Array.isArray(data?.models)
                ? data.models.map((model) => model.name).filter(Boolean)
                : [];
            return {
                running: true,
                modelDownloaded: models.includes(settings.local.model),
                models,
            };
        }
        catch (error) {
            return {
                running: false,
                modelDownloaded: false,
                models: [],
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    async execute(settings, request) {
        const response = await fetch(`${settings.local.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: settings.local.model,
                prompt: [request.systemPrompt, request.userPrompt].filter(Boolean).join('\n\n'),
                stream: false,
                options: {
                    temperature: request.temperature ?? 0.3,
                    num_predict: request.maxTokens ?? 4096,
                },
            }),
        });
        const body = await response.text();
        if (!response.ok) {
            throw new Error(`Ollama request failed (${response.status}): ${body.slice(0, 500)}`);
        }
        const data = JSON.parse(body);
        if (!data?.response) {
            throw new Error('Ollama returned an empty response.');
        }
        return String(data.response);
    }
    async pullModel(model, onProgress, baseUrl = 'http://localhost:11434') {
        if (this.activeCancel) {
            throw new Error('An Ollama model download is already running.');
        }
        try {
            await this.pullModelWithHttp(baseUrl, model, onProgress);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (message.toLowerCase().includes('cancelled')) {
                throw error;
            }
            onProgress({
                model,
                status: 'Ollama HTTP pull was unavailable. Falling back to the Ollama CLI.',
                progress: 0,
                raw: message,
                done: false,
            });
            await this.pullModelWithCli(model, onProgress);
        }
    }
    cancelPull() {
        if (!this.activeCancel) {
            return false;
        }
        this.activeCancel();
        this.activeCancel = null;
        return true;
    }
    pullModelWithCli(model, onProgress) {
        return new Promise((resolve, reject) => {
            const child = (0, child_process_1.spawn)('ollama', ['pull', model], {
                shell: process.platform === 'win32',
                windowsHide: true,
            });
            let lastProgress = 0;
            let output = '';
            let cancelled = false;
            this.activeCancel = () => {
                cancelled = true;
                output += '\nDownload cancelled by user.';
                child.kill();
            };
            const emit = (chunk) => {
                const raw = chunk.toString();
                output += raw;
                const percentMatches = Array.from(raw.matchAll(/(\d{1,3})%/g));
                const lastPercent = percentMatches.at(-1)?.[1];
                if (lastPercent) {
                    lastProgress = Math.max(lastProgress, Math.min(100, Number(lastPercent)));
                }
                else if (/success|verifying|writing manifest/i.test(raw)) {
                    lastProgress = Math.max(lastProgress, 95);
                }
                onProgress({
                    model,
                    status: raw.replace(/\s+/g, ' ').trim() || 'Downloading model',
                    progress: lastProgress,
                    raw,
                    done: false,
                });
            };
            child.stdout.on('data', emit);
            child.stderr.on('data', emit);
            child.on('error', (error) => {
                this.activeCancel = null;
                reject(error);
            });
            child.on('close', (code) => {
                this.activeCancel = null;
                if (cancelled) {
                    reject(new Error('Ollama model download cancelled.'));
                    return;
                }
                if (code === 0) {
                    onProgress({
                        model,
                        status: 'Model download complete',
                        progress: 100,
                        raw: output,
                        done: true,
                    });
                    resolve();
                    return;
                }
                reject(new Error(this.formatPullError(code, output)));
            });
        });
    }
    async pullModelWithHttp(baseUrl, model, onProgress) {
        const controller = new AbortController();
        this.activeCancel = () => controller.abort();
        let response;
        try {
            response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: model, stream: true }),
                signal: controller.signal,
            });
        }
        catch (error) {
            this.activeCancel = null;
            if (controller.signal.aborted) {
                throw new Error('Ollama model download cancelled.');
            }
            throw error;
        }
        if (!response.ok || !response.body) {
            const body = await response.text().catch(() => '');
            this.activeCancel = null;
            throw new Error(`Ollama HTTP pull failed (${response.status}): ${body.slice(0, 500)}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let lastProgress = 0;
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (!line.trim())
                        continue;
                    const data = JSON.parse(line);
                    if (data.total && data.completed !== undefined) {
                        lastProgress = Math.max(lastProgress, Math.floor((data.completed / data.total) * 100));
                    }
                    else if (/success|verifying|writing manifest/i.test(data.status || '')) {
                        lastProgress = Math.max(lastProgress, 95);
                    }
                    onProgress({
                        model,
                        status: String(data.status || 'Downloading model'),
                        progress: data.status === 'success' ? 100 : lastProgress,
                        raw: line,
                        done: data.status === 'success',
                        completed: typeof data.completed === 'number' ? data.completed : undefined,
                        total: typeof data.total === 'number' ? data.total : undefined,
                    });
                }
            }
        }
        catch (error) {
            if (controller.signal.aborted) {
                throw new Error('Ollama model download cancelled.');
            }
            throw error;
        }
        finally {
            this.activeCancel = null;
        }
        onProgress({
            model,
            status: 'Model download complete',
            progress: 100,
            raw: '',
            done: true,
        });
    }
    isMissingCliError(message) {
        const lower = message.toLowerCase();
        return lower.includes('not recognized') || lower.includes('enoent') || lower.includes('command not found');
    }
    formatPullError(code, output) {
        if (this.isMissingCliError(output)) {
            return [
                'The Ollama server is running, but the `ollama` command is not available on PATH.',
                'Install Ollama from https://ollama.com/download, enable command-line access, then restart DevOps Lite.',
                `Original output: ${output.slice(-700)}`,
            ].join(' ');
        }
        return `ollama pull exited with code ${code}: ${output.slice(-1000)}`;
    }
}
exports.OllamaClient = OllamaClient;
exports.ollamaClient = new OllamaClient();
