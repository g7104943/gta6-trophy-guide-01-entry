# gta6-trophy-guide-01-entry

[![make.fun badge](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/g7104943/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/g7104943/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 Grand Theft Auto VI PlayStation 5 trophies: official names, descriptions and grades, a cited guide for every trophy in our own words, a seven-stage roadmap to the platinum, missable flags (exactly one trophy is flagged potentially missable), a checklist saved in the browser with export/import, filters by kind and grade, and a spoiler setting that hides story trophies until earned. No online trophies — all 55 are single-player.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. The app is plain static files under `app/` with no build step and makes no network requests at run time.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Built for the [make.fun](https://make.fun/bounty/gta6-trophy-guide-01) GTA 6 trophy guide bounty.
