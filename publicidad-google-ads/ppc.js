// Movimiento de la página Publicidad en Google Ads:
// 1) escena 3D del hero (diana de objetivo, barras que crecen, clics que llegan al objetivo, paneles flotantes);
// 2) búsqueda que se escribe sola en el anuncio de ejemplo;
// 3) contadores de pasos y detalles que se activan al hacer scroll.
// Respeta "reducir movimiento" del sistema y se pausa cuando el hero no está a la vista.
import * as THREE from '../assets/vendor/three.module.min.js'

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const pointer = { x: 0, y: 0 }
let scrollProgress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1.5)

window.addEventListener('scroll', () => {
  scrollProgress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1.5)
}, { passive: true })

window.addEventListener('pointermove', (event) => {
  pointer.x = (event.clientX / window.innerWidth - 0.5) * 2
  pointer.y = (event.clientY / window.innerHeight - 0.5) * 2
}, { passive: true })

/* ---------- 1. Escena 3D ---------- */
function createScene() {
  const host = document.getElementById('ppcCanvas')
  if (!host) return

  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
  } catch (error) {
    return
  }

  const isMobile = window.innerWidth < 760
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75))
  renderer.setClearColor(0x05091a, 0)
  host.appendChild(renderer.domElement)
  camera.position.set(0, 0.6, isMobile ? 10 : 8)

  const CYAN = 0x00e0ff
  const GREEN = 0x00ff88
  const VIOLET = 0xa855f7

  const root = new THREE.Group()
  scene.add(root)
  scene.add(new THREE.AmbientLight(0x7bbdff, 0.7))
  const key = new THREE.PointLight(CYAN, 6, 22)
  key.position.set(3, 3, 4)
  const rim = new THREE.PointLight(VIOLET, 2.4, 18)
  rim.position.set(-3, -2, 3)
  scene.add(key, rim)

  // Diana: el objetivo de la campaña
  const target = new THREE.Group()
  const ringSpecs = [[1.25, CYAN, 0.75], [0.86, GREEN, 0.55], [0.48, VIOLET, 0.7]]
  const rings = ringSpecs.map(([radius, color, opacity], index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.022, 10, 96),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
    )
    ring.rotation.x = index * 0.22
    target.add(ring)
    return ring
  })
  const bullseye = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 20, 20),
    new THREE.MeshStandardMaterial({ color: GREEN, emissive: GREEN, emissiveIntensity: 1.4, roughness: 0.2 })
  )
  target.add(bullseye)
  const targetPos = isMobile ? new THREE.Vector3(1.3, 1.9, -1.6) : new THREE.Vector3(4.1, 1.75, -1.9)
  target.position.copy(targetPos)
  root.add(target)

  // Barras de crecimiento (resultados que suben)
  const bars = new THREE.Group()
  const barHeights = [0.45, 0.7, 0.62, 1.0, 1.25, 1.5, 1.95]
  const barGeometry = new THREE.BoxGeometry(0.32, 1, 0.32)
  barGeometry.translate(0, 0.5, 0)
  const barEdges = new THREE.EdgesGeometry(barGeometry)
  const barItems = barHeights.map((height, index) => {
    const group = new THREE.Group()
    const mesh = new THREE.Mesh(barGeometry, new THREE.MeshStandardMaterial({
      color: 0x071b34, emissive: index === barHeights.length - 1 ? 0x00805a : 0x006c8f,
      emissiveIntensity: 0.45, metalness: 0.5, roughness: 0.3, transparent: true, opacity: 0.85
    }))
    const edges = new THREE.LineSegments(barEdges, new THREE.LineBasicMaterial({
      color: index === barHeights.length - 1 ? GREEN : CYAN, transparent: true, opacity: 0.8
    }))
    group.add(mesh, edges)
    group.position.set(index * 0.48, 0, 0)
    group.scale.y = 0.05
    bars.add(group)
    return { group, height }
  })
  bars.position.set(isMobile ? -1.9 : -1.2, isMobile ? -2.6 : -3.05, -1.8)
  bars.rotation.y = 0.35
  root.add(bars)

  // Línea de tendencia sobre las barras
  const trendPoints = barHeights.map((height, index) => new THREE.Vector3(index * 0.48, height + 0.18, 0))
  const trend = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(trendPoints),
    new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: 0 })
  )
  bars.add(trend)

  // Paneles flotantes: resultados de búsqueda
  const panelGeometry = new THREE.PlaneGeometry(2.2, 0.62)
  const panelEdge = new THREE.EdgesGeometry(panelGeometry)
  const panelSpecs = isMobile
    ? [[-1.2, 2.6, -3.2, 0.7]]
    : [[-3.4, 1.9, -3.0, 0.9], [-1.0, 2.5, -3.6, 0.7], [0.6, -2.2, -2.6, 0.8]]
  const panels = panelSpecs.map(([x, y, z, scale], index) => {
    const group = new THREE.Group()
    group.add(new THREE.Mesh(panelGeometry, new THREE.MeshStandardMaterial({
      color: 0x071936, emissive: 0x003c58, emissiveIntensity: 0.34, transparent: true, opacity: 0.32,
      side: THREE.DoubleSide, depthWrite: false
    })))
    group.add(new THREE.LineSegments(panelEdge, new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.38 })))
    // "líneas de texto" del anuncio
    ;[0.12, -0.08].forEach((lineY, lineIndex) => {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(lineIndex ? 1.5 : 1.1, 0.06),
        new THREE.MeshBasicMaterial({ color: lineIndex ? 0x8ba3cc : CYAN, transparent: true, opacity: 0.55 })
      )
      line.position.set(lineIndex ? -0.2 : -0.4, lineY, 0.01)
      group.add(line)
    })
    group.position.set(x, y, z)
    group.scale.setScalar(scale)
    group.rotation.set(0.12, 0.25 - index * 0.2, 0.03)
    root.add(group)
    return { group, baseY: y, speed: 0.22 + index * 0.05 }
  })

  // Clics que viajan hacia la diana
  const clickCount = reducedMotion ? 0 : (isMobile ? 26 : 54)
  const clickGeometry = new THREE.BufferGeometry()
  const clickPositions = new Float32Array(clickCount * 3)
  const clicks = []
  function newClick(item) {
    const start = new THREE.Vector3(
      (isMobile ? -4 : -6.5) + Math.random() * 2,
      (Math.random() - 0.5) * 5,
      -1 - Math.random() * 3
    )
    const control = new THREE.Vector3(
      (start.x + targetPos.x) / 2 + (Math.random() - 0.5) * 2,
      Math.max(start.y, targetPos.y) + 1 + Math.random() * 1.5,
      -1.5 - Math.random() * 2
    )
    Object.assign(item, { start, control, t: Math.random() * 0.2, speed: 0.12 + Math.random() * 0.14 })
    return item
  }
  for (let i = 0; i < clickCount; i += 1) {
    const item = newClick({})
    item.t = Math.random()
    clicks.push(item)
  }
  clickGeometry.setAttribute('position', new THREE.BufferAttribute(clickPositions, 3))
  const clickPoints = new THREE.Points(clickGeometry, new THREE.PointsMaterial({
    color: GREEN, size: isMobile ? 0.06 : 0.07, transparent: true, opacity: 0.85, depthWrite: false
  }))
  root.add(clickPoints)

  // Polvo de fondo
  const dustCount = reducedMotion ? 0 : (isMobile ? 40 : 80)
  const dustPositions = new Float32Array(dustCount * 3)
  for (let i = 0; i < dustCount; i += 1) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 12
    dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 6
    dustPositions[i * 3 + 2] = -Math.random() * 5 - 1
  }
  const dustGeometry = new THREE.BufferGeometry()
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({
    color: CYAN, size: 0.03, transparent: true, opacity: 0.5, depthWrite: false
  }))
  root.add(dust)

  function resize() {
    const rect = host.getBoundingClientRect()
    renderer.setSize(rect.width, rect.height, false)
    camera.aspect = rect.width / Math.max(rect.height, 1)
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize, { passive: true })

  const ease = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3)
  const tmp = new THREE.Vector3()
  let hits = 0

  function renderFrame(time, delta) {
    root.rotation.y += (pointer.x * (isMobile ? 0.2 : 0.38) - root.rotation.y) * 0.035
    root.rotation.x += (-pointer.y * (isMobile ? 0.1 : 0.2) - root.rotation.x) * 0.035
    root.position.y = scrollProgress * -0.7

    target.rotation.y = Math.sin(time * 0.5) * 0.35
    rings.forEach((ring, index) => { ring.rotation.z = time * (0.25 + index * 0.18) * (index % 2 ? -1 : 1) })
    const pulse = 1 + Math.sin(time * 3) * 0.08 + Math.min(hits, 6) * 0.025
    bullseye.scale.setScalar(pulse)
    hits = Math.max(0, hits - delta * 4)

    // Las barras crecen en ciclos de 9 segundos
    const cycle = (time % 9) / 9
    barItems.forEach((bar, index) => {
      const grow = ease((cycle - index * 0.05) / 0.35)
      const fall = cycle > 0.88 ? ease((cycle - 0.88) / 0.12) : 0
      bar.group.scale.y = Math.max(0.05, bar.height * grow * (1 - fall * 0.9) + Math.sin(time * 2 + index) * 0.015)
    })
    trend.material.opacity = cycle > 0.4 && cycle < 0.88 ? 0.8 : Math.max(0, trend.material.opacity - 0.03)

    panels.forEach((item, index) => {
      item.group.position.y = item.baseY + Math.sin(time * item.speed + index) * 0.08
    })

    for (let i = 0; i < clickCount; i += 1) {
      const item = clicks[i]
      item.t += delta * item.speed
      if (item.t >= 1) {
        hits += 1
        newClick(item)
      }
      const t = item.t
      const u = 1 - t
      tmp.set(0, 0, 0)
        .addScaledVector(item.start, u * u)
        .addScaledVector(item.control, 2 * u * t)
        .addScaledVector(targetPos, t * t)
      clickPositions[i * 3] = tmp.x
      clickPositions[i * 3 + 1] = tmp.y
      clickPositions[i * 3 + 2] = tmp.z
    }
    if (clickCount) clickGeometry.attributes.position.needsUpdate = true
    if (dustCount) dust.rotation.y = time * 0.02

    renderer.render(scene, camera)
  }

  if (reducedMotion) {
    barItems.forEach((bar) => { bar.group.scale.y = bar.height })
    trend.material.opacity = 0.8
    renderFrame(0, 0)
    return
  }

  let running = true
  let frameId = 0
  const clock = new THREE.Clock()
  function animate() {
    if (!running) { frameId = 0; return }
    frameId = window.requestAnimationFrame(animate)
    const delta = Math.min(clock.getDelta(), 0.05)
    renderFrame(clock.elapsedTime, delta)
  }
  new IntersectionObserver((entries) => {
    running = Boolean(entries[0]?.isIntersecting) && !document.hidden
    if (running && !frameId) animate()
  }, { threshold: 0.05 }).observe(host)
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden
    if (running && !frameId) animate()
  })
  animate()
}

