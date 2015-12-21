var AudioBuffer = require('./');
var Speaker = require('audio-speaker');
var assert = require('assert');
var now = require('performance-now');
var pcm = require('pcm-util');
var extend = require('xtend/mutable');
var stream = require('stream');


describe('Format', function () {
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

	it('Change format in runtime');

	it('Buffer int', function () {
		var data = new Buffer(8*2);
		data.writeInt16LE(32767, 0);
		data.writeInt16LE(-32767, 2);
		data.writeInt16LE(0, 4);
		data.writeInt16LE(12000, 6);

		var buffer = AudioBuffer(data);

		assert.deepEqual(buffer.get(0, 0), 32767);
		assert.deepEqual(buffer.get(0, 1), 0);
		assert.deepEqual(buffer.get(1, 0), -32767);
		assert.deepEqual(buffer.get(1, 1), 12000);

	});

	it('Buffer float', function () {
		var data = new Buffer(8*3);
		data.writeFloatLE(1.0, 0);
		data.writeFloatLE(-1.0, 4);
		data.writeFloatLE(0.5, 8);
		data.writeFloatLE(-0.5, 12);
		data.writeFloatLE(-1, 16);
		data.writeFloatLE(0.5, 20);

		var buffer = AudioBuffer(data, {
			float: true,
			channels: 3
		});

		//interleaved case
		assert.deepEqual(buffer.getChannelData(0), [1, -0.5]);
		assert.deepEqual(buffer.getChannelData(1), [-1, -1]);
		assert.deepEqual(buffer.getChannelData(2), [0.5, 0.5]);

		//planar
		buffer.interleaved = false;
		assert.deepEqual(buffer.getChannelData(0), [1, -1.0]);
		assert.deepEqual(buffer.getChannelData(1), [0.5, -0.5]);
		assert.deepEqual(buffer.getChannelData(2), [-1, 0.5]);
	});

	it('Create from AudioBuffer', function () {
		var a1 = AudioBuffer([1,2,3,4]);
		var a2 = AudioBuffer(a1);

		var a3 = AudioBuffer(a1, {float: true});

		assert.notEqual(a1, a2);
		assert.notEqual(a1, a3);
		assert.notEqual(a1.format, a2.format);
		assert.notEqual(a1.format, a3.format);

		assert.deepEqual(a1.format, a2.format);


		assert.deepEqual(a3.format, pcm.normalizeFormat(extend(pcm.getFormat(pcm.defaultFormat), {float: true})));
	});
});


describe('Accessors', function () {
	it('get/set', function () {
		var buffer = new AudioBuffer(Array(4));

		assert.equal(buffer.get(1, 1), 0);

		buffer.set(0, 0, 1);
		buffer.set(1, 0, -1);
		buffer.set(0, 1, 1);
		buffer.set(1, 1, -1);

		assert.equal(buffer.get(0, 0), 1);
		assert.equal(buffer.get(1, 0), -1);
		assert.equal(buffer.get(0, 1), 1);
		assert.equal(buffer.get(1, 1), -1);
	});
});


describe('Array methods', function () {
	it('Fill', function () {
		var a = AudioBuffer([1,2,3,4]);
		a.fill(1);

		assert.deepEqual(a.toArray(), [1,1,1,1]);

		a.fill(function (channel, offset) { return channel + offset });

		assert.deepEqual(a.toArray(), [0,1,1,2]);
	});

	it('toArray', function () {
		var a = AudioBuffer(4, {interleaved: true});

		a.set(0,0,10);
		a.set(1,0,20);
		a.set(0,1,30);
		a.set(1,1,40);

		assert.deepEqual(a.getChannelData(0), [10, 30]);
		assert.deepEqual(a.getChannelData(1), [20, 40]);
		assert.deepEqual(a.toArray(), [10, 20, 30, 40]);

		//TODO: ponder on this
		// a.interleaved = false;
		// assert.deepEqual(a.toArray(), [10, 20, 30, 40]);
	});
});


describe('NDArray comapatability', function () {

});


describe('AudioBuffer comapatability', function () {

});


