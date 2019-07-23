var express = require('express')
var router = express.Router()
var db = require('../../data')
const gameweeks = require('../../data/gameweeks.js')

// retrieve all gameweeks
router.get('/', (req, res) => res.json(gameweeks));

// retrive a single gameweek
router.get('/:id', (req, res) => {
  const found = gameweeks.some(gameweek => gameweek.id === parseInt(req.params.id));

  if (found) {
    res.json(members.filter(gameweek => gameweek.id === parseInt(req.params.id)));
  } else {
    res.status(400).send({ msg: `No gameweek with the id of ${req.params.id}` });
  }
});

// retrive live gameweek info
router.get('/live/1', (req, res) => {
  const found = gameweeks.some(gameweek => gameweek.is_live === 1);

  if (found) {
    res.send(gameweeks.filter(gameweek => gameweek.is_live === 1));
  } else {
    res.status(400).send({ msg: `No live gameweek infomation` });
  }
});

module.exports = router