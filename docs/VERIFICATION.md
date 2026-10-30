# Verification

Run `node scripts/check.cjs` from the repository root using Node.js 24 or later. Tests use Node built-ins and need no package installation.

- JavaScript syntax checks across the application and repository tooling.
- Deterministic physics: free fall, step consistency, fuel limits, touchdown boundaries, all guided landings, transfer solutions, escape cases, and robot collision/kinematics checks.
- Studio models: beam scaling, probability combinations, controller equilibrium and saturation, and time-step convergence.
- Foundation lab numerical/rendering cases.
- Progress persistence, validation, backups, multiple tabs, review scheduling, project records, and timer behavior.
- Content references and feature counts; lesson/project rendering and linked sources.
- Sharing controls, clipboard failure fallback, post lengths, descriptive text, and local media references.

The October 29 release also received desktop and phone browser checks, a real CSV download check, successful YouTube fallback playback, player cleanup on navigation, and video decoding/visual inspection. All 116 publicly served files matched the audited release by SHA-1. SHA-1 here is an integrity comparison, not a security signature. The source-import manifest uses SHA-256.

`public-site-manifest.json` records the exact site files imported into GitHub. Later changes should have their own tests and commits; the import manifest is a historical snapshot, not an assertion that future edits are identical.

For public-content privacy and media-check scope, see [the release audit](launch/privacy-and-verification.txt). Tests do not replace real-browser testing or independent engineering review.
