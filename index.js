/**
 * AudioBuffer class
 *
 * @module audio-buffer/buffer
 */
'use strict'

var isBuffer = require('is-buffer')
var b2ab = require('buffer-to-arraybuffer')
var isBrowser = require('is-browser')
var isAudioBuffer = require('is-audio-buffer')
var context = require('audio-context')
var isPlainObj = require('is-plain-obj')


module.exports = AudioBuffer


/**
 * @constructor
 *
 * @param {∀} data Any collection-like object
 */
function AudioBuffer (channels, data, sampleRate, options) {
	//enforce class
	if (!(this instanceof AudioBuffer)) return new AudioBuffer(channels, data, sampleRate, options);

	//detect last argument
	var c = arguments.length
	while (!arguments[c] && c) c--;
	var lastArg = arguments[c];

	//figure out options
	var ctx, isWAA, floatArray, isForcedType = false
	if (lastArg && typeof lastArg != 'number') {
		ctx = lastArg.context || (context && context())
		isWAA = lastArg.isWAA != null ? lastArg.isWAA : !!(isBrowser && ctx.createBuffer)
		floatArray = lastArg.floatArray || Float32Array
		if (lastArg.floatArray) isForcedType = true
	}
	else {
		ctx = context && context()
		isWAA = !!ctx
		floatArray = Float32Array
	}

	//if one argument only - it is surely data or length
	//having new AudioBuffer(2) does not make sense as 2 being number of channels
	if (data == null || isPlainObj(data)) {
		data = channels || 1;
		channels = null;
	}
	//audioCtx.createBuffer() - complacent arguments
	else {
		if (typeof sampleRate == 'number') this.sampleRate = sampleRate;
		else if (isBrowser) this.sampleRate = ctx.sampleRate;
		if (channels != null) this.numberOfChannels = channels;
	}

	//if AudioBuffer(channels?, number, rate?) = create new array
	//this is the default WAA-compatible case
	if (typeof data === 'number') {
		this.length = data;
		this.data = []
		for (var c = 0; c < this.numberOfChannels; c++) {
			this.data[c] = new floatArray(data)
		}
	}
	//if other audio buffer passed - create fast clone of it
	//if WAA AudioBuffer - get buffer’s data (it is bounded)
	else if (isAudioBuffer(data)) {
		this.length = data.length;
		if (channels == null) this.numberOfChannels = data.numberOfChannels;
		if (sampleRate == null) this.sampleRate = data.sampleRate;

		this.data = []

		//copy channel's data
		for (var c = 0, l = this.numberOfChannels; c < l; c++) {
			this.data[c] = data.getChannelData(c).slice()
		}
	}
	//TypedArray, Buffer, DataView etc, or ArrayBuffer
	//NOTE: node 4.x+ detects Buffer as ArrayBuffer view
	else if (ArrayBuffer.isView(data) || data instanceof ArrayBuffer || isBuffer(data)) {
		if (isBuffer(data)) {
			data = b2ab(data);
		}
		//convert non-float array to floatArray
		if (!(data instanceof Float32Array) && !(data instanceof Float64Array)) {
			data = new floatArray(data.buffer || data);
		}

		this.length = Math.floor(data.length / this.numberOfChannels);
		this.data = []
		for (var c = 0; c < this.numberOfChannels; c++) {
			this.data[c] = data.subarray(c * this.length, (c + 1) * this.length);
		}
	}
	//if array - parse channeled data
	else if (Array.isArray(data)) {
		//if separated data passed already - send sub-arrays to channels
		if (data[0] instanceof Object) {
			if (channels == null) this.numberOfChannels = data.length;
			this.length = data[0].length;
			this.data = []
			for (var c = 0; c < this.numberOfChannels; c++ ) {
				this.data[c] = (!isForcedType && ((data[c] instanceof Float32Array) || (data[c] instanceof Float64Array))) ? data[c] : new floatArray(data[c])
			}
		}
		//plain array passed - split array equipartially
		else {
			this.length = Math.floor(data.length / this.numberOfChannels);
			this.data = []
			for (var c = 0; c < this.numberOfChannels; c++) {
				this.data[c] = new floatArray(data.slice(c * this.length, (c + 1) * this.length))
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


	//for browser - return WAA buffer, no sub-buffering allowed
	if (isWAA) {
		//create WAA buffer
		var audioBuffer = ctx.createBuffer(this.numberOfChannels, this.length, this.sampleRate);

		//fill channels
		for (var c = 0; c < this.numberOfChannels; c++) {
			audioBuffer.getChannelData(c).set(this.getChannelData(c));
		}

		return audioBuffer;
	}

	this.duration = this.length / this.sampleRate;
}


/**
 * Default params
 */
AudioBuffer.prototype.numberOfChannels = 2;
AudioBuffer.prototype.sampleRate = context.sampleRate || 44100;


/**
 * Return data associated with the channel.
 *
 * @return {Array} Array containing the data
 */
AudioBuffer.prototype.getChannelData = function (channel) {
	//FIXME: ponder on this, whether we really need that rigorous check, it may affect performance
	if (channel >= this.numberOfChannels || channel < 0 || channel == null) throw Error('Cannot getChannelData: channel number (' + channel + ') exceeds number of channels (' + this.numberOfChannels + ')');

	return this.data[channel]
};


/**
 * Place data to the destination buffer, starting from the position
 */
AudioBuffer.prototype.copyFromChannel = function (destination, channelNumber, startInChannel) {
	if (startInChannel == null) startInChannel = 0;
	var data = this.data[channelNumber]
	for (var i = startInChannel, j = 0; i < this.length && j < destination.length; i++, j++) {
		destination[j] = data[i];
	}
}


/**
 * Place data from the source to the channel, starting (in self) from the position
 * Clone of WAAudioBuffer
 */
AudioBuffer.prototype.copyToChannel = function (source, channelNumber, startInChannel) {
	var data = this.data[channelNumber]

	if (!startInChannel) startInChannel = 0;

	for (var i = startInChannel, j = 0; i < this.length && j < source.length; i++, j++) {
		data[i] = source[j];
	}
};

