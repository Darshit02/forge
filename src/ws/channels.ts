import type { ServerWebSocket } from "bun";
import type { WSServerMessage } from "../types/index.js";
import { logger } from "../utils/logger.js";

export interface ConnectedClient {
  id: string;
  userId: string;
  projectId: string;
  ws: ServerWebSocket<unknown>;
}

export class ProjectChannels {
  // Map of projectId -> Set of connected clients
  private channels = new Map<string, Set<ConnectedClient>>();

  /**
   * Subscribes a client to a project's channel
   */
  subscribe(projectId: string, client: ConnectedClient): void {
    if (!this.channels.has(projectId)) {
      this.channels.set(projectId, new Set());
    }
    this.channels.get(projectId)!.add(client);
    logger.debug(
      { projectId, clientId: client.id, userId: client.userId },
      "WebSocket client subscribed to project channel"
    );
  }

  /**
   * Unsubscribes a client from a project's channel
   */
  unsubscribe(projectId: string, client: ConnectedClient): void {
    const clients = this.channels.get(projectId);
    if (clients) {
      clients.delete(client);
      if (clients.size === 0) {
        this.channels.delete(projectId);
      }
    }
    logger.debug(
      { projectId, clientId: client.id },
      "WebSocket client unsubscribed from project channel"
    );
  }

  /**
   * Removes client from all channels
   */
  removeClient(client: ConnectedClient): void {
    for (const [projectId, clients] of this.channels.entries()) {
      if (clients.has(client)) {
        clients.delete(client);
        if (clients.size === 0) {
          this.channels.delete(projectId);
        }
      }
    }
  }

  /**
   * Broadcasts a message to all clients subscribed to a project
   */
  broadcast(projectId: string, message: WSServerMessage): void {
    const clients = this.channels.get(projectId);
    if (!clients || clients.size === 0) {
      return;
    }

    const payload = JSON.stringify(message);
    for (const client of clients) {
      try {
        client.ws.send(payload);
      } catch (err: any) {
        logger.warn(
          { clientId: client.id, projectId, err: err.message },
          "Failed to send WebSocket message to client, removing from channel"
        );
        clients.delete(client);
      }
    }
  }

  /**
   * Get active subscriber count for a project
   */
  getSubscriberCount(projectId: string): number {
    return this.channels.get(projectId)?.size || 0;
  }
}

export const projectChannels = new ProjectChannels();
