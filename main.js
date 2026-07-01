import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ===================== SETUP BÁSICO =====================
const canvas = document.getElementById('webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0f);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 0, 5);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// ===================== PARTICULAS BÁSICAS =====================
const COUNT = 5000;

const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(COUNT * 3);
const velocities = new Float32Array(COUNT * 3);
const sizes = new Float32Array(COUNT);

for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

    velocities[i * 3] = (Math.random() - 0.5) * 0.01;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

    sizes[i] = Math.random() * 3 + 1;
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

// ===================== SHADER MATERIAL =====================
const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uColor1: { value: new THREE.Color('#ff6030') },
        uColor2: { value: new THREE.Color('#1c4ed8') },
    },
    vertexShader: `
        attribute float aSize;
        uniform float uTime;
        uniform float uPixelRatio;

        varying vec3 vColor;

        // Simplex noise
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
            const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            vec3 i = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            i = mod289(i);
            vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            float n_ = 0.142857142857;
            vec3 ns = n_ * D.wyz - D.xzx;
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);
            vec4 x = x_ * ns.x + ns.yyyy;
            vec4 y = y_ * ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            vec4 s0 = floor(b0) * 2.0 + 1.0;
            vec4 s1 = floor(b1) * 2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
            vec3 p0 = vec3(a0.xy, h.x);
            vec3 p1 = vec3(a0.zw, h.y);
            vec3 p2 = vec3(a1.xy, h.z);
            vec3 p3 = vec3(a1.zw, h.w);
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
            p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        void main() {
            vec3 pos = position;

            // Movimiento con noise
            float noiseX = snoise(vec3(pos.x * 0.3, pos.y * 0.3, uTime * 0.2));
            float noiseY = snoise(vec3(pos.y * 0.3, pos.z * 0.3, uTime * 0.2 + 100.0));
            float noiseZ = snoise(vec3(pos.z * 0.3, pos.x * 0.3, uTime * 0.2 + 200.0));

            pos.x += noiseX * 0.5;
            pos.y += noiseY * 0.5;
            pos.z += noiseZ * 0.5;

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);

            vColor = mix(vec3(1.0, 0.376, 0.188), vec3(0.11, 0.306, 0.847), noiseX * 0.5 + 0.5);
        }
    `,
    fragmentShader: `
        varying vec3 vColor;

        void main() {
            float dist = distance(gl_PointCoord, vec2(0.5));
            if (dist > 0.5) discard;

            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            alpha *= 0.8;

            gl_FragColor = vec4(vColor, alpha);
        }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
});

const points = new THREE.Points(geometry, shaderMaterial);
scene.add(points);

// ===================== LUZ AMBIENTAL (para referencia) =====================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// ===================== RELOJ =====================
const clock = new THREE.Clock();

// ===================== LOOP DE ANIMACIÓN =====================
function animate() {
    const elapsedTime = clock.getElapsedTime();

    shaderMaterial.uniforms.uTime.value = elapsedTime;

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// ===================== RESIZE =====================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    shaderMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();
});
