## 🚧 Avoiding Common Attacks
A summary of steps taken to mitigate attacks commonly found on open blockchain platforms.

## Denial of Service
To prevent DoS attacks by gas limits, all arrays are limited to a fixed size. Players can only be involved in 3 active games at a time, meaning that they can't repeatedly call `createGame` or `joinGame`. We also make use of modifiers to check if call meets certain conditions before executing the rest of the function to make sure an invalid call fails as early as possible. 

## Reentrancy
To prevent an attacker from calling `withdrawPayout` multiple times before contract execution is over internal accounting work is done before the .send() is executed. Additionally by using `.send` over `.call().value()` for this function, which means that the called contract is only given a stipend of 2,300 gas.

## Handling on-chain data using Commit-Reveal scheme
Because the game logic is dependent on our keeping players' team selections private in the first phase of the game, player submissions cannot be raw player id's, but instead a hash of their id's. In the commit phase, players submit their selections for each position, and a hash of these is stored onchain. In the reveal phase (after the real-life Premier League has concluded), players must provide a proof using the reveal hashes along with their scores. This prevents the player from submitted a different team after knowing how they performed, and also prevents the opponent from seeing their footballer selections simply by examining the blockchain.
One drawback of this is that the player has to remember the footballers that they've selected from the client side to reproduce the `revealHash`, whereas a web 2.0 application would have likedly stored raw team selections in a database.