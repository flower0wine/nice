module.exports = {
  plugins: {
    autoprefixer: {
      // 扩大浏览器支持范围
      overrideBrowserslist: [
        "last 3 versions",
        "> 1%",
        "ie >= 11",
        "chrome >= 49",
        "firefox >= 52",
        "edge >= 79",
      ],
    },
    "postcss-preset-env": {
      stage: 3,
      features: {
        "nesting-rules": true,
      },
      // 添加更多的浏览器支持
      browsers: [
        "last 3 versions",
        "> 1%",
        "ie >= 11",
        "chrome >= 49",
        "firefox >= 52",
        "edge >= 79",
      ],
    },
  },
};
