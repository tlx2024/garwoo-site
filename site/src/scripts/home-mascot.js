export const GUIDE_CLIPS = {
  intro: { duration: 3.02, frames: 72 },
  walk: { duration: 1.2, frames: 29 },
  land: { duration: 1.46, frames: 35 },
}

const clamp = value => Math.min(1, Math.max(0, value))
const smooth = value => {
  const t = clamp(value)
  return t * t * (3 - 2 * t)
}
const ramp = (time, start, end) => smooth((time - start) / (end - start))
const envelope = (time, a, b, c, d) => ramp(time, a, b) * (1 - ramp(time, c, d))

export function mascotPose(phase, time) {
  const intro = phase === 'intro'
  const landing = phase === 'land'
  const greeting = intro ? envelope(time, .04, .27, .72, 1.18) : 0
  const grip = intro ? ramp(time, 1.13, 1.74) : landing ? 1 - ramp(time, .42, .79) : 1
  const walk = grip * (intro ? ramp(time, 1.60, 2.05) : landing ? 1 - ramp(time, .05, .35) : 1)
  const cycle = (intro ? Math.max(0, time - 1.82) : time) * (2 * Math.PI / GUIDE_CLIPS.walk.duration)
  const step = Math.sin(cycle) * walk
  const wave = Math.sin(time * 19 - .7) * greeting
  const bounce = greeting * .026 * Math.sin(time * 13) ** 2 + walk * .023 * Math.sin(cycle) ** 2
  const squat = landing ? envelope(time, .42, .58, .66, .95) : 0
  const settle = landing ? ramp(time, .68, 1.30) : 0
  const blink = intro ? envelope(time, .87, .96, .99, 1.12)
    : landing ? envelope(time, .67, .742, .77, .91)
    : envelope(time, .72, .790, .815, .935)

  return {
    x: -.026 * grip + .018 * step,
    y: -bounce + .025 * squat,
    width: 1 + .052 * squat + .021 * step,
    height: 1 - .073 * squat - .017 * step,
    angle: -.038 * grip + .059 * wave + .053 * step + .048 * settle,
    handX: .013 * greeting + .029 * wave - .027 * grip,
    handY: -.020 * greeting + .013 * wave + .028 * grip,
    feet: .027 * step,
    blink: 1.60 * blink,
    grip,
  }
}

function ropeAnchor(pose, wristMoves) {
  const x = (.81 + (wristMoves ? pose.handX : 0) - .5) * pose.width
  const y = (.486 + (wristMoves ? pose.handY : 0) - .5) * pose.height
  const cos = Math.cos(pose.angle)
  const sin = Math.sin(pose.angle)
  return [
    .5 + pose.x + cos * x - sin * y,
    .5 + pose.y + sin * x + cos * y,
    pose.grip,
  ]
}

export const POSTER_GRIP = ropeAnchor(mascotPose('walk', .24), true)

const vertexSource = `
attribute vec2 vertex;
varying vec2 uv;
void main() {
  uv = vec2((vertex.x + 1.0) * .5, (1.0 - vertex.y) * .5);
  gl_Position = vec4(vertex, 0.0, 1.0);
}`

const fragmentSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 uv;
uniform sampler2D image;
uniform vec2 shift;
uniform vec2 scale;
uniform vec2 hand;
uniform float tilt;
uniform float feet;
uniform float blink;

float influence(vec2 point, vec2 center, vec2 extent) {
  vec2 distance = (point - center) / extent;
  return exp(-dot(distance, distance));
}

void main() {
  float s = sin(tilt);
  float c = cos(tilt);
  vec2 offset = uv - vec2(.5) - shift;
  vec2 point = vec2(c * offset.x + s * offset.y, -s * offset.x + c * offset.y) / scale + vec2(.5);
  vec2 source = point;
  source -= hand * influence(point, vec2(.821, .427), vec2(.127, .226));
  source.y -= feet * influence(point, vec2(.348, .823), vec2(.105, .113));
  source.y += feet * influence(point, vec2(.583, .823), vec2(.106, .110));
  vec2 leftEye = vec2(.42, .476);
  vec2 rightEye = vec2(.614, .433);
  source.y += blink * (point.y - leftEye.y) * influence(point, leftEye, vec2(.049, .083));
  source.y += blink * (point.y - rightEye.y) * influence(point, rightEye, vec2(.049, .080));
  if (any(lessThan(source, vec2(0.0))) || any(greaterThan(source, vec2(1.0)))) {
    gl_FragColor = vec4(0.0);
  } else {
    vec4 sampleColor = texture2D(image, source);
    sampleColor.a *= smoothstep(.018, .115, sampleColor.a);
    gl_FragColor = sampleColor;
  }
}`

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader))
  }
  return shader
}

function createWarp(image) {
  const surface = document.createElement('canvas')
  const gl = surface.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false })
  if (!gl) return null

  const program = gl.createProgram()
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource)
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  gl.useProgram(program)

  const mesh = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'vertex')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  const slots = Object.fromEntries(['shift', 'scale', 'hand', 'tilt', 'feet', 'blink']
    .map(name => [name, gl.getUniformLocation(program, name)]))
  let lost = false
  surface.addEventListener('webglcontextlost', () => { lost = true })

  return (pose, size) => {
    if (lost || gl.isContextLost()) return null
    if (surface.width !== size || surface.height !== size) {
      surface.width = surface.height = size
      gl.viewport(0, 0, size, size)
    }
    gl.uniform2f(slots.shift, pose.x, pose.y)
    gl.uniform2f(slots.scale, pose.width, pose.height)
    gl.uniform2f(slots.hand, pose.handX, pose.handY)
    gl.uniform1f(slots.tilt, pose.angle)
    gl.uniform1f(slots.feet, pose.feet)
    gl.uniform1f(slots.blink, pose.blink)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    return surface
  }
}

export function createMascotPainter(canvas, context, image) {
  let warp
  try {
    warp = createWarp(image)
  } catch {
    // A browser can expose WebGL but decline shader compilation.
  }

  return (pose, size) => {
    if (canvas.width !== size || canvas.height !== size) {
      canvas.width = canvas.height = size
    }
    context.clearRect(0, 0, size, size)
    const painted = warp?.(pose, size)
    if (painted) {
      context.drawImage(painted, 0, 0)
    } else {
      context.save()
      context.translate(size * (.5 + pose.x), size * (.5 + pose.y))
      context.rotate(pose.angle)
      context.scale(pose.width, pose.height)
      context.imageSmoothingQuality = 'high'
      context.drawImage(image, -size / 2, -size / 2, size, size)
      context.restore()
    }
    return ropeAnchor(pose, Boolean(painted))
  }
}
