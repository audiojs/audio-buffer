var AudioBuffer = require('./');
var assert = require('assert');
var now = require('performance-now');
var pcm = require('pcm-util');
var extend = require('xtend/mutable');
var stream = require('stream');
var NDArray = require('ndarray');
var ctx = require('audio-context');
var isBrowser = require('is-browser');


describe('Creation', function () {
	it('from Array', function () {
		var buffer = new AudioBuffer([
			0, 1, 0, 1, 0, 1
		]);

		assert.deepEqual(buffer.getChannelData(0), [0, 1, 0]);
		assert.deepEqual(buffer.getChannelData(1), [1, 0, 1]);
	});

	it('from Float32Array', function () {
		var buffer = new AudioBuffer(3, new Float32Array([
			0, 1, 0, 1, 0, 1, 0, 1, 0
		]));

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

	it('from NDArray', function () {
		var a = AudioBuffer( new NDArray(new Float32Array([1,-1,0.5,-0.5]), [2,2]) );
		assert.deepEqual(a.getChannelData(1), [0.5,-0.5]);
		assert.deepEqual(a.getChannelData(0), [1,-1]);

		//FIXME: there might need more tests, like detection of ndarray dimensions etc
	});

	it('from Array of Arrays', function () {
		var a = AudioBuffer( 3, [ [1, -1], [0.5,-0.5], [-1, 0.5] ] );
		assert.deepEqual(a.getChannelData(2), [-1,0.5]);
		assert.deepEqual(a.getChannelData(1), [0.5,-0.5]);
		assert.deepEqual(a.getChannelData(0), [1,-1]);
	});

	if (isBrowser) it('from WAABuffer', function () {
		var buf = ctx.createBuffer(3, 2, 44100);

		buf.getChannelData(0).fill(1);
		buf.getChannelData(1).fill(-1);
		buf.getChannelData(2).fill(0);

		var a = AudioBuffer( 3, buf );
		assert.deepEqual(a.getChannelData(2), [0,0]);
		assert.deepEqual(a.getChannelData(1), [-1,-1]);
		assert.deepEqual(a.getChannelData(0), [1,1]);

		//test that data is bound
		//NOTE: it seems that is shouldn’t - we can gracefully clone the buffer
		// buf.getChannelData(2).fill(0.5);
		// assert.deepEqual(a.getChannelData(2), buf.getChannelData(2));

	});

	it('clone', function () {
		var a = new AudioBuffer(3, 10, 1000);
		var b = new AudioBuffer(a);
		var c = new AudioBuffer(2, a, 2000);

		assert.notEqual(a, b);
		assert.deepEqual(a.getChannelData(0), b.getChannelData(0));
		assert.deepEqual(a.getChannelData(2), b.getChannelData(2));
		assert.equal(b.numberOfChannels, 3);
		assert.equal(b.sampleRate, 1000);
		assert.equal(c.sampleRate, 2000);
		assert.equal(c.numberOfChannels, 2);
		assert.deepEqual(a.getChannelData(0), c.getChannelData(0));
		assert.deepEqual(a.getChannelData(1), c.getChannelData(1));

		if (isBrowser) {
			var a = ctx.createBuffer(2,10,44100);
			var b = new AudioBuffer(a);

			assert.notEqual(a, b);
			assert.notEqual(a.getChannelData(0), b.getChannelData(0));
			assert.deepEqual(a.getChannelData(0), b.getChannelData(0));
		}
	});
});


describe('Params', function () {
	it('duration', function () {
		var buffer = new AudioBuffer(1, Array(441));
		assert.equal(buffer.duration, 0.01);

		assert.throws(function () {
			var buffer = new AudioBuffer();
			assert.equal(buffer.duration, 0);
		});
	});

	it('length', function () {
		var buffer = new AudioBuffer(1, Array(12));
		assert.equal(buffer.length, 12);
		var buffer = new AudioBuffer(2, Array(12));
		assert.equal(buffer.length, 6);
		var buffer = new AudioBuffer(3, Array(12));
		assert.equal(buffer.length, 4);
		var buffer = new AudioBuffer(4, Array(12));
		assert.equal(buffer.length, 3);
		var buffer = new AudioBuffer(6, Array(12));
		assert.equal(buffer.length, 2);
	});

	it('sampleRate', function () {
		var buffer = new AudioBuffer(1, Array(441));
		assert.equal(buffer.duration, 0.01);

		var buffer = new AudioBuffer(1, Array(441), 44100*2);
		assert.equal(buffer.duration, 0.005);
	});
});


describe('Methods', function () {
	it('getChannelData', function () {
		var buffer = new AudioBuffer(1, Array(4));

		assert.deepEqual(buffer.getChannelData(0), [0,0,0,0]);
	});

	it('copyToChannel', function () {
		var a = new AudioBuffer(2, 40);
		var arr = new Float32Array(40);
		arr.fill(-0.5);

		a.copyToChannel(arr, 0, 0);

		assert.deepEqual(arr, a.getChannelData(0));


		a.copyToChannel(arr, 1, 10);

		var zeros = new Float32Array(10);
		arr.set(zeros);

		assert.deepEqual(arr, a.getChannelData(1));
	});

	it('copyFromChannel', function () {
		var a = new AudioBuffer(2, 40);
		var arr = new Float32Array(40);
		a.getChannelData(0).fill(-0.5);
		a.getChannelData(1).fill(0.5);
		a.getChannelData(1).set((new Float32Array(20)).fill(-0.5), 20);

		a.copyFromChannel(arr, 0);
		assert.deepEqual(arr, a.getChannelData(0));

		a.copyFromChannel(arr, 1, 10);

		var fixture = Array(10).fill(0.5).concat(Array(30).fill(-0.5));

		assert.deepEqual(arr, fixture);
	});
});


describe('WAABuffer for the browser', function () {

});