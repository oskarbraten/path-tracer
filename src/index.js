import * as dat from '../node_modules/dat.gui/build/dat.gui.module.js';

import Renderer from './renderer.js';
import Node from './core/node.js';
import Camera from './core/camera.js';

const gl = document.createElement('canvas').getContext('webgl2');
const renderer = Renderer.new(gl);

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const cameraNode = Node.new();
const camera = Camera.new(cameraNode, window.innerWidth/window.innerHeight);

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspectRatio = (window.innerWidth/window.innerHeight);
    Camera.updateProjectionMatrix(camera);
}, false);

// let canvas = renderer.domElement;
// canvas.addEventListener('click', () => {
//     canvas.requestPointerLock();
// });

let parameters = {
    numberOfSamples: 15,
    maximumDepth: 20,
    antialiasing: true
};

const gui = new dat.GUI();

gui.add(parameters, 'numberOfSamples', 1, 180);
gui.add(parameters, 'maximumDepth', 1, 100);
gui.add(parameters, 'antialiasing');

let then = 0;
function loop(now) {

    const delta = now - then;
    then = now;

    renderer.draw(delta, camera.projectionMatrix, parameters);

    window.requestAnimationFrame(loop);

}

window.requestAnimationFrame(loop);