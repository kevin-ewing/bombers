// clouds.js
import {
  CLOUD_TILE_SIZE, CLOUD_CHUNK_COUNT, CLOUD_ROWS_PER_FRAME,
  CLOUD_SCROLL_MULT, SCROLL_BASE,
  SCALE_A, SCALE_B,
  CLOUD_MACRO_S, CLOUD_DETAIL_S, CLOUD_WISP_S,
  CLOUD_COVER_S, CLOUD_COVER_THRESH,
  CLOUD_ALPHA_MIN, CLOUD_ALPHA_MAX
} from './constants.js';
import { GameState } from './state.js';

export function initClouds(){
  GameState.cloudW  = ceil(width  / CLOUD_TILE_SIZE);
  GameState.cloudH  = ceil(height / CLOUD_TILE_SIZE);
  GameState.cloudPW = GameState.cloudW * CLOUD_TILE_SIZE;
  GameState.cloudPH = GameState.cloudH * CLOUD_TILE_SIZE;
  GameState.clouds  = [];

  for(let i=0;i<CLOUD_CHUNK_COUNT;i++){
    const y = -i * GameState.cloudPH;
    const g = createGraphics(GameState.cloudPW, GameState.cloudPH);
    g.pixelDensity(2);
    g.colorMode(HSB,360,100,100,100);
    g.noStroke();
    const ready = i < 2;
    if(ready) generateRows(g,y,0,GameState.cloudH);
    GameState.clouds.push({ g, worldY:y, y, rows: ready?GameState.cloudH:0, ready });
  }
}

export const resizeClouds = initClouds;

export function generateClouds(){
  for(const c of GameState.clouds) if(!c.ready){
    const rows = min(CLOUD_ROWS_PER_FRAME, GameState.cloudH - c.rows);
    generateRows(c.g,c.worldY,c.rows,rows);
    c.rows += rows;
    if(c.rows >= GameState.cloudH) c.ready = true;
  }
}

export function renderClouds(){
  const zoom = GameState.sceneScale / SCALE_A;
  push();
  translate(GameState.planeX,GameState.planeY);
  scale(zoom);
  translate(-GameState.planeX,-GameState.planeY);
  imageMode(CORNER);
  for(const c of GameState.clouds) image(c.g,0,c.y);
  pop();
  imageMode(CENTER);
}

export function scrollClouds(){
  const dy = SCROLL_BASE * CLOUD_SCROLL_MULT * (GameState.sceneScale / SCALE_B);
  for(const c of GameState.clouds) c.y += dy;
  for(const c of GameState.clouds) if(c.y >= height){
    const top = GameState.clouds.reduce((m,k)=>k.y < m.y ? k : m);
    c.worldY = top.worldY - GameState.cloudPH;
    c.y      = top.y      - GameState.cloudPH;
    c.g.clear();
    c.rows = 0;
    c.ready = false;
  }
}

export function updateClouds(){
  generateClouds();
  scrollClouds();
}

function generateRows(g,y0,start,count){
  for(let r=0;r<count;r++){
    const ty = start + r; if(ty >= GameState.cloudH) break;
    const wy = y0 + ty*CLOUD_TILE_SIZE;

    for(let tx=0; tx<GameState.cloudW; tx++){
      const wx = tx*CLOUD_TILE_SIZE;

      const cover  = noise(wx*CLOUD_COVER_S+11.3, wy*CLOUD_COVER_S+87.9);
      if(cover < CLOUD_COVER_THRESH) continue;          // large clear-sky gaps

      const macro  = noise(wx*CLOUD_MACRO_S+51.2,  wy*CLOUD_MACRO_S+13.7);
      const detail = noise(wx*CLOUD_DETAIL_S+301.1,wy*CLOUD_DETAIL_S+900.4);
      const wisp   = noise(wx*CLOUD_WISP_S+700.5,  wy*CLOUD_WISP_S+200.2);

      let density = macro*0.55 + detail*0.35 + wisp*0.10;
      density     = pow(density, 1.4) * cover;          // modulate by cover

      const THRESH = 0.25;
      if(density < THRESH) continue;

      let alpha = map(constrain(density,0,1), THRESH,1, CLOUD_ALPHA_MIN, CLOUD_ALPHA_MAX);
      alpha += (pow(density,2)-0.25)*60;
      alpha  = constrain(alpha, CLOUD_ALPHA_MIN, CLOUD_ALPHA_MAX);

      g.fill(0,0,100, alpha);
      g.rect(wx, wy - y0, CLOUD_TILE_SIZE, CLOUD_TILE_SIZE);
    }
  }
}
