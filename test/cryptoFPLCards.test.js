const CryptoFPLCards = artifacts.require("./contracts/CryptoFPLCards.sol")

const BigNumber = web3.BigNumber;
const maxNumber = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

const timePeriodInSeconds = 3600
const from = Math.floor(new Date() / 1000)
const to = from + timePeriodInSeconds

contract('CryptoFPL', async (accounts) => {
  const owner = accounts[0]
  const user1 = accounts[1]
  const user2 = accounts[2]
  const cardPrice = 100000000000000000
  const catchRevert = require("./exceptionHelpers.js").catchRevert
  
  beforeEach('set up CryptoFPLCards contract for each test', async () => {
    instance = await CryptoFPLCards.deployed()
  })

  describe("Setup", async () => {
  
    it('should check to make sure that the owner of the contract is the msg.sender', async () => {
      callOwner = await instance.owner()
      assert.equal(callOwner, owner)
    })

    it('should have the correct contract name and symbol', async () => {
      let correctSymbol = 'FPL'
      let correctName = 'CryptoFPL'
      callSymbol = await instance.symbol.call()
      callName = await instance.name.call()
      assert.equal(callSymbol, correctSymbol)
      assert.equal(callName, correctName)
    })
  
  })

  describe("Functions", async () => {
    
    it('should mint a team to a user if given sufficient payment', async () => {
      let ids = [1, 2, 3, 4]
      let positions = [1, 2, 3, 4]
      let amounts = [1, 10, 15, 20]
      await instance.mintTeam(user2, ids, positions, amounts, {value: cardPrice})
      ownerTokenBalance1 = await instance.balanceOf(user2, 1)
      ownerTokenBalance2 = await instance.balanceOf(user2, 2)
      ownerTokenBalance3 = await instance.balanceOf(user2, 3)
      assert.equal(ownerTokenBalance1, 1, 'user should own 1 of token id 1')
      assert.equal(ownerTokenBalance2, 10, 'user should own 10 of token id 2')
      assert.equal(ownerTokenBalance3, 15, 'user should own 15 of token id 3')
    })

    it('should return the correct position of a footballer once initialized', async () => {
      let ids = [15, 21, 39, 94]
      let positions = [1, 2, 3, 4]
      let amounts = [1, 1, 1, 1]
      await instance.mintTeam(user1, ids, positions, amounts, {value: cardPrice})
      footballer1Position = await instance.positions(15)
      footballer2Position = await instance.positions(21)
      footballer3Position = await instance.positions(94)
      assert.equal(Number(footballer1Position), 0, 'footballer id 15 should be GK')
      assert.equal(Number(footballer2Position), 1, 'footballer id 21 should be DEF')
      assert.equal(Number(footballer3Position), 3, 'footballer id 94 should be FWD')
    })

    it('should give a list of footballers that a user owns', async () => {
      let ids = [1, 2, 3, 4]
      let positions = [1, 2, 3, 4]
      let amounts = [1, 10, 15, 20]
      await instance.mintTeam(owner, ids, positions, amounts, {value: cardPrice})
      let retVal = await instance.ownedTokens(owner)
      assert.equal(retVal[0].toNumber(), 1, 'owner should own token id 1')
      assert.equal(retVal[1].toNumber(), 2, 'owner should own token id 2')
      assert.equal(retVal[2].toNumber(), 3, 'owner should own token id 3')
      assert.equal(retVal.length, 4, 'owner should own 4 unique footballers')
    })
  
  })

//     // "token owner should be able to transfer token to a non-zero address"
//     it('token owner should be able to transfer token to a non-zero address', async () => {
//       await contractInstance.safeTransferFrom(owner, user1, 1)
//       let ownerBalance = await contractInstance.balanceOf(owner)
//       let user1Balance = await contractInstance.balanceOf(user1)
//       let newTokenOwner = await contractInstance.ownerOf(1)
//       assert.equal(1, ownerBalance)
//       assert.equal(1, user1Balance)
//       assert.equal(user1, newTokenOwner)
//     })

//     // "user should not be able to transfer a token they don't own"
//     it('user should not be able to transfer a token they don\'t own', async () => {
//       await catchRevert(contractInstance.safeTransferFrom(user1, user2, 2))
//     })
})