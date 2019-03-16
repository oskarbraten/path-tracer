import { vec3, mat4 } from '../lib/gl-matrix/index.js';
import Shader from './shader.js';

const IS_LITTLE_ENDIAN = new Uint8Array(new Uint32Array([0x12345678]).buffer)[0] === 0x78;

export default {
    new(context = null) {

        if (context === null) {
            throw Error('You must pass a WebGL2 context to the renderer.');
        }

        const gl = context;
        const domElement = gl.canvas;

        gl.viewport(0, 0, domElement.width, domElement.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        const shader = Shader.new(gl);

        gl.useProgram(shader.program);

        let totalTime = 0;

        // UBO:
        const worldBuffer = gl.createBuffer();
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, worldBuffer);

        const MAXIMUM_NUMBER_OF_SPHERES = 100;

        const NUMBER_OF_BYTES_PER_SPHERE = 12; // needs to be a factor of 4.
        const sphereBuffer = new ArrayBuffer((MAXIMUM_NUMBER_OF_SPHERES * NUMBER_OF_BYTES_PER_SPHERE) * 8);
        const sphereBufferView = new DataView(sphereBuffer);

        // fill buffer on GPU.
        gl.bufferData(gl.UNIFORM_BUFFER, sphereBuffer, gl.DYNAMIC_DRAW);

        // bind block:
        gl.uniformBlockBinding(shader.program, gl.getUniformBlockIndex(shader.program, 'WorldBlock'), 0);


        const renderer = {

            domElement,
            gl,

            setSize(width, height) {
                domElement.width = width;
                domElement.height = height;
                gl.viewport(0, 0, domElement.width, domElement.height);
                gl.clearColor(1.0, 1.0, 1.0, 1.0);
            },

            draw(delta, camera, world, {
                numberOfSamples = 25,
                maximumDepth = 25,
                antialiasing = true
            }) {

                totalTime += delta;

                gl.uniform2f(shader.uniformLocations.screenDimensions, domElement.width, domElement.height);
                gl.uniform1f(shader.uniformLocations.seed, Math.random());
                gl.uniform1f(shader.uniformLocations.deltaTime, delta);
                gl.uniform1f(shader.uniformLocations.totalTime, totalTime);

                const inverseProjectionMatrix = mat4.invert(mat4.create(), camera.projectionMatrix);
                gl.uniformMatrix4fv(shader.uniformLocations.inverseProjection, false, inverseProjectionMatrix);
                gl.uniformMatrix4fv(shader.uniformLocations.cameraMatrix, false, camera.node.worldMatrix);

                gl.uniform1i(shader.uniformLocations.numberOfSamples, numberOfSamples);
                gl.uniform1i(shader.uniformLocations.maximumDepth, maximumDepth);
                gl.uniform1f(shader.uniformLocations.antialiasing, antialiasing ? 1.0 : 0.0);

                
                gl.uniform1i(shader.uniformLocations.numberOfSpheres, world.length);

                const viewMatrix = mat4.invert(mat4.create(), camera.node.worldMatrix);

                for (let i = 0; i < world.length && i < 100; i++) {

                    const { node, radius, material } = world[i];

                    const modelViewMatrix = mat4.multiply(mat4.create(), viewMatrix, node.worldMatrix);

                    const position = vec3.fromValues(modelViewMatrix[12], modelViewMatrix[13], modelViewMatrix[14]);

                    // PACKING:
                    // position: vec3
                    // radius: f32
                    // albedo: vec3
                    // fuzz: f32
                    // refractive_index: f32
                    // type: int

                    const offset = i * NUMBER_OF_BYTES_PER_SPHERE;

                    sphereBufferView.setFloat32((offset + 0) * 4, position[0], IS_LITTLE_ENDIAN);
                    sphereBufferView.setFloat32((offset + 1) * 4, position[1], IS_LITTLE_ENDIAN);
                    sphereBufferView.setFloat32((offset + 2) * 4, position[2], IS_LITTLE_ENDIAN);
                    sphereBufferView.setFloat32((offset + 3) * 4, radius, IS_LITTLE_ENDIAN);

                    sphereBufferView.setFloat32((offset + 4) * 4, material.albedo[0], IS_LITTLE_ENDIAN);
                    sphereBufferView.setFloat32((offset + 5) * 4, material.albedo[1], IS_LITTLE_ENDIAN);
                    sphereBufferView.setFloat32((offset + 6) * 4, material.albedo[2], IS_LITTLE_ENDIAN);

                    sphereBufferView.setFloat32((offset + 7) * 4, material.fuzz, IS_LITTLE_ENDIAN);
                    sphereBufferView.setFloat32((offset + 8) * 4, material.refractiveIndex, IS_LITTLE_ENDIAN);
                    sphereBufferView.setInt32((offset + 9) * 4, material.type, IS_LITTLE_ENDIAN);

                }

                // update buffer:
                gl.bufferSubData(gl.UNIFORM_BUFFER, 0, sphereBuffer);

                // draw fullscreen quad:
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            }
        };

        return renderer;
    }
}