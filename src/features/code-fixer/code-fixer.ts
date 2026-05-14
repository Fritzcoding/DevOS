/**
 * Code Fixer Feature
 * Watches clipboard for code snippets with errors
 * Uses AI to suggest fixes with diff preview
 */

import { eventBus } from '../../core/event-bus';
import { stateMachine } from '../../core/state-machine';
import { aiClient } from '../../services/ai/ai-client';

export interface CodeFixResult {
  language: string;
  original: string;
  fixed: string;
  explanation: string;
  confidence: number;
}

class CodeFixerFeature {
  private clipboardWatcher: NodeJS.Timeout | null = null;
  private lastClipboardContent = '';
  private isProcessing = false;

  /**
   * Start watching clipboard for code snippets
   */
  startClipboardWatcher(): void {
    if (this.clipboardWatcher) {
      console.warn('Clipboard watcher already running');
      return;
    }

    console.log('📋 Code Fixer: Starting clipboard watcher...');

    // Note: In Electron, clipboard watching requires native module (node-clipboard-watch)
    // For now, we'll use polling (not ideal but works for demo)
    this.clipboardWatcher = setInterval(() => {
      this.checkClipboard();
    }, 800);

    eventBus.emit({
      type: 'LOG',
      message: 'Code Fixer: Clipboard watcher started',
      level: 'info',
    });
  }

  /**
   * Stop watching clipboard
   */
  stopClipboardWatcher(): void {
    if (this.clipboardWatcher) {
      clearInterval(this.clipboardWatcher);
      this.clipboardWatcher = null;
      console.log('📋 Code Fixer: Clipboard watcher stopped');
    }
  }

  /**
   * Check clipboard content (polling approach)
   */
  private async checkClipboard(): Promise<void> {
    try {
      // In Electron, use electron.clipboard
      const { clipboard } = require('electron');
      const content = clipboard.readText();

      if (content !== this.lastClipboardContent && this.looksLikeCode(content)) {
        this.lastClipboardContent = content;
        console.log('📝 Code detected in clipboard');
        eventBus.emit({
          type: 'CLIPBOARD_DETECTED',
          code: content,
        });
      }
    } catch (error) {
      // Graceful fallback - clipboard may not be available in all contexts
      console.debug('Clipboard check skipped:', error);
    }
  }

  /**
   * Detect if clipboard content looks like code
   */
  private looksLikeCode(text: string): boolean {
    return (
      text.includes('{') ||
      text.includes('def ') ||
      text.includes('function') ||
      text.includes('class ') ||
      text.includes('import ') ||
      text.includes('const ') ||
      text.includes('let ') ||
      text.includes('return') ||
      text.includes('=>')
    );
  }

  /**
   * Fix a code snippet
   */
  async fixCode(code: string, error?: string): Promise<CodeFixResult | null> {
    if (this.isProcessing) {
      console.warn('Code fixer already processing, ignoring request');
      return null;
    }

    if (!aiClient.hasApiKey()) {
      eventBus.emit({
        type: 'FEATURE_FAILED',
        feature: 'code-fixer',
        error: 'Gemini API key not configured',
      });
      return null;
    }

    try {
      this.isProcessing = true;
      await stateMachine.setState('code-fixer-running');

      // Detect language from code
      const language = this.detectLanguage(code);

      const response = await aiClient.fixCode(code, error || null, language);

      if (!response.success) {
        eventBus.emit({
          type: 'FEATURE_FAILED',
          feature: 'code-fixer',
          error: response.error || 'Unknown error',
        });
        return null;
      }

      // Validate response structure
      const result = response.data as any;
      if (!result.original_snippet || !result.fixed_snippet) {
        eventBus.emit({
          type: 'FEATURE_FAILED',
          feature: 'code-fixer',
          error: 'Invalid AI response format',
        });
        return null;
      }

      const fixResult: CodeFixResult = {
        language: result.language || language,
        original: result.original_snippet,
        fixed: result.fixed_snippet,
        explanation: result.explanation || '',
        confidence: result.confidence || 0,
      };

      eventBus.emit({
        type: 'FEATURE_COMPLETE',
        feature: 'code-fixer',
        result: fixResult,
      });

      await stateMachine.setState('idle');

      return fixResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      eventBus.emit({
        type: 'FEATURE_FAILED',
        feature: 'code-fixer',
        error: message,
      });
      await stateMachine.setState('idle');
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Detect programming language from code
   */
  private detectLanguage(code: string): string {
    if (code.includes('public class') || code.includes('private class')) return 'java';
    if (code.includes('def ') || code.includes('import ')) return 'python';
    if (code.includes('function ') || code.includes('=>')) return 'javascript';
    if (code.includes('async fn') || code.includes('impl ')) return 'rust';
    if (code.includes('func ')) return 'swift';
    if (code.includes('package ') || code.includes('type ')) return 'go';
    return 'typescript'; // Default to TypeScript
  }
}

export const codeFixerFeature = new CodeFixerFeature();
