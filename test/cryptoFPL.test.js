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
            
      it('should allow team submission', async () => {
        let ids = [1, 2, 3, 4]
        let positions = [1, 2, 3, 4]
        let amounts = [1, 1, 1, 1]
        let cardContractInstance = await CryptoFPLCards.new(1819)
        await cardContractInstance.mintTeam(player1, ids, positions, amounts, {value: 100})
        await instance.createGame(100, {from: player1, value: 100})
        
        let teamToCommit = [1, 2, 3, 4]
        await instance.commitTeam(cardContractInstance.address, teamToCommit, 0, {from: player1})
        let gkCommit = await instance.getGKCommitForGame(0, {from: player1})
        assert.equal(gkCommit, 0, 'should return hash of 1')

      })
      
      it('should update user scores after the gameweek has ended', async () => {

      })

      it('should let users commit their selected team', async () => {

      })

    })

    describe("PrizeWinnings", async () => {
      
      it('should allow winner to withdraw the payout', async () => {

      })

      it('should not allow payout withdrawal if player has not won', async () => {

      })

    })

  })
  
})