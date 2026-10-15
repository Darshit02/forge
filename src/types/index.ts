import type { ServerWebSocket } from "bun";
import type { AuthUser } from "@forge/shared";

export * from "@forge/shared";

export type AuthenticatedUser = AuthUser;

export interface JwtPayload {
  userId: string;
  email: string;
  type: "access" | "refresh";
}

export interface ClientConnectionContext {
  userId: string;
  projectId: string;
  ws: ServerWebSocket<unknown>;
}
