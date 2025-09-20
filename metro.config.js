const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 👇 Alias per sostituire caller-callsite con polyfill
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...(config.resolver?.extraNodeModules ?? {}),
    'caller-callsite': require.resolve('./polyfills/caller-callsite.js'),
  }
};

module.exports = config;