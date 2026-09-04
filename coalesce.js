const canvas = document.getElementById("coalesceCanvas");
const ctx = canvas.getContext("2d");

const video = document.createElement("video");

video.src = "coalesce.mp4";
video.loop = true;
video.muted = true;
video.playsInline = true;
video.preload = "auto";

let playing = false;

let layers = 5;
let intensity = 50;
let mode = "normal";

let mouseX = 0.5;
let mouseY = 0.5;

let targetMouseX = 0.5;
let targetMouseY = 0.5;

/* --------------------------------
   Resize canvas
-------------------------------- */

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();

/* --------------------------------
   Pointer movement
-------------------------------- */

function updatePointer(x, y) {
    const rect = canvas.getBoundingClientRect();

    targetMouseX = (x - rect.left) / rect.width;
    targetMouseY = (y - rect.top) / rect.height;

    targetMouseX = Math.max(0, Math.min(1, targetMouseX));
    targetMouseY = Math.max(0, Math.min(1, targetMouseY));
}

canvas.addEventListener("mousemove", (event) => {
    updatePointer(event.clientX, event.clientY);
});

canvas.addEventListener("touchmove", (event) => {
    if (event.touches.length > 0) {
        updatePointer(
            event.touches[0].clientX,
            event.touches[0].clientY
        );
    }
});

/* --------------------------------
   Play / pause
-------------------------------- */

canvas.addEventListener("click", () => {

    if (playing) {

        video.pause();

        playing = false;

    } else {

        video.play();

        playing = true;

        document
            .getElementById("startMessage")
            .classList.add("hidden");
    }

});

/* --------------------------------
   Controls
-------------------------------- */

const layersSlider = document.getElementById("layers");
const intensitySlider = document.getElementById("intensity");

layersSlider.addEventListener("input", () => {

    layers = Number(layersSlider.value);

    document.getElementById("layersValue").textContent = layers;

});

intensitySlider.addEventListener("input", () => {

    intensity = Number(intensitySlider.value);

    document.getElementById("intensityValue").textContent = intensity;

});

/* --------------------------------
   Modes
-------------------------------- */

document.querySelectorAll(".mode").forEach(button => {

    button.addEventListener("click", () => {

        document
            .querySelectorAll(".mode")
            .forEach(b => b.classList.remove("active"));

        button.classList.add("active");

        mode = button.dataset.mode;

    });

});

/* --------------------------------
   Draw video
-------------------------------- */

function drawVideoLayer(x, y, width, height, alpha) {

    if (video.readyState < 2) {
        return;
    }

    ctx.save();

    ctx.globalAlpha = alpha;

    if (mode === "ghost") {

        ctx.globalCompositeOperation = "screen";

    } else {

        ctx.globalCompositeOperation = "source-over";

    }

    if (mode === "invert") {

        ctx.filter = "invert(1)";

    } else {

        ctx.filter = "none";

    }

    ctx.drawImage(
        video,
        x,
        y,
        width,
        height
    );

    ctx.restore();
}

/* --------------------------------
   Animation
-------------------------------- */

function draw() {

    const rect = canvas.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    /* Smooth pointer movement */

    mouseX += (targetMouseX - mouseX) * 0.08;
    mouseY += (targetMouseY - mouseY) * 0.08;

    /* Clear */

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#000";

    ctx.fillRect(0, 0, width, height);

    /* Video dimensions */

    const videoRatio =
        video.videoWidth / video.videoHeight || 16 / 9;

    const canvasRatio = width / height;

    let videoWidth;
    let videoHeight;

    if (videoRatio > canvasRatio) {

        videoHeight = height;
        videoWidth = height * videoRatio;

    } else {

        videoWidth = width;
        videoHeight = width / videoRatio;

    }

    const baseX = (width - videoWidth) / 2;
    const baseY = (height - videoHeight) / 2;

    /* Draw layers */

    for (let i = layers - 1; i >= 0; i--) {

        const progress =
            layers === 1
                ? 0
                : i / (layers - 1);

        const movement =
            (intensity / 100) * 100;

        const centerX =
            (mouseX - 0.5) * movement;

        const centerY =
            (mouseY - 0.5) * movement;

        const driftX =
            Math.sin(
                performance.now() * 0.0004 +
                i
            ) * movement * 0.15;

        const driftY =
            Math.cos(
                performance.now() * 0.0003 +
                i
            ) * movement * 0.15;

        const x =
            baseX +
            centerX * progress +
            driftX * progress;

        const y =
            baseY +
            centerY * progress +
            driftY * progress;

        let alpha;

        if (mode === "ghost") {

            alpha = 0.12;

        } else {

            alpha =
                1 / layers +
                (1 - progress) * 0.08;

        }

        drawVideoLayer(
            x,
            y,
            videoWidth,
            videoHeight,
            alpha
        );

    }

    /* Subtle green frame inside the image */

    ctx.save();

    ctx.strokeStyle = "rgba(50, 255, 50, 0.35)";
    ctx.lineWidth = 1;

    ctx.strokeRect(
        10,
        10,
        width - 20,
        height - 20
    );

    ctx.restore();

    requestAnimationFrame(draw);
}

/* --------------------------------
   Start
-------------------------------- */

draw();
