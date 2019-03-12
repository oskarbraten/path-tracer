const glsl = x => x.raw[0];

export default glsl`#version 300 es
precision highp float;

in vec3 ray_direction;
in vec2 uv;
out vec4 fColor;

uniform vec2 screen_dimensions;
uniform float delta_time;
uniform float total_time;
uniform float seed;

// note: passing these as defines may improve performance.
uniform int maximum_depth;
uniform int number_of_samples;
uniform float antialiasing;

struct sphere {
    vec3 center;
    float radius;
};

layout(std140) uniform WorldBlock {
    sphere spheres[100];
};

uniform int number_of_spheres;

float rand_seed = 0.0;

float rand() {
    vec2 seeded_uv = vec2(uv.s + rand_seed, uv.t + rand_seed);
    rand_seed += 0.0321; // seed;
    return fract(sin(dot(seeded_uv.st, vec2(12.9898,78.233))) * 43758.5453);
}

vec3 random_in_unit_sphere() {
    vec3 p;
    do {
        p = (2.0 * vec3(rand(), rand(), rand())) - vec3(1.0, 1.0, 1.0);
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

    for (int i = 0; i < number_of_spheres; i++) {
        sphere s = spheres[i];
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

    int i = 0;
    while ((i <= maximum_depth) && intersect_world(r, 0.001, 100000.0, record)) {

        vec3 target = record.position + record.normal + random_in_unit_sphere();
        r = ray(record.position, target - record.position);

        color *= 0.5; // absorbs 50% of the energy.

        i += 1;
    }

    if (i == maximum_depth) {
        return vec3(0.0, 0.0, 0.0);
    } else {
        return color * background(r);
    }
}

void main() {
    vec3 direction = normalize(ray_direction);
    vec3 color = vec3(0.0, 0.0, 0.0);

    for (int i = 0; i < number_of_samples; i++) {
        float du = rand() / screen_dimensions.x;
        float dv = rand() / screen_dimensions.y;
        vec3 aa = vec3(du, dv, 0.0) * antialiasing;

        ray r = ray(vec3(0.0, 0.0, 0.0), direction + aa);

        color += trace(r);
    }

    color /= float(number_of_samples);

    fColor = vec4(color, 1.0);
}`;
