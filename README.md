# Cylinder Phonograph

An Edison wax-cylinder phonograph in your browser. Sound is cut into a groove of numbers, the GPU carves those numbers into wax, and a tiny sapphire ball plays them back. No recording of a real phonograph is used: every crackle and wobble comes from the simulation.

One HTML file, WebGL2 and Web Audio, no libraries.

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

Open `index.html` through any static server:

```bash
python -m http.server 8000
```

Then go to <http://localhost:8000>. Opening the file directly also works in most browsers, but the microphone needs `localhost` or HTTPS.

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

## Source map

| Part | Functions |
| --- | --- |
| Filters | `BQ` `Horn` `Room` |
| Recording | `AcousticRecorder` `cutSample` `flushCut` `cutSignal` |
| Wear | `addWear` |
| Ball and groove | `Hof` `hcAt` `traceAt` |
| Needle and reproducer | `AcousticPlayer` |
| Drawing the groove | `gH` `depthAt` `VS_PATCH` |
| Clockwork | `mechStep` `govTau` `wow` `handStep` `crankDrag` |
| Sound in space | `buildSpatial` `spatialUpdate` `coneG` `offAxisFc` `clack` |
| Volume | `volLaw` |
| Audio loop | `onAudio` |
| Score and piano | `scoreNotes` `pieceScore` `renderEvents` |

## The cylinder

*In the Hall of the Mountain King*, from Grieg's own piano arrangement, in a public-domain score from the Mutopia Project. The score is read as text, never run. A small wavetable piano plays it, speeding up as Grieg wrote it, and it is cut exactly like your recordings.

## Credits

- Music: Edvard Grieg, *In the Hall of the Mountain King*, Op. 46 No. 4. [Mutopia Project](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1888) edition typeset by Coyau, public domain.
- Filters from Robert Bristow-Johnson's [Audio EQ Cookbook](https://www.w3.org/TR/audio-eq-cookbook/). Reverb after Manfred Schroeder. AgX tone mapping by Troy Sobotka.
- Type: Cormorant Garamond and IBM Plex Mono.
- Inspired by [vinyl](https://github.com/rauchg/vinyl) by Guillermo Rauch.

## License

[MIT](LICENSE)
