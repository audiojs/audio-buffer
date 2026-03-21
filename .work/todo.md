# audio-buffer v7 — consolidation plan

Absorb abandoned audiojs packages into `audio-buffer` with subpath exports.
One package, tree-shakeable, zero deps, ESM-only.

## Architecture

Subpath exports in package.json — each op is a standalone file, no barrel.

```
audio-buffer          — class (current)
audio-buffer/from     — universal factory (replaces audio-buffer-from)
audio-buffer/remix    — channel upmix/downmix (replaces audio-buffer-remix)
audio-buffer/play     — playback? (replaces audio-play, pending decision)
audio-buffer/fill     — fill with value or fn
audio-buffer/mix      — blend two buffers
audio-buffer/normalize — peak normalize
audio-buffer/trim     — remove silence
audio-buffer/reverse  — reverse samples
audio-buffer/equal    — deep equality
audio-buffer/noise    — white noise fill
audio-buffer/pad      — zero-pad to length
audio-buffer/invert   — phase invert
audio-buffer/rotate   — circular shift
audio-buffer/repeat   — repeat N times
audio-buffer/resize   — truncate / zero-pad
audio-buffer/remove-dc — DC offset removal
```

Each op is a pure function: `(buffer, ...args) => buffer`

## Absorb

| Source package | Into | Downloads/wk |
|---|---|---|
| audio-buffer-utils (27 ops) | individual subpath exports | ~4,188 |
| audio-buffer-from | audio-buffer/from | ~4,432 |
| audio-buffer-remix | audio-buffer/remix | ~42 |
| audio-play | audio-buffer/play (pending) | ~766 |

## Keep separate

- `audio-buffer-list` — different abstraction (linked list container), stays as dependent

## Drop (covered by existing API)

- clone, copy, shallow — use constructor + slice + set
- data — use getChannelData
- subbuffer — dangerous shared memory views, niche
- size — trivial: `buf.length * buf.numberOfChannels * 4`
- shift — subset of rotate

## Execution order

1. Implement `from` — universal factory, foundation for others
2. Implement tier 1 ops: fill, mix, normalize, trim, reverse, equal, noise, remix
3. Implement tier 2 ops: pad, invert, rotate, repeat, resize, remove-dc
4. Implement play (if decided yes)
5. Wire up subpath exports in package.json
6. Tests for every op
7. Update readme
8. Publish v7.0.0

## Version

v7.0.0 — claiming `audio-buffer/from` namespace from separate package is conceptual break.
