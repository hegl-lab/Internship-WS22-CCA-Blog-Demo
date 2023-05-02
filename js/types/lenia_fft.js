import {CellularAutomateDisplay} from "../cellular_automata.js";
import {convert_to_convex, fft2D, inverse_fft2d} from "./fft.js";

export class Lenia {
    constructor(width, height, dt = 0.1, R = 13.0, m = 0.15, s = 0.015) {
        this.width = width;
        this.height = height;
        this.dt = dt;
        this.R = R;
        this.m = m;
        this.s = s;
        this.sum = 0;

        this.state = [];
        this.data = this.#create_empty_matrix(width, height, [0, 0]);
        this.reset();

        // init kernel data
        this.K = this.#create_empty_matrix(width, height);
        let half_width = width / 2;
        let half_height = height / 2;
        for (let i = 0; i < width; ++i) {
            for (let j = 0; j < height; ++j) {
                let value = Math.sqrt(
                    Math.pow(i - half_width, 2) +
                    Math.pow(j - half_height, 2)
                ) / R;
                if (value < 1) {
                    value = this.#bell_function(value, 0.5, 0.15);
                } else {
                    value = 0.0;
                }
                this.K[i][j] = value;
                this.sum += value;
            }
        }
        for (let i = 0; i < width; ++i) {
            for (let j = 0; j < height; ++j) {
                //this.K[i][j] /= sum;
                this.K[i][j] = [this.K[i][j], 0.0];
            }
        }
        // switch quadrants
        for (let x = 0; x < width / 2; ++x) {
            for (let y = 0; y < height / 2; ++y) {
                let tmp = this.K[x][y];
                this.K[x][y] = this.K[x + width / 2][y + height / 2];
                this.K[x + width / 2][y + height / 2] = tmp;

                tmp = this.K[x + width / 2][y];
                this.K[x + width / 2][y] = this.K[x][y + height / 2];
                this.K[x][y + height / 2] = tmp;
            }
        }
        //this.K[half_width][half_height] = [0, 0];

        //this.K = convert_to_convex(this.K);
        fft2D(this.K);
    }

    #print_matrix(matrix) {
        for (let i = 0; i < matrix.length; ++i) {
            let line = "";
            for (let j = 0; j < matrix[i].length; ++j) {
                line += matrix[i][j][0].toFixed(2) + ',' + matrix[i][j][1].toFixed(2) + '\t';
            }
            console.log(line);
        }
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

