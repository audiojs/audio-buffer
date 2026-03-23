import AudioBuffer from './index.js'


export function isAudioBuffer(buffer) {
	return buffer != null && (
		buffer instanceof AudioBuffer || (
			typeof buffer.length === 'number'
			&& typeof buffer.sampleRate === 'number'
			&& typeof buffer.getChannelData === 'function'
			&& typeof buffer.duration === 'number'
		)
	)
}

// --- slice ---

export function slice(buffer, start, end) {
	let nch = buffer.numberOfChannels, sr = buffer.sampleRate
	let sub = buffer.getChannelData(0).subarray(start, end)
	let buf = new AudioBuffer(nch, sub.length, sr)
	buf.getChannelData(0).set(sub)
	for (let c = 1; c < nch; c++)
		buf.getChannelData(c).set(buffer.getChannelData(c).subarray(start, end))
	return buf
}

// --- concat ---

export function concat(...buffers) {
	if (buffers.length < 2) throw new TypeError('concat requires at least 2 buffers')
	let nch = buffers[0].numberOfChannels, sr = buffers[0].sampleRate
	let totalLen = 0
	for (let buf of buffers) {
		if (buf.sampleRate !== sr) throw Error('AudioBuffers must have same sampleRate')
		if (buf.numberOfChannels !== nch) throw Error('AudioBuffers must have same numberOfChannels')
		totalLen += buf.length
	}
	let out = new AudioBuffer(nch, totalLen, sr)
	for (let c = 0; c < nch; c++) {
		let ch = out.getChannelData(c), off = 0
		for (let buf of buffers) { ch.set(buf.getChannelData(c), off); off += buf.length }
	}
	return out
}

// --- set ---

export function set(buffer, other, offset = 0) {
	if (other.sampleRate !== buffer.sampleRate)
		throw Error('AudioBuffers must have same sampleRate')
	if (other.numberOfChannels !== buffer.numberOfChannels)
		throw Error('AudioBuffers must have same numberOfChannels')
	for (let c = 0; c < buffer.numberOfChannels; c++)
		buffer.getChannelData(c).set(other.getChannelData(c), offset)
	return buffer
}

// --- from ---

/**
 * Create AudioBuffer from various source types.
 * Accepts optional fill value/mapFn as second arg (like Array.from).
 *
 * @param {number|Float32Array|Array|AudioBuffer|ArrayBuffer} source
 * @param {number|Function|{ sampleRate?, numberOfChannels? }} optOrFn
 * @param {{ sampleRate?, numberOfChannels? }} optIfFn
 * @returns {AudioBuffer}
 */
export function from(source, optOrFn, optIfFn) {
	let filler
	if (typeof optOrFn === 'function' || typeof optOrFn === 'number') { filler = optOrFn; optOrFn = optIfFn }
	let options = optOrFn || {}
	let sr = options.sampleRate || 44100
	let nch = options.numberOfChannels
	let copy = typeof filler !== 'number' // skip data copy when filling with constant
	let buf

	if (source == null)
		throw new TypeError('source must not be null or undefined')

	if (typeof source === 'number')
		buf = new AudioBuffer(nch || 1, source, sr)

	// AudioBuffer (duck-typed) → clone
	else if (source.getChannelData && source.numberOfChannels != null) {
		let n = source.numberOfChannels
		buf = new AudioBuffer(n, source.length, options.sampleRate || source.sampleRate)
		if (copy) for (let c = 0; c < n; c++) buf.getChannelData(c).set(source.getChannelData(c))
	}

	// Float32Array / TypedArray → single channel
	else if (ArrayBuffer.isView(source)) {
		buf = new AudioBuffer(1, source.length, sr)
		if (copy) buf.getChannelData(0).set(source)
	}

	// ArrayBuffer → interpret as float32, split into channels
	else if (source instanceof ArrayBuffer) {
		let data = new Float32Array(source)
		nch = nch || 1
		let len = Math.floor(data.length / nch)
		buf = new AudioBuffer(nch, len, sr)
		if (copy) for (let c = 0; c < nch; c++)
			buf.getChannelData(c).set(data.subarray(c * len, (c + 1) * len))
	}

	else if (Array.isArray(source)) {
		if (!source.length) throw new TypeError('source array must be non-empty')
		if (Array.isArray(source[0]) || ArrayBuffer.isView(source[0])) {
			buf = new AudioBuffer(source.length, source[0].length, sr)
			if (copy) for (let c = 0; c < source.length; c++) buf.getChannelData(c).set(source[c])
		} else {
			buf = new AudioBuffer(1, source.length, sr)
			if (copy) buf.getChannelData(0).set(source)
		}
	}

	else throw new TypeError('Unsupported source type')

	return filler != null ? fill(buf, filler) : buf
}

