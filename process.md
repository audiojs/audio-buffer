
## Principles

* It starts being very tempting to just implement WAA-compatible AudioBuffer and fuck all the various audio formats, as it is a fucking headache (see questions).
* It can be thought as a color class for images — a single audio primitive.
* More generally, it is perception frame - a chunk of data from some sensorial area, which can be treated with any possible methods. So these methods are better kept separately, as this is a raw chunk. In fact, any model can be placed on this chunk of data, like color model, fourier analysis, etc.
* The format is unambiguously defines the way to get/set/serialize/parse/etc data. It is the same as color-space in color object.
* The inner storage is always an ArrayBuffer, as far it is the fastest and the most generic object wrapper over the data. Keep only that and avoid everything else. Though there are issues with that.


## Questions

* Should we get rid of isWAA flag?
	* + it makes difficulties for surely creating non-WAA audioBuffers. We can provide always non-WAA version and leave WAA-version up to user.
		* - But how then user is supposed to use that buffer for AudioBufferSourceNode? How to convert?
			* + Leave that up to audio-buffer-utils, 'from'?
				* - But that is shit in browser-usage: `util.from(new AudioBuffer())` instead of simply `new AudioBuffer()`. Only the author will know that `util.from` converts (if possible) to WAAAudioBuffer. Same shit, different place.
	* + place `buffer.js`, which is pure polyfill, and create `index.js` with constructor?
		* - static properties, like `FloatArray` and `context` mess.
		* - `./buffer` and `./` return various buffers, which is bad.
	* + create `.from` method, returning pure buffer, and constructor, wrapping it to WAABuffer?
		* - misleading functionality for browser users, it is publicly private method.
		* + though it is pure method, returning same result, always.
		* - we should not let in browser get access publicly to fake-buffer instances. So seems that ass-way via using technical flag `isWAA` is ok.
* Should we transform data from interleaved to planar and from int to float, if the passed format of data is weird?
	* - ✔ delegate to pcm-util
* Order of params - AudioBuffer(data, channels?, rate?) or AudioBuffer(channels, data, rate?)
	* + first is intuitive, but unnatural if channel number is not passed
	* - second is compatible w/spec for `ctx.createBuffer(channels, length, rate)`, though there is no spec on constructor.
	* + all buffers have data/len as first argument, so `new AudioBuffer(1024)` is obviously for 1024 samples, stereo (?, but doesnt matter much as mono will work also if default channels = 2). vs `new AudioBuffer(2, 1024)`
	* - for ndim array is more obvious to show dimensions `new NDimArray(channels, len)`
	* - other implementations, like node-web-audio-api, include `new AudioBuffer(ch, len, rate)` order
	* + if already formatted object passed, like other abuffer or separated array, there a contradiction may occur: `new AudioBuffer([[0,1], [2,3]], 3)` - how many channels - 2 or 3? 3, but third is left empty. In case `new AudioBuffer(3, [[0,1], [2,3]])` it is also ok tho, just impossible to infer that number like `new AudioBuffer([[0,1], [2,3]])` → 2 channels.
	* Maybe make it compatible for both cases? If (ch, len, rate) - use classic, otherwise - use modern?
		* - No, it looks like untaken decision.
	* - ✔ As far buffer complies the standard - be standard. AudioBuffer(channels?, data|length, sampleRate) is ok, totally.
* Do we have to extend format, or just mimic WAABuffer?
	* + format is useful on outcoding
	* - format is not related to buffer, buffer is logical structure, not low-level
	* How to transform interleaved int16 (node default) to buffer?
		* Just to have toBuffer(format), from(array, format)?
	* - interleaved - is the first problematic property. Number type - the second.
	* ✔ keep it simple, mimic WAABuffer in node, provide WAABuffer constructor in browser
* Clone passed argument or keep reference to it?
	* + With WAAudioBuffer its cool to reference
	* - The paradigm (Buffer, TypedArrays) is to clone passed data in constructor
		* + But .slice is the opposite - buffer shares memory, array - clones.
	* + Passing ArrayBuffer to TypedArray saves reference to it, even possible to share arrayBuffer between various typedArrays
	* + Saving reference is fast and useful - just a wrapper for the data
	* - Saving reference prevents from garbage-collecting the data, right?
		* + As far we have refs on our cloned data - is also keep reference to the memory area, so references are shorter
	* ✔ Keeping reference if possible seems to be a good practice
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
	* ✔ Just polyfill ArrayBuffer, force format to be floating point
* ✘ What is the profit of keeping ndarray wrapper over the raw data?
	* - `fill` method is implementable manually quite efficiently
		* Use fill method of typedarray beneath
	* - ndarray utils can be applicable as `ndmethod(ndarray(buffer.data))`
	* + the way to access data without destruction of inner structure
		* - requires data wrapper with get/set methods
* ✘ What does it give to us keeping format as a separate property?
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
* ✘ Maybe call it sound?
	* + similar to color.
	* - for sound there might be other utils, like pulse. Sound is not necessarily the data.
