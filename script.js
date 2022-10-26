/*********
 * made by Matthias Hurrle (@atzedent)
 */

/** @type {HTMLCanvasElement} */
const canvas = window.canvas
const gl = canvas.getContext("webgl2")
const dpr = Math.max(1, window.devicePixelRatio)

const vertexSource = `#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

in vec2 position;

void main(void) {
    gl_Position = vec4(position, 0., 1.);
}
`
const fragmentSource = `#version 300 es
/*********
* made by Matthias Hurrle (@atzedent)
*/

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

out vec4 fragColor;

uniform vec2 resolution;
uniform float time;

#define T time
#define S smoothstep

vec3 hash(vec3 p) {
	p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
		dot(p, vec3(269.5, 183.3, 246.1)),
		dot(p, vec3(113.5, 271.9, 124.6)));

	return -1. + 2.*fract(sin(p)*43758.5453123);
}

float noise(vec3 p) {
	vec3 i = floor(p);
	vec3 f = fract(p);

	vec3 u = f*f*(3.0-2.0*f);

	return mix(mix(mix(dot(hash(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)),
		dot(hash(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)), u.x),
		mix(dot(hash(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)),
			dot(hash(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)), u.x), u.y),
		mix(mix(dot(hash(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)),
			dot(hash(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)), u.x),
			mix(dot(hash(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)),
				dot(hash(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)), u.x), u.y), u.z);
}

void main(void) {
	vec2 uv = (
		gl_FragCoord.xy - .5 * resolution.xy
	) / min(resolution.x, resolution.y);

    float rhm = S(.0,.125, sin(T))*.02;
	uv.x += rhm;
	vec2 p = uv * 6.;

	float r = length(uv*1.85);
	float a = atan(p.y, p.x) * radians(120.);

	vec3 col = vec3(0);

	float ss = .5 + .5 * sin(T);
	float anim = 1.+.1*ss*clamp(1.-r,.0, 1.);
	r *= anim;

	if (r < .8) {
		col = vec3(.0,.3,.4);

		float f = noise(vec3(p, p.x+p.y));
		col = mix(col, vec3(.2,.5,.4), f);

		f = 1.-S(.2,.5, r);
		col = mix(col, vec3(.9,.6,.2), f);

		a += .75*noise(vec3(p,12.0));

		f = noise(vec3(.5*r, 5.*a,36.0));
		col = mix(col, vec3(1), f);

		f = noise(vec3(16.*r, 22.*a,12.0));
		col *= 1.-f;

		f = S(.6,.8, r);
		col *= 1. - .5 * f;

		f = S(.2,.3, r);
		col *= f;

		f = 1.-S(.0,.25, length(uv-vec2(.125)-rhm));
		col += vec3(1,.9,.8)*f*.9;

		f = S(.75,.8, r);
		col = mix(col, vec3(0), f);
	}

	fragColor = vec4(col, 1.0);
}
`
let time
let buffer
let program
let resolution
let vertices = []

function resize() {
  const { innerWidth: width, innerHeight: height } = window

  canvas.width = width * dpr
  canvas.height = height * dpr

  gl.viewport(0, 0, width * dpr, height * dpr)
}

function compile(shader, source) {
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
  }
}

function setup() {
  const vs = gl.createShader(gl.VERTEX_SHADER)
  const fs = gl.createShader(gl.FRAGMENT_SHADER)

  program = gl.createProgram()

  compile(vs, vertexSource)
  compile(fs, fragmentSource)

  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program))
  }

  vertices = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]

  buffer = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  const position = gl.getAttribLocation(program, "position")

  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  time = gl.getUniformLocation(program, "time")
  resolution = gl.getUniformLocation(program, "resolution")
}

function draw(now) {
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)

  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

  gl.uniform1f(time, now * 0.001)
  gl.uniform2f(resolution, canvas.width, canvas.height)
  gl.drawArrays(gl.TRIANGLES, 0, vertices.length * 0.5)
}

function loop(now) {
  draw(now)
  requestAnimationFrame(loop)
}

function init() {
  setup()
  resize()
  loop(0)
}

document.body.onload = init
window.onresize = resize