/* ---------- 2. Búsqueda que se escribe sola ---------- */
function typeSearches() {
  const box = document.getElementById('ppcQuery')
  const ad = document.getElementById('ppcAd')
  if (!box) return
  const queries = [
    'veterinaria 24 horas cerca',
    'abogado laboral en Córdoba',
    'comprar macetas grandes',
    'dentista en Palermo',
    'curso de inglés online'
  ]
  if (reducedMotion) { box.textContent = queries[0]; return }
  let q = 0
  let i = 0
  let deleting = false
  function step() {
    const text = queries[q]
    if (!deleting) {
      i += 1
      box.textContent = text.slice(0, i)
      if (i === text.length) {
        ad?.classList.add('is-match')
        deleting = true
        return setTimeout(step, 2200)
      }
      return setTimeout(step, 55 + Math.random() * 60)
    }
    i -= 1
    box.textContent = text.slice(0, i)
    if (i === 0) {
      ad?.classList.remove('is-match')
      deleting = false
      q = (q + 1) % queries.length
      return setTimeout(step, 400)
    }
    return setTimeout(step, 22)
  }
  setTimeout(step, 700)
}

/* ---------- 3. Detalles al hacer scroll ---------- */
function scrollDetails() {
  const items = [...document.querySelectorAll('[data-ppc-in]')]
  if (reducedMotion || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-in'))
    return
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.25 })
  items.forEach((item) => observer.observe(item))
}

document.documentElement.classList.add('ppc-motion')
createScene()
typeSearches()
scrollDetails()