// --- fill ---

/**
 * Fill buffer samples with a value or function.
 * fn signature: (sample, index, channel, channelData) => value
 *
 * @param {AudioBuffer} buffer
 * @param {number|Function} value
 * @param {number} start
 * @param {number} end
 * @returns {AudioBuffer}
 */
export function fill(buffer, value, start = 0, end = buffer.length) {
	if (typeof value === 'function') {
		for (let c = 0; c < buffer.numberOfChannels; c++) {
			let ch = buffer.getChannelData(c)
			for (let i = start; i < end; i++) ch[i] = value(ch[i], i, c, ch)
		}
	} else {
		for (let ch of buffer) ch.fill(value, start, end)
	}
	return buffer
}

// --- mix ---

/**
 * Blend buffer b into buffer a. Mutates a.
 * ratio: 0 = keep a, 1 = replace with b.
 * Can be a function: (sampleA, sampleB, index, channel) => value
 *
 * @param {AudioBuffer} a
 * @param {AudioBuffer} b
 * @param {number|Function} ratio
 * @param {number} offset
 * @returns {AudioBuffer} a
 */
export function mix(a, b, ratio = 0.5, offset = 0) {
	if (offset < 0) offset += a.length
	if (offset < 0 || offset >= a.length) throw new RangeError('offset out of bounds')
	let nch = Math.min(a.numberOfChannels, b.numberOfChannels)
	let fn = typeof ratio === 'function'
	let inv = fn ? 0 : 1 - ratio

	for (let c = 0; c < nch; c++) {
		let ach = a.getChannelData(c), bch = b.getChannelData(c)
		let len = Math.min(ach.length - offset, bch.length)
		if (fn)
			for (let i = 0; i < len; i++)
				ach[i + offset] = ratio(ach[i + offset], bch[i], i, c)
		else
			for (let i = 0; i < len; i++)
				ach[i + offset] = ach[i + offset] * inv + bch[i] * ratio
	}
	return a
}

// --- normalize ---

/**
 * Peak-normalize buffer so max amplitude = 1.0.
 * Preserves inter-channel balance.
 *
 * @param {AudioBuffer} buffer
 * @param {number} start
 * @param {number} end
 * @returns {AudioBuffer}
 */
export function normalize(buffer, start = 0, end = buffer.length) {
	let peak = 0
	for (let ch of buffer)
		for (let i = start; i < end; i++) {
			let v = ch[i] < 0 ? -ch[i] : ch[i]
			if (v > peak) peak = v
		}

	if (peak === 0) return buffer

	let scale = 1 / peak
	for (let ch of buffer)
		for (let i = start; i < end; i++) ch[i] *= scale

	return buffer
}

// --- trim ---

/**
 * Remove silence from both ends of buffer.
 * Returns a new buffer.
 *
 * @param {AudioBuffer} buffer
 * @param {number} threshold
 * @returns {AudioBuffer}
 */
