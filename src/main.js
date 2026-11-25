// TEMPORARY TEST PAGE (step 8)
// Goal: hash a file in the browser and stamp it with OpenTimestamps.
// We will replace this with the real Stamp page later.

import './style.css'

// The library from public/vendor/ puts itself on "window.OpenTimestamps"
const OpenTimestamps = window.OpenTimestamps

const fileInput = document.querySelector('#file-input')
const log = document.querySelector('#log')

// Write one line of text into the box on the page
function write(line) {
  log.textContent += line + '\n'
}

// Turn bytes into a readable hex string (like "3a7bd3e2...")
function toHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// Make the browser download some bytes as a file
function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/octet-stream' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0]
  if (!file) return
  log.textContent = ''

  if (!OpenTimestamps) {
    write('❌ The OpenTimestamps library did not load.')
    return
  }

  try {
    write(`File: ${file.name} (${file.size} bytes)`)

    // 1. Read the file and compute its SHA-256 fingerprint – locally, in the browser
    const buffer = await file.arrayBuffer()
    const hashBytes = new Uint8Array(await crypto.subtle.digest('SHA-256', buffer))
    write(`SHA-256: ${toHex(hashBytes)}`)

    // 2. Send ONLY the fingerprint to the OpenTimestamps calendar servers
    write('Sending the fingerprint to the OpenTimestamps calendars...')
    const detached = OpenTimestamps.DetachedTimestampFile.fromHash(
      new OpenTimestamps.Ops.OpSHA256(),
      hashBytes
    )
    await OpenTimestamps.stamp(detached)

    // 3. Turn the proof into bytes and download it as a .ots file
    const otsBytes = detached.serializeToBytes()
    write(`✅ Stamped! Proof size: ${otsBytes.length} bytes.`)
    write('Status: PENDING – Bitcoin will confirm it in a few hours.')
    write('')
    write('Proof details:')
    write(OpenTimestamps.info(detached))

    downloadBytes(otsBytes, file.name + '.ots')
  } catch (err) {
    console.error(err)
    write('❌ Something went wrong: ' + err)
  }
})