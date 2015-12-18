var AudioBuffer = require('./');
var Speaker = require('audio-speaker');
var assert = require('assert');


describe('Creation', function () {
	it('Interleaved array', function () {
		var buffer = new AudioBuffer([
			0, 1, 0, 1, 0, 1
		], {channels: 2, interleaved: true});

		// assert.deepEqual(buffer, [0,1,0,1]);
		assert.deepEqual(buffer.getChannelData(0), [0, 0, 0]);
		assert.deepEqual(buffer.getChannelData(1), [1, 1, 1]);
	});
	it('Planar array', function () {
		var buffer = new AudioBuffer([
			0, 1, 0, 1, 0, 1, 0, 1, 0
		], {channels: 3, interleaved: false});

		// assert.deepEqual(buffer, [0,1,0,1]);
		assert.deepEqual(buffer.getChannelData(0), [0, 1, 0]);
		assert.deepEqual(buffer.getChannelData(1), [1, 0, 1]);
		assert.deepEqual(buffer.getChannelData(2), [0, 1, 0]);
	});
});

describe('Array methods', function () {

});

describe('NDArray comapatability', function () {

});

describe('AudioBuffer comapatability', function () {

});
