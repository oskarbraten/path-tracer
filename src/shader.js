const glsl = x => x.raw[0];

// VERTEX SHADER ////////////////////////////////////
const vert = glsl`#version 300 es
precision highp float;

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

void main() {
    uv = uv_data[gl_VertexID];
    gl_Position = vec4(position_data[gl_VertexID], 0.0, 1.0);
}`;
/////////////////////////////////////////////////////

// FRAGMENT SHADER //////////////////////////////////
const frag = glsl`#version 300 es
precision highp float;

in vec2 uv;
out vec4 fColor;

uniform vec2 screen_dimensions;
uniform float delta_time;
uniform float total_time;
uniform float seed;

const uint MAXIMUM_DEPTH = 20u;
const uint NUMBER_OF_SAMPLES = 20u;

struct sphere {
    vec3 center;
    float radius;
};

const uint NUMBER_OF_SPHERES = 2u;
const sphere WORLD[NUMBER_OF_SPHERES] = sphere[NUMBER_OF_SPHERES](
	sphere(vec3(0.0, 0.0, -1.0), 0.5),
	sphere(vec3(0.0, -100.5, -1.0), 100.0)
);

float rand_seed = 0.0;

float rand(vec2 st) {
    vec2 uv = vec2(st.s + rand_seed, st.t + rand_seed);
    rand_seed += 0.0321; // seed;
    return fract(sin(dot(uv.st, vec2(12.9898,78.233))) * 43758.5453);
}

vec3 random_in_unit_sphere(vec2 st) {
    vec3 p;
    do {
        p = (2.0 * vec3(rand(st), rand(st), rand(st))) - vec3(1.0, 1.0, 1.0);
    } while (dot(p, p) >= 1.0);
    return p;
}

struct hit_record {
    float t;
    vec3 position;
    vec3 normal;
};

struct ray {
    vec3 origin;
    vec3 direction;
};

vec3 point_at(ray r, float t) {
    return r.origin + t*r.direction;
}

struct camera {
    vec3 origin;
    vec3 horizontal;
    vec3 vertical;
    vec3 lower_left_corner;
};

ray ray_from(camera cam, vec2 uv) {
    return ray(cam.origin, cam.lower_left_corner + uv.s * cam.horizontal + uv.t * cam.vertical);
}

bool intersect(sphere s, ray r, float t_min, float t_max, out hit_record record) {
    vec3 oc = r.origin - s.center;
    float a = dot(r.direction, r.direction);
    float b = dot(oc, r.direction);
    float c = dot(oc, oc) - s.radius*s.radius;

    float discriminant = b * b - a * c;

    if (discriminant > 0.0) {
        float solution = (-b - sqrt(discriminant)) / a;
        if (solution < t_max && solution > t_min) {
            record.t = solution;
            record.position = point_at(r, record.t);
            record.normal = (record.position - s.center) / s.radius;
            return true;
        }
        solution = (-b + sqrt(discriminant)) / a;
        if (solution < t_max && solution > t_min) {
            record.t = solution;
            record.position = point_at(r, record.t);
            record.normal = (record.position - s.center) / s.radius;
            return true;
        }
    }
    return false;
}

bool intersect_world(ray r, float t_min, float t_max, out hit_record record) {
    hit_record temp_record;
    bool intersected = false;
    float closest = t_max;

    for (uint i = 0u; i < NUMBER_OF_SPHERES; i++) {
        sphere s = WORLD[i];
        if (intersect(s, r, t_min, closest, temp_record)) {
            intersected = true;
            closest = temp_record.t;
            record = temp_record;
        }
    }

    return intersected;
}

vec3 background(ray r) {
    float t = 0.5 * (normalize(r.direction).y + 1.0);
    return mix(vec3(1.0, 1.0, 1.0), vec3(0.5, 0.7, 1.0), t);
}

vec3 trace(ray r) {
    vec3 color = vec3(1.0, 1.0, 1.0);

    hit_record record;

    uint i = 0u;
    while ((i <= MAXIMUM_DEPTH) && intersect_world(r, 0.001, 100000.0, record)) {

        vec3 target = record.position + record.normal + random_in_unit_sphere(uv);
        r = ray(record.position, target - record.position);

        color *= 0.5; // absorbs 50% of the energy.

        i += 1u;
    }

    if (i == MAXIMUM_DEPTH) {
        return vec3(0.0, 0.0, 0.0);
    } else {
        return color * background(r);
    }
}

void main() {
    camera cam = camera(vec3(0.0, 0.0, 0.0), vec3(4.0, 0.0, 0.0), vec3(0.0, 2.0, 0.0), vec3(-2.0, -1.0, -1.0));
    
    vec3 color = vec3(0.0, 0.0, 0.0);

    for (uint i = 0u; i < NUMBER_OF_SAMPLES; i++) {
        float du = rand(uv) / screen_dimensions.x;
        float dv = rand(uv) / screen_dimensions.y;

        ray r = ray_from(cam, vec2(uv.s + du, uv.t + dv));
        color += trace(r);
    }

    color /= float(NUMBER_OF_SAMPLES);

    fColor = vec4(color, 1.0);
}`;
/////////////////////////////////////////////////////

export default {

    new: (context) => {

        let defines = '';
        // possibly add defines.

        const program = build(context, vert.replace('__DEFINES__', defines), frag.replace('__DEFINES__', defines));

        context.useProgram(program);

        return {
            program,
            uniformLocations: {
                screenDimensions: context.getUniformLocation(program, 'screen_dimensions'),
                deltaTime: context.getUniformLocation(program, 'delta_time'),
                totalTime: context.getUniformLocation(program, 'total_time'),
                seed: context.getUniformLocation(program, 'seed'),
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