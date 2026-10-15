import { describe, it, expect } from "bun:test";
import { specExtractorService } from "../src/services/specExtractor.service.js";

describe("SpecExtractorService (AST Route Extraction)", () => {
  it("should extract Express routes from JS code using Babel AST", () => {
    const code = `
      const express = require('express');
      const app = express();

      app.get('/health', (req, res) => res.json({ status: 'ok' }));
      app.post('/api/users', (req, res) => res.json({ id: 1 }));
      app.delete('/api/users/:id', (req, res) => res.sendStatus(204));
    `;

    const pathsObj: Record<string, any> = {};
    (specExtractorService as any).parseJsTsAst(code, pathsObj);

    expect(pathsObj["/health"]).toBeDefined();
    expect(pathsObj["/health"].get).toBeDefined();

    expect(pathsObj["/api/users"]).toBeDefined();
    expect(pathsObj["/api/users"].post).toBeDefined();

    expect(pathsObj["/api/users/:id"]).toBeDefined();
    expect(pathsObj["/api/users/:id"].delete).toBeDefined();
  });

  it("should extract Python FastAPI/Flask routes from source code", () => {
    const pythonCode = `
      from fastapi import FastAPI
      app = FastAPI()

      @app.get("/items")
      def read_items():
          return []

      @app.post("/items")
      def create_item():
          return {}
    `;

    const pathsObj: Record<string, any> = {};
    (specExtractorService as any).parsePythonRoutes(pythonCode, pathsObj);

    expect(pathsObj["/items"]).toBeDefined();
    expect(pathsObj["/items"].get).toBeDefined();
    expect(pathsObj["/items"].post).toBeDefined();
  });
});
