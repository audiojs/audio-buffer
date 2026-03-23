## [x] Mutable or immutable operations?

**Answer: Keep current mixed pattern. It is the only correct one.**

The split is not a design choice — it follows from the physical constraint of fixed-size typed arrays.

### The rule

- **Same-size transforms → mutate in-place, return `this`** (fill, reverse, invert, normalize, noise, removeDC, mix, rotate)
- **Size-changing ops → return new buffer** (trim, pad, repeat, resize, remix)
- **Queries → return value** (equal)

### Why this is correct

**1. TypedArray precedent (JS standard library uses the exact same split)**

| Mutates (same size) | Returns new (different size) |
|---|---|
| `Float32Array.reverse()` | `Float32Array.slice()` |
| `Float32Array.sort()` | `Float32Array.subarray()` |
| `Float32Array.fill()` | |
| `Float32Array.set()` | |
| `Float32Array.copyWithin()` | |

ES2023 added `toReversed()`, `toSorted()` — TC39 kept mutation as the default, added immutable as opt-in alternative. The naming convention: verb = mutates, `to` + past participle = copy.

**2. Web Audio API is mutable**

- `getChannelData()` returns a live mutable `Float32Array`
- `copyToChannel()` mutates in-place
- `AudioWorkletProcessor.process()` mutates pre-allocated output buffers
- Mozilla/Chrome docs: "never allocate in hot audio paths"

**3. DSP ecosystem is mutable**

| Library | Pattern |
|---|---|
| JUCE (C++) | `processBlock()` mutates buffer |
| SuperCollider | FFT operates in-place |
| NumPy | Mutation default, `out=` for explicit in-place |
| AudioWorklet | Mutates output arrays |

Only offline/analysis tools (librosa) return new — they aren't designed for real-time.

**4. Performance**

- AudioWorklet budget: ~2.9ms per 128-sample quantum
- Allocating 882K-sample Float32Array: ~0.5-2ms
- In-place reverse of 882K samples: ~0.1ms
- GC pauses: unpredictable, potentially 1-10ms
- Mutation = zero allocation = audio-thread safe

**5. The split is self-evident — no memorization needed**

User asks: "does this change the number of samples or channels?"
- Yes → new buffer (it physically must allocate)
- No → mutates (it physically can avoid allocation)

This matches human intuition: reversing a list rearranges it, trimming a list shortens it.

### Rejected alternatives

**All immutable**: Doubles memory for every op. Adds GC pressure. Contradicts Web Audio conventions. For what? "Safety" that audio developers don't need — they expect mutation.

**All mutable**: Size-changing ops would require resizable ArrayBuffers, invalidating existing channel views. Violates AudioBuffer spec contract. Architecturally impossible without a different internal design.

**`out=` parameter (NumPy style)**: Adds API surface for a niche need. Users who want immutable same-size transforms can `normalize(from(buffer))` — clone first, then mutate.

### Documentation

One line in readme: *"Operations that preserve buffer dimensions mutate in-place and return the same buffer for chaining. Operations that change length or channel count return a new buffer."*

---

## [x] Multiple separate entries or single `audio-buffer/util` entry?

**Answer: Both. Barrel `./util` + subpath exports coexist.**

- `audio-buffer/util` — barrel re-exporting all 15 pure ops (IDE discoverability, 1-line import)
- `audio-buffer/trim` etc — direct subpaths (optimal Vite dev perf, backward compat)
- `audio-buffer/play` — separate (async, external dep on audio-speaker)
- `"sideEffects": false` enables production tree-shaking from the barrel
