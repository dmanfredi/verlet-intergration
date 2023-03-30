'use strict';

const scale = window.devicePixelRatio;
const xDimension = 500;
const yDimension = 500;

const canvas = document.createElement('CANVAS');
const ctx = canvas.getContext('2d');
// const gravity = 1;
const airResistance = 0.995;
const elasticity = 0.8;
const subSteps = 1; // Brakes things. No idea why.
// Try to compare what prezza is doing with what your doing
// Ask ChatGPT for the difference

let objects = 0;

canvas.classList.add('phys-canvas');
canvas.style.width = xDimension + 'px';
canvas.style.height = yDimension + 'px';
canvas.width = xDimension * scale;
canvas.height = yDimension * scale;
canvas.style.zIndex = 10;

let spawnInterval;
canvas.addEventListener('click', spawnBall, false);
// canvas.addEventListener(
//   'mousedown',
//   (e) => (spawnInterval = setInterval(spawnBall, 10)),
//   false
// );

let canvasContainer = document.querySelector('#canvas-container');
canvasContainer.appendChild(canvas);
// canvasContainer.width = xDimension;
// canvasContainer.height = yDimension;

let framerateContainer = document.querySelector('.framerate');

function drawBorder() {
  ctx.beginPath();
  ctx.arc(xDimension / 2, yDimension / 2, xDimension / 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function rand(min, max) {
  return min + Math.round((max - min) * Math.random());
}

function getRandomColor() {
  const min = 0; // Minimum color value (0-255)
  const max = 255; // Maximum color value (0-255)

  // Generate random red, green, and blue color values
  let r = Math.floor(Math.random() * (max - min + 1) + min);
  let g = Math.floor(Math.random() * (max - min + 1) + min);
  let b = Math.floor(Math.random() * (max - min + 1) + min);

  // Calculate the perceived brightness of the color
  const brightness = Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b);

  // If the color is too close to black, generate a new color
  if (brightness < 20) {
    return getRandomColor();
  }

  // Convert the color to hex format
  const hexR = r.toString(16).padStart(2, '0');
  const hexG = g.toString(16).padStart(2, '0');
  const hexB = b.toString(16).padStart(2, '0');
  return `#${hexR}${hexG}${hexB}`;
}

let balls = [];

class Ball {
  constructor(r, mass, x, y) {
    this.r = r;
    this.mass = mass;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.col = getRandomColor();
  }
}

function getDistanceComponent(point1, point2) {
  let xDiff = point2.x - point1.x;
  let yDiff = point2.y - point1.y;
  return { x: xDiff, y: yDiff };
}

function getDistance(point1, point2) {
  let xDiff = point2.x - point1.x;
  let yDiff = point2.y - point1.y;
  let xDiffSQ = xDiff ** 2;
  let yDiffSQ = yDiff ** 2;
  return Math.sqrt(xDiffSQ + yDiffSQ);
}

function spawnBall(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * scale; // Calculate the x coordinate of the click relative to the canvas, taking into account devicePixelRatio
  const y = (e.clientY - rect.top) * scale; // Calculate the y coordinate of the click relative to the canvas, taking into account devicePixelRatio

  let ball = new Ball(rand(10, 20), 10000, x, y);
  balls.push(ball);
  drawBall(ball);

  objects++;
  document.querySelector(
    '.object-count'
  ).innerHTML = `Object Count: ${objects}`;
}

function drawBall(ball) {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fillStyle = ball.col;
  ctx.fill();
}

setInterval(
  // Update the framerate every second
  () => (framerateContainer.innerHTML = `Framerate: ${framerate}`),
  1000
);

let lastTime = 0;
let framerate = 0;
function update(time) {
  let dt = time - lastTime; // Delta Time
  framerate = Math.floor(1000 / dt);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let ball of balls) {
    for (let i = subSteps; i > 0; i--) {
      updatePosistions(ball, dt / subSteps);
      handleConstraint(ball);
      checkCollisions(ball);
    }

    // Draw the ball
    drawBall(ball);
  }

  drawBorder();
  lastTime = time;
  requestAnimationFrame(update);
}

function updatePosistions(ball, dt) {
  let forces = { x: 0.0, y: 10 };
  let accelerations = { x: forces.x / ball.mass, y: forces.y / ball.mass };
  let previousPositions = { x: ball.x, y: ball.y };

  ball.x = ball.x * 2 - ball.prevX + accelerations.x * (dt * dt);
  ball.y = ball.y * 2 - ball.prevY + accelerations.y * (dt * dt);

  ball.prevX = previousPositions.x;
  ball.prevY = previousPositions.y;
}

function checkCollisions(ball) {
  for (let otherBall of balls) {
    if (otherBall.x === ball.x && otherBall.y === ball.y) continue; // Dont check if your intersecting with yourself

    let distance = getDistance(ball, otherBall);

    // console.log(ball.r + otherBall.r);

    if (distance < ball.r + otherBall.r) {
      let overlap = otherBall.r + ball.r - distance;
      // let ratio = diff / distance;

      let dx = (otherBall.x - ball.x) / distance;
      let dy = (otherBall.y - ball.y) / distance;

      let adjustment = overlap / 2;
      let x1_new = ball.x - dx * adjustment;
      let y1_new = ball.y - dy * adjustment;
      let x2_new = otherBall.x + dx * adjustment;
      let y2_new = otherBall.y + dy * adjustment;

      ball.x = x1_new;
      ball.y = y1_new;

      otherBall.x = x2_new;
      otherBall.y = y2_new;
    }
  }
}

function handleConstraint(ball) {
  let constraintRadius = xDimension / 2;
  let constraintCenter = { x: xDimension / 2, y: yDimension / 2 };

  let distance = getDistance(ball, constraintCenter);

  if (distance > constraintRadius - ball.r) {
    let diff = constraintRadius - ball.r - distance;
    let ratio = diff / distance;
    let dx = (constraintCenter.x - ball.x) * ratio;
    let dy = (constraintCenter.y - ball.y) * ratio;

    ball.x -= dx;
    ball.y -= dy;
  }

  // if (ball.y >= yDimension) ball.y = yDimension;
  // if (ball.x >= xDimension) ball.x = xDimension;
  // if (ball.y < 0) ball.y = 0;
  // if (ball.x < 0) ball.x = 0;
}

for (let i = 0; i < 50; i++) {
  let e = { clientX: 100, clientY: 100 };
  spawnBall(e);
}

requestAnimationFrame(update);
