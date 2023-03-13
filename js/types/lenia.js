import {CellularAutomateDisplay} from "../cellular_automata.js";

export class Lenia {
    constructor(width, height, dt = 0.1, R = 13, m = 0.135, s = 0.015) {
        this.width = width;
        this.height = height;
        this.dt = dt;
        this.R = R;
        this.m = m;
        this.s = s;

        this.state = [];
        this.reset();

        this.K = this.#create_empty_matrix(2 * R + 1, 2 * R + 1)
        let sum = 0;
        //let offset = R - 1;
        for (let i = 0; i < 2 * R + 1; ++i) {
            for (let j = 0; j < 2 * R + 1; ++j) {
                let value = Math.sqrt(
                    Math.pow(i - R, 2) +
                    Math.pow(j - R, 2)
                ) / R;
                value = this.#bell_function(value, 0.5, 0.15);
                this.K[i][j] = value;
                sum += value;
            }
        }
        for (let i = 0; i < 2 * R + 1; ++i) {
            for (let j = 0; j < 2 * R + 1; ++j) {
                this.K[i][j] /= sum;
            }
        }
        this.K[R][R] = 0.0;
    }

    #get_state(x, y) {
        x %= this.width;
        y %= this.height;
        if (x < 0) x += this.width;
        if (y < 0) y += this.height;
        return this.state[x][y];
    }

    #growth(x) {
        return Math.exp(-Math.pow((x - this.m) / this.s, 2) * 0.5) * 2.0 - 1.0;
    }

    #new_state(x, y) {
        let neighbours = 0;
        for (let dx = 0; dx < 2 * this.R + 1; ++dx) {
            for (let dy = 0; dy < 2 * this.R + 1; ++dy) {
                neighbours += this.K[dx][dy] * this.#get_state(x + dx - this.R, y + dy - this.R)
            }
        }
        let state = this.#get_state(x, y) + this.dt * this.#growth(neighbours);
        return Math.min(Math.max(state, 0.), 1.);
    }

    #set_state(x, y, state, only_increase) {
        x %= this.width;
        y %= this.height;
        if (x < 0) x += this.width;
        if (y < 0) y += this.height;
        if (this.state[x][y] < state)
            this.state[x][y] = state;
    }

    step() {
        let new_state = this.#create_empty_matrix(this.width, this.height);

        for (let i = 0; i < this.width; ++i) {
            for (let j = 0; j < this.height; ++j) {
                new_state[i][j] = this.#new_state(i, j);
            }
        }

        this.state = new_state;
    }

    draw(p5) {
        p5.push();
        for (let x = 0; x < this.width; ++x) {
            for (let y = 0; y < this.height; ++y) {
                p5.set(x, y, this.state[x][y] * 255);
            }
        }
        p5.updatePixels();
        p5.pop();
    }

    on_click(x, y) {
        for (let dx = -5; dx <= 5; ++dx) {
            for (let dy = -5; dy <= 5; ++dy) {
                this.#set_state(x + dx, y + dy, Math.max(0, Math.cos(Math.sqrt(dx * dx + dy * dy) * Math.PI / (2 * 5))), true);
            }
        }
    }

    #bell_function(x, m, s) {
        return Math.exp(-Math.pow(((x - m) / s), 2) / 2);
    }

    #create_empty_matrix(width, height, default_value = NaN) {
        let matrix = new Array(width);
        for (let i = 0; i < width; ++i) {
            matrix[i] = new Array(height);
            if (!isNaN(default_value)) matrix[i].fill(default_value);
        }
        return matrix;
    }

    clear() {
        this.state = this.#create_empty_matrix(this.width, this.height, 0);
    }

    reset() {
        this.clear();

        let orbium = [
            [0, 0, 0, 0, 0, 0, 0.1, 0.14, 0.1, 0, 0, 0.03, 0.03, 0, 0, 0.3, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0.08, 0.24, 0.3, 0.3, 0.18, 0.14, 0.15, 0.16, 0.15, 0.09, 0.2, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0.15, 0.34, 0.44, 0.46, 0.38, 0.18, 0.14, 0.11, 0.13, 0.19, 0.18, 0.45, 0, 0, 0],
            [0, 0, 0, 0, 0.06, 0.13, 0.39, 0.5, 0.5, 0.37, 0.06, 0, 0, 0, 0.02, 0.16, 0.68, 0, 0, 0],
            [0, 0, 0, 0.11, 0.17, 0.17, 0.33, 0.4, 0.38, 0.28, 0.14, 0, 0, 0, 0, 0, 0.18, 0.42, 0, 0],
            [0, 0, 0.09, 0.18, 0.13, 0.06, 0.08, 0.26, 0.32, 0.32, 0.27, 0, 0, 0, 0, 0, 0, 0.82, 0, 0],
            [0.27, 0, 0.16, 0.12, 0, 0, 0, 0.25, 0.38, 0.44, 0.45, 0.34, 0, 0, 0, 0, 0, 0.22, 0.17, 0],
            [0, 0.07, 0.2, 0.02, 0, 0, 0, 0.31, 0.48, 0.57, 0.6, 0.57, 0, 0, 0, 0, 0, 0, 0.49, 0],
            [0, 0.59, 0.19, 0, 0, 0, 0, 0.2, 0.57, 0.69, 0.76, 0.76, 0.49, 0, 0, 0, 0, 0, 0.36, 0],
            [0, 0.58, 0.19, 0, 0, 0, 0, 0, 0.67, 0.83, 0.9, 0.92, 0.87, 0.12, 0, 0, 0, 0, 0.22, 0.07],
            [0, 0, 0.46, 0, 0, 0, 0, 0, 0.7, 0.93, 1, 1, 1, 0.61, 0, 0, 0, 0, 0.18, 0.11],
            [0, 0, 0.82, 0, 0, 0, 0, 0, 0.47, 1, 1, 0.98, 1, 0.96, 0.27, 0, 0, 0, 0.19, 0.1],
            [0, 0, 0.46, 0, 0, 0, 0, 0, 0.25, 1, 1, 0.84, 0.92, 0.97, 0.54, 0.14, 0.04, 0.1, 0.21, 0.05],
            [0, 0, 0, 0.4, 0, 0, 0, 0, 0.09, 0.8, 1, 0.82, 0.8, 0.85, 0.63, 0.31, 0.18, 0.19, 0.2, 0.01],
            [0, 0, 0, 0.36, 0.1, 0, 0, 0, 0.05, 0.54, 0.86, 0.79, 0.74, 0.72, 0.6, 0.39, 0.28, 0.24, 0.13, 0],
            [0, 0, 0, 0.01, 0.3, 0.07, 0, 0, 0.08, 0.36, 0.64, 0.7, 0.64, 0.6, 0.51, 0.39, 0.29, 0.19, 0.04, 0],
            [0, 0, 0, 0, 0.1, 0.24, 0.14, 0.1, 0.15, 0.29, 0.45, 0.53, 0.52, 0.46, 0.4, 0.31, 0.21, 0.08, 0, 0],
            [0, 0, 0, 0, 0, 0.08, 0.21, 0.21, 0.22, 0.29, 0.36, 0.39, 0.37, 0.33, 0.26, 0.18, 0.09, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0.03, 0.13, 0.19, 0.22, 0.24, 0.24, 0.23, 0.18, 0.13, 0.05, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0.02, 0.06, 0.08, 0.09, 0.07, 0.05, 0.01, 0, 0, 0, 0, 0]];

        let start_x = Math.floor((this.width - orbium[0].length) / 2);
        let start_y = Math.floor((this.height + orbium.length) / 2);

        for (let dx = 0; dx < orbium[0].length; ++dx) {
            for (let dy = 0; dy < orbium.length; ++dy) {
                this.#set_state(start_x + dx, start_y - dy, orbium[dy][dx]);
            }
        }
    }

    random() {
        this.state = this.#create_empty_matrix(this.width, this.height);
        for (let i = 0; i < this.width; ++i) {
            for (let j = 0; j < this.height; ++j) {
                this.state[i][j] = Math.random();
            }
        }
    }
}

export function create_lenia_display(width, height) {
    let display = new CellularAutomateDisplay(width, height, new Lenia(width, height));
    new p5(display.sketch);
}