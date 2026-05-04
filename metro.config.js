// metro.config.js — RooMind web bundler setup
// IMPORTANT: the "@/" alias must be resolved HERE (Metro bundler),
// not only in tsconfig.json. tsconfig paths are used by TypeScript only;
// the Metro bundler that Expo runs (for web and native) needs its own
// resolver. DO NOT revert to `extraNodeModules: { '@': __dirname }` —
// that does NOT work for path-prefix aliasing (it's for naming packages),
// and breaks the build with "Unable to resolve module @/services/storage".
// See commit history and Netlify build logs for proof.

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Preserve any default resolveRequest and delegate to it for unknown modules.
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Alias "@/..." -> project root. Mirrors the tsconfig "paths" mapping so
  // both TypeScript and Metro agree on where "@/..." lives.
  if (moduleName.startsWith('@/')) {
    return context.resolveRequest(
      context,
      path.resolve(__dirname, moduleName.slice(2)),
      platform
    );
  }

  // Local polyfill for the "caller-callsite" module (avoids crash on Web,
  // since the upstream package relies on V8-only stack APIs).
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
