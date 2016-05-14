[AudioBuffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer) optimal implementation for node. In browser provides just a useful constructor for web-audio’s _AudioBuffer_, in node is also useful instead of _Buffer_ in audio streams.


## Usage

[![npm install audio-buffer](https://nodei.co/npm/audio-buffer.png?mini=true)](https://npmjs.org/package/audio-buffer/)

```js
var AudioBuffer = require('audio-buffer');

//Create audio buffer from a data source or of a length.
//Data is interpreted as a planar sequence of float32 samples.
//It can be Array, TypedArray, ArrayBuffer, Buffer, AudioBuffer, DataView, NDArray etc.
var buffer = new AudioBuffer(channels?, data|length, sampleRate?);

//Duration of the underlying audio data, in seconds
buffer.duration;

//Number of samples per channel
buffer.length;

//Default sample rate is 44100
buffer.sampleRate;

//Default number of channels is 2
buffer.numberOfChannels;

//Get array containing the data for the channel (not copied)
buffer.getChannelData(channel);

//Place data from channel to destination Float32Array
buffer.copyFromChannel(destination, channelNumber, startInChannel?);

//Place data from source Float32Array to the channel
buffer.copyToChannel(source, channelNumber, startInChannel?);


//Some special properties, it’s unlikely you will ever need them.

//Type of array for data. Float64 is faster for last node/browsers.
AudioBuffer.FloatArray = Float64Array;

//In browser, you can set the audio context (online/offline).
//By default it is taken from audio-context module.
AudioBuffer.context;

//Whether WebAudioAPI Buffer should be created, if possible, instead of own instance
//In browser it is true, if WAA is available.
AudioBuffer.isWAA;
```

## Related

> [pcm-util](https://npmjs.org/package/pcm-util) — utils for audio format convertions.<br/>
> [ndsamples](https://github.com/livejs/ndsamples) — audio-wrapper for ndarrays. A somewhat alternative approach to wrap audio data, based on ndarrays, used by some modules in [livejs](https://github.com/livejs).<br/>