import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/transactions/route';

describe('Transactions API', () => {
  describe('GET /api/transactions', () => {
    it('should return 400 if userId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'userId is required' });
    });

    it('should return empty array for user with no transactions', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/transactions?userId=user123'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ transactions: [] });
    });
  });

  describe('POST /api/transactions', () => {
    it('should return 400 if required fields are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Test',
          // Missing other required fields
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'Missing required fields' });
    });

    it('should return 400 if type is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Test Transaction',
          amount: 100,
          type: 'invalid',
          date: '2024-01-01',
          category: 'Food',
          userId: 'user123',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'Type must be "income" or "expense"' });
    });

    it('should return 400 if amount is not positive', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Test Transaction',
          amount: -100,
          type: 'expense',
          date: '2024-01-01',
          category: 'Food',
          userId: 'user123',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'Amount must be a positive number' });
    });

    it('should create a new transaction successfully', async () => {
      const transactionData = {
        description: 'Grocery Shopping',
        amount: 150.50,
        type: 'expense' as const,
        date: '2024-01-15',
        category: 'Food',
        userId: 'user123',
      };

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      
      expect(data.transaction).toMatchObject(transactionData);
      expect(data.transaction).toHaveProperty('id');
      expect(data.transaction.id).toMatch(/^txn_\d+$/);
    });

    it('should retrieve created transaction via GET', async () => {
      // First create a transaction
      const createRequest = new NextRequest(
        'http://localhost:3000/api/transactions',
        {
          method: 'POST',
          body: JSON.stringify({
            description: 'Salary',
            amount: 5000,
            type: 'income',
            date: '2024-01-01',
            category: 'Salary',
            userId: 'user456',
          }),
        }
      );

      const createResponse = await POST(createRequest);
      const createdData = await createResponse.json();
      const transactionId = createdData.transaction.id;

      // Then retrieve it
      const getRequest = new NextRequest(
        'http://localhost:3000/api/transactions?userId=user456'
      );
      const getResponse = await GET(getRequest);

      expect(getResponse.status).toBe(200);
      const getData = await getResponse.json();
      expect(getData.transactions).toHaveLength(1);
      expect(getData.transactions[0].id).toBe(transactionId);
      expect(getData.transactions[0].description).toBe('Salary');
    });
  });
});

