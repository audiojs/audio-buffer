/**
 * AudioBuffer class
 *
 * @module audio-buffer/buffer
 */


var isBuffer = require('is-buffer');
var b2ab = require('buffer-to-arraybuffer');
var isBrowser = require('is-browser');
var isAudioBuffer = require('is-audio-buffer');
var context = require('audio-context');


/**
 * @constructor
 *
 * @param {∀} data Any collection-like object
 */
function AudioBuffer (channels, data, sampleRate) {
	if (!(this instanceof AudioBuffer)) return new AudioBuffer(channels, data, sampleRate);

	//if one argument only - it is surely data or length
	//having new AudioBuffer(2) does not make sense as 2 - number of channels
	if (data == null) {
		data = channels || 1;
		channels = null;
	}
	//audioCtx.createBuffer() - complacent arguments
	else {
		if (sampleRate != null) this.sampleRate = sampleRate;
		if (channels != null) this.numberOfChannels = channels;
	}

	//if AudioBuffer(number) = create new array
	if (typeof data === 'number') {
		this.data = [];
		for (var i = 0; i < this.numberOfChannels; i++ ) {
			this.data.push(new AudioBuffer.FloatArray(data));
		}
	}
	//if other audio buffer passed - create fast clone of it
	//if WAA AudioBuffer - get buffer’s data (it is bounded)
	else if (isAudioBuffer(data)) {
		this.data = [];
		if (channels == null) this.numberOfChannels = data.numberOfChannels;
		if (sampleRate == null) this.sampleRate = data.sampleRate;

		//copy channel's data
		for (var i = 0, l = data.numberOfChannels; i < l; i++) {
			this.data.push(data.getChannelData(i).slice());
		}
	}
	//TypedArray, Buffer, DataView etc, or ArrayBuffer
	//NOTE: node 4.x+ detects Buffer as ArrayBuffer view
	else if (ArrayBuffer.isView(data) || data instanceof ArrayBuffer || isBuffer(data)) {
		this.data = [];
		if (isBuffer(data)) {
			data = b2ab(data);
		}
		if (!(data instanceof AudioBuffer.FloatArray)) {
			data = new AudioBuffer.FloatArray(data.buffer || data);
		}
		var len = data.length / this.numberOfChannels;
		for (var i = 0; i < this.numberOfChannels; i++ ) {
			//NOTE: we could’ve done subarray here to create a reference, but...
			//it will not be compatible with the WAA buffer - it cannot be a reference
			this.data.push(data.slice(i* len, i * len + len));
		}
	}
	//if array - parse channeled data
	else if (Array.isArray(data)) {
		this.data = [];
		//if separated data passed already - spread subarrays by channels
		if (data[0] instanceof Object) {
			if (channels == null) this.numberOfChannels = data.length;
			for (var i = 0; i < this.numberOfChannels; i++ ) {
				this.data.push(new AudioBuffer.FloatArray(data[i]));
			}
		}
		//plain array passed - split array equipartially
		else {
			var len = Math.floor(data.length / this.numberOfChannels);
			for (var i = 0; i < this.numberOfChannels; i++ ) {
				var channelData = data.slice(i * len, i * len + len);
				//force channel data be numeric
				if (channelData[0] == null) channelData = len;
				this.data.push(new AudioBuffer.FloatArray(channelData));
			}
		}
	}
	//if ndarray, typedarray or other data-holder passed - redirect plain databuffer
	else if (data && (data.data || data.buffer)) {
		return new AudioBuffer(this.numberOfChannels, data.data || data.buffer, this.sampleRate);
	}
	//if other - unable to parse arguments
	else {
		throw Error('Failed to create buffer: check provided arguments');
	}


	//set up params
	this.length = this.data[0].length;
	this.duration = this.length / this.sampleRate;


	//for browser - just return WAA buffer
	if (AudioBuffer.isWAA) {
		//create WAA buffer
		var audioBuffer = AudioBuffer.context.createBuffer(this.numberOfChannels, this.length, this.sampleRate);

		//fill channels
		for (var i = 0; i < this.numberOfChannels; i++) {
			audioBuffer.getChannelData(i).set(this.getChannelData(i));
		}

		return audioBuffer;
	}
};


/**
 * Default params
 */
AudioBuffer.prototype.numberOfChannels = 2;
AudioBuffer.prototype.sampleRate = 44100;


/** Type of storage to use */
AudioBuffer.FloatArray = Float32Array;


/** Set context, though can be redefined */
AudioBuffer.context = context;


/** Whether WebAudioBuffer should be created */
AudioBuffer.isWAA = isBrowser && context.createBuffer;


/**
 * Return data associated with the channel.
 *
 * @return {Array} Array containing the data
 */
AudioBuffer.prototype.getChannelData = function (channel) {
	//FIXME: ponder on this, whether we really need that rigorous check, it may affect performance
	if (channel > this.numberOfChannels || channel < 0 || channel == null) throw Error('Cannot getChannelData: channel number (' + channel + ') exceeds number of channels (' + this.numberOfChannels + ')');
	return this.data[channel];
};


/**
 * Place data to the destination buffer, starting from the position
 */
AudioBuffer.prototype.copyFromChannel = function (destination, channelNumber, startInChannel) {
	var data = this.data[channelNumber];
	if (startInChannel == null) startInChannel = 0;
	for (var i = startInChannel, j = 0; i < data.length && j < destination.length; i++, j++) {
		destination[j] = data[i];
	}
};


/**
 * Place data from the source to the channel, starting (in self) from the position
 * Clone of WAAudioBuffer
 */
AudioBuffer.prototype.copyToChannel = function (source, channelNumber, startInChannel) {
	var data = this.data[channelNumber];

	if (!startInChannel) startInChannel = 0;

	for (var i = startInChannel, j = 0; i < this.length && j < source.length; i++, j++) {
		data[i] = source[j];
	}
};


module.exports = AudioBuffer;