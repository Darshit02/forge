import { z } from "zod";

export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.unknown().optional(),
  statusCode: z.number(),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorSchema>;
