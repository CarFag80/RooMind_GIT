const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configure resolver to use local polyfill for caller-callsite
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...(config.resolver?.extraNodeModules ?? {}),
    '@': __dirname,
    'caller-callsite': path.resolve(__dirname, 'polyfills/caller-callsite.js'),
  },
};

module.exports = config;