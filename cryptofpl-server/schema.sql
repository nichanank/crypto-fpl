CREATE TABLE footballers (
    id serial PRIMARY KEY,
    player_id INT NOT NULL,
    first_name VARCHAR(200) NOT NULL,
    second_name VARCHAR(200) NOT NULL,
    position INT NOT NULL,
    team INT NOT NULL,
    img VARCHAR(200) NOT NULL,
    minted_count INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE gameweeks (
    id serial PRIMARY KEY,
    deadline_time VARCHAR(200) NOT NULL,
    finished BOOLEAN NOT NULL,
    data_checked BOOLEAN NOT NULL,
    highest_scoring_entry INT,
    deadline_time_epoch INT
);