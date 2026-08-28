Task: split src/Shared/sharedFunctions.ts by domain
Break the file into modules named for what they do. Behaviour-preserving refactor — no logic changes, no signature changes, no new exports beyond the moves themselves.

Do the prerequisite cleanup first
Finding C7 reports duplication that overlaps this file's neighbourhood: positionOf duplicates the now-dead getClientXY, and Orientation is declared twice. Resolve those before splitting — otherwise you have to decide which new module each duplicate belongs in, which is a decision you'd rather delete than make.

Report what you found: whether the duplicates are actually dead, and where each surviving declaration should live.

Read before deciding
I have not inspected this file, so treat the grouping below as a hypothesis to check, not a plan to execute. Read the file and every import site first, then propose the split. If the contents don't support the axis, say so rather than forcing it.

The expected axis is domain, giving roughly:

Module	Likely contents
formatTime.ts	formatTime, and any clamping useTimeDisplay depends on
sliderMath.ts	calculateSliderValue, getOffset, getProgress
clamp.ts	The volume / rate / currentTime guards, if they live here rather than on the write path
areNumbersClose.ts	Or fold into whichever module is its only consumer
A second axis worth checking
Anything in this file that touches the DOM — pointer geometry, getBoundingClientRect, client coordinates — does not belong in a "shared" module regardless of how the rest splits. The slider math and time formatting are pure and platform-free; DOM-coupled helpers are not, and separating them is the one boundary that would matter if a platform-free core is ever extracted. Flag anything in this category even if you don't move it.

Two constraints
Do not add a barrel re-export. Keeping sharedFunctions.ts around re-exporting everything preserves the single import surface, which is the exact pattern that cost 4,025 B → 1,137 B gzipped in finding P1-a. Update the import sites instead. sideEffects: false is set, so this is likely safe either way — but the project has already been bitten once by an aggregated surface, and the import churn is a one-time cost.

Question the directory name while you're there. "Shared" describes provenance, not content. If each new module is named for its domain, Shared/ may have nothing left to justify it — formatTime could sit next to TimeDisplay/, slider math next to Slider/. That's the more meaningful reorganisation and costs the same diff. Propose it; don't do it unilaterally.

Carry the comments across intact
Some helpers carry empirical facts that nothing else in the repo holds — measured browser error types, why a clamp exists, the retain-until-changed reasoning. Move those comments with their functions, unchanged. Do not take the opportunity to trim them; comment work is a separate pass.

Verify
npx tsc --noEmit --project tsconfig.app.json and npx tsc --noEmit --project tsconfig.node.json, npx eslint ., npx prettier --check ., npx vitest run — the suite should be green with no test changes beyond import paths. If a test needs more than an import-path edit, stop and report: that means the split changed behaviour.

Then npx tsup and check dist/index.mjs still starts with "use client" (finding S3 — the Rollup treeshake pass strips the banner if only the tsup banner option is set, hence the onSuccess re-apply), plus npx attw --pack . --profile esm-only.

If P1-a's tree-shaking result can be re-measured cheaply, do it — a PlayButton-only import should not regress from ~1,137 B gzipped.

Report
The proposed module boundaries, and anything that resisted the domain axis
C7 resolution: what was dead, what survived, where it went
Import sites touched, and any that were surprising
Whether Shared/ should dissolve, with a recommendation
Anything DOM-coupled you flagged
Land it alone
Wide import churn across many files. Do not fold this into another change — it should be reviewable as pure motion. Do not commit.