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

// ── Contact form — Formspree ──
async function handleForm(e) {
  e.preventDefault()
  const form = e.target
  const btn = form.querySelector('button[type="submit"]')
  const success = document.getElementById('formSuccess')

  // Estado de carga
  btn.disabled = true
  btn.textContent = currentLang === 'es' ? 'Enviando...' : 'Sending...'

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    })

    if (response.ok) {
      form.reset()
      success.classList.add('show')
      setTimeout(() => success.classList.remove('show'), 5000)
    } else {
      alert(currentLang === 'es'
        ? 'Error al enviar. Intentá de nuevo.'
        : 'Error sending. Please try again.')
    }
  } catch (err) {
    alert(currentLang === 'es'
      ? 'Error de conexión. Verificá tu internet.'
      : 'Connection error. Check your internet.')
  } finally {
    // Restaurar botón
    btn.disabled = false
    btn.textContent = currentLang === 'es' ? 'Enviar mensaje' : 'Send message'
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
