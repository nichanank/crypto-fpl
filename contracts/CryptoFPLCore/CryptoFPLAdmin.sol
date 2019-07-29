pragma solidity ^0.5.0;

import "../ProvableAPI.sol";

    /// @author Nichanan Kesonpat
    /// @title Admin functions for CryptoFPL

contract CryptoFPLAdmin is usingProvable {

    /// Storage variables
    address payable public leagueManager;
    bytes32 public provableId;
    bool deadlinePassed = false;
    uint entryFee;
    uint gameweek = 0;
    uint deadline = 1565373600; // Gameweek deadline epoch
    bool private paused = false;

    /// Events
    event LogNewProvableQuery(string message);
    event LogNewGameweekBegin(uint gameweek, uint deadline);
    event LogDeadlineStatusUpdated(uint gameweek, bool deadlinePassed, uint timeNow);

    /// Modifiers
    modifier isLeagueManager() { require(msg.sender == leagueManager, "Only the league manager can perform this action"); _; }
    modifier stopInEmergency() { require(!paused, "Cannot execute this function when contract is paused"); _; }
    modifier onlyInEmergency() { require(paused, "This function can only be executed if the contract has been paused"); _; }
    modifier withinDeadline() {require(!deadlinePassed, "This function can only be executed within the gameweek deadline"); _; }

    /// Returns the pause status of the contract
    /// @dev Circuit breaker for contract
    /// @return boolean of whether or not the contract is currently paused
    function isPaused() external view returns(bool) {
        return paused;
    }

    /// Returns deadline passed status
    /// @return boolean of whether or not the gameweek deadline has passed
    function viewDeadlineStatus() external view returns(uint _deadline, bool _deadlinePassed) {
        return (deadline, deadlinePassed);
    }

    /// Allows the admin to pause certain contract functions to be called in case of emergency
    /// Functions paused in emergency are: createGame, joinGame, commitTeam, and revealTeam
    function toggleContractPause() external isLeagueManager() {
        paused = !paused;
    }

    /// Updates the live gameweek
    /// @param _deadline time epoch of the live gameweek
    function incrementGameweek(uint _deadline) external isLeagueManager() {
        gameweek += 1;
        deadline = _deadline;
        deadlinePassed = false;
        emit LogNewGameweekBegin(gameweek, deadline);
    }

    // /// Backup function to toggle deadline if provable query fails
    // function toggleDeadlinePassedBackup() external isLeagueManager() {
    //     deadlinePassed = !deadlinePassed;
    // }

    /// Queries the current time (GMT+1) using Provable
    /// @dev should be called by admin when the gameweek deadline has passed
    function toggleDeadlinePassed() external payable isLeagueManager() {
        if (provable_getPrice("URL") > address(this).balance) {
            emit LogNewProvableQuery("Please add some ETH to cover for the query fee");
        } else {
            emit LogNewProvableQuery("provable query was sent, standing by...");
            provableId = provable_query("URL", "json(http://worldtimeapi.org/api/timezone/Europe/London).unixTime");
        }
    }

    /// Handles ProvableAPI call response
    /// @dev sets the 'deadlinePassed' variable to true if the current time exceeds the gameweek deadline.
    function __callback(bytes32 _provableId, string memory _res) public {
        require(msg.sender == provable_cbAddress());
        uint timeNow = parseInt(_res);
        if (timeNow > deadline) {
            deadlinePassed = true;
        }
        emit LogDeadlineStatusUpdated(gameweek, deadlinePassed, timeNow);
    }

}