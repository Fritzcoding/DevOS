"use strict";
/**
 * Event Bus - Decoupled inter-module event system
 * Enables features to communicate without direct dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = void 0;
class EventBus {
    listeners = new Map();
    /**
     * Subscribe to a specific event type
     */
    on(eventType, listener) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType).add(listener);
        // Return unsubscribe function
        return () => {
            this.listeners.get(eventType)?.delete(listener);
        };
    }
    /**
     * Subscribe to one event only
     */
    once(eventType, listener) {
        const unsubscribe = this.on(eventType, (event) => {
            listener(event);
            unsubscribe();
        });
    }
    /**
     * Emit an event to all listeners
     */
    emit(event) {
        const listeners = this.listeners.get(event.type);
        if (listeners) {
            listeners.forEach((listener) => {
                try {
                    listener(event);
                }
                catch (error) {
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
    async emitAndWait(event, responseType, timeout = 30000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                unsubscribe();
                reject(new Error(`Event timeout waiting for ${responseType}`));
            }, timeout);
            const unsubscribe = this.on(responseType, (response) => {
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
    clear() {
        this.listeners.clear();
    }
    /**
     * Get listener count for debugging
     */
    getListenerCount(eventType) {
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
exports.eventBus = new EventBus();
