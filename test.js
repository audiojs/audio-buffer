import test from 'tst'
import { is, ok, throws, almost } from 'tst'
import AudioBuffer from './index.js'

// --- constructor ---

test('constructor > options object', () => {
	let b = new AudioBuffer({ length: 441, sampleRate: 44100, numberOfChannels: 2 })
	is(b.length, 441)
	is(b.sampleRate, 44100)
	is(b.numberOfChannels, 2)
	almost(b.duration, 0.01, 1e-10)
})

test('constructor > positional args', () => {
	let b = new AudioBuffer(2, 100, 44100)
	is(b.numberOfChannels, 2)
	is(b.length, 100)
	is(b.sampleRate, 44100)
})

test('constructor > truncates fractional length', () => {
	let b = new AudioBuffer({ length: 220.5, sampleRate: 44100 })
	is(b.length, 220)
})

test('constructor > defaults numberOfChannels to 1', () => {
	let b = new AudioBuffer({ length: 100, sampleRate: 44100 })
	is(b.numberOfChannels, 1)
})

test('constructor > rejects missing options', () => {
	throws(() => new AudioBuffer())
	throws(() => new AudioBuffer({}))
	throws(() => new AudioBuffer(null))
})

test('constructor > rejects missing/invalid sampleRate', () => {
	throws(() => new AudioBuffer({ length: 100 }))
	throws(() => new AudioBuffer({ sampleRate: 100, length: 10 }))
	throws(() => new AudioBuffer({ sampleRate: 800000, length: 10 }))
	throws(() => new AudioBuffer({ sampleRate: NaN, length: 10 }))
})

test('constructor > rejects invalid length', () => {
	throws(() => new AudioBuffer({ sampleRate: 44100, length: -1 }))
	throws(() => new AudioBuffer({ sampleRate: 44100, length: 0 }))
	throws(() => new AudioBuffer({ sampleRate: 44100, length: NaN }))
	throws(() => new AudioBuffer({ sampleRate: 44100 }))
})

test('constructor > rejects invalid numberOfChannels', () => {
	throws(() => new AudioBuffer({ sampleRate: 44100, length: 10, numberOfChannels: 0 }))
	throws(() => new AudioBuffer({ sampleRate: 44100, length: 10, numberOfChannels: -1 }))
	throws(() => new AudioBuffer({ sampleRate: 44100, length: 10, numberOfChannels: NaN }))
})

test('constructor > boundary sampleRate values', () => {
	let lo = new AudioBuffer({ length: 1, sampleRate: 3000 })
	is(lo.sampleRate, 3000)
	let hi = new AudioBuffer({ length: 1, sampleRate: 768000 })
	is(hi.sampleRate, 768000)
	throws(() => new AudioBuffer({ length: 1, sampleRate: 2999 }))
	throws(() => new AudioBuffer({ length: 1, sampleRate: 768001 }))
})

// --- properties are read-only ---

test('properties > read-only', () => {
	let b = new AudioBuffer(1, 100, 44100)
	throws(() => { b.sampleRate = 22050 })
	throws(() => { b.length = 50 })
	throws(() => { b.numberOfChannels = 2 })
	throws(() => { b.duration = 0 })
})

// --- getChannelData ---

test('getChannelData > returns Float32Array', () => {
	let b = new AudioBuffer({ length: 4, sampleRate: 44100 })
	let ch = b.getChannelData(0)
	ok(ch instanceof Float32Array)
	is(ch.length, 4)
	is([...ch], [0, 0, 0, 0])
})

test('getChannelData > returns view (mutation visible)', () => {
	let b = new AudioBuffer(1, 10, 44100)
	b.getChannelData(0)[3] = 0.5
	is(b.getChannelData(0)[3], 0.5)
})

test('getChannelData > throws on invalid channel', () => {
	let b = new AudioBuffer(2, 10, 44100)
	throws(() => b.getChannelData(2))
	throws(() => b.getChannelData(-1))
	throws(() => b.getChannelData(null))
	throws(() => b.getChannelData(undefined))
})

// --- copyToChannel ---

