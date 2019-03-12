import { mat4 } from '../../node_modules/gl-matrix/esm/index.js';

export default {
    new(node, aspectRatio, yfov = 1.0472, zfar = null, znear = 1.0) {
        return {
            node,
            aspectRatio,
            yfov,
            zfar,
            znear,
            projectionMatrix: mat4.perspective(mat4.create(), yfov, aspectRatio, znear, zfar),
        };
    },

    updateProjectionMatrix(camera) {
        const { aspectRatio, yfov, zfar, znear } = camera;
        mat4.perspective(camera.projectionMatrix, yfov, aspectRatio, znear, zfar);
    }
};