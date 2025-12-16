# Testing Guide

This project uses **Jest** for unit testing and **Supertest** for API integration testing.

## Setup

All testing dependencies are already installed. The project includes:

- **Jest**: Test runner and assertion library
- **Supertest**: HTTP assertion library for API testing
- **@testing-library/react**: React component testing utilities
- **ts-jest**: TypeScript support for Jest

## Running Tests

### Run All Unit Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run API Integration Tests

```bash
npm run test:api
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Only Unit Tests (Excluding API Tests)

```bash
npm run test:unit
```

## Test Structure

### Unit Tests

Unit tests are located in `src/__tests__/` and test individual functions and utilities:

- `src/__tests__/lib/forecast.test.ts` - Tests for forecast utility functions
- `src/__tests__/lib/utils.test.ts` - Tests for utility functions

### API Integration Tests

API integration tests use Supertest and are located in `src/__tests__/api/`:

- `src/__tests__/api/health.api.test.ts` - Health check endpoint tests
- `src/__tests__/api/transactions.api.test.ts` - Direct Next.js API route tests
- `src/__tests__/api/transactions-supertest.api.test.ts` - Supertest integration tests

## Writing Tests

### Unit Test Example

```typescript
import { linearRegression } from '@/lib/forecast';

describe('linearRegression', () => {
  it('should calculate linear regression for valid data', () => {
    const data = [100, 150, 200, 250, 300];
    const result = linearRegression(data);

    expect(result).not.toBeNull();
    expect(result).toHaveProperty('slope');
    expect(result).toHaveProperty('intercept');
    expect(result).toHaveProperty('predictedNext');
  });
});
```

### API Integration Test with Supertest Example

```typescript
import request from 'supertest';
import express from 'express';
import { GET, POST } from '@/app/api/transactions/route';

function createTestApp() {
  const app = express();
  app.use(express.json());

  // Wrap Next.js route handlers
  app.get('/api/transactions', async (req, res) => {
    // ... convert Express request to NextRequest
    const response = await GET(nextRequest);
    res.status(response.status).json(await response.json());
  });

  return app;
}

describe('Transactions API', () => {
  it('should return 400 if userId is missing', async () => {
    const app = createTestApp();
    const response = await request(app)
      .get('/api/transactions')
      .expect(400);

    expect(response.body).toEqual({ error: 'userId is required' });
  });
});
```

## Test Configuration

### Jest Configuration

- **Main Config**: `jest.config.js` - For unit tests (jsdom environment)
- **API Config**: `jest.config.api.js` - For API integration tests (node environment)

### Setup Files

- `jest.setup.js` - Setup for unit tests (jsdom)
- `jest.setup.api.js` - Setup for API tests (node with polyfills)

## Best Practices

1. **Unit Tests**: Test individual functions in isolation
2. **Integration Tests**: Test API endpoints end-to-end with Supertest
3. **Test Coverage**: Aim for high coverage of business logic
4. **Test Naming**: Use descriptive test names that explain what is being tested
5. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification

## API Routes for Testing

The project includes sample API routes for testing:

- `GET /api/health` - Health check endpoint
- `GET /api/transactions?userId=xxx` - Get transactions for a user
- `POST /api/transactions` - Create a new transaction

These routes are located in `src/app/api/` and can be extended for your needs.

## Troubleshooting

### Request/Response Not Defined

If you encounter `Request is not defined` errors, make sure you're using the correct Jest config:
- Use `npm test` for unit tests (jsdom environment)
- Use `npm run test:api` for API tests (node environment with polyfills)

### TypeScript Errors

Ensure your test files use proper TypeScript types and import paths with the `@/` alias configured in `tsconfig.json`.

