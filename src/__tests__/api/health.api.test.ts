import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('should return 200 with health status', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      status: 'ok',
      message: 'API is healthy',
    });
  });
});

