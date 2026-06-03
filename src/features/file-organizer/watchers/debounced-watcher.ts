export type OrganizerWatchEvent = {
  type: 'created' | 'changed' | 'deleted';
  path: string;
  timestamp: number;
};

export class DebouncedOrganizerWatcher {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private pending = new Map<string, OrganizerWatchEvent>();

  constructor(
    private readonly delayMs: number,
    private readonly onFlush: (events: OrganizerWatchEvent[]) => void,
  ) {}

  push(event: OrganizerWatchEvent): void {
    this.pending.set(event.path, event);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.delayMs);
  }

  flush(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    const events = Array.from(this.pending.values());
    this.pending.clear();
    if (events.length) this.onFlush(events);
  }
}
