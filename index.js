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
var ndfill = require('ndarray-fill');


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
	var data;

	if (!(this instanceof AudioBuffer)) return new AudioBuffer(buffer, format);

	//if other audio buffer passed - copy it the fastest way
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

	//TODO: detect some formats from array types, like Float32Array

	//obtain format from the passed object
	this.format = pcm.normalizeFormat(pcm.getFormat(format));

	//detect buffer type, set proper self get/set methods
	//if WAA AudioBuffer - get buffer’s data (it is bounded)
	if (buffer instanceof WebAudioBuffer) {
		//do away interleaved format
		this.format.interleaved = false;

		//copy channels data
		data = [];
		for (var i = 0, l = buffer.numberOfChannels; i < l; i++) {
			data[i] = buffer.getChannelData(i);
		}

		//create ndim data accessor
		data = new NDData(data);
	}
	//if node's buffer - provide buffer methods
	else if (isBuffer(buffer)) {
		data = new BufferData(buffer, this.format);
	}
	//if ndarray - use that
	else if (isNDArray(buffer)) {
		data = buffer;
	}
	//if any type of array - use ndarray
	else if (buffer instanceof Array) {
		data = buffer;
	}
	// else if (buffer instanceof TypedArray) {

	// }
	//if array buffer - create typed array
	else if (buffer) {

	}
	//if number = create new array
	else if (typeof buffer === 'number') {
		data = new Float32Array(buffer)
	}
	//if
	else if (buffer == null) {
		data = new Float32Array(this.length);
	}
	//if some other generic object with get/set methods
	else {

	}

	//save raw data
	this.rawData = buffer;

	//set up length
	this.length = Math.floor(data.length / this.channels);

	//use ndarray as inner data storage
	this.data = new NDArray(data, [this.channels, this.length], this.interleaved ? [1, this.channels] : [this.length, 1]);
};


/**
 * Get/set methods - synonyms to NDArray’s ones
 */
AudioBuffer.prototype.get = function (channel, offset) {
	var value = this.data.get(channel, offset) || 0;
	//enforce floats
	if (!this.format.float) {
		value = pcm.convertSample(value, this.format, {float: true});
	}
	return value;
};
AudioBuffer.prototype.set = function (channel, offset, value) {
	value = value || 0;
	if (!this.format.float) {
		value = pcm.convertSample(value, {float: true}, this.format);
	}
	this.data.set(channel, offset, value);
};


/**
 * Format properties accessors
 */
Object.defineProperties(AudioBuffer.prototype, {
	/**
	 * Simple metric based on sampleRate
	 */
	duration: {
		get: function () {
			return this.length / this.sampleRate;
		},
		set: function () {
			throw Error('dutaion is read-only property');
		}
	},

	/**
	 * Number of channels accessor
	 */
	channels: {
		get: function () {
			return this.format.channels;
		},
		set: function (value) {
			//TODO: check validity of value?
			this.format.channels = value;
		}
	},

	/**
	 * WAA AudioBuffer synonym for channels
	 */
	numberOfChannels: {
		get: function () {
			return this.channels;
		},
		set: function (value) {
			this.channels = value;
		}
	},

	/**
	 * The order to access inner data.
	 */
	interleaved: {
		get: function () {
			return this.format.interleaved;
		},
		set: function (value) {
			if (value === this.format.interleaved) return;
			this.format.interleaved = value;
			this.data.stride = value ? [1, this.channels] : [this.length, 1];
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
AudioBuffer.prototype.toArray = function () {
	var result = [];
	for (var channel = 0; channel < this.channels; channel++) {
		result = result.concat(this.getChannelData(channel))
	}
	return result;
};


/**
 * Return plain value as a simple array
 */
AudioBuffer.prototype.valueOf = AudioBuffer.prototype.toArray;




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
NDData.prototype.get = function (idx) {
	var offset = idx % this.length;
	var channel = Math.floor(idx / this.length);
	return this.data[channel, offset];
};
NDData.prototype.set = function (idx, value) {
	var offset = idx % this.length;
	var channel = Math.floor(idx / this.length);
	this.data[channel, offset] = value;
};


/**
 * Typed buffer access data wrapper.
 * Because ndarrays can’t handle typed buffers.
 *
 * @constructor
 */
function BufferData (buffer, format) {
	this.data = buffer;

	//take some format values
	this.readMethodName = format.readMethodName;
	this.writeMethodName = format.writeMethodName;
	this.sampleSize = format.sampleSize;

	this.length = Math.floor(buffer.length / format.sampleSize);
};
BufferData.prototype.get = function (idx) {
	return this.data[this.readMethodName](idx * this.sampleSize);
};
BufferData.prototype.set = function (idx, value) {
	return this.data[this.writeMethodName](value, idx * this.sampleSize);
};