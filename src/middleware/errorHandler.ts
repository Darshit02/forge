import type { Context } from "hono";
import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

/**
 * Global error handler for the Hono application
 */
export function errorHandler(err: Error, c: Context) {
  // 1. Operational AppErrors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: c.req.path }, err.message);
    } else {
      logger.warn({ err: err.message, path: c.req.path, code: err.statusCode });
    }

    return c.json(
      {
        error: err.message,
        statusCode: err.statusCode,
        details: err.details,
      },
      err.statusCode
    );
  }

  // 2. Zod validation errors
  if (err instanceof ZodError) {
    logger.warn({ err: err.issues, path: c.req.path }, "Validation error");
    return c.json(
      {
        error: "Validation failed",
        statusCode: 422,
        details: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      422
    );
  }

  // 3. Fallback for unhandled internal errors
  logger.error(
    {
      err: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
      path: c.req.path,
      method: c.req.method,
    },
    "Unhandled internal server error"
  );

  return c.json(
    {
      error: "Internal Server Error",
      statusCode: 500,
      details:
        process.env.NODE_ENV === "development" ? err.message : undefined,
    },
    500
  );
}
