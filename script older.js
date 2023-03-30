'use strict';

const scale = window.devicePixelRatio;
const xDimension = 550;
const yDimension = 550;

const canvas = document.createElement('CANVAS');
const ctx = canvas.getContext('2d');
const gravity = 1;
const airResistance = 0.995;

canvas.classList.add('phys-canvas');
canvas.style.width = xDimension + 'px';
canvas.style.height = yDimension + 'px';
canvas.width = xDimension * scale;
canvas.height = yDimension * scale;
canvas.style.zIndex = 10;

document.querySelector('#canvas-container').appendChild(canvas);
canvas.addEventListener('click', spawnBall, false);

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
  if (brightness < 30) {
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

function spawnBall(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * scale; // Calculate the x coordinate of the click relative to the canvas, taking into account devicePixelRatio
  const y = (e.clientY - rect.top) * scale; // Calculate the y coordinate of the click relative to the canvas, taking into account devicePixelRatio

  let ball = new Ball(10, 10000, x, y);
  balls.push(ball);
  drawBall(ball);
}

function drawBall(ball) {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fillStyle = ball.col;
  ctx.fill();
}

let lastTime = 0;
function update(time) {
  let dt = time - lastTime; // Delta Time
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let ball of balls) {
    let forces = { x: 0.0, y: 90.8 };
    let accelerations = { x: forces.x / ball.mass, y: forces.y / ball.mass };
    let previousPositions = { x: ball.x, y: ball.y };

    ball.x = ball.x * 2 - ball.prevX + accelerations.x * (dt * dt);
    ball.y = ball.y * 2 - ball.prevY + accelerations.y * (dt * dt);

    ball.prevX = previousPositions.x;
    ball.prevY = previousPositions.y;

    keepInsideView(ball);
    // Draw the ball
    drawBall(ball);
  }

  lastTime = time;
  requestAnimationFrame(update);
}

function keepInsideView(ball) {
  if (ball.y >= yDimension) ball.y = yDimension;
  if (ball.x >= xDimension) ball.x = xDimension;
  if (ball.y < 0) ball.y = 0;
  if (ball.x < 0) ball.x = 0;
}

requestAnimationFrame(update);
