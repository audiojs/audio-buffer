# audio-buffer [![test](https://github.com/audiojs/audio-buffer/actions/workflows/node.js.yml/badge.svg)](https://github.com/audiojs/audio-buffer/actions/workflows/node.js.yml) [![stable](https://img.shields.io/badge/stability-stable-brightgreen.svg)](http://github.com/badges/stability-badges)

> Audio data container with planar float32 layout.

A drop-in replacement for _Buffer_ in node, bun and other envs for audio processing.<br>
[Web Audio API AudioBuffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer) spec ponyfill.

Comes with optional utils.

```js
import AudioBuffer from 'audio-buffer'
import { from, trim, normalize } from 'audio-buffer/util'

let buf = from([0, 0, 0.5, 0.8, 0.3, 0, 0])
buf = normalize(trim(buf))
```

## API

### Constructor

```js
new AudioBuffer({ length: 1024, sampleRate: 44100, numberOfChannels: 2 })
new AudioBuffer(2, 1024, 44100) // positional form
```

### Properties

All read-only.

* `length` — samples per channel
* `sampleRate` — Hz
* `duration` — seconds
* `numberOfChannels`

Iterable over channels: `for (let ch of buf)`, `let [L, R] = buf`.

### Methods

```js
buf.getChannelData(0)                        // → Float32Array view of channel
buf.copyFromChannel(dest, channel, offset?)   // copy from channel into Float32Array
buf.copyToChannel(source, channel, offset?)   // copy Float32Array into channel
buf.slice(start, end)                         // → new buffer (supports negative indices)
buf.concat(other)                             // → new buffer (same shape required)
buf.set(other, offset?)                       // write other into this at offset
```

### Static

```js
AudioBuffer.fromArray([left, right], 44100)  // from Float32Array[] per channel
AudioBuffer.like(buf)                         // empty buffer, same shape
AudioBuffer.filledWithVal(0.5, 2, 100, 44100) // pre-filled buffer
```

## Operations

```js
import { from, fill, mix, normalize, trim, reverse, equal,
  noise, remix, pad, invert, rotate, repeat, resize, removeDC } from 'audio-buffer/util'
```

Same-size ops mutate and return the buffer. Size-changing ops return a new buffer.

#### `from(source, options?) → AudioBuffer`

Create buffer from anything — number, Float32Array, Array, AudioBuffer, ArrayBuffer.

```js
from([0.1, -0.3, 0.5])                       // array of samples → mono
from([left, right], { sampleRate: 48000 })    // Float32Array[] → stereo
from(existingBuffer)                           // clone
from(1024)                                     // empty buffer, 1024 samples
```

#### `fill(buffer, value, start?, end?) → buffer`

Fill with constant or per-sample function.

```js
fill(buf, 0)                                   // silence
fill(buf, (s, i, ch) => Math.sin(i * 0.1))    // sine wave
```

#### `noise(buffer, start?, end?) → buffer`

White noise (-1..1).

```js
noise(buf)                                     // fill entire buffer
noise(buf, 100, 200)                           // fill range only
```

#### `normalize(buffer, start?, end?) → buffer`

Peak-normalize to 1.0, preserving inter-channel balance.

```js
normalize(buf)                                 // quiet recording → full scale
```

#### `trim(buffer, threshold?) → newBuffer`

Remove silence from both ends.

```js
trim(buf)                                      // remove exact zeros
trim(buf, 0.01)                                // remove near-silence
```

#### `reverse(buffer, start?, end?) → buffer`

Reverse samples.

```js
reverse(buf)                                   // full reverse
reverse(buf, 0, 100)                           // reverse first 100 samples
```

#### `invert(buffer, start?, end?) → buffer`

Phase-invert (negate samples).

```js
invert(buf)                                    // flip polarity
```

#### `mix(a, b, ratio?, offset?) → a`

Blend `b` into `a`. Ratio 0 = keep `a`, 1 = replace with `b`.

```js
mix(track, reverb, 0.3)                        // 70% dry, 30% wet
mix(a, b, (sa, sb) => Math.max(sa, sb))       // custom blend function
mix(a, b, 0.5, 1000)                           // mix starting at sample 1000
```

#### `equal(a, b) → boolean`

Deep equality — same shape, same samples.

```js
equal(buf, clone)                              // true if identical
```

#### `remix(buffer, channels, interpretation?) → newBuffer`

Upmix/downmix channels per [Web Audio spec](https://www.w3.org/TR/webaudio/#channel-up-mixing-and-down-mixing) speaker rules.

```js
remix(stereo, 1)                               // stereo → mono
remix(mono, 2)                                 // mono → stereo
remix(buf, 6)                                  // → 5.1 surround
remix(buf, 4, 'discrete')                      // copy channels, silence rest
```

#### `pad(buffer, length, value?, side?) → newBuffer`

Pad to target length.

```js
pad(buf, 44100)                                // zero-pad to 1 second
pad(buf, 44100, 0, 'start')                    // pad at start
```

#### `resize(buffer, length) → newBuffer`

Truncate or zero-pad to exact length.

```js
resize(buf, 512)                               // force to 512 samples
```

#### `repeat(buffer, times) → newBuffer`

Repeat N times.

```js
repeat(buf, 4)                                 // loop 4x
```

#### `rotate(buffer, offset) → buffer`

Circular shift. Positive = right.

```js
rotate(buf, 100)                               // shift right 100 samples
rotate(buf, -50)                               // shift left 50
```

#### `removeDC(buffer, start?, end?) → buffer`

Remove DC offset (subtract mean per channel).

```js
removeDC(buf)                                  // center waveform at zero
```

## Play

```js
import play from 'audio-buffer/play'

let ctrl = await play(buf, { volume: 0.8, loop: true })
ctrl.pause()
ctrl.play()
ctrl.stop()
ctrl.currentTime  // seconds
ctrl.playing      // boolean
```

Options: `{ volume, loop, start, end, autoplay, onended }`.

Uses Web Audio API in browsers. In Node.js, install [audio-speaker](https://github.com/audiojs/audio-speaker): `npm i audio-speaker`.

`stop()` resets to start. `play()` restarts from beginning.

## Replaces

* [audio-buffer-utils](https://github.com/audiojs/audio-buffer-utils)
* [audio-buffer-from](https://github.com/audiojs/audio-buffer-from)
* [audio-buffer-remix](https://github.com/audiojs/audio-buffer-remix)
* [audio-play](https://github.com/audiojs/audio-play)

<p align=center><a href="https://github.com/krishnized/license/">🕉</a></p>
