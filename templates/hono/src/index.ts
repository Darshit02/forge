import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';

const app = new OpenAPIHono();

// Schema definitions
const UserSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: 'Alice' }),
    email: z.string().email().openapi({ example: 'alice@example.com' }),
  })
  .openapi('User');

const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

// Health Route
app.openapi(
  createRoute({
    method: 'get',
    path: '/health',
    summary: 'System health check',
    responses: {
      200: {
        description: 'Health response',
        content: {
          'application/json': {
            schema: z.object({ status: z.string(), service: z.string() }),
          },
        },
      },
    },
  }),
  (c) => c.json({ status: 'ok', service: 'hono-backend' })
);

// List Users Route
app.openapi(
  createRoute({
    method: 'get',
    path: '/users',
    summary: 'Retrieve all users',
    responses: {
      200: {
        description: 'Array of users',
        content: {
          'application/json': {
            schema: z.array(UserSchema),
          },
        },
      },
    },
  }),
  (c) => c.json(users)
);

// Create User Route
app.openapi(
  createRoute({
    method: 'post',
    path: '/users',
    summary: 'Create a new user',
    request: {
      body: {
        content: {
          'application/json': {
            schema: UserSchema.omit({ id: true }),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Created user',
        content: {
          'application/json': {
            schema: UserSchema,
          },
        },
      },
    },
  }),
  (c) => {
    const data = c.req.valid('json');
    const newUser = { id: users.length + 1, ...data };
    users.push(newUser);
    return c.json(newUser, 201);
  }
);

// The OpenAPI JSON specification endpoint consumed by Forge
app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Forge Hono Backend',
    description: 'Auto-generated backend scaffolded by Forge AI IDE',
  },
});

export default {
  port: 8000,
  fetch: app.fetch,
};
