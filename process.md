
## Principles

* It starts being very tempting to just implement WAA-compatible AudioBuffer and fuck all the various audio formats, as it is a fucking headache (see questions).
* It can be thought as a color class for images — a single audio primitive.
* More generally, it is perception frame - a chunk of data from some sensorial area, which can be treated with any possible methods. So these methods are better kept separately, as this is a raw chunk. In fact, any model can be placed on this chunk of data, like color model, fourier analysis, etc.
* The format is unambiguously defines the way to get/set/serialize/parse/etc data. It is the same as color-space in color object.
* The inner storage is always an ArrayBuffer, as far it is the fastest and the most generic object wrapper over the data. Keep only that and avoid everything else. Though there are issues with that.


## Questions

* Clone passed argument or keep reference to it?
	* + With WAAudioBuffer its cool to reference
	* - The paradigm (Buffer, TypedArrays) is to clone passed data in constructor
		* + But .slice is the opposite - buffer shares memory, array - clones.
	* + Passing ArrayBuffer to TypedArray saves reference to it, even possible to share arrayBuffer between various typedArrays
	* + Saving reference is fast and useful - just a wrapper for the data
	* - Saving reference prevents from garbage-collecting the data, right?
		* + As far we have refs on our cloned data - is also keep reference to the memory area, so references are shorter
* What is better: keeping data source unchanged and accessing it on any operation or converting it to fast array and then converting back?
	* + Converting, handling and converting back seems to be faster than each operation, both for browser/node both for buffer/dataview, 2+ times. In case of avoiding conversion - up to 10 times.
	* - Converting unbinds data, which is baaad, we really want to preserve data binding, but when to update source values then?
	* What is faster in typical use-cases: sync source data periodically, or per-sample access? Which are typical use-cases?
		* Ex: using WAABuffer for output, wee need to write samples ASAP, how - if we get buffer input?
			* Using WAA for that is perfect
		* Ex: in the chain of nodes we have to process volume of each sample in buffer object.
			* Simple WAA
		* Ex: calculate FFT in analyserNode from audioBuffer, ASAP.
			* getChannelData (instant), create ndarray (should be speedy), use fft (fast).
* What is the profit of keeping ndarray wrapper over the raw data?
	* - `fill` method is implementable manually quite efficiently
		* Use fill method of typedarray beneath
	* - ndarray utils can be applicable as `ndmethod(ndarray(buffer.data))`
	* + the way to access data without destruction of inner structure
		* - requires data wrapper with get/set methods
* What does it give to us keeping format as a separate property?
	* - it isn’t faster on creation, in fact having prototyped these props is faster
	* - intuitively, the buffer itself has all properties, not some inner stuff like `.format.shit`
* Is it better to keep data channeled, or single-buffer?
	* + channeled is simple to create from WAABuffer
		* - but forcing WAAAudioBuffer into some other format anyways requires whether method of preserving data-format separate from our format or converting the data, which unbinds it, which is bad.
	* + channeled is simple and fast to access
	* - chanelled takes time to convert to/from node buffers, which are stream defaults
		* + but it is a bonus on using audio-nodes
	* - chanelled is innatural if interleaved = true.
		* + it is same innatural to get channel data from such data-storage
	* - as far audioBuffer is just a wrapper, it is good to follow ImageData or TypedArray example and keep .data property as plain array.
		* + web-audio AudioBuffer innerly keeps data as a vector of typed arrays

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
	* + similar to color.
	* - for sound there might be other utils, like pulse. Sound is not necessarily the data.