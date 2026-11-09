# Cylinder Phonograph

An Edison wax-cylinder phonograph in your browser. Sound is cut into a groove of numbers, the GPU carves those numbers into wax, and a tiny sapphire ball plays them back. No recording of a real phonograph is used: every crackle and wobble comes from the simulation.

Plain ES modules, WebGL2 and Web Audio: no libraries, no bundler.

**Live: <https://cylinder-phonograph.vercel.app>**

## Features

- Record from the microphone, or drop an audio file to cut it onto a blank
- Wind the spring with the crank and start it with the lever
- Lift the reproducer and drop it anywhere on the cylinder
- Grab the cylinder and scratch it, forwards and backwards
- 3D sound: the horn is the source, the camera is your head
- Zoom until one groove fills the screen: what you see is what you hear

## Controls

| Action | Does |
| --- | --- |
| Drag the background | orbit · right-drag or Shift to pan · wheel or pinch to zoom |
| Click the lever | start and stop · `Space` |
| Drag the crank | wind the spring |
| Drag the knob | volume · `−` `+` |
| Drag the reproducer | lift it, slide it, let go to drop it |
| Drag the cylinder | scratch |
| The box | click it for the cylinders, the lid to open it, the key to lock it · `C` |
| Record | `R`, or drop an audio file anywhere |
| Views | `1` overview · `2` horn · `3` mechanism · `4` stylus close-up |

## Run it

The browser loads `src/` as is, so any static server works (ES modules don't load from `file://`):

```bash
npm run dev
```

Then go to <http://localhost:8000>. The microphone needs `localhost` or HTTPS.

```bash
npm test        # the acoustics and the ball-in-groove contact, offline in Node
npm run build   # copies index.html and src/ into dist/ (what Vercel serves)
```

URL options for testing: `?view=stylus`, `?tour=5`, `?docs`, `?play`, `?t=30` (seconds into the cylinder), `?cyl=blank`, `?fixed` (no adaptive resolution).

## How it works

One loop runs 48,000 times a second. The clockwork says where the needle is; recording writes a depth there, playback reads it back.

1. **Where the needle is.** A screw with 100 threads per inch moves the needle one groove per turn, so a position is just "turns since the start". Each turn holds 4,096 depths; recording averages into them and playback reads between them, so any speed and direction work.
2. **Recording.** Two high-pass filters remove the bass a horn can't hold, and a 2.45 ms comb (one trip along a 42 cm horn and back) adds its honk. A resonant low-pass at 2.3 kHz plays the glass diaphragm, and `tanh` soft clipping keeps the cut within ±44 µm. Each groove cell keeps the average of the sound that passed over it, plus a faint grain you later hear as hiss. A file that doesn't fit is trimmed, or cut slower, down to 120 rpm, as early cylinders were.
3. **The record is an array.** 4,096 × 371 depths in micrometres (369 grooves plus two guard rows). The GPU draws it, the needle plays it, and the browser saves it in IndexedDB. The built-in cylinder gets 300 dust specks and three scratches.
4. **Drawing the groove.** Close up, a fine mesh is displaced by the depths, joined by a Catmull–Rom spline so extreme zoom shows hills, not steps. Far away, each groove fades to its average depth. Lighting is physically based (GGX, clear-coat wax, soft shadows, ambient occlusion, bloom, AgX tone mapping).
5. **Playback.** A 70 µm ball rests on the groove walls and can't fit into dips smaller than itself (morphological dilation). The reproducer's weight can pull the needle down only so fast, so when the groove drops faster the needle flies for a moment and buzzes. What you hear is the needle's velocity, filtered by the diaphragm (2 kHz), its weight, the wooden box (480 Hz) and a small Schroeder room.
6. **Sound in space.** Inverse distance law, a directivity cone, an off-axis low-pass (walking around the horn makes it duller) and the browser's HRTF. Lever, crank, lid and key clicks are synthesized and placed where the part is.
7. **Clockwork.** The governor eases toward 160 rpm. A full wind lasts 1,100 turns, about 7 minutes; below 12 % the music sags, and slow and fast speed wobbles grow as the spring runs out. Scratching pulls the cylinder through a stiff damped spring while the belt slips.
8. **Volume.** Turning the knob down makes the sound quieter and duller at once, like a damper in the horn. Past three quarters it overdrives.

The in-app documentation (the book icon) draws its figures from the code's own functions.

## Project layout

```
index.html            the page: canvas, toolbar, tour card, docs, dialogs
src/style.css         its styles
src/main.js           entry point: loads the modules in order, URL options, frame loop
test/                 offline tests of the physics (node --test)
build.mjs             copies the site into dist/
```

`src/`, from the numbers up:

| Module | What it holds |
| --- | --- |
| `context.js` | WebGL2 context, extensions, URL options |
| `math.js` · `mesh.js` · `gl-util.js` | vectors and matrices, mesh building, WebGL helpers |
| `constants.js` | the machine in numbers: cylinder, feed screw, groove, stylus, horn |
| `state.js` | shared runtime state: clockwork, cylinder changer, audio engine, pose of the parts |
| `contact.js` | the ball in the groove: contact table `Hof`, dilation taps `TAPS` |
| `acoustics.js` | filters `BQ` `Horn` `Room`, cutter `AcousticRecorder`, reproducer `AcousticPlayer` |
| `groove.js` · `cut.js` | the depth array, reading it `hcAt` `traceAt`; cutting `cutSignal` and wear `addWear` |
| `scores.js` · `music.js` · `cylinders.js` | the score, the wavetable piano `renderEvents`, the cylinders on the shelf |
| `shaders.js` · `programs.js` · `environment.js` | GLSL (groove displacement `gH` `depthAt` `VS_PATCH`), programs, image-based light |
| `label.js` · `groove-texture.js` · `scene.js` | the box label, the groove on the GPU, the machine part by part |
| `render.js` · `camera.js` · `picking.js` | the frame's passes, camera presets, what is under the pointer |
| `mechanics.js` | clockwork `mechStep` `govTau` `wow` `handStep`, laws `volLaw` `coneG` `offAxisFc` |
| `audio.js` | the audio loop `onAudio`, cutting `cutSample` `flushCut`, 3D sound `buildSpatial` `spatialUpdate`, `clack` |
| `recording.js` · `fit.js` · `storage.js` · `swap.js` | microphone and files, fitting long files, IndexedDB, changing cylinders |
| `hud.js` · `controls.js` · `input.js` | tooltips, menu and shelf; toolbar; pointer and keyboard (`crankDrag`) |
| `figures.js` · `tour.js` · `docs.js` | illustrations drawn from the code's own functions, the tour, the docs |

## The cylinder

*In the Hall of the Mountain King*, from Grieg's own piano arrangement, in a public-domain score from the Mutopia Project. The score is read as text, never run. A small wavetable piano plays it, speeding up as Grieg wrote it, and it is cut exactly like your recordings.

## Credits

- Music: Edvard Grieg, *In the Hall of the Mountain King*, Op. 46 No. 4. [Mutopia Project](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1888) edition typeset by Coyau, public domain.
- Filters from Robert Bristow-Johnson's [Audio EQ Cookbook](https://www.w3.org/TR/audio-eq-cookbook/). Reverb after Manfred Schroeder. AgX tone mapping by Troy Sobotka.
- Type: Cormorant Garamond and IBM Plex Mono.
- Inspired by [vinyl](https://github.com/rauchg/vinyl) by Guillermo Rauch.

## License

[MIT](LICENSE)
