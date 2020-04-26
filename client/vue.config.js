const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  css: {
    requireModuleExtension: false,
    loaderOptions: {
      css: {
        modules: {
          localIdentName: isProduction
            ? '[hash:base64]'
            : '[path][name]__[local]',
        },
        localsConvention: 'camelCaseOnly',
      },
    },
  },

  pluginOptions: {
    'style-resources-loader': {
      preProcessor: 'scss',
      patterns: [
        path.resolve(__dirname, './src/assets/scss/abstracts/*.scss'),
      ],
    },
  },
};
