/**
 * Play AudioBuffer. Browser (Web Audio API) + Node (audio-speaker).
 *
 * @param {AudioBuffer} buffer
 * @param {{ volume?, loop?, start?, end?, autoplay?, onended?, _createWriter? }} options
 * @returns {Promise<{ play(), pause(), stop(), playing, currentTime }>}
 */
export default async function play(buffer, options = {}) {
	let opts = {
		volume: options.volume ?? 1,
		loop: options.loop || false,
		start: options.start ?? 0,
		end: options.end ?? buffer.duration,
		autoplay: options.autoplay,
		onended: options.onended
	}

	// test hook
	if (options._createWriter)
		return pumpPlay(buffer, opts, options._createWriter)

	// browser — use Web Audio API directly
	if (globalThis.AudioContext)
		return waaPlay(buffer, opts)

	// node — dynamic import audio-speaker
	let Speaker
	try { Speaker = (await import('audio-speaker')).default }
	catch { throw new Error('Node.js playback requires audio-speaker: npm i audio-speaker') }
	return pumpPlay(buffer, opts, o => Speaker(o))
}

// --- Web Audio API playback (browser) ---

let _ctx
function waaPlay(buffer, opts) {
	let ctx = _ctx ??= new AudioContext()
	let gain = ctx.createGain()
	gain.gain.value = opts.volume
	gain.connect(ctx.destination)

	let nch = buffer.numberOfChannels
	let waaBuf = ctx.createBuffer(nch, buffer.length, buffer.sampleRate)
	for (let c = 0; c < nch; c++)
		waaBuf.getChannelData(c).set(buffer.getChannelData(c))

	let source = null, playing = false, startAt = 0, offset = opts.start

	function stopSource() {
		if (!source) return
		source.onended = null
		try { source.stop() } catch {}
		source.disconnect()
		source = null
	}

	function startSource() {
		source = ctx.createBufferSource()
		source.buffer = waaBuf
		source.loop = opts.loop
		if (opts.loop) { source.loopStart = opts.start; source.loopEnd = opts.end }
		source.connect(gain)
		source.onended = () => {
			if (!playing) return
			playing = false
			source = null
			offset = opts.start
			opts.onended?.()
		}
		source.start(0, offset, opts.loop ? undefined : opts.end - offset)
		startAt = ctx.currentTime
	}

	let ctrl = {
		get currentTime() { return playing ? offset + ctx.currentTime - startAt : offset },
		get playing() { return playing },

		play() {
			if (playing) return ctrl
			if (offset >= opts.end) offset = opts.start
			playing = true
			if (ctx.state === 'suspended') ctx.resume()
			startSource()
			return ctrl
		},

		pause() {
			if (!playing) return ctrl
			offset += ctx.currentTime - startAt
			playing = false
			stopSource()
			return ctrl
		},

		stop() {
			playing = false
			offset = opts.start
			stopSource()
			return ctrl
		}
	}

	if (opts.autoplay !== false) ctrl.play()
	return ctrl
}

// --- PCM pump playback (Node / test) ---

function pumpPlay(buffer, opts, createWriter) {
	let nch = buffer.numberOfChannels, sr = buffer.sampleRate
	let startFrame = Math.floor(opts.start * sr)
	let endFrame = Math.ceil(opts.end * sr)
	let playing = false, position = startFrame, write = null, gen = 0

	function release(mode) {
		let w = write; write = null
		if (!w) return
		if (mode === 'end' && w.end) w.end()
		else if (w.close) w.close()
		else if (w.end) w.end()
	}

	function pump(token) {
		if (!playing || token !== gen || !write) return
		if (position >= endFrame) {
			if (opts.loop) position = startFrame
			else { playing = false; release('end'); opts.onended?.(); return }
		}
		let end = Math.min(position + 1024, endFrame), len = end - position
		let bytes = new Uint8Array(len * nch * 2), view = new DataView(bytes.buffer)
		for (let i = 0; i < len; i++)
			for (let c = 0; c < nch; c++) {
				let s = buffer.getChannelData(c)[position + i] * opts.volume
				view.setInt16((i * nch + c) * 2, Math.max(-32768, Math.min(32767, Math.round(s * 32767))), true)
			}
		position = end
		write(bytes, err => { if (!err) pump(token) })
	}

	let ctrl = {
		get currentTime() { return position / sr },
		get playing() { return playing },

		play() {
			if (playing) return ctrl
			if (position >= endFrame) position = startFrame
			playing = true
			let token = ++gen
			if (!write) {
				Promise.resolve(createWriter({ sampleRate: sr, channels: nch, bitDepth: 16 }))
					.then(w => { write = w; if (playing && token === gen) pump(token) })				.catch(() => { playing = false })			} else pump(token)
			return ctrl
		},

		pause() {
			if (!playing) return ctrl
			playing = false
			gen++
			return ctrl
		},

		stop() {
			playing = false
			gen++
			position = startFrame
			release('close')
			return ctrl
		}
	}

	if (opts.autoplay !== false) ctrl.play()
	return ctrl
}
