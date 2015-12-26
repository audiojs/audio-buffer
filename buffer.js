/**
 * AudioBuffer class
 *
 * @module audio-buffer/buffer
 */


var isBuffer = require('is-buffer');
var b2ab = require('buffer-to-arraybuffer');
var isBrowser = require('is-browser');


/** Get system’s AudioBuffer */
//FIXME: most probably no need in that, just in case of ponyfilling
var WebAudioBuffer = isBrowser ? window.AudioBuffer : function(){};



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
		channels = null;
	}
	//audioCtx.createBuffer() - complacent arguments
	else {
		if (sampleRate != null) this.sampleRate = sampleRate;
		if (channels != null) this.numberOfChannels = channels;
	}



	//if other audio buffer passed - create fast clone of it
	//if WAA AudioBuffer - get buffer’s data (it is bounded)
	if (data instanceof AudioBuffer || data instanceof WebAudioBuffer) {
		this.data = [];
		if (channels == null) this.numberOfChannels = data.numberOfChannels;
		if (sampleRate == null) this.sampleRate = data.sampleRate;

		//copy channel's data
		for (var i = 0, l = data.numberOfChannels; i < l; i++) {
			this.data.push(data.getChannelData(i).slice());
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

	//if number = create new array
	else if (typeof data === 'number') {
		this.data = [];
		for (var i = 0; i < this.numberOfChannels; i++ ) {
			this.data.push(new AudioBuffer.FloatArray(data));
		}
	}
	//if none passed (radical weird case)
	else if (!data) {
		//it’d be strange use-case
		throw Error('Failed to create buffer: the data is not provided or the number of frames is zero');
	}
	//if array - parse channeled data
	else if (Array.isArray(data)) {
		this.data = [];
		//if separated data passed already
		if (data[0] instanceof Object) {
			for (var i = 0; i < this.numberOfChannels; i++ ) {
				this.data.push(new AudioBuffer.FloatArray(data[i]));
			}
		}
		//plain array passed
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
	else if (data.data || data.buffer) {
		return new AudioBuffer(this.numberOfChannels, data.data || data.buffer, this.sampleRate);
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