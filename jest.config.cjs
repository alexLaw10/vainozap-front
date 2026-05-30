const { createCjsPreset } = require('jest-preset-angular/presets');

const preset = createCjsPreset({
  tsconfig: '<rootDir>/tsconfig.spec.json',
});

/** @type {import('jest').Config} */
module.exports = {
  ...preset,
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    // Aliases do tsconfig — Jest não lê paths do tsconfig automaticamente
    '^@app/shared/ui$': '<rootDir>/src/app/shared/ui/index.ts',
    '^@app/(.*)$':      '<rootDir>/src/app/$1',
  },
  collectCoverageFrom: [
    'src/app/**/*.component.ts',
    'src/app/**/*.service.ts',
    'src/app/**/*.pipe.ts',
    'src/app/**/utils/*.util.ts',
    'src/app/app.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
