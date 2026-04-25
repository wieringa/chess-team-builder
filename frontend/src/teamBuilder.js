export function createTeams(players) {

    function shuffle(array) {
        return array.sort(() => Math.random() - 0.5);
    }

    function avg(team) {
        return team.reduce((s, p) => s + p.rating, 0) / team.length;
    }

    let bestSolution = null;
    let bestScore = Infinity;

    for (let attempt = 0; attempt < 1000; attempt++) {

        let shuffled = shuffle([...players]);

        let groups = {
            NED: shuffled.filter(p => p.nationality === "NED"),
            GER: shuffled.filter(p => p.nationality === "GER"),
            BEL: shuffled.filter(p => p.nationality === "BEL")
        };

        let teams = [];

        while (groups.NED.length && groups.GER.length && groups.BEL.length) {
            teams.push([
                groups.NED.pop(),
                groups.GER.pop(),
                groups.BEL.pop()
            ]);
        }

        if (teams.length === 0) continue;

        let avgs = teams.map(avg);
        let diff = Math.max(...avgs) - Math.min(...avgs);

        let score = diff;

        if (score < bestScore) {
            bestScore = score;
            bestSolution = teams;
        }
    }

    return bestSolution;
}
