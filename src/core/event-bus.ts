/**
 * Event Bus - Decoupled inter-module event system
 * Enables features to communicate without direct dependencies
 */

export type AppEvent = 
  | { type: 'FEATURE_SELECTED'; feature: string; payload?: any }
  | { type: 'MINIMIZE_TO_TRAY' }
  | { type: 'SHOW_MENU' }
  | { type: 'CLIPBOARD_DETECTED'; code: string }
  | { type: 'AI_RESPONSE'; feature: string; response: any }
  | { type: 'AI_ERROR'; feature: string; error: string }
  | { type: 'FEATURE_COMPLETE'; feature: string; result: any }
  | { type: 'FEATURE_FAILED'; feature: string; error: string }
  | { type: 'STATE_CHANGED'; state: AppState }
  | { type: 'LOG'; message: string; level: 'info' | 'warn' | 'error' };

export type AppState = 'idle' | 'menu-open' | 'code-fixer-running' | 'environment-running' | 'organizer-running' | 'error';

type EventListener<T extends AppEvent = AppEvent> = (event: T) => void;

class EventBus {
  private listeners: Map<string, Set<EventListener>> = new Map();

  /**
   * Subscribe to a specific event type
   */
  on<T extends AppEvent>(eventType: T['type'], listener: (event: T) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener as EventListener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(listener as EventListener);
    };
  }

  /**
   * Subscribe to one event only
   */
  once<T extends AppEvent>(eventType: T['type'], listener: (event: T) => void): void {
    const unsubscribe = this.on(eventType, (event: AppEvent) => {
      listener(event as T);
      unsubscribe();
    });
  }

  /**
   * Emit an event to all listeners
   */
  emit(event: AppEvent): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
          this.emit({
            type: 'LOG',
            message: `Event listener error: ${error}`,
            level: 'error',
          });
        }
      });
    }
  }

  /**
   * Emit and wait for response (promise-based)
   */
  async emitAndWait<T extends AppEvent>(event: T, responseType: string, timeout: number = 30000): Promise<AppEvent> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error(`Event timeout waiting for ${responseType}`));
      }, timeout);

      const unsubscribe = this.on(responseType as any, (response: AppEvent) => {
        clearTimeout(timer);
        unsubscribe();
        resolve(response);
      });

      this.emit(event);
    });
  }

  /**
   * Clear all listeners (useful for cleanup/testing)
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Get listener count for debugging
   */
  getListenerCount(eventType?: string): number {
    if (eventType) {
      return this.listeners.get(eventType)?.size ?? 0;
    }
    let total = 0;
    this.listeners.forEach((set) => {
      total += set.size;
    });
    return total;
  }
}

export const eventBus = new EventBus();
