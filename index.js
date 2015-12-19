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

	//obtain format from the passed object
	this.format = pcm.getFormat(format);

	//if other audio buffer passed - create audio buffer with different format
	if (buffer instanceof AudioBuffer) {

	}

	//detect buffer type, set proper self get/set methods
	//if WAA AudioBuffer - get buffer’s data (it is bounded)
	if (buffer instanceof WebAudioBuffer) {
		//do away interleaved format
		this.format.interleaved = false;

		//copy channels data
		var data = [];
		for (var i = 0, l = buffer.numberOfChannels; i < l; i++) {
			data[i] = buffer.getChannelData(i);
		}

		//create ndim data accessor
		buffer = new NDData(data);
	}
	//if node's buffer - provide buffer methods
	else if (isBuffer(buffer)) {
		buffer = new BufferData(buffer, this.format);
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
function BufferData (buffer, format) {
	this.data = buffer;

	//take some format values
	this.readMethodName = format.readMethodName;
	this.writeMethodName = format.writeMethodName;
	this.sampleSize = format.sampleSize;

	this.length = Math.floor(buffer.length / format.sampleSize);
};
BufferData.prototype.get = function (idx) {
	// var offset = pcm.getOffset(channel, idx, this, this.length);
	return this.data[this.readMethodName](idx * this.sampleSize);
};
BufferData.prototype.set = function (idx, value) {
	return this.data[this.writeMethodName](value, idx * this.sampleSize);
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
	 * WAA AudioBuffer synonim for channels
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

