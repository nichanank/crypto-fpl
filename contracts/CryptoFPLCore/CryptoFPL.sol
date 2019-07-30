pragma solidity ^0.5.0;

import "./CryptoFPLAdmin.sol";

    /// @author Nichanan Kesonpat
    /// @title A lightweight PvP card game based on Fantasy Premier League.

    /*
        THE GAME:
        - Players select four footballers from their card collection to compete in a round of FPL
        - Players accummulate scores depending on their team's performance in that gameweek of the Premier League, according to official FPL rules
        - The player with the top score collects prize winnings for the stated wager for that gameweek
        
        RULES:
        - Each player deposits fees to enter the game
        - Each player selects footballer cards from their CryptoFPL collection
        - A player can only be involved in 3 active games at one time
        - A team selection must consist of: 1 GK, 1 DF, 1 MF, 1 FWD
    */

contract CryptoFPL is CryptoFPLAdmin {

    //Storage variables
    uint idGenerator; // Keep track of game ids

    //Structs
    struct Commit {
        bytes32 commit;
        uint64 block;
        bool revealed;
    }

    struct Game {
        uint wager;
        address payable player1;
        address payable player2;
        uint player1Score;
        uint player2Score;
        bool player1TeamSubmitted;
        bool player2TeamSubmitted;
        bool player1TeamRevealed;
        bool player2TeamRevealed;
        bool player1Wins;
        bool player2Wins;
        bool isOpen;
        bool isFinished;
    }

    mapping(uint => Game) games;
    mapping(uint => uint) balances;
    
    mapping(address => uint) refunds; // Keeps track of refunds for players to withdraw from in case they deposited too much.
    mapping(address => uint) activeGameIndex;
    mapping(address => mapping(uint => uint)) activeGames; // Keeps track of each player's active games by mapping activeGameIndex to gameId
    
    // Map player address to gameId and footballer selection
    mapping(address => mapping(uint => Commit)) gkCommits;
    mapping(address => mapping(uint => Commit)) defCommits;
    mapping(address => mapping(uint => Commit)) midCommits;
    mapping(address => mapping(uint => Commit)) fwdCommits;

    //Events
    event LogGameCreation(address indexed player1, uint wager, uint gameId);
    event LogGameBegin(address indexed player2, uint gameId, uint totalPayout);
    event LogGameEnd(address winner, uint winningScore, uint losingScore);
    event LogPayoutSent(address winner, uint balance);
    event LogPlayer1TeamCommit(
        address player1, 
        uint gameId, 
        bytes32 gkHash, 
        bytes32 defHash, 
        bytes32 midHash, 
        bytes32 fwdHash
    );
    event LogPlayer2TeamCommit(
        address player2, 
        uint gameId, 
        bytes32 gkHash, 
        bytes32 defHash, 
        bytes32 midHash, 
        bytes32 fwdHash
    );
    event LogTeamReveal(
        address sender, 
        bytes gkReveal, 
        bytes defReveal, 
        bytes midReveal, 
        bytes fwdReveal, 
        bytes salt
    );
    

    //Modifiers
    modifier isPlayer(uint gameId, address player) { require(player == games[gameId].player1 || player == games[gameId].player2, "Invalid player address"); _;}
    modifier validPlayer2(uint gameId) { require(msg.sender != games[gameId].player1, "Player can't join their own game"); _;}
    modifier gameIsOpen(uint gameId) { require(games[gameId].isOpen, "Game is closed"); _;}
    modifier enoughFunds(uint gameId) { require(msg.value >= games[gameId].wager, "Insufficient funds sent as wager"); _;}
    
    modifier bothTeamsSubmitted(uint gameId) { 
        require(games[gameId].player1TeamSubmitted == true && games[gameId].player2TeamSubmitted == true, 
        "Both players are required to have submitted a team"); 
        _; 
    }

    modifier bothTeamsRevealed(uint gameId) { 
        require(games[gameId].player1TeamRevealed == true && games[gameId].player2TeamRevealed == true, 
        "Both players are required to have revealed their teams"); 
        _; 
    }

    /// Refund player 2 if they send in an amount exceeding the stated wager
    modifier checkValue(uint gameId) {
        _;
        uint _wager = games[gameId].wager;
        uint amountToRefund = msg.value - _wager;
        refunds[msg.sender] += (amountToRefund);
    }
   
    /// Checks how many games a player is active in. Passes if they are in 3 games or less
    modifier validActiveGameCount() { 
        require(msg.sender == leagueManager || activeGameIndex[msg.sender] < 3, 
        "Player already has 3 active games");
         _;
    }

    /// Verify winner for payout withdrawal
    modifier isWinner(uint gameId) {
        require((msg.sender == games[gameId].player1 && games[gameId].player1Wins) ||
             (msg.sender == games[gameId].player2 && games[gameId].player2Wins));
        _;
    }

    constructor(uint _entryFee) public {
        leagueManager = msg.sender;
        entryFee = _entryFee;
        idGenerator = 0;
    }

    /// Fallback function
    function() external payable {

    }

    /// Lets the user withdraw the refund in case of overpayment or game cancellation
    function withdrawRefund() external {
        uint refund = refunds[msg.sender];
        refunds[msg.sender] = 0;
        msg.sender.transfer(refund);
    }

    /// Allows the game winner to withdraw their payout
    /// @param gameId of the game the caller wants to withdraw payout for
    function withdrawPayout(uint gameId) external isWinner(gameId) {
        uint winnings = balances[gameId];
        balances[gameId] = 0;
        games[gameId].isFinished = true;
        activeGames[games[gameId].player1][activeGameIndex[games[gameId].player1]] = 0;
        activeGames[games[gameId].player2][activeGameIndex[games[gameId].player2]] = 0;
        activeGameIndex[games[gameId].player1] -= 1;
        activeGameIndex[games[gameId].player2] -= 1;
        msg.sender.transfer(winnings);
        emit LogPayoutSent(msg.sender, winnings);
    }

    /// Allows league admin to withdraw funds from the contract.
    function withdrawFunds() public isLeagueManager() {
        uint availableFunds = address(this).balance;
        msg.sender.transfer(availableFunds);
    }

    /* 
        GAME ENTRY: Players can create a game by depositing a wager and wait for another player to join the game.
     */
    
    /// Return information for a given game
    /// @param gameId of the game 
    /// @return player information, wager, whether or not the game is open, and whether or not the game is finished
    function viewGameDetails(uint gameId) public view returns(address player1, address player2, uint wager, bool isOpen, bool isFinished) {
        return (games[gameId].player1, games[gameId].player2, games[gameId].wager, games[gameId].isOpen, games[gameId].isFinished);
    }
    
    /// Allows a player to create their game and stores the new game in the 'games' mapping
    /// @param wager for the game
    /// @return gameId of the newly created game in
    function createGame(uint wager)
        public 
        payable
        validActiveGameCount()
        stopInEmergency()
        returns(uint) 
        {
        require(msg.value == wager);
        uint gameId = idGenerator;
        games[idGenerator] = Game({
            wager: wager,
            player1: msg.sender,
            player2: leagueManager,
            player1Score: 0,
            player2Score: 0,
            player1TeamSubmitted: false,
            player2TeamSubmitted: false,
            player1TeamRevealed: false,
            player2TeamRevealed: false,
            player1Wins: false,
            player2Wins: false,
            isOpen: true,
            isFinished: false 
        });
        idGenerator += 1;
        activeGames[msg.sender][activeGameIndex[msg.sender]] = gameId;
        activeGameIndex[msg.sender] += 1;
        uint change = msg.value - wager;
        refunds[msg.sender] += change;
        emit LogGameCreation(msg.sender, wager, gameId);
        return gameId;
    }

    /// Allows a second player to join an open game
    /// @param gameId of the game that the player wants to join
    /// @return the gameId
    function joinGame(uint gameId) 
        public
        payable
        gameIsOpen(gameId)
        enoughFunds(gameId)
        validPlayer2(gameId)
        checkValue(gameId)
        validActiveGameCount()
        stopInEmergency()
        returns(uint) 
        {
        games[gameId].player2 = msg.sender;
        games[gameId].isOpen = false;
        balances[gameId] = games[gameId].wager * 2;
        activeGames[msg.sender][activeGameIndex[msg.sender]] = gameId;
        activeGameIndex[msg.sender] += 1;
        emit LogGameBegin(msg.sender, gameId, balances[gameId]);
        return gameId;
    }

    /// @return the total number of games that have ever been created
    function totalGames() public view returns (uint) {
        return idGenerator;
    }

    /* 
        GAMEPLAY: Players submit a team consisting of 1 GK, 1 DEF, 1 MID, and 1 FWD. A hash of this selection is commited to the blockchain with a random salt. They can then reveal their team by providing their original team submission and salt.
    */

    /// Stores hashes of a players' team selection for a given game
    /// @param gkHash of the player's Goalkeeper selection
    /// @param defHash of the player's Defender selection
    /// @param midHash of the player's Midfield selection
    /// @param fwdHash of the player's Forward selection
    /// @param gameId of the game that the player wants to commit their team to for
    function commitTeam(
        bytes32 gkHash, 
        bytes32 defHash, 
        bytes32 midHash, 
        bytes32 fwdHash, 
        uint gameId) 
        public 
        isPlayer(gameId, msg.sender) 
        stopInEmergency()
        withinDeadline() 
        {
        gkCommits[msg.sender][gameId] = Commit({
            commit: gkHash,
            block: uint64(block.number),
            revealed: false
        });

        defCommits[msg.sender][gameId] = Commit({
            commit: defHash,
            block: uint64(block.number),
            revealed: false
        });

        midCommits[msg.sender][gameId] = Commit({
            commit: midHash,
            block: uint64(block.number),
            revealed: false
        });

        fwdCommits[msg.sender][gameId] = Commit({
            commit: fwdHash,
            block: uint64(block.number),
            revealed: false
        });   

        if (msg.sender == games[gameId].player1) {
            games[gameId].player1TeamSubmitted = true;
            emit LogPlayer1TeamCommit(msg.sender, gameId, gkHash, defHash, midHash, fwdHash);
        } else {
            games[gameId].player2TeamSubmitted = true;
            emit LogPlayer2TeamCommit(msg.sender, gameId, gkHash, defHash, midHash, fwdHash);
        }
    }

    /// Hashes a given piece of data with a given salt
    /// @param data to be hashed
    /// @param salt to hash the data with
    /// @return saltedHash of the data and salt
    function getSaltedHash(bytes memory data, bytes memory salt) public view returns(bytes32) {
        return keccak256(abi.encodePacked(address(this), data, salt));
    }
    
    /// Check if reveal hashes match the commit hash
    /// @param gkReveal reveal hash of the player's Goalkeeper selection
    /// @param defReveal reveal hash of the player's Defender selection
    /// @param midReveal reveal hash of the player's Midfield selection
    /// @param fwdReveal reveal hash of the player's Forward selection
    /// @param gameId of the active game
    /// @param salt that the original commits have been hashed with
    /// @param totalScore accumulated by the submitted team
    function revealTeam(
        bytes memory gkReveal, 
        bytes memory defReveal, 
        bytes memory midReveal, 
        bytes memory fwdReveal, 
        uint gameId, 
        bytes memory salt, 
        uint totalScore) 
        public 
        isPlayer(gameId, msg.sender) 
        stopInEmergency() {        
        
        /// Make sure it hasn't been revealed yet and set it to revealed
        require(
            gkCommits[msg.sender][gameId].revealed == false &&
            defCommits[msg.sender][gameId].revealed == false &&
            midCommits[msg.sender][gameId].revealed == false &&
            fwdCommits[msg.sender][gameId].revealed == false, "Team has already been revealed"
            );
        
        //require that they can produce the committed hash
        require(
            getSaltedHash(gkReveal, salt) == gkCommits[msg.sender][gameId].commit &&
            getSaltedHash(defReveal, salt) == defCommits[msg.sender][gameId].commit &&
            getSaltedHash(midReveal, salt) == midCommits[msg.sender][gameId].commit &&
            getSaltedHash(fwdReveal, salt) == fwdCommits[msg.sender][gameId].commit, "Revealed hash does not match commit"
            );

        gkCommits[msg.sender][gameId].revealed = true;
        defCommits[msg.sender][gameId].revealed = true;
        midCommits[msg.sender][gameId].revealed = true;
        fwdCommits[msg.sender][gameId].revealed = true;

        //Determine the winner if both players have submitted their scores.
        if (msg.sender == games[gameId].player1) {
            games[gameId].player1Score = totalScore;
            games[gameId].player1TeamRevealed = true;
            if (games[gameId].player2TeamRevealed) {
                _declareWinner(gameId);
            }
        } else {
            games[gameId].player2Score = totalScore;
            games[gameId].player2TeamRevealed = true;
            if (games[gameId].player1TeamRevealed) {
                _declareWinner(gameId);
            }
        }
        emit LogTeamReveal(msg.sender, gkReveal, defReveal, midReveal, fwdReveal, salt);
    }

    /// Returns a player's team commit for a given game
    /// @param gameId for the game in question
    /// @param player address whose team commit you want
    /// @return a bytes32 array of the commit hashes
    function getTeamCommitForGame(uint gameId, address player) public view returns(bytes32[4] memory commits) {
        bytes32 gkCommit = gkCommits[player][gameId].commit;
        bytes32 defCommit = defCommits[player][gameId].commit;
        bytes32 midCommit = midCommits[player][gameId].commit;
        bytes32 fwdCommit = fwdCommits[player][gameId].commit;
        return [gkCommit, defCommit, midCommit, fwdCommit];
    }

    /* 
        GAME END: Team scores are totaled for each player and the player with the highest total score for that gameweek wins, they can then withdraw their payout.
    */

    /// Checks if the player's team has been revealed for a given game
    /// @param gameId for the game in question
    /// @param player address whose team you want to check the reveal status
    /// @return whether or not the player has revealed their team
    function teamRevealed(uint gameId, address player) public view isPlayer(gameId, player) returns(bool) {
        return (gkCommits[player][gameId].revealed && 
                defCommits[player][gameId].revealed && 
                midCommits[player][gameId].revealed && 
                fwdCommits[player][gameId].revealed);
    }

    /// Retrieves final score for a given player for a game
    /// @param gameId for the game in question
    /// @param player address whose team you want to check the score
    /// @return player score for game
    function viewPlayerScore(uint gameId, address player) public view isPlayer(gameId, player) returns(uint) {
        require(gkCommits[player][gameId].revealed == true);
        if (games[gameId].player1 == player) {
            return games[gameId].player1Score;
        } else {
            return games[gameId].player2Score;
        }
    }

    /// Retrives the winner for a given game
    /// @param gameId for the game you want to see the winner of
    /// @return address of the winner
    function viewWinner(uint gameId) public view bothTeamsRevealed(gameId) returns(address winner) {
        if (games[gameId].player1Wins) {
            return games[gameId].player1;
        } else {
            return games[gameId].player2;
        }
    }

    /// Sets the winner for a given game once both teams have been revealed
    /// @param gameId for the active game
    function _declareWinner(uint gameId) internal bothTeamsRevealed(gameId) {
        if (games[gameId].player1Score > games[gameId].player2Score) {
            games[gameId].player1Wins = true;
        } else if (games[gameId].player1Score < games[gameId].player2Score) {
            games[gameId].player2Wins = true;
        } else {
            games[gameId].player1Wins = true;
            games[gameId].player2Wins = true;
        }
    }

}


interface CryptoFPLCards {
    enum Position {
    Forward,
    Midfielder,
    Defender,
    Goalkeeper
  }
    function positionOf(uint tokenId) external returns(Position);
    function balanceOf(address addr, uint tokenId) external returns(uint);
}