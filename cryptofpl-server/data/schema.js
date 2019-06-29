module.exports = {
  footballers: {
    id: {type: 'int', maxlength: 200, nullable: false, primary: true},
    player_id: {type: 'int', maxlength: 200, nullable: false, unique: true},
    first_name: {type: 'string', maxlength: 200, nullable: false, unique: false},
    second_name: {type: 'string', maxlength: 200, nullable: false, unique: false},
    position: {type: 'int', maxlength: 150, nullable: false},
    team: {type: 'int', maxlength: 150, nullable: false},
    img: {type: 'string', maxlength: 20, nullable: false},
    minted_count: {type: 'int', maxlength: 150, nullable: false},
    created_at: {type: 'dateTime', nullable: false},
  },
}