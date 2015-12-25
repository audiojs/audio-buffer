/**
 * Useful methods
 */




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
	var channels = this.numberOfChannels;
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
	var channels = this.numberOfChannels;
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