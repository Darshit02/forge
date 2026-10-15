import { env } from "../env.js";
import type { WSServerMessage } from "../../types/api.js";

type MessageHandler = (data: any) => void;

class ProjectWebSocket {
  private ws: WebSocket | null = null;
  private currentProjectId: string | null = null;
  private subscribers = new Map<string, Set<MessageHandler>>();
  private reconnectTimeout: number | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private isExplicitDisconnect = false;
  private onReconnectCallbacks = new Set<() => void>();

  connect(projectId: string) {
    if (this.currentProjectId === projectId && this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.disconnect();
    this.currentProjectId = projectId;
    this.isExplicitDisconnect = false;

    const token = localStorage.getItem("forge_access_token") || "";
    const wsUrl = `${env.VITE_WS_URL}/ws?projectId=${encodeURIComponent(
      projectId
    )}&token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectDelay = 1000;
        this.emit("connection.state", { connected: true });

        // Trigger onReconnect callbacks if reconnecting
        this.onReconnectCallbacks.forEach((cb) => cb());
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WSServerMessage;
          if (msg.type) {
            this.emit(msg.type, msg);
          }
        } catch {
          // non-JSON message
        }
      };

      this.ws.onclose = () => {
        this.emit("connection.state", { connected: false });
        if (!this.isExplicitDisconnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.warn("WebSocket error:", err);
      };
    } catch (err) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;

    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.currentProjectId && !this.isExplicitDisconnect) {
        this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
        this.connect(this.currentProjectId);
      }
    }, this.reconnectDelay);
  }

  subscribe(type: string, handler: MessageHandler): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(handler);

    return () => {
      this.subscribers.get(type)?.delete(handler);
    };
  }

  onReconnect(callback: () => void): () => void {
    this.onReconnectCallbacks.add(callback);
    return () => {
      this.onReconnectCallbacks.delete(callback);
    };
  }

  emit(type: string, data: any) {
    const handlers = this.subscribers.get(type);
    if (handlers) {
      handlers.forEach((h) => h(data));
    }
  }

  send(data: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.isExplicitDisconnect = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentProjectId = null;
  }
}

export const projectSocket = new ProjectWebSocket();
