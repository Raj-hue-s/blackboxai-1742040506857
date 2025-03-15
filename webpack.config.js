const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    const config = {
        entry: {
            // Ally entries
            'ally': './ally/js/main.js',
            'ally.emotion': './ally/js/emotion.js',
            'ally.voice': './ally/js/voice.js',

            // Soul entries
            'soul': './soul/js/main.js',
            'soul.control': './soul/js/control.js',
            'soul.logger': './soul/js/logger.js'
        },

        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: isProduction 
                ? 'js/[name].[contenthash].js'
                : 'js/[name].bundle.js',
            publicPath: '/'
        },

        module: {
            rules: [
                // JavaScript
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true
                        }
                    }
                },

                // CSS
                {
                    test: /\.css$/,
                    use: [
                        isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                        'css-loader',
                        'postcss-loader'
                    ]
                },

                // Images
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'images/[name].[hash][ext]'
                    }
                },

                // Fonts
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'fonts/[name].[hash][ext]'
                    }
                },

                // Audio
                {
                    test: /\.(mp3|wav)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'audio/[name].[hash][ext]'
                    }
                }
            ]
        },

        plugins: [
            new CleanWebpackPlugin(),

            // Ally HTML
            new HtmlWebpackPlugin({
                template: './ally/index.html',
                filename: 'ally/index.html',
                chunks: ['ally', 'ally.emotion', 'ally.voice'],
                minify: isProduction
            }),

            // Soul HTML
            new HtmlWebpackPlugin({
                template: './soul/index.html',
                filename: 'soul/index.html',
                chunks: ['soul', 'soul.control', 'soul.logger'],
                minify: isProduction
            })
        ],

        resolve: {
            extensions: ['.js'],
            alias: {
                '@': path.resolve(__dirname, 'src'),
                '@ally': path.resolve(__dirname, 'ally'),
                '@soul': path.resolve(__dirname, 'soul'),
                '@server': path.resolve(__dirname, 'server')
            }
        },

        optimization: {
            minimize: isProduction,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        format: {
                            comments: false
                        },
                        compress: {
                            drop_console: isProduction
                        }
                    },
                    extractComments: false
                }),
                new CssMinimizerPlugin()
            ],
            splitChunks: {
                chunks: 'all',
                name: false,
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all'
                    },
                    common: {
                        name: 'common',
                        minChunks: 2,
                        chunks: 'all',
                        priority: -20,
                        reuseExistingChunk: true
                    }
                }
            }
        },

        devServer: {
            contentBase: './dist',
            hot: true,
            port: 8000,
            historyApiFallback: true,
            proxy: {
                '/api': 'http://localhost:3000'
            }
        },

        devtool: isProduction ? 'source-map' : 'eval-source-map',

        performance: {
            hints: isProduction ? 'warning' : false,
            maxEntrypointSize: 512000,
            maxAssetSize: 512000
        },

        stats: {
            colors: true,
            hash: true,
            timings: true,
            chunks: true,
            chunkModules: false,
            modules: false
        }
    };

    if (isProduction) {
        config.plugins.push(
            new MiniCssExtractPlugin({
                filename: 'css/[name].[contenthash].css',
                chunkFilename: 'css/[id].[contenthash].css'
            })
        );
    }

    return config;
};
