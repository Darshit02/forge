import chokidar, { type FSWatcher } from "chokidar";
import fs from "node:fs/promises";
import path from "node:path";
import { CONSTANTS } from "../config/constants.js";
import { fileStoreService } from "./fileStore.service.js";
import { specExtractorService } from "./specExtractor.service.js";
import { wsHub } from "../ws/hub.js";
import { logger } from "../utils/logger.js";

export class WatcherService {
  private activeWatchers = new Map<string, FSWatcher>();
  private debounceTimers = new Map<string, Timer>();

  /**
   * Starts a chokidar watcher for a project's workspace directory
   */
  async startWatcher(projectId: string): Promise<void> {
    if (this.activeWatchers.has(projectId)) {
      return;
    }

    const workspaceDir = fileStoreService.getWorkspaceDir(projectId);
    await fileStoreService.initWorkspace(projectId);

    const watcher = chokidar.watch(workspaceDir, {
      ignored: [...CONSTANTS.WATCHER.IGNORED_PATHS],
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: CONSTANTS.WATCHER.STABILITY_THRESHOLD_MS,
        pollInterval: 100,
      },
    });

    const handleFileEvent = async (filePath: string, eventType: string) => {
      const relPath = fileStoreService.getRelativePath(projectId, filePath);
      logger.debug(
        { projectId, eventType, relPath },
        "File event detected in workspace"
      );

      // Read updated content if file exists
      let content: string | undefined;
      try {
        const stat = await fs.stat(filePath);
        if (
          stat.isFile() &&
          stat.size <= CONSTANTS.LIMITS.MAX_CONTEXT_FILE_SIZE_BYTES
        ) {
          content = await fs.readFile(filePath, "utf8");
        }
      } catch {
        // file may have been deleted
      }

      // 1. Emit file.changed via WebSocket immediately
      wsHub.broadcastFileChanged(projectId, relPath, content);

      // 2. Debounce spec re-fetch & sync by 800ms
      this.triggerDebouncedSpecSync(projectId);
    };

    watcher
      .on("add", (p) => handleFileEvent(p, "add"))
      .on("change", (p) => handleFileEvent(p, "change"))
      .on("unlink", (p) => handleFileEvent(p, "unlink"))
      .on("error", (err) => {
        logger.error({ projectId, err }, "Chokidar watcher error");
      });

    this.activeWatchers.set(projectId, watcher);
    logger.info({ projectId, workspaceDir }, "Started workspace file watcher");
  }

  /**
   * Triggers a debounced re-fetch and synchronization of OpenAPI spec
   */
  private triggerDebouncedSpecSync(projectId: string): void {
    const existingTimer = this.debounceTimers.get(projectId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
      this.debounceTimers.delete(projectId);
      try {
        logger.info(
          { projectId },
          "Executing debounced spec extraction & synchronization"
        );
        await specExtractorService.extractAndSync(projectId);
      } catch (err: any) {
        logger.warn(
          { projectId, err: err.message },
          "Failed to extract/sync spec following file change"
        );
      }
    }, CONSTANTS.WATCHER.DEBOUNCE_SPEC_MS);

    this.debounceTimers.set(projectId, timer);
  }

  /**
   * Stops and closes watcher for a project
   */
  async stopWatcher(projectId: string): Promise<void> {
    const timer = this.debounceTimers.get(projectId);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(projectId);
    }

    const watcher = this.activeWatchers.get(projectId);
    if (watcher) {
      await watcher.close();
      this.activeWatchers.delete(projectId);
      logger.info({ projectId }, "Stopped workspace file watcher");
    }
  }

  /**
   * Stops all active watchers on server shutdown
   */
  async stopAll(): Promise<void> {
    for (const [projectId] of this.activeWatchers) {
      await this.stopWatcher(projectId);
    }
    logger.info("All workspace file watchers stopped");
  }
}

export const watcherService = new WatcherService();
