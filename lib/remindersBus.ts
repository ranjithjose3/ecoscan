// lib/remindersBus.ts
type RemindersBusEvent = {
  event_id: number;
  place_id: string;
  hasReminder: boolean;
};

type Listener = (event?: RemindersBusEvent) => void;

class RemindersBus {
  private listeners: Listener[] = [];

  on(listener: Listener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  emit(event?: RemindersBusEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in reminders bus listener:', error);
      }
    });
  }

  removeAllListeners(): void {
    this.listeners = [];
  }
}

export const remindersBus = new RemindersBus();
