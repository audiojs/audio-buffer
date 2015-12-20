Audio buffer is a class to work with audio data. It provides a thin wrapper with a bunch of audio methods for any audio data source — `AudioBuffer`, `Buffer`, `TypedArray`, `Array`, `NDarray` or any `Object` with get/set methods. It stores data as an ndarray, so any [ndarray packages](https://github.com/scijs/ndarray/wiki/ndarray-module-list#core-module) can be used over audio buffers.

## Usage

[![npm install audio-buffer](https://nodei.co/npm/audio-buffer.png?mini=true)](https://npmjs.org/package/audio-buffer/)

```js
var AudioBuffer = require('audio-buffer');

//create audio buffer from any type of array
var buffer = new AudioBuffer([0,0,1,1], {channels: 2});
```

## API

```js
//Create audio buffer from data source. Pass audio data format as a second argument.
//Format only affects the way to access raw data, it can be changed at any time.
var buffer = new AudioBuffer(data, format);

//Format of data
buffer.format;

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

//Get sample value
buffer.get(channel, index);

//Set sample value
buffer.set(channel, index, value);

//Get array containing the data for the channel
buffer.getChannelData(channel);
```

## Related

> [pcm-util](https://npmjs.org/package/pcm-util) — utils for audio formats.<br/>
> [ndsamples](https://github.com/livejs/ndsamples) — audio-wrapper for ndarrays.<br/>
> [ndarray](https://github.com/livejs/ndarray) — generic multidimensional arrays.<br/>