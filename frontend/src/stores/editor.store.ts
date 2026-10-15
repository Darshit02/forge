import { create } from "zustand";

export interface EditorFile {
  path: string;
  content: string;
  dirty: boolean;
  language: string;
}

interface EditorState {
  openFiles: EditorFile[];
  activeFile: string | null;
  openFile: (path: string, content: string, language?: string) => void;
  closeFile: (path: string) => void;
  updateContent: (path: string, content: string) => void;
  markClean: (path: string) => void;
  markDirty: (path: string) => void;
  setActiveFile: (path: string) => void;
}

export function detectLanguageFromPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "py":
      return "python";
    case "ts":
      return "typescript";
    case "tsx":
      return "typescript";
    case "js":
      return "javascript";
    case "jsx":
      return "javascript";
    case "json":
      return "json";
    case "html":
      return "html";
    case "css":
      return "css";
    case "go":
      return "go";
    case "rs":
      return "rust";
    case "md":
      return "markdown";
    case "sh":
      return "shell";
    case "dockerfile":
      return "dockerfile";
    case "yaml":
    case "yml":
      return "yaml";
    default:
      return "plaintext";
  }
}

export const useEditorStore = create<EditorState>((set, get) => ({
  openFiles: [],
  activeFile: null,

  openFile: (filePath, content, customLang) => {
    const { openFiles } = get();
    const existing = openFiles.find((f) => f.path === filePath);

    if (existing) {
      set({ activeFile: filePath });
      return;
    }

    const language = customLang || detectLanguageFromPath(filePath);
    const newFile: EditorFile = {
      path: filePath,
      content,
      dirty: false,
      language,
    };

    set({
      openFiles: [...openFiles, newFile],
      activeFile: filePath,
    });
  },

  closeFile: (filePath) => {
    const { openFiles, activeFile } = get();
    const filtered = openFiles.filter((f) => f.path !== filePath);
    let nextActive = activeFile;

    if (activeFile === filePath) {
      nextActive = filtered.length > 0 ? filtered[filtered.length - 1].path : null;
    }

    set({ openFiles: filtered, activeFile: nextActive });
  },

  updateContent: (filePath, content) => {
    const { openFiles } = get();
    set({
      openFiles: openFiles.map((f) =>
        f.path === filePath ? { ...f, content, dirty: true } : f
      ),
    });
  },

  markClean: (filePath) => {
    const { openFiles } = get();
    set({
      openFiles: openFiles.map((f) =>
        f.path === filePath ? { ...f, dirty: false } : f
      ),
    });
  },

  markDirty: (filePath) => {
    const { openFiles } = get();
    set({
      openFiles: openFiles.map((f) =>
        f.path === filePath ? { ...f, dirty: true } : f
      ),
    });
  },

  setActiveFile: (filePath) => set({ activeFile: filePath }),
}));
