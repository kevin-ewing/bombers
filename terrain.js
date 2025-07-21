// terrain.js
import {
  TILE_SIZE, CHUNK_COUNT, ROWS_PER_FRAME, SCROLL_BASE,
  SCALE_A, SCALE_B,
  BASE_S, FOREST_S,
  RIVER_S, RIVER_THRESH, WATER_H, WATER_S, WATER_B,
  BEACH_SIZE, BEACH_H, BEACH_S, BEACH_B,
  ULTRA_GRAIN_S
} from './constants.js';
import { GameState }  from './state.js';
import { stableHash } from './utils.js';

/* master frequencies */
const MACRO_S    = 0.00001;
const MESO_S     = 0.00025;
const MICRO_S    = 0.015;
const FREQ_BOOST = 8;

/* palettes */
const FIELDS = [
  {h1: 95, h2:110, s1:30, s2:50, b1:55, b2:70},
  {h1:100, h2:115, s1:35, s2:55, b1:50, b2:68},
  {h1:110, h2:125, s1:28, s2:48, b1:45, b2:60},
  {h1: 85, h2:100, s1:40, s2:60, b1:60, b2:78}
];
const FORESTS = [
  {h1:110, h2:125, s1:40, s2:60, b1:35, b2:50},
  {h1:120, h2:135, s1:45, s2:65, b1:30, b2:45}
];

/* helpers */
const lerpRange = (a,b,t)=>a+(b-a)*t;
const sample = (p,t)=>({ h:lerpRange(p.h1,p.h2,t), s:lerpRange(p.s1,p.s2,t), b:lerpRange(p.b1,p.b2,t) });

export function initChunks(){
  GameState.cW  = ceil(width  / TILE_SIZE);
  GameState.cH  = ceil(height / TILE_SIZE);
  GameState.cPW = GameState.cW * TILE_SIZE;
  GameState.cPH = GameState.cH * TILE_SIZE;
  GameState.chunks = [];
  for(let i=0;i<CHUNK_COUNT;i++){
    const y = -i*GameState.cPH;
    const g = createGraphics(GameState.cPW,GameState.cPH);
    g.pixelDensity(2);
    g.colorMode(HSB,360,100,100);
    g.noStroke();
    const ready = i<2;
    if(ready) generateRows(g,y,0,GameState.cH);
    GameState.chunks.push({ g, worldY:y, y, rows: ready?GameState.cH:0, ready });
  }
}

export function generateChunks(){
  for(const c of GameState.chunks) if(!c.ready){
    const rows = min(ROWS_PER_FRAME, GameState.cH - c.rows);
    generateRows(c.g, c.worldY, c.rows, rows);
    c.rows += rows;
    if(c.rows >= GameState.cH) c.ready = true;
  }
}

export function scrollChunks(){
  const dy = SCROLL_BASE * (GameState.sceneScale / SCALE_B);
  for(const c of GameState.chunks) c.y += dy;
  for(const c of GameState.chunks) if(c.y >= height){
    const top = GameState.chunks.reduce((m,k)=>k.y < m.y ? k : m);
    c.worldY = top.worldY - GameState.cPH;
    c.y      = top.y      - GameState.cPH;
    c.g.clear(); c.rows = 0; c.ready = false;
  }
}

export function renderGround(){
  const zoom = GameState.sceneScale / SCALE_A;
  push();
  translate(GameState.planeX, GameState.planeY);
  scale(zoom);
  translate(-GameState.planeX, -GameState.planeY);
  imageMode(CORNER);
  for(const c of GameState.chunks) image(c.g, 0, c.y);
  pop();
  imageMode(CENTER);
}

/* main generator */
function generateRows(g,y0,start,count){
  for(let r=0;r<count;r++){
    const ty = start + r; if(ty >= GameState.cH) break;
    const wy = y0 + ty*TILE_SIZE;

    for(let tx=0; tx<GameState.cW; tx++){
      const wx = tx*TILE_SIZE;

      const nMacro  = noise(wx*MACRO_S+13.2,  wy*MACRO_S+71.8);
      const nMeso   = noise(wx*MESO_S +5.4,   wy*MESO_S +9.6);
      const nMicro  = noise(wx*MICRO_S+901.2, wy*MICRO_S+345.6);
      const nBase   = noise(wx*BASE_S  *FREQ_BOOST, wy*BASE_S  *FREQ_BOOST);
      const nForest = noise(wx*FOREST_S*FREQ_BOOST+37.7, wy*FOREST_S*FREQ_BOOST+91.3);

      const nRiver  = noise(wx*RIVER_S, wy*RIVER_S);
      const dRiver  = abs(nRiver - 0.5);
      const isRiver = dRiver < RIVER_THRESH;
      const isBeach = !isRiver && dRiver < RIVER_THRESH + BEACH_SIZE;
      const isForest = !isRiver && !isBeach && (nForest*0.25 + nMacro*0.75 > 0.55);

      let col;
      if(isRiver){
        col = { h:WATER_H, s:WATER_S, b:WATER_B + (nMicro-0.5)*10 };
      } else if(isBeach){
        col = {
          h: BEACH_H + (nMicro-0.5)*4,
          s: BEACH_S + (nMicro-0.5)*10,
          b: BEACH_B + (nMicro-0.5)*10
        };
      } else if(isForest){
        const idx = floor(nBase * FORESTS.length);
        col = sample(FORESTS[idx], nMeso);
        col.b -= 5;
      } else {
        const idx = floor(nBase * FIELDS.length);
        col = sample(FIELDS[idx], nMeso);
        col.s += (nMicro-0.5)*15;
        col.b += (stableHash(tx,ty,start)%5);
      }

      const nUltra = noise(wx*ULTRA_GRAIN_S, wy*ULTRA_GRAIN_S);
      const rnd = stableHash(tx,ty,start) % 1000 / 1000;
      col.h += (nUltra-0.5)*6 + (rnd-0.5)*2;
      col.s += (nUltra-0.5)*20 + (rnd-0.5)*10;
      col.b += (nUltra-0.5)*20 + (rnd-0.5)*10;

      col.h = constrain(col.h,0,360);
      col.s = constrain(col.s,0,100);
      col.b = constrain(col.b,0,100);

      g.fill(col.h,col.s,col.b);
      g.rect(wx, wy-y0, TILE_SIZE, TILE_SIZE);
    }
  }
}
