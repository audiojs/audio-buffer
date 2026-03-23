import test from 'tst'
import { is, ok, throws, almost } from 'tst'
import AudioBuffer from '../index.js'
import { from, fill, mix, normalize, trim, reverse, equal, noise, remix, pad, invert, rotate, repeat, resize, removeDC } from '../util.js'

// --- from ---

test('from > number creates empty buffer', () => {
	let b = from(10)
	is(b.length, 10)
	is(b.numberOfChannels, 1)
	is(b.sampleRate, 44100)
})

test('from > number with options', () => {
	let b = from(5, { sampleRate: 48000, numberOfChannels: 2 })
	is(b.length, 5)
	is(b.numberOfChannels, 2)
	is(b.sampleRate, 48000)
})

test('from > null creates 1-sample buffer', () => {
	let b = from(null)
	is(b.length, 1)
	is(b.numberOfChannels, 1)
})

test('from > Float32Array as single channel', () => {
	let b = from(new Float32Array([1, 2, 3]))
	is(b.numberOfChannels, 1)
	is(b.length, 3)
	is(b.getChannelData(0)[0], 1)
	is(b.getChannelData(0)[2], 3)
})

test('from > Float32Array is a copy', () => {
	let src = new Float32Array([1, 2])
	let b = from(src)
	src[0] = 99
	is(b.getChannelData(0)[0], 1)
})

test('from > Int16Array converts to float32', () => {
	let b = from(new Int16Array([0, 16384, -16384]))
	is(b.numberOfChannels, 1)
	is(b.length, 3)
})

test('from > Array of Float32Arrays as multi-channel', () => {
	let b = from([new Float32Array([1, 2]), new Float32Array([3, 4])])
	is(b.numberOfChannels, 2)
	is(b.length, 2)
	is(b.getChannelData(0)[1], 2)
	is(b.getChannelData(1)[0], 3)
})

test('from > Array of plain arrays', () => {
	let b = from([[1, 2, 3], [4, 5, 6]])
	is(b.numberOfChannels, 2)
	is(b.length, 3)
	almost(b.getChannelData(0)[0], 1, 1e-6)
	almost(b.getChannelData(1)[2], 6, 1e-6)
})

test('from > Array of numbers as single channel', () => {
	let b = from([0.1, 0.2, 0.3])
	is(b.numberOfChannels, 1)
	is(b.length, 3)
	almost(b.getChannelData(0)[0], 0.1, 1e-6)
})

test('from > AudioBuffer clones', () => {
	let src = AudioBuffer.fromArray([new Float32Array([1, 2])], 48000)
	let b = from(src)
	is(b.length, 2)
	is(b.sampleRate, 48000)
	is(b.getChannelData(0)[0], 1)
	b.getChannelData(0)[0] = 99
	is(src.getChannelData(0)[0], 1)
})

test('from > ArrayBuffer as float32', () => {
	let f = new Float32Array([0.5, -0.5, 0.25, -0.25])
	let b = from(f.buffer, { numberOfChannels: 2 })
	is(b.numberOfChannels, 2)
	is(b.length, 2)
	almost(b.getChannelData(0)[0], 0.5, 1e-6)
	almost(b.getChannelData(1)[0], 0.25, 1e-6)
})

test('from > rejects empty array', () => {
	throws(() => from([]))
})

test('from > rejects unsupported type', () => {
	throws(() => from('hello'))
})

// --- fill ---

test('fill > constant value', () => {
	let b = new AudioBuffer(2, 4, 44100)
	fill(b, 0.5)
	is([...b.getChannelData(0)], [0.5, 0.5, 0.5, 0.5])
	is([...b.getChannelData(1)], [0.5, 0.5, 0.5, 0.5])
})

test('fill > with range', () => {
	let b = new AudioBuffer(1, 5, 44100)
	fill(b, 1, 1, 3)
	is([...b.getChannelData(0)], [0, 1, 1, 0, 0])
})

test('fill > with function', () => {
	let b = new AudioBuffer(1, 4, 44100)
	fill(b, (_s, i) => i * 0.25)
	almost(b.getChannelData(0)[0], 0, 1e-6)
	almost(b.getChannelData(0)[1], 0.25, 1e-6)
	almost(b.getChannelData(0)[2], 0.5, 1e-6)
	almost(b.getChannelData(0)[3], 0.75, 1e-6)
})

