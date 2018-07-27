require('dotenv').config();
const path = require('path');
const glob = require('glob');
const webpack = require('webpack');

const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const PurifyCSSPlugin = require('purifycss-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = function(env) {
    const production = (env === 'production');

    return {
        resolve: { alias: { '@': path.resolve(__dirname, './src') } },
        entry: {
            main: [
                './src/web/main.js',
                './src/web/assets/css/main.scss',
            ],
            screenshots: [
                './src/web/screenshots.js',
                './src/web/assets/css/screenshots.scss',
            ],
        },
        output: {
            path: path.resolve(__dirname, './dist'),
            filename: 'assets/js/[name].[hash:6].js',
            chunkFilename: 'assets/js/[name].[hash:6].js',
        },
        devtool: (production) ? false : '#cheap-module-eval-source-map',
        devServer: {
            overlay: true,
            historyApiFallback: true,
        },
        module: {
            loaders: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader'
                },
                {
                    test: /\.vue$/,
                    loader: 'vue-loader',
                    options: {
                        extractCSS: true,
                    },
                },
                {
                    test: /\.scss$/,
                    use: ExtractTextPlugin.extract({
                        fallback: 'style-loader',
                        publicPath: '../../',
                        use: [
                            {
                                loader: 'css-loader',
                                options: { sourceMap: !production },
                            },
                            {
                                loader: 'postcss-loader',
                                options: { sourceMap: !production },
                            },
                            {
                                loader: 'sass-loader',
                                options: { sourceMap: !production },
                            },
                        ],
                    }),
                },
                {
                    test: /\.(woff2?|ttf|eot)$/,
                    loader: 'file-loader?name=assets/fonts/[name].[hash:6].[ext]',
                },
                {
                    test: /\.(png|jpe?g|gif|svg)$/,
                    loader: 'file-loader?name=assets/img/[name].[hash:6].[ext]',
                },
                {
                    test: /favicon\.ico$/,
                    loader: 'file-loader?name=favicon.ico',
                }
            ],
        },
        plugins: [
            // Remove old files
            // new CleanWebpackPlugin([
            //     'dist/assets/css/*',
            //     'dist/assets/js/*',
            // ]),
            new webpack.DefinePlugin({
                'GOOGLE_ANALYTICS_ID': JSON.stringify(process.env.GOOGLE_ANALYTICS_ID),
            }),
            // Extract CSS to a separate file
            new ExtractTextPlugin({
                filename: 'assets/css/[name].[contenthash:6].css',
                disable: !production,
            }),
            // Remove unused CSS styles
            new PurifyCSSPlugin({
                paths: [
                    ...glob.sync(path.join(__dirname, 'public/**/*.html')),
                    ...glob.sync(path.join(__dirname, 'src/web/components/**/*.vue')),
                ],
                minimize: production,
                purifyOptions: {
                    whitelist: [
                        '.title:not(.is-spaced)+.subtitle', // Fix subtitle spacing
                        // Dynamic merchandise types
                        '.merchandise-box.shoes',
                        '.merchandise-box.head',
                        '.merchandise-box.clothes',
                    ],
                    cleanCssOptions: {
                        rebase: false, // Leave relative paths alone when minifying CSS
                    },
                },
            }),
            // Build main public HTML
            new HtmlWebpackPlugin({
                inject: false,
                filename: 'index.html',
                template: 'public/index.html',
                minify: { collapseWhitespace: true },
            }),
            // Build HTML used for screenshot generation
            new HtmlWebpackPlugin({
                inject: false,
                filename: 'screenshots.html',
                template: 'public/screenshots.html',
                minify: { collapseWhitespace: true },
            }),
            // Copy additional favicons
            new CopyWebpackPlugin([
                { from: 'public' },
            ]),
        ],
    }
}
