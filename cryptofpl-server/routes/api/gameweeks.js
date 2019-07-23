var express = require('express')
var router = express.Router()
var db = require('../../data')

//returns all gameweek metadata
router.get('', (req, res) => {
  db.select().from('gameweeks').orderBy('id').then((data) => {
    res.send(data)
  }).catch((err) => {
    console.log(err)
    res.send(err)
  })
})

//returns data for a specific gameweek
router.get('/:id', (req, res) => {
  db.select().from('gameweeks').where({id: req.params.id}).limit(1).then((data) => {
    res.send(data)
  }).catch((err) => {
    console.log(err)
    res.send(err)
  })
})

//returns data for current gameweek
router.get('/live/1', (req, res) => {
  db.select().from('gameweeks').where({is_live: 1}).then((data) => {
    res.send(data)
  }).catch((err) => {
    console.log(err)
    res.send(err)
  })
})

//returns data for next gameweek
router.get('/next/1', (req, res) => {
  db.select().from('gameweeks').where({is_next: 1}).then((data) => {
    res.send(data)
  }).catch((err) => {
    console.log(err)
    res.send(err)
  })
})

//returns deadline UNIX timestamp for a specific gameweek
router.get('/:id/deadline', (req, res) => {
  db.select().from('gameweeks').where({id: req.params.id}).limit(1).then((data) => {
    res.send(200, data[0].deadline_time_epoch)
  }).catch((err) => {
    console.log(err)
    res.send(err)
  })
})

module.exports = router