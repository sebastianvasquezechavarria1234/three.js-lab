import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

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
    color: 0x000000,
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
    { color: 0x888888, pos: new THREE.Vector3(5, 10, 5) },
];

const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const loadingManager = new THREE.LoadingManager();
let model;
let petalTexture;
let fogTexture;
let planeTextures = {};
let paredTextures = {};
let petalGeo;
let textMeshRef = null;
const clock = new THREE.Clock();

const promises = [];

promises.push(new Promise((resolve) => {
    textureLoader.load('./img/petal.webp', (texture) => {
        petalTexture = texture;
        resolve();
    });
}));

promises.push(new Promise((resolve) => {
    textureLoader.load('./img/fog-5.webp', (texture) => {
        fogTexture = texture;
        resolve();
    });
}));

const textureNames = ['BaseColor', 'Normal', 'Roughness', 'AmbientOcclusion', 'Height'];
textureNames.forEach((name) => {
    promises.push(new Promise((resolve) => {
        textureLoader.load(`./textures/plane/woodplank_39_${name}-2K.jpg`, (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, 2);
            planeTextures[name] = texture;
            resolve();
        });
    }));
});

const paredTextureNames = ['basecolor', 'normal', 'roughness', 'height'];
paredTextureNames.forEach((name) => {
    promises.push(new Promise((resolve) => {
        textureLoader.load(`./textures/pared/marble_108_${name}-1K.png`, (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, 2);
            paredTextures[name] = texture;
            resolve();
        });
    }));
});

promises.push(new Promise((resolve) => {
    loader.load('./models/Tree.glb', (gltf) => {
        model = gltf.scene;
        resolve();
    });
}));

Promise.all(promises).then(() => {

    model.traverse((child) => {
        if (child.isMesh) {
            console.log('Mesh name:', child.name, '| Material:', child.material.name);
        }
    });

    groups.forEach((g, i) => {
        const group = new THREE.Group();
        group.name = `group-${i + 1}`;
        group.position.copy(g.pos);

        const isGroup4 = i === 3;
        const geo = new THREE.PlaneGeometry(10, 10, 128, 128);

        if (isGroup4) {
            const uv = geo.attributes.uv;
            geo.setAttribute('uv2', new THREE.BufferAttribute(uv.array.slice(), 2));
        }

        const mat = new THREE.MeshStandardMaterial({
            color: 0x000000,
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

                void main() {
                    vUv = uv;
                    vec3 pos = position;

                    float n1 = snoise(vec3(pos.x * 0.3, pos.y * 0.3, 0.0)) * 2.0;
                    float n2 = snoise(vec3(pos.x * 0.6, pos.y * 0.6, 10.0)) * 1.0;
                    float n3 = snoise(vec3(pos.x * 1.2, pos.y * 1.2, 20.0)) * 0.5;
                    float n4 = snoise(vec3(pos.x * 2.4, pos.y * 2.4, 30.0)) * 0.25;
                    float n5 = snoise(vec3(pos.x * 4.8, pos.y * 4.8, 40.0)) * 0.125;
                    float n6 = snoise(vec3(pos.x * 9.6, pos.y * 9.6, 50.0)) * 0.0625;
                    float n7 = snoise(vec3(pos.x * 19.2, pos.y * 19.2, 60.0)) * 0.03125;
                    float n8 = snoise(vec3(pos.x * 38.4, pos.y * 38.4, 70.0)) * 0.015625;
                    float n9 = snoise(vec3(pos.x * 76.8, pos.y * 76.8, 80.0)) * 0.0078125;
                    float n10 = snoise(vec3(pos.x * 153.6, pos.y * 153.6, 90.0)) * 0.00390625;
                    float n11 = snoise(vec3(pos.x * 307.2, pos.y * 307.2, 100.0)) * 0.001953125;
                    float n12 = snoise(vec3(pos.x * 614.4, pos.y * 614.4, 110.0)) * 0.0009765625;
                    float n13 = snoise(vec3(pos.x * 1228.8, pos.y * 1228.8, 120.0)) * 0.00048828125;
                    float n14 = snoise(vec3(pos.x * 2457.6, pos.y * 2457.6, 130.0)) * 0.000244140625;
                    float n15 = snoise(vec3(pos.x * 4915.2, pos.y * 4915.2, 140.0)) * 0.0001220703125;

                    float elevation = max(0.0, n1 + n2 + n3 + n4 + n5 + n6 + n7 + n8 + n9 + n10 + n11 + n12 + n13 + n14 + n15);

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
                    float maxH = 4.0;
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
            montMesh.position.y = 0.1;
            montGroup.add(montMesh);

            group.add(montGroup);
        }

        if (i === 3) {
            const paredGeo = new THREE.PlaneGeometry(10, 10, 128, 128);

            const bulbColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
            const bulbs = [];
            const bulbLights = [];

            bulbColors.forEach((color, j) => {
                const bulbGeo = new THREE.SphereGeometry(0.15, 16, 16);
                const bulbMat = new THREE.MeshStandardMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 2,
                    roughness: 0.2,
                    metalness: 0.8,
                });
                const bulb = new THREE.Mesh(bulbGeo, bulbMat);
                bulb.position.set(
                    (Math.random() - 0.5) * 8,
                    2 + Math.random() * 6,
                    (Math.random() - 0.5) * 8
                );
                group.add(bulb);
                bulbs.push(bulb);

                const pointLight = new THREE.PointLight(color, 150, 25);
                pointLight.position.copy(bulb.position);
                group.add(pointLight);
                bulbLights.push(pointLight);

                bulb.userData.speed = 0.5 + Math.random() * 1.5;
                bulb.userData.offset = Math.random() * Math.PI * 2;
            });

            group.userData.bulbs = bulbs;
            group.userData.bulbLights = bulbLights;

            const pared1 = new THREE.Group();
            pared1.name = 'pared-1';
            const pared1Mat = new THREE.MeshStandardMaterial({
                color: 0x000000,
                side: THREE.DoubleSide,
            });
            const pared1Mesh = new THREE.Mesh(paredGeo, pared1Mat);
            pared1Mesh.rotation.y = 0;
            pared1Mesh.position.set(0, 5, -5);
            pared1.add(pared1Mesh);
            group.add(pared1);

            const pared2 = new THREE.Group();
            pared2.name = 'pared-2';
            const pared2Mat = new THREE.MeshStandardMaterial({
                color: 0x000000,
                side: THREE.DoubleSide,
            });
            const pared2Mesh = new THREE.Mesh(paredGeo, pared2Mat);
            pared2Mesh.rotation.y = -Math.PI / 2;
            pared2Mesh.position.set(5, 5, 0);
            pared2.add(pared2Mesh);
            group.add(pared2);

            const fontLoader = new FontLoader();
            fontLoader.load(
                './font/Luckiest Guy_Regular.json',
                (font) => {
                    const textGeo = new TextGeometry('sebastian v.', {
                        font: font,
                        size: 0.5,
                        height: 0.1,
                        curveSegments: 12,
                    });
                    textGeo.computeBoundingBox();
                    textGeo.center();
                    const textMat = new THREE.MeshStandardMaterial({
                        color: 0xffffff,
                        emissive: 0xffffff,
                        emissiveIntensity: 0.5,
                    });
                    const textMesh = new THREE.Mesh(textGeo, textMat);
                    textMesh.rotation.x = -Math.PI / 2;
                    textMesh.position.set(0, 0.05, 0);
                    group.add(textMesh);
                    textMeshRef = textMesh;
                },
                undefined,
                (err) => {
                    console.error('Error loading font:', err);
                }
            );
        }

        if (i === 4) {
            group.name = 'techo';
            const techoGeo = new THREE.PlaneGeometry(10, 10);
            const techoMat = new THREE.MeshStandardMaterial({
                color: 0x000000,
                side: THREE.DoubleSide,
            });
            const techoMesh = new THREE.Mesh(techoGeo, techoMat);
            techoMesh.rotation.x = Math.PI / 2;
            group.add(techoMesh);
        }

        scene.add(group);
    });
});

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let textMesh = null;
let textOriginalColor = 0xffffff;

