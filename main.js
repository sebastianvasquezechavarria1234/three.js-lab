import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.getElementById('webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

const groups = [
    { color: 0xff3333, pos: new THREE.Vector3(-5, 0.01, -5) },
    { color: 0x33cc33, pos: new THREE.Vector3(5, 0.01, -5) },
    { color: 0x3366ff, pos: new THREE.Vector3(-5, 0.01, 5) },
    { color: 0xffcc00, pos: new THREE.Vector3(5, 0.01, 5) },
];

const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
let model;
let petalTexture;
let fogTexture;
let petalGeo;
const clock = new THREE.Clock();

textureLoader.load('./img/petal.webp', (texture) => {
    petalTexture = texture;
});

textureLoader.load('./img/fog-5.webp', (texture) => {
    fogTexture = texture;
});

loader.load('./models/Tree.glb', (gltf) => {
    model = gltf.scene;

    model.traverse((child) => {
        if (child.isMesh) {
            console.log('Mesh name:', child.name, '| Material:', child.material.name);
        }
    });

    groups.forEach((g, i) => {
        const group = new THREE.Group();
        group.name = `group-${i + 1}`;
        group.position.copy(g.pos);

        const geo = new THREE.PlaneGeometry(10, 10);
        const mat = new THREE.MeshStandardMaterial({
            color: g.color,
            side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        group.add(mesh);

        if (i === 1) {
            const fogGeo = new THREE.BufferGeometry();
            const fogPos = new Float32Array([0, 2.8, 0]);
            fogGeo.setAttribute('position', new THREE.BufferAttribute(fogPos, 3));

            const fogMat = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 12,
                sizeAttenuation: true,
                map: fogTexture,
                transparent: true,
                alphaTest: 0.01,
                depthWrite: false,
            });

            const fogParticle = new THREE.Points(fogGeo, fogMat);
            fogParticle.name = 'fog-particle';
            group.add(fogParticle);

            const particleCount = 40;
            const radius = 3;
            petalGeo = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);

            for (let p = 0; p < particleCount; p++) {
                const angle = (p / particleCount) * Math.PI * 2;
                positions[p * 3] = Math.cos(angle) * radius;
                positions[p * 3 + 1] = 0.5;
                positions[p * 3 + 2] = Math.sin(angle) * radius;
            }

            petalGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const particleMat = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.5,
                sizeAttenuation: true,
                map: petalTexture,
                transparent: true,
                alphaTest: 0.1,
            });

            const particles = new THREE.Points(petalGeo, particleMat);
            group.add(particles);
            group.userData.particleCount = particleCount;
            group.userData.particleRadius = radius;
        }

        if (i === 0) {
            const childColors = [0xff6600, 0x9933ff, 0x00cccc, 0xff66cc];
            const childPositions = [
                new THREE.Vector3(-2.5, 0.01, -2.5),
                new THREE.Vector3(2.5, 0.01, -2.5),
                new THREE.Vector3(-2.5, 0.01, 2.5),
                new THREE.Vector3(2.5, 0.01, 2.5),
            ];

            childPositions.forEach((pos, j) => {
                const childGroup = new THREE.Group();
                childGroup.name = `group-1-hijo-${j + 1}`;
                childGroup.position.copy(pos);

                const childGeo = new THREE.PlaneGeometry(5, 5);
                const childMat = new THREE.MeshStandardMaterial({
                    color: childColors[j],
                    side: THREE.DoubleSide,
                });
                const childMesh = new THREE.Mesh(childGeo, childMat);
                childMesh.rotation.x = -Math.PI / 2;
                childGroup.add(childMesh);

                const modelClone = model.clone();
                modelClone.scale.set(0.5, 0.5, 0.5);
                modelClone.position.y = 0;
                childGroup.add(modelClone);

                group.add(childGroup);
            });
        }

        if (i === 2) {
            const montGroup = new THREE.Group();
            montGroup.name = 'mont';

            const montGeo = new THREE.PlaneGeometry(10, 10, 128, 128);

            const montVertShader = `
                varying vec2 vUv;
                varying float vElevation;

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

                float warp(vec2 p) {
                    float n1 = snoise(vec3(p * 0.5, 0.0));
                    float n2 = snoise(vec3(p * 0.5 + vec2(5.2, 1.3), 0.0));
                    return n1 * 0.5 + n2 * 0.5;
                }

                float ridgeNoise(vec3 p) {
                    return 1.0 - abs(snoise(p));
                }

                void main() {
                    vUv = uv;
                    vec3 pos = position;

                    vec2 stretched = vec2(pos.x * 0.4, pos.y * 1.5);

                    float wx = warp(stretched * 1.0);
                    float wy = warp(stretched * 1.0 + vec2(5.2, 1.3));
                    vec2 warped = stretched + vec2(wx, wy) * 0.6;

                    float wx2 = warp(warped * 2.0 + vec2(1.7, 9.2));
                    float wy2 = warp(warped * 2.0 + vec2(8.3, 2.8));
                    vec2 warped2 = warped + vec2(wx2, wy2) * 0.3;

                    vec3 warp3d = vec3(warped2, 0.0);

                    float n1 = ridgeNoise(warp3d * 0.3) * 2.5;
                    float n2 = ridgeNoise(warp3d * 0.6 + 10.0) * 1.25;
                    float n3 = ridgeNoise(warp3d * 1.2 + 20.0) * 0.625;
                    float n4 = ridgeNoise(warp3d * 2.4 + 30.0) * 0.3125;
                    float n5 = ridgeNoise(warp3d * 4.8 + 40.0) * 0.15625;
                    float n6 = ridgeNoise(warp3d * 9.6 + 50.0) * 0.078125;
                    float n7 = ridgeNoise(warp3d * 19.2 + 60.0) * 0.0390625;
                    float n8 = ridgeNoise(warp3d * 38.4 + 70.0) * 0.01953125;

                    float elevation = n1 + n2 + n3 + n4 + n5 + n6 + n7 + n8;

                    pos.z += elevation;
                    vElevation = elevation;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `;

            const montFragShader = `
                varying vec2 vUv;
                varying float vElevation;

                void main() {
                    float minH = -2.0;
                    float maxH = 2.5;
                    float t = (vElevation - minH) / (maxH - minH);
                    t = clamp(t, 0.0, 1.0);

                    vec3 lowColor = vec3(0.1, 0.5, 0.1);
                    vec3 midColor = vec3(0.55, 0.35, 0.15);
                    vec3 highColor = vec3(0.9, 0.9, 0.9);

                    vec3 color;
                    if (t < 0.4) {
                        color = mix(lowColor, midColor, t / 0.4);
                    } else {
                        color = mix(midColor, highColor, (t - 0.4) / 0.6);
                    }

                    gl_FragColor = vec4(color, 1.0);
                }
            `;

            const montMat = new THREE.ShaderMaterial({
                vertexShader: montVertShader,
                fragmentShader: montFragShader,
                side: THREE.DoubleSide,
            });

            const montMesh = new THREE.Mesh(montGeo, montMat);
            montMesh.rotation.x = -Math.PI / 2;
            montMesh.position.y = 1.5;
            montGroup.add(montMesh);

            group.add(montGroup);
        }

        scene.add(group);
    });
});

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

function animate() {
    const elapsedTime = clock.getElapsedTime();

    if (petalGeo) {
        const positions = petalGeo.attributes.position.array;
        const group2 = scene.getObjectByName('group-2');
        if (group2) {
            const count = group2.userData.particleCount;
            const radius = group2.userData.particleRadius;
            for (let p = 0; p < count; p++) {
                const baseAngle = (p / count) * Math.PI * 2;
                const angle = baseAngle + elapsedTime * 0.5;
                positions[p * 3] = Math.cos(angle) * radius;
                positions[p * 3 + 2] = Math.sin(angle) * radius;
            }
            petalGeo.attributes.position.needsUpdate = true;
        }
    }

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
