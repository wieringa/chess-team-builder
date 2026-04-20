module.exports = function(players) {
  return [
    {
      name: "Team A",
      players: players.slice(0, Math.ceil(players.length / 2))
    },
    {
      name: "Team B",
      players: players.slice(Math.ceil(players.length / 2))
    }
  ];
};