import test from 'tst'
import { is, ok, throws, almost } from 'tst'
import AudioBuffer from '../index.js'

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
	let b = new AudioBuffer(1, 4, 44100)
	b.getChannelData(0).set(new Float32Array([1, 2, 3, 4]))
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

// --- Symbol.iterator ---

test('Symbol.iterator > iterates channels', () => {
	let b = new AudioBuffer(2, 2, 44100)
	b.getChannelData(0).set([1, 2])
	b.getChannelData(1).set([3, 4])
	let channels = [...b]
	is(channels.length, 2)
	is([...channels[0]], [1, 2])
	is([...channels[1]], [3, 4])
})

test('Symbol.iterator > destructuring', () => {
	let b = new AudioBuffer(2, 2, 44100)
	b.getChannelData(0).set([1, 2])
	b.getChannelData(1).set([3, 4])
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
