/**
 * Shared event emitter for Phaser ↔ React communication.
 *
 * Uses a Phaser-free implementation to avoid SSR issues (Phaser has no default
 * ESM export and is browser-only). API matches Phaser.Events.EventEmitter.
 *
 * Phaser → React events:
 *   'player-near-door'     { doorId: string; questionType: string }
 *   'health-changed'       { hearts: number }
 *   'lexicoins-changed'    { amount: number }
 *   'show-dialogue'        { lines: string[]; portrait: string }
 *   'chapter-complete'     { chapterId: number }
 *   'current-scene-ready'  scene: Phaser.Scene
 *
 * React → Phaser events:
 *   'question-result'      { correct: boolean; doorId: string }
 *   'use-consumable'       { itemId: string }
 *   'game-paused'
 *   'game-resumed'
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (...args: any[]) => void;
type ListenerEntry = { fn: Listener; ctx?: unknown };

class EventEmitter {
  private _listeners: Record<string, ListenerEntry[]> = {};

  on(event: string, fn: Listener, context?: unknown): this {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push({ fn, ctx: context });
    return this;
  }

  off(event: string, fn?: Listener, context?: unknown): this {
    if (!this._listeners[event]) return this;
    if (!fn) {
      this._listeners[event] = [];
      return this;
    }
    this._listeners[event] = this._listeners[event].filter(
      (e) => e.fn !== fn || (context !== undefined && e.ctx !== context)
    );
    return this;
  }

  emit(event: string, ...args: unknown[]): boolean {
    const entries = this._listeners[event];
    if (!entries?.length) return false;
    entries.forEach(({ fn, ctx }) => fn.apply(ctx, args));
    return true;
  }
}

export const EventBus = new EventEmitter();
