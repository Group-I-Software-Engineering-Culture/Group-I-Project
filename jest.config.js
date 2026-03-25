/**
 * Jest configuration (reference only).
 *
 * This project uses Vitest as its test runner (see vitest.config.js).
 * This file documents the coverage thresholds specified in the
 * academic report for reference purposes.
 */
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!vitest.config.js',
    '!jest.config.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      lines: 85,
      functions: 80,
      statements: 85,
    },
  },
};
