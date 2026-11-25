// ProofStamp – Verify page (also upgrades pending proofs)
import './verify.css'

const OpenTimestamps = window.OpenTimestamps

// ---------- Page elements ----------
const $ = (selector) => document.querySelector(selector)
const fileZone = $('#v-file-zone')
const fileInput = $('#v-file-input')
const fileLabel = $('#v-file-label')
const otsZone = $('#v-ots-zone')
const otsInput = $('#v-ots-input')
const otsLabel = $('#v-ots-label')
const verifyBtn = $('#verify-btn')
const verdict = $('#verdict')
const verdictTitle = $('#verdict-title')
const verdictText = $('#verdict-text')
const downloadBtn = $('#v-download-btn')
const resetBtn = $('#v-reset-btn')

// ---------- What the page remembers ----------
let originalFile = null // the file to check
let proofFile = null // its .ots proof
let upgradedProof = null // new proof bytes, if Bitcoin confirmed it meanwhile

// ---------- Small helpers ----------
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date) {
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

function toHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/octet-stream' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

// type: 'real' | 'pending' | 'fake' | 'error' | 'info'
function showVerdict(type, title, text) {
  verdict.className = `verdict ${type}`
  verdictTitle.textContent = title
  verdictText.textContent = text
  verdict.hidden = false
}

// ---------- Choosing the two files ----------
// Files are sorted by name: anything ending in .ots is the proof, the rest is the original.
function addFiles(fileList) {
  for (const file of fileList) {
    if (file.name.toLowerCase().endsWith('.ots')) proofFile = file
    else originalFile = file
  }
  updateZones()
}

function updateZones() {
  fileLabel.textContent = originalFile
    ? `${originalFile.name} (${formatSize(originalFile.size)})`
    : 'Drop or click to choose'
  otsLabel.textContent = proofFile
    ? `${proofFile.name} (${formatSize(proofFile.size)})`
    : 'Drop or click to choose'
  fileZone.classList.toggle('filled', !!originalFile)
  otsZone.classList.toggle('filled', !!proofFile)

  verifyBtn.disabled = !(originalFile && proofFile)
  verdict.hidden = true
  downloadBtn.hidden = true
  resetBtn.hidden = !(originalFile || proofFile)
  upgradedProof = null
}

function setupZone(zone, input) {
  input.addEventListener('change', () => {
    addFiles(input.files)
    input.value = '' // allows choosing the same file again
  })
  ;['dragenter', 'dragover'].forEach((eventName) => {
    zone.addEventListener(eventName, (e) => {
      e.preventDefault()
      zone.classList.add('dragging')
    })
  })
  ;['dragleave', 'drop'].forEach((eventName) => {
    zone.addEventListener(eventName, (e) => {
      e.preventDefault()
      zone.classList.remove('dragging')
    })
  })
  zone.addEventListener('drop', (e) => addFiles(e.dataTransfer.files))
}

setupZone(fileZone, fileInput)
setupZone(otsZone, otsInput)

// ---------- The check ----------
verifyBtn.addEventListener('click', async () => {
  if (!originalFile || !proofFile) return
  if (!OpenTimestamps) {
    showVerdict('error', 'Something went wrong', 'The timestamp library did not load. Please refresh the page and try again.')
    return
  }

  verifyBtn.disabled = true
  verifyBtn.textContent = 'Checking…'
  downloadBtn.hidden = true
  upgradedProof = null
  showVerdict('info', 'Checking…', 'Comparing fingerprints and asking the Bitcoin blockchain.')

  try {
    // 1. Read the proof file
    let detachedOts
    let proofBytes
    try {
      proofBytes = new Uint8Array(await proofFile.arrayBuffer())
      detachedOts = OpenTimestamps.DetachedTimestampFile.deserialize(proofBytes)
    } catch (err) {
      console.error(err)
      showVerdict(
        'error',
        'This proof file is damaged',
        'The .ots file could not be read. Make sure you chose the right proof file and that it has not been changed or renamed from another file.'
      )
      return
    }
    if (!(detachedOts.fileHashOp instanceof OpenTimestamps.Ops.OpSHA256)) {
      showVerdict('error', 'Unsupported proof', 'This proof uses a fingerprint type other than SHA-256, which ProofStamp does not support.')
      return
    }

    // 2. Fingerprint the original file (locally) and compare – no internet needed
    let fileHash
    try {
      fileHash = new Uint8Array(await crypto.subtle.digest('SHA-256', await originalFile.arrayBuffer()))
    } catch (err) {
      console.error(err)
      showVerdict('error', 'File could not be read', 'The original file could not be read. Please choose it again.')
      return
    }
    if (toHex(fileHash) !== toHex(detachedOts.fileDigest())) {
      showVerdict(
        'fake',
        'DOES NOT MATCH',
        'This is not the file that was stamped. It has been changed – even one letter gives a completely different fingerprint – or the proof belongs to a different file.'
      )
      return
    }

    // 3. Ask the calendars + the Bitcoin blockchain
    if (!navigator.onLine) {
      showVerdict('error', 'You are offline', 'The file matches its proof, but checking the Bitcoin blockchain needs internet. Connect and try again.')
      return
    }
    const detachedFile = OpenTimestamps.DetachedTimestampFile.fromHash(new OpenTimestamps.Ops.OpSHA256(), fileHash)
    let result
    try {
      result = await OpenTimestamps.verify(detachedOts, detachedFile, {
        ignoreBitcoinNode: true, // no own Bitcoin node – use a public block explorer
        timeout: 15000, // wait up to 15 s (slow Wi-Fi)
      })
    } catch (err) {
      console.error(err)
      showVerdict('error', 'Could not reach Bitcoin', 'The Bitcoin servers could not be reached right now. Check your internet connection and try again in a minute.')
      return
    }

    // 4. Did the check upgrade the proof? (pending → confirmed)
    const newBytes = detachedOts.serializeToBytes()
    const upgraded = toHex(newBytes) !== toHex(proofBytes)
    if (upgraded) {
      upgradedProof = newBytes
      downloadBtn.hidden = false
    }

    // 5. Show the answer
    if (result && result.bitcoin) {
      const when = formatDate(new Date(result.bitcoin.timestamp * 1000))
      showVerdict(
        'real',
        'REAL',
        `This file existed on ${when} and has not been changed since.\n` +
          `Proof: Bitcoin block #${result.bitcoin.height.toLocaleString('en-US')}.` +
          (upgraded
            ? '\n\nYour proof was upgraded with the Bitcoin confirmation. Download the new .ots below and keep it instead of the old one.'
            : '')
      )
    } else {
      showVerdict(
        'pending',
        'PENDING',
        'The file matches its proof, but Bitcoin has not confirmed it yet. This usually takes a few hours – please check again later.'
      )
    }
  } finally {
    verifyBtn.disabled = !(originalFile && proofFile)
    verifyBtn.textContent = 'Check in Bitcoin'
    resetBtn.hidden = false
  }
})

// ---------- Other buttons ----------
downloadBtn.addEventListener('click', () => {
  if (upgradedProof) downloadBytes(upgradedProof, proofFile.name)
})

resetBtn.addEventListener('click', () => {
  originalFile = null
  proofFile = null
  updateZones()
})