const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const connection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("connected Successfully");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

connection();

let convertPlayer = (object) => {
  return {
    playerId: object.player_id,
    playerName: object.player_name,
  };
};

let convertMatch = (object) => {
  return {
    matchId: object.match_id,
    match: object.match,
    year: object.year,
  };
};

let convertScore = (object) => {
  return {};
};

//GET players
app.get("/players/", async (request, response) => {
  const playersQuery = `SELECT * FROM player_details`;
  const playerDetails = await db.all(playersQuery);
  response.send(playerDetails.map((eachPlayer) => convertPlayer(eachPlayer)));
});

//GET player
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `SELECT * FROM player_details
    WHERE player_id = ${playerId};`;

  const player = await db.get(playerQuery);
  response.send(convertPlayer(player));
});

//UPDATE details
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const newPlayer = request.body;
  const { playerName } = newPlayer;
  const updateQuery = `UPDATE player_details 
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId};`;

  const playerAdded = await db.run(updateQuery);
  response.send("Player Details Updated");
});

//GET match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const matchDetails = await db.get(getMatchQuery);
  response.send(convertMatch(matchDetails));
});

//GET matchDetails
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const matchDetailsQuery = `SELECT * FROM match_details INNER JOIN player_match_score ON match_details.match_id = player_match_score.match_id
    WHERE player_id = ${playerId};`;

  const matchesArray = await db.all(matchDetailsQuery);
  response.send(matchesArray.map((match) => convertMatch(match)));
});

//GET Players
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerDetails = `SELECT * FROM player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
    WHERE match_id = ${matchId};`;

  const players = await db.all(getPlayerDetails);
  response.send(players.map((eachPlayer) => convertPlayer(eachPlayer)));
});

//GET Match
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `SELECT player_details.player_id AS playerId,player_details.player_name AS playerName,SUM(player_match_score.score) AS totalScore,SUM(fours) AS totalFours,SUM(sixes) AS totalSixes
   FROM player_details INNER JOIN player_match_score ON  player_details.player_id = player_match_score.player_id 
   WHERE player_details.player_id = ${playerId};`;
  const matchscoreDetails = await db.get(getPlayersQuery);
  response.send(matchscoreDetails);
});

module.exports = app;
