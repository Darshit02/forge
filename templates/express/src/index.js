const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Forge Express Backend',
      version: '1.0.0',
      description: 'Auto-generated backend scaffolded by Forge AI IDE',
    },
    servers: [{ url: 'http://localhost:8000' }],
  },
  apis: ['./src/index.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve raw OpenAPI JSON for Forge Spec Extractor & Tester
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Serve interactive Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

let users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

/**
 * @openapi
 * /health:
 *   get:
 *     summary: System health check
 *     responses:
 *       200:
 *         description: OK
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'express-backend' });
});

/**
 * @openapi
 * /users:
 *   get:
 *     summary: List all users
 *     responses:
 *       200:
 *         description: Array of users
 *   post:
 *     summary: Create a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *     responses:
 *       201:
 *         description: Created user
 */
app.get('/users', (req, res) => {
  res.json(users);
});

app.post('/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  const newUser = { id: users.length + 1, name, email };
  users.push(newUser);
  res.status(201).json(newUser);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
  console.log(`OpenAPI spec available at http://0.0.0.0:${PORT}/openapi.json`);
});