export function trim(buffer, threshold = 0) {
	if (threshold < 0) threshold = -threshold
	let nch = buffer.numberOfChannels, len = buffer.length
	let start = len, end = 0

	for (let c = 0; c < nch; c++) {
		let ch = buffer.getChannelData(c)
		for (let i = 0; i < len && i <= start; i++)
			if ((ch[i] < 0 ? -ch[i] : ch[i]) > threshold) { start = i; break }
		for (let i = len - 1; i >= 0 && i >= end; i--)
			if ((ch[i] < 0 ? -ch[i] : ch[i]) > threshold) { end = i + 1; break }
	}

	return start >= end
		? new AudioBuffer(nch, 1, buffer.sampleRate)
		: slice(buffer, start, end)
}

// --- reverse ---

/**
 * Reverse samples in-place.
 *
 * @param {AudioBuffer} buffer
 * @param {number} start
 * @param {number} end
 * @returns {AudioBuffer}
 */
export function reverse(buffer, start, end) {
	if (start == null && end == null) {
		for (let ch of buffer) ch.reverse()
	} else {
		let s = start ?? 0, e = end ?? buffer.length
		for (let c = 0; c < buffer.numberOfChannels; c++) {
			let ch = buffer.getChannelData(c)
			let lo = s, hi = e - 1
			while (lo < hi) { let t = ch[lo]; ch[lo++] = ch[hi]; ch[hi--] = t }
		}
	}
	return buffer
}

// --- isEqual ---

/**
 * Deep equality test — same dimensions, same sample values.
 *
 * @param {AudioBuffer} a
 * @param {AudioBuffer} b
 * @returns {boolean}
 */
export function isEqual(a, b) {
	if (a === b) return true
	if (a.numberOfChannels !== b.numberOfChannels) return false
	if (a.length !== b.length) return false
	if (a.sampleRate !== b.sampleRate) return false

	for (let c = 0; c < a.numberOfChannels; c++) {
		let ach = a.getChannelData(c), bch = b.getChannelData(c)
		for (let i = 0; i < ach.length; i++)
			if (ach[i] !== bch[i]) return false
	}
	return true
}

// --- remix ---

const S = 1 / Math.SQRT2

const speaker = {
	'1>2': (s, d) => { d[0].set(s[0]); d[1].set(s[0]) },
	'1>4': (s, d) => { d[0].set(s[0]); d[1].set(s[0]) },
	'1>6': (s, d) => { d[2].set(s[0]) },
	'2>1': (s, d, len) => {
		for (let i = 0; i < len; i++) d[0][i] = 0.5 * (s[0][i] + s[1][i])
	},
	'2>4': (s, d) => { d[0].set(s[0]); d[1].set(s[1]) },
	'2>6': (s, d) => { d[0].set(s[0]); d[1].set(s[1]) },
	'4>1': (s, d, len) => {
		for (let i = 0; i < len; i++)
			d[0][i] = 0.25 * (s[0][i] + s[1][i] + s[2][i] + s[3][i])
	},
	'4>2': (s, d, len) => {
		for (let i = 0; i < len; i++) {
			d[0][i] = 0.5 * (s[0][i] + s[2][i])
			d[1][i] = 0.5 * (s[1][i] + s[3][i])
		}
	},
	'4>6': (s, d) => { d[0].set(s[0]); d[1].set(s[1]); d[4].set(s[2]); d[5].set(s[3]) },
	'6>1': (s, d, len) => {
		for (let i = 0; i < len; i++)
			d[0][i] = S * (s[0][i] + s[1][i]) + s[2][i] + 0.5 * (s[4][i] + s[5][i])
	},
	'6>2': (s, d, len) => {
		for (let i = 0; i < len; i++) {
			d[0][i] = s[0][i] + S * (s[2][i] + s[4][i])
			d[1][i] = s[1][i] + S * (s[2][i] + s[5][i])
		}
	},
	'6>4': (s, d, len) => {
		for (let i = 0; i < len; i++) {
			d[0][i] = s[0][i] + S * s[2][i]
			d[1][i] = s[1][i] + S * s[2][i]
			d[2][i] = s[4][i]
			d[3][i] = s[5][i]
		}
	},
}

