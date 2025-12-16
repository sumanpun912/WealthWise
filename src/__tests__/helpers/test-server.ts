/**
 * Helper for testing Next.js API routes with Supertest
 * This creates a minimal Express-like server for testing
 */

import { Server } from 'http';
import { NextRequest } from 'next/server';
import { Request, Response as ExpressResponse } from 'express';

export class TestServer {
  private server: Server | null = null;

  /**
   * Convert Next.js API route handler to Express-like handler for Supertest
   */
  async createRequestHandler(
    handler: (req: NextRequest) => Promise<Response>
  ) {
    return async (req: Request, res: ExpressResponse) => {
      const url = `http://localhost${req.url}`;
      
      // Convert Express headers to HeadersInit format
      const headers = new Headers();
      Object.entries(req.headers).forEach(([key, value]) => {
        if (value) {
          headers.set(key, Array.isArray(value) ? value.join(', ') : value);
        }
      });

      const nextRequest = new NextRequest(url, {
        method: req.method,
        headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' 
          ? JSON.stringify(req.body) 
          : undefined,
      });

      try {
        const response = await handler(nextRequest);
        res.status(response.status);
        
        // Copy headers from Web API Response to Express response
        response.headers.forEach((value: string, key: string) => {
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

