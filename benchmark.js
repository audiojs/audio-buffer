var AudioBuffer = require('./');
var assert = require('assert');
var now = require('performance-now');
var pcm = require('pcm-util');
var extend = require('xtend/mutable');
var stream = require('stream');
var b2ab = require('buffer-to-arraybuffer');
var ab2b = require('arraybuffer-to-buffer');


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

	var times = 1e5;

	//class accessor
	var start = now();
	var data = [[1,2],[3,4]];
	var accessor = new Accessor(data);
	for (var i = 0; i < times; i++) {
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
	for (var i = 0; i < times; i++) {
		accessor.set(i%2, (i+1)%2, accessor.get((i+1)%2, i%2));
		accessor.length;
	}
	console.log(now() - start);

	//simple array access
	var start = now();
	var data = [[1,2],[3,4]];
	for (var i = 0; i < times; i++) {
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


it.skip('ArrayBuffer vs Buffer vs DataView', function (done) {
	this.timeout(10000);


	var number = 1024 * 10, size = 1024;

	//Convert from/to ArrayBuffer
	var time = -now();
	var data, buffer;
	for (var n = 0; n < number; n++) {
		buffer = new Buffer(size * 4);
		// data = new Float32Array(size);
		data = new Float32Array(b2ab(buffer));
		for (var i = 0; i < size; i++) {
			data[i] = Math.random();
			data[i];
		}
		buffer = ab2b(data.buffer);
	}
	time += now();
	console.log('ArrayBuffer %d ops/s', number * size / time);
	assert.equal(data[i-1], buffer.readFloatLE((i-1)*4));

	//Buffer
	var time = -now();
	for (var n = 0; n < number; n++) {
		var data = new Buffer(size * 4);
		for (var i = 0, l = size*4; i < l; i+=4) {
			data.writeFloatBE(Math.random(), i);
			data.readFloatBE(i);
		}
	}
	time += now();
	console.log('Buffer %d ops/s', number * size / time);

	//DataView
	var time = -now();
	var data;
	for (var n = 0; n < number; n++) {
		data = new DataView(new ArrayBuffer(size * 4));
		for (var i = 0, l = size*4, value; i < l; i+=4) {
			value = Math.random();
			data.setFloat32(i, value);
			data.getFloat32(i);
		}
	}
	time += now();
	console.log('DataView %d ops/s', number * size / time);
	//NOTE: haha, rounding in buffers are better than here :)
	// assert.equal(data.getFloat32(i-4,true), value);


	done();

	//Result
	//Creating Float32Array from buffer and then converting back to buffer is faster than reading/writing buffer ~2-2.8 times, both in node/browser.
	//DataView is almost the same as buffers, 5-10% faster maybe in node, in browser - 2 times faster.
	//Node team claims they’re happy with buffers performance. Seems that for buffers it’s better to copy them, for arrayBuffers - pass reference.
});


it.skip('Set of typedArrays vs DataView', function () {
	// https://jsperf.com/dataview-vs-typed-array-views/19
	//Results
	//bit twiddling is 2x faster typed arrays, which are 1.5x faster dataview
});


it.only('Create buffer vs create arraybuffer', function () {
	this.timeout(10000);

	var times = 1e6;
	var size = 1024;


	var time = -now();
	for (var i = 0; i < times; i++) {
		var b = new Buffer(size);
		b[size-1] = 1;
	}
	time += now();
	console.log('Buffer %s ops/s', times / time);


	var time = -now();
	for (var i = 0; i < times; i++) {
		var b = new ArrayBuffer(size);
		// b[size-1] = 1;
	}
	time += now();
	console.log('ArrayBuffer %s ops/s', times / time);


	var time = -now();
	var a = new Uint8Array(size);
	a[0] = 1;
	for (var i = 0; i < times; i++) {
		var b = new Buffer(a.buffer);
		b[size-1] = 1;
	}
	time += now();
	console.log('Clone arrayBuffer %s ops/s', times / time);


	var time = -now();
	var a = new Buffer(size);
	for (var i = 0; i < times; i++) {
		var b = new Buffer(a);
		b[size-1] = 1;
	}
	time += now();
	console.log('Clone buffer %s ops/s', times / time);


	//Results
	//Buffers in node x4 times faster on creation
	//Buffers in browser 25% slower on creation
	//Strangely - copying arrayBuffer is times faster
});


it.skip('Clone buffer vs clone arraybuffer', function () {
	this.timeout(10000);

	var times = 1e5;
	var size = 1024;


	//Buffer clone
	var b = new Buffer(size);
	b[size-1] = 1;
	var time = -now();
	for (var i = 0; i < times; i++) {
		b = new Buffer(b);
	}
	time += now();
	assert.equal(b[size - 1], 1)
	console.log('Buffer %s ops/s', times / time);


	//ArrayBuffers slice
	var b = new ArrayBuffer(size);
	(new Int8Array(b))[size-1] = 1;
	var time = -now();
	for (var i = 0; i < times; i++) {
		b = b.slice(0);
	}
	time += now();
	assert.equal((new Int8Array(b))[size-1], 1)
	console.log('ArrayBuffer slice %s ops/s', times / time);


	//Passing TypedArrays to Buffer
	var b = new Uint8Array(size);
	b[size-1] = 1;
	var time = -now();
	for (var i = 0, a; i < times; i++) {
		a = new Buffer(b);
	}
	time += now();
	assert.equal(b[size-1], 1)
	console.log('TypedArrays → Buffer %s ops/s', times / time);


	//TypedArrays chain
	var b = new Int8Array(size);
	b[size-1] = 1;
	var time = -now();
	for (var i = 0; i < times; i++) {
		b = new Int8Array(b);
	}
	time += now();
	assert.equal(b[size-1], 1)
	console.log('TypedArray %s ops/s', times / time);


	//Buffer/ArrayBuffer transforms chain
	var b = new Buffer(size);
	b[size-1] = 1;
	var time = -now();
	for (var i = 0; i < times; i++) {
		b = ab2b(b2ab(b));
	}
	time += now();
	assert.equal(b[size-1], 1)
	console.log('Transforms %s ops/s', times / time);



	//Results
	//Buffers in node x4 times faster on clone
	//ArrayBuffers in browser 4x times faster on clone
	//TypedArrays are ~ArrayBuffers in browser, but ultra-slow in node
	//Transforming chain is slowest in browser, same slow in node
});


it.skip('toBuffer', function () {
	this.timeout(10000);

	function a1 (ab) {
		var buffer = new Buffer(ab.byteLength);
		var view = new Uint8Array(ab);
		for (var i = 0; i < buffer.length; ++i) {
			buffer[i] = view[i];
		}
		return buffer;
	}
	function a2 (ab) {
		var view = new Uint8Array(ab);
		return new Buffer(view);
	}
	function a3 (ab) {
		return new Buffer(ab);
	}


	var times = 1e5;
	var size = 1024;


	//Cycle
	var a = new ArrayBuffer(size);
	(new Uint8Array(a))[size-1] = 1;
	var b;
	var time = -now();
	for (var i = 0; i < times; i++) {
		b = a1(a);
	}
	time += now();
	assert.equal(b[size - 1], 1)
	console.log('Cycle %s ops/s', times / time);


	//TypedArray
	var a = new ArrayBuffer(size);
	(new Uint8Array(a))[size-1] = 1;
	var b;
	var time = -now();
	for (var i = 0; i < times; i++) {
		b = a2(a);
	}
	time += now();
	assert.equal(b[size - 1], 1)
	console.log('TypedArray %s ops/s', times / time);


	//Raw typedArray
	var b;
	var time = -now();
	for (var i = 0; i < times; i++) {
		b = new Buffer(new Uint8Array(size));
	}
	time += now();
	// assert.equal(b[size - 1], 1)
	console.log('Raw TypedArray %s ops/s', times / time);


	//ArrayBuffer
	var a = new ArrayBuffer(size);
	(new Uint8Array(a))[size-1] = 1;
	var b;
	var time = -now();
	for (var i = 0; i < times; i++) {
		b = a3(a);
	}
	time += now();
	assert.equal(b[size - 1], 1)
	console.log('ArrayBuffer %s ops/s', times / time);
});