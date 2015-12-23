/**
 * AudioBuffer class
 *
 * @module audio-buffer
 */


var inherits = require('inherits');
var extend = require('xtend/mutable');
var pcm = require('pcm-util');
var isBuffer = require('is-buffer');
var toArrayBuffer = require('buffer-to-arraybuffer');
var WebAudioBuffer = typeof window !== 'undefined' ? window.AudioBuffer : function(){};


module.exports = AudioBuffer;




/**
 * It is impossible to directly inherit ndarray
 * that is why audiobuffer only provides wrappers for ndarray methods
 *
 * @constructor
 *
 * @param {∀} buffer Any collection-like object
 */
function AudioBuffer (data, channels, sampleRate) {
	var data;

	if (!(this instanceof AudioBuffer)) return new AudioBuffer(buffer, format);

	//preset params
	if (channels != null) this.channels = 2;
	if (sampleRate != null) this.sampleRate = 44100;


	//if other audio buffer passed - create fast clone of it
	if (buffer instanceof AudioBuffer) {
		//clone format
		//FIXME: possible performance issue on lots of operations
		this.format = extend({}, buffer.format);

		//if other format is passed - we need to recalculate it
		if (format) {
			extend(this.format, pcm.getFormat(format));
			this.format = pcm.normalizeFormat(this.format);
		}
		this.length = buffer.length;
		this.rawData = buffer.rawData;

		//FIXME: there may be an issue of shared NDArray, but as far rawData is also shared...
		this.data = buffer.data;

		return this;
	}




	//obtain format from the passed object
	extend(this, pcm.getFormat(format));
	pcm.normalizeFormat(this);

	//create chanelled data holder
	this.data = [];


	//TODO: detect some formats from array types, like Float32Array

	//detect buffer type, set proper self get/set methods
	//if WAA AudioBuffer - get buffer’s data (it is bounded)
	if (buffer instanceof WebAudioBuffer) {
		//copy channels data
		for (var i = 0, l = buffer.numberOfChannels; i < l; i++) {
			data[i] = buffer.getChannelData(i);
		}
	}
	//if node's buffer - convert to proper typed array
	//it is times faster
	else if (isBuffer(buffer)) {
		data = new BufferData(buffer, this.format);

		//save source buffer
		this.rawData = buffer;
	}
	//if number = create new array
	else if (typeof buffer === 'number') {
		data = new Float32Array(buffer);
	}
	//if none passed
	else if (buffer == null) {
		data = new Float32Array(this.format.samplesPerFrame);
	}
	//rarecase of array buffer
	else if (buffer instanceof ArrayBuffer) {
		data = new Float32Array(buffer);
	}
	//if array - parse channeled data
	else if (Array.isArray(buffer)) {
		data = buffer;
	}
	//if ndarray, array, typed array or any object with get/set
	else {
		data = buffer;
	}


	//set up params
	this.length = Math.floor(data.length / this.channels);
	this.duration = this.length / this.sampleRate;
};


/**
 * Take over default format
 */
extend(AudioBuffer.prototype, pcm.defaultFormat);


/**
 * Return data associated with the channel.
 *
 * @return {Array} Array containing the data
 */
AudioBuffer.prototype.getChannelData = function (channel) {
	var result = [];
	for (var i = 0, l = this.length; i < l; i++) {
		result.push(this.data.get(channel, i));
	}
	return result;
};


/**
 * [getChannelData description]
 *
 * @return {[type]} [description]
 */
AudioBuffer.prototype.copyFromChannel = function () {

};


/**
 * [getChannelData description]
 *
 * @return {[type]} [description]
 */
AudioBuffer.prototype.copyToChannel = function () {

};












//----------------non-standard params






/**
 * Get/set methods - synonyms to NDArray’s ones
 */
AudioBuffer.prototype.get = function (channel, offset) {
	var value = this.data.get(channel, offset) || 0;
	return value;
};
AudioBuffer.prototype.set = function (channel, offset, value) {
	value = value || 0;
	this.data.set(channel, offset, value);
};


/**
 * Set format by returning a new audio buffer
 */
AudioBuffer.prototype.setFormat = function (format) {
	xxx;
};


/**
 * Array methods
 */
AudioBuffer.prototype.slice = function () {

};


/**
 * Fill array with value or function
 */
AudioBuffer.prototype.fill = function (fn) {
	if (!(fn instanceof Function)) {
		var value = fn;
		fn = function (channel, offset) { return value; }
	}

	ndfill(this.data, fn);
	return this;
};


/**
 * Array methods
 */
AudioBuffer.prototype.copyWithin = function () {

};



/**
 * Array methods
 */
AudioBuffer.prototype.reverse = function () {

};


/**
 * Array methods
 */
AudioBuffer.prototype.sort = function () {

};


/**
 * Return new AudioBuffer with mapped values
 */
AudioBuffer.prototype.map = function () {

};


/**
 * Array methods
 */
AudioBuffer.prototype.concat = function () {

};


/**
 * Array methods
 */
AudioBuffer.prototype.reduce = function () {

};


/**
 * Just create a clone of audioBuffer
 */
AudioBuffer.prototype.clone = function () {
	return AudioBuffer(this.transfer(this.buffer), this.format);
};


/**
 * NDarray methods to utilise ndarray-ops
 * Extend ndarray?
 */
AudioBuffer.prototype.shape
AudioBuffer.prototype.stride
AudioBuffer.prototype.offset
AudioBuffer.prototype.data
AudioBuffer.prototype.get
AudioBuffer.prototype.set
AudioBuffer.prototype.index
AudioBuffer.prototype.dtype
AudioBuffer.prototype.size
AudioBuffer.prototype.order
AudioBuffer.prototype.dimension
AudioBuffer.prototype.lo
AudioBuffer.prototype.hi
AudioBuffer.prototype.step

// function (methName) {
// 	this[methName] = function () {
// 		this.data[methName].apply(this, arguments);
// 	}
// }


/**
 * Util methods
 */
AudioBuffer.maxSampleRate = 192000;
AudioBuffer.minSampleRate = 3000;

AudioBuffer.prototype.mapChannels
AudioBuffer.prototype.resample
AudioBuffer.prototype.volume
AudioBuffer.prototype.loudness
AudioBuffer.prototype.toStream
AudioBuffer.prototype.frequencies
AudioBuffer.prototype.average
AudioBuffer.prototype.slowdown



/**
 * Return array, representing inner data
 */
AudioBuffer.prototype.toArray = function (format) {
	var channels = this.channels;
	var length = this.length;
	var result = Array(channels * length);

	for (var channel = 0; channel < channels; channel++) {
		for (var offset = 0; offset < length; offset++) {
			result[this.interleaved ? offset * channels + channel : length * channel + offset ] = this.get(channel, offset);
		}
	}

	return result;
};


/**
 * Return buffer, representing inner data
 */
AudioBuffer.prototype.toBuffer = function (format) {
	var channels = this.channels;
	var length = this.length;
	var result = new Buffer(channels * length * this.format.sampleSize);

	for (var channel = 0; channel < channels; channel++) {
		for (var offset = 0; offset < length; offset++) {
			result[this.interleaved ? offset * channels + channel : length * channel + offset ] = this.get(channel, offset);
		}
	}
};


/**
 * Return plain value as a simple array
 */
AudioBuffer.prototype.valueOf = AudioBuffer.prototype.toArray;