const CryptoFPL = artifacts.require("./contracts/CryptoFPL.sol")
const CryptoFPLCards = artifacts.require("./contracts/CryptoFPLCards.sol")
let catchRevert = require("./exceptionHelpers.js").catchRevert

const BigNumber = web3.BigNumber;
const maxNumber = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

const timePeriodInSeconds = 3600
const from = Math.floor(new Date() / 1000)
const to = from + timePeriodInSeconds

contract('CryptoFPL', async (accounts) => {
  const deployer = accounts[0]
  const player1 = accounts[1]
  const player2 = accounts[2]
  const player3 = accounts[3]
  const entryFee = 20
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

  describe("Functions", () => {
    
    it('getGameInfo() should return correct game details', async () => {
      await instance.createGame(100, {from: player1, value: 100})
      await instance.joinGame(0, {from: player2, value: 100})
      const gameDetails = await instance.getGameDetails(0)
      assert.equal(gameDetails['0'], player1)
      assert.equal(gameDetails['1'], player2)
      assert.equal(gameDetails['2'].toString(), '100')
      assert.equal(gameDetails['3'], false)
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
        const beforeAmount = await web3.eth.getBalance(player2)
        await instance.joinGame(0, {from: player2, value: 100})
        const afterAmount = await web3.eth.getBalance(player2)

        assert.equal((Number(afterAmount.slice(-4)) + 100).toString(), beforeAmount.slice(-4), "overpayment should be refunded")
      })

      it('should store the correct available payout for each game', async () => {
        await instance.createGame(100, {from: player1, value: 100})
        const tx = await instance.joinGame(0, {from: player2, value: 100})
        const gameData = tx.logs[0].args
        assert.equal(gameData.totalPayout, 200, "total payout should reflect deposited wagers from the two players")
      })

      it('should only store the latest 10 games in the recentGamesMapping', async () => {
        for (var i = 0; i < 15; i++) {
          await instance.createGame(100, {from: deployer, value: 100})  
        }
        const recentGamesData = await instance.viewRecentlyCreatedGames({from: deployer})
        assert.equal(recentGamesData.length, 10, "there should be up to 10 recently created games")
      })

      it('should override older games to keep track of games created after the 10th one', async () => {
        for (var i = 0; i < 12; i++) {
          await instance.createGame(100, {from: deployer, value: 100})  
        }
        const recentGamesData = await instance.viewRecentlyCreatedGames({from: deployer})
        assert.equal(recentGamesData[0], 10, "oldest game should have been overwrote for the 11th game created")
        assert.equal(recentGamesData[1], 11, "second oldest game should have been overwrote for the 12th game created")
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
            
      it('should return the correct number of active games for a given player', async () => {
        await instance.createGame(100, {from: player1, value: 100})
        await instance.createGame(100, {from: player1, value: 100})
        await instance.createGame(100, {from: player1, value: 100})
        var activeGames = await instance.viewActiveGames({from: player1})
        assert.equal(activeGames[0].toNumber(), 0, 'first item in active games should be gameId 0')
        assert.equal(activeGames[1].toNumber(), 1, 'second item in active games should be gameId 1')
        assert.equal(activeGames[2].toNumber(), 2, 'third item in active games should be gameId 2')
      })
      
      it('should let users commit their selected team', async () => {
        let ids = [1, 2, 3, 4]
        let positions = [1, 2, 3, 4]
        let amounts = [1, 1, 1, 1]
        let cardContractInstance = await CryptoFPLCards.new(1819)
        let salt = web3.utils.sha3("1")
        await cardContractInstance.mintTeam(player1, ids, positions, amounts, {value: 100})
        await instance.createGame(100, {from: player1, value: 100})

        let teamHashes = {}
        teamHashes['gk'] = await instance.getSaltedHash(web3.utils.utf8ToHex(ids[0]), salt)
        teamHashes['def'] = await instance.getSaltedHash(web3.utils.utf8ToHex(ids[1]), salt)
        teamHashes['mid'] = await instance.getSaltedHash(web3.utils.utf8ToHex(ids[2]), salt)
        teamHashes['fwd'] = await instance.getSaltedHash(web3.utils.utf8ToHex(ids[3]), salt)

        await instance.commitTeam(teamHashes['gk'], teamHashes['def'], teamHashes['mid'], teamHashes['fwd'], 0, { from: player1 })
        let teamCommit = await instance.getTeamCommitForGame(0, player1 )
        assert.equal(teamCommit.length, 4, "invalid returned array for team commit")
        assert.notEqual(teamCommit[0], 0x0000000000000000000000000000000000000000000000000000000000000000, 'gkCommit should return be non-zero hash')
        assert.notEqual(teamCommit[1], 0x0000000000000000000000000000000000000000000000000000000000000000, 'defCommit should return be non-zero hash')
        assert.notEqual(teamCommit[2], 0x0000000000000000000000000000000000000000000000000000000000000000, 'midCommit should return be non-zero hash')
        assert.notEqual(teamCommit[3], 0x0000000000000000000000000000000000000000000000000000000000000000, 'fwdCommit should return be non-zero hash')
        
      })

      it('should let users reveal their selected team if the submitted hashes are valid', async () => {
        let ids = [1, 2, 3, 4]
        let positions = [1, 2, 3, 4]
        let amounts = [1, 1, 1, 1]
        let salt = web3.utils.sha3("1")
        let cardContractInstance = await CryptoFPLCards.new(1819)
        await cardContractInstance.mintTeam(player1, ids, positions, amounts, {value: 100})
        await instance.createGame(100, {from: player1, value: 100})

        let teamHashes = {}
        teamHashes['gk'] = await instance.getSaltedHash(web3.utils.utf8ToHex(ids[0]), salt)
        teamHashes['def'] = await instance.getSaltedHash(web3.utils.utf8ToHex(ids[1]), salt)
        teamHashes['mid'] = await instance.getSaltedHash(web3.utils.utf8ToHex(ids[2]), salt)
        teamHashes['fwd'] = await instance.getSaltedHash(web3.utils.utf8ToHex(ids[3]), salt)

        await instance.commitTeam(teamHashes['gk'], teamHashes['def'], teamHashes['mid'], teamHashes['fwd'], 0, { from: player1 })
        await instance.revealTeam(web3.utils.utf8ToHex(ids[0]), web3.utils.utf8ToHex(ids[1]), web3.utils.utf8ToHex(ids[2]), web3.utils.utf8ToHex(ids[03]), 0, salt, 15, { from: player1 })

        var teamRevealed = await instance.teamRevealed(0, player1)
        assert.equal(teamRevealed, true, "team has not been revealed")
      })
      
      it('should not let player reveal their team if revealHash is not valid', async () => {
        let ids = [1, 2, 3, 4]
        let positions = [1, 2, 3, 4]
        let amounts = [1, 1, 1, 1]
        let salt = web3.utils.sha3("1")
        let cardContractInstance = await CryptoFPLCards.new(1819)
        await cardContractInstance.mintTeam(player1, ids, positions, amounts, {value: 100})
        await instance.createGame(100, {from: player1, value: 100})

        let teamHashes = {}
        teamHashes['gk'] = await instance.getSaltedHash(web3.utils.numberToHex(ids[0]), salt)
        teamHashes['def'] = await instance.getSaltedHash(web3.utils.numberToHex(ids[1]), salt)
        teamHashes['mid'] = await instance.getSaltedHash(web3.utils.numberToHex(ids[2]), salt)
        teamHashes['fwd'] = await instance.getSaltedHash(web3.utils.numberToHex(ids[3]), salt)

        await instance.commitTeam(teamHashes['gk'], teamHashes['def'], teamHashes['mid'], teamHashes['fwd'], 0, { from: player1 })

        let incorrectGkReveal = web3.utils.sha3("" + ids[2])
        let correctDefReveal = web3.utils.sha3("" + ids[1])
        let correctMidReveal = web3.utils.sha3("" + ids[2])
        let correctFwdReveal = web3.utils.sha3("" + ids[3])
        await catchRevert(instance.revealTeam(incorrectGkReveal, correctDefReveal, correctMidReveal, correctFwdReveal, 0, salt, 15, { from: player1 }), "should have reverted due to invalid revealHash")
        
        var teamRevealed = await instance.teamRevealed(0, player1)
        assert.notEqual(teamRevealed, true, "team should not have been revealed")
        assert.notEqual(teamHashes['gk'], 0x0000000000000000000000000000000000000000000000000000000000000000)
      })

      it('should record the player score upon team reveal', async () => {
        let ids = [1, 2, 3, 4]
        let positions = [1, 2, 3, 4]
        let amounts = [1, 1, 1, 1]
        let salt = web3.utils.sha3("1")
        let cardContractInstance = await CryptoFPLCards.new(1819)
        
        await cardContractInstance.mintTeam(player1, ids, positions, amounts, {value: 100})
        await cardContractInstance.mintTeam(player2, ids, positions, amounts, {value: 100})
        
        await instance.createGame(100, {from: player1, value: 100})
        await instance.joinGame(0, {from: player2, value: 100})

        let teamHashes = {}
        teamHashes['gk'] = await instance.getSaltedHash(web3.utils.utf8ToHex(ids[0]), salt)
        teamHashes['def'] = await instance.getSaltedHash(web3.utils.utf8ToHex(ids[1]), salt)
        teamHashes['mid'] = await instance.getSaltedHash(web3.utils.utf8ToHex(ids[2]), salt)
        teamHashes['fwd'] = await instance.getSaltedHash(web3.utils.utf8ToHex(ids[3]), salt)

        await instance.commitTeam(teamHashes['gk'], teamHashes['def'], teamHashes['mid'], teamHashes['fwd'], 0, { from: player1 })
        await instance.commitTeam(teamHashes['gk'], teamHashes['def'], teamHashes['mid'], teamHashes['fwd'], 0, { from: player2 })
        
        //Reveal team with dummy scores
        await instance.revealTeam(web3.utils.utf8ToHex(ids[0]), web3.utils.utf8ToHex(ids[1]), web3.utils.utf8ToHex(ids[2]), web3.utils.utf8ToHex(ids[03]), 0, salt, 20, { from: player1 })
        await instance.revealTeam(web3.utils.utf8ToHex(ids[0]), web3.utils.utf8ToHex(ids[1]), web3.utils.utf8ToHex(ids[2]), web3.utils.utf8ToHex(ids[03]), 0, salt, 15, { from: player2 })
        let player1Revealed = await instance.teamRevealed(0, player1)
        let player2Revealed = await instance.teamRevealed(0, player2)
        assert.equal(player1Revealed, true, "Player 1's team should have been marked as revealed")
        assert.equal(player2Revealed, true, "Player 2's team should have been marked as revealed")
        
        let winner = await instance.viewWinner(0)
        assert.equal(winner, player1, "Player1 should be the returned winner")
      })

      // it('should let the league manager update the gameweek', async () => {
      //   await instance.updateGameweek()
      //   assert.equal(instance.gameweek, 1) 
      // })

    })

    describe("PrizeWinnings", async () => {
      
      it('should allow winner to withdraw the payout', async () => {

      })

      it('should not allow payout withdrawal if player has not won', async () => {

      })

    })

  })
  
})