test('fill > function receives channel index', () => {
	let b = new AudioBuffer(2, 3, 44100)
	fill(b, (_s, _i, c) => c)
	is([...b.getChannelData(0)], [0, 0, 0])
	is([...b.getChannelData(1)], [1, 1, 1])
})

test('fill > returns buffer for chaining', () => {
	let b = new AudioBuffer(1, 2, 44100)
	is(fill(b, 1), b)
})

// --- mix ---

test('mix > blends at default ratio 0.5', () => {
	let a = AudioBuffer.fromArray([new Float32Array([1, 1, 1])], 44100)
	let b = AudioBuffer.fromArray([new Float32Array([0, 0, 0])], 44100)
	mix(a, b)
	almost(a.getChannelData(0)[0], 0.5, 1e-6)
	almost(a.getChannelData(0)[1], 0.5, 1e-6)
})

test('mix > ratio 0 keeps a unchanged', () => {
	let a = AudioBuffer.fromArray([new Float32Array([1, 1])], 44100)
	let b = AudioBuffer.fromArray([new Float32Array([0, 0])], 44100)
	mix(a, b, 0)
	almost(a.getChannelData(0)[0], 1, 1e-6)
})

test('mix > ratio 1 replaces with b', () => {
	let a = AudioBuffer.fromArray([new Float32Array([1, 1])], 44100)
	let b = AudioBuffer.fromArray([new Float32Array([0.3, 0.7])], 44100)
	mix(a, b, 1)
	almost(a.getChannelData(0)[0], 0.3, 1e-6)
	almost(a.getChannelData(0)[1], 0.7, 1e-6)
})

test('mix > with offset', () => {
	let a = AudioBuffer.fromArray([new Float32Array([1, 1, 1, 1])], 44100)
	let b = AudioBuffer.fromArray([new Float32Array([0, 0])], 44100)
	mix(a, b, 0.5, 2)
	almost(a.getChannelData(0)[0], 1, 1e-6)
	almost(a.getChannelData(0)[1], 1, 1e-6)
	almost(a.getChannelData(0)[2], 0.5, 1e-6)
	almost(a.getChannelData(0)[3], 0.5, 1e-6)
})

test('mix > negative offset', () => {
	let a = AudioBuffer.fromArray([new Float32Array([1, 1, 1, 1])], 44100)
	let b = AudioBuffer.fromArray([new Float32Array([0, 0])], 44100)
	mix(a, b, 0.5, -2) // same as offset 2
	almost(a.getChannelData(0)[0], 1, 1e-6)
	almost(a.getChannelData(0)[1], 1, 1e-6)
	almost(a.getChannelData(0)[2], 0.5, 1e-6)
	almost(a.getChannelData(0)[3], 0.5, 1e-6)
})

test('mix > with function', () => {
	let a = AudioBuffer.fromArray([new Float32Array([1, 2])], 44100)
	let b = AudioBuffer.fromArray([new Float32Array([3, 4])], 44100)
	mix(a, b, (sa, sb) => sa + sb)
	almost(a.getChannelData(0)[0], 4, 1e-6)
	almost(a.getChannelData(0)[1], 6, 1e-6)
})

test('mix > multichannel', () => {
	let a = AudioBuffer.fromArray([new Float32Array([1]), new Float32Array([1])], 44100)
	let b = AudioBuffer.fromArray([new Float32Array([0]), new Float32Array([0])], 44100)
	mix(a, b, 0.5)
	almost(a.getChannelData(0)[0], 0.5, 1e-6)
	almost(a.getChannelData(1)[0], 0.5, 1e-6)
})

test('mix > shorter b clips to b length', () => {
	let a = AudioBuffer.fromArray([new Float32Array([1, 1, 1])], 44100)
	let b = AudioBuffer.fromArray([new Float32Array([0])], 44100)
	mix(a, b, 1)
	almost(a.getChannelData(0)[0], 0, 1e-6)
	almost(a.getChannelData(0)[1], 1, 1e-6)
})

test('mix > returns a for chaining', () => {
	let a = new AudioBuffer(1, 2, 44100)
	let b = new AudioBuffer(1, 2, 44100)
	is(mix(a, b), a)
})

// --- normalize ---

