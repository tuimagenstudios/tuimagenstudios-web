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
function handleForm(e) {
  e.preventDefault()
  const success = document.getElementById('formSuccess')
  success.classList.add('show')
  e.target.reset()
  setTimeout(() => success.classList.remove('show'), 4000)
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
