module.exports = {
    env: {
        node: true,
        browser: true,
        es2021: true,
        jest: true
    },
    extends: [
        'eslint:recommended',
        'plugin:jest/recommended',
        'prettier'
    ],
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
    },
    plugins: [
        'jest'
    ],
    rules: {
        // Possible Errors
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-unused-vars': ['error', { 
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_'
        }],
        'no-constant-condition': ['error', { 
            checkLoops: false 
        }],

        // Best Practices
        'curly': ['error', 'all'],
        'eqeqeq': ['error', 'always'],
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-alert': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
        'no-var': 'error',
        'prefer-const': 'error',
        'no-return-await': 'error',
        'require-await': 'error',

        // Variables
        'no-use-before-define': ['error', {
            functions: false,
            classes: true,
            variables: true
        }],

        // Node.js and CommonJS
        'callback-return': 'error',
        'handle-callback-err': 'error',
        'no-buffer-constructor': 'error',
        'no-mixed-requires': 'error',
        'no-new-require': 'error',
        'no-path-concat': 'error',

        // Stylistic Issues
        'array-bracket-spacing': ['error', 'never'],
        'block-spacing': ['error', 'always'],
        'brace-style': ['error', '1tbs', { 
            allowSingleLine: false 
        }],
        'camelcase': ['error', { 
            properties: 'never' 
        }],
        'comma-dangle': ['error', {
            arrays: 'always-multiline',
            objects: 'always-multiline',
            imports: 'always-multiline',
            exports: 'always-multiline',
            functions: 'never'
        }],
        'comma-spacing': ['error', { 
            before: false, 
            after: true 
        }],
        'comma-style': ['error', 'last'],
        'computed-property-spacing': ['error', 'never'],
        'consistent-this': ['error', 'self'],
        'eol-last': ['error', 'always'],
        'func-call-spacing': ['error', 'never'],
        'key-spacing': ['error', { 
            beforeColon: false, 
            afterColon: true 
        }],
        'keyword-spacing': ['error', { 
            before: true, 
            after: true 
        }],
        'max-len': ['error', {
            code: 100,
            tabWidth: 2,
            ignoreComments: true,
            ignoreUrls: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
            ignoreRegExpLiterals: true
        }],
        'no-lonely-if': 'error',
        'no-mixed-spaces-and-tabs': 'error',
        'no-multiple-empty-lines': ['error', { 
            max: 2, 
            maxEOF: 1 
        }],
        'no-trailing-spaces': 'error',
        'no-unneeded-ternary': 'error',
        'no-whitespace-before-property': 'error',
        'object-curly-spacing': ['error', 'always'],
        'padded-blocks': ['error', 'never'],
        'semi': ['error', 'always'],
        'semi-spacing': ['error', { 
            before: false, 
            after: true 
        }],
        'space-before-blocks': 'error',
        'space-before-function-paren': ['error', {
            anonymous: 'always',
            named: 'never',
            asyncArrow: 'always'
        }],
        'space-in-parens': ['error', 'never'],
        'space-infix-ops': 'error',
        'space-unary-ops': ['error', {
            words: true,
            nonwords: false
        }],
        'spaced-comment': ['error', 'always', {
            exceptions: ['-', '+', '*'],
            markers: ['!', '/', '=>']
        }],

        // ES6
        'arrow-spacing': ['error', { 
            before: true, 
            after: true 
        }],
        'no-duplicate-imports': 'error',
        'no-useless-computed-key': 'error',
        'no-useless-constructor': 'error',
        'no-useless-rename': 'error',
        'no-var': 'error',
        'object-shorthand': ['error', 'always'],
        'prefer-arrow-callback': 'error',
        'prefer-const': 'error',
        'prefer-rest-params': 'error',
        'prefer-spread': 'error',
        'prefer-template': 'error',
        'rest-spread-spacing': ['error', 'never'],
        'template-curly-spacing': ['error', 'never'],

        // Jest
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/prefer-to-have-length': 'warn',
        'jest/valid-expect': 'error'
    },
    overrides: [
        {
            // Test files
            files: [
                '**/*.test.js',
                '**/*.spec.js',
                '**/tests/**/*.js'
            ],
            env: {
                jest: true
            },
            rules: {
                'max-len': 'off',
                'no-unused-expressions': 'off'
            }
        }
    ],
    settings: {
        jest: {
            version: 'detect'
        }
    }
};
