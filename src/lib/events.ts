/**
 * Global event system for cross-component communication
 * Use this to trigger data refreshes across the app
 */

type EventCallback = () => void;

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event: string) {
    console.log(`[EventBus] Emitting event: ${event}`);
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback());
    }
  }
}

export const eventBus = new EventBus();

// Event constants
export const EVENTS = {
  REVIEW_COMPLETED: 'review:completed',
  DATA_REFRESH_NEEDED: 'data:refresh',
} as const;
