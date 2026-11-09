# cylinder phonograph

An Edison wax-cylinder phonograph simulated "from the groove up" in the browser: **[cylinder-phonograph.vercel.app](https://cylinder-phonograph.vercel.app)**.

Instead of playing an audio file, the sound is cut as a groove of depths into a spinning [wax cylinder](https://en.wikipedia.org/wiki/Phonograph_cylinder), and a 70 µm sapphire ball rides it back through a glass diaphragm and a horn. Nothing is sampled from a real phonograph: what you hear is how fast that ball moves, after the chain of an [acoustic-era](https://en.wikipedia.org/wiki/Acoustic_recording) machine.

This is a _physical simulation_ of a phonograph's mechanics, which happen to play sound.

## Features

- **"Real", procedural flaws**: hiss is the grain of the wax, cut into the groove along with the sound. Dust is bumps in the depth table, and a scratch clicks once per turn because the ball crosses it once per turn. A cylinder's groove passes the stylus at the same speed from start to end, so nothing dulls toward the end, until the spring runs down and the pitch sags.
- **Real physics, in real time**: a ball of finite radius in a parabolic cut (it can't reach the floor of a deep cut, nor enter a dip smaller than itself), a stylus that leaves the groove when its floating weight can't pull it down fast enough, a [governor](https://en.wikipedia.org/wiki/Centrifugal_governor) easing toward 160 rpm, a spring that lasts 1,100 turns, and [wow and flutter](https://en.wikipedia.org/wiki/Wow_and_flutter_measurement) that grow as it runs out. 48,000 steps a second.
- **Cut your own**: record from the microphone, or drop an audio file on a blank. A file longer than the cylinder is trimmed, or cut slower, down to 120 rpm, as early cylinders were. Your cylinders stay in the browser.
- **What you see is what you hear**: zoom until one groove fills the screen. The GPU draws the same array the ball reads.
- **Sound in space**: the horn is the source and the camera is your head ([HRTF](https://en.wikipedia.org/wiki/Head-related_transfer_function)). Walk around the horn and it gets quieter and duller.
- **No dependencies, no bundler**: plain ES modules, WebGL2 and Web Audio. The build copies files.

## Running it

```bash
$ npm run dev
```

That's it. [`dev.mjs`](dev.mjs) serves the repository as is on [localhost:8000](http://localhost:8000): ES modules don't load from `file://`, and the microphone needs `localhost` or HTTPS. Edit, then reload.

There's nothing to install. Node 22+ is enough for the server, the build and the tests:

```bash
$ npm run build   # dist/: index.html, src/
$ npm test        # offline checks of the physics: horn and diaphragm response, clipping, velocity pickup, stylus flight, ball contact
```

In the page, the help button opens a guided tour and the book opens the documentation. For testing, the URL takes `?view=stylus`, `?tour=5`, `?docs`, `?play`, `?t=30` (seconds in), `?cyl=blank` and `?fixed` (no adaptive resolution).

## How it works

One loop runs 48,000 times a second ([`src/audio.js`](src/audio.js)). The clockwork says where the ball is; recording writes a depth there, and playback reads it back.

**1️⃣ Turn.** The clockwork ([`src/mechanics.js`](src/mechanics.js)) spins the mandrel: a governor with a first-order lag, a spring that drains linearly, slow and fast speed wobbles. A feed screw with 100 threads per inch moves the carriage one groove per turn, so a position is just "turns since the start".

**2️⃣ Cut.** The recorder ([`src/acoustics.js`](src/acoustics.js), [`src/cut.js`](src/cut.js)) is the acoustic chain of the era as [biquad filters](https://en.wikipedia.org/wiki/Digital_biquad_filter). Two high-passes drop the bass a horn can't hold, and a 2.45 ms echo (one trip along a 42 cm horn and back) adds its honk. The glass diaphragm rings at 2.3 kHz, and `tanh` soft clipping keeps the cutter within ±44 µm. Each cell of the groove keeps the average of the sound that passed over it, plus the grain of the wax.

**3️⃣ Keep.** The record is an array ([`src/groove.js`](src/groove.js)): 4,096 × 371 depths in micrometres, 369 grooves plus two guard rows. The GPU draws it, the ball plays it, and IndexedDB keeps your recordings at 16 bits ([`src/storage.js`](src/storage.js)).

**4️⃣ Play.** The reproducer ([`src/contact.js`](src/contact.js), [`src/acoustics.js`](src/acoustics.js)) rests a 70 µm ball on the groove walls. Along the groove it rides over dips smaller than itself ([dilation](https://en.wikipedia.org/wiki/Dilation_(morphology))), and when the groove falls faster than the weight can follow, it flies for a moment and buzzes. What you hear is its velocity, through the diaphragm (2 kHz), its mass, the wooden box (480 Hz) and a small Schroeder room.

**5️⃣ Draw.** The machine ([`src/scene.js`](src/scene.js), [`src/render.js`](src/render.js), [`src/shaders.js`](src/shaders.js)) is built in code from lathes and sweeps ([`src/mesh.js`](src/mesh.js)), with nothing loaded from a file. Close up, a fine mesh is pushed in by the depths, joined by a Catmull–Rom spline so extreme zoom shows hills, not steps; far away, each groove fades to its average depth. The light is physically based: GGX, clear-coat wax, image-based lighting, soft shadows, ambient occlusion, bloom and AgX tone mapping.

The in-app documentation draws its figures from these same functions ([`src/figures.js`](src/figures.js)).

## The cylinder

The built-in cylinder is _In the Hall of the Mountain King_, from Grieg's own piano arrangement. The score is read as text from a public-domain LilyPond source ([`src/scores.js`](src/scores.js)), never run. A small wavetable piano plays it ([`src/music.js`](src/music.js)), speeding up as Grieg wrote it, with the lowest octave lifted because an acoustic horn can't carry it. It is cut exactly like your recordings, then worn with a seed, so it always wears the same way ([`src/cylinders.js`](src/cylinders.js)).

## Credits

- Music: Edvard Grieg, _In the Hall of the Mountain King_, Op. 46 No. 4. [Mutopia Project](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1888) edition typeset by Coyau, public domain.
- Filters from Robert Bristow-Johnson's [Audio EQ Cookbook](https://www.w3.org/TR/audio-eq-cookbook/). Reverb after Manfred Schroeder. AgX tone mapping by Troy Sobotka.
- Type: Cormorant Garamond and IBM Plex Mono.
- Inspired by [vinyl](https://github.com/rauchg/vinyl) by Guillermo Rauch.

## License

The code is [MIT](LICENSE). The score is from a public-domain edition, and so is the cylinder cut from it.
