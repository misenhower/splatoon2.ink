const path = require('path');
const glob = require('glob');

const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const PurifyCSSPlugin = require('purifycss-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = function(env) {
    const production = (env === 'production');

    return {
        entry: {
            main: [
                './src/js/main.js',
                './src/css/main.scss',
            ],
        },
        output: {
            path: path.resolve(__dirname, './public'),
            filename: 'assets/js/[name].[hash:6].js',
        },
        devtool: (production) ? false : '#cheap-module-eval-source-map',
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
                                loader: 'sass-loader',
                                options: { sourceMap: !production },
                            },
                        ],
                    }),
                },
                {
                    test: /\.woff2?$|\.ttf$|\.eot$|\.svg$/,
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
            //     'public/assets/css/*',
            //     'public/assets/js/*',
            // ]),
            // Extract CSS to a separate file
            new ExtractTextPlugin({
                filename: 'assets/css/[name].[contenthash:6].css',
                disable: !production,
            }),
            // Remove unused CSS styles
            new PurifyCSSPlugin({
                paths: [
                    ...glob.sync(path.join(__dirname, 'src/html/*.html')),
                    ...glob.sync(path.join(__dirname, 'src/js/components/*.vue')),
                ],
                minimize: production,
                purifyOptions: {
                    whitelist: [
                        '.title:not(.is-spaced)+.subtitle', // Fix subtitle spacing
                    ],
                    cleanCssOptions: {
                        rebase: false, // Leave relative paths alone when minifying CSS
                    },
                },
            }),
            // Build HTML
            new HtmlWebpackPlugin({
                filename: 'index.html',
                template: 'src/html/index.html',
                minify: { collapseWhitespace: true },
            }),
            // Copy additional favicons
            new CopyWebpackPlugin([
                { from: 'src/icons/public' },
            ]),
        ],
    }
}
