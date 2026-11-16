# Chess Team Builder
[![Live Demo](https://img.shields.io/badge/demo-online-green)](https://wieringa.github.io/chess-team-builder/)

The Chess Team Builder distributes tournament participants into balanced teams by taking into account:
- **FIDE rating** (to ensure equal playing strength)  
- **nationality** (to promote international diversity)

The goal is to create teams that are as evenly matched as possible.

A manual with detailed insights of this app internals is available at the ([end of this readme](#manual)).

## Features
- Automatic team generation  
- Balanced distribution based on FIDE ratings  
- Mix of nationalities across teams  
- Simple and fast to use  

## Input
- The tool expects a list of players with:
 - Name or ID  
 - FIDE rating  
 - Nationality  

## Output
- Teams with evenly distributed playing strength  
- Clear overview of team compositions  

## How it works
1. Players are sorted by FIDE rating  
2. Players are distributed across teams  
3. Nationalities are balanced where possible  
4. The result is a set of evenly matched teams  

## Project structure
- /src        # core logic
- /data       # sample input files
- /docs       # additional documentation (optional)

## Configuration
- Optional parameters may include:
- Number of teams
- Weight of rating vs nationality balance

## Roadmap
 - Import from FIDE or tournament files
 - UI for manual adjustments
-  Export to tournament formats

## Contributing
- Contributions are welcome. Please open an issue or submit a pull request.

## License
- Public Domain Dedication

<br>
<br>

---


# Manual

This section rephrases the Chess Team Builder requirements in deeper technical aspects.


## 1. Purpose

The Chess Team Builder is designed for chess tournaments in which individual
players are combined into teams.

The application has two main purposes:
1. Create balanced teams before the tournament.
2. Produce team rankings and prize-giving lists during the tournament.

The Chess Team Builder does **not** replace the tournament pairing system.


## 2. Core Principles

The team-generation algorithm takes into account:
- FIDE rating
- Nationality

The priorities are:

**Rating balance is the primary criterion.**  
**Nationality diversity is a secondary criterion.**

The main objective is therefore to minimize differences in playing strength
between teams while promoting international diversity where possible.


## 3. Tournament Workflow

The complete workflow is:

**Team generation → Automatic**  
**Pairing → External**  
**Results + Buchholz → Import**  
**Ranking → Automatic**  
**Prize-giving list → Automatic**

### 3.1 Team Generation

Before the tournament, the Chess Team Builder automatically distributes
players into teams.

Default team size: 3 players per team

The application should attempt to create teams with comparable average
FIDE ratings.

Nationality diversity should be optimized where possible, but it must not
significantly compromise rating balance.

### 3.2 Pairing

Pairings are handled by an **external** chess pairing system.

The Chess Team Builder does not generate pairings.

This means that the arbiter remains free to use any suitable external
pairing system.

### 3.3 Results Import

After each round, tournament results are imported from the external pairing
system.

Imported data should include, where available:
- Player identification
- Player result
- Round number
- Opponent
- Score
- Buchholz score
- Other relevant tournament data

The import mechanism should be designed so that support for different
external pairing systems can be added later.

### 3.4 Ranking

After importing the results, the Chess Team Builder automatically calculates
the team standings.

Teams are sorted from highest to lowest result.

1. Primary ranking criterion: Team score
2. Tie-break: Buchholz score
3. Additional tie-break criteria may be added later if required.

### 3.5 Prize-giving

After each round, the application automatically generates a prize-giving
ranking.

The prize-giving overview should clearly display:
- Position
- Team name
- Team members
- Team score
- Buchholz score

The list must be sorted from highest to lowest ranking.


## 4. Player Input

Players can be entered manually or imported from a CSV file.

Each player requires:
- Name or player ID
- FIDE rating
- Nationality

Initially supported country codes:
- NL — Netherlands
- BE — Belgium
- DE — Germany

Example CSV:

```
Name,Rating,Country
Player One,1950,NL
Player Two,1820,BE
Player Three,1710,DE
```

The application should validate imported data and handle invalid or incomplete
records appropriately.


## 5. Team Generation

### 5.1 Team Size

Default: 3 players per team

The application calculates the maximum number of complete teams that can be
created.

Players who cannot be assigned to a complete team must be clearly reported.

Future versions should allow the team size to be configured.

### 5.2 Rating Balance

The application calculates:
- Total rating per team
- Average rating per team
- Highest team average
- Lowest team average
- Difference between highest and lowest team average

The objective is to minimize the difference between team averages.

### 5.3 Nationality Diversity

After rating balance, the algorithm should attempt to distribute
nationalities across the teams.

For the initial NL/BE/DE tournament setup, an ideal team consists of:
- 1 NL player
- 1 BE player
- 1 DE player

This is a preference rather than an absolute requirement.

A better rating balance takes priority over a perfect nationality mix.

### 5.4 Alternative Solutions

The application should support generating multiple valid team distributions.

Alternative solutions should be compared according to:
1. Rating balance
2. Nationality diversity

The best solution should be presented first.

The user should be able to inspect and select an alternative solution.


## 6. Team Output

For each generated team, the application should display:
- Team name/number
- Team members
- Player rating
- Player nationality
- Total team rating
- Average team rating

The application should also display an overall summary containing:
- Number of players
- Number of complete teams
- Number of players without a team
- Highest average team rating
- Lowest average team rating
- Rating difference between teams


## 7. Visualisation

The interface should provide useful visual feedback.

Current/planned visualisations include:
- Rating distribution by country
- Team average ratings
- Difference between strongest and weakest team

Visualisations should help the arbiter quickly identify whether the generated
teams are sufficiently balanced.


## 8. Tournament Results

After each round, results are imported from the external pairing system.

The application associates individual results with the previously generated
teams.

The application then automatically calculates the team results.

The exact method for converting individual player results into the team score
must be configurable or formally defined before implementation.


## 9. Buchholz Tie-break

Buchholz information is supplied by the external tournament/pairing system
as part of the imported results.

The Chess Team Builder uses Buchholz as a tie-break when teams have equal
scores.

General principle:

**Buchholz System:** The Buchholz score represents the combined performance
of the opponents faced. A higher Buchholz score indicates stronger opposition.

The Chess Team Builder should not duplicate calculations already reliably
performed by the external pairing system unless this becomes necessary later.


## 8. Tournament Results

After each round, results are imported from the external pairing system.

The application associates each individual player result with the player's team.

### Team Score

The team score is the sum of the individual scores of all team members.

Standard chess scoring applies:
- Win = 1 point
- Draw = 0.5 point
- Loss = 0 point

For a team of 3 players, the maximum team score per round is therefore 3 points.

Example:
- Player 1: 1 point
- Player 2: 0.5 point
- Player 3: 1 point

**Team score = 2.5 points**

After every round, the application automatically recalculates the cumulative
team score.

### Ranking

Teams are ranked by:
1. Highest cumulative team score
2. Highest Buchholz score in case of equal team scores

The ranking is automatically updated after every imported round and is used
to generate the prize-giving list.


## 9. Prize-giving List

After every round, the application automatically creates a current
prize-giving list.

The list is sorted:

1. Highest team score
2. Highest Buchholz score

The output should contain:

Position | Team | Team Members | Score | Buchholz

The prize-giving screen should be simple and readable so that it can be used
directly by the tournament organisation after each round.


## 10. Data Persistence

Player and team data should be retained locally so that refreshing the
browser does not immediately remove the tournament setup.

Current implementation: Browser localStorage

The application should provide a clear option to delete/reset tournament
data.


## 11. User Interface

The interface should remain simple enough to be operated during a tournament.

Main functions should include:
- Add player
- Import players
- Generate teams
- Generate alternative team solutions
- View rating distribution
- View teams
- Import round results
- View current ranking
- View prize-giving list
- Reset tournament data

Important tournament operations should require as few steps as reasonably
possible.


## 12. External Pairing Systems

The Chess Team Builder must remain independent of a specific pairing system
where reasonably possible.

Responsibilities are clearly separated:

### External Pairing System

Responsible for:
- Individual tournament pairings
- Individual game results
- Opponent information
- Buchholz data

### Chess Team Builder

Responsible for:
- Team generation
- Rating balance
- Nationality diversity
- Associating players with teams
- Processing imported results
- Team ranking
- Prize-giving lists


## 13. Project Structure

Current/target structure:

/frontend
  /src
    /components
    App.js
    App.css

/data
  Sample input and result files

/docs
  Requirements and additional documentation

README.md
  Project overview and installation/use instructions

## 14. Non-functional Requirements

The application should:
- Be easy to operate by an arbiter
- Work in a modern web browser
- Handle at least 300 players
- Support at least 100 teams
- Respond quickly when generating teams
- Clearly report invalid imported data
- Avoid losing tournament data accidentally
- Produce reproducible and understandable results where possible

## 15. Current Scope

Initial scope:
- Countries: NL, BE and DE
- Team size: 3
- Maximum players: 300
- Maximum teams: 100
- CSV player import
- Automatic team generation
- Rating balancing
- Nationality balancing
- Team rating visualisation
- External pairing
- Results/Buchholz import
- Automatic team ranking
- Automatic prize-giving list


## 16. Roadmap

### Team Generation

- Further improve the rating-balancing algorithm
- Generate multiple alternative solutions
- Compare alternatives using rating balance and nationality diversity
- Make nationality priority configurable
- Allow manual team adjustments

### Configuration

- Support additional nationalities
- Make team size configurable
- Make maximum player/team limits configurable

### Tournament Results

- Import results from external pairing systems
- Import Buchholz values
- Automatically calculate team results
- Automatically rank teams after every round
- Define additional tie-break rules where necessary

### Prize-giving

- Generate a prize-giving ranking after every round
- Provide a dedicated prize-giving screen
- Support printing/exporting the ranking

### Import / Export

- Improve CSV validation
- Support additional result-file formats
- Export generated teams to CSV
- Export rankings and prize-giving lists

### Visualisation
- Improve rating distribution charts
- Add team-average rating chart
- Highlight unusually strong or weak teams
- Clearly display the rating spread between teams


## 17. Priority Summary

The priorities of the application are:
1. **Balanced team strength**
2. **Nationality diversity**
3. **Reliable result import**
4. **Correct team ranking**
5. **Automatic prize-giving lists**
6. **Simple operation for the arbiter**

In short:

**Balanced teams before the tournament.  
External pairings during the tournament.  
Imported results and Buchholz after each round.  
Automatic rankings and prize-giving lists.**

---

Now, have fun and play chess !
