module.exports = {
    plugins: {
        'tailwindcss': {},
        'autoprefixer': {},
        'postcss-preset-env': {
            stage: 3,
            features: {
                'nesting-rules': true,
                'custom-properties': true,
                'custom-media-queries': true,
                'custom-selectors': true,
                'gap-properties': true,
                'media-query-ranges': true
            }
        },
        ...(process.env.NODE_ENV === 'production' ? {
            'cssnano': {
                preset: ['default', {
                    discardComments: {
                        removeAll: true
                    },
                    normalizeWhitespace: true,
                    minifyFontValues: true,
                    minifyGradients: true,
                    minifySelectors: true,
                    minifyParams: true,
                    reduceIdents: true,
                    reduceInitial: true,
                    reduceTransforms: true,
                    svgo: true
                }]
            }
        } : {})
    }
};
