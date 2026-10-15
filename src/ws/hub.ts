import type { ServerWebSocket } from "bun";
import { projectChannels, type ConnectedClient } from "./channels.js";
import type {
  ProjectStatus,
  TestResponsePayload,
  WSClientMessage,
  WSServerMessage,
} from "../types/index.js";
import { generateShortId } from "../utils/ids.js";
import { logger } from "../utils/logger.js";

export class WebSocketHub {
  private clientRegistry = new Map<ServerWebSocket<unknown>, ConnectedClient>();

  /**
   * Registers a new connected WebSocket client
   */
  handleConnection(
    ws: ServerWebSocket<unknown>,
    userId: string,
    projectId: string
  ): ConnectedClient {
    const clientId = generateShortId(10);
    const client: ConnectedClient = {
      id: clientId,
      userId,
      projectId,
      ws,
    };

    this.clientRegistry.set(ws, client);
    projectChannels.subscribe(projectId, client);

    logger.info(
      { clientId, userId, projectId },
      "WebSocket client connected to Forge Hub"
    );

    return client;
  }

  /**
   * Handles incoming message from client
   */
  handleMessage(ws: ServerWebSocket<unknown>, rawMessage: string | Buffer): void {
    const client = this.clientRegistry.get(ws);
    if (!client) return;

    try {
      const text =
        typeof rawMessage === "string" ? rawMessage : rawMessage.toString("utf8");
      const data = JSON.parse(text) as WSClientMessage;

      switch (data.type) {
        case "ping":
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
          break;
        case "subscribe":
          if (data.projectId && data.projectId !== client.projectId) {
            projectChannels.unsubscribe(client.projectId, client);
            client.projectId = data.projectId;
            projectChannels.subscribe(data.projectId, client);
          }
          break;
        case "unsubscribe":
          if (data.projectId) {
            projectChannels.unsubscribe(data.projectId, client);
          }
          break;
        default:
          logger.debug({ clientId: client.id, data }, "Unhandled client WS message");
      }
    } catch (err: any) {
      logger.warn(
        { clientId: client.id, err: err.message },
        "Error parsing client WebSocket message"
      );
    }
  }

  /**
   * Cleans up disconnected client
   */
  handleDisconnection(ws: ServerWebSocket<unknown>): void {
    const client = this.clientRegistry.get(ws);
    if (client) {
      projectChannels.removeClient(client);
      this.clientRegistry.delete(ws);
      logger.info(
        { clientId: client.id, projectId: client.projectId },
        "WebSocket client disconnected from Forge Hub"
      );
    }
  }

  /**
   * Broadcast helpers for services
   */
  broadcastFileChanged(projectId: string, path: string, content?: string): void {
    projectChannels.broadcast(projectId, {
      type: "file.changed",
      path,
      content,
    });
  }

  broadcastContainerStatus(projectId: string, status: ProjectStatus): void {
    projectChannels.broadcast(projectId, {
      type: "container.status",
      status,
    });
  }

  broadcastContainerLog(projectId: string, line: string): void {
    projectChannels.broadcast(projectId, {
      type: "container.log",
      line,
    });
  }

  broadcastSpecUpdated(projectId: string, spec: Record<string, unknown>): void {
    projectChannels.broadcast(projectId, {
      type: "spec.updated",
      spec,
    });
  }

  broadcastAiToken(projectId: string, delta: string): void {
    projectChannels.broadcast(projectId, {
      type: "ai.token",
      delta,
    });
  }

  broadcastAiDone(projectId: string, messageId: string): void {
    projectChannels.broadcast(projectId, {
      type: "ai.done",
      messageId,
    });
  }

  broadcastTestResult(
    projectId: string,
    requestId: string | undefined,
    response: TestResponsePayload
  ): void {
    projectChannels.broadcast(projectId, {
      type: "test.result",
      requestId,
      response,
    });
  }
}

export const wsHub = new WebSocketHub();
