const webpack = require("webpack");
const path = require('path');
const fileSystem = require("fs");
const env = require("./.env");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WriteFilePlugin = require("write-file-webpack-plugin");


/*******************************************************************************
 * Paths
 */
const secretsPath = path.join(__dirname, ("secrets." + env.NODE_ENV + ".js"));
const SOURCE_DIR = 'src';
const OUTPUT_DIR = 'build';


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

/*******************************************************************************
 * Options
 */
const options = {
    entry: {
        popup: path.join(__dirname, SOURCE_DIR, "js", "popup.js"),
        options: path.join(__dirname, SOURCE_DIR, "js", "options.js"),
        background: path.join(__dirname, SOURCE_DIR, "js", "background.js")
    },
    output: {
        path: path.join(__dirname, OUTPUT_DIR),
        filename: "[name].bundle.js"
    },
    module: { rules: [ cssRule, looseFilesRule, htmlRule ] },
    resolve: { alias: alias },
    plugins: [
        // clean the build folder
        new CleanWebpackPlugin([OUTPUT_DIR]),
        // expose and write the allowed env vars on the compiled bundle
        new webpack.DefinePlugin({
            "process.env.NODE_ENV": JSON.stringify(env.NODE_ENV)
        }),
        new CopyWebpackPlugin([{
            from: "src/manifest.json",
            transform: function (content, path) {
                // generates the manifest file using the package.json informations
                return Buffer.from(JSON.stringify({
                    description: process.env.npm_package_description,
                    version: process.env.npm_package_version,
                    ...JSON.parse(content.toString())
                }))
            }
        }]),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "src", "popup.html"),
            filename: "popup.html",
            chunks: ["popup"]
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "src", "options.html"),
            filename: "options.html",
            chunks: ["options"]
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "src", "background.html"),
            filename: "background.html",
            chunks: ["background"]
        }),
        new WriteFilePlugin()
    ]
};

/** If dev environment, create source maps and use dev server. */
if (env.NODE_ENV === "development")
{
    options.devtool = "cheap-module-eval-source-map";
    options.devServer = {
        contentBase: path.join(__dirname, OUTPUT_DIR),
        port: 9000,
        debug: true,
        compress: true
    };
}

module.exports = options;
