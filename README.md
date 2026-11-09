# cylinder phonograph

An Edison wax-cylinder phonograph, simulated "from the groove up" in the browser: **[cylinder-phonograph.vercel.app](https://cylinder-phonograph.vercel.app)**.

Sound is cut as a groove of depths into a [wax cylinder](https://en.wikipedia.org/wiki/Phonograph_cylinder). A 70 µm sapphire ball rides the groove. A glass diaphragm and a horn turn its motion into sound. No recording of a real phonograph is used.

This is a _physical simulation_ of a phonograph's mechanics, which happen to play sound.

## Features

- **Procedural flaws**: Hiss is the grain of the wax. Dust is bumps in the groove. A scratch clicks once per turn because the ball crosses it once per turn.
- **Real physics, in real time**: The ball rests on the groove walls. It can't enter dips smaller than itself. It leaves the groove when its weight can't pull it down fast enough. A [governor](https://en.wikipedia.org/wiki/Centrifugal_governor) holds 160 rpm. The spring lasts 1,100 turns. [Wow and flutter](https://en.wikipedia.org/wiki/Wow_and_flutter_measurement) grow as it runs down.
- **Cut your own**: Record from the microphone or drop an audio file. Long files are trimmed or cut slower, down to 120 rpm. Your cylinders stay in the browser.
- **What you see is what you hear**: Zoom until one groove fills the screen. The GPU draws the same array the ball reads.
- **Sound in space**: The horn is the source. The camera is your head ([HRTF](https://en.wikipedia.org/wiki/Head-related_transfer_function)). Off the horn's axis, the sound gets quieter and duller.
- **No dependencies, no bundler**: Plain ES modules, WebGL2 and Web Audio. The build copies files.

## Running it

```bash
$ npm run dev
```

Open [localhost:8000](http://localhost:8000). Edit, then reload. [`dev.mjs`](dev.mjs) serves the repository as is.

Nothing to install. Node 22+ runs the server, the build and the tests:

```bash
$ npm run build   # dist/: index.html, og.png, src/
$ npm test        # offline checks of the physics
```

In the page, the help button opens a tour. The book opens the docs. URL options for testing: `?view=stylus`, `?tour=5`, `?docs`, `?play`, `?t=30` (seconds), `?cyl=blank`, `?fixed`.

## How it works

One loop runs 48,000 times a second ([`src/audio.js`](src/audio.js)). The clockwork says where the ball is. Recording writes a depth there. Playback reads it back.

**1️⃣ Turn.** The clockwork ([`src/mechanics.js`](src/mechanics.js)) spins the mandrel. A feed screw with 100 threads per inch moves the carriage one groove per turn. So a position is just "turns since the start".

**2️⃣ Cut.** The recorder ([`src/acoustics.js`](src/acoustics.js), [`src/cut.js`](src/cut.js)) is a chain of [biquad filters](https://en.wikipedia.org/wiki/Digital_biquad_filter). The horn drops the bass and adds a 2.45 ms echo. The diaphragm rings at 2.3 kHz. Soft clipping keeps the cut within ±44 µm.

**3️⃣ Keep.** The record is an array ([`src/groove.js`](src/groove.js)): 4,096 × 371 depths in micrometres. The GPU draws it. The ball plays it. IndexedDB stores your recordings ([`src/storage.js`](src/storage.js)).

**4️⃣ Play.** The reproducer ([`src/contact.js`](src/contact.js), [`src/acoustics.js`](src/acoustics.js)) reads the groove with the ball. Small dips are skipped ([dilation](https://en.wikipedia.org/wiki/Dilation_(morphology))). Steep drops make it fly and buzz. You hear its velocity, filtered by the diaphragm, the wooden box and a small room.

**5️⃣ Draw.** The machine ([`src/scene.js`](src/scene.js), [`src/render.js`](src/render.js), [`src/shaders.js`](src/shaders.js)) is built in code from lathes and sweeps ([`src/mesh.js`](src/mesh.js)). Close up, the depths displace a fine mesh. Far away, each groove shows its average depth. Light is physically based: GGX, clear-coat wax, shadows, ambient occlusion, bloom, AgX.

The in-app docs draw their figures from these functions ([`src/figures.js`](src/figures.js)).

## The cylinder

The built-in cylinder plays _In the Hall of the Mountain King_. The notes come from Grieg's piano arrangement ([`src/scores.js`](src/scores.js)). The score is read as text, never run. A wavetable piano plays it ([`src/music.js`](src/music.js)). It is cut like your recordings, then worn with a fixed seed ([`src/cylinders.js`](src/cylinders.js)).

## Credits

- Music: Edvard Grieg, _In the Hall of the Mountain King_, Op. 46 No. 4. [Mutopia Project](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1888) edition by Coyau, public domain.
- Filters from Robert Bristow-Johnson's [Audio EQ Cookbook](https://www.w3.org/TR/audio-eq-cookbook/). Reverb after Manfred Schroeder. AgX tone mapping by Troy Sobotka.
- Type: Cormorant Garamond and IBM Plex Mono.
- Inspired by [vinyl](https://github.com/rauchg/vinyl) by Guillermo Rauch.

## License

The code is [MIT](LICENSE). The score is public domain.
