import {CellularAutomateDisplay} from "../cellular_automata.js";

export class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    norm() {
        return Math.sqrt(
            Math.pow(this.x, 2) +
            Math.pow(this.y, 2)
        );
    }

    diff_norm(other_point) {
        return Math.sqrt(
            Math.pow(this.x - other_point.x, 2) +
            Math.pow(this.y - other_point.y, 2)
        );
    }

    // normalizes vector and returns old length
    normalize() {
        let norm = this.norm();
        this.x /= norm;
        this.y /= norm;
        return norm;
    }

    multiply(factor) {
        this.x *= factor;
        this.y *= factor;
    }

    plus(other_point) {
        this.x += other_point.x;
        this.y += other_point.y;
    }

    minus(other_point) {
        this.x -= other_point.x;
        this.y -= other_point.y;
    }
}

export class IdentifiablePoint {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
    }

    norm() {
        return Math.sqrt(
            Math.pow(this.x, 2) +
            Math.pow(this.y, 2)
        );
    }

    diff_norm(other_point) {
        return Math.sqrt(
            Math.pow(this.x - other_point.x, 2) +
            Math.pow(this.y - other_point.y, 2)
        );
    }

    // normalizes vector and returns old length
    normalize() {
        let norm = this.norm();
        this.x /= norm;
        this.y /= norm;
        return norm;
    }

    multiply(factor) {
        this.x *= factor;
        this.y *= factor;
    }

    plus(other_point) {
        this.x += other_point.x;
        this.y += other_point.y;
    }

    minus(other_point) {
        this.x -= other_point.x;
        this.y -= other_point.y;
    }
}

class ParticleLenia {
    constructor(points, max_individual_step_error, relative_bucket_size, debug_messages, width, height,
                mu_k = 4.0, sigma_k = 1.0, w_k = 0.022, mu_g = 0.6, sigma_g = 0.15, c_rep = 1.0, dt = 0.1) {
        if (typeof points == "number") {
            this.number_particles = points;
            this.default_number_points = points;

            points = this.#random_particles(this.default_number_points);
        } else {
            this.number_particles = points.length;
            this.default_number_points = points.length;
        }
        this.mu_k = mu_k;
        this.sigma_k = sigma_k;
        this.w_k = w_k;
        this.mu_g = mu_g;
        this.sigma_g = sigma_g;
        this.c_rep = c_rep;
        this.dt = dt;
        this.width = width;
        this.height = height;
        this.real_size = 1.1 * Math.sqrt(this.number_particles);
        this.offset = -this.real_size * 0.25;
        this.real_size *= 1.5;
        this.max_distance = this.#find_max_distance(max_individual_step_error, 1e-3, 1e3, debug_messages);
        this.max_distance_squared = Math.pow(this.max_distance, 2);
        this.bucket_size = this.max_distance * relative_bucket_size;
        this.traversal_distance = Math.ceil(this.max_distance / this.bucket_size);
        this.buckets = new Map();
        this.dU = [];
        this.dR = [];
        this.U = [];
        this.last_click = Date.now();

        this.#map_points_to_buckets(points);
    }

    random() {
        this.number_particles = this.default_number_points;
        let points = this.#random_particles(this.default_number_points);

        this.buckets = new Map();
        this.#map_points_to_buckets(points);
    }

