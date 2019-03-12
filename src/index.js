import Renderer from './renderer.js';

const gl = document.createElement('canvas').getContext('webgl2');
const renderer = Renderer.new(gl);

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// let canvas = renderer.domElement;
// canvas.addEventListener('click', () => {
//     canvas.requestPointerLock();
// });

let then = 0;
function loop(now) {

    const delta = now - then;
    then = now;

    renderer.draw(delta);

    window.requestAnimationFrame(loop);

}

window.requestAnimationFrame(loop);