/**
 * Remix (upmix/downmix) channels. Returns new buffer.
 *
 * @param {AudioBuffer} buffer
 * @param {number} channels
 * @param {'speaker'|'discrete'} interpretation
 * @returns {AudioBuffer}
 */
export function remix(buffer, channels, interpretation = 'speaker') {
	let nch = buffer.numberOfChannels
	if (channels === nch) return buffer

	let buf = new AudioBuffer(channels, buffer.length, buffer.sampleRate)
	let src = new Array(nch), dst = new Array(channels)
	for (let c = 0; c < nch; c++) src[c] = buffer.getChannelData(c)
	for (let c = 0; c < channels; c++) dst[c] = buf.getChannelData(c)

	let key = nch + '>' + channels
	if (interpretation === 'speaker' && speaker[key])
		speaker[key](src, dst, buffer.length)
	else {
		let min = Math.min(nch, channels)
		for (let c = 0; c < min; c++) dst[c].set(src[c])
	}

	return buf
}

// --- pad ---

/**
 * Pad buffer to target length. Returns new buffer.
 *
 * @param {AudioBuffer} buffer
 * @param {number} length
 * @param {number} value
 * @param {'start'|'end'} side
 * @returns {AudioBuffer}
 */
export function pad(buffer, length, value = 0, side = 'end') {
	if (length <= buffer.length) return buffer
	let buf = new AudioBuffer(buffer.numberOfChannels, length, buffer.sampleRate)
	if (value !== 0) for (let ch of buf) ch.fill(value)
	let offset = side === 'start' ? length - buffer.length : 0
	for (let c = 0; c < buffer.numberOfChannels; c++)
		buf.getChannelData(c).set(buffer.getChannelData(c), offset)
	return buf
}

// --- rotate ---

/**
 * Circular shift (rotate) samples in-place.
 * Positive offset rotates right.
 *
 * @param {AudioBuffer} buffer
 * @param {number} offset
 * @returns {AudioBuffer}
 */
export function rotate(buffer, offset) {
	for (let c = 0; c < buffer.numberOfChannels; c++) {
		let ch = buffer.getChannelData(c), len = ch.length
		let n = ((offset % len) + len) % len
		if (n === 0) continue
		rev(ch, 0, len - n - 1)
		rev(ch, len - n, len - 1)
		rev(ch, 0, len - 1)
	}
	return buffer
}

function rev(arr, lo, hi) {
	while (lo < hi) { let t = arr[lo]; arr[lo++] = arr[hi]; arr[hi--] = t }
}

// --- repeat ---

/**
 * Repeat buffer N times. Returns new buffer.
 *
 * @param {AudioBuffer} buffer
 * @param {number} times
 * @returns {AudioBuffer}
 */
export function repeat(buffer, times) {
	if (times < 1) throw new RangeError('times must be >= 1')
	if (times === 1) return from(buffer)
	let buf = new AudioBuffer(buffer.numberOfChannels, buffer.length * times, buffer.sampleRate)
	for (let c = 0; c < buffer.numberOfChannels; c++) {
		let src = buffer.getChannelData(c), dst = buf.getChannelData(c)
		for (let t = 0; t < times; t++) dst.set(src, t * buffer.length)
	}
	return buf
}

// --- removeDC ---

/**
 * Remove DC offset per channel (subtract mean).
 *
 * @param {AudioBuffer} buffer
 * @param {number} start
 * @param {number} end
 * @returns {AudioBuffer}
 */
export function removeDC(buffer, start = 0, end = buffer.length) {
	for (let c = 0; c < buffer.numberOfChannels; c++) {
		let ch = buffer.getChannelData(c)
		let sum = 0, count = end - start
		for (let i = start; i < end; i++) sum += ch[i]
		let mean = sum / count
		if (mean === 0) continue
		for (let i = start; i < end; i++) ch[i] -= mean
	}
	return buffer
}
