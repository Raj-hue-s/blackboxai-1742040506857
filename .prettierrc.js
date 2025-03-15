module.exports = {
    // Line length
    printWidth: 100,

    // Indentation
    tabWidth: 2,
    useTabs: false,

    // Quotes
    singleQuote: true,
    quoteProps: 'as-needed',
    jsxSingleQuote: false,

    // Semicolons
    semi: true,

    // Trailing commas
    trailingComma: 'es5',

    // Brackets and Spacing
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: 'always',

    // Whitespace
    endOfLine: 'lf',

    // JSX
    jsxBracketSameLine: false,

    // HTML
    htmlWhitespaceSensitivity: 'css',

    // Vue
    vueIndentScriptAndStyle: false,

    // Markdown
    proseWrap: 'preserve',

    // Embedded Language Formatting
    embeddedLanguageFormatting: 'auto',

    // Override configurations for specific file patterns
    overrides: [
        {
            files: '*.md',
            options: {
                tabWidth: 4,
                proseWrap: 'always'
            }
        },
        {
            files: ['*.json', '.prettierrc', '.eslintrc'],
            options: {
                parser: 'json',
                tabWidth: 2
            }
        },
        {
            files: '*.yml',
            options: {
                tabWidth: 2,
                singleQuote: false
            }
        }
    ],

    // Parser inference
    requirePragma: false,
    insertPragma: false,

    // Plugins
    plugins: [],

    // Additional settings
    rangeStart: 0,
    rangeEnd: Infinity
};
