export class IFrameObserver {
    constructor() {
        this.options = {
            rootMargin: "0px",
            threshold: [0.5],
            trackVisibility: true,
            delay: 100
        };

        this.observer = new IntersectionObserver(this.handleIntersect, this.options);
        this.observer.observe(document.getElementById("content"));

        this.active = true
    }

    handleIntersect(entries, observer) {
        this.active = entries[0].isIntersecting;
        if (this.active) {
            console.log("START DRAWING");
        } else {
            console.log("STOP DRAWING");
        }
    }
}