import {CellularAutomateDisplay} from "../cellular_automata.js";

export class GameOfLife {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.frame = -1;
        this.last_x = -1;
        this.last_y = -1;

        this.state = [];
        this.reset();
    }

    #get_state(x, y) {
        x %= this.width;
        y %= this.height;

        if (x < 0) x += this.width;
        if (y < 0) y += this.height;

        return this.state[x][y];
    }

    #set_state(x, y, state) {
        this.state[x][y] = state;
    }

    #neighbors(x, y) {
        return this.#get_state(x - 1, y) + this.#get_state(x + 1, y) + this.#get_state(x, y - 1) +
            this.#get_state(x, y + 1) + this.#get_state(x + 1, y + 1) + this.#get_state(x - 1, y + 1) +
            this.#get_state(x - 1, y - 1) + this.#get_state(x + 1, y - 1);
    }

    step() {
        this.frame++;
        if (this.frame % 20 !== 0) {
            return;
        }

        let new_state = new Array(this.width);

        for (let i = 0; i < this.width; ++i) {
            new_state[i] = new Array(this.height);
        }

        for (let x = 0; x < this.width; ++x) {
            for (let y = 0; y < this.height; ++y) {
                let neighbors = this.#neighbors(x, y);
                if (this.#get_state(x, y) > 0) {
                    if (neighbors < 2 || neighbors > 3) {
                        new_state[x][y] = 0;
                    } else {
                        new_state[x][y] = 1;
                    }
                } else {
                    if (neighbors === 3) {
                        new_state[x][y] = 1
                    } else {
                        new_state[x][y] = 0;
                    }
                }
            }
        }

        this.state = new_state;
    }

    draw(p5, clicked) {
        if (!clicked) {
            this.last_x = -1;
            this.last_y = -1;
        }
        p5.push();
        p5.noStroke();
        for (let x = 0; x < this.width; ++x) {
            for (let y = 0; y < this.height; ++y) {
                if (this.#get_state(x, y) > 0) {
                    p5.set(x, y, 255);
                } else {
                    p5.set(x, y, 0);
                }
            }
        }
        p5.updatePixels();
        p5.pop();
    }

    on_click(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
        if (x === this.last_x && y === this.last_y) return;

        this.last_x = x;
        this.last_y = y;

        if (this.#get_state(x, y) > 0) {
            this.#set_state(x, y, 0);
        } else {
            this.#set_state(x, y, 1);
        }
    }

    clear() {
        this.state = new Array(this.width);

        for (let i = 0; i < this.width; ++i) {
            this.state[i] = new Array(this.height).fill(0);
        }
    }

    // clear state and insert "Overleaf"
    reset() {
        let overleaf = [
            [0, 0, 0, 1, 0, 1, 0, 0, 0],
            [0, 1, 1, 1, 0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1, 0, 0, 0, 1],
            [1, 0, 1, 0, 0, 0, 1, 0, 1],
            [0, 1, 1, 0, 1, 0, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 0, 1, 0, 1, 1, 0],
            [1, 0, 1, 0, 0, 0, 1, 0, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0, 1, 1, 1, 0],
            [0, 0, 0, 1, 0, 1, 0, 0, 0]
        ];

        this.clear();

        let start_x = Math.floor(this.width / 2) - 4;
        let start_y = Math.floor(this.height / 2) - 5;

        for (let dx = 0; dx < 9; ++dx) {
            for (let dy = 0; dy < 11; ++dy) {
                this.state[start_x + dx][start_y + dy] = overleaf[dy][dx];
            }
        }
    }
}

export function create_game_of_life_display(width, height) {
    let display = new CellularAutomateDisplay(width, height, new GameOfLife(width, height));
    new p5(display.sketch);
}