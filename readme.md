AudioBuffer implementation for node.

## Usage

[![npm install audio-buffer](https://nodei.co/npm/audio-buffer.png?mini=true)](https://npmjs.org/package/audio-buffer/)

```js
var AudioBuffer = require('audio-buffer');

//Create audio buffer from data source. Pass audio data format as a second argument.
//Format only affects the way to access raw data, it can be changed at any time.
var buffer = new AudioBuffer(data, format);

//Data, distributed by channels, like [left, right, ...]
buffer.data;

//Duration of the underlying audio data, in seconds
buffer.duration;

//Number of samples per channel
buffer.length;

//Sample rate
buffer.sampleRate;

//Number of channels (violates users over theoretical purity principle, that’s why here’s a synonym)
buffer.numberOfChannels === buffer.channels;

//Get array containing the data for the channel
buffer.getChannelData(channel);

//
buffer.copyFromChannel(destination, channelNumber, startInChannel?);

//
buffer.copyToChannel(source, channelNumber, startInChannel?);

//Convert to node-buffer with specified format

```

## Related

> [pcm-util](https://npmjs.org/package/pcm-util) — utils for audio formats.<br/>
> [ndsamples](https://github.com/livejs/ndsamples) — audio-wrapper for ndarrays.<br/>
> [ndarray](https://github.com/livejs/ndarray) — generic multidimensional arrays.<br/>