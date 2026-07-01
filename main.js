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
