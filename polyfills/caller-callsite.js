// Polyfill per ambiente Web: evita l'errore "callerCallsite is undefined"
module.exports = function callerCallsite() {
  return {
    getFileName: () => null
  };
};