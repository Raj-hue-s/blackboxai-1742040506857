module.exports = {
    // Test Environment
    testEnvironment: 'node',
    
    // Test Files
    testMatch: [
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
    ],
    
    // Coverage Configuration
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'server/**/*.js',
        'ally/js/**/*.js',
        'soul/js/**/*.js',
        '!**/node_modules/**',
        '!**/vendor/**',
        '!**/__tests__/**',
        '!**/coverage/**'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    coverageReporters: [
        'text',
        'lcov',
        'html'
    ],

    // Module File Extensions
    moduleFileExtensions: [
        'js',
        'json',
        'node'
    ],

    // Module Name Mapper (for aliases)
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@server/(.*)$': '<rootDir>/server/$1',
        '^@ally/(.*)$': '<rootDir>/ally/$1',
        '^@soul/(.*)$': '<rootDir>/soul/$1'
    },

    // Transform Configuration
    transform: {
        '^.+\\.js$': 'babel-jest'
    },

    // Ignore Patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/coverage/'
    ],

    // Setup Files
    setupFiles: [
        '<rootDir>/jest.setup.js'
    ],

    // Test Environment Options
    testEnvironmentOptions: {
        url: 'http://localhost'
    },

    // Verbose Output
    verbose: true,

    // Clear Mock Calls
    clearMocks: true,

    // Fail on Console Errors
    errorOnDeprecated: true,

    // Maximum Test Timeout
    testTimeout: 10000,

    // Global Setup
    globalSetup: '<rootDir>/jest.global-setup.js',

    // Global Teardown
    globalTeardown: '<rootDir>/jest.global-teardown.js',

    // Watch Plugins
    watchPlugins: [
        'jest-watch-typeahead/filename',
        'jest-watch-typeahead/testname'
    ],

    // Reporter Configuration
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputDirectory: 'reports/junit',
                outputName: 'js-test-results.xml',
                classNameTemplate: '{classname}',
                titleTemplate: '{title}',
                ancestorSeparator: ' › ',
                usePathForSuiteName: true
            }
        ]
    ],

    // Snapshot Configuration
    snapshotSerializers: [
        'jest-serializer-html'
    ],

    // Custom Resolver
    resolver: '<rootDir>/jest.resolver.js',

    // Global Variables
    globals: {
        __DEV__: true
    },

    // Module Directories
    moduleDirectories: [
        'node_modules',
        '<rootDir>/src'
    ],

    // Display Options
    bail: false,
    detectLeaks: true,
    detectOpenHandles: true,
    errorOnDeprecated: true,
    notify: true,

    // Cache Configuration
    cacheDirectory: '<rootDir>/.jest-cache',
    
    // Custom Matchers
    setupFilesAfterEnv: [
        '<rootDir>/jest.matchers.js'
    ],

    // Test Sequencer
    testSequencer: '<rootDir>/jest.sequencer.js',

    // Projects Configuration (for monorepo)
    projects: [
        {
            displayName: 'server',
            testMatch: ['<rootDir>/server/**/*.test.js'],
            testEnvironment: 'node'
        },
        {
            displayName: 'client',
            testMatch: [
                '<rootDir>/ally/**/*.test.js',
                '<rootDir>/soul/**/*.test.js'
            ],
            testEnvironment: 'jsdom'
        }
    ]
};
