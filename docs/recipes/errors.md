# Errors and autoplay

Playback fails in two ways that need different handling. `useAudioError()`, and
`error` on `useAudioPlayer()`, report them as a union:

```ts
type AudioError =
  | {
      kind: "media";
      reason: "aborted" | "network" | "decode" | "unsupported" | "unknown";
    }
  | { kind: "playback"; reason: string };
```

A media error wins when both are set.

## The track cannot play: `kind: "media"`

From the element's own `MediaError`: the resource is unusable, and only a retry
or another `src` helps. `"network"` is worth retrying; `"unsupported"` is not.
Every control is disabled, and `<ErrorMessage>` renders its children in a live
region:

```jsx
<ErrorMessage>This episode could not be loaded.</ErrorMessage>
```

It is reported once the element has no data left to play. An element that
raises an error and still holds a buffer keeps playing, so that error is
ignored. A connection that drops part-way through reports `"network"` once
playback stops on it.

Nothing retries for you: `reload()` loads the source afresh, and the error
clears with it. See
[Reconnecting](live-stream.md#reconnecting).

## The browser refused to play: `kind: "playback"`

The resource is fine and the browser refused `play()`. `reason` is the
`DOMException` name, almost always `"NotAllowedError"`: autoplay policy, which
any user gesture lifts. The controls stay enabled.

```jsx
function PlayPrompt() {
  const { error, play } = useAudioPlayer();

  if (error?.kind === "playback") {
    return <button onClick={play}>Tap to play</button>;
  }
  return null;
}
```

`<ErrorMessage>` does not show for it.

`AbortError` is never reported. It fires whenever a `pause()` or a `src` change
overtakes a pending `play()`, as a double-click does, and the user's intent was
honoured.

A playback error clears when a `play()` succeeds, and survives a `src` change:
an autoplay block outlives the track that revealed it.
