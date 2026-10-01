import type { Config } from 'jest';

const config: Config = {
  rootDir: 'src',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  moduleFileExtensions: ['ts', 'js', 'json'],
  // The generated Prisma client uses ESM-style `./file.js` specifiers for .ts sources.
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  collectCoverageFrom: [
    '**/*.ts',
    '!generated/**',
    '!main.ts',
    '!instrument.ts',
    '!**/*.module.ts',
  ],
  coverageDirectory: '../coverage',
};

export default config;
