var express = require('express')
var router = express.Router()
var db = require('../../data')

//returns all footballer metadata
router.get('/all', (req, res) => {
  db.select().from('footballers').orderByRaw('RAND()').then((data) => {
    res.send(data)
  }).catch((err) => {
    console.log(err)
    res.send(err)
  })
})

//returns footballer with corresponding id
router.get('/:id', (req, res) => {
  db.select().from('footballers').where({player_id: req.params.id}).limit(1).then((data) => {
    res.send(data)
  }).catch((err) => {
    console.log(err)
    res.send(err)
  })
})

//returns footballers with corresponding position
router.get('/position/:position', (req, res) => {
  db.select().from('footballers').where({position: req.params.position}).then((data) => {
    res.send(data)
  }).catch((err) => {
    console.log(err)
    res.send(err)
  })
})

//increments the number of cards minted for a given footballer
router.put('/:id/minted', (req, res) => {
  db('footballers').where('id', req.params.id)
  .increment('minted_count', 1)
  .then(() => {
    console.log("incremented successfully")
  }).catch((err) => {
    console.log(err)
    res.send(err)
  })
})

//returns the number of players in the LAST footballers database
router.get('/count', (req, res) => {
  db('footballers').count('id').then((data) => {
    res.send(data)
  }).catch((err) => {
    console.log(err)
    res.send(err)
  })
})

//DEVELOPMENT PURPOSES: resets minted_count to 0
router.put('/reset', (req, res) => {
  console.log('reset clicked')
  db('footballers')
  .update({minted_count: 0})
  .then(() => {
    console.log('minted_count data reset successful')
  }).catch((err) => {
    console.log(err)
    // res.send(err)
  })
})

module.exports = router