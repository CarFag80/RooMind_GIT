// Polyfill per ambiente Web: evita crash su "callerCallsite() is undefined"
module.exports = function callerCallsite(depth) {
  depth = depth || 0;
  
  try {
    // Tenta di usare callsites se disponibile
    const callsites = require('callsites');
    const stack = callsites();
    const callsite = stack && stack[depth + 1];
    
    if (callsite && typeof callsite.getFileName === 'function') {
      return callsite;
    }
  } catch (e) {
    // Ignora errori e usa il fallback
  }
  
  // Fallback: restituisce sempre un oggetto valido
  return {
    getFileName: function() { return null; },
    getLineNumber: function() { return null; },
    getColumnNumber: function() { return null; },
    getFunctionName: function() { return null; },
    getTypeName: function() { return null; },
    getMethodName: function() { return null; },
    isNative: function() { return false; },
    isToplevel: function() { return false; },
    isEval: function() { return false; },
    isConstructor: function() { return false; }
  };
};