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
- Verify uses a public block explorer (blockstream.info) instead of an own Bitcoin node:
  options { ignoreBitcoinNode: true, timeout: 15000 } (library default timeout is 1 s).
- Upgrade is built into Verify: verify() upgrades a pending proof automatically; if the
  proof changed, the page offers "Download upgraded proof".
- UI: no emojis on the website (Otto's decision). Colors carry the meaning:
  green = REAL, amber = PENDING, red = DOES NOT MATCH, grey = error.
- Code: public GitHub repo – https://github.com/kushnleaf/proofstamp
- Hosting: free (Vercel or Netlify) – decide when deploying.
- Project folder on Mac: ~/Projects/proofstamp
- Test files: ~/Projects/test-stamps (NEVER edit the originals there)

## File structure
- index.html – page layout (Stamp, Verify, How it works)
- src/main.js + src/style.css – tabs + Stamp page + main styles
- src/verify.js + src/verify.css – Verify page (incl. upgrade)
- public/vendor/opentimestamps.min.js – OpenTimestamps library
- public/favicon.svg – orange tab icon

## Library notes (checked in the library code)
- Pass the hash as a Uint8Array (or normal array). A raw ArrayBuffer silently becomes
  an EMPTY hash. Same for DetachedTimestampFile.deserialize(): pass a Uint8Array.
- Stamp: DetachedTimestampFile.fromHash(new Ops.OpSHA256(), hashBytes) → stamp(detached)
  → detached.serializeToBytes() gives the .ots bytes (Uint8Array).
- Verify: verify(detachedOts, detachedFile, options) →
  confirmed: { bitcoin: { timestamp, height } } · pending: {} ·
  wrong file: throws "File does not match original!". Broken .ots: deserialize() throws.
- Calendars used: alice + bob.btc.calendar.opentimestamps.org,
  finney.calendar.eternitywall.com. Stamping takes about 2 seconds.
- Official confirmed example for testing: hello-world.txt + .ots (in test-stamps) →
  REAL, 28 May 2015, block #358,391.

## Done
- [x] Tools checked: Node v24.10.0, npm 11.6.1, Git 2.50.1, VS Code + `code` command
- [x] Vite vanilla project, Git, GitHub
- [x] Stamp page: drag & drop, SHA-256 fingerprint + copy, stamp, download .ots,
      friendly errors (offline, servers down, unreadable file)
- [x] Verify page: REAL (date + block) / PENDING / DOES NOT MATCH / damaged proof,
      upgrade + download upgraded proof. All 4 cases tested in Chrome on 25 Nov.
- [x] 3 test files stamped on 25 Nov 14:48 (photo, PDF, Word) → success criterion 1
- [x] Success criteria 3 (one letter changed → DOES NOT MATCH) and
      4 (broken proof → clear error) work
- [x] ProofStamp tab icon

## Next
- [ ] Verify own test files once confirmed → REAL with 25 Nov date (criterion 2),
      download the upgraded proofs and replace the old .ots files
- [ ] Deploy online for free (Vercel or Netlify)
- [ ] 5 classmates test it alone, under 2 minutes each (criterion 5)
- [ ] Nice-to-have (only if time): link to the Bitcoin block on a block explorer

## Timeline
- Nov 25: setup, OpenTimestamps test, Stamp + Verify pages (ahead of plan)
- Nov 26–Dec 5: deploy, confirm own test files, small fixes
- Dec 6–12: 5 classmates test it, fix bugs
- Dec 13: stamp demo files, record backup video
- Dec 14: test on school Wi-Fi, rehearse
- Dec 15: presentation

## Known issues
- macOS shows .ots files as "OpenDocument Template" (LibreOffice uses the same file
  ending). Harmless – just don't double-click them. Mentioned in "How it works".
- Vite prints a warning that opentimestamps.min.js "can't be bundled without
  type=module". Expected and harmless.
- Bitcoin block times can be off by up to about 2 hours, so the date on REAL is
  "around" that time.

## How to run locally
    cd ~/Projects/proofstamp
    npm install   (only needed once, or after new libraries)
    npm run dev   → open http://localhost:5173