test('normalize > scales peak to 1.0', () => {
	let b = AudioBuffer.fromArray([new Float32Array([0.25, -0.5, 0.1])], 44100)
	normalize(b)
	almost(b.getChannelData(0)[1], -1.0, 1e-6)
	almost(b.getChannelData(0)[0], 0.5, 1e-6)
	almost(b.getChannelData(0)[2], 0.2, 1e-6)
})

test('normalize > preserves inter-channel balance', () => {
	let b = AudioBuffer.fromArray([
		new Float32Array([0.5, 0.25]),
		new Float32Array([0.1, 0.05])
	], 44100)
	normalize(b)
	almost(b.getChannelData(0)[0], 1.0, 1e-6)
	almost(b.getChannelData(1)[0], 0.2, 1e-6)
})

test('normalize > silent buffer unchanged', () => {
	let b = new AudioBuffer(1, 4, 44100)
	normalize(b)
	is([...b.getChannelData(0)], [0, 0, 0, 0])
})

test('normalize > with range', () => {
	let b = AudioBuffer.fromArray([new Float32Array([0.1, 0.5, 0.2, 0.1])], 44100)
	normalize(b, 1, 3)
	almost(b.getChannelData(0)[0], 0.1, 1e-6)
	almost(b.getChannelData(0)[1], 1.0, 1e-6)
	almost(b.getChannelData(0)[2], 0.4, 1e-6)
	almost(b.getChannelData(0)[3], 0.1, 1e-6)
})

test('normalize > returns buffer', () => {
	let b = new AudioBuffer(1, 2, 44100)
	is(normalize(b), b)
})

// --- trim ---

test('trim > removes leading and trailing silence', () => {
	let b = AudioBuffer.fromArray([new Float32Array([0, 0, 1, 0.5, 0, 0])], 44100)
	let t = trim(b)
	is(t.length, 2)
	is([...t.getChannelData(0)], [1, 0.5])
})

test('trim > with threshold', () => {
	let b = AudioBuffer.fromArray([new Float32Array([0.01, 0.01, 0.5, 0.01, 0.01])], 44100)
	let t = trim(b, 0.05)
	is(t.length, 1)
	almost(t.getChannelData(0)[0], 0.5, 1e-6)
})

test('trim > negative threshold treated as absolute', () => {
	let b = AudioBuffer.fromArray([new Float32Array([0.01, 0.5, 0.01])], 44100)
	let t = trim(b, -0.05)
	is(t.length, 1)
	almost(t.getChannelData(0)[0], 0.5, 1e-6)
})

test('trim > all silence returns 1-sample buffer', () => {
	let b = new AudioBuffer(1, 10, 44100)
	let t = trim(b)
	is(t.length, 1)
	is(t.getChannelData(0)[0], 0)
})

test('trim > multichannel uses union of non-silent regions', () => {
	let b = AudioBuffer.fromArray([
		new Float32Array([0, 1, 0, 0]),
		new Float32Array([0, 0, 0, 1])
	], 44100)
	let t = trim(b)
	is(t.length, 3)
	is([...t.getChannelData(0)], [1, 0, 0])
	is([...t.getChannelData(1)], [0, 0, 1])
})

test('trim > returns new buffer', () => {
	let b = AudioBuffer.fromArray([new Float32Array([0, 1, 0])], 44100)
	let t = trim(b)
	ok(t !== b)
})

// --- reverse ---

test('reverse > reverses samples in-place', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 2, 3, 4])], 44100)
	reverse(b)
	is([...b.getChannelData(0)], [4, 3, 2, 1])
})

test('reverse > multichannel', () => {
	let b = AudioBuffer.fromArray([
		new Float32Array([1, 2]),
		new Float32Array([3, 4])
	], 44100)
	reverse(b)
	is([...b.getChannelData(0)], [2, 1])
	is([...b.getChannelData(1)], [4, 3])
})

test('reverse > sub-range', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 2, 3, 4, 5])], 44100)
	reverse(b, 1, 4)
	is([...b.getChannelData(0)], [1, 4, 3, 2, 5])
})

test('reverse > returns buffer', () => {
	let b = new AudioBuffer(1, 2, 44100)
	is(reverse(b), b)
})

// --- equal ---

