import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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

groups.forEach((g) => {
    const group = new THREE.Group();
    group.position.copy(g.pos);

    const geo = new THREE.PlaneGeometry(5, 5);
    const mat = new THREE.MeshStandardMaterial({
        color: g.color,
        side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    group.add(mesh);

    scene.add(group);
});

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

function animate() {
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
