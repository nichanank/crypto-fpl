var express = require('express')
var router = express.Router()
var db = require('../../data')
const scores = require('../../data/scores.js')

// retrieve all available scores
router.get('/', (req, res) => res.send(scores));

// retrive scores for a single footballer
router.get('/:id', (req, res) => {
  const found = scores.some(score => score.id === parseInt(req.params.id));

  if (found) {
    res.send(scores.filter(score => score.id === parseInt(req.params.id)));
  } else {
    res.status(400).json({ msg: `No footballer with the id of ${req.params.id}` });
  }
});

module.exports = router