import frag from './shaders/fragment.js';
import vert from './shaders/vertex.js';

export default {
    new(context) {
        let defines = '';
        // possibly add defines.

        const program = build(context, vert.replace('__DEFINES__', defines), frag.replace('__DEFINES__', defines));

        context.useProgram(program);

        return {
            program,
            uniformLocations: {
                inverseProjection: context.getUniformLocation(program, 'inverse_projection'),
                cameraMatrix: context.getUniformLocation(program, 'camera_matrix'),
                screenDimensions: context.getUniformLocation(program, 'screen_dimensions'),
                deltaTime: context.getUniformLocation(program, 'delta_time'),
                totalTime: context.getUniformLocation(program, 'total_time'),
                seed: context.getUniformLocation(program, 'seed'),
                numberOfSamples: context.getUniformLocation(program, 'number_of_samples'),
                maximumDepth: context.getUniformLocation(program, 'maximum_depth'),
                antialiasing: context.getUniformLocation(program, 'antialiasing'),
                numberOfSpheres: context.getUniformLocation(program, 'number_of_spheres')
            }
        };
    }
}

function compile(gl, source, type) {

    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw Error(gl.getShaderInfoLog(shader));
    }

    return shader;
}

function build(gl, vertexShaderSource, fragmentShaderSource) {

    let vertexShader = compile(gl, vertexShaderSource, gl.VERTEX_SHADER);
    let fragmentShader = compile(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

    let program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw Error('Error when building shaders.');
    }

    return program;
}