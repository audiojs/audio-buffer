/**
 * AudioBuffer for node
 *
 * @module audio-buffer
 */


var isBuffer = require('is-buffer');
var b2ab = require('buffer-to-arraybuffer');


/** Get system’s AudioBuffer */
//FIXME: most probably no need in that, just in case of ponyfilling
var WebAudioBuffer = typeof window !== 'undefined' ? window.AudioBuffer : function(){};


module.exports = AudioBuffer;



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
		data = channels;
	}

	//audioCtx.createBuffer() - complacent arguments
	else {
		if (sampleRate != null) this.sampleRate = sampleRate;
		if (channels != null) this.numberOfChannels = channels;
	}


	//if other audio buffer passed - create fast clone of it
	if (data instanceof AudioBuffer) {
		this.data = data.data;
	}

	//if WAA AudioBuffer - get buffer’s data (it is bounded)
	//FIXME: is it really a case?
	else if (data instanceof WebAudioBuffer) {
		this.data = [];

		//copy channels data
		for (var i = 0, l = data.numberOfChannels; i < l; i++) {
			this.data[i] = data.getChannelData(i);
		}
	}

	//if node's buffer - convert to proper typed array
	//FIXME: remove this, as the latest node seems to cover buffers as views to ArrayBuffers. Or (even better) - use buffer’s ArrayBuffer here, if possible
	else if (isBuffer(data)) {
		this.data = [];
		var len = Math.floor(data.length / this.numberOfChannels);

		for (var i = 0; i < this.numberOfChannels; i++ ) {
			this.data.push(new AudioBuffer.FloatArray(b2ab(data.slice(i * len, i * len + len))));
		}
	}

	//TypedArray, Buffer, DataView etc, or ArrayBuffer
	//NOTE: node 4.x+ at least detects Buffer as ArrayBuffer view, which is, hm...
	else if (ArrayBuffer.isView(data) || data instanceof ArrayBuffer) {
		this.data = [];
		data = new AudioBuffer.FloatArray(data.buffer || data);
		var len = data.length / this.numberOfChannels;
		for (var i = 0; i < this.numberOfChannels; i++ ) {
			this.data.push(data.slice(i* len, i * len + len));
		}
	}

	//if number = create new array
	else if (typeof data === 'number') {
		this.data = [];
		for (var i = 0; i < this.numberOfChannels; i++ ) {
			this.data.push(new AudioBuffer.FloatArray(data));
		}
	}
	//if none passed
	else if (data == null) {
		//FIXME: second reason for the default format, as what is default length, huh? Null...
		this.data = [];
		this.length = 1024;
		for (var i = 0; i < this.numberOfChannels; i++ ) {
			this.data.push(new AudioBuffer.FloatArray(this.length));
		}
	}
	//if array - parse channeled data
	else if (Array.isArray(data)) {
		this.data = [];
		//FIXME: interleaved? which number format? pcm-util should know.
		//if separated data passed already
		if (typeof data[0] !== 'number') {
			for (var i = 0; i < this.numberOfChannels; i++ ) {
				this.data.push(new AudioBuffer.FloatArray(data[i]));
			}
		}
		//plain array passed
		else {
			var len = Math.floor(data.length / this.numberOfChannels);
			for (var i = 0; i < this.numberOfChannels; i++ ) {
				this.data.push(new AudioBuffer.FloatArray(data.slice(i * len, i * len + len)));
			}
		}
	}

	//if ndarray, typedarray or other data-holder passed - redirect plain databuffer
	else if (data.data || data.buffer) {
		return AudioBuffer(channels, data.data || data.buffer, sampleRate);
	}


	//set up params
	this.length = this.data[0].length;
	this.duration = this.length / this.sampleRate;
};


/**
 * Default params
 */
AudioBuffer.prototype.numberOfChannels = 2;
AudioBuffer.prototype.sampleRate = 44100;


/** Type of storage to use */
AudioBuffer.FloatArray = Float32Array;


/**
 * Return data associated with the channel.
 *
 * @return {Array} Array containing the data
 */
AudioBuffer.prototype.getChannelData = function (channel) {
	return this.data[channel];
};


/**
 * Place data to the destination buffer, starting from the position
 */
AudioBuffer.prototype.copyFromChannel = function (destination, channelNumber, startInChannel) {
	var data = this.data[channelNumber];
	for (var i = startInChannel || 0, j = 0, l = Math.min(destination.length, this.length - i); i < l; i++, j++) {
		destination[j] = data[i];
	}
};


/**
 * Place data from the source to the channel data, starting (in self) from the position
 * Clone of WAAudioBuffer
 */
AudioBuffer.prototype.copyToChannel = function (source, channelNumber, startInChannel) {
	var data = this.data[channelNumber];
	for (var i = startInChannel || 0, j = 0; i < this.length; i++, j++) {
		data[i] = source[j];
	}
};