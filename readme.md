# audio-buffer [![Build Status](https://travis-ci.org/audiojs/audio-buffer.svg?branch=master)](https://travis-ci.org/audiojs/audio-buffer) [![stable](https://img.shields.io/badge/stability-stable-brightgreen.svg)](http://github.com/badges/stability-badges) [![Greenkeeper badge](https://badges.greenkeeper.io/audiojs/audio-buffer.svg)](https://greenkeeper.io/)

Basic audio data container. Provides lightweight [Web Audio API AudioBuffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer) implementation. Useful instead of _Buffer_ in audio streams, [**@audiojs**](https://github.com/audiojs) components and other audio applications. Can be used as a ponyfill.

## Usage

[![npm install audio-buffer](https://nodei.co/npm/audio-buffer.png?mini=true)](https://npmjs.org/package/audio-buffer/)

### new AudioBuffer(context?, options)

Create audio buffer for audio `context` based on `options`.

Default `context` is [audio-context](https://npmjs.org/package/audio-context) singleton. `null` context can be used to indicate context-free buffer instance, eg. in nodejs.

Available options:

* `length` — number of samples, minimum is 1.
* `sampleRate` — default sample rate is 44100.
* `numberOfChannels` — default number of channels is 1.

### buffer.duration

Duration of the underlying audio data, in seconds.

### buffer.length

Number of samples per channel.

### buffer.sampleRate

Default sample rate is 44100.

### buffer.numberOfChannels

Default number of channels is 1.

### buffer.getChannelData(channel)

Get array containing the data for the channel (not copied).

### buffer.copyFromChannel(destination, channelNumber, startInChannel=0)

Place data from channel to destination Float32Array.

### buffer.copyToChannel(source, channelNumber, startInChannel=0)

Place data from source Float32Array to the channel.


## See also

* [audio-buffer-list](https://github.com/audiojs/audio-buffer-list) — linked sequence of audio buffers, useful for storing/manipulating large audio data.
* [audio-buffer-utils](https://github.com/audiojs/audio-buffer-utils) — utils for audio buffers.
* [pcm-util](https://npmjs.org/package/pcm-util) — utils for audio format convertions.

## Similar

* [ndsamples](https://github.com/livejs/ndsamples) — audio-wrapper for ndarrays. A somewhat alternative approach to wrap audio data, based on ndarrays, used by some modules in [livejs](https://github.com/livejs).
* [1](https://www.npmjs.com/package/audiobuffer), [2](https://www.npmjs.com/package/audio-buffer), [3](https://github.com/sebpiq/node-web-audio-api/blob/master/lib/AudioBuffer.js), [4](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer) — other AudioBuffer implementations.
* [audiodata](https://www.npmjs.com/package/audiodata) alternative data holder from @mohayonao.