const modal = document.getElementById('modal');
const closeBtn = document.querySelector('.close');
const modalContent = document.querySelector('.modal-content');

closeBtn.addEventListener('click', () => {
    gsap.to(canvas, {
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.5,
        ease: 'power2.out',
        clearProps: 'transform'
    });
    gsap.to(modalContent, {
        scale: 0,
        rotation: -10,
        opacity: 0,
        duration: 0.4,
        ease: 'back.in(2)',
    });
    gsap.to(modal, {
        opacity: 0,
        duration: 0.5,
        delay: 0.1,
        onComplete: () => {
            modal.classList.add('hidden');
            modal.style.opacity = 1;
            modalContent.style.transform = '';
            modalContent.style.opacity = '';
        }
    });
});

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (textMeshRef) {
        const intersects = raycaster.intersectObject(textMeshRef);
        if (intersects.length > 0) {
            gsap.to(canvas, {
                scale: 2.2,
                filter: 'blur(20px)',
                duration: 0.5,
                ease: 'power2.out',
            });
            modal.classList.remove('hidden');
            gsap.fromTo(modal, 
                { opacity: 0 }, 
                { opacity: 1, duration: 0.5 }
            );
            gsap.fromTo(modalContent,
                { scale: 0, rotation: 15, opacity: 0 },
                { scale: 1, rotation: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.7)', delay: 0.1 }
            );
        }
    }
});

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (textMeshRef) {
        const intersects = raycaster.intersectObject(textMeshRef);
        if (intersects.length > 0) {
            textMeshRef.material.color.setHex(0xff6600);
            textMeshRef.material.emissive.setHex(0xff6600);
            document.body.style.cursor = 'pointer';
        } else {
            textMeshRef.material.color.setHex(textOriginalColor);
            textMeshRef.material.emissive.setHex(textOriginalColor);
            document.body.style.cursor = 'default';
        }
    }
});

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

    const group4 = scene.getObjectByName('group-4');
    if (group4 && group4.userData.bulbs) {
        const bulbs = group4.userData.bulbs;
        const lights = group4.userData.bulbLights;
        bulbs.forEach((bulb, j) => {
            const speed = bulb.userData.speed;
            const offset = bulb.userData.offset;
            bulb.position.x = Math.sin(elapsedTime * speed + offset) * 4;
            bulb.position.y = 5 + Math.sin(elapsedTime * speed * 0.7 + offset) * 3;
            bulb.position.z = Math.cos(elapsedTime * speed * 0.8 + offset) * 4;
            lights[j].position.copy(bulb.position);
        });
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
