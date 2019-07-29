# ⚽️ Crypto Fantasy Premier League

 Welcome to Crypto FPL, a light PvP Fantasy Premier League game that runs on the Ethereum blockchain. For the demo client, please see the [client repo](https://github.com/nichanank/crypto-fpl-client)
 
 ## 🎮 The Game

 Players can mint their own footballer cards and create head-to-head game with a squad selected from their collection. Game creators can determine the wager at stake, and players can join open matches and submit their squads. The winner will be determined at the end of each Premier League gameweek by the total points of the players in their selected squad. This winner wins the pot.

### 📜 The Rules

- Players can be in up to 3 active games at a time
- A submitted squad must consist of 1 Goalkeeper, 1 Defender, 1 Midfield, and 1 Forward
- Players can submit a team as many times as they want *before* the gameweek deadline. But they must ensure to take note of the *latest* submitted team and salt in order to successfully reveal their team.

### 📖 How to Play

1. Buy a card pack to mint yourself a roster 15 footballers. This pack will include 3 Goalkeepers, 4 Defenders, 4 Midfielders, and 4 Forwards. Once the transaction is complete, you will be able to see your newly minted team.
2. Create a game and deposit a wager for that game. Any player who joins your game will have to also deposit your stated wager.
3. Select a team from your roster. A valid team consists of 1 Goalkeeper, 1 Defender, 1 Midfield, and 1 Forward
- 💡 IMPORTANT 💡 You *must* take note of your salt and the players you selected. You will have to resubmit this when revealing your team in the second phase of the game (see avoiding_common_attacks for more details).
4. When the gameweek deadline has passed, you will be able to calculate your score, submit it and reveal your team. In order to reveal, reselect the same footballers you submitted and put in the salt you submitted your team with.
5. Once both players have revealed their scores, the winner will be able to withdraw their payout, which is both players' wager deposit for that game.


## 🛠 Technology
- Footballer cards (CryptoFPLCards) are ERC1155 tokens on Ethereum. Once you own them, they are truly yours
- Game logic is open-source and is an Ethereum smart contract written in Solidity
- Footballer data (names, position, team, gameweek scores) is based on the [Fantasy Premier League API](https://fantasy.premierleague.com/api/element-summary/1)
- ReactJS, NodeJS, mySQL* powers the client and backend

### CryptoFPL Footballer Cards as Multi-Fungible Tokens
- CryptoFPLCards inherits from the [ERC1155 implementation](https://github.com/horizon-games/multi-token-standard) by [Horizon Games](https://horizongames.net/). The EIP discussion for the Multi-Fungible Token Standard can be found [here](https://github.com/ethereum/EIPs/issues/1155)

### Admin Features and Provable API
- The CryptoFPL league admin (contract deployer) can toggle the `deadlinePassed` boolean storage variable by calling `toggleDeadlinePassed`. This method uses a [Provable API](https://docs.provable.xyz) query to obtain the current time (GMT+1) and sets `deadlinePassed` to true if the UNIX timestamp surpasses the `deadline` variable. At the time of writing, there isn't a bridge to link the Provable API to a private development blockchain, therefore this feature will only work when called on testnet. If you call this function whilst on a private blockchain you will get a `VM Exception while processing transaction: revert` error.
- The admin can also increment the gameweek by calling `incrementGameweek` and pass in the UNIX timestamp `uint` for the deadline of the new gameweek. This will set the `deadline` variable to the new deadline.

ℹ For demonstration purposes, data has been seeded in `cryptofpl-server/data/.` as a regular object. In real life this will be stored in a server. Gameweek scores were randomly generated up to gameweek 3 to allow people to play with this demo app. In reality, players wouldn't be able to calculate their total scores until the Premier League gameweek has concluded and footballer scores have been finalized.

## 👩🏻‍💻 Development
- Clone the repo using `git clone https://github.com/nichanank/crypto-fpl.git`
- `cd crypto-fpl` and clone the client repo using `git clone https://github.com/nichanank/cryptofpl-client.git`
- Have a local blockchain running on port 7545 (e.g. using Ganache)
- From the main project folder (crypto-fpl), deploy contracts with `truffle migrate --reset`
  - If you get an `at Deployer._preFlightCheck` error upon migration, delete the `contracts` folder at `cryptofpl-client/src/contracts` folder and try `truffle migrate --reset` again
- To start the server, navigate to the `cryptofpl-server` folder with `cd cryptofpl-server`, run `npm install` and then `npm run server`
- To start the client, navigate to the `cryptofpl-client` folder with `cd cryptofpl-client`, run `npm install` and then `npm run start`
- Open up your browser the project should be up on localhost:3000

### Contract interaction on Remix
In order to easily interact with the contract using [Remix](remix.ethereum.org), you can use the `truffle-flattener` package to aggregate the contract code and its parent contracts into one file and paste the file into the Remix editor.
1. `npm install -g truffle-flattener`
2. From the directory with your `./contracts` folder containing the Solidity files, do `truffle-flattener ./contracts/CryptoFPLCore/CryptoFPL.sol >> CryptoFPL.txt`
3. Create a new file on Remix and name it `CryptoFPL.sol`, paste the newly created contents of `CryptoFPL.txt` into this file and save. Repeat with the CryptoFPLCards contract:
- `truffle-flattener ./contracts/CryptoFPLCore/CryptoFPLCards.sol >> CryptoFPLCards.txt`
- Create another file on Remix and name it `CryptoFPLCards.sol`, paste contents of `CryptoFPLCards.txt` into here
4. Deploy the two contracts on Remix and you should be good to go
If you have Ganache running, choose `Web3 provider` as your environment and connect to the port hosting the local blockchain (the default is `http://localhost:8545`). Otherwise you can select the provided `Javascript VM`

## ✅ Testing
- You can run the tests by running `truffle test` from the CryptoFPL directory
- If you get an `at Deployer._preFlightCheck` error upon migrate, delete the `contracts` folder at`cryptofpl-client/src/contracts` folder and try `truffle test` again