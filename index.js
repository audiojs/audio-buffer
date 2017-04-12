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


/** Type of storage to use */
var FloatArray = typeof Float64Array === 'undefined' ? Float32Array : Float64Array;


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
	var last = arguments[c];

	//figure out options
	var ctx, isWAA, floatArray
	if (last && typeof last != 'number') {
		ctx = last.context || context
		isWAA = last.isWAA != null ? last.isWAA : !!(isBrowser && context.createBuffer)
		floatArray = last.floatArray || FloatArray
	}
	else {
		ctx = context
		isWAA = false
		floatArray = FloatArray
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
		this.data = new floatArray(data * this.numberOfChannels);
	}
	//if other audio buffer passed - create fast clone of it
	//if WAA AudioBuffer - get buffer’s data (it is bounded)
	else if (isAudioBuffer(data)) {
		this.length = data.length;
		if (channels == null) this.numberOfChannels = data.numberOfChannels;
		if (sampleRate == null) this.sampleRate = data.sampleRate;

		this.data = new floatArray(this.length * this.numberOfChannels);

		//copy channel's data
		for (var i = 0, l = this.numberOfChannels; i < l; i++) {
			this.data.set(data.getChannelData(i), i * this.length);
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

		this.length = data.length / this.numberOfChannels;
		this.data = data;
	}
	//if array - parse channeled data
	else if (Array.isArray(data)) {
		//if separated data passed already - send sub-arrays to channels
		if (data[0] instanceof Object) {
			if (channels == null) this.numberOfChannels = data.length;
			this.length = data[0].length;
			this.data = new floatArray(this.length * this.numberOfChannels);
			for (var i = 0; i < this.numberOfChannels; i++ ) {
				this.data.set(data[i], i * this.length);
			}
		}
		//plain array passed - split array equipartially
		else {
			this.length = Math.floor(data.length / this.numberOfChannels);
			//detect zero-arrays
			if (data[0] == null) data = this.length;
			this.data = new floatArray(data);
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
		for (var i = 0; i < this.numberOfChannels; i++) {
			audioBuffer.getChannelData(i).set(this.getChannelData(i));
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

	return this.data.subarray(channel * this.length, (channel + 1) * this.length);
};


/**
 * Place data to the destination buffer, starting from the position
 */
AudioBuffer.prototype.copyFromChannel = function (destination, channelNumber, startInChannel) {
	var offset = channelNumber * this.length;
	if (startInChannel == null) startInChannel = 0;
	for (var i = startInChannel, j = 0; i < this.length && j < destination.length; i++, j++) {
		destination[j] = this.data[offset + i];
	}
};


/**
 * Place data from the source to the channel, starting (in self) from the position
 * Clone of WAAudioBuffer
 */
AudioBuffer.prototype.copyToChannel = function (source, channelNumber, startInChannel) {
	var offset = channelNumber * this.length;

	if (!startInChannel) startInChannel = 0;

	for (var i = startInChannel, j = 0; i < this.length && j < source.length; i++, j++) {
		this.data[offset + i] = source[j];
	}
};

