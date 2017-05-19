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
 *
 * @param {∀} data Any collection-like object
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

	//detect arguments
	if (options.numberOfChannels == null) {
		options.numberOfChannels = 1
	}
	if (options.sampleRate == null) {
		options.sampleRate = context && context.sampleRate || this.sampleRate
	}
	if (options.length == null) {
		if (options.duration != null) {
			options.length = Math.ceil(options.duration * options.sampleRate)
		}
		else {
			options.length = 1
		}
	}
	if (!context && !options.arrayClass) {
		options.arrayClass = Float32Array
	}

	//if existing context
	if (context && context.createBuffer) {
		//create WAA buffer
		return context.createBuffer(options.numberOfChannels, options.length, options.sampleRate)
	}
	else {
		this.length = options.length
		this.numberOfChannels = options.numberOfChannels
		this.sampleRate = options.sampleRate
		this.duration = this.length / this.sampleRate

		this.channels = []
		for (var c = 0; c < this.numberOfChannels; c++) {
			this.channels.push(new options.arrayClass(this.length))
		}
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
	//FIXME: ponder on this, whether we really need that rigorous check, it may affect performance
	if (channel >= this.numberOfChannels || channel < 0 || channel == null) throw Error('Cannot getChannelData: channel number (' + channel + ') exceeds number of channels (' + this.numberOfChannels + ')');

	return this.channels[channel]
};


/**
 * Place data to the destination buffer, starting from the position
 */
AudioBuffer.prototype.copyFromChannel = function (destination, channelNumber, startInChannel) {
	if (startInChannel == null) startInChannel = 0;
	var data = this.channels[channelNumber]
	for (var i = startInChannel, j = 0; i < this.length && j < destination.length; i++, j++) {
		destination[j] = data[i];
	}
}


/**
 * Place data from the source to the channel, starting (in self) from the position
 * Clone of WAAudioBuffer
 */
AudioBuffer.prototype.copyToChannel = function (source, channelNumber, startInChannel) {
	var data = this.channels[channelNumber]

	if (!startInChannel) startInChannel = 0;

	for (var i = startInChannel, j = 0; i < this.length && j < source.length; i++, j++) {
		data[i] = source[j];
	}
};

