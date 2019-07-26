# ⚽️ Crypto Fantasy Premier League

 Welcome to Crypto FPL, a light PvP Fantasy Premier League game that runs on the Ethereum blockchain. 
 
 ## 🎮 The Game

 Players can mint their own footballer cards and create head-to-head game with a squad selected from their collection. Game creators can determine the wager at stake, and players can join open matches and submit their squads. The winner will be determined at the end of each Premier League gameweek by the total points of the players in their selected squad. This winner wins the pot.

### 📜 The Rules

- Players can be in up to 3 active games at a time
- A submitted squad must consist of 1 Goalkeeper, 1 Defender, 1 Midfield, and 1 Forward

### 📖 How to Play

1. Buy a card pack to mint yourself a roster 15 footballers. This pack will include 3 Goalkeepers, 4 Defenders, 4 Midfielders, and 4 Forwards. Once the transaction is complete, you will be able to see your newly minted team.
2. Create a game and deposit a wager for that game. Any player who joins your game will have to also deposit your stated wager.
3. Select a team from your roster. A valid team consists of 1 Goalkeeper, 1 Defender, 1 Midfield, and 1 Forward
- 💡 IMPORTANT 💡 You *must* take note of your salt and the players you selected. You will have to resubmit this when revealing your team in the second phase of the game (see avoiding_common_attacks for more details).
4. When the gameweek deadline has passed, you will be able to calculate your score, submit it and reveal your team. In order to reveal, reselect the same footballers you submitted and put in the salt you submitted your team with.
5. Once both players have revealed their scores, the winner will be able to withdraw their payout, which is both players' wager deposit for that game.


## 🛠 Technology
- Footballer cards are ERC1155 tokens on Ethereum. Once you own them, they are truly yours
- Game logic is open-source and is an Ethereum smart contract written in Solidity
- Footballer data (names, position, team, gameweek scores) is based on the [Fantasy Premier League API](https://fantasy.premierleague.com/api/element-summary/1)
- ReactJS, NodeJS, mySQL* powers the client and backend

ℹ For demonstration purposes, data has been seeded in `cryptofpl-server/data/.` as a regular object. In real life this will be stored in a server. Gameweek scores were randomly generated up to gameweek 3 to allow people to play with this demo app. In reality, players wouldn't be able to calculate their total scores until the Premier League gameweek has concoluded and footballer scores have been finalized.

## 👩🏻‍💻 Development
- Clone the repo using `git clone https://github.com/nichanank/crypto-fpl.git`
- `cd crypto-fpl` and clone the client repo using `git clone https://github.com/nichanank/cryptofpl-client.git`
- Have a local blockchain running on port 7545 (e.g. using Ganache)
- From the main project folder (crypto-fpl), deploy contracts with `truffle migrate --reset`
- To start the server, navigate to the `cryptofpl-server` folder with `cd cryptofpl-server`, run `npm install` and then `npm run server`
- To start the client, navigate to the `cryptofpl-client` folder with `cd cryptofpl-client`, run `npm install` and then `npm run start`
- Open up your browser the project should be up on localhost:3000

## ✅ Testing
- You can run the tests by running `truffle test` from the CryptoFPL directory