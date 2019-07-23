var express = require('express')
var router = express.Router()
var db = require('../../data')
const footballers = require('../../data/footballers.js')

// retrieve all footballers
router.get('/', (req, res) => res.send(footballers));

// retrive a single footballer
router.get('/:id', (req, res) => {
  const found = footballers.some(footballer => footballer.player_id === parseInt(req.params.id));

  if (found) {
    res.send(footballers.filter(footballer => footballer.player_id === parseInt(req.params.id)));
  } else {
    res.status(400).json({ msg: `No footballer with the id of ${req.params.id}` });
  }
});

// retrieve footballers of a certain position
router.get('/position/:position', (req, res) => {
  const found = footballers.some(footballer => footballer.position === parseInt(req.params.position));

  if (found) {
    res.send(footballers.filter(footballer => footballer.position === parseInt(req.params.position)));
  } else {
    res.status(400).json({ msg: `No footballer with position ${req.params.id} found` });
  }
});

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


module.exports = router