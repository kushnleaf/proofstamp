# ProofStamp – Project Notes

## The idea
ProofStamp is a simple website that proves a file existed at a certain time and has
not been changed since. The browser computes the file's SHA-256 fingerprint (the file
never leaves the computer) and puts it into the Bitcoin blockchain through
OpenTimestamps. The user gets a small .ots proof file and can verify it later.

Course: Bitcoin and Blockchain Practical Course (VŠE Prague, Erasmus).
Team: Otto-Villem Valmas (building), Sten Tristan Laur (planning, testing, presentation).
Presentation: 15 December 2026. Budget: €0.

## Decisions made
- Client-only static website, no backend, no database, no accounts.
- Vite + vanilla JavaScript (no React – fewer concepts, only 2 pages).
- Hashing: Web Crypto API (crypto.subtle.digest("SHA-256", ...)).
- Timestamping: OpenTimestamps browser library v0.4.9, the same file opentimestamps.org
  uses. Saved in public/vendor/opentimestamps.min.js and loaded with a normal <script>
  tag (the npm package "opentimestamps" has no browser build). It sets
  window.OpenTimestamps.
- Code: public GitHub repo – https://github.com/kushnleaf/proofstamp
- Hosting: free (Vercel or Netlify) – decide when deploying.
- Project folder on Mac: ~/Projects/proofstamp
- Test files: ~/Projects/test-stamps (NEVER edit the originals there)

## Library notes (checked in the library code)
- Pass the hash as a Uint8Array (or normal array). A raw ArrayBuffer silently becomes
  an EMPTY hash. Same for DetachedTimestampFile.deserialize(): pass a Uint8Array.
- Stamp: DetachedTimestampFile.fromHash(new Ops.OpSHA256(), hashBytes) → stamp(detached)
  → detached.serializeToBytes() gives the .ots bytes (Uint8Array).
- Upgrade: upgrade(detached) → true if the proof changed (then re-download it).
- Verify: verify(detachedOts, detachedFile) → { bitcoin: { timestamp, height } } or
  undefined.
- Calendars used: alice + bob.btc.calendar.opentimestamps.org,
  finney.calendar.eternitywall.com. Stamping takes about 2 seconds.

## Done
- [x] Tools checked: Node v24.10.0, npm 11.6.1, Git 2.50.1, VS Code + `code` command
- [x] Vite vanilla project created, runs at http://localhost:5173
- [x] Git set up, published to GitHub
- [x] OpenTimestamps works in the browser: test page stamps a file and downloads .ots
- [x] 3 test files stamped on 25 Nov (photo, PDF, Word) → success criterion 1

## Next
- [ ] Choose the UI style (mockups or simple default)
- [ ] Build the real Stamp page (drag & drop, fingerprint, download proof, How it works)
- [ ] Build Upgrade using the 3 test files (they should be confirmed by 26 Nov)

## Timeline
- Nov 25–30: notes, OpenTimestamps browser test, first test stamps
- Dec 1–5: Stamp page (drop file, hash, stamp, download .ots, upgrade, UI)
- Dec 6–9: Verify page (REAL / PENDING / FAKE), error messages, deploy online
- Dec 10–12: 5 classmates test it, fix bugs
- Dec 13: stamp demo files, record backup video
- Dec 14: test on school Wi-Fi, rehearse
- Dec 15: presentation

## Known issues
- index.html + src/main.js are still the TEMPORARY test page (to be replaced).
- macOS shows .ots files as "OpenDocument Template" (LibreOffice uses the same file
  ending). Harmless – just don't double-click them. Mention in "How it works".
- Vite prints a warning that opentimestamps.min.js "can't be bundled without
  type=module". Expected and harmless.

## How to run locally
    cd ~/Projects/proofstamp
    npm install   (only needed once, or after new libraries)
    npm run dev   → open http://localhost:5173