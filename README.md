# ⚽️ Crypto Fantasy Premier League

 Welcome to Crypto FPL, a light PvP Fantasy Premier League game that runs on the Ethereum blockchain. 
 
 ## 🎮 The Game

 Players can mint their own footballer cards and create head-to-head game with a squad selected from their collection. Game creators can determine the wager at stake, and players can join open matches and submit their squads. The winner will be determined at the end of each Premier League gameweek by the total points of the players in their selected squad. This winner wins the pot.

### 📜 The Rules

- Players can be in up to 3 active games at a time
- A squad must consist of 1 Goalkeeper, 1 Defender, 1 Midfield, and 1 Forward

## 🛠 Technology
- Footballer cards are ERC1155 tokens on Ethereum. Once you own them, they are truly yours
- Game logic is open-source and is an Ethereum smart contract written in Solidity
- Footballer data (names, position, team, gameweek scores) is based on the [Fantasy Premier League API](https://fantasy.premierleague.com/api/element-summary/1)
- ReactJS, NodeJS, mySQL powers the client and backend

## 👩🏻‍💻 Development
- Have a local blockchain running on port 7545 (e.g. using Ganache)
- Deploy contracts with `truffle migrate --reset`
- To start the server, navigate to the `cryptofpl-server` folder with `cd cryptofpl-server` and `npm run server`
- To start the client, navigate to the `cryptofpl-client` folder with `cd cryptofpl-client` and `npm run start`
- Open up your browser the project should be up on localhost:3000

## ✅ Testing
- You can run the tests by running `truffle test` from the CryptoFPL directory