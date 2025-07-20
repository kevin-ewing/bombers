// controls.js
import { GameState }  from './state.js';
import { SCALE_A, SCALE_B } from './constants.js';
import { boost }      from './plane.js';
import { initChunks } from './terrain.js';

export function keyPressed(){
  if(keyCode === 32) boost();
  else if(keyCode === SHIFT){
    GameState.targetScale = (GameState.targetScale === SCALE_A) ? SCALE_B : SCALE_A;
  }
}

export function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  initChunks();
}
