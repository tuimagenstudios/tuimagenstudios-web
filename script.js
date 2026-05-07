import * as THREE from './assets/vendor/three.module.min.js'

const header = document.getElementById('siteHeader')
const menuToggle = document.getElementById('menuToggle')
const navLinks = document.getElementById('navLinks')
const contactForm = document.getElementById('contactForm')
const formBtn = document.getElementById('formBtn')
const formSuccess = document.getElementById('formSuccess')
const formError = document.getElementById('formError')
const heroCanvas = document.getElementById('heroCanvas')
const heroSystem = document.querySelector('.hero-system')
const cursorGlow = document.getElementById('cursorGlow')
const parallaxLayers = [...document.querySelectorAll('.parallax-layer')]
const whatsappLinks = [...document.querySelectorAll('[data-whatsapp-link]')]

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const TUIMAGEN_WHATSAPP_NUMBER = '542281375390'
const pointer = { x: 0, y: 0 }
let scrollProgress = 0

function setHeaderState() {
  header.classList.toggle('is-scrolled', window.scrollY > 18)
}

setHeaderState()
window.addEventListener('scroll', () => {
  setHeaderState()
  scrollProgress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1.5)
  updateParallaxLayers()
}, { passive: true })

menuToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open')
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
  pointer.x = (event.clientX / window.innerWidth - 0.5) * 2
  pointer.y = (event.clientY / window.innerHeight - 0.5) * 2

  if (cursorGlow && !reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    cursorGlow.classList.add('is-visible')
    cursorGlow.style.transform = `translate3d(${event.clientX - 130}px, ${event.clientY - 130}px, 0)`
  }

  if (heroSystem && !reducedMotion) {
    heroSystem.style.transform = `rotateX(${pointer.y * -2.2}deg) rotateY(${pointer.x * 2.8}deg) translateY(${scrollProgress * -8}px)`
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

  formSuccess.classList.remove('show')
  formError.classList.remove('show')

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
    formError.classList.add('show')
    return
  }

  formSuccess.classList.add('show')
  window.open(buildWhatsAppUrl(whatsappMessage), '_blank', 'noopener,noreferrer')
})

