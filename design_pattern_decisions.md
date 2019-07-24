## 💡 Design Pattern Decisions
A summary of design pattern decisions and smart contract best practices taken into account for the CryptoFPL contracts.

### Fail early and Fail Loud
Modifiers are used to check for common requirements (such as isPlayer and gameIsOpen). This way, conditions are checked before the function body is executed, reducing unecessary code execution if the requirements are not met.

### Circuit Breaker
The circuit breaker pattern allows the leagueManager to pause the contract in the event that it is being abused or a bug is found and the contract needs to be upgraded. The `stopInEmergency` modifier is run and checks if the contract variable `paused` is false. If the `paused` is true, the contract will throw an error if that function is called. The leagueManager can toggle paused using `toggleContractPause`

### Restricting Access
The `isLeagueManager` modifier restricts administrative functions (such as `toggleContractPause`) only to the leagueManager address, preventing non-admin users from pausing the contract or update the live gameweek.

### Withdrawal Pattern
There are two scenarios for fund transfer from the FPL contract to another account:
- When a player joins an open game with `joinGame` and sends more than the stated wager
- When a player withdraws their winnings from a finished game with `withdrawPayout` 
In the first case, we used the Pull Over Push pattern and stored the available funds for the player to withdraw from in the `refunds` mapping, then implemented the external `withdrawRefund` separately instead of transfering their change from the `joinGame` function.
In both cases, we took care of internal accounting and updated availble balances *before* calling the external transfer function.

