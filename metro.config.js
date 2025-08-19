const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configurazione per SDK 53
config.resolver.platforms = ['native', 'ios', 'android', 'web'];

// Supporto per New Architecture
config.transformer.unstable_allowRequireContext = true;

module.exports = config;