test('equal > identical buffers', () => {
	let a = AudioBuffer.fromArray([new Float32Array([1, 2, 3])], 44100)
	let b = AudioBuffer.fromArray([new Float32Array([1, 2, 3])], 44100)
	ok(equal(a, b))
})

test('equal > same reference', () => {
	let a = new AudioBuffer(1, 3, 44100)
	ok(equal(a, a))
})

test('equal > different values', () => {
	let a = AudioBuffer.fromArray([new Float32Array([1, 2, 3])], 44100)
	let b = AudioBuffer.fromArray([new Float32Array([1, 2, 4])], 44100)
	ok(!equal(a, b))
})

test('equal > different length', () => {
	let a = new AudioBuffer(1, 3, 44100)
	let b = new AudioBuffer(1, 4, 44100)
	ok(!equal(a, b))
})

test('equal > different channels', () => {
	let a = new AudioBuffer(1, 3, 44100)
	let b = new AudioBuffer(2, 3, 44100)
	ok(!equal(a, b))
})

test('equal > different sampleRate', () => {
	let a = new AudioBuffer(1, 3, 44100)
	let b = new AudioBuffer(1, 3, 48000)
	ok(!equal(a, b))
})

test('equal > multichannel', () => {
	let a = AudioBuffer.fromArray([new Float32Array([1]), new Float32Array([2])], 44100)
	let b = AudioBuffer.fromArray([new Float32Array([1]), new Float32Array([2])], 44100)
	ok(equal(a, b))
	b.getChannelData(1)[0] = 3
	ok(!equal(a, b))
})

// --- noise ---

test('noise > fills with values in -1..1', () => {
	let b = new AudioBuffer(1, 100, 44100)
	noise(b)
	let ch = b.getChannelData(0)
	let hasNonZero = false
	for (let i = 0; i < ch.length; i++) {
		ok(ch[i] >= -1 && ch[i] <= 1)
		if (ch[i] !== 0) hasNonZero = true
	}
	ok(hasNonZero)
})

test('noise > with range', () => {
	let b = new AudioBuffer(1, 10, 44100)
	noise(b, 3, 7)
	is(b.getChannelData(0)[0], 0)
	is(b.getChannelData(0)[9], 0)
	let ch = b.getChannelData(0)
	let noiseSum = 0
	for (let i = 3; i < 7; i++) noiseSum += Math.abs(ch[i])
	ok(noiseSum > 0)
})

test('noise > multichannel', () => {
	let b = new AudioBuffer(2, 50, 44100)
	noise(b)
	let ch0 = b.getChannelData(0), ch1 = b.getChannelData(1)
	let same = true
	for (let i = 0; i < 50; i++) if (ch0[i] !== ch1[i]) { same = false; break }
	ok(!same)
})

test('noise > returns buffer', () => {
	let b = new AudioBuffer(1, 2, 44100)
	is(noise(b), b)
})

// --- invert ---

test('invert > negates all samples', () => {
	let b = AudioBuffer.fromArray([new Float32Array([0.5, -0.3, 0, 1])], 44100)
	invert(b)
	almost(b.getChannelData(0)[0], -0.5, 1e-6)
	almost(b.getChannelData(0)[1], 0.3, 1e-6)
	almost(b.getChannelData(0)[2], 0, 1e-6)
	almost(b.getChannelData(0)[3], -1, 1e-6)
})

test('invert > with range', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 1, 1, 1])], 44100)
	invert(b, 1, 3)
	is([...b.getChannelData(0)], [1, -1, -1, 1])
})

test('invert > double invert restores original', () => {
	let b = AudioBuffer.fromArray([new Float32Array([0.1, -0.7, 0.5])], 44100)
	invert(b)
	invert(b)
	almost(b.getChannelData(0)[0], 0.1, 1e-6)
	almost(b.getChannelData(0)[1], -0.7, 1e-6)
})

test('invert > returns buffer', () => {
	let b = new AudioBuffer(1, 2, 44100)
	is(invert(b), b)
})

// --- rotate ---

test('rotate > positive rotates right', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 2, 3, 4, 5])], 44100)
	rotate(b, 2)
	is([...b.getChannelData(0)], [4, 5, 1, 2, 3])
})

test('rotate > negative rotates left', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 2, 3, 4, 5])], 44100)
	rotate(b, -1)
	is([...b.getChannelData(0)], [2, 3, 4, 5, 1])
})

