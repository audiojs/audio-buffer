/**
 * AudioBuffer — spec-compliant audio data container
 *
 * Supports both spec constructor forms:
 *   new AudioBuffer({ length, sampleRate, numberOfChannels })
 *   new AudioBuffer(numberOfChannels, length, sampleRate)
 */
export default class AudioBuffer {
	#sampleRate
	#length
	#duration
	#numberOfChannels
	#data    // Float32Array — planar storage of all channels
	#channels // Float32Array[] — subarray views per channel

	get sampleRate() { return this.#sampleRate }
	get length() { return this.#length }
	get duration() { return this.#duration }
	get numberOfChannels() { return this.#numberOfChannels }

	// internal: array of per-channel Float32Array views
	get _channels() { return this.#channels }

	constructor(options, length, sampleRate) {
		// positional form: new AudioBuffer(numberOfChannels, length, sampleRate)
		if (typeof options === 'number')
			options = { numberOfChannels: options, length, sampleRate }

		if (!options) throw TypeError('options argument is required')
		if (!options.sampleRate) throw TypeError('options.sampleRate is required')
		if (options.sampleRate < 3000 || options.sampleRate > 768000) throw TypeError('options.sampleRate must be within 3000..768000')
		if (!(options.length >= 1)) throw TypeError('options.length must be >= 1')
		if (options.numberOfChannels != null && !(options.numberOfChannels >= 1))
			throw TypeError('options.numberOfChannels must be >= 1')

		let nch = options.numberOfChannels || 1
		let len = Math.trunc(options.length)

		this.#sampleRate = options.sampleRate
		this.#numberOfChannels = nch
		this.#length = len
		this.#duration = len / options.sampleRate

		this.#data = new Float32Array(len * nch)
		let channels = this.#channels = new Array(nch)
		for (let c = 0; c < nch; c++)
			channels[c] = this.#data.subarray(c * len, (c + 1) * len)
	}

	getChannelData(channel) {
		if (!this.#channels[channel])
			throw Error('Cannot getChannelData: channel number (' + channel + ') exceeds number of channels (' + this.#numberOfChannels + ')')
		return this.#channels[channel]
	}

	copyFromChannel(destination, channelNumber, startInChannel = 0) {
		if (!this.#channels[channelNumber])
			throw Error('Cannot copyFromChannel: channel number (' + channelNumber + ') exceeds number of channels (' + this.#numberOfChannels + ')')
		let data = this.#channels[channelNumber]
		let len = Math.min(destination.length, this.#length - startInChannel)
		if (len > 0) destination.set(data.subarray(startInChannel, startInChannel + len))
	}

	copyToChannel(source, channelNumber, startInChannel = 0) {
		if (!this.#channels[channelNumber])
			throw Error('Cannot copyToChannel: channel number (' + channelNumber + ') exceeds number of channels (' + this.#numberOfChannels + ')')
		let data = this.#channels[channelNumber]
		let len = Math.min(source.length, this.#length - startInChannel)
		if (len > 0) data.set(source.subarray(0, len), startInChannel)
	}

	// --- utility methods ---

	slice(start, end) {
		let arrays = this.#channels.map(ch => ch.subarray(start, end))
		return AudioBuffer.fromArray(arrays, this.#sampleRate)
	}

	concat(other) {
		if (other.sampleRate !== this.#sampleRate)
			throw Error('AudioBuffers must have same sampleRate')
		if (other.numberOfChannels !== this.#numberOfChannels)
			throw Error('AudioBuffers must have same numberOfChannels')
		let nch = this.#numberOfChannels, aLen = this.#length, bLen = other.length
		let buf = new AudioBuffer(nch, aLen + bLen, this.#sampleRate)
		for (let c = 0; c < nch; c++) {
			let ch = buf.#channels[c]
			ch.set(this.#channels[c])
			ch.set(other.getChannelData(c), aLen)
		}
		return buf
	}

	set(other, offset = 0) {
		if (other.sampleRate !== this.#sampleRate)
			throw Error('AudioBuffers must have same sampleRate')
		if (other.numberOfChannels !== this.#numberOfChannels)
			throw Error('AudioBuffers must have same numberOfChannels')
		for (let ch = 0; ch < this.#numberOfChannels; ch++)
			this.#channels[ch].set(other.getChannelData(ch), offset)
	}

	// --- static factories ---

	static fromArray(arrays, sampleRate) {
		if (!arrays || !arrays.length) throw TypeError('arrays must be non-empty')
		let buf = new AudioBuffer(arrays.length, arrays[0].length, sampleRate)
		for (let ch = 0; ch < arrays.length; ch++)
			buf.#channels[ch].set(arrays[ch])
		return buf
	}

	static filledWithVal(val, numberOfChannels, length, sampleRate) {
		let buf = new AudioBuffer(numberOfChannels, length, sampleRate)
		buf.#data.fill(val)
		return buf
	}
}
