import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },

  // Test configuration
  testMatch: ['**/tests/e2e/**/*.test.ts'],
  testTimeout: 60000, // 60 seconds per test

  // Setup - handled in setup.ts via beforeAll/afterAll
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/helpers/setup.ts'],

  // Run tests sequentially for E2E
  maxWorkers: 1,

  // Force exit after tests complete to prevent hanging
  forceExit: true,

  // Coverage (optional)
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
  ],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Silence console during tests unless debug
  silent: process.env.DEBUG !== 'true',
};

export default config;
