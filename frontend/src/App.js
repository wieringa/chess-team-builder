import React, { useEffect, useState } from "react";
import "./App.css";

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
    strong: sorted.slice(0, Math.min(teamCount, sorted.length)),
    medium: sorted.slice(
      Math.min(teamCount, sorted.length),
      Math.min(teamCount * 2, sorted.length)
    ),
    weak: sorted.slice(Math.min(teamCount * 2, sorted.length)),
  };
}

function App() {
  const [name, setName] = useState("");
  const [rating, setRating] = useState("");
  const [country, setCountry] = useState("NL");
  const [message, setMessage] = useState("");

  const [players, setPlayers] = useState(() => {
    const saved = safeParse("chess_players", []);
    return Array.isArray(saved) ? saved : [];
  });

  const [teams, setTeams] = useState(() => {
    const saved = safeParse("chess_teams", []);
    return Array.isArray(saved) ? saved : [];
  });

  useEffect(() => {
    localStorage.setItem("chess_players", JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem("chess_teams", JSON.stringify(teams));
  }, [teams]);

  const addPlayer = () => {
    if (!name.trim() || !rating) {
      setMessage("Naam en rating zijn verplicht.");
      return;
    }

    if (players.length >= MAX_PLAYERS) {
      setMessage(`Maximum bereikt: ${MAX_PLAYERS} spelers.`);
      return;
    }

    const parsedRating = Number(rating);

    if (Number.isNaN(parsedRating)) {
      setMessage("Rating moet een getal zijn.");
      return;
    }

    const newPlayer = {
      id: Date.now(),
      name: name.trim(),
      rating: parsedRating,
      country,
    };

    setPlayers([...players, newPlayer]);
    setName("");
    setRating("");
    setCountry("NL");
    setTeams([]);
    setMessage("Speler toegevoegd.");
  };

  const removePlayer = (id) => {
    setPlayers(players.filter((player) => player.id !== id));
    setTeams([]);
    setMessage("Speler verwijderd.");
  };

  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

      const importedPlayers = lines
        .slice(1)
        .map((line, index) => {
          const [csvName, csvRating, csvCountry] = line.split(",");

          if (!csvName || !csvRating || !csvCountry) return null;

          const parsedRating = Number(csvRating.trim());
          const parsedCountry = csvCountry.trim().toUpperCase();

          if (Number.isNaN(parsedRating)) return null;
          if (!["NL", "BE", "DE"].includes(parsedCountry)) return null;

          return {
            id: Date.now() + index,
            name: csvName.trim(),
            rating: parsedRating,
            country: parsedCountry,
          };
        })
        .filter(Boolean);

      const allowed = MAX_PLAYERS - players.length;
      const limitedPlayers = importedPlayers.slice(0, allowed);

      setPlayers([...players, ...limitedPlayers]);
      setTeams([]);

      if (limitedPlayers.length < importedPlayers.length) {
        setMessage(
          `Niet alle CSV-spelers geïmporteerd. Maximum is ${MAX_PLAYERS} spelers.`
        );
      } else {
        setMessage(`${limitedPlayers.length} spelers geïmporteerd.`);
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  const generateTeamName = (index) => `Team ${index + 1}`;

  const buildTeams = () => {
    if (players.length < TEAM_SIZE) {
      setMessage("Minstens 3 spelers nodig.");
      return;
    }

    const teamCount = Math.min(Math.floor(players.length / TEAM_SIZE), MAX_TEAMS);

    if (teamCount === 0) {
      setMessage("Geen volledige teams mogelijk.");
      return;
    }

    const usablePlayers = [...players]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, teamCount * TEAM_SIZE);

    const nlPlayers = usablePlayers.filter((p) => p.country === "NL");
    const bePlayers = usablePlayers.filter((p) => p.country === "BE");
    const dePlayers = usablePlayers.filter((p) => p.country === "DE");

    const nl = splitIntoTiers(nlPlayers, teamCount);
    const be = splitIntoTiers(bePlayers, teamCount);
    const de = splitIntoTiers(dePlayers, teamCount);

    const allRemaining = [...usablePlayers];

    const createdTeams = Array.from({ length: teamCount }, (_, index) => ({
      name: generateTeamName(index),
      players: [],
      totalRating: 0,
      averageRating: 0,
      countries: [],
    }));

    const removeFromList = (list, player) => {
      const idx = list.findIndex((p) => p.id === player.id);
      if (idx !== -1) list.splice(idx, 1);
    };

    const removeEverywhere = (player) => {
      [
        nl.strong, nl.medium, nl.weak,
        be.strong, be.medium, be.weak,
        de.strong, de.medium, de.weak,
        allRemaining,
      ].forEach((list) => removeFromList(list, player));
    };

    const addToTeam = (team, player) => {
      if (!player || team.players.length >= TEAM_SIZE) return;

      team.players.push(player);
      team.totalRating += player.rating;
      team.countries.push(player.country);
      removeEverywhere(player);
    };

    const sortTeamsByWeakest = () => {
      createdTeams.sort((a, b) => {
        if (a.players.length !== b.players.length) {
          return a.players.length - b.players.length;
        }
        return a.totalRating - b.totalRating;
      });
    };

    const pickFromTier = (tier, team) => {
      if (!tier.length) return null;

      const preferred = tier.find(
        (player) => !team.countries.includes(player.country)
      );

      return preferred || tier[0];
    };

    // Fase 1: probeer eerst echte gemengde teams te maken met gespreide sterkte
    for (let i = 0; i < teamCount; i++) {
      sortTeamsByWeakest();
      const team = createdTeams[0];

      const nlPick = pickFromTier(
        i % 3 === 0 ? nl.strong : i % 3 === 1 ? nl.medium : nl.weak,
        team
      );
      if (nlPick) addToTeam(team, nlPick);

      const bePick = pickFromTier(
        i % 3 === 0 ? be.medium : i % 3 === 1 ? be.weak : be.strong,
        team
      );
      if (bePick) addToTeam(team, bePick);

      const dePick = pickFromTier(
        i % 3 === 0 ? de.weak : i % 3 === 1 ? de.strong : de.medium,
        team
      );
      if (dePick) addToTeam(team, dePick);
    }

    // Fase 2: vul onvolledige teams op met beste resterende spelers
    while (allRemaining.length > 0) {
      sortTeamsByWeakest();

      const targetTeam = createdTeams.find((team) => team.players.length < TEAM_SIZE);
      if (!targetTeam) break;

      const sortedRemaining = [...allRemaining].sort((a, b) => b.rating - a.rating);

      const preferred = sortedRemaining.find(
        (player) => !targetTeam.countries.includes(player.country)
      );

      addToTeam(targetTeam, preferred || sortedRemaining[0]);
    }

    createdTeams.forEach((team) => {
      team.averageRating =
        team.players.length > 0
          ? Math.round(team.totalRating / team.players.length)
          : 0;
    });

    const leftovers = players.length - usablePlayers.length;

    const fullyMixed = createdTeams.filter((team) => {
      const uniqueCountries = new Set(team.countries);
      return (
        uniqueCountries.has("NL") &&
        uniqueCountries.has("BE") &&
        uniqueCountries.has("DE")
      );
    }).length;

    let msg = `${createdTeams.length} teams gemaakt. ${fullyMixed} team(s) hebben NL + BE + DE mix.`;

    if (leftovers > 0) {
      msg += ` ${leftovers} speler(s) zonder team.`;
    }

    setTeams(createdTeams);
    setMessage(msg);
  };

  const clearAllData = () => {
    setPlayers([]);
    setTeams([]);
    localStorage.removeItem("chess_players");
    localStorage.removeItem("chess_teams");
    setMessage("Alle data gewist.");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      addPlayer();
    }
  };

  const possibleTeams = Math.min(
    Math.floor(players.length / TEAM_SIZE),
    MAX_TEAMS
  );

  const remainingPlayers = players.length % TEAM_SIZE;

  return (
    <div className="app">
      <div className="container">
        <h1>Chess Team Builder</h1>
        <p className="subtitle">
          Tot {MAX_PLAYERS} spelers, automatisch max {MAX_TEAMS} teams van{" "}
          {TEAM_SIZE}.
        </p>

        <div className="card">
          <h2>Overzicht</h2>
          <p><strong>Aantal spelers:</strong> {players.length}</p>
          <p><strong>Mogelijke teams:</strong> {possibleTeams}</p>
          <p><strong>Spelers zonder team:</strong> {remainingPlayers}</p>
        </div>

        <div className="card">
          <h2>Speler toevoegen</h2>

          <div className="form-row">
            <input
              type="text"
              placeholder="Naam speler"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <input
              type="number"
              placeholder="Rating"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="NL">NL</option>
              <option value="BE">BE</option>
              <option value="DE">DE</option>
            </select>

            <button onClick={addPlayer}>Toevoegen</button>
            <button className="secondary" onClick={buildTeams}>
              Genereer teams
            </button>
            <button className="danger" onClick={clearAllData}>
              Wis alles
            </button>
          </div>

          <div className="form-row" style={{ marginTop: "16px" }}>
            <input type="file" accept=".csv" onChange={handleCsvUpload} />
          </div>

          <p className="muted" style={{ marginTop: "12px" }}>
            CSV formaat: <strong>name,rating,country</strong>
          </p>

          {message && (
            <p className="muted" style={{ marginTop: "12px" }}>
              <strong>{message}</strong>
            </p>
          )}
        </div>

        <div className="card">
          <h2>Spelerslijst</h2>

          {players.length === 0 ? (
            <p>Er zijn nog geen spelers toegevoegd.</p>
          ) : (
            <div className="player-list">
              {players
                .slice()
                .sort((a, b) => b.rating - a.rating)
                .map((player) => (
                  <div className="player-item" key={player.id}>
                    <div>
                      <strong>{player.name}</strong>
                      <div className="muted">
                        Rating: {player.rating} | Land: {player.country}
                      </div>
                    </div>

                    <button
                      className="danger"
                      onClick={() => removePlayer(player.id)}
                    >
                      Verwijderen
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {teams.length > 0 && (
          <div className="teams-grid">
            {teams.map((team) => (
              <div className="card team-card" key={team.name}>
                <h2>{team.name}</h2>

                <p>
                  <strong>Totaal rating:</strong> {team.totalRating}
                </p>

                <p>
                  <strong>Gemiddelde rating:</strong> {team.averageRating}
                </p>

                <p>
                  <strong>Landen:</strong>{" "}
                  {team.countries && team.countries.length > 0
                    ? team.countries.join(", ")
                    : "-"}
                </p>

                <div className="team-list">
                  {(team.players || []).map((player) => (
                    <div className="team-player" key={player.id}>
                      <span>
                        {player.name} ({player.country})
                      </span>
                      <strong>{player.rating}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
