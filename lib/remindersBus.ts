// lib/remindersBus.ts
export type ReminderChange = {
  event_id: number;
  place_id: string;
  hasReminder: boolean;
};

type Listener = (change: ReminderChange) => void;

class RemindersBus {
  private listeners = new Set<Listener>();

  on(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(change: ReminderChange) {
    // fire-and-forget to all listeners
    for (const l of Array.from(this.listeners)) {
      try { l(change); } catch { /* noop */ }
    }
  }
}

export const remindersBus = new RemindersBus();
