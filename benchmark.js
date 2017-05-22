/**
 * Test flat over nested implementations
 *
 * Results.
 * Nested implementation is just a bit slower to create than plain typed array, but way faster to access/write channel data. We can cache subarrays to avoid that.
 *
 */
const t = require('tape')

function Nested(ch, len) {
	this.data = []
	for (let i = 0; i < ch; i++) {
		this.data[i] = new Float32Array(len)
	}
}

Nested.prototype.getChannelData = function (c) {
	return this.data[c]
}

function Flat(ch, len) {
	this.length = len
	this.data = new Float32Array(ch * len)
	this.channels = []
	for (let i = 0; i < ch; i++) {
		this.channels[i] = this.data.subarray(i * len, (i+1) * len)
	}
}

Flat.prototype.getChannelData = function (c) {
	return this.channels[c]
}



//test
let N = 1e4


t('flat create', t => {
	console.time('flat create')

	for (let i = N; i--;) {
		let a = new Flat(4, i)
	}

	console.timeEnd('flat create')

	t.end()
})

t('nested create', t => {
	console.time('nested create')

	for (let i = N; i--;) {
		let a = new Nested(4, i)
	}

	console.timeEnd('nested create')

	t.end()
})


t.test('nested getChannelData', t => {
	console.time('nested getChannelData')

	let a = new Nested(4, 1e5)
	for (let i = N; i--;) {
		let data = a.getChannelData(Math.floor(Math.random() * 4))
	}

	console.timeEnd('nested getChannelData')

	t.end()
})

t.test('flat getChannelData', t => {
	console.time('flat getChannelData')

	let a = new Flat(4, 1e5)
	for (let i = N; i--;) {
		let data = a.getChannelData(Math.floor(Math.random() * 4))
	}

	console.timeEnd('flat getChannelData')

	t.end()
})

