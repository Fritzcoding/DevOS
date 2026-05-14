// Dummy signing script - does nothing but prevents electron-builder from attempting to sign
module.exports = async (configuration) => {
  // Do not sign anything
  return;
};
