import { runtime } from "../core/state.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const bounds = canvas.getBoundingClientRect();
  runtime.viewWidth = bounds.width;
  runtime.viewHeight = bounds.height;

  canvas.width = Math.round(runtime.viewWidth * dpr);
  canvas.height = Math.round(runtime.viewHeight * dpr);

  // Draw using CSS pixel coordinates.
  ctx.setTransform(canvas.width / runtime.viewWidth, 0, 0, canvas.height / runtime.viewHeight, 0, 0);
  ctx.imageSmoothingEnabled = false;
}


function setupCanvas() {
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
}

export { canvas, ctx, resizeCanvas, setupCanvas };
