// ── Language system ──
let currentLang = 'es'

function toggleLang() {
  currentLang = currentLang === 'es' ? 'en' : 'es'
  const btn = document.getElementById('langToggle')
  btn.textContent = currentLang === 'es' ? 'EN' : 'ES'
  applyLang()
}

function applyLang() {
  const l = currentLang
  // Text nodes
  document.querySelectorAll(`[data-${l}]`).forEach(el => {
    const val = el.getAttribute(`data-${l}`)
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return
    if (val.includes('<br/>')) el.innerHTML = val
    else el.textContent = val
  })
  // Placeholders
  document.querySelectorAll('[data-placeholder-' + l + ']').forEach(el => {
    el.placeholder = el.getAttribute('data-placeholder-' + l)
  })
}

// ── Nav scroll effect ──
const nav = document.getElementById('nav')
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20)
})

// ── Mobile menu ──
function toggleMenu() {
  const m = document.getElementById('navMobile')
  m.classList.toggle('open')
}

// ── Scroll reveal ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80)
    }
  })
}, { threshold: 0.1 })

document.querySelectorAll('.reveal').forEach(el => observer.observe(el))

// ── Contact form ──
async function handleForm(e) {
  e.preventDefault()
  const form = e.target
  const btn = document.getElementById('formBtn')
  const success = document.getElementById('formSuccess')
  const error = document.getElementById('formError')
  const labelSend = currentLang === 'es' ? 'Enviar mensaje' : 'Send message'
  const labelSending = currentLang === 'es' ? 'Enviando...' : 'Sending...'

  btn.disabled = true
  btn.textContent = labelSending

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    })

    if (res.ok) {
      success.classList.add('show')
      error.classList.remove('show')
      form.reset()
      setTimeout(() => success.classList.remove('show'), 5000)
    } else {
      throw new Error()
    }
  } catch {
    error.classList.add('show')
    success.classList.remove('show')
    setTimeout(() => error.classList.remove('show'), 5000)
  } finally {
    btn.disabled = false
    btn.textContent = labelSend
  }
}

// ── Active nav link on scroll ──
const sections = document.querySelectorAll('section[id]')
window.addEventListener('scroll', () => {
  let current = ''
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 100) current = s.id
  })
  document.querySelectorAll('.nav-link').forEach(a => {
    a.style.color = a.getAttribute('href') === '#' + current
      ? 'var(--fg)' : ''
  })
})