function createHeroScene() {
  if (!heroCanvas) return

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  })

  const isMobile = window.innerWidth < 760
  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75)

  renderer.setPixelRatio(dpr)
  renderer.setClearColor(0x05091a, 0)
  heroCanvas.appendChild(renderer.domElement)

  camera.position.set(0, 0.8, isMobile ? 9.5 : 8)

  const root = new THREE.Group()
  const cubeGroup = new THREE.Group()
  const particleGroup = new THREE.Group()
  const panelGroup = new THREE.Group()
  const nodeGroup = new THREE.Group()
  scene.add(root)
  root.add(cubeGroup)
  root.add(particleGroup)
  root.add(panelGroup)
  root.add(nodeGroup)

  const ambient = new THREE.AmbientLight(0x7bbdff, 0.7)
  const keyLight = new THREE.PointLight(0x00e0ff, 6.2, 22)
  const rimLight = new THREE.PointLight(0x1f6cff, 2.8, 18)
  keyLight.position.set(2.8, 2.8, 4)
  rimLight.position.set(-3, -2, 3)
  scene.add(ambient, keyLight, rimLight)

  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x071936,
    emissive: 0x003c58,
    emissiveIntensity: 0.34,
    metalness: 0.42,
    roughness: 0.2,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
    depthWrite: false
  })
  const panelEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0x00e0ff,
    transparent: true,
    opacity: 0.34
  })
  const panelGeometry = new THREE.PlaneGeometry(2.65, 1.45)
  const panelEdgeGeometry = new THREE.EdgesGeometry(panelGeometry)
  const panelSpecs = isMobile
    ? [[0.9, 0.2, -2.4, 0.62, -0.22, 0.18], [2.35, -0.75, -2.0, 0.46, 0.18, -0.12]]
    : [[0.72, 0.6, -2.2, 0.8, -0.28, 0.18], [2.6, -0.72, -1.6, 0.62, 0.18, -0.16], [-2.65, -0.42, -2.8, 0.7, 0.12, 0.24]]

  const panels = panelSpecs.map(([x, y, z, scale, ry, rz], index) => {
    const group = new THREE.Group()
    const mesh = new THREE.Mesh(panelGeometry, panelMaterial.clone())
    const edges = new THREE.LineSegments(panelEdgeGeometry, panelEdgeMaterial.clone())
    group.position.set(x, y, z)
    group.scale.setScalar(scale)
    group.rotation.set(0.1 + index * 0.04, ry, rz)
    group.add(mesh, edges)
    panelGroup.add(group)
    return { group, baseY: y, speed: 0.16 + index * 0.04 }
  })

  const coreGeometry = new THREE.OctahedronGeometry(isMobile ? 0.34 : 0.46, 0)
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x00e0ff,
    emissive: 0x00e0ff,
    emissiveIntensity: 1.35,
    metalness: 0.12,
    roughness: 0.16,
    transparent: true,
    opacity: 0.92
  })
  const core = new THREE.Mesh(coreGeometry, coreMaterial)
  core.position.set(isMobile ? 1.18 : 1.72, isMobile ? 0.24 : 0.18, -0.9)
  root.add(core)

  const nodeGeometry = new THREE.SphereGeometry(isMobile ? 0.035 : 0.045, 12, 12)
  const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x00e0ff, transparent: true, opacity: 0.84 })
  const nodePositions = isMobile
    ? [[0.2, 1.2, -1.5], [1.18, 0.24, -0.9], [2.0, 1.0, -1.8], [2.42, -0.45, -1.5]]
    : [[-1.8, 1.2, -2.2], [-0.2, 0.1, -1.4], [1.72, 0.18, -0.9], [2.8, 1.0, -1.8], [3.6, -0.58, -1.2]]
  const nodeMeshes = nodePositions.map(([x, y, z]) => {
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone())
    node.position.set(x, y, z)
    nodeGroup.add(node)
    return node
  })
  const nodeLineGeometry = new THREE.BufferGeometry().setFromPoints(nodeMeshes.map((node) => node.position))
  const nodeLine = new THREE.Line(nodeLineGeometry, new THREE.LineBasicMaterial({
    color: 0x00e0ff,
    transparent: true,
    opacity: 0.3
  }))
  nodeGroup.add(nodeLine)

  const cubeGeometry = new THREE.BoxGeometry(0.72, 0.72, 0.72)
  const cubeMaterial = new THREE.MeshStandardMaterial({
    color: 0x071b34,
    emissive: 0x006c8f,
    emissiveIntensity: 0.38,
    metalness: 0.58,
    roughness: 0.28,
    transparent: true,
    opacity: 0.88
  })
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x00e0ff,
    transparent: true,
    opacity: 0.72
  })
  const edgeGeometry = new THREE.EdgesGeometry(cubeGeometry)

  const desktopCubes = [
    [-3.2, 1.1, -1.6, 0.62],
    [-2.2, -0.1, -1.0, 0.42],
    [-1.1, 1.9, -2.2, 0.36],
    [0.2, 0.72, -1.4, 0.58],
    [1.2, -0.55, -0.7, 0.5],
    [2.24, 1.18, -1.2, 0.72],
    [3.2, -0.12, -2.1, 0.44],
    [3.84, 1.72, -1.6, 0.32],
    [2.72, 2.34, -2.8, 0.28],
    [-3.9, -1.2, -2.5, 0.34],
    [0.98, 2.58, -3.2, 0.3],
    [4.18, -1.35, -1.0, 0.54]
  ]

  const cubeData = (isMobile ? desktopCubes.slice(0, 7) : desktopCubes).map((entry, index) => {
    const [x, y, z, scale] = entry
    const group = new THREE.Group()
    const mesh = new THREE.Mesh(cubeGeometry, cubeMaterial.clone())
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial.clone())
    mesh.scale.setScalar(scale)
    edges.scale.setScalar(scale * 1.01)
    group.position.set(x, y, z)
    group.rotation.set(index * 0.28, index * 0.19, index * 0.11)
    group.add(mesh, edges)
    cubeGroup.add(group)

    return {
      group,
      speed: 0.18 + index * 0.018,
      drift: 0.12 + (index % 3) * 0.035,
      baseY: y
    }
  })

  const particleCount = reducedMotion ? 0 : (isMobile ? 46 : 90)
  const particleGeometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * (isMobile ? 8 : 12)
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6
    positions[i * 3 + 2] = -Math.random() * 5 - 0.8
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x00e0ff,
    size: isMobile ? 0.025 : 0.032,
    transparent: true,
    opacity: 0.55,
    depthWrite: false
  })
  const particles = new THREE.Points(particleGeometry, particleMaterial)
  particleGroup.add(particles)

  const connectionMaterial = new THREE.LineBasicMaterial({
    color: 0x00e0ff,
    transparent: true,
    opacity: 0.18
  })
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-3.6, -1.35, -2.2),
    new THREE.Vector3(-1.2, 0.8, -1.4),
    new THREE.Vector3(0.8, -0.55, -0.9),
    new THREE.Vector3(2.4, 1.1, -1.3),
    new THREE.Vector3(4.0, 0.1, -2.0)
  ])
  const connectionLine = new THREE.Line(lineGeometry, connectionMaterial)
  root.add(connectionLine)

  function resize() {
    const rect = heroCanvas.getBoundingClientRect()
    renderer.setSize(rect.width, rect.height, false)
    camera.aspect = rect.width / Math.max(rect.height, 1)
    camera.updateProjectionMatrix()
  }

  resize()
  window.addEventListener('resize', resize, { passive: true })

  let running = !reducedMotion
  let frameId = 0
  const clock = new THREE.Clock()

  const visibilityObserver = new IntersectionObserver((entries) => {
    running = !reducedMotion && entries[0]?.isIntersecting && !document.hidden
    if (running && !frameId) animate()
  }, { threshold: 0.08 })

  visibilityObserver.observe(heroCanvas)

  document.addEventListener('visibilitychange', () => {
    running = !reducedMotion && !document.hidden
    if (running && !frameId) animate()
  })

  function renderFrame(time) {
    const targetX = pointer.x * (isMobile ? 0.22 : 0.42)
    const targetY = pointer.y * (isMobile ? 0.12 : 0.22)

    root.rotation.y += (targetX - root.rotation.y) * 0.035
    root.rotation.x += (-targetY - root.rotation.x) * 0.035
    root.position.y = scrollProgress * -0.64
    root.position.x = scrollProgress * (isMobile ? -0.08 : -0.16)
    cubeGroup.rotation.y = time * 0.035
    panelGroup.rotation.z = Math.sin(time * 0.16) * 0.025 + scrollProgress * -0.035
    nodeGroup.rotation.y = Math.sin(time * 0.2) * 0.04
    core.rotation.x = time * 0.35
    core.rotation.y = time * 0.42
    core.scale.setScalar(1 + Math.sin(time * 1.4) * 0.055)
    connectionLine.rotation.y = Math.sin(time * 0.25) * 0.08

    panels.forEach((item, index) => {
      item.group.position.y = item.baseY + Math.sin(time * item.speed + index) * 0.06
      item.group.rotation.z += Math.sin(time * 0.08 + index) * 0.0008
    })

    cubeData.forEach((item, index) => {
      item.group.rotation.x += 0.0028 + item.speed * 0.0009
      item.group.rotation.y += 0.0034 + item.speed * 0.0008
      item.group.position.y = item.baseY + Math.sin(time * item.speed + index) * item.drift
    })

    if (particleCount) {
      particles.rotation.y = time * 0.018
      particles.rotation.x = Math.sin(time * 0.18) * 0.025
    }

    renderer.render(scene, camera)
  }

  function animate() {
    if (!running) {
      frameId = 0
      return
    }

    frameId = window.requestAnimationFrame(animate)
    renderFrame(clock.getElapsedTime())
  }

  renderFrame(0)
  if (!reducedMotion) animate()
}

createHeroScene()
