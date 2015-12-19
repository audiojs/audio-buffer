Audio buffer interface for any audio data: `AudioBuffer`, `Buffer`, `TypedArray`, `Array`, `NDarray` or any `Object` with get/set methods. Fully compatible with ndarrays, so any [ndarray modules](https://github.com/scijs/ndarray/wiki/ndarray-module-list#core-module) can be used over audio buffers. It is designed to provide wrapper audio methods for the underlying data storage, so the data is kept untouched.

## Usage

[![npm install audio-buffer](https://nodei.co/npm/audio-buffer.png?mini=true)](https://npmjs.org/package/audio-buffer/)

```js
var AudioBuffer = require('audio-buffer');

//create audio buffer from any type of array
var buffer = new AudioBuffer([0,0,1,1], {channels: 2});
```

## API

```js
//create audio buffer from any type of data source. Pass format as a second argument
var buffer = new AudioBuffer(data, format);

//NDarray with the data
buffer.data;

//Raw data object - array, buffer, etc.
buffer.rawData;

//Duration of the underlying audio data, in seconds
buffer.duration;

//Number of samples per channel
buffer.length;
buffer.samplesPerFrame;

//Sample rate
buffer.sampleRate;

//Number of channels
buffer.channels;
buffer.numberOfChannels;
```

## Audio methods

## Array methods

## Ndarray methods

## Related

> [ndsamples](https://github.com/livejs/ndsamples) — audio-wrapper for ndarrays.<br/>
> [ndarray](https://github.com/livejs/ndarray) — generic multidimensional arrays.<br/>