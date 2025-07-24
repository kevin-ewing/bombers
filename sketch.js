// sketch.js
import {
  BASE_ACCEL, BASE_MAXSPD, SCALE_A, SCALE_LERP,
  PLANE_W, PIXEL_SIZE
} from './constants.js';
import { GameState } from './state.js';
import {
  createPlaneGraphic, drawPlane,
  handleInput, integrateMotion, constrainPlane
} from './plane.js';
import {
  initChunks, generateChunks,
  scrollChunks, renderGround
} from './terrain.js';
import {
  initClouds, updateClouds,
  renderClouds, resizeClouds
} from './clouds.js';
import { keyPressed, windowResized as controlsWindowResized } from './controls.js';
import { createBomberGraphic, drawBombers } from './bomber.js';

window.keyPressed = keyPressed;
window.windowResized = () => {
  resizeCanvas(windowWidth, windowHeight);
  resizeClouds();
  controlsWindowResized();
};

const usableTravelWidth = s => width - (PLANE_W * PIXEL_SIZE) * s;

function updateScaleAndSpeeds() {
  GameState.sceneScale = lerp(GameState.sceneScale, GameState.targetScale, SCALE_LERP);
  if (abs(GameState.sceneScale - GameState.targetScale) < 0.0001)
    GameState.sceneScale = GameState.targetScale;

  const f = usableTravelWidth(GameState.sceneScale) / usableTravelWidth(SCALE_A);
  GameState.accel  = lerp(GameState.accel,  BASE_ACCEL  * f, SCALE_LERP);
  GameState.maxSpd = lerp(GameState.maxSpd, BASE_MAXSPD * f, SCALE_LERP);
}

window.setup = () => {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(2);
  colorMode(HSB, 360, 100, 100);
  noSmooth();
  noiseDetail(6, 0.5);

  GameState.sceneScale  = SCALE_A;
  GameState.targetScale = SCALE_A;
  GameState.accel       = BASE_ACCEL;
  GameState.maxSpd      = BASE_MAXSPD;

  createPlaneGraphic();
  createBomberGraphic();
  initChunks();
  initClouds();

  /* plane starts centred */
  GameState.planeX = width  / 2;
  GameState.planeY = height / 2;

  /* ── diamond of 4×3 (twelve bombers) ─────────────────────────────── */
  const ux = 100;   // horizontal unit (adjust to taste)
  const uy = 70;   // vertical unit   (adjust to taste)
  const sx = 100;   // horizontal space (adjust to taste)
  const sy = 300;   // vertical space   (adjust to taste

  GameState.bombers = [
    /* top group */
    { wx: GameState.planeX, wy: GameState.planeY - 3*uy - sx},
    { wx: GameState.planeX - 1*ux, wy: GameState.planeY - 2*uy - sx},
    { wx: GameState.planeX + 1*ux, wy: GameState.planeY - 2*uy - sx},

    /* middle left */
    { wx: GameState.planeX - sy, wy: GameState.planeY - uy},
    { wx: GameState.planeX - 1*ux - sy, wy: GameState.planeY},
    { wx: GameState.planeX + 1*ux - sy, wy: GameState.planeY},

    /* middle right */
    { wx: GameState.planeX + sy, wy: GameState.planeY - uy},
    { wx: GameState.planeX - 1*ux + sy, wy: GameState.planeY},
    { wx: GameState.planeX + 1*ux + sy, wy: GameState.planeY},

    { wx: GameState.planeX, wy: GameState.planeY + 2*uy + sx},
    { wx: GameState.planeX - 1*ux, wy: GameState.planeY + 3*uy + sx},
    { wx: GameState.planeX + 1*ux, wy: GameState.planeY + 3*uy + sx},

  ];
};

window.draw = () => {
  updateScaleAndSpeeds();
  generateChunks();
  scrollChunks();
  updateClouds();
  handleInput();
  integrateMotion();
  constrainPlane();

  renderGround();
  drawBombers();
  drawPlane();
  renderClouds();
};
