/**
 * AudioBuffer class constructor for browser
 *
 * @module audio-buffer/browser
 */


var context = require('audio-context');
var _AudioBuffer = require('./buffer');


//if no AudioBuffer in window - just return a polyfill
if (!AudioBuffer) return module.exports = _AudioBuffer;


/**
 * Create WebAudioBuffer
 *
 * @constructor
 */
function createBuffer (channels, data, sampleRate) {
	var buffer = new _AudioBuffer(channels, data, sampleRate);

	//create WAA buffer
	var audioBuffer = createBuffer.context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);

	//fill channels
	for (var i = 0; i < buffer.numberOfChannels; i++) {
		audioBuffer.getChannelData(i).set(buffer.getChannelData(i));
	}

	return audioBuffer;
};


/** Set context, though can be redefined */
createBuffer.context = context;


module.exports = createBuffer;