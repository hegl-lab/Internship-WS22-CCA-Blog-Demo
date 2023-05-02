import {IFrameObserver} from "./iframe_state.js"

export class CellularAutomateDisplay {
    constructor(width, height, cellular_automata) {
        this.width = width;
        this.height = height;
        this.scale = 0;
        this.cellular_automata = cellular_automata;
        this.pause = false;
        this.iframe_observer = new IFrameObserver();
    }

    sketch = (p5) => {
        let display = this;

        window.pause_game = function () {
            display.pause = !display.pause;
            document.getElementById('pause-icon').style.display = display.pause ? 'block' : 'none';
            document.getElementById('btn-pause-text').textContent = display.pause ? 'Resume' : 'Pause';
        }

        window.clear_game = function () {
            display.cellular_automata.clear();
        }

        window.reset_game = function () {
            display.cellular_automata.reset();
        }

        window.randomize_game = function () {
            display.cellular_automata.random();
        }

        p5.setup = function () {
            p5.createCanvas(display.width, display.height);
            p5.windowResized();
            p5.frameRate(13);
        }

        p5.draw = function () {
            if (!display.iframe_observer.active) return;
            if (!display.pause) display.cellular_automata.step();
            display.cellular_automata.draw(p5, p5.mouseIsPressed);
            if (p5.mouseIsPressed) {
                let x = Math.floor(p5.mouseX / display.scale);
                let y = Math.floor(p5.mouseY / display.scale);
                if (x >= display.width || y >= display.width || x < 0 || y < 0) return;
                display.cellular_automata.on_click(x, y);
            }
        }

        p5.windowResized = function () {
            let canvas = document.getElementById('defaultCanvas0');
            display.scale = Math.min(
                p5.windowWidth / display.width,
                p5.windowHeight / display.height
            );
            canvas.style.scale = display.scale.toString();
            let translate = '-' + (50 / display.scale).toString() + '%';
            canvas.style.transform = 'translate(' + translate + ', ' + translate + ')';
        }
    }
}