    #set_state(x, y, state, only_increase = false) {
        x %= this.width;
        y %= this.height;
        if (x < 0) x += this.width;
        if (y < 0) y += this.height;
        if (only_increase && this.state[x][y][0] > state[0]) return;
        this.state[x][y] = state;
    }

    step() {
        let state_copy = this.#create_empty_matrix(this.width, this.height);
        for (let i = 0; i < this.width; ++i) {
            for (let j = 0; j < this.height; ++j) {
                state_copy[i][j] = [
                    this.state[i][j][0],
                    this.state[i][j][1]
                ];
                //if (Math.abs(state_copy[i][j][0] - this.state[i][j][0]) > 1e-10) alert("WRONG");
            }
        }
        fft2D(state_copy);
        // calculate scalar product of kernel * fft2d(state)
        for (let i = 0; i < this.width; ++i) {
            for (let j = 0; j < this.height; ++j) {
                let tmp = state_copy[i][j][0];
                let tmp2 = state_copy[i][j][1];
                state_copy[i][j][0] = tmp * this.K[i][j][0] - tmp2 * this.K[i][j][1];
                state_copy[i][j][1] = tmp * this.K[i][j][1] + tmp2 * this.K[i][j][0];
            }
        }
        // calculate inverse fft2d
        inverse_fft2d(state_copy);
        // update state
        for (let i = 0; i < this.width; ++i) {
            for (let j = 0; j < this.height; ++j) {
                state_copy[i][j][0] /= this.sum;
                state_copy[i][j][1] /= this.sum;

                this.state[i][j] = [
                    Math.max(Math.min(
                        this.state[i][j][0] + this.dt * this.#growth(state_copy[i][j][0]),
                        1.0), 0.0),
                    0
                ];
            }
        }
    }

    #clamp_color(color) {
        color[0] = Math.max(Math.min(color[0], 1), 0);
        color[1] = Math.max(Math.min(color[1], 1), 0);
        color[2] = Math.max(Math.min(color[2], 1), 0);
    }

    #hue_rotation(value, p5) {
        value = 1 - value;
        value /= 1.45;
        let color = [0, 0, 0];
        color[0] = ((6 * value) % 6) - 3;
        color[1] = ((6 * value + 4) % 6) - 3;
        color[2] = ((6 * value + 2) % 6) - 3;
        color[0] = Math.abs(color[0]);
        color[1] = Math.abs(color[1]);
        color[2] = Math.abs(color[2]);
        color[0] -= 1;
        color[1] -= 1;
        color[2] -= 1;
        this.#clamp_color(color);

        let offset = 0.5 * 255;
        let factor = 1.0 * (1.0 - Math.abs(2.0 * 0.5 - 1.0)) * 255;
        return p5.color(offset + (color[0] - 0.5) * factor, offset + (color[1] - 0.5) * factor, offset + (color[2] - 0.5) * factor);
    }

    draw(p5) {
        p5.push();
        for (let x = 0; x < this.width; ++x) {
            for (let y = 0; y < this.height; ++y) {
                p5.set(x, y, this.#hue_rotation(this.state[x][y][0], p5));
            }
        }
        p5.updatePixels();
        p5.pop();
    }

    on_click(x, y) {
        for (let dx = -5; dx <= 5; ++dx) {
            for (let dy = -5; dy <= 5; ++dy) {
                this.#set_state(x + dx, y + dy, [Math.max(0, Math.cos(Math.sqrt(dx * dx + dy * dy) * Math.PI / (2 * 5))), 0], true);
            }
        }
    }

    #bell_function(x, m, s) {
        return Math.exp(-Math.pow(((x - m) / s), 2) / 2);
    }

    #create_empty_matrix(width, height, default_value = false) {
        let matrix = new Array(width);
        for (let i = 0; i < width; ++i) {
            matrix[i] = new Array(height);
            if (default_value) {
                for (let j = 0; j < height; ++j) {
                    matrix[i][j] = default_value;
                }
            }
        }
        return matrix;
    }

    clear() {
        this.state = this.#create_empty_matrix(this.width, this.height, [0, 0]);
    }

    reset() {
        this.clear();

        let orbium = [
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.14, 0.1, 0.0, 0.0, 0.03, 0.03, 0.0, 0.0, 0.3, 0.0, 0.0, 0.0, 0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.08, 0.24, 0.3, 0.3, 0.18, 0.14, 0.15, 0.16, 0.15, 0.09, 0.2, 0.0, 0.0, 0.0, 0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.15, 0.34, 0.44, 0.46, 0.38, 0.18, 0.14, 0.11, 0.13, 0.19, 0.18, 0.45, 0.0, 0.0, 0],
            [0.0, 0.0, 0.0, 0.0, 0.06, 0.13, 0.39, 0.5, 0.5, 0.37, 0.06, 0.0, 0.0, 0.0, 0.02, 0.16, 0.68, 0.0, 0.0, 0],
            [0.0, 0.0, 0.0, 0.11, 0.17, 0.17, 0.33, 0.4, 0.38, 0.28, 0.14, 0.0, 0.0, 0.0, 0.0, 0.0, 0.18, 0.42, 0.0, 0],
            [0.0, 0.0, 0.09, 0.18, 0.13, 0.06, 0.08, 0.26, 0.32, 0.32, 0.27, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.82, 0.0, 0],
            [0.27, 0.0, 0.16, 0.12, 0.0, 0.0, 0.0, 0.25, 0.38, 0.44, 0.45, 0.34, 0.0, 0.0, 0.0, 0.0, 0.0, 0.22, 0.17, 0],
            [0.0, 0.07, 0.2, 0.02, 0.0, 0.0, 0.0, 0.31, 0.48, 0.57, 0.6, 0.57, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.49, 0],
            [0.0, 0.59, 0.19, 0.0, 0.0, 0.0, 0.0, 0.2, 0.57, 0.69, 0.76, 0.76, 0.49, 0.0, 0.0, 0.0, 0.0, 0.0, 0.36, 0],
            [0.0, 0.58, 0.19, 0.0, 0.0, 0.0, 0.0, 0.0, 0.67, 0.83, 0.9, 0.92, 0.87, 0.12, 0.0, 0.0, 0.0, 0.0, 0.22, 0.07],
            [0.0, 0.0, 0.46, 0.0, 0.0, 0.0, 0.0, 0.0, 0.7, 0.93, 1, 1, 1, 0.61, 0.0, 0.0, 0.0, 0.0, 0.18, 0.11],
            [0.0, 0.0, 0.82, 0.0, 0.0, 0.0, 0.0, 0.0, 0.47, 1, 1, 0.98, 1, 0.96, 0.27, 0.0, 0.0, 0.0, 0.19, 0.1],
            [0.0, 0.0, 0.46, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25, 1, 1, 0.84, 0.92, 0.97, 0.54, 0.14, 0.04, 0.1, 0.21, 0.05],
            [0.0, 0.0, 0.0, 0.4, 0.0, 0.0, 0.0, 0.0, 0.09, 0.8, 1, 0.82, 0.8, 0.85, 0.63, 0.31, 0.18, 0.19, 0.2, 0.01],
            [0.0, 0.0, 0.0, 0.36, 0.1, 0.0, 0.0, 0.0, 0.05, 0.54, 0.86, 0.79, 0.74, 0.72, 0.6, 0.39, 0.28, 0.24, 0.13, 0],
            [0.0, 0.0, 0.0, 0.01, 0.3, 0.07, 0.0, 0.0, 0.08, 0.36, 0.64, 0.7, 0.64, 0.6, 0.51, 0.39, 0.29, 0.19, 0.04, 0],
            [0.0, 0.0, 0.0, 0.0, 0.1, 0.24, 0.14, 0.1, 0.15, 0.29, 0.45, 0.53, 0.52, 0.46, 0.4, 0.31, 0.21, 0.08, 0.0, 0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.08, 0.21, 0.21, 0.22, 0.29, 0.36, 0.39, 0.37, 0.33, 0.26, 0.18, 0.09, 0.0, 0.0, 0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.03, 0.13, 0.19, 0.22, 0.24, 0.24, 0.23, 0.18, 0.13, 0.05, 0.0, 0.0, 0.0, 0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.02, 0.06, 0.08, 0.09, 0.07, 0.05, 0.01, 0.0, 0.0, 0.0, 0.0, 0]];

        let start_x = Math.floor((this.width - orbium[0].length) / 2);
        let start_y = Math.floor((this.height + orbium.length) / 2);

        for (let dx = 0; dx < orbium[0].length; ++dx) {
            for (let dy = 0; dy < orbium.length; ++dy) {
                this.#set_state(start_x + dx, start_y - dy, [orbium[dy][dx], 0.0]);
            }
        }
    }

    random() {
        this.state = this.#create_empty_matrix(this.width, this.height);
        for (let i = 0; i < this.width; ++i) {
            for (let j = 0; j < this.height; ++j) {
                this.state[i][j] = [Math.random(), 0.0];
            }
        }
    }
}

export function create_lenia_display(width, height) {
    let display = new CellularAutomateDisplay(128, 128, new Lenia(128, 128));
    new p5(display.sketch);
}

export function benchmark_lenia(width, height) {
    let lenia = new Lenia(width, height);
    const start = Date.now();
    for (let i = 0; i < 1000; ++i) {
        lenia.step();
    }
    const end = Date.now();
    console.log(`Execution time for 1'000 executions: ${end - start}ms`);
}