test('copyToChannel > copies data', () => {
	let b = new AudioBuffer({ numberOfChannels: 2, length: 40, sampleRate: 44100 })
	let arr = new Float32Array(40).fill(-0.5)

	b.copyToChannel(arr, 0, 0)
	is([...b.getChannelData(0)], [...arr])

	b.copyToChannel(arr, 1, 10)
	let expected = new Float32Array(40)
	expected.fill(-0.5, 10)
	is([...b.getChannelData(1)], [...expected])
})

test('copyToChannel > throws on invalid channel', () => {
	let b = new AudioBuffer(2, 10, 44100)
	let src = new Float32Array(5)
	throws(() => b.copyToChannel(src, 2))
	throws(() => b.copyToChannel(src, -1))
	throws(() => b.copyToChannel(src, null))
})

test('copyToChannel > source longer than remaining space clips', () => {
	let b = new AudioBuffer(1, 4, 44100)
	let src = new Float32Array([1, 2, 3, 4, 5, 6])
	b.copyToChannel(src, 0, 2)
	is([...b.getChannelData(0)], [0, 0, 1, 2])
})

// --- copyFromChannel ---

test('copyFromChannel > copies data', () => {
	let b = new AudioBuffer({ numberOfChannels: 2, length: 40, sampleRate: 44100 })
	b.getChannelData(0).fill(-0.5)
	b.getChannelData(1).fill(0.5)
	b.getChannelData(1).set(new Float32Array(20).fill(-0.5), 20)

	let arr = new Float32Array(40)
	b.copyFromChannel(arr, 0)
	is([...arr], [...b.getChannelData(0)])

	b.copyFromChannel(arr, 1, 10)
	let expected = Array(10).fill(0.5).concat(Array(30).fill(-0.5))
	is([...arr], expected)
})

test('copyFromChannel > throws on invalid channel', () => {
	let b = new AudioBuffer(2, 10, 44100)
	let dst = new Float32Array(5)
	throws(() => b.copyFromChannel(dst, 2))
	throws(() => b.copyFromChannel(dst, -1))
	throws(() => b.copyFromChannel(dst, null))
})

test('copyFromChannel > startInChannel clips output', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 2, 3, 4])], 44100)
	let dst = new Float32Array(10)
	b.copyFromChannel(dst, 0, 2)
	is([...dst], [3, 4, 0, 0, 0, 0, 0, 0, 0, 0])
})

// --- _channels (internal planar access) ---

test('_channels > returns array of channel views', () => {
	let b = new AudioBuffer(2, 10, 44100)
	ok(Array.isArray(b._channels))
	is(b._channels.length, 2)
	is(b._channels[0].length, 10)
})

// --- static fromArray ---

test('fromArray > creates buffer from channel arrays', () => {
	let b = AudioBuffer.fromArray([
		new Float32Array([1, 2, 3]),
		new Float32Array([4, 5, 6])
	], 44100)
	is(b.numberOfChannels, 2)
	is(b.length, 3)
	is(b.getChannelData(0)[0], 1)
	is(b.getChannelData(1)[2], 6)
})

test('fromArray > rejects empty/invalid input', () => {
	throws(() => AudioBuffer.fromArray([], 44100))
	throws(() => AudioBuffer.fromArray(null, 44100))
	throws(() => AudioBuffer.fromArray(undefined, 44100))
})

// --- static filledWithVal ---

test('filledWithVal > fills all channels', () => {
	let b = AudioBuffer.filledWithVal(0.7, 2, 50, 44100)
	is(b.numberOfChannels, 2)
	is(b.length, 50)
	for (let ch = 0; ch < 2; ch++)
		for (let i = 0; i < 50; i++)
			almost(b.getChannelData(ch)[i], 0.7, 1e-6)
})

test('filledWithVal > zero fill', () => {
	let b = AudioBuffer.filledWithVal(0, 1, 10, 44100)
	is([...b.getChannelData(0)], Array(10).fill(0))
})

// --- slice ---

test('slice > returns new buffer', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 2, 3, 4, 5])], 44100)
	let s = b.slice(1, 3)
	is(s.length, 2)
	is(s.getChannelData(0)[0], 2)
	is(s.getChannelData(0)[1], 3)
	is(s.sampleRate, 44100)
})

test('slice > returns independent copy', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 2, 3])], 44100)
	let s = b.slice(0, 2)
	s.getChannelData(0)[0] = 99
	is(b.getChannelData(0)[0], 1)
})

