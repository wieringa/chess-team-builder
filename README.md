## Chess Team Builder
[![Live Demo](https://img.shields.io/badge/demo-online-green)](https://wieringa.github.io/chess-team-builder/)

The Chess Team Builder distributes tournament participants into balanced teams by taking into account:

- **FIDE rating** (to ensure equal playing strength)  
- **nationality** (to promote international diversity)

The goal is to create teams that are as evenly matched as possible.



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
