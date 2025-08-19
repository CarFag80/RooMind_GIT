const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configurazione base per Expo Go
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;