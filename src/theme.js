// ProofStamp – light / dark mode button
// The <head> of index.html already applies a saved choice before the page is drawn,
// so the page never flashes the wrong colors. This file handles the button.

const root = document.documentElement
const button = document.querySelector('#theme-btn')

function currentTheme() {
  return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

function applyTheme(theme) {
  if (theme === 'dark') root.setAttribute('data-theme', 'dark')
  else root.removeAttribute('data-theme')
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  button.setAttribute('aria-label', label)
  button.setAttribute('title', label)
}

applyTheme(currentTheme())

button.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  // Remember the choice for the next visit (some browsers block this – that's fine)
  try {
    localStorage.setItem('proofstamp-theme', next)
  } catch {
    // ignore
  }
})
