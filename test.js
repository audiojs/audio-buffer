var AudioBuffer = require('./');
var assert = require('assert');
var now = require('performance-now');
var pcm = require('pcm-util');
var extend = require('xtend/mutable');
var stream = require('stream');


describe('Creation', function () {
	it('from Array', function () {
		var buffer = new AudioBuffer([
			0, 1, 0, 1, 0, 1
		]);

		// assert.deepEqual(buffer, [0,1,0,1]);
		assert.deepEqual(buffer.getChannelData(0), [0, 1, 0]);
		assert.deepEqual(buffer.getChannelData(1), [1, 0, 1]);
	});

	it('from Float32Array', function () {
		var buffer = new AudioBuffer(3, new Float32Array([
			0, 1, 0, 1, 0, 1, 0, 1, 0
		]));

		// assert.deepEqual(buffer, [0,1,0,1]);
		assert.deepEqual(buffer.getChannelData(0), [0, 1, 0]);
		assert.deepEqual(buffer.getChannelData(1), [1, 0, 1]);
		assert.deepEqual(buffer.getChannelData(2), [0, 1, 0]);
	});

	it('from Buffer', function () {
		var data = new Buffer(8*3);
		data.writeFloatLE(1.0, 0);
		data.writeFloatLE(-1.0, 4);
		data.writeFloatLE(0.5, 8);
		data.writeFloatLE(-0.5, 12);
		data.writeFloatLE(-1, 16);
		data.writeFloatLE(0.5, 20);

		var buffer = AudioBuffer(3, data);

		assert.deepEqual(buffer.getChannelData(0), [1, -1.0]);
		assert.deepEqual(buffer.getChannelData(1), [0.5, -0.5]);
		assert.deepEqual(buffer.getChannelData(2), [-1, 0.5]);
	});

	it('from AudioBuffer', function () {
		var a1 = AudioBuffer([1,-1,0.5,-0.5]);
		var a2 = AudioBuffer(a1);
		var a3 = AudioBuffer(a1);

		assert.notEqual(a1, a2);
		assert.notEqual(a1, a3);
		assert.deepEqual(a3.getChannelData(1), [0.5,-0.5]);
	});

	it('from ArrayBuffer', function () {
		var a = AudioBuffer( (new Float32Array([1,-1,0.5,-0.5])).buffer );
		assert.deepEqual(a.getChannelData(1), [0.5,-0.5]);
		assert.deepEqual(a.getChannelData(0), [1,-1]);
	});
});


describe('Methods', function () {
	it('getChannelData', function () {
		var buffer = new AudioBuffer(Array(4));
	});

	it('copyToChannel', function () {

	});

	it('copyFromChannel', function () {

	});
});