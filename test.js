import AudioBuffer from './index.js'
import t from 'tape'


t('options', function (t) {
	var b3 = new AudioBuffer({length: 220.5, sampleRate:44100, numberOfChannels:1});
	t.equal(b3.length, 220)

	var buffer = new AudioBuffer({length: 441, sampleRate: 44100, numberOfChannels: 1});
	t.equal(buffer.duration, 0.01);

	var buffer = new AudioBuffer({length: 441, sampleRate: 44100*2, numberOfChannels: 1});
	t.equal(buffer.duration, 0.005);

	t.end()
});

t('getChannelData empty arrays', function (t) {
	var buffer = new AudioBuffer({length: 4, sampleRate: 44100, numberOfChannels: 1});

	t.deepEqual([...buffer.getChannelData(0)], [0,0,0,0]);

	t.end()
});

t('copyToChannel', function (t) {
	var a = new AudioBuffer({numberOfChannels: 2, length: 40, sampleRate: 44100});
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
	var a = new AudioBuffer({numberOfChannels: 2, length: 40, sampleRate: 44100});
	var arr = new Float32Array(40);
	a.getChannelData(0).fill(-0.5);
	a.getChannelData(1).fill(0.5);
	a.getChannelData(1).set((new Float32Array(20)).fill(-0.5), 20);

	a.copyFromChannel(arr, 0);
	t.deepEqual(arr, a.getChannelData(0));

	a.copyFromChannel(arr, 1, 10);

	var fixture = Array(10).fill(0.5).concat(Array(30).fill(-0.5));

	t.deepEqual([...arr], fixture);

	t.end()
});
