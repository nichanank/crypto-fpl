const CryptoFPL = artifacts.require("CryptoFPL");
const CryptoFPLCards = artifacts.require("CryptoFPLCards");

module.exports = function(deployer) {
  deployer.deploy(CryptoFPL, 20);
  deployer.deploy(CryptoFPLCards, 1819);
};