    #map_points_to_buckets(points, offset = 0) {
        for (let i in points) {
            let point = new IdentifiablePoint(Number(i) + offset, points[i].x, points[i].y);
            let identifier = this.#convert_identifier_array(this.#to_identifier(point));
            if (!this.buckets.has(identifier)) this.buckets.set(identifier, []);
            this.buckets.get(identifier).push(point);
        }
    }

    #random_particles(num) {
        let points = [];
        let size = 1.1 * Math.sqrt(num);
        for (let i = 0; i < num; ++i) {
            points.push({
                x: Math.random() * size,
                y: Math.random() * size
            });
        }
        return points;
    }

    step() {
        for (let i = 0; i < 1; ++i) this.update();
    }

    clear() {
        this.number_particles = 0;
        this.buckets = new Map();
    }

    on_click(x, y) {
        if (Date.now() - this.last_click < 10) return;
        this.last_click = Date.now();

        x /= this.width;
        y /= this.height;
        x *= this.real_size;
        y *= this.real_size;
        x += this.offset;
        y += this.offset;

        this.number_particles += 1;
        this.#map_points_to_buckets([new Point(x, y)], this.number_particles - 1);
    }

    update() {
        let sigma_k2 = Math.pow(this.sigma_k, 2);
        let sigma_g2 = Math.pow(this.sigma_g, 2);

        let kernel = this.#kernel_function(0, this.mu_k, sigma_k2);
        this.dU = [];
        this.dR = [];
        this.U = [];
        for (let i = 0; i < this.number_particles; ++i) {
            this.dU.push(new Point(0, 0));
            this.dR.push(new Point(0, 0));
            this.U.push(kernel);
        }

        for (let set of this.buckets.values()) {
            for (let point of set) {
                this.#gradient(point);
            }
        }

        let updated_buckets = new Map();
        for (let set of this.buckets.values()) {
            for (let point of set) {
                let u = this.U[point.id] * this.w_k;
                let du = this.dU[point.id];
                du.multiply(-(2 * this.w_k / sigma_k2));
                du.multiply(-2 * (u - this.mu_g) * this.#kernel_function(u, this.mu_g, sigma_g2) / sigma_g2)
                let dr = this.dR[point.id];
                du.minus(dr);
                du.multiply(this.dt);
                point.minus(du);
                let identifier = this.#convert_identifier_array(this.#to_identifier(point));
                if (!updated_buckets.has(identifier)) updated_buckets.set(identifier, []);
                updated_buckets.get(identifier).push(point);
            }
        }

        this.buckets = updated_buckets;
    }

    #gradient(point) {
        let sigma_k2 = Math.pow(this.sigma_k, 2);
        let identifier = this.#to_identifier(point);

        for (let i = -this.traversal_distance; i <= this.traversal_distance; ++i) {
            for (let j = -this.traversal_distance; j <= this.traversal_distance; ++j) {
                let bucket = this.buckets.get(this.#convert_identifier(i + identifier[0], j + identifier[1]));
                if (bucket === undefined) continue;
                for (let other_point of bucket) {
                    let diff = new Point(other_point.x - point.x, other_point.y - point.y);
                    if (diff.x < 0) continue;
                    let norm = Math.pow(diff.x, 2) + Math.pow(diff.y, 2);
                    if (norm > this.max_distance_squared) continue;
                    norm = Math.sqrt(norm);
                    if (norm < 1e-5) continue;
                    diff.x /= norm;
                    diff.y /= norm;

                    if (norm < 1) {
                        let dr = -1.0 * this.c_rep * (1 - norm);
                        let dr_point = new Point(diff.x * dr, diff.y * dr);
                        this.dR[point.id].plus(dr_point);
                        this.dR[other_point.id].minus(dr_point);
                    }

                    let kernel = this.#kernel_function(norm, this.mu_k, sigma_k2);
                    this.U[point.id] += kernel;
                    this.U[other_point.id] += kernel;

                    let du = (norm - this.mu_k) * kernel;
                    diff.multiply(du);

                    this.dU[point.id].plus(diff);
                    this.dU[other_point.id].minus(diff);
                }
            }
        }
    }

    #to_identifier(point) {
        return [
            Math.ceil(point.x / this.bucket_size),
            Math.ceil(point.y / this.bucket_size)
        ];
    }

    #convert_identifier_array(a) {
        return (a[0] + 1000) * 1000 + (a[1] + 1000);
    }

    #convert_identifier(x, y) {
        return (x + 1000) * 1000 + (y + 1000);
    }

    // in the following function we assume G'(U) = 1, since G'(U) <= 1
    // as well as expecting distance > 1
    #test_distance(distance) {
        let sigma_k2 = Math.pow(this.sigma_k, 2);
        let dU = (distance - this.mu_k) * this.#kernel_function(distance, this.mu_k, sigma_k2);
        let U = this.#kernel_function(0, this.mu_k, sigma_k2) + this.#kernel_function(distance, this.mu_k, sigma_k2);
        U *= this.w_k;
        dU *= -(2 * this.w_k / sigma_k2);

        let sigma_g2 = Math.pow(this.sigma_g, 2);
        return Math.abs(
            (-2 * ((this.number_particles - 1) * U - this.mu_g) / sigma_g2) * (this.number_particles - 1) * dU
        );
    }

    #find_max_distance(max_error, min_step_size, max_step_size, debug_messages) {
        max_error /= this.dt;
        let size = 1.0;
        let step_size = max_step_size;
        let steps = 0;

        while (step_size >= min_step_size) {
            while (this.#test_distance(size + step_size) > max_error) {
                size += step_size;
                ++steps;
            }
            step_size /= 2;
            ++steps;
        }
        size += step_size * 2;

        if (debug_messages) {
            let error = this.#test_distance(size);
            console.log(`Found minimal bucket size of ${size} with a maximum step error of ${error * this.dt} in ${steps} steps.`);
        }
        return size;
    }

    #kernel_function(x, mu, sigma2) {
        return Math.exp(-Math.pow(x - mu, 2) / sigma2);
    }

    draw(p5) {
        p5.push();

        p5.background(0);

        p5.noStroke();
        p5.fill(255);

        for (let bucket of this.buckets.values()) {
            for (let point of bucket) {
                let x = point.x;
                let y = point.y;
                x -= this.offset;
                y -= this.offset;
                x /= this.real_size;
                y /= this.real_size;
                x *= this.width;
                y *= this.height;
                if (x > this.width || x < 0 || y > this.height || y < 0) continue;
                p5.circle(x, y, 5);
            }
        }

        p5.pop();
    }
}

export function create_particle_lenia_display(width, height) {
    let num_points = 200;

    let display = new CellularAutomateDisplay(width, height,
        new ParticleLenia(num_points, 1e-10, 0.5, true, width, height)
    );
    new p5(display.sketch);
}