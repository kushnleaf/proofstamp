// ProofStamp – main app code (Stamp page)
import './style.css'

// The library in public/vendor/ puts itself on window.OpenTimestamps
const OpenTimestamps = window.OpenTimestamps

// ---------- Page elements ----------
const $ = (selector) => document.querySelector(selector)
const tabs = document.querySelectorAll('.tab')
const stampView = $('#stamp-view')
const verifyView = $('#verify-view')
const dropZone = $('#drop-zone')
const fileInput = $('#file-input')
const result = $('#result')
const fileNameEl = $('#file-name')
const fileSizeEl = $('#file-size')
const fileHashEl = $('#file-hash')
const copyBtn = $('#copy-btn')
const stampBtn = $('#stamp-btn')
const statusEl = $('#status')
const downloadBtn = $('#download-btn')
const resetBtn = $('#reset-btn')

// ---------- What the app currently remembers ----------
let currentFile = null // the File the user chose
let currentHash = null // its SHA-256 fingerprint (Uint8Array)
let currentOts = null // the proof bytes (Uint8Array) after stamping

// ---------- Small helpers ----------
function toHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// type: 'info' | 'success' | 'error'
function showStatus(type, message) {
  statusEl.className = `status ${type}`
  statusEl.textContent = message
  statusEl.hidden = false
}

function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/octet-stream' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

// ---------- Tabs (Stamp / Verify) ----------
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.toggle('active', t === tab))
    stampView.hidden = tab.dataset.tab !== 'stamp'
    verifyView.hidden = tab.dataset.tab !== 'verify'
  })
})

// ---------- Choosing a file (click or drag & drop) ----------
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0]
  if (file) handleFile(file)
})

;['dragenter', 'dragover'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault()
    dropZone.classList.add('dragging')
  })
})
;['dragleave', 'drop'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault()
    dropZone.classList.remove('dragging')
  })
})
dropZone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files[0]
  if (file) handleFile(file)
})

// If a file is dropped outside the box, don't let the browser open it
window.addEventListener('dragover', (e) => e.preventDefault())
window.addEventListener('drop', (e) => e.preventDefault())

// ---------- Step 1: fingerprint the file (locally) ----------
async function handleFile(file) {
  currentFile = file
  currentHash = null
  currentOts = null

  dropZone.hidden = true
  result.hidden = false
  fileNameEl.textContent = file.name
  fileSizeEl.textContent = formatSize(file.size)
  fileHashEl.textContent = 'Calculating…'
  copyBtn.disabled = true
  stampBtn.hidden = false
  stampBtn.disabled = true
  downloadBtn.hidden = true
  statusEl.hidden = true

  try {
    const buffer = await file.arrayBuffer()
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', buffer))
    if (currentFile !== file) return // user already picked another file
    currentHash = hash
    fileHashEl.textContent = toHex(hash)
    copyBtn.disabled = false
    stampBtn.disabled = false
  } catch (err) {
    console.error(err)
    fileHashEl.textContent = '—'
    showStatus('error', 'This file could not be read. Please try another file. (Folders cannot be stamped.)')
  }
}

// ---------- Step 2: stamp the fingerprint in Bitcoin ----------
stampBtn.addEventListener('click', async () => {
  if (!currentHash) return

  if (!OpenTimestamps) {
    showStatus('error', 'The timestamp library did not load. Please refresh the page and try again.')
    return
  }
  if (!navigator.onLine) {
    showStatus('error', 'You seem to be offline. Connect to the internet and try again.')
    return
  }

  stampBtn.disabled = true
  stampBtn.textContent = 'Stamping…'
  showStatus('info', 'Sending the fingerprint to the OpenTimestamps servers…')

  try {
    const detached = OpenTimestamps.DetachedTimestampFile.fromHash(
      new OpenTimestamps.Ops.OpSHA256(),
      currentHash
    )
    await OpenTimestamps.stamp(detached)

    // Safety check: at least one server must have accepted the fingerprint
    if (!OpenTimestamps.info(detached).includes('PendingAttestation')) {
      throw new Error('No timestamp server accepted the fingerprint')
    }

    currentOts = detached.serializeToBytes()
    downloadBytes(currentOts, `${currentFile.name}.ots`)

    stampBtn.hidden = true
    downloadBtn.hidden = false
    showStatus(
      'success',
      `✅ Stamped! Your proof "${currentFile.name}.ots" was downloaded.\n\n` +
        '⏳ Status: PENDING – Bitcoin will confirm it in a few hours.\n' +
        'Keep the proof together with your original file, and do not change the original.'
    )
  } catch (err) {
    console.error(err)
    stampBtn.disabled = false
    showStatus(
      'error',
      'The timestamp servers could not be reached right now. Check your internet connection and try again in a minute.'
    )
  } finally {
    stampBtn.textContent = 'Stamp in Bitcoin'
  }
})

// ---------- Other buttons ----------
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(fileHashEl.textContent)
    copyBtn.textContent = 'Copied!'
  } catch {
    copyBtn.textContent = 'Copy failed'
  }
  setTimeout(() => (copyBtn.textContent = 'Copy'), 1500)
})

downloadBtn.addEventListener('click', () => {
  if (currentOts) downloadBytes(currentOts, `${currentFile.name}.ots`)
})

resetBtn.addEventListener('click', () => {
  currentFile = null
  currentHash = null
  currentOts = null
  fileInput.value = '' // so the same file can be chosen again
  result.hidden = true
  dropZone.hidden = false
})