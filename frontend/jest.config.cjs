/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@modal/(.*)$': '<rootDir>/src/app/modal/$1',
    '^@kpi/(.*)$': '<rootDir>/src/app/kpi/$1',
    '^@auth/(.*)$': '<rootDir>/src/app/auth/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@pages/(.*)$': '<rootDir>/src/app/pages/$1',
    '^@environments/(.*)$': '<rootDir>/src/environments/$1',
    '^lodash-es$': 'lodash',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@angular|rxjs|tslib|lodash-es|ng2-charts|chart.js)/)',
  ],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  workerIdleMemoryLimit: '512MB',
};
