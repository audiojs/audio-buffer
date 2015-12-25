/**
 * AudioBuffer class constructor for browser
 *
 * @module audio-buffer/browser
 */

var context = require('audio-context');


/**
 * Create browser audioBuffer for the
 *
 * @constructor
 */
function AudioBuffer (channels, data, sampleRate) {
	var buffer = AudioBuffer.context.createBuffer(channels, length, sampleRate);
}


/** Set context, though can be redefined */
AudioBuffer.context = context;