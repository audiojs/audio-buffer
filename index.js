/**
 * AudioBuffer class
 *
 * @module audio-buffer/buffer
 */
'use strict'

var getContext = require('audio-context')

module.exports = AudioBuffer


/**
 * @constructor
 */
function AudioBuffer (context, options) {
	if (!(this instanceof AudioBuffer)) return new AudioBuffer(context, options);

	//if no options passed
	if (!options) {
		options = context
		context = options && options.context
	}

	if (!options) options = {}

	if (context === undefined) context = getContext()

	//detect params
	if (options.numberOfChannels == null) {
		options.numberOfChannels = 1
	}
	if (options.sampleRate == null) {
		options.sampleRate = context && context.sampleRate || this.sampleRate
	}
	if (options.length == null) {
		if (options.duration != null) {
			options.length = options.duration * options.sampleRate
		}
		else {
			options.length = 1
		}
	}

	//if existing context
	if (context && context.createBuffer) {
		//create WAA buffer
		return context.createBuffer(options.numberOfChannels, Math.ceil(options.length), options.sampleRate)
	}

	//exposed properties
	this.length = Math.ceil(options.length)
	this.numberOfChannels = options.numberOfChannels
	this.sampleRate = options.sampleRate
	this.duration = this.length / this.sampleRate

	//data is stored as a planar sequence
	this._data = new Float32Array(this.length * this.numberOfChannels)

	//channels data is cached as subarrays
	this._channelData = []
	for (var c = 0; c < this.numberOfChannels; c++) {
		this._channelData.push(this._data.subarray(c * this.length, (c+1) * this.length ))
	}
}


/**
 * Default params
 */
AudioBuffer.prototype.numberOfChannels = 1;
AudioBuffer.prototype.sampleRate = 44100;


/**
 * Return data associated with the channel.
 *
 * @return {Array} Array containing the data
 */
AudioBuffer.prototype.getChannelData = function (channel) {
	if (channel >= this.numberOfChannels || channel < 0 || channel == null) throw Error('Cannot getChannelData: channel number (' + channel + ') exceeds number of channels (' + this.numberOfChannels + ')');

	return this._channelData[channel]
};


/**
 * Place data to the destination buffer, starting from the position
 */
AudioBuffer.prototype.copyFromChannel = function (destination, channelNumber, startInChannel) {
	if (startInChannel == null) startInChannel = 0;
	var data = this._channelData[channelNumber]
	for (var i = startInChannel, j = 0; i < this.length && j < destination.length; i++, j++) {
		destination[j] = data[i];
	}
}


/**
 * Place data from the source to the channel, starting (in self) from the position
 */
AudioBuffer.prototype.copyToChannel = function (source, channelNumber, startInChannel) {
	var data = this._channelData[channelNumber]

	if (!startInChannel) startInChannel = 0;

	for (var i = startInChannel, j = 0; i < this.length && j < source.length; i++, j++) {
		data[i] = source[j];
	}
};

