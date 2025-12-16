/**
 * Example of using Supertest for API integration testing
 * This demonstrates how to test Next.js API routes with Supertest
 */

import request from 'supertest';
import express, { Express, Request, Response } from 'express';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/transactions/route';

// Create an Express app wrapper for Next.js API routes
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Wrap Next.js route handlers to work with Express
  app.get('/api/transactions', async (req: Request, res: Response) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    Object.keys(req.query).forEach((key) => {
      url.searchParams.set(key, req.query[key] as string);
    });

    const nextRequest = new NextRequest(url.toString(), {
      method: 'GET',
      headers: new Headers(req.headers as Record<string, string>),
    });

    try {
      const response = await GET(nextRequest);
      res.status(response.status);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/transactions', async (req: Request, res: Response) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const nextRequest = new NextRequest(url.toString(), {
      method: 'POST',
      headers: new Headers(req.headers as Record<string, string>),
      body: JSON.stringify(req.body),
    });

    try {
      const response = await POST(nextRequest);
      res.status(response.status);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return app;
}

describe('Transactions API - Supertest Integration Tests', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/transactions', () => {
    it('should return 400 if userId is missing', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .expect(400);

      expect(response.body).toEqual({ error: 'userId is required' });
    });

    it('should return empty array for user with no transactions', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({ userId: 'user123' })
        .expect(200);

      expect(response.body).toEqual({ transactions: [] });
      expect(Array.isArray(response.body.transactions)).toBe(true);
    });

    it('should return transactions for a specific user', async () => {
      // First create a transaction
      await request(app)
        .post('/api/transactions')
        .send({
          description: 'Test Transaction',
          amount: 100,
          type: 'expense',
          date: '2024-01-01',
          category: 'Food',
          userId: 'user789',
        })
        .expect(201);

      // Then retrieve it
      const response = await request(app)
        .get('/api/transactions')
        .query({ userId: 'user789' })
        .expect(200);

      expect(response.body.transactions).toHaveLength(1);
      expect(response.body.transactions[0].description).toBe('Test Transaction');
    });
  });

  describe('POST /api/transactions', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send({
          description: 'Test',
          // Missing other required fields
        })
        .expect(400);

      expect(response.body).toEqual({ error: 'Missing required fields' });
    });

    it('should return 400 if type is invalid', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send({
          description: 'Test Transaction',
          amount: 100,
          type: 'invalid',
          date: '2024-01-01',
          category: 'Food',
          userId: 'user123',
        })
        .expect(400);

      expect(response.body).toEqual({ error: 'Type must be "income" or "expense"' });
    });

    it('should return 400 if amount is not positive', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send({
          description: 'Test Transaction',
          amount: -100,
          type: 'expense',
          date: '2024-01-01',
          category: 'Food',
          userId: 'user123',
        })
        .expect(400);

      expect(response.body).toEqual({ error: 'Amount must be a positive number' });
    });

    it('should return 400 if amount is zero', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send({
          description: 'Test Transaction',
          amount: 0,
          type: 'expense',
          date: '2024-01-01',
          category: 'Food',
          userId: 'user123',
        })
        .expect(400);

      expect(response.body).toEqual({ error: 'Amount must be a positive number' });
    });

    it('should create a new expense transaction successfully', async () => {
      const transactionData = {
        description: 'Grocery Shopping',
        amount: 150.50,
        type: 'expense',
        date: '2024-01-15',
        category: 'Food',
        userId: 'user123',
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData)
        .expect(201)
        .expect('Content-Type', /json/);

      expect(response.body.transaction).toMatchObject(transactionData);
      expect(response.body.transaction).toHaveProperty('id');
      expect(response.body.transaction.id).toMatch(/^txn_\d+$/);
    });

    it('should create a new income transaction successfully', async () => {
      const transactionData = {
        description: 'Salary Payment',
        amount: 5000,
        type: 'income',
        date: '2024-01-01',
        category: 'Salary',
        userId: 'user456',
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData)
        .expect(201);

      expect(response.body.transaction.type).toBe('income');
      expect(response.body.transaction.amount).toBe(5000);
    });

    it('should handle multiple transactions for the same user', async () => {
      const userId = 'user999';

      // Create first transaction
      await request(app)
        .post('/api/transactions')
        .send({
          description: 'Transaction 1',
          amount: 100,
          type: 'expense',
          date: '2024-01-01',
          category: 'Food',
          userId,
        })
        .expect(201);

      // Create second transaction
      await request(app)
        .post('/api/transactions')
        .send({
          description: 'Transaction 2',
          amount: 200,
          type: 'expense',
          date: '2024-01-02',
          category: 'Transport',
          userId,
        })
        .expect(201);

      // Retrieve all transactions
      const response = await request(app)
        .get('/api/transactions')
        .query({ userId })
        .expect(200);

      expect(response.body.transactions).toHaveLength(2);
    });
  });

  describe('API Integration Flow', () => {
    it('should support full CRUD-like flow: create and retrieve', async () => {
      const userId = 'integration_user';
      const transactionData = {
        description: 'Integration Test Transaction',
        amount: 250.75,
        type: 'expense' as const,
        date: '2024-01-20',
        category: 'Shopping',
        userId,
      };

      // Create transaction
      const createResponse = await request(app)
        .post('/api/transactions')
        .send(transactionData)
        .expect(201);

      const createdTransaction = createResponse.body.transaction;
      expect(createdTransaction.id).toBeDefined();

      // Retrieve transaction
      const getResponse = await request(app)
        .get('/api/transactions')
        .query({ userId })
        .expect(200);

      expect(getResponse.body.transactions).toHaveLength(1);
      expect(getResponse.body.transactions[0].id).toBe(createdTransaction.id);
      expect(getResponse.body.transactions[0]).toMatchObject(transactionData);
    });
  });
});

