/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['docs-gen'],
  verbose: true,
  collectCoverage: true,
  silent: false,
  moduleDirectories: [
    'node_modules',
    'src',
    'test',
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        target: 'ES6',
        module: 'ESNext',
        noImplicitAny: false,
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true
      },
    },
  },
}
