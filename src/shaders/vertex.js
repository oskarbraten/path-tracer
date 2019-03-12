const glsl = x => x.raw[0];

export default glsl`#version 300 es
precision highp float;

uniform mat4 inverse_projection;

// attribute-less rendering here:

const vec2 position_data[4] = vec2[](
    vec2(-1.0,  1.0),
    vec2(-1.0, -1.0),
    vec2( 1.0,  1.0),
    vec2( 1.0, -1.0)
);

const vec2 uv_data[4] = vec2[](
    vec2(0.0, 1.0),
    vec2(0.0, 0.0),
    vec2(1.0, 1.0),
    vec2(1.0, 0.0)
);

out vec2 uv;
out vec3 ray_direction;

void main() {
    gl_Position = vec4(position_data[gl_VertexID], 0.0, 1.0);
    ray_direction = (inverse_projection * vec4(position_data[gl_VertexID], -1.0, 1.0)).xyz;
    uv = uv_data[gl_VertexID];
}`;