describe('Performance', function () {
	it.skip('NDData accessor vs class', function () {
		function Accessor (data) {
			this.data = data;
			this.length = data[0].length;
		};
		Accessor.prototype.get = function (channel, offset) {
			return this.data[channel, offset];
		};
		Accessor.prototype.set = function (channel, offset, value) {
			this.data[channel, offset] = value;
		};

		//class accessor
		var start = now();
		var data = [[1,2],[3,4]];
		var accessor = new Accessor(data);
		for (var i = 0; i < 1000000; i++) {
			accessor.set(i%2, (i+1)%2, accessor.get((i+1)%2, i%2));
			accessor.length;
		}
		console.log(now() - start);

		//object accessor
		var start = now();
		var data = [[1,2],[3,4]];
		var accessor = {
			get: function (channel, offset) {
				return data[channel, offset];
			},
			set: function (channel, offset, value) {
				data[channel, offset] = value;
			},
			length: data[0].length
		};
		for (var i = 0; i < 1000000; i++) {
			accessor.set(i%2, (i+1)%2, accessor.get((i+1)%2, i%2));
			accessor.length;
		}
		console.log(now() - start);

		//simple array access
		var start = now();
		var data = [[1,2],[3,4]];
		for (var i = 0; i < 1000000; i++) {
			if (i%2) {
				data[i%2][(i+1)%2] = data[(i+1)%2][i%2];
				data.length;
			} else {
				data[(i+1)%2][i%2] = data[i%2][(i+1)%2];
				data.length;
			}
		}
		console.log(now() - start);

		//Results
		//object accessor is ~4.5 faster for creating
		//but ~10% slower for accessing
		//all accessors ~2-3 times slower than array access
	});

	it.skip('Buffer read/write vs TypedArray read/write', function () {
		var size = 1024*100;
		var buffer = new Buffer(size * 4);
		var array = new Float32Array(size);
		Math.random();

		//buffer write
		var start = now();
		for (var i = 0; i < size; i++) {
			buffer.writeFloatLE(Math.random(), i*4);
		}
		console.log(now() - start);

		//array write
		var start = now();
		for (var i = 0; i < size; i++) {
			array[i] = Math.random();
		}
		console.log(now() - start);

		//Result
		//buffer write ~15 times slower, even in node.
	});


	describe.skip('Buffer stream vs object stream vs functions', function () {
		var size = 1024, dataLength = 1024*5;
		Math.random();

		// //functions set
		function read () {
			var chunk = new Float32Array(size);
			for (var j = 0; j < size; j++) {
				chunk[j] = Math.random();
			}
			return chunk;
		}
		function transform (chunk) {
			for (var j = 0; j < size; j++) {
				chunk[j];// *= 1.2;
			}
			return chunk;
		}
		function write (chunk) {
			for (var j = 0; j < size; j++) {
				chunk[j];
			}
		}

		it('Buffer stream', function (done) {
			//buffer stream
			var c = 0;
			var bsRead = new stream.Readable();
			bsRead._read = function () {
				// console.log('read', size * 4)
				var data = new Buffer(size * 4);
				for (var i = 0; i < size*4; i+=4) {
					data.writeFloatLE(Math.random(), i);
				}

				c++;
				if (c >= dataLength) this.push(null);
				else this.push(data);
			};
			var bsTransform1 = new stream.Transform();
			bsTransform1._transform = function (chunk, enc, cb) {
				// console.log('transform', chunk.length)
				for (var i = 0; i < size*4; i+=4) {
					chunk.readFloatLE(i);
				}
				this.push(chunk);
				cb();
			};
			var bsTransform2 = new stream.Transform();
			bsTransform2._transform = function (chunk, enc, cb) {
				for (var i = 0; i < size*4; i+=4) {
					chunk.readFloatLE(i);
				}
				this.push(chunk);
				cb();
			};
			var bsWrite = new stream.Writable();
			bsWrite._write = function (chunk, enc, cb) {
				// console.log('write', chunk.readFloatLE(0))
				for (var i = 0; i < size*4; i+=4) {
					chunk.readFloatLE(i);
				}
				cb();
			};


			var start = now();
			bsRead.on('end', function () {
				console.log('Buffer stream', now() - start);
				done();
			});
			bsRead.pipe(bsTransform1).pipe(bsTransform2).pipe(bsWrite);
		});


		it('Buffer stream in object mode', function (done) {
			//buffer stream
			var c = 0;
			var bsRead = new stream.Readable({objectMode: true});
			bsRead._read = function () {
				// console.log('read', size * 4)
				var data = new Buffer(size * 4);
				for (var i = 0; i < size*4; i+=4) {
					data.writeFloatLE(Math.random(), i);
				}

				c++;
				if (c >= dataLength) this.push(null);
				else this.push(data);
			};
			var bsTransform1 = new stream.Transform({objectMode: true});
			bsTransform1._transform = function (chunk, enc, cb) {
				// console.log('transform', chunk.length)
				for (var i = 0; i < size*4; i+=4) {
					chunk.readFloatLE(i);
				}
				this.push(chunk);
				cb();
			};
			var bsTransform2 = new stream.Transform({objectMode: true});
			bsTransform2._transform = function (chunk, enc, cb) {
				for (var i = 0; i < size*4; i+=4) {
					chunk.readFloatLE(i);
				}
				this.push(chunk);
				cb();
			};
			var bsWrite = new stream.Writable({objectMode: true});
			bsWrite._write = function (chunk, enc, cb) {
				// console.log('write', chunk.readFloatLE(0))
				for (var i = 0; i < size*4; i+=4) {
					chunk.readFloatLE(i);
				}
				cb();
			};


			var start = now();
			bsRead.on('end', function () {
				console.log('Buffer stream in obj mode', now() - start);
				done();
			});
			bsRead.pipe(bsTransform1).pipe(bsTransform2).pipe(bsWrite);
		});

		it('Object stream', function (done) {
			//object stream
			var c = 0;
			var osRead = new stream.Readable({objectMode: true});
			osRead._read = function () {
				var chunk = read(chunk);

				c++;
				if (c >= dataLength) this.push(null);
				else this.push(chunk);
			};
			var osTransform1 = new stream.Transform({objectMode: true});
			osTransform1._transform = function (chunk, enc, cb) {
				transform(chunk);
				cb(null, chunk);
			};
			var osTransform2 = new stream.Transform({objectMode: true});
			osTransform2._transform = function (chunk, enc, cb) {
				transform(chunk);
				cb(null, chunk);
			};
			var osWrite = new stream.Writable({objectMode: true});
			osWrite._write = function (chunk, enc, cb) {
				// console.log('write', chunk[0]);
				write(chunk);
				cb();
			};

			var start = now();
			osRead.on('end', function () {
				console.log('Object stream', now() - start);
				done();
			});
			osRead.pipe(osTransform1).pipe(osTransform2).pipe(osWrite);

		});

		it('Function chain', function (done) {
			var start = now();
			for (var i = 0; i < dataLength; i++) {
				write(transform(transform(read())));
			}
			console.log('Function chain', now() - start);

			done();
		});



		//Results, in order of tests: Buffer stream, Object stream, Fn chain

		//Noop
		//700 vs 400 vs 150 in browser
		//450 vs 1600 vs 600 in node

		//Manipulating the Float32 data
		//1600 vs 120 vs 80 in browser
		//1700 vs 160 vs 130 in node

		//Manipulating the Int16 data
		//450 vs ... in node

		//Buffer streams are good only for node and only for non-reading/writing ops.
		//Object streams are not that really slow comparing to plain array chains, though the mechanism of chained audio-nodes might be somewhat useful.

		//Strangely that passing buffers in object mode is ~5% slower - what is the sense?
	});


	it.skip('ArrayBuffer vs Buffer', function (done) {
		function ab2b (ab) {
			var buffer = new Buffer(ab.byteLength);
			var view = new Uint8Array(ab);
			for (var i = 0; i < buffer.length; ++i) {
				buffer[i] = view[i];
			}
			return buffer;
		}

		var number = 1024 * 20, size = 1024;

		//ArrayBuffer
		var start = now();
		var data, buffer;
		for (var n = 0; n < number; n++) {
			data = new Float32Array(size);
			for (var i = 0; i < size; i++) {
				data[i] = Math.random();
			}
			buffer = ab2b(data.buffer);
		}
		console.log('ArrayBuffer', now() - start);

		//Buffer
		var start = now();
		for (var n = 0; n < number; n++) {
			var data = new Buffer(size * 4);
			for (var i = 0, l = size*4; i < l; i+=4) {
				data.writeFloatLE(Math.random(), i);
			}
		}
		console.log('Buffer', now() - start);

		done();

		//Result
		//Using Float32Array and then converting to buffer is faster than reading/writing buffer ~2-2.8 times, both in node/browser.
	});
});