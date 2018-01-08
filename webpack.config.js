const webpack = require("webpack");
const path = require('path');
const fileSystem = require("fs");
const env = require("./.env");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WriteFilePlugin = require("write-file-webpack-plugin");

/** Populate process.env from ./.env.js */
Object.entries(env).forEach(([key, value]) => {
    process.env[key] = value;
});

/*******************************************************************************
 * Paths
 */
const secretsPath = path.join(__dirname, ("secrets." + process.env.NODE_ENV + ".js"));
const SOURCE_DIR = 'src';
const OUTPUT_DIR = 'build';
const OUTPUT_PATH = path.join(__dirname, OUTPUT_DIR);


/*******************************************************************************
 * Secrets
 */
// load the secrets
const alias = {};
if (fileSystem.existsSync(secretsPath))
{
    alias["secrets"] = secretsPath;
}

/*******************************************************************************
 * Rules
 */
const cssRule = {
    test: /\.css$/,
    loader: "style-loader!css-loader",
    exclude: /node_modules/
};

const looseFileExtensions = [
    "jpg", "jpeg", "png", "gif", "eot", "otf", "svg", "ttf", "woff", "woff2"
];
const looseFilesRule = {
    test: new RegExp('\.(' + looseFileExtensions.join('|') + ')$'),
    loader: "file-loader?name=[name].[ext]",
    exclude: /node_modules/
};

const htmlRule = {
    test: /\.html$/,
    loader: "html-loader",
    exclude: /node_modules/
};

/**
 * HTML output via HtmlWebpackPlugin.
 * @param {String} filename - Filename of .html file in the 'src' folder.
 * @param {Array} chunks - Chunks to add.
 * @returns {HTMLWebpackPlugin}
 */
const genPackHTML = (filename, chunks) => {
    return new HtmlWebpackPlugin({
        template: path.join(__dirname, 'src', filename),
        filename: filename,
        chunks: chunks
    });
}

const jsDir = filename => path.join(__dirname, SOURCE_DIR, 'js', filename)

/*******************************************************************************
 * Options
 */
const options = {
    entry: {
        popup: jsDir('popup.js'),
        options: jsDir('options.js'),
        background: jsDir('background.js')
    },
    output: {
        path: OUTPUT_PATH,
        filename: '[name].bundle.js'
    },
    module: { rules: [ cssRule, looseFilesRule, htmlRule ] },
    resolve: { alias: alias },
    plugins: [
        // clean the build folder
        new CleanWebpackPlugin([OUTPUT_DIR]),
        // expose and write the allowed env vars on the compiled bundle
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        }),
        new CopyWebpackPlugin([{
            from: 'src/manifest.json',
            transform: (content, path) => {
                // generates the manifest file using the package.json informations
                return Buffer.from(JSON.stringify({
                    description: process.env.npm_package_description,
                    version: process.env.npm_package_version,
                    ...JSON.parse(content.toString())
                }))
            }
        }]),
        genPackHTML('popup.html', ['popup']),
        genPackHTML('options.html', ['options']),
        genPackHTML('background.html', ['background']),
        new WriteFilePlugin()
    ]
};

/** If dev environment, create source maps and use dev server. */
if (process.env.NODE_ENV === "development")
{
    options.devtool = "cheap-module-eval-source-map";
    options.devServer = {
        contentBase: OUTPUT_PATH,
        port: 9000,
        debug: true,
        compress: true
    };
}

module.exports = options;
