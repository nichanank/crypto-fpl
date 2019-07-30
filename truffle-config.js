const path = require('path')
const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraKey = "a2855c7103a644d29e2864d9865bb72d";

const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();

module.exports = {
  contracts_build_directory: path.join(__dirname, 'cryptofpl-client/src/contracts'),
  networks: {
    development: {
     host: "127.0.0.1",     // Localhost (default: none)
     port: 7545,            // Standard Ethereum port (default: none)
     network_id: "*",       // Any network (default: none)
     gas: 6721975
    },
    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, 'https://rinkeby.infura.io/' + infuraKey),
      host: "localhost",
      port: 8545,
      network_id: 4,
      gas: 5500000,
      confirmations: 6,
      timeoutBlocks: 200
    },
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/' + infuraKey),
      host: "localhost",
      port: 8545,
      network_id: 3,
      gas: 5500000,
      confirmations: 6,
      timeoutBlocks: 200
    }
  }
}