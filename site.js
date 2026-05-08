const header = document.getElementById('siteHeader')
const menuToggle = document.getElementById('menuToggle')
const navLinks = document.getElementById('navLinks')
const contactForm = document.getElementById('contactForm')
const formSuccess = document.getElementById('formSuccess')
const formError = document.getElementById('formError')
const cursorGlow = document.getElementById('cursorGlow')
const parallaxLayers = [...document.querySelectorAll('.parallax-layer')]
const whatsappLinks = [...document.querySelectorAll('[data-whatsapp-link]')]

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const TUIMAGEN_WHATSAPP_NUMBER = '542281375390'

function setHeaderState() {
  header?.classList.toggle('is-scrolled', window.scrollY > 18)
}

setHeaderState()
window.addEventListener('scroll', () => {
  setHeaderState()
  updateParallaxLayers()
}, { passive: true })

menuToggle?.addEventListener('click', () => {
  const isOpen = navLinks?.classList.toggle('is-open') || false
  menuToggle.setAttribute('aria-expanded', String(isOpen))
})

navLinks?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('is-open')
    menuToggle?.setAttribute('aria-expanded', 'false')
  })
})

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible')
      revealObserver.unobserve(entry.target)
    }
  })
}, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' })

const revealElements = [...document.querySelectorAll('.reveal')]

if (!reducedMotion) {
  revealElements.forEach((element, index) => {
    const rect = element.getBoundingClientRect()
    element.style.transitionDelay = `${Math.min(index % 6, 5) * 85}ms`
    if (rect.top < window.innerHeight && rect.bottom > 0) element.classList.add('is-visible')
    revealObserver.observe(element)
  })
  document.documentElement.classList.add('motion-ok')
}

function updateParallaxLayers() {
  if (reducedMotion || !parallaxLayers.length) return

  parallaxLayers.forEach((layer) => {
    const speed = Number(layer.dataset.parallax || 0.08)
    const rect = layer.parentElement?.getBoundingClientRect()
    if (!rect) return

    const progress = (window.innerHeight * 0.5 - rect.top) / Math.max(window.innerHeight + rect.height, 1)
    const offset = Math.max(-1, Math.min(1, progress)) * speed * 230
    layer.style.transform = `translate3d(0, ${offset}px, 0) rotateX(62deg) rotateZ(42deg)`
  })
}

updateParallaxLayers()

const sections = [...document.querySelectorAll('main section[id]')]
const navItems = [...document.querySelectorAll('.nav-links a')]

function updateActiveSection() {
  const current = sections.reduce((active, section) => {
    return window.scrollY >= section.offsetTop - 160 ? section.id : active
  }, sections[0]?.id || '')

  navItems.forEach((link) => {
    link.classList.toggle('is-active', link.getAttribute('href') === `#${current}`)
  })
}

updateActiveSection()
window.addEventListener('scroll', updateActiveSection, { passive: true })

window.addEventListener('pointermove', (event) => {
  if (cursorGlow && !reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    cursorGlow.classList.add('is-visible')
    cursorGlow.style.transform = `translate3d(${event.clientX - 130}px, ${event.clientY - 130}px, 0)`
  }
}, { passive: true })

document.addEventListener('pointerleave', () => {
  cursorGlow?.classList.remove('is-visible')
})

document.querySelectorAll('.depth-card, .portfolio-card, .portfolio-summary, .project-card, .demo-card').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    if (reducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const rect = card.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    card.style.transform = `translateY(-10px) rotateX(${y * -6}deg) rotateY(${x * 7}deg)`
  })

  card.addEventListener('pointerleave', () => {
    card.style.transform = ''
  })
})

document.querySelectorAll('.btn, .project-card a').forEach((item) => {
  item.addEventListener('pointermove', (event) => {
    if (reducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const rect = item.getBoundingClientRect()
    const x = (event.clientX - rect.left - rect.width / 2) * 0.12
    const y = (event.clientY - rect.top - rect.height / 2) * 0.12
    item.style.transform = `translate3d(${x}px, ${y}px, 0)`
  })

  item.addEventListener('pointerleave', () => {
    item.style.transform = ''
  })
})

function buildWhatsAppUrl(message) {
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${TUIMAGEN_WHATSAPP_NUMBER}?text=${encodedMessage}`
}

whatsappLinks.forEach((link) => {
  const message = link.dataset.whatsappMessage || 'Hola TUIMAGENSTUDIOS, quiero consultar por un proyecto.'
  link.href = buildWhatsAppUrl(message)
  link.target = '_blank'
  link.rel = 'noopener noreferrer'

  link.addEventListener('click', (event) => {
    if (!TUIMAGEN_WHATSAPP_NUMBER) {
      event.preventDefault()
      formError?.classList.add('show')
      document.getElementById('contact')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
    }
  })
})

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault()

  formSuccess?.classList.remove('show')
  formError?.classList.remove('show')

  const data = new FormData(contactForm)
  const name = String(data.get('name') || '').trim()
  const projectType = String(data.get('projectType') || '').trim()
  const message = String(data.get('message') || '').trim()

  if (!name || !projectType || !message) {
    contactForm.reportValidity()
    return
  }

  const whatsappMessage = [
    'Hola TUIMAGENSTUDIOS, quiero consultar por un proyecto.',
    `Nombre: ${name}`,
    `Tipo de proyecto: ${projectType}`,
    `Mensaje: ${message}`
  ].join('\n')

  if (!TUIMAGEN_WHATSAPP_NUMBER) {
    formError?.classList.add('show')
    return
  }

  formSuccess?.classList.add('show')
  window.open(buildWhatsAppUrl(whatsappMessage), '_blank', 'noopener,noreferrer')
})