test('rotate > full length is no-op', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 2, 3])], 44100)
	rotate(b, 3)
	is([...b.getChannelData(0)], [1, 2, 3])
})

test('rotate > zero is no-op', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 2, 3])], 44100)
	rotate(b, 0)
	is([...b.getChannelData(0)], [1, 2, 3])
})

test('rotate > larger than length wraps', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 2, 3])], 44100)
	rotate(b, 7)
	is([...b.getChannelData(0)], [3, 1, 2])
})

test('rotate > multichannel', () => {
	let b = AudioBuffer.fromArray([
		new Float32Array([1, 2, 3]),
		new Float32Array([4, 5, 6])
	], 44100)
	rotate(b, 1)
	is([...b.getChannelData(0)], [3, 1, 2])
	is([...b.getChannelData(1)], [6, 4, 5])
})

test('rotate > returns buffer', () => {
	let b = new AudioBuffer(1, 3, 44100)
	is(rotate(b, 1), b)
})

// --- pad ---

test('pad > pads end with zeros', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 2])], 44100)
	let p = pad(b, 5)
	is(p.length, 5)
	is([...p.getChannelData(0)], [1, 2, 0, 0, 0])
})

test('pad > pads end with value', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 2])], 44100)
	let p = pad(b, 4, 0.5)
	is([...p.getChannelData(0)], [1, 2, 0.5, 0.5])
})

test('pad > pads start', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 2])], 44100)
	let p = pad(b, 5, 0, 'start')
	is(p.length, 5)
	is([...p.getChannelData(0)], [0, 0, 0, 1, 2])
})

test('pad > already long enough returns same buffer', () => {
	let b = new AudioBuffer(1, 5, 44100)
	is(pad(b, 3), b)
	is(pad(b, 5), b)
})

test('pad > multichannel', () => {
	let b = AudioBuffer.fromArray([
		new Float32Array([1]),
		new Float32Array([2])
	], 44100)
	let p = pad(b, 3)
	is([...p.getChannelData(0)], [1, 0, 0])
	is([...p.getChannelData(1)], [2, 0, 0])
	is(p.sampleRate, 44100)
})

// --- repeat ---

test('repeat > repeats buffer N times', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 2])], 44100)
	let r = repeat(b, 3)
	is(r.length, 6)
	is([...r.getChannelData(0)], [1, 2, 1, 2, 1, 2])
})

test('repeat > times=1 clones', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 2])], 44100)
	let r = repeat(b, 1)
	is(r.length, 2)
	is([...r.getChannelData(0)], [1, 2])
	ok(r !== b)
})

test('repeat > multichannel', () => {
	let b = AudioBuffer.fromArray([
		new Float32Array([1]),
		new Float32Array([2])
	], 44100)
	let r = repeat(b, 2)
	is([...r.getChannelData(0)], [1, 1])
	is([...r.getChannelData(1)], [2, 2])
})

test('repeat > rejects times < 1', () => {
	let b = new AudioBuffer(1, 2, 44100)
	throws(() => repeat(b, 0))
	throws(() => repeat(b, -1))
})

// --- resize ---

test('resize > truncate', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 2, 3, 4, 5])], 44100)
	let r = resize(b, 3)
	is(r.length, 3)
	is([...r.getChannelData(0)], [1, 2, 3])
})

test('resize > extend zero-pads', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 2])], 44100)
	let r = resize(b, 5)
	is(r.length, 5)
	is([...r.getChannelData(0)], [1, 2, 0, 0, 0])
})

test('resize > same length returns same buffer', () => {
	let b = new AudioBuffer(1, 5, 44100)
	is(resize(b, 5), b)
})

test('resize > multichannel', () => {
	let b = AudioBuffer.fromArray([
		new Float32Array([1, 2, 3]),
		new Float32Array([4, 5, 6])
	], 44100)
	let r = resize(b, 2)
	is(r.numberOfChannels, 2)
	is([...r.getChannelData(0)], [1, 2])
	is([...r.getChannelData(1)], [4, 5])
})

// --- remove-dc ---

test('removeDC > removes DC offset', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1, 1, 1, 1])], 44100)
	removeDC(b)
	almost(b.getChannelData(0)[0], 0, 1e-6)
	almost(b.getChannelData(0)[1], 0, 1e-6)
})

