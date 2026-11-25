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
- Timestamping: official OpenTimestamps JavaScript library. Its docs say that for the
  browser you use the ready-made JS file that opentimestamps.org itself uses.
  To be confirmed with a quick test (step 7).
- Code: public GitHub repo – https://github.com/kushnleaf/proofstamp
- Hosting: free (Vercel or Netlify) – decide when deploying.
- Project folder on Mac: ~/Projects/proofstamp

## Done
- [x] Tools checked: Node v24.10.0, npm 11.6.1, Git 2.50.1, VS Code + `code` command
- [x] Vite vanilla project created, runs at http://localhost:5173
- [x] Git set up, first commit, published to GitHub

## Next
- [ ] Test OpenTimestamps in the browser: stamp one file, get a pending .ots
- [ ] Stamp a few test files early so they get Bitcoin-confirmed

## Timeline
- Nov 25–30: notes, OpenTimestamps browser test, first test stamps
- Dec 1–5: Stamp page (drop file, hash, stamp, download .ots, upgrade, UI)
- Dec 6–9: Verify page (REAL / PENDING / FAKE), error messages, deploy online
- Dec 10–12: 5 classmates test it, fix bugs
- Dec 13: stamp demo files, record backup video
- Dec 14: test on school Wi-Fi, rehearse
- Dec 15: presentation

## Known issues
- None yet.

## How to run locally
    cd ~/Projects/proofstamp
    npm install   (only needed once, or after new libraries)
    npm run dev   → open http://localhost:5173