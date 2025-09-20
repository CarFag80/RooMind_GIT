// Polyfill per ambiente Web: evita crash su "callerCallsite() is undefined"
module.exports = function callerCallsite() {
  return {
    getFileName: () => null
  };
};