const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// Alias per "caller-callsite" per evitare crash su Web
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'caller-callsite': require.resolve('./polyfills/caller-callsite.js'),
};

// Ensure these values are not overridden by getDefaultConfig
config.resolver.platforms = [
  'ios',
  'android',
  'native',
  'web'
];

module.exports = config;