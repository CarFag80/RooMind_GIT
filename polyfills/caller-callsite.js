// Polyfill per ambiente Web: evita crash su "callerCallsite() is undefined"
module.exports = function callerCallsite(depth) {
  depth = depth || 0;
  
  // Restituisce sempre un oggetto valido per l'ambiente web
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