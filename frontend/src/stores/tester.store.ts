import { create } from "zustand";
import type {
  APIRequest,
  TestHistoryItem,
  TestResponsePayload,
} from "../types/api.js";

export interface ActiveRequestState {
  id?: string;
  collectionId?: string | null;
  name: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string;
  bodyType: "json" | "raw" | "form";
  authType: "none" | "bearer" | "basic" | "apiKey";
  bearerToken?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyLocation?: "header" | "query";
  basicUser?: string;
  basicPass?: string;
}

interface TesterState {
  activeRequest: ActiveRequestState;
  activeResponse: TestResponsePayload | null;
  isSending: boolean;
  history: TestHistoryItem[];

  setActiveRequest: (req: Partial<ActiveRequestState>) => void;
  loadSavedRequest: (req: APIRequest) => void;
  setActiveResponse: (res: TestResponsePayload | null) => void;
  setIsSending: (isSending: boolean) => void;
  setHistory: (history: TestHistoryItem[]) => void;
  addHistoryItem: (item: TestHistoryItem) => void;
}

const defaultRequest: ActiveRequestState = {
  name: "New Request",
  method: "GET",
  path: "/health",
  headers: {
    Accept: "application/json",
  },
  body: "{\n  \n}",
  bodyType: "json",
  authType: "none",
};

export const useTesterStore = create<TesterState>((set, get) => ({
  activeRequest: defaultRequest,
  activeResponse: null,
  isSending: false,
  history: [],

  setActiveRequest: (partial) =>
    set({ activeRequest: { ...get().activeRequest, ...partial } }),

  loadSavedRequest: (saved) => {
    let bodyStr = "{}";
    if (typeof saved.body === "string") {
      bodyStr = saved.body;
    } else if (saved.body && typeof saved.body === "object") {
      bodyStr = JSON.stringify(saved.body, null, 2);
    }

    set({
      activeRequest: {
        id: saved.id,
        collectionId: saved.collectionId,
        name: saved.name,
        method: saved.method,
        path: saved.path,
        headers: saved.headers || {},
        body: bodyStr,
        bodyType: "json",
        authType: (saved.authConfig?.type as any) || "none",
        bearerToken: (saved.authConfig?.token as string) || "",
      },
      activeResponse: saved.lastResponse || null,
    });
  },

  setActiveResponse: (activeResponse) => set({ activeResponse }),
  setIsSending: (isSending) => set({ isSending }),
  setHistory: (history) => set({ history }),
  addHistoryItem: (item) => set({ history: [item, ...get().history] }),
}));
