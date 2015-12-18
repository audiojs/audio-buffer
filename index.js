/**
 * AudioBuffer class
 *
 * @module audio-buffer
 */


var inherits = require('inherits');
var extend = require('xtend/mutable');
var pcm = require('pcm-util');
var NDArray = require('ndarray');
var WebAudioBuffer = typeof window !== 'undefined' ? window.AudioBuffer : function(){};
var isBuffer = require('is-buffer');
var isNDArray = require('isndarray');

module.exports = AudioBuffer;




/**
 * It is impossible to directly inherit ndarray
 * that is why audiobuffer only provides wrappers for ndarray methods
 *
 * @constructor
 *
 * @param {∀} buffer Any collection-like object
 */
function AudioBuffer (buffer, format) {
	if (!(this instanceof AudioBuffer)) return new AudioBuffer(buffer, format);

	//take over the options
	extend(this, format);

	//if other audio buffer passed - create audio buffe with different format
	if (buffer instanceof AudioBuffer) {

	}

	//detect buffer type, set proper self get/set methods
	//if WAA AudioBuffer - get buffer’s data (it is bounded)
	if (buffer instanceof WebAudioBuffer) {
		//do away interleaved format
		this.interleaved = false;

		//copy channels data
		var data = [];
		for (var i = 0, l = buffer.numberOfChannels; i < l; i++) {
			data[i] = buffer.getChannelData(i);
		}
		buffer = new NDData(data);
	}
	//if node buffer - provide buffer methods
	else if (isBuffer(buffer)) {
		buffer = new BufferData(buffer, this);
	}
	//if ndarray - use that
	else if (isNDArray(buffer)) {
	}
	//if any type of array - use ndarray
	// else if (buffer instanceof Array) {

	// }
	// else if (buffer instanceof TypedArray) {

	// }
	//if array buffer - create typed array
	else if (buffer) {

	}
	//if number = create new array
	else if (typeof buffer === 'number') {
		buffer = new Float32Array(buffer)
	}
	//if
	else if (buffer == null) {
		buffer = new Float32Array(this.length);
	}
	//if some other generic object with get/set methods
	else {

	}

	//set

	//save reference to the source
	this._data = buffer;

	//set up length
	this.length = Math.floor(buffer.length / this.channels);

	//use ndarray as inner data storage
	this.data = new NDArray(buffer, [this.channels, this.length], this.interleaved ? [1, this.channels] : [this.length, 1]);
};


/**
 * N-dimensional unmergeable planar data access wrapper.
 * Like for WAA AudioBuffer, where channels data isn’t mergeable and isn’t deinterleaveable.
 *
 * @constructor
 */
function NDData (data) {
	this.data = data;
	this.length = data[0].length;
}
NDData.prototype.get = function (channel, offset) {
	return this.data[channel, offset];
};
NDData.prototype.set = function (channel, offset, value) {
	this.data[channel, offset] = value;
};


/**
 * Typed buffer access data wrapper.
 * Because ndarrays can’t handle typed buffers.
 *
 * @constructor
 */
function BufferData (buffer, type) {
	this.data = buffer;

};


/**
 * PCM-format params
 */
extend(AudioBuffer.prototype, pcm.defaultFormat);



/**
 * Get/set methods
 */
AudioBuffer.prototype.get = function (channel, offset) {
	//calc transpose idx, if required
	return this.data.get(channel, offset);
};
AudioBuffer.prototype.set = function (channel, offset, value) {
	return this.data.set(channel, offset, value);
};


/**
 * Web-audio-api synonims
 */
Object.defineProperties(AudioBuffer.prototype, {
	duration: {
		get: function () {
			return this.length / this.sampleRate;
		},
		set: function () {
			throw Error('dutaion is read-only property');
		}
	},

	numberOfChannels: {
		get: function () {
			return this.channels;
		},
		set: function () {
			xxx
		}
	},

	sampleRate: {
		get: function () {
			return this.format.sampleRate;
		},
		set: function () {
			xxx
		}
	}
});



/**
 * Return data associated with the channel.
 *
 * @return {Array} Array containing the data
 */
AudioBuffer.prototype.getChannelData = function (channel) {
	var result = [];
	for (var i = 0, l = this.length; i < l; i++) {
		result.push(this.get(channel, i));
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


/**
 * Array methods
 */
AudioBuffer.prototype.slice = function () {

};


/**
 * Array methods
 */
AudioBuffer.prototype.fill = function () {

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
 * Array methods
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
 * Return plain value as a simple array
 */
AudioBuffer.prototype.valueOf = function () {
	var result = [];
	for (var channel = 0; channel < this.channels; channel++) {
		result = result.concat(this.getChannelData(channel))
	}
	return result;
}

