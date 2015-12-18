It can be thought as a color class for images — a single audio primitive.

More generally, it is perception frame - a chunk of data from some sensorial area, which can be treated with any possible methods. So these methods are better kept separately, as this is a raw chunk. In fact, any model can be placed on this chunk of data, like color model, fourier analysis, etc.

## Questions

* Think twice. What will audiobuffer give comparing to ndarray, which can’t give ndarray?
	* parsing any input argument
	* .format property
		* type: pcm,
		* channels
		* interleaved
	* fft in ndarrays already
	* resampling, reinterleaving - external ndarray methods
	* ✔ reading audiobuffer → audio-node task?
	* ✔ reading Buffer of a specific format, ie fromPcmFormat
	* ✔ toPcmFormat
	* audio-util methods: maxSampleRate, minSampleRate
	* .duration
	* .average
	* .toDecibels (different representations)
	* .loudness
	* .magnitude
	* .frequencies
	* .mapChannels
	* .map
	* .volume
	* .length (number of samples)
	* ndarray gives speed, community and supportability
* Maybe call it sound?
	* similar to color.
	* for sound there might be other utils.