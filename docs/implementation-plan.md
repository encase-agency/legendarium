# Local completion plan

Preserve the existing artwork and intentional scroll sequences. No new dependencies.

1. Lock changed behavior with focused regression checks. Baseline: production JS 1,203,790 bytes (gzip 353,520); hero source files 16,518,015 desktop / 9,341,295 phone bytes. These are artifact sizes, not measured browser transfer.
2. Hero lane: repair WebGL texture allocation and breakpoint lifecycle, fail safely with the existing photo, separate debug controls, shorten intro and respect reduced motion.
3. Media lane: cancel stale requests/retries, support stable hosted MP4, preserve explicit external errors, unify modal focus/scroll lifecycle.
4. Integration lane: replace simulated success/dead links with validated configuration and honest unavailable states; prepare consent-gated GA/Metрика and static error pages.
5. Main lane: optimize derived image assets, cache scroll geometry and animate transforms, integrate lanes, provide setup/missing-input documents.
6. Verify targeted tests, typecheck/build/lint, real Chrome/Safari load and representative interactions. Report local versus external acceptance separately.

Cleanup classifications: simulated send success and empty links mask missing integrations and must be removed. A static hero on WebGL failure and an explicit Yandex download alternative are bounded compatibility fallbacks; preserve visible failure evidence.

External accounts, publishing, payments and token revocation are not performed by this local implementation.
