const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const mainConfig = {
  devtool: "inline-cheap-module-source-map",
  mode: "development",
  entry: ["./src/js/main.jsx", "./manifest.json"],
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].bundle.js",
    publicPath: "./",
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      title: "JDN extension",
      template: "./src/index.html",
      filename: "index.html",
      inject: false,
    }),
    new HtmlWebpackPlugin({
      title: "JDN extension - panel",
      template: "./src/panel.html",
      filename: "panel.html",
    }),
    new MiniCssExtractPlugin({
      filename: "./css/[name].css",
    }),
  ],
  resolve: {
    extensions: [".js", ".jsx"],
  },
  module: {
    rules: [
      {
        type: "javascript/auto",
        test: /manifest\.json$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "./[name].[ext]",
            },
          },
        ],
      },
      {
        test: /\.js?x$/,
        use: ["babel-loader"],
        include: path.join(__dirname, "src"),
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.less$/i,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                // important extra layer for less-loader^6.0.0
                javascriptEnabled: true,
                modifyVars: {
                  "primary-color": "#008ace",
                  "menu-horizontal-line-height": "26px",
                  "menu-bg": "#f3f3f2",
                  "border-radius-base": "3px",
                  "font-family": "'Source Sans Pro', sans-serif",
                  "menu-item-font-size": "14px",
                  "menu-item-color": "#222",
                  "border-color-base": "#d8d8d8",
                  "checkbox-size": "13px",
                  "btn-group-border": "#777777",
                },
              },
            },
          },
        ],
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: "babel-loader",
          },
          {
            loader: "@svgr/webpack",
            options: {
              babel: false,
              icon: true,
            },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: "file-loader",
            options: {
              esModule: false,
              name: "[name].[ext]",
              outputPath: "./images/",
            },
          },
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: ["file-loader", "url-loader"],
      },
    ],
  },
};

const indexConfig = {
  entry: "./src/loadPanel.js",
  mode: "production",
  output: {
    path: path.join(__dirname, "dist"),
    filename: "loadPanel.js",
    publicPath: "./",
  },
};

const contextMenuCssConfig = {
  entry:
    "./src/js/blocks/autoFind/autoFindProvider/contentScripts/contextMenu/contextmenu.css",
  mode: "production",
  plugins: [new MiniCssExtractPlugin({ filename: "contextmenu.css" })],
  module: {
    rules: [
      {
        test: /contextmenu.css$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: "./",
            },
          },
          "css-loader",
        ],
      },
    ],
  },
};

module.exports = [mainConfig, indexConfig, contextMenuCssConfig];
