// terrain.js
import {
  TILE_SIZE, CHUNK_COUNT, ROWS_PER_FRAME, SCROLL_BASE,
  SCALE_A, SCALE_B,
  BASE_S, FOREST_S, PATCH_S, DETAIL_S,
  GRAIN_S, GRAIN_S2, FARMS
} from './constants.js';
import { GameState }  from './state.js';
import { stableHash } from './utils.js';

/* noise frequency tweaks */
const MACRO_S  = 0.0002;     // very broad biome blobs
const MICRO_S  = 0.0045;     // high-frequency chroma/value ripples
const FREQ_BOOST = 4;        // multiply original fine-grain fields

export function initChunks(){
  GameState.cW  = ceil(width  / TILE_SIZE);
  GameState.cH  = ceil(height / TILE_SIZE);
  GameState.cPW = GameState.cW * TILE_SIZE;
  GameState.cPH = GameState.cH * TILE_SIZE;
  GameState.chunks = [];

  for(let i = 0; i < CHUNK_COUNT; i++){
    const y = -i * GameState.cPH;
    const g = createGraphics(GameState.cPW, GameState.cPH);
    g.colorMode(HSB, 360,100,100);
    g.noStroke();
    const ready = i < 2;
    if(ready) generateRows(g, y, 0, GameState.cH);
    GameState.chunks.push({ g, worldY: y, y, rows: ready ? GameState.cH : 0, ready });
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
    c.g.clear();
    c.rows   = 0;
    c.ready  = false;
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

function generateRows(g, y0, start, count){
  for(let r = 0; r < count; r++){
    const ty = start + r;
    if(ty >= GameState.cH) break;
    const wy = y0 + ty * TILE_SIZE;

    for(let tx = 0; tx < GameState.cW; tx++){
      const wx = tx * TILE_SIZE;

      /* overlapping noise fields */
      const macro  = noise(wx*MACRO_S+123.4, wy*MACRO_S+567.8);   // 0-1
      const micro  = noise(wx*MICRO_S+901.2, wy*MICRO_S+345.6);   // 0-1

      /* boosted original fields for finer colour variety */
      const base   = noise(wx*BASE_S   *FREQ_BOOST, wy*BASE_S   *FREQ_BOOST);
      const forest = noise(wx*FOREST_S *FREQ_BOOST+37.7, wy*FOREST_S *FREQ_BOOST+91.3);
      const patch  = noise(wx*PATCH_S  *FREQ_BOOST+500.5, wy*PATCH_S  *FREQ_BOOST+900.9);

      /* biome split */
      const isFor  = forest*0.55 + macro*0.45 > 0.58;

      /* extra grain & slight randomness */
      const g1  = noise(wx*GRAIN_S *FREQ_BOOST,  wy*GRAIN_S *FREQ_BOOST);
      const g2  = noise(wx*GRAIN_S2*FREQ_BOOST,  wy*GRAIN_S2*FREQ_BOOST);
      const rnd = stableHash(tx, ty, start);

      let h,s,b;
      if(isFor){
        /* forest colour driven by forest noise + micro wiggle */
        h = lerp(105,130,forest) + (micro-0.5)*12;
        s = lerp(42,72,forest)   + (micro-0.5)*30 + (g1-0.5)*8;
        b = lerp(32,54,forest)   + (micro-0.5)*25 + (macro-0.5)*10 + (g2-0.5)*10;
      } else {
        const st = FARMS[floor(patch * FARMS.length) % FARMS.length];
        /* farm fields keyed tightly to base noise */
        h = lerp(st.h1,st.h2,base) + (micro-0.5)*8;
        s = lerp(st.s1,st.s2,base) + (micro-0.5)*40 + (g1-0.5)*12;
        b = lerp(st.b1,st.b2,base) + (micro-0.5)*30 + (macro-0.5)*12 + (g2-0.5)*12;
      }

      g.fill(constrain(h,0,360), constrain(s,0,100), constrain(b,0,100));
      g.rect(wx, wy - y0, TILE_SIZE, TILE_SIZE);
    }
  }
}
