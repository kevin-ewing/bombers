// sketch.js
import {
  BASE_ACCEL, BASE_MAXSPD, SCALE_A, SCALE_LERP,
  PLANE_W, PIXEL_SIZE
} from './constants.js';
import { GameState }          from './state.js';
import {
  createPlaneGraphic, drawPlane,
  handleInput, integrateMotion, constrainPlane
} from './plane.js';
import {
  initChunks, generateChunks,
  scrollChunks, renderGround
} from './terrain.js';
import { keyPressed, windowResized } from './controls.js';

window.keyPressed    = keyPressed;
window.windowResized = windowResized;

function usableTravelWidth(scale){
  return width - (PLANE_W * PIXEL_SIZE) * scale;
}

function updateScaleAndSpeeds(){
  GameState.sceneScale = lerp(GameState.sceneScale, GameState.targetScale, SCALE_LERP);
  if(abs(GameState.sceneScale - GameState.targetScale) < 0.0001)
    GameState.sceneScale = GameState.targetScale;

  const speedFactor = usableTravelWidth(GameState.sceneScale) /
                      usableTravelWidth(SCALE_A);

  GameState.accel  = lerp(GameState.accel , BASE_ACCEL  * speedFactor, SCALE_LERP);
  GameState.maxSpd = lerp(GameState.maxSpd, BASE_MAXSPD * speedFactor, SCALE_LERP);
}

window.setup = function(){
  createCanvas(windowWidth, windowHeight);
  pixelDensity(2);
  colorMode(HSB,360,100,100);
  noSmooth();
  noiseDetail(6,0.5);

  GameState.sceneScale  = SCALE_A;
  GameState.targetScale = SCALE_A;
  GameState.accel       = BASE_ACCEL;
  GameState.maxSpd      = BASE_MAXSPD;

  createPlaneGraphic();
  initChunks();

  GameState.planeX = width  / 2;
  GameState.planeY = height / 2;
};

window.draw = function(){
  updateScaleAndSpeeds();

  generateChunks();
  scrollChunks();
  renderGround();

  handleInput();
  integrateMotion();
  constrainPlane();
  drawPlane();
};
