---
id: B1
title: "Playlist resumption is undocumented, and now more visible"
epic: features
status: open
severity: none
origin: backlog
breaking: false
---

Following `onEnded`'s pattern gives a playlist that stops after every track: a `src` change arrives loaded and paused, and nothing resumes it. Two consumer-side fixes, neither discoverable from the README — `audioProps={{ autoPlay: true }}`, which also autoplays track one and may be refused by autoplay policy (surfacing as `useAudioError()` `kind: "playback"`); or an effect keyed on the playlist index calling `play()` after `loadedmetadata`. `AudioPlayer`'s `onEnded` tooltip now says this; the README's playlist section does not.
