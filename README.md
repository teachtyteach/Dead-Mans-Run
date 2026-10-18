# Dead Man's Run

A Texas Hold'em roguelite set in the Old West. Ride through eight saloons, bust each boss at the table, and collect charms, tricks and deeds along the way.

**Play:** https://teachtyteach.github.io/dead-mans-run/ — on iPhone open it in Safari, then Share → Add to Home Screen. It works offline after the first load.

## How it's built

Everything is plain HTML, CSS and JavaScript with no dependencies.

| Path | What's there |
|---|---|
| `src/data.js` | Bosses, charms, tricks, deeds, curses, towns, chapter handwriting glyphs |
| `src/engine.js` | Poker engine: hand evaluation, betting, side pots, AI, run state. No DOM, so it can be tested in Node |
| `src/portrait.js` | Procedural SVG portraits for every character |
| `src/audio.js` | Web Audio: menu song, boss songs, saloon ambience, sound effects |
| `src/ui.js` | Screens, table rendering, effects, the opening sequence |
| `src/style.css`, `src/body.html`, `src/head.html` | Look and markup |
| `audio/` | Sound files, fetched at runtime |
| `tools/` | Engine test, the Python scripts that synthesised the original sounds, handwriting/portrait helpers |

## Build

```
python3 build.py          # writes index.html
node --check d.js         # syntax check
node tools/test_engine.js # simulates 400 tables and checks chips are conserved
```

Open `index.html` through a local server (`python3 -m http.server`) so the audio files can load.

## Audio credits

Music and field recordings are from Epidemic Sound and used under the owner's Epidemic Sound license:
Tumbleweed – Roots and Recognition (menu); Johan Glossner – Loner on a Cliff, Days Gone By, Under the Dark Sky, Past Present and Future;
Roy Edwin Williams – Shootout; Sunset Rider – Speedy The Spider; Northside – Desert Storm; River Foxcroft – Dark Outlands;
Epidemic Sound ambience and revolver recordings. Other sound effects and the saloon piano were synthesised for this game.
These files are not licensed for reuse outside this game.

## Run it on iPhone (offline, no hosting)

1. Install **a-Shell** (free, App Store).
2. Download this repo as a ZIP (GitHub → Code → Download ZIP) and unzip it in the Files app, e.g. into *On My iPhone → a-Shell*.
3. In a-Shell: `cd` into the folder, then run `python3 -m http.server 8000`.
4. In Safari open `http://localhost:8000`, let it load once, then Share → **Add to Home Screen**.
5. Launch it from the home screen icon. After the first load everything is cached, so it plays full screen and offline even when a-Shell isn't running.
