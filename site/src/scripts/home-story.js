import guideSheet from '../data/home-guide.json'

const ARRIVAL_TRAVEL_MS = 1100
const LANDING_PLAYBACK_RATE = .72

const story = document.querySelector('.home-story')
if (story) {
  const root = document.documentElement
  const header = document.getElementById('hdr')
  const art = story.querySelector('.hero-art')
  const mascot = art.querySelector('.hero-character')
  const folder = art.querySelector('.hero-folder')
  const canvas = art.querySelector('canvas')
  const context = canvas.getContext('2d')

  function paintCord() {
    if (!context) return
    const frame = art.getBoundingClientRect()
    const ratio = Math.min(2, devicePixelRatio)
    canvas.width = Math.round(frame.width * ratio)
    canvas.height = Math.round(frame.height * ratio)
    const anchor = (image, x, y) => {
      const rect = image.getBoundingClientRect()
      return [rect.left - frame.left + rect.width * x, rect.top - frame.top + rect.height * y]
    }
    const [x1, y1] = anchor(mascot, ...guideSheet.poster)
    const [x2, y2] = anchor(folder, .754, .560)
    const drift = Math.max(12, Math.abs(x2 - x1) * .27)
    context.setTransform(ratio,0,0,ratio,0,0)
    context.beginPath()
    context.moveTo(x1, y1)
    context.bezierCurveTo(x1 + drift, y1 + drift * .5, x2 - drift, y2 + drift * .67, x2, y2)
    context.lineCap = 'round'
    for (const [width, color, dash] of [[5,'#7d542c',[]],[3.6,'#c99151',[]],[1.1,'#fff0bd',[1.5,3]]]) {
      context.lineWidth = width
      context.strokeStyle = color
      context.setLineDash(dash)
      context.stroke()
    }
  }

  if ('ResizeObserver' in window) new ResizeObserver(paintCord).observe(art)
  else addEventListener('resize',paintCord,{passive:true})
  paintCord()

  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const phone = matchMedia('(max-width:700px)')
  const rail = story.querySelector('.flow-nav')
  const railLinks = [...rail.querySelectorAll('a')]
  const chapters = railLinks.map(link => story.querySelector(link.hash))
  const guideSprite = story.querySelector('.journey-guide')
  const guideContext = guideSprite.getContext('2d')
  const folderSprite = story.querySelector('.journey-folder')
  const dockGuide = story.querySelector('.dock-guide')
  const dockFolder = story.querySelector('.dock-folder')
  const note = story.querySelector('.journey-note')
  const cord = story.querySelector('.journey-cord')
  const pen = cord.getContext('2d')
  const domains = [...story.querySelectorAll('input[name="domain"]')]
  let layout
  let ready = false
  let atlas
  let clipClock = 0
  let landingClock = -1
  let parked = false
  let arrivalProgress = 0
  let lastSpriteFrame = -1
  let paintRequest = 0
  let visualY = scrollY
  let speed = 0
  let lastFrame = 0
  let activePhase = -1
  let idleSince = performance.now()
  let previousTarget = scrollY

  const clamp = (number, low, high) => Math.min(high, Math.max(low, number))
  const lerp = (first, next, ratio) => first + (next - first) * ratio
  const ease = value => value * value * (3 - 2 * value)
  const motionOn = () => ready && !reduced.matches && !!pen && !!guideContext

  function requestDraw() {
    if (!paintRequest) paintRequest = requestAnimationFrame(drawJourney)
  }

  function measureJourney() {
    const width = root.clientWidth
    const height = innerHeight
    const bar = header.offsetHeight
    const railTop = story.querySelector('.story-hero').getBoundingClientRect().bottom + scrollY
    const box = element => {
      const rect = element.getBoundingClientRect()
      return { x:rect.left + rect.width * .5, y:rect.top + scrollY + rect.height * .5, size:rect.width }
    }
    const finish = chapters.at(-1).getBoundingClientRect()
    const destination = box(dockGuide)
    const maxScroll = Math.max(0, root.scrollHeight - height)
    const end = Math.min(maxScroll, destination.y - height * .65)
    const begin = Math.min(finish.bottom + scrollY - bar - rail.offsetHeight - 62, end - Math.min(250,height * .29))
    story.style.setProperty('--nav', `${bar}px`)
    layout = { width,height,bar,railTop,
      hero:box(mascot), folder:box(folder),
      destination, dockFolder:box(dockFolder), begin, end,
      railX:railLinks.map(link => link.getBoundingClientRect().left + (phone.matches ? 24 : 29)),
      milestones:chapters.map(chapter => chapter.getBoundingClientRect().top + scrollY - Math.max(bar + rail.offsetHeight + 8, height * .30)),
    }
    const pixelRatio = Math.min(1.65, devicePixelRatio)
    cord.width = Math.round(width * pixelRatio)
    cord.height = Math.round(height * pixelRatio)
    pen?.setTransform(pixelRatio,0,0,pixelRatio,0,0)
    requestDraw()
  }

  function position(sprite, point) {
    const { x,y,size,tilt } = point
    sprite.style.transform = 'translate3d(' + (x - 160) + 'px,' + (y - 160)
      + 'px,0) rotate(' + tilt + 'deg) scale(' + size / 320 + ')'
  }

  function anchor(point, x, y) {
    const angle = point.tilt * Math.PI / 180
    const dx = (x - .5) * point.size
    const dy = (y - .5) * point.size
    return {x:point.x + dx * Math.cos(angle) - dy * Math.sin(angle),y:point.y + dx * Math.sin(angle) + dy * Math.cos(angle)}
  }

  function paintCharacter(dt, atDestination) {
    const elapsed = Math.min(dt,45) / 1000
    const { introDuration,walkDuration,landingDuration,intro,walk,land,columns,pixels } = guideSheet
    if (landingClock < 0) {
      clipClock += elapsed
      if (atDestination && clipClock >= introDuration && (clipClock-introDuration)%walkDuration < elapsed + .02) landingClock = 0
    }
    let frame
    if (landingClock >= 0) {
      landingClock += elapsed * LANDING_PLAYBACK_RATE
      frame = intro + walk + Math.min(land-1,Math.floor(landingClock/landingDuration*land))
      parked = landingClock >= landingDuration
    } else if (clipClock < introDuration) {
      frame = Math.min(intro-1,Math.floor(clipClock/introDuration*intro))
    } else {
      frame = intro + Math.floor(((clipClock-introDuration)%walkDuration)/walkDuration*walk)
    }
    if (frame !== lastSpriteFrame) {
      guideContext.clearRect(0, 0, guideSprite.width, guideSprite.height)
      guideContext.drawImage(atlas, frame % columns * pixels, Math.floor(frame / columns) * pixels, pixels, pixels,
        0, 0, guideSprite.width, guideSprite.height)
      lastSpriteFrame = frame
    }
    return guideSheet.grips[frame]
  }

  function drawJourney(now) {
    paintRequest = 0
    if (!layout) return
    const target = Math.max(0, scrollY)
    if (target !== previousTarget) {
      idleSince = now
      previousTarget = target
    }
    const dt = lastFrame ? clamp(now - lastFrame,5,90) : 16
    lastFrame = now
    // Smooth the prop's inertia during fast jumps between chapters.
    const recoil = (speed + .017 * (visualY - target)) * dt
    const damping = Math.exp(-dt * .017)
    visualY = target + (visualY - target + recoil) * damping
    speed = (speed - recoil * .017) * damping
    if (!motionOn() || (Math.abs(target - visualY) < .4 && Math.abs(speed) < .009)) {
      visualY = target
      speed = 0
    }
    const { width,height,bar,railTop,hero,milestones,railX,begin,end,destination } = layout
    let current = 0
    while (current < milestones.length - 1 && target >= milestones[current + 1]) current++
    if (current !== activePhase) {
      activePhase = current
      railLinks.forEach((link,i) => {
        if (i === current) link.setAttribute('aria-current','step')
        else link.removeAttribute('aria-current')
      })
    }

    const enabled = motionOn()
    const departing = clamp((visualY - height * .09) / Math.max(180, railTop - bar - height * .09),0,1)
    // Give the descent its own pace even when the page scrolls quickly.
    const desiredArrival = clamp((target - begin) / Math.max(1,end - begin),0,1)
    const arrivalStep = dt / ARRIVAL_TRAVEL_MS
    const settling = enabled && desiredArrival - arrivalProgress > arrivalStep
    arrivalProgress = settling ? arrivalProgress + arrivalStep : desiredArrival
    const arriving = arrivalProgress
    if (parked && target < begin) {
      parked = false
      landingClock = -1
      if (target <= height * .09) clipClock = 0
    }
    if (arriving < .88 && landingClock >= 0 && !parked) {
      landingClock = -1
    }
    const atDestination = arriving >= 1 && target >= end
    const show = enabled && !parked && target < destination.y + destination.size
    story.classList.toggle('motion-ready',show)
    story.classList.toggle('story-arrived',target >= end)
    guideSprite.hidden = folderSprite.hidden = cord.hidden = !show
    note.hidden = !show || departing < .98 || arriving > .22 || current === 0
    if (visualY !== target || settling) requestDraw()
    if (!show) return
    // Let the intro finish, then stop the sprite when the visitor stops scrolling.
    // Landing still plays once when the dock is in view.
    const isMoving = clipClock < guideSheet.introDuration + guideSheet.walkDuration
      || now - idleSince < 700 || settling || atDestination
    if (isMoving && !document.hidden) requestDraw()

    const next = Math.min(current + 1,railX.length - 1)
    const segment = current === next ? 0 : ease(clamp((visualY - milestones[current]) / (milestones[next] - milestones[current]),0,1))
    const dockX = lerp(railX[current],railX[next],segment)
    const dockY = Math.max(bar,railTop - visualY) + (phone.matches ? 18 : 20)
    const t = ease(departing)
    const delayed = ease(clamp(departing * 1.07 - .07,0,1))
    const dockSize = phone.matches ? 43 : 52
    const character = {
      x:lerp(hero.x,dockX,t),
      y:lerp(hero.y - visualY,dockY,t) - 22 * Math.sin(t * Math.PI),
      size:lerp(hero.size,dockSize,t),
      tilt:Math.sin(t * Math.PI) * -8,
    }
    const prop = layout.folder
    const load = {
      x:lerp(prop.x,clamp(dockX - (phone.matches ? 31 : 41),15,width - 14),delayed),
      y:lerp(prop.y - visualY,dockY + 6,delayed),
      size:lerp(prop.size,phone.matches ? 24 : 28,delayed),
      tilt:Math.sin(t * Math.PI) * 13 + Math.sin(segment * Math.PI) * -4,
    }
    const landing = landingClock >= 0 ? 1 : ease(arriving)
    const folderLanding = landingClock >= 0 ? 1 : ease(clamp((arriving - .1) / .9,0,1))
    character.x = lerp(character.x,destination.x,landing)
    character.y = lerp(character.y,destination.y - target,landing) - 18 * Math.sin(landing * Math.PI)
    character.size = lerp(character.size,destination.size,landing)
    character.tilt *= 1 - landing
    load.x = lerp(load.x,layout.dockFolder.x,folderLanding)
    load.y = lerp(load.y,layout.dockFolder.y - target,folderLanding)
    load.size = lerp(load.size,layout.dockFolder.size,folderLanding)
    load.tilt *= 1 - folderLanding

    const [holdX,holdY,gripped] = paintCharacter(isMoving ? dt : 0, atDestination)
    const walkStart = guideSheet.introDuration - guideSheet.walkDuration
    const pull = gripped * (1 - t) * (.64 + .36 * Math.sin((clipClock - walkStart) / guideSheet.walkDuration * Math.PI * 2))
    load.x -= pull * (phone.matches ? 10 : 18)
    load.y -= pull * 3
    load.tilt -= pull * 5
    position(guideSprite,character)
    position(folderSprite,load)

    const last = anchor(load,.754,.560)
    const hold = anchor(character,holdX,holdY)
    const slack = Math.min(40,Math.max(14,load.size*.34))
    const first = {
      x:lerp(last.x - slack,hold.x,gripped),
      y:lerp(last.y + slack*.44,hold.y,gripped),
    }
    const dx = last.x - first.x
    const sag = Math.min(19,Math.hypot(dx,last.y - first.y) * .13)
    pen.clearRect(0,0,width,height)
    pen.globalAlpha = landingClock >= 0 ? gripped : 1
    pen.beginPath()
    pen.moveTo(first.x,first.y)
    pen.bezierCurveTo(first.x + dx * .28,first.y + sag,last.x - dx * .27,last.y + sag,last.x,last.y)
    pen.lineCap = 'round'
    for (const [weight,color,dash] of [[5,'#7d542c',[]],[3.6,'#c99151',[]],[1.1,'#fff0bd',[1.6,3]]]) {
      pen.lineWidth = weight * lerp(1,.47,t * (1 - landing))
      pen.strokeStyle = color
      pen.setLineDash(dash)
      pen.stroke()
    }

    if (!note.hidden) {
      const domain = domains.find(option => option.checked) ?? domains[0]
      const text = ['已选领域', '目标', domain.dataset.record, domain.dataset.pending, '已回填'][current]
      if (note.textContent !== text) note.textContent = text
      const middle = (first.x + last.x) * .5
      const onRight = middle < 79
      note.classList.toggle('to-right',onRight)
      const noteLeft = middle + (onRight ? 9 : -8)
      note.style.transform = 'translate3d(' + noteLeft + 'px,' + ((first.y + last.y) * .5 - 9) + 'px,0)' + (onRight ? '' : ' translateX(-100%)')
    }
  }

  function loadAnimatedGuide() {
    if (reduced.matches || !pen || !guideContext || atlas) return
    atlas = new Image()
    atlas.src = guideSprite.dataset.src
    atlas.decode().then(() => { ready = true; requestDraw() },() => {})
  }

  addEventListener('scroll',requestDraw,{passive:true})
  addEventListener('resize',measureJourney,{passive:true})
  document.addEventListener('visibilitychange',() => { if (!document.hidden) requestDraw() })
  reduced.addEventListener('change',() => { loadAnimatedGuide(); requestDraw() })
  function restartJourney() {
    parked = false
    landingClock = -1
    clipClock = 0
    requestDraw()
  }

  domains.forEach(domain => domain.addEventListener('change',() => {
    if (parked) restartJourney()
    measureJourney()
  }))
  document.querySelector('[data-story-replay]').addEventListener('click', restartJourney)
  if ('ResizeObserver' in window) {
    const journeySize = new ResizeObserver(measureJourney)
    journeySize.observe(story)
    journeySize.observe(rail)
    journeySize.observe(header)
  }
  if ('IntersectionObserver' in window) {
    const entry = new IntersectionObserver(changes => {
      for (const change of changes) {
        if (!change.isIntersecting) continue
        change.target.classList.add('in-view')
        entry.unobserve(change.target)
      }
    },{rootMargin:'0px 0px -11% 0px'})
    chapters.slice(1).forEach(chapter => entry.observe(chapter))
  }
  measureJourney()
  if ('IntersectionObserver' in window) {
    const nearStory = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadAnimatedGuide()
    }, { rootMargin: '180px 0px' })
    nearStory.observe(story)
  } else {
    loadAnimatedGuide()
  }
}
