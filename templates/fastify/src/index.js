import Fastify from "fastify";

const fastify = Fastify({ logger: true });

fastify.get("/", async () => {
  return { message: "Hello from Fastify on Forge!", status: "ok" };
});

fastify.get("/openapi.json", async () => {
  return {
    openapi: "3.0.0",
    info: { title: "Fastify API", version: "1.0.0" },
    paths: {
      "/": {
        get: {
          summary: "Root health check",
          responses: { "200": { description: "OK" } }
        }
      }
    }
  };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 8000;
    await fastify.listen({ port, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
