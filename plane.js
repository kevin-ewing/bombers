// plane.js
import {
  PIXEL_SIZE, PLANE_W, PLANE_H,
  BOOST_MULT, FRICTION,
  RUMBLE_AMP, RUMBLE_FREQ
} from './constants.js';
import { GameState } from './state.js';

export function createPlaneGraphic() {
  const g = createGraphics(PLANE_W * PIXEL_SIZE, PLANE_H * PIXEL_SIZE);
  g.colorMode(HSB, 360, 100, 100);
  drawPlanePixels(g);
  GameState.planeG = g;
}

function drawPlanePixels(g) {
  const p = v => v * PIXEL_SIZE;
  g.noStroke();
  g.fill(100, 35, 18); g.rect(p(5), p(40), p(90), p(20));
  g.rect(p(0), p(45), p(100), p(10)); g.rect(p(15), p(60), p(70), p(5));
  g.rect(p(25), p(65), p(50), p(5)); g.fill(100, 45, 30);
  g.rect(p(15), p(55), p(70), p(5)); g.rect(p(25), p(60), p(50), p(5));
  g.rect(p(5), p(45), p(90), p(10)); g.fill(100, 25, 40);
  g.rect(p(15), p(45), p(70), p(10));

  g.fill(100, 35, 18); g.rect(p(40), p(15), p(20), p(100));
  g.rect(p(45), p(10), p(10), p(110));
  g.fill(90, 10, 60); g.rect(p(45), p(15), p(10), p(10));
  g.fill(95, 25, 40); g.rect(p(45), p(25), p(5), p(80));
  g.fill(95, 20, 50); g.rect(p(50), p(25), p(5), p(80));
  g.fill(0, 0, 75); g.rect(p(45), p(0), p(10), p(5));
  g.fill(10, 70, 70); g.rect(p(45), p(55), p(5), p(10));
  g.fill(45, 40, 85); g.rect(p(50), p(55), p(5), p(10));
  g.fill(100, 35, 18); g.rect(p(30), p(95), p(40), p(20));
  g.rect(p(25), p(100), p(50), p(10));
  g.fill(100, 45, 32); g.rect(p(30), p(100), p(40), p(10));
  g.rect(p(45), p(105), p(10), p(10));
  g.fill(95, 25, 42); g.rect(p(35), p(100), p(30), p(5));
  g.rect(p(40), p(95), p(20), p(5));
  g.fill(10, 70, 70); g.rect(p(50), p(95), p(5), p(15));
  g.fill(45, 40, 85); g.rect(p(45), p(95), p(5), p(15));
}

export function drawPlane() {
  const zoom = GameState.sceneScale;           // current zoom

  /* world-space jitter (constant value) */
  const t  = frameCount * RUMBLE_FREQ;
  const dx = (noise(999.3,  t) - 0.5) * RUMBLE_AMP;   // -- no ÷ zoom
  const dy = (noise(199.7,  t) - 0.5) * RUMBLE_AMP;

  push();
  translate(GameState.planeX + dx, GameState.planeY + dy);
  scale(zoom);
  image(GameState.planeG, 0, 0);
  pop();
}

export function handleInput() {
  if (keyIsDown(65)) GameState.vx -= GameState.accel;
  if (keyIsDown(68)) GameState.vx += GameState.accel;
  if (keyIsDown(87)) GameState.vy -= GameState.accel;
  if (keyIsDown(83)) GameState.vy += GameState.accel;
}

export function integrateMotion() {
  GameState.vx *= FRICTION;
  GameState.vy *= FRICTION;
  GameState.planeX += GameState.vx;
  GameState.planeY += GameState.vy;
  limitSpeed();
}

export function boost() {
  if (!GameState.vx && !GameState.vy) {
    GameState.vx = GameState.maxSpd * 0.5;
  } else {
    GameState.vx *= BOOST_MULT;
    GameState.vy *= BOOST_MULT;
  }
  limitSpeed();
}

function limitSpeed() {
  const m = sqrt(GameState.vx * GameState.vx + GameState.vy * GameState.vy);
  if (m > GameState.maxSpd) {
    GameState.vx = (GameState.vx / m) * GameState.maxSpd;
    GameState.vy = (GameState.vy / m) * GameState.maxSpd;
  }
}

export function constrainPlane() {
  const hw = (GameState.planeG.width * GameState.sceneScale) / 2;
  const hh = (GameState.planeG.height * GameState.sceneScale) / 2;
  GameState.planeX = constrain(GameState.planeX, hw, width - hw);
  GameState.planeY = constrain(GameState.planeY, hh, height - hh);
}
