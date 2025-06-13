/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  testTimeout: 30_000,
  clearMocks: true,
  roots: ['<rootDir>/src'],

  // ESM support:
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.m?[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  setupFiles: ['<rootDir>/src/jest.setup-env.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
  testSequencer: '<rootDir>/testSequencer.mjs',
  globalTeardown: '<rootDir>/src/jest.globalTeardown.ts',
};
export default config;
