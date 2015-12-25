[AudioBuffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer) optimal implementation for node. In browser provides just a useful constructor for web-audio’s _AudioBuffer_, in node is also useful instead of _Buffer_ in audio streams.


## Usage

[![npm install audio-buffer](https://nodei.co/npm/audio-buffer.png?mini=true)](https://npmjs.org/package/audio-buffer/)

```js
var AudioBuffer = require('audio-buffer');

//Create audio buffer from data source or of the length.
//Data source is interpreted as a planar sequence of float32 data.
//It can be Array, TypedArray, ArrayBuffer, Buffer, AudioBuffer, DataView, NDArray or any object with buffer or data property.
var buffer = new AudioBuffer(channels?, data|length, sampleRate?);

//Duration of the underlying audio data, in seconds
buffer.duration;

//Number of samples per channel
buffer.length;

//Default sample rate is 44100
buffer.sampleRate;

//Default number of channels is 2
buffer.numberOfChannels;

//Get array containing the data for the channel
buffer.getChannelData(channel);

//Place data from channel to destination Float32Array
buffer.copyFromChannel(destination, channelNumber, startInChannel?);

//Place data from source Float32Array to the channel
buffer.copyToChannel(source, channelNumber, startInChannel?);


//Type of storage to use for data - replace to Float64Array, if needed.
//It will only affect node implementation.
AudioBuffer.FloatArray = Float32Array;
```

## Related

> [pcm-util](https://npmjs.org/package/pcm-util) — utils for audio formats, convertions etc.<br/>
> [ndsamples](https://github.com/livejs/ndsamples) — audio-wrapper for ndarrays. A somewhat alternative approach to wrap audio data, based on ndarrays.<br/>
> [ndarray](https://github.com/livejs/ndarray) — generic multidimensional arrays.<br/>