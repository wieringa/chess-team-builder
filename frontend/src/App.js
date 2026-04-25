import React, { useEffect, useState } from "react";
import "./App.css";
import RatingChart from "./components/RatingChart";

const TEAM_SIZE = 3;
const MAX_PLAYERS = 300;
const MAX_TEAMS = 100;

function safeParse(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function splitIntoTiers(players, teamCount) {
  const sorted = [...players].sort((a, b) => b.rating - a.rating);

  return {
    strong: sorted.slice(0, teamCount),
    medium: sorted.slice(teamCount, teamCount * 2),
    weak: sorted.slice(teamCount * 2),
  };
}

function calculateTeamDiff(teams) {
  if (!teams || teams.length === 0) return 0;
  const avgs = teams.map((t) => t.averageRating);
  return Math.max(...avgs) - Math.min(...avgs);
}

function App() {
  const [players, setPlayers] = useState(() =>
    safeParse("chess_players", [])
  );
 const clearAllData = () => {
  setPlayers([]);
  setTeams([]);
  setMessage("Alle data gewist.");

  localStorage.removeItem("chess_players");
};
  const handleCsvUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    const text = e.target.result;

    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");

    const importedPlayers = lines
      .slice(1)
      .map((line, index) => {
        const [name, rating, country] = line.split(",");

        if (!name || !rating || !country) return null;

        return {
          id: Date.now() + index,
          name: name.trim(),
          rating: Number(rating.trim()),
          country: country.trim().toUpperCase(),
        };
      })
      .filter(Boolean);

    setPlayers(prev => [...prev, ...importedPlayers]);
  };

  reader.readAsText(file);
};
  const [teams, setTeams] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    localStorage.setItem("chess_players", JSON.stringify(players));
  }, [players]);

  const addPlayer = () => {
    const newPlayer = {
      id: Date.now(),
      name: "Test",
      rating: Math.floor(Math.random() * 1000) + 1300,
      country: ["NL", "BE", "DE"][Math.floor(Math.random() * 3)],
    };

    setPlayers([...players, newPlayer]);
  };

  const buildTeams = () => {
    if (players.length < TEAM_SIZE) {
      setMessage("Minstens 3 spelers nodig.");
      return;
    }

    const teamCount = Math.floor(players.length / TEAM_SIZE);

    const usable = [...players]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, teamCount * TEAM_SIZE);

    const created = Array.from({ length: teamCount }, (_, i) => ({
      name: `Team ${i + 1}`,
      players: [],
      totalRating: 0,
      averageRating: 0,
    }));

usable.forEach((p) => {
  // 🔥 sorteer teams: zwakste eerst
  created.sort((a, b) => a.totalRating - b.totalRating);

  // 🔥 pak het zwakste team dat nog plek heeft
  const team = created.find(t => t.players.length < TEAM_SIZE);

  if (!team) return;

  team.players.push(p);
  team.totalRating += p.rating;
});

    created.forEach((t) => {
      t.averageRating = Math.round(t.totalRating / t.players.length);
    });
// 🔥 sorteer teams op gemiddelde rating (laag → hoog)
created.sort((a, b) => a.averageRating - b.averageRating);
    setTeams(created);
    setMessage("Teams gemaakt");
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Chess Team Builder</h1>

        <div className="card">
          <h2>Overzicht</h2>
          <p><strong>Aantal spelers:</strong> {players.length}</p>
          <p><strong>Teams:</strong> {teams.length}</p>
          <p><strong>Verschil:</strong> {Math.round(calculateTeamDiff(teams))}</p>
        </div>

        <div className="card">
  <button onClick={addPlayer}>+ Speler toevoegen</button>
  <button onClick={buildTeams}>Genereer teams</button>
<button className="danger" onClick={clearAllData}>
  Wis alles
</button>
  {/* 🔥 CSV upload terug */}
  <div style={{ marginTop: "10px" }}>
    <input type="file" accept=".csv" onChange={handleCsvUpload} />
  </div>
</div>

        {/* ✅ HIER STAAT JE GRAFIEK */}
        <div className="card">
          <h2>Rating distributie per land</h2>
          <RatingChart players={players} />
        </div>

        <div className="card">
          <h2>Spelerslijst</h2>
          {players.map((p) => (
            <div key={p.id}>
              {p.name} - {p.rating} ({p.country})
            </div>
          ))}
        </div>

        {teams.length > 0 && (
          <div className="card">
            <h2>Teams</h2>
            {teams.map((t) => (
              <div key={t.name}>
                <h3>
  {t.name} (gemiddelde: {t.averageRating})
</h3>
                {t.players.map((p) => (
                  <div key={p.id}>{p.name} ({p.rating})</div>
                ))}
              </div>
            ))}
          </div>
        )}

        <p>{message}</p>
      </div>
    </div>
  );
}

export default App;