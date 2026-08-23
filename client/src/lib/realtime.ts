import { api } from './api';

type RealtimeCallback = (data: any) => void;

class RealtimeClient {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<RealtimeCallback>> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  /**
   * Connect to the SSE stream using the authenticated JWT token
   */
  public connect(token?: string): void {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) return;

    this.token = activeToken;

    if (this.eventSource) {
      if (this.eventSource.readyState === EventSource.OPEN) {
        return; // Already connected
      }
      this.disconnect();
    }

    this.isConnecting = true;

    try {
      // Determine API base URL
      const baseUrl =
        import.meta.env.VITE_API_URL ||
        (window.location.hostname === 'localhost'
          ? 'http://localhost:5000/api'
          : '/api');

      const streamUrl = `${baseUrl.replace(/\/$/, '')}/realtime/stream?token=${encodeURIComponent(
        activeToken
      )}`;

      const es = new EventSource(streamUrl);

      es.onopen = () => {
        this.isConnecting = false;
      };

      // Built-in SSE events
      const registeredEvents = [
        'connected',
        'new_direct_message',
        'direct_message_sent',
        'typing',
        'chat_message',
        'chat_pin',
        'chat_delete',
        'chat_typing',
        'presence',
      ];

      registeredEvents.forEach((eventName) => {
        es.addEventListener(eventName, (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            this.emit(eventName, parsed);
          } catch (err) {
            console.error(`Error parsing realtime event [${eventName}]:`, err);
          }
        });
      });

      es.onerror = () => {
        this.isConnecting = false;
        this.disconnect();
        // Exponential backoff reconnect
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect(this.token || undefined);
          }, 3000);
        }
      };

      this.eventSource = es;
    } catch (err) {
      console.error('Error establishing Realtime SSE stream:', err);
      this.isConnecting = false;
    }
  }

  /**
   * Close the connection
   */
  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnecting = false;
  }

  /**
   * Listen for real-time events
   */
  public on(event: string, callback: RealtimeCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Auto-connect if not connected yet
    if (!this.eventSource && !this.isConnecting && localStorage.getItem('token')) {
      this.connect();
    }

    // Return un-subscribe cleanup function
    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
      }
    };
  }

  /**
   * Emit event internally to subscribers
   */
  private emit(event: string, data: any): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in realtime listener callback [${event}]:`, err);
        }
      });
    }
  }

  /**
   * Send Typing indicator for direct message
   */
  public sendTyping(recipientId: string, isTyping: boolean): void {
    api.post('/realtime/typing', { recipientId, isTyping }).catch(() => {});
  }

  /**
   * Send Typing indicator for group chat room
   */
  public sendChatTyping(channelId: string, isTyping: boolean): void {
    api.post('/realtime/chat-typing', { channelId, isTyping }).catch(() => {});
  }
}

export const realtime = new RealtimeClient();
