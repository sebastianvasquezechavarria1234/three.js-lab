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

const clock = new THREE.Clock();

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

const windVertexShader = `
    uniform float uTime;
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

    void main() {
        vUv = uv;

        vec3 pos = position;

        float heightFactor = smoothstep(0.0, 2.0, pos.y);

        float windX = snoise(vec3(pos.x * 0.5, pos.y * 0.5, uTime * 0.8)) * 0.3;
        float windZ = snoise(vec3(pos.z * 0.5, pos.y * 0.5, uTime * 0.6 + 10.0)) * 0.2;

        float gust = snoise(vec3(pos.x * 0.1, pos.y * 0.1, uTime * 1.5)) * 0.5 + 0.5;
        gust = pow(gust, 3.0);

        pos.x += (windX + gust * 0.3) * heightFactor;
        pos.z += (windZ + gust * 0.2) * heightFactor;
        pos.y += snoise(vec3(pos.x * 0.3, pos.z * 0.3, uTime * 0.5)) * 0.05 * heightFactor;

        vElevation = pos.y;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

const windFragmentShader = `
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform float uTime;
    varying vec2 vUv;
    varying float vElevation;

    void main() {
        float mixFactor = sin(vUv.x * 10.0 + uTime) * 0.5 + 0.5;
        vec3 color = mix(uColor1, uColor2, mixFactor);

        float light = smoothstep(-1.0, 2.0, vElevation);
        color *= 0.8 + light * 0.4;

        gl_FragColor = vec4(color, 1.0);
    }
`;

function createWindMaterial(color1, color2) {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor1: { value: new THREE.Color(color1) },
            uColor2: { value: new THREE.Color(color2) },
        },
        vertexShader: windVertexShader,
        fragmentShader: windFragmentShader,
    });
}

const loader = new GLTFLoader();
let model;

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

                const windColors = [
                    [0x228B22, 0x90EE90],
                    [0x006400, 0x32CD32],
                    [0x004d00, 0x7CFC00],
                    [0x2e8b57, 0x98FB98],
                ];

                modelClone.traverse((child) => {
                    if (child.isMesh) {
                        const isLeaf = !child.name.toLowerCase().includes('trunk') &&
                                       !child.name.toLowerCase().includes('stem');
                        if (isLeaf) {
                            const leafMat = createWindMaterial(
                                windColors[j][0],
                                windColors[j][1]
                            );
                            child.material = leafMat;
                        }
                    }
                });

                childGroup.add(modelClone);
                group.add(childGroup);
            });
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

    scene.traverse((child) => {
        if (child.isMesh && child.material.isShaderMaterial && child.material.uniforms.uTime) {
            child.material.uniforms.uTime.value = elapsedTime;
        }
    });

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
