/**
 * Helper for testing Next.js API routes with Supertest
 * This creates a minimal Express-like server for testing
 */

import { Server } from 'http';
import { NextRequest } from 'next/server';
import { Request, Response } from 'express';

export class TestServer {
  private server: Server | null = null;

  /**
   * Convert Next.js API route handler to Express-like handler for Supertest
   */
  async createRequestHandler(
    handler: (req: NextRequest) => Promise<Response>
  ) {
    return async (req: Request, res: Response) => {
      const url = `http://localhost${req.url}`;
      const nextRequest = new NextRequest(url, {
        method: req.method,
        headers: req.headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' 
          ? JSON.stringify(req.body) 
          : undefined,
      });

      try {
        const response = await handler(nextRequest);
        res.status(response.status);
        
        // Copy headers
        response.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });

        // Send response body
        const data = await response.json();
        res.json(data);
      } catch {
        res.status(500).json({ error: 'Internal server error' });
      }
    };
  }
}

