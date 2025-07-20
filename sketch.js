/* ------------------------------------------------------------------
   ✈️  Pixel-plane flying over procedural farmland / forest
   SHIFT toggles two zoom levels, but the plane now needs (about)
   the SAME TIME to cross the screen in either zoom.
   ------------------------------------------------------------------ */

/* ---------------- CONSTANTS ---------------- */
const PIXEL_SIZE = 1;         /* pixel art size shared by plane + tiles */

const PLANE_W = 100;
const PLANE_H = 120;

/* basic motion constants (for the “base” zoom) */
const BASE_ACCEL   = 0.4;
const BASE_MAXSPD  = 12;
const FRICTION     = 0.92;
const BOOST_MULT   = 1.8;

/* zoom levels toggled by SHIFT  (SCALE_A is the BASE) */
const SCALE_A   = 0.25;       /* zoomed-out  (default) */
const SCALE_B   = 0.5;        /* zoomed-in   (×2)       */
const SCALE_LERP = 0.12;

/* ground generation */
const TILE_SIZE   = 6;
const SCROLL_BASE = 0.6;
const BASE_S   = 0.0015;
const FOREST_S = 0.0024;
const PATCH_S  = 0.0013;
const DETAIL_S = 0.007;
const GRAIN_S  = 0.035;
const GRAIN_S2 = 0.085;

/* chunk streaming */
const CHUNK_COUNT     = 4;    /* 1 on-screen + 3 ahead */
const ROWS_PER_FRAME  = 4;

/* farmland palettes (HSB ranges) */
const FARMS = [
  {h1:45,h2:55,s1:35,s2:65,b1:70,b2:90},  {h1:35,h2:45,s1:15,s2:35,b1:65,b2:85},
  {h1:70,h2:95,s1:40,s2:70,b1:55,b2:75},  {h1:25,h2:35,s1:30,s2:55,b1:35,b2:55},
  {h1:50,h2:60,s1:30,s2:55,b1:60,b2:80},  {h1:80,h2:100,s1:35,s2:65,b1:50,b2:70},
  {h1:30,h2:38,s1:40,s2:60,b1:45,b2:65}
];

/* ---------------- RUNTIME STATE ---------------- */
let planeG;
let planeX, planeY, vx = 0, vy = 0;

let sceneScale = SCALE_A;     /* current zoom        */
let targetScale = SCALE_A;    /* desired zoom target */

let accel   = BASE_ACCEL;     /* current accel / max */
let maxSpd  = BASE_MAXSPD;

let chunks = [];
let cW, cH, cPW, cPH;

/* ---------------- p5.js SETUP ------------------ */
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(2);
  colorMode(HSB, 360,100,100);
  noSmooth();
  noiseDetail(6,0.5);

  createPlaneGraphic();
  initChunks();

  planeX = width / 2;
  planeY = height / 2;
}

/* ---------------- MAIN LOOP ------------------- */
function draw() {
  updateScaleAndSpeeds();

  /* ground generation + drawing */
  generateChunks();
  scrollChunks();
  renderGround();

  /* plane physics */
  handleInput();
  integrateMotion();
  constrainPlane();
  drawPlane();
}

/* ---------------- INPUT ----------------------- */
function keyPressed(){
  if(keyCode === 32)  boost();
  else if(keyCode === SHIFT) targetScale = (targetScale === SCALE_A) ? SCALE_B : SCALE_A;
}
function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  initChunks();
  constrainPlane();
}

/* ----------- SCALE + CONSISTENT CROSS-TIME ---- */
function updateScaleAndSpeeds(){
  /* smooth zoom lerp */
  sceneScale = lerp(sceneScale, targetScale, SCALE_LERP);
  if(abs(sceneScale - targetScale) < 0.0001) sceneScale = targetScale;

  /* keep “time to cross screen” ≈ constant
     speedFactor = usableTravelWidth(sceneScale) / usableTravelWidth(SCALE_A) */
  const usable = w => width - (PLANE_W * PIXEL_SIZE) * w;
  const speedFactor = usable(sceneScale) / usable(SCALE_A);

  accel  = lerp(accel,  BASE_ACCEL  * speedFactor, SCALE_LERP);
  maxSpd = lerp(maxSpd, BASE_MAXSPD * speedFactor, SCALE_LERP);
}

/* ------------- PLANE PHYSICS ------------------ */
function handleInput(){
  if(keyIsDown(65)) vx -= accel;
  if(keyIsDown(68)) vx += accel;
  if(keyIsDown(87)) vy -= accel;
  if(keyIsDown(83)) vy += accel;
}
function integrateMotion(){
  vx *= FRICTION; vy *= FRICTION;
  planeX += vx;   planeY += vy;
  limitSpeed();
}
function boost(){
  if(!vx && !vy) vx = maxSpd * 0.5;
  else { vx *= BOOST_MULT; vy *= BOOST_MULT; }
  limitSpeed();
}
function limitSpeed(){
  const m = sqrt(vx*vx + vy*vy);
  if(m > maxSpd){ vx = vx / m * maxSpd; vy = vy / m * maxSpd; }
}
function constrainPlane(){
  const hw = (planeG.width  * sceneScale)/2;
  const hh = (planeG.height * sceneScale)/2;
  planeX = constrain(planeX, hw, width  - hw);
  planeY = constrain(planeY, hh, height - hh);
}

