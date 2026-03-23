import test from 'tst'
import { is, ok } from 'tst'
import AudioBuffer from '../index.js'
import play from '../play.js'

function writerSpy() {
	let writers = []

	return {
		writers,
		createWriter: async () => {
			let state = {
				calls: [],
				pending: [],
				closed: 0,
				ended: 0,
			}

			let writer = (bytes, cb) => {
				state.calls.push(bytes)
				state.pending.push(cb)
			}

			writer.close = () => { state.closed++ }
			writer.end = () => { state.ended++ }

			writers.push(state)
			return writer
		}
	}
}

function tick() {
	return new Promise(resolve => setTimeout(resolve, 0))
}

test('play > stop releases writer and replay recreates it', async () => {
	let spy = writerSpy()
	let buf = new AudioBuffer(1, 2048, 44100)
	let ctrl = await play(buf, { autoplay: false, _createWriter: spy.createWriter })

	is(ctrl.playing, false)
	ctrl.play()
	await tick()
	is(spy.writers.length, 1)
	is(spy.writers[0].calls.length, 1)
	is(ctrl.playing, true)

	ctrl.stop()
	is(ctrl.playing, false)
	is(ctrl.currentTime, 0)
	is(spy.writers[0].closed, 1)

	spy.writers[0].pending[0]?.()
	await tick()
	is(spy.writers.length, 1)

	ctrl.play()
	await tick()
	is(spy.writers.length, 2)
	is(spy.writers[1].calls.length, 1)
	is(ctrl.playing, true)
})

test('play > natural end releases writer and can play again', async () => {
	let spy = writerSpy()
	let ended = 0
	let buf = new AudioBuffer(1, 128, 44100)
	let ctrl = await play(buf, { autoplay: false, onended: () => ended++, _createWriter: spy.createWriter })

	ctrl.play()
	await tick()
	is(spy.writers.length, 1)
	is(spy.writers[0].calls.length, 1)

	spy.writers[0].pending[0]?.()
	await tick()
	is(ctrl.playing, false)
	is(ended, 1)
	is(spy.writers[0].ended, 1)

	ctrl.play()
	await tick()
	is(spy.writers.length, 2)
	is(spy.writers[1].calls.length, 1)
	ok(ctrl.playing)
})
