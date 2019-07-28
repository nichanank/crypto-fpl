const CryptoFPL = artifacts.require("./contracts/CryptoFPL.sol")
const CryptoFPLCards = artifacts.require("./contracts/CryptoFPLCards.sol")
let catchRevert = require("./exceptionHelpers.js").catchRevert

const BigNumber = web3.BigNumber;
const maxNumber = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

const timePeriodInSeconds = 3600
const from = Math.floor(new Date() / 1000)
const to = from + timePeriodInSeconds
const cardPrice = 100000000000000000

contract('CryptoFPL', async (accounts) => {
  const deployer = accounts[0]
  const player1 = accounts[1]
  const player2 = accounts[2]
  const player3 = accounts[3]
  const entryFee = 20
  const ids = [1, 2, 3, 4] // Dummy CryptoFPLCards tokenIDs to mint
  const positions = [1, 2, 3, 4] // Positions for minted CryptoFPLCards
  const amounts = [1, 1, 1, 1] // Amounts of CryptoFPLCards minted each time
  const salt = web3.utils.sha3("1") // Example salt to add to the player commits
  let instance
  
  beforeEach( async () => {
    instance = await CryptoFPL.new(entryFee)
  })

  describe("Setup", async () => {
  
    it('should check to make sure that the owner of the contract is the msg.sender', async () => {
      const owner = await instance.leagueManager()
      assert.equal(owner, deployer, "the deploying address should be the leagueManager")
    })

  })

  describe("Admin", async ()  => {

    it('should allow the leagueAdmin to pause the contract', async () => {
      await instance.toggleContractPause({from: deployer})
      const paused = await instance.isPaused()
      assert.equal(paused, true, "contract should be paused")
    })

    it('should not let players call certain functions if the contact is currently paused', async () => {
      await instance.toggleContractPause({from: deployer})
      await catchRevert(instance.createGame(100, {from: player1, value: 100}), "player should not be able to create a game when the contract is paused")
    })

    // it('should allow admin toggle deadlinePassed() and not let players commit their team if the deadline has passed', async () => {
    //   await instance.createGame(100, {from: player1, value: 100})
    //   await instance.toggleDeadlinePassedBackup({from: deployer})
      
    //   let teamHashes = {}
    //   teamHashes['gk'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[0]))), salt)
    //   teamHashes['def'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[1]))), salt)
    //   teamHashes['mid'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[2]))), salt)
    //   teamHashes['fwd'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[3]))), salt)

    //   await catchRevert(instance.commitTeam(teamHashes['gk'], teamHashes['def'], teamHashes['mid'], teamHashes['fwd'], 0, { from: player1 }))
    // })

  })

  describe("Functions", () => {
    
    it('viewGameDetails() should return correct game details', async () => {
      await instance.createGame(100, {from: player1, value: 100})
      await instance.joinGame(0, {from: player2, value: cardPrice})
      const gameDetails = await instance.viewGameDetails(0)
      assert.equal(gameDetails['0'], player1)
      assert.equal(gameDetails['1'], player2)
      assert.equal(gameDetails['2'].toString(), '100')
      assert.equal(gameDetails['3'], false)
      assert.equal(gameDetails['4'], false)
    })

    describe("createGame()", async () => {
            
      it('should let game creators deposit an initial wager into the game', async () => {
        const tx = await instance.createGame(100, {from: player1, value: 100})
        const gameData = tx.logs[0].args
        assert.equal(gameData.wager, 100, "wager should equal 100")
        assert.equal(gameData.player1, player1, "player 1 should be the person who called the game creation function")
      })

      it('should let a second user enter a game if the game is still open', async () => {
        await instance.createGame(100, {from: player1, value: 100})
        const tx = await instance.joinGame(0, {from: player2, value: 100})
        const gameData = tx.logs[0].args
        assert.equal(gameData.player2, player2, "player 2's address should reflect in games log")
      })

      it('should not let a third player into the game', async () => {
        await instance.createGame(100, {from: player1, value: 100})
        await instance.joinGame(0, {from: player2, value: 100})
        await catchRevert(instance.joinGame(0, {from: player3, value: 100}))
      })

      it('should not let a second user enter a game with less than the required deposit', async () => {
        await instance.createGame(100, {from: player1, value: 100})
        await catchRevert(instance.joinGame(0, {from: player2, value: 5}))
      })

      it('should give refunds if second user deposits more than the stated wager', async () => {
        await instance.createGame(100, {from: player1, value: 100})
        const beforeBalance = await web3.eth.getBalance(player2)
        await instance.joinGame(0, {from: player2, value: 200}) //Overpayment
        await instance.withdrawRefund({from: player2})
        const afterBalance = await web3.eth.getBalance(player2)

        assert.equal((Number(afterBalance.slice(-4))), beforeBalance.slice(-4) - 100, "overpayment should be refunded")
      })

      it('should store the correct available payout for each game', async () => {
        await instance.createGame(100, {from: player1, value: 100})
        const tx = await instance.joinGame(0, {from: player2, value: 100})
        const gameData = tx.logs[0].args
        assert.equal(gameData.totalPayout, 200, "total payout should reflect deposited wagers from the two players")
      })

      it('should return the correct number of games that have ever been created', async () => {
        for (var i = 0; i < 12; i++) {
          await instance.createGame(100, {from: deployer, value: 100})  
        }
        const totalGames = await instance.totalGames({from: deployer})
        assert.equal(totalGames, 12, "totalGames() should keep track of how many games have been created")
      })

      it('should not let players create more games if they already have 3 open games', async () => {
        for (var i = 0; i < 3; i++) {
          await instance.createGame(100, {from: player1, value: 100})
        }
        await catchRevert(instance.createGame(100, {from: player1, value: 100}), "player shouldn't be able to create more games if their previous 3 are still open")
      })

    })

    describe("Gameplay", async () => {
            
      it('should emit events for games that the player is currently active in', async () => {
        await instance.createGame(100, {from: player1, value: 100})
        await instance.createGame(100, {from: player1, value: 100})
        await instance.createGame(100, {from: player1, value: 100})
        var activeGamesPlayer1 = await instance.getPastEvents('LogGameCreation', {filter:{player1: player1}, fromBlock: 0, toBlock: 'latest'})
        assert.equal(activeGamesPlayer1.length, 3, 'active games length for player1 should be 3')
        assert.equal(activeGamesPlayer1[0].returnValues.gameId, 0, 'first item in active games should be gameId 0')
        assert.equal(activeGamesPlayer1[1].returnValues.gameId, 1, 'second item in active games should be gameId 1')
        assert.equal(activeGamesPlayer1[2].returnValues.gameId, 2, 'third item in active games should be gameId 2')
        await instance.joinGame(2, {from: player2, value: 100})
        var activeGamesPlayer2 = await instance.getPastEvents('LogGameBegin', {filter:{player2: player2}, fromBlock: 0, toBlock: 'latest'})
        assert.equal(activeGamesPlayer2.length, 1, 'active games length for player 2 should be 1')
        assert.equal(activeGamesPlayer2[0].returnValues.gameId, 2, 'first item in active games for player 2 should be gameId 2')
      })
      
      it('should let users commit their selected team', async () => {
        let cardContractInstance = await CryptoFPLCards.new(1819)
        await cardContractInstance.mintTeam(player1, ids, positions, amounts, {value: cardPrice})
        await instance.createGame(100, {from: player1, value: 100})

        let teamHashes = {}
        teamHashes['gk'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[0]))), salt)
        teamHashes['def'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[0]))), salt)
        teamHashes['mid'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[0]))), salt)
        teamHashes['fwd'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[0]))), salt)

        await instance.commitTeam(teamHashes['gk'], teamHashes['def'], teamHashes['mid'], teamHashes['fwd'], 0, { from: player1 })
        let teamCommit = await instance.getTeamCommitForGame(0, player1 )
        assert.equal(teamCommit.length, 4, "invalid returned array for team commit")
        assert.notEqual(teamCommit[0], 0x0000000000000000000000000000000000000000000000000000000000000000, 'gkCommit should return be non-zero hash')
        assert.notEqual(teamCommit[1], 0x0000000000000000000000000000000000000000000000000000000000000000, 'defCommit should return be non-zero hash')
        assert.notEqual(teamCommit[2], 0x0000000000000000000000000000000000000000000000000000000000000000, 'midCommit should return be non-zero hash')
        assert.notEqual(teamCommit[3], 0x0000000000000000000000000000000000000000000000000000000000000000, 'fwdCommit should return be non-zero hash')
        
      })

      it('should let users reveal their selected team if the submitted hashes are valid', async () => {
        let cardContractInstance = await CryptoFPLCards.new(1819)
        await cardContractInstance.mintTeam(player1, ids, positions, amounts, {value: cardPrice})
        await instance.createGame(100, {from: player1, value: 100})

        let teamHashes = {}
        teamHashes['gk'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[0]))), salt)
        teamHashes['def'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[1]))), salt)
        teamHashes['mid'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[2]))), salt)
        teamHashes['fwd'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[3]))), salt)

        await instance.commitTeam(teamHashes['gk'], teamHashes['def'], teamHashes['mid'], teamHashes['fwd'], 0, { from: player1 })
        await instance.revealTeam(web3.utils.sha3(web3.utils.numberToHex(ids[0])), web3.utils.sha3(web3.utils.numberToHex(ids[1])), web3.utils.sha3(web3.utils.numberToHex(ids[2])), web3.utils.sha3(web3.utils.numberToHex(ids[3])), 0, salt, 15, { from: player1 })

        var teamRevealed = await instance.teamRevealed(0, player1)
        assert.equal(teamRevealed, true, "team has not been revealed")
      })
      
      it('should not let player reveal their team if revealHash is not valid', async () => {
        let cardContractInstance = await CryptoFPLCards.new(1819)
        await cardContractInstance.mintTeam(player1, ids, positions, amounts, {value: cardPrice})
        await instance.createGame(100, {from: player1, value: 100})

        let teamHashes = {}
        teamHashes['gk'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[0]))), salt)
        teamHashes['def'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[1]))), salt)
        teamHashes['mid'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[2]))), salt)
        teamHashes['fwd'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[3]))), salt)

        await instance.commitTeam(teamHashes['gk'], teamHashes['def'], teamHashes['mid'], teamHashes['fwd'], 0, { from: player1 })

        let incorrectGkReveal = web3.utils.sha3(web3.utils.numberToHex(ids[2]))
        let correctDefReveal = web3.utils.sha3(web3.utils.numberToHex(ids[1]))
        let correctMidReveal = web3.utils.sha3(web3.utils.numberToHex(ids[2]))
        let correctFwdReveal = web3.utils.sha3(web3.utils.numberToHex(ids[3]))
        await catchRevert(instance.revealTeam(incorrectGkReveal, correctDefReveal, correctMidReveal, correctFwdReveal, 0, salt, 15, { from: player1 }), "should have reverted due to invalid revealHash")
        
        var teamRevealed = await instance.teamRevealed(0, player1)
        assert.notEqual(teamRevealed, true, "team should not have been revealed")
        assert.notEqual(teamHashes['gk'], 0x0000000000000000000000000000000000000000000000000000000000000000)
      })

      it('should record the player score upon team reveal', async () => {
        let cardContractInstance = await CryptoFPLCards.new(1819)
        
        await cardContractInstance.mintTeam(player1, ids, positions, amounts, {value: cardPrice})
        await cardContractInstance.mintTeam(player2, ids, positions, amounts, {value: cardPrice})
        
        await instance.createGame(100, {from: player1, value: 100})
        await instance.joinGame(0, {from: player2, value: 100})

        let teamHashes = {}
        teamHashes['gk'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[0]))), salt)
        teamHashes['def'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[1]))), salt)
        teamHashes['mid'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[2]))), salt)
        teamHashes['fwd'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[3]))), salt)

        await instance.commitTeam(teamHashes['gk'], teamHashes['def'], teamHashes['mid'], teamHashes['fwd'], 0, { from: player1 })
        await instance.commitTeam(teamHashes['gk'], teamHashes['def'], teamHashes['mid'], teamHashes['fwd'], 0, { from: player2 })

        //Reveal team with dummy scores
        let correctGkReveal = web3.utils.sha3(web3.utils.numberToHex(ids[0]))
        let correctDefReveal = web3.utils.sha3(web3.utils.numberToHex(ids[1]))
        let correctMidReveal = web3.utils.sha3(web3.utils.numberToHex(ids[2]))
        let correctFwdReveal = web3.utils.sha3(web3.utils.numberToHex(ids[3]))
        let player1Score = 20
        let player2Score = 15
        
        await instance.revealTeam(correctGkReveal, correctDefReveal, correctMidReveal, correctFwdReveal, 0, salt, player1Score, { from: player1 })
        await instance.revealTeam(correctGkReveal, correctDefReveal, correctMidReveal, correctFwdReveal, 0, salt, player2Score, { from: player2 })
        let player1Revealed = await instance.teamRevealed(0, player1)
        let player2Revealed = await instance.teamRevealed(0, player2)
        assert.equal(player1Revealed, true, "Player 1's team should have been marked as revealed")
        assert.equal(player2Revealed, true, "Player 2's team should have been marked as revealed")
        
        let winner = await instance.viewWinner(0)
        assert.equal(winner, player1, "Player1 should be the returned winner")
      })

      it('should return the correct final score for a player once they have revealed their team', async () => {
        let cardContractInstance = await CryptoFPLCards.new(1819)
        await cardContractInstance.mintTeam(player1, ids, positions, amounts, {value: cardPrice})
        await instance.createGame(100, {from: player1, value: 100})

        let teamHashes = {}
        teamHashes['gk'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[0]))), salt)
        teamHashes['def'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[1]))), salt)
        teamHashes['mid'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[2]))), salt)
        teamHashes['fwd'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[3]))), salt)

        await instance.commitTeam(teamHashes['gk'], teamHashes['def'], teamHashes['mid'], teamHashes['fwd'], 0, { from: player1 })
        
        //Reveal team with dummy scores
        let correctGkReveal = web3.utils.sha3(web3.utils.numberToHex(ids[0]))
        let correctDefReveal = web3.utils.sha3(web3.utils.numberToHex(ids[1]))
        let correctMidReveal = web3.utils.sha3(web3.utils.numberToHex(ids[2]))
        let correctFwdReveal = web3.utils.sha3(web3.utils.numberToHex(ids[3]))
        let player1Score = 20
        
        await instance.revealTeam(correctGkReveal, correctDefReveal, correctMidReveal, correctFwdReveal, 0, salt, player1Score, { from: player1 })
        let player1Revealed = await instance.teamRevealed(0, player1)        
        let score = await instance.viewPlayerScore(0, player1)
        assert.equal(score, player1Score, "Player1 should be the returned winner")
      })

      // it('should let the league manager update the gameweek', async () => {
      //   await instance.updateGameweek()
      //   assert.equal(instance.gameweek, 1) 
      // })

    })

    describe("PrizeWinnings", async () => {
      
      it('should allow winner to withdraw the payout', async () => {
        
        let cardContractInstance = await CryptoFPLCards.new(1819)
        
        await cardContractInstance.mintTeam(player1, ids, positions, amounts, {value: cardPrice})
        await cardContractInstance.mintTeam(player2, ids, positions, amounts, {value: cardPrice})
        
        await instance.createGame(100, {from: player1, value: 100})
        await instance.joinGame(0, {from: player2, value: 100})

        let teamHashes = {}
        teamHashes['gk'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[0]))), salt)
        teamHashes['def'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[1]))), salt)
        teamHashes['mid'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[2]))), salt)
        teamHashes['fwd'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[3]))), salt)

        await instance.commitTeam(teamHashes['gk'], teamHashes['def'], teamHashes['mid'], teamHashes['fwd'], 0, { from: player1 })
        await instance.commitTeam(teamHashes['gk'], teamHashes['def'], teamHashes['mid'], teamHashes['fwd'], 0, { from: player2 })
        
        //Reveal team with dummy scores
        let correctGkReveal = web3.utils.sha3(web3.utils.numberToHex(ids[0]))
        let correctDefReveal = web3.utils.sha3(web3.utils.numberToHex(ids[1]))
        let correctMidReveal = web3.utils.sha3(web3.utils.numberToHex(ids[2]))
        let correctFwdReveal = web3.utils.sha3(web3.utils.numberToHex(ids[3]))
        let player1Score = 20
        let player2Score = 15
        
        await instance.revealTeam(correctGkReveal, correctDefReveal, correctMidReveal, correctFwdReveal, 0, salt, player1Score, { from: player1 })
        await instance.revealTeam(correctGkReveal, correctDefReveal, correctMidReveal, correctFwdReveal, 0, salt, player2Score, { from: player2 })
        
        let beforeBalance = await web3.eth.getBalance(player1)
        await instance.withdrawPayout(0, { from: player1 })
        let afterBalance = await web3.eth.getBalance(player1)
        assert.equal(Number(afterBalance.slice(-4) - beforeBalance.slice(-4)), 200, "Player1 should have received the money")
      })

      it('should not allow payout withdrawal if player has not won', async () => {
        let cardContractInstance = await CryptoFPLCards.new(1819)
        
        await cardContractInstance.mintTeam(player1, ids, positions, amounts, {value: cardPrice})
        await cardContractInstance.mintTeam(player2, ids, positions, amounts, {value: cardPrice})
        
        await instance.createGame(100, {from: player1, value: 100})
        await instance.joinGame(0, {from: player2, value: 100})

        let teamHashes = {}
        teamHashes['gk'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[0]))), salt)
        teamHashes['def'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[1]))), salt)
        teamHashes['mid'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[2]))), salt)
        teamHashes['fwd'] = await instance.getSaltedHash(web3.utils.numberToHex(web3.utils.sha3(web3.utils.numberToHex(ids[3]))), salt)

        await instance.commitTeam(teamHashes['gk'], teamHashes['def'], teamHashes['mid'], teamHashes['fwd'], 0, { from: player1 })
        await instance.commitTeam(teamHashes['gk'], teamHashes['def'], teamHashes['mid'], teamHashes['fwd'], 0, { from: player2 })
        
        //Reveal team with dummy scores
        let correctGkReveal = web3.utils.sha3(web3.utils.numberToHex(ids[0]))
        let correctDefReveal = web3.utils.sha3(web3.utils.numberToHex(ids[1]))
        let correctMidReveal = web3.utils.sha3(web3.utils.numberToHex(ids[2]))
        let correctFwdReveal = web3.utils.sha3(web3.utils.numberToHex(ids[3]))
        let player1Score = 20
        let player2Score = 15
        
        await instance.revealTeam(correctGkReveal, correctDefReveal, correctMidReveal, correctFwdReveal, 0, salt, player1Score, { from: player1 })
        await instance.revealTeam(correctGkReveal, correctDefReveal, correctMidReveal, correctFwdReveal, 0, salt, player2Score, { from: player2 })
        
        await catchRevert(instance.withdrawPayout(0, { from: player2 }), "Player 2 lost and should not be able to withdraw money from the game pool")
      })

    })

  })
  
})