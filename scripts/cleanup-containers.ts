import Docker from "dockerode";
import { db } from "../src/db/client.js";
import { projects } from "../src/db/schema.js";
import { env } from "../src/config/env.js";
import { logger } from "../src/utils/logger.js";

async function cleanup() {
  console.log("🧹 Starting Forge container cleanup...");

  const docker = new Docker({ socketPath: env.DOCKER_SOCKET });

  try {
    const containers = await docker.listContainers({
      all: true,
      filters: {
        label: ["forge.project"],
      },
    });

    console.log(`Found ${containers.length} Forge project container(s).`);

    for (const info of containers) {
      try {
        const c = docker.getContainer(info.Id);
        console.log(`Stopping container ${info.Names?.[0] || info.Id}...`);
        if (info.State === "running") {
          await c.stop({ t: 2 });
        }
        console.log(`Removing container ${info.Names?.[0] || info.Id}...`);
        await c.remove({ force: true });
      } catch (err: any) {
        console.warn(`Failed to stop/remove container ${info.Id}:`, err.message);
      }
    }
  } catch (err: any) {
    console.warn("Could not query Docker containers:", err.message);
  }

  try {
    console.log("Resetting project states in database...");
    await db.update(projects).set({
      status: "stopped",
      hostPort: null,
      containerId: null,
      updatedAt: new Date(),
    });
    console.log("✅ Database project statuses reset to 'stopped'.");
  } catch (err: any) {
    console.error("Database reset error:", err.message);
  }

  console.log("✨ Cleanup completed successfully.");
  process.exit(0);
}

cleanup().catch((err) => {
  console.error("Fatal cleanup error:", err);
  process.exit(1);
});
