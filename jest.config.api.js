// Separate Jest config for API integration tests
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.api.js'],
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.api.test.[jt]s?(x)',
    '**/?(*.)+(api.test|api.spec).[jt]s?(x)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/app/api/**/*.{js,jsx,ts,tsx}',
    '!src/app/api/**/*.d.ts',
  ],
}

module.exports = createJestConfig(customJestConfig)

