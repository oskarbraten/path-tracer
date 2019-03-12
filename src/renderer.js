import Shader from './shader.js';

export default {
    new: (context = null) => {

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

        // const lightsUniformBuffer = gl.createBuffer();
        // gl.bindBufferBase(gl.UNIFORM_BUFFER, UBO_BINDING.LIGHTS, lightsUniformBuffer);

        // const lightsBuffer = new ArrayBuffer((MAX_NUMBER_OF_LIGHTS * 16) * 8); // allocate buffer holding the lights.
        // const lightsBufferView = new DataView(lightsBuffer);

        // instantiate buffer on GPU.
        // gl.bufferData(gl.UNIFORM_BUFFER, lightsBuffer, gl.DYNAMIC_DRAW);

        const renderer = {

            domElement,
            gl,

            setSize(width, height) {
                domElement.width = width;
                domElement.height = height;
                gl.viewport(0, 0, domElement.width, domElement.height);
                gl.clearColor(1.0, 1.0, 1.0, 1.0);
            },

            draw(delta) {

                totalTime += delta;

                gl.uniform2f(shader.uniformLocations.screenDimensions, domElement.width, domElement.height);

                gl.uniform1f(shader.uniformLocations.seed, Math.random());
                gl.uniform1f(shader.uniformLocations.deltaTime, delta);
                gl.uniform1f(shader.uniformLocations.totalTime, totalTime);

                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // draw fullscreen quad.

                // UBO:
                //gl.uniformBlockBinding(shader.program, gl.getUniformBlockIndex(shader.program, 'LightBlock'), UBO_BINDING.LIGHT);

                // vertex uniforms:
                //const viewMatrix = mat4.invert(mat4.create(), cameraNode.worldMatrix);
                // gl.uniform1i(shader.uniformLocations.numberOfLights, numberOfLights);
            }
        };

        return renderer;
    }
}