import { createMocks } from 'node-mocks-http';
import { GET } from '@/app/api/health/route';
import { NextRequest } from 'next/server';

describe('GET /api/health', () => {
  it('should return 200 with health status', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      status: 'ok',
      message: 'API is healthy',
    });
  });
});