test('removeDC > asymmetric signal', () => {
	let b = AudioBuffer.fromArray([new Float32Array([2, 4, 6, 8])], 44100)
	removeDC(b)
	almost(b.getChannelData(0)[0], -3, 1e-5)
	almost(b.getChannelData(0)[1], -1, 1e-5)
	almost(b.getChannelData(0)[2], 1, 1e-5)
	almost(b.getChannelData(0)[3], 3, 1e-5)
})

test('removeDC > zero signal unchanged', () => {
	let b = new AudioBuffer(1, 4, 44100)
	removeDC(b)
	is([...b.getChannelData(0)], [0, 0, 0, 0])
})

test('removeDC > per-channel', () => {
	let b = AudioBuffer.fromArray([
		new Float32Array([2, 2]),
		new Float32Array([4, 4])
	], 44100)
	removeDC(b)
	almost(b.getChannelData(0)[0], 0, 1e-6)
	almost(b.getChannelData(1)[0], 0, 1e-6)
})

test('removeDC > with range', () => {
	let b = AudioBuffer.fromArray([new Float32Array([0, 2, 4, 0])], 44100)
	removeDC(b, 1, 3) // mean of [2,4] = 3, so [-1, 1]
	is(b.getChannelData(0)[0], 0) // untouched
	almost(b.getChannelData(0)[1], -1, 1e-5)
	almost(b.getChannelData(0)[2], 1, 1e-5)
	is(b.getChannelData(0)[3], 0) // untouched
})

test('removeDC > returns buffer', () => {
	let b = new AudioBuffer(1, 2, 44100)
	is(removeDC(b), b)
})

// --- remix ---

test('remix > mono to stereo (speaker)', () => {
	let b = AudioBuffer.fromArray([new Float32Array([0.5, -0.5])], 44100)
	let r = remix(b, 2)
	is(r.numberOfChannels, 2)
	is([...r.getChannelData(0)], [0.5, -0.5])
	is([...r.getChannelData(1)], [0.5, -0.5])
})

test('remix > stereo to mono (speaker)', () => {
	let b = AudioBuffer.fromArray([
		new Float32Array([1, 0]),
		new Float32Array([0, 1])
	], 44100)
	let r = remix(b, 1)
	is(r.numberOfChannels, 1)
	almost(r.getChannelData(0)[0], 0.5, 1e-6)
	almost(r.getChannelData(0)[1], 0.5, 1e-6)
})

test('remix > same channel count returns same buffer', () => {
	let b = new AudioBuffer(2, 10, 44100)
	is(remix(b, 2), b)
})

test('remix > discrete mode copies matching channels', () => {
	let b = AudioBuffer.fromArray([
		new Float32Array([1, 2]),
		new Float32Array([3, 4])
	], 44100)
	let r = remix(b, 3, 'discrete')
	is(r.numberOfChannels, 3)
	is([...r.getChannelData(0)], [1, 2])
	is([...r.getChannelData(1)], [3, 4])
	is([...r.getChannelData(2)], [0, 0])
})

test('remix > discrete downmix drops extra channels', () => {
	let b = AudioBuffer.fromArray([
		new Float32Array([1]),
		new Float32Array([2]),
		new Float32Array([3])
	], 44100)
	let r = remix(b, 1, 'discrete')
	is(r.numberOfChannels, 1)
	is(r.getChannelData(0)[0], 1)
})

test('remix > mono to 5.1 puts mono in center', () => {
	let b = AudioBuffer.fromArray([new Float32Array([1])], 44100)
	let r = remix(b, 6)
	is(r.getChannelData(0)[0], 0)
	is(r.getChannelData(1)[0], 0)
	is(r.getChannelData(2)[0], 1)
})

test('remix > 5.1 to stereo', () => {
	let S = 1 / Math.SQRT2
	let b = AudioBuffer.fromArray([
		new Float32Array([1]),
		new Float32Array([0]),
		new Float32Array([1]),
		new Float32Array([0]),
		new Float32Array([0]),
		new Float32Array([0])
	], 44100)
	let r = remix(b, 2)
	almost(r.getChannelData(0)[0], 1 + S, 1e-4)
	almost(r.getChannelData(1)[0], S, 1e-4)
})
