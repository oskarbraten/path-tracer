import * as dat from '../node_modules/dat.gui/build/dat.gui.module.js';
import CameraController from './controls/CameraController.js';

import Renderer from './renderer.js';
import Node from './core/node.js';
import Sphere from './primitives/sphere.js';
import Camera from './core/camera.js';

const gl = document.createElement('canvas').getContext('webgl2');
const renderer = Renderer.new(gl);

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const world = Node.new();

const cameraNode = Node.new({ parent: world });
const camera = Camera.new(cameraNode, window.innerWidth / window.innerHeight);

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspectRatio = (window.innerWidth / window.innerHeight);
    Camera.updateProjectionMatrix(camera);
}, false);

let cameraController = new CameraController(cameraNode);
let canvas = renderer.domElement;
canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
});

let yaw = 0;
let pitch = 0;

function updateCamRotation(event) {
    yaw += event.movementX * 0.001;
    pitch += event.movementY * 0.001;
}

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
        canvas.addEventListener('mousemove', updateCamRotation, false);
    } else {
        canvas.removeEventListener('mousemove', updateCamRotation, false);
    }
});

let move = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    speed: 0.001
};


window.addEventListener('keydown', (e) => {
    e.preventDefault();
    if (e.code === 'KeyW') {
        move.forward = true;
    } else if (e.code === 'KeyS') {
        move.backward = true;
    } else if (e.code === 'KeyA') {
        move.left = true;
    } else if (e.code === 'KeyD') {
        move.right = true;
    }
});

window.addEventListener('keyup', (e) => {
    e.preventDefault();
    if (e.code === 'KeyW') {
        move.forward = false;
    } else if (e.code === 'KeyS') {
        move.backward = false;
    } else if (e.code === 'KeyA') {
        move.left = false;
    } else if (e.code === 'KeyD') {
        move.right = false;
    }
});

let parameters = {
    numberOfSamples: 15,
    maximumDepth: 20,
    antialiasing: true
};

const gui = new dat.GUI();

gui.add(parameters, 'numberOfSamples', 1, 180);
gui.add(parameters, 'maximumDepth', 1, 100);
gui.add(parameters, 'antialiasing');

let spheres = [
    Sphere.new(Node.new({ parent: world, translation: [0.0, 0.0, -1.0] }), 0.5),
    Sphere.new(Node.new({ parent: world, translation: [0.0, -100.5, -1.0] }), 100.0)
];


let then = 0;
function loop(now) {

    const delta = now - then;
    then = now;

    const moveSpeed = move.speed * delta;

    let longitudinal = 0;
    let lateral = 0;

    if (move.forward) {
        longitudinal += moveSpeed;
    }

    if (move.backward) {
        longitudinal -= moveSpeed;
    }

    if (move.left) {
        lateral += moveSpeed;
    }

    if (move.right) {
        lateral -= moveSpeed;
    }

    cameraController.update(pitch, yaw, longitudinal, lateral);

    // reset movement buffers.
    yaw = 0;
    pitch = 0;

    world.tick();
    renderer.draw(delta, camera, spheres, parameters);

    window.requestAnimationFrame(loop);

}

window.requestAnimationFrame(loop);