/* ------------- PLANE GRAPHIC ------------------ */
function createPlaneGraphic(){
  planeG = createGraphics(PLANE_W*PIXEL_SIZE, PLANE_H*PIXEL_SIZE);
  planeG.colorMode(HSB,360,100,100);
  drawPlanePixels(planeG);
}
function drawPlanePixels(g){
  const p=v=>v*PIXEL_SIZE; g.noStroke();
  g.fill(100,35,18); g.rect(p(5),p(40),p(90),p(20));
  g.rect(p(0),p(45),p(100),p(10)); g.rect(p(15),p(60),p(70),p(5));
  g.rect(p(25),p(65),p(50),p(5)); g.fill(100,45,30);
  g.rect(p(15),p(55),p(70),p(5)); g.rect(p(25),p(60),p(50),p(5));
  g.rect(p(5),p(45),p(90),p(10)); g.fill(100,25,40);
  g.rect(p(15),p(45),p(70),p(10));

  g.fill(100,35,18); g.rect(p(40),p(15),p(20),p(100));
  g.rect(p(45),p(10),p(10),p(110));
  g.fill(90,10,60); g.rect(p(45),p(15),p(10),p(10));
  g.fill(95,25,40); g.rect(p(45),p(25),p(5),p(80));
  g.fill(95,20,50); g.rect(p(50),p(25),p(5),p(80));
  g.fill(0,0,75);   g.rect(p(45),p(0),p(10),p(5));
  g.fill(10,70,70); g.rect(p(45),p(55),p(5),p(10));
  g.fill(45,40,85); g.rect(p(50),p(55),p(5),p(10));
  g.fill(100,35,18); g.rect(p(30),p(95),p(40),p(20));
  g.rect(p(25),p(100),p(50),p(10));
  g.fill(100,45,32); g.rect(p(30),p(100),p(40),p(10));
  g.rect(p(45),p(105),p(10),p(10));
  g.fill(95,25,42); g.rect(p(35),p(100),p(30),p(5));
  g.rect(p(40),p(95),p(20),p(5));
  g.fill(10,70,70); g.rect(p(50),p(95),p(5),p(15));
  g.fill(45,40,85); g.rect(p(45),p(95),p(5),p(15));
}
function drawPlane(){
  push(); translate(planeX,planeY); scale(sceneScale); image(planeG,0,0); pop();
}

/* ------------- GROUND CHUNKS ------------------ */
function initChunks(){
  cW = ceil(width / TILE_SIZE);
  cH = ceil(height/ TILE_SIZE);
  cPW = cW*TILE_SIZE; cPH = cH*TILE_SIZE;
  chunks = [];
  for(let i=0;i<CHUNK_COUNT;i++){
    const y = -i*cPH;
    const g=createGraphics(cPW,cPH); g.colorMode(HSB,360,100,100);
    const ready=i<2; if(ready)generateRows(g,y,0,cH);
    chunks.push({g,worldY:y,y,rows:ready?cH:0,ready});
  }
}
function generateChunks(){
  for(let c of chunks) if(!c.ready){
    const rows=min(ROWS_PER_FRAME, cH-c.rows);
    generateRows(c.g,c.worldY,c.rows,rows);
    c.rows+=rows; if(c.rows>=cH) c.ready=true;
  }
}
function scrollChunks(){
  const dy = SCROLL_BASE * (sceneScale / SCALE_B);
  for(let c of chunks) c.y += dy;
  for(let c of chunks) if(c.y>=height){
    const top=chunks.reduce((m,k)=>k.y<m.y?k:m);
    c.worldY=top.worldY-cPH; c.y=top.y-cPH; c.g.clear(); c.rows=0;c.ready=false;
  }
}
function renderGround(){
  const zoom = sceneScale / SCALE_A;    // 1 at base
  push();
  translate(planeX,planeY);
  scale(zoom);
  translate(-planeX,-planeY);
  imageMode(CORNER);
  for(let c of chunks) image(c.g,0,c.y);
  pop();
  imageMode(CENTER);
}
function generateRows(g,y0,start,count){
  for(let r=0;r<count;r++){
    const ty=start+r; if(ty>=cH)break;
    const wy=y0+ty*TILE_SIZE;
    for(let tx=0;tx<cW;tx++){
      const wx=tx*TILE_SIZE;
      const base=noise(wx*BASE_S,wy*BASE_S);
      const forest=noise(wx*FOREST_S+37.7,wy*FOREST_S+91.3);
      const patch=noise(wx*PATCH_S+500.5,wy*PATCH_S+900.9);
      const detail=noise(wx*DETAIL_S+7.7,wy*DETAIL_S+13.3);
      const isFor=forest*0.65+base*0.35>0.63;
      const g1=noise(wx*GRAIN_S,wy*GRAIN_S);
      const g2=noise(wx*GRAIN_S2,wy*GRAIN_S2);
      const hsh=stableHash(tx,ty,start);
      let h,s,b;
      if(isFor){
        h=lerp(105,130,forest);
        s=lerp(42,72,detail)+(g1-0.5)*4+(hsh-0.5)*3;
        b=lerp(32,54,base)+(g2-0.5)*5+(hsh-0.5)*4;
      }else{
        const st=FARMS[floor(patch*FARMS.length)%FARMS.length];
        h=lerp(st.h1,st.h2,base)+(hsh-0.5)*1.2;
        s=lerp(st.s1,st.s2,detail)+(g1-0.5)*18+(hsh-0.5)*5;
        b=lerp(st.b1,st.b2,base)+(g2-0.5)*22+(hsh-0.5)*6;
      }
      g.fill(constrain(h,0,360),constrain(s,0,100),constrain(b,0,100));
      g.rect(wx,wy-y0,TILE_SIZE,TILE_SIZE);
    }
  }
}

/* ------------- UTIL -------------------------- */
const stableHash=(x,y,r)=>fract(Math.sin((x*374761+y*668265+r*2147483))*43758.5453);
const fract=v=>v-Math.floor(v);
