# audio-buffer [![test](https://github.com/audiojs/audio-buffer/actions/workflows/node.js.yml/badge.svg)](https://github.com/audiojs/audio-buffer/actions/workflows/node.js.yml) [![stable](https://img.shields.io/badge/stability-stable-brightgreen.svg)](http://github.com/badges/stability-badges)

Audio data container with planar float32 layout.

Drop-in for _Buffer_ in audio streams, components, workers, node.js — anywhere without web-audio-api.

Spec-compatible [Web Audio API AudioBuffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer) ponyfill.

## Usage

[![npm install audio-buffer](https://nodei.co/npm/audio-buffer.png?mini=true)](https://npmjs.org/package/audio-buffer/)

```js
import AudioBuffer from 'audio-buffer'

let buf = new AudioBuffer({ length: 1024, sampleRate: 44100, numberOfChannels: 2 })
buf.getChannelData(0) // Float32Array[1024]
```

### Constructor

#### `new AudioBuffer(options)`

* `options.length` — number of samples per channel (>= 1).
* `options.sampleRate` — sample rate, 3000..768000.
* `options.numberOfChannels` — channel count, default 1.

#### `new AudioBuffer(numberOfChannels, length, sampleRate)`

Positional form — same parameters as above.

### Properties

#### `buffer.length`

Number of samples per channel.

#### `buffer.sampleRate`

Sample rate in Hz.

#### `buffer.duration`

Duration of the buffer in seconds (`length / sampleRate`).

#### `buffer.numberOfChannels`

Number of channels.

### Spec Methods

#### `buffer.getChannelData(channel)`

Returns the `Float32Array` for the given channel (a view, not a copy).

#### `buffer.copyFromChannel(destination, channelNumber, startInChannel=0)`

Copies samples from channel into `destination` Float32Array.

#### `buffer.copyToChannel(source, channelNumber, startInChannel=0)`

Copies samples from `source` Float32Array into channel.

### Utility Methods

#### `buffer.slice(start, end)`

Returns a new AudioBuffer with samples from `start` to `end` (subarray semantics).

#### `buffer.concat(other)`

Returns a new AudioBuffer joining `this` and `other`. Both must have same sampleRate and numberOfChannels.

#### `buffer.set(other, offset=0)`

Writes `other` buffer's data into `this` at `offset`. Both must have same sampleRate and numberOfChannels.

### Static Factories

#### `AudioBuffer.fromArray(arrays, sampleRate)`

Creates AudioBuffer from an array of Float32Arrays (one per channel).

#### `AudioBuffer.filledWithVal(val, numberOfChannels, length, sampleRate)`

Creates AudioBuffer with all samples set to `val`.

## Similar

* [ndsamples](https://github.com/livejs/ndsamples) — audio-wrapper for ndarrays.
* [1](https://www.npmjs.com/package/audiobuffer), [2](https://www.npmjs.com/package/audio-buffer), [3](https://github.com/nickclaw/node-web-audio-api), [4](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer) — other AudioBuffer implementations.

<p align=center><a href="https://github.com/krishnized/license/">🕉</a></p>
