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