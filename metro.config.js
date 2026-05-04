const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Keep a reference to any default resolveRequest so we can delegate
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Alias "@/..." -> project root (matches tsconfig "paths")
  if (moduleName.startsWith('@/')) {
    return context.resolveRequest(
      context,
      path.resolve(__dirname, moduleName.slice(2)),
      platform
    );
  }

  // Local polyfill for "caller-callsite" (avoids crash on Web)
  if (moduleName === 'caller-callsite') {
    return context.resolveRequest(
      context,
      path.resolve(__dirname, 'polyfills/caller-callsite.js'),
      platform
    );
  }

  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
