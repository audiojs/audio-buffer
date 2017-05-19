'use strict';

var AudioBuffer = require('./');
var assert = require('assert');
var now = require('performance-now');
var pcm = require('pcm-util');
var extend = require('xtend/mutable');
var ctx = require('audio-context')();
var isBrowser = require('is-browser');
var t = require('tape')


t('constructor cases', function (t) {
	var a = new AudioBuffer();
	t.equal(a.length, 1);
	t.equal(a.numberOfChannels, 1);

	var b = new AudioBuffer({length: 2, numberOfChannels: 2});
	t.equal(b.length, 2);
	t.equal(b.numberOfChannels, 2);

	var c = AudioBuffer(null, {length: 2})
	t.equal(c.length, 2)
	t.equal(c.numberOfChannels, 1)

	var d = new AudioBuffer(null, {length: 0})
	t.equal(d.length, 0)
	t.equal(d.sampleRate, 44100)
	t.equal(d.numberOfChannels, 1)
	t.end()
});

t('duration', function (t) {
	var b1 = new AudioBuffer({context: null, length: 441});
	t.equal(b1.duration, 0.01)

	var b2 = new AudioBuffer({duration: .01});
	t.equal(b2.duration, 0.01)

	t.end()
});

t('sampleRate', function (t) {
	var buffer = new AudioBuffer({length: 441});
	t.equal(buffer.duration, 0.01);

	var buffer = new AudioBuffer({length: 441, sampleRate: 44100*2});
	t.equal(buffer.duration, 0.005);
	t.end()
});

t('getChannelData empty arrays', function (t) {
	var buffer = new AudioBuffer({length: 4});

	t.deepEqual(buffer.getChannelData(0), [0,0,0,0]);
	t.end()
});

t('copyToChannel', function (t) {
	var a = new AudioBuffer({numberOfChannels: 2, length: 40});
	var arr = new Float32Array(40);
	arr.fill(-0.5);

	a.copyToChannel(arr, 0, 0);

	t.deepEqual(arr, a.getChannelData(0));


	a.copyToChannel(arr, 1, 10);

	var zeros = new Float32Array(10);
	arr.set(zeros);

	t.deepEqual(arr, a.getChannelData(1));
	t.end()
});

t('copyFromChannel', function (t) {
	var a = new AudioBuffer({numberOfChannels: 2, length: 40});
	var arr = new Float32Array(40);
	a.getChannelData(0).fill(-0.5);
	a.getChannelData(1).fill(0.5);
	a.getChannelData(1).set((new Float32Array(20)).fill(-0.5), 20);

	a.copyFromChannel(arr, 0);
	t.deepEqual(arr, a.getChannelData(0));

	a.copyFromChannel(arr, 1, 10);

	var fixture = Array(10).fill(0.5).concat(Array(30).fill(-0.5));

	t.deepEqual(arr, fixture);
	t.end()
});

