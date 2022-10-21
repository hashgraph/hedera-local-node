const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/client.js',
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Test Browser Usage',
        }),
    ],
    output: {
        filename: 'client.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
};