test('slice > multichannel', () => {
	let b = AudioBuffer.fromArray([
		new Float32Array([1, 2, 3]),
		new Float32Array([4, 5, 6])
	], 44100)
	let s = b.slice(1, 3)
	is(s.numberOfChannels, 2)
	is([...s.getChannelData(0)], [2, 3])
	is([...s.getChannelData(1)], [5, 6])
})

test('slice > negative index', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 2, 3, 4, 5])], 44100)
	let s = b.slice(-2)
	is(s.length, 2)
	is([...s.getChannelData(0)], [4, 5])
})

// --- concat ---

test('concat > joins buffers', () => {
	let a = AudioBuffer.fromArray([new Float32Array([1, 2])], 44100)
	let b = AudioBuffer.fromArray([new Float32Array([3, 4])], 44100)
	let c = a.concat(b)
	is(c.length, 4)
	is([...c.getChannelData(0)], [1, 2, 3, 4])
})

test('concat > multichannel', () => {
	let a = AudioBuffer.fromArray([new Float32Array([1]), new Float32Array([2])], 44100)
	let b = AudioBuffer.fromArray([new Float32Array([3]), new Float32Array([4])], 44100)
	let c = a.concat(b)
	is(c.numberOfChannels, 2)
	is([...c.getChannelData(0)], [1, 3])
	is([...c.getChannelData(1)], [2, 4])
})

test('concat > rejects mismatched sampleRate', () => {
	let a = new AudioBuffer(1, 10, 44100)
	let b = new AudioBuffer(1, 10, 22050)
	throws(() => a.concat(b))
})

test('concat > rejects mismatched numberOfChannels', () => {
	let a = new AudioBuffer(1, 10, 44100)
	let b = new AudioBuffer(2, 10, 44100)
	throws(() => a.concat(b))
})

// --- set ---

test('set > writes data at offset', () => {
	let a = new AudioBuffer(1, 10, 44100)
	let b = AudioBuffer.fromArray([new Float32Array([0.5, 0.6])], 44100)
	a.set(b, 3)
	almost(a.getChannelData(0)[3], 0.5, 1e-6)
	almost(a.getChannelData(0)[4], 0.6, 1e-6)
	is(a.getChannelData(0)[0], 0)
	is(a.getChannelData(0)[5], 0)
})

test('set > writes at offset 0 by default', () => {
	let a = new AudioBuffer(1, 4, 44100)
	let b = AudioBuffer.fromArray([new Float32Array([1, 2])], 44100)
	a.set(b)
	is([...a.getChannelData(0)], [1, 2, 0, 0])
})

test('set > rejects mismatched sampleRate', () => {
	let a = new AudioBuffer(1, 10, 44100)
	let b = new AudioBuffer(1, 5, 22050)
	throws(() => a.set(b))
})

test('set > rejects mismatched numberOfChannels', () => {
	let a = new AudioBuffer(2, 10, 44100)
	let b = new AudioBuffer(1, 5, 44100)
	throws(() => a.set(b))
})

test('set > overflow throws RangeError', () => {
	let a = new AudioBuffer(1, 4, 44100)
	let b = AudioBuffer.fromArray([new Float32Array([1, 2, 3])], 44100)
	throws(() => a.set(b, 3))
})

// --- Symbol.iterator ---

test('Symbol.iterator > iterates channels', () => {
	let b = AudioBuffer.fromArray([
		new Float32Array([1, 2]),
		new Float32Array([3, 4])
	], 44100)
	let channels = [...b]
	is(channels.length, 2)
	is([...channels[0]], [1, 2])
	is([...channels[1]], [3, 4])
})

test('Symbol.iterator > destructuring', () => {
	let b = AudioBuffer.fromArray([
		new Float32Array([1, 2]),
		new Float32Array([3, 4])
	], 44100)
	let [left, right] = b
	is([...left], [1, 2])
	is([...right], [3, 4])
})

test('Symbol.iterator > for-of', () => {
	let b = new AudioBuffer(3, 5, 44100)
	let count = 0
	for (let ch of b) {
		ok(ch instanceof Float32Array)
		is(ch.length, 5)
		count++
	}
	is(count, 3)
})
