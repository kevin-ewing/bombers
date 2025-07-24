// bomber.js
import { PIXEL_SIZE, BOMBER_W, BOMBER_H, SCALE_A, RUMBLE_AMP, RUMBLE_FREQ } from "./constants.js";
import { GameState } from "./state.js";

const RENDER_SCALE = 0.15;          // shrink bomber graphic to original plane size

export function createBomberGraphic() {
    const g = createGraphics(BOMBER_W * PIXEL_SIZE, BOMBER_H * PIXEL_SIZE);
    g.colorMode(HSB, 360, 100, 100);
    drawBomberPixels(g);
    GameState.bomberG = g;
}

function drawBomberPixels(g) {
    const p = v => v * PIXEL_SIZE;
    g.noStroke();

    /* helpers */
    const engine = (x, y) => {
        g.fill(100, 35, 18);
        g.rect(p(x), p(y), p(20), p(20));
        g.rect(p(x + 5), p(y - 5), p(10), p(20));
        g.fill(90, 10, 60); g.rect(p(x + 5), p(y), p(10), p(20));
        g.fill(100, 45, 30); g.rect(p(x), p(y + 15), p(20), p(5));
        g.fill(100, 25, 40); g.rect(p(x + 5), p(y + 10), p(5), p(15));
        g.fill(95, 20, 50); g.rect(p(x + 10), p(y + 10), p(5), p(15));
    };
    const tail = (ox, oy) => {
        g.fill(100, 35, 18);
        g.rect(p(ox + 5), p(oy + 40), p(90), p(20));
        g.rect(p(ox), p(oy + 45), p(100), p(10));
        g.rect(p(ox + 15), p(oy + 60), p(70), p(5));
        g.rect(p(ox + 25), p(oy + 65), p(50), p(5));
        g.rect(p(ox + 15), p(oy + 35), p(70), p(5));

        g.fill(100, 45, 30);
        g.rect(p(ox + 15), p(oy + 55), p(70), p(5));
        g.rect(p(ox + 25), p(oy + 60), p(50), p(5));
        g.rect(p(ox + 5), p(oy + 45), p(90), p(10));
        g.rect(p(ox + 15), p(oy + 40), p(70), p(5));

        g.fill(100, 25, 40);
        g.rect(p(ox + 15), p(oy + 45), p(70), p(10));
        g.rect(p(ox + 25), p(oy + 40), p(50), p(5));
        g.rect(p(ox + 25), p(oy + 55), p(50), p(5));
    };

    /* wings */
    g.fill(100, 35, 18);
    g.rect(p(10), p(80), p(200), p(10));
    g.rect(p(5), p(85), p(210), p(10));
    g.rect(p(0), p(90), p(220), p(20));
    g.rect(p(5), p(105), p(210), p(10));
    g.rect(p(10), p(110), p(200), p(10));
    g.rect(p(30), p(115), p(160), p(10));
    g.rect(p(50), p(120), p(120), p(10));
    g.rect(p(70), p(125), p(80), p(10));

    g.fill(100, 45, 30);
    g.rect(p(10), p(85), p(200), p(10));
    g.rect(p(5), p(90), p(210), p(20));
    g.rect(p(10), p(105), p(200), p(10));
    g.rect(p(30), p(110), p(160), p(10));
    g.rect(p(50), p(115), p(120), p(10));
    g.rect(p(70), p(120), p(80), p(10));

    g.fill(100, 25, 40);
    g.rect(p(10), p(90), p(200), p(20));
    g.rect(p(30), p(110), p(160), p(5));

    /* engines */
    engine(30, 70); engine(60, 70); engine(140, 70); engine(170, 70);

    /* tail */
    tail(60, 160);

    /* fuselage */
    g.fill(100, 35, 18);
    g.rect(p(95), p(30), p(30), p(170));
    g.rect(p(100), p(20), p(20), p(190));
    g.rect(p(105), p(15), p(10), p(220));

    g.fill(100, 45, 30);
    g.rect(p(100), p(30), p(20), p(170));
    g.rect(p(105), p(20), p(10), p(190));

    g.fill(95, 20, 50);
    g.rect(p(115), p(30), p(5), p(170));
    g.rect(p(110), p(30), p(5), p(180));

    g.fill(100, 25, 40);
    g.rect(p(100), p(30), p(5), p(170));
    g.rect(p(105), p(30), p(5), p(180));

    /* cockpit & markings */
    g.fill(90, 10, 60);
    g.rect(p(105), p(20), p(10), p(25));
    g.rect(p(100), p(30), p(20), p(15));

    g.fill(10, 70, 70); g.rect(p(40), p(100), p(10), p(5));
    g.fill(45, 40, 85); g.rect(p(50), p(100), p(10), p(5));

    g.fill(10, 70, 70); g.rect(p(160), p(100), p(10), p(5));
    g.fill(45, 40, 85); g.rect(p(170), p(100), p(10), p(5));

    g.fill(10, 70, 70); g.rect(p(105), p(175), p(5), p(35));
    g.fill(45, 40, 85); g.rect(p(110), p(175), p(5), p(35));
}

/* world-space fleet */
GameState.bombers = [];

/* draw all bombers */
export function drawBombers() {
  /* camera zoom (world → screen) */
  const zoom = GameState.sceneScale / SCALE_A;

  /* target screen‑space vibration in pixels  */

  push();
  translate(GameState.planeX, GameState.planeY);
  scale(zoom);                               // world → screen
  translate(-GameState.planeX, -GameState.planeY);

  imageMode(CENTER);
  const w = GameState.bomberG.width  * RENDER_SCALE;
  const h = GameState.bomberG.height * RENDER_SCALE;

  let i = 0;
  for (const b of GameState.bombers) {
    /* convert desired screen‑pixel amplitude to world units (÷ zoom) */
    const t  = frameCount * RUMBLE_FREQ;
    const dx = (noise(i * 12.7, t)    - 0.5) * RUMBLE_AMP / zoom;
    const dy = (noise(i * 12.7 + 41, t) - 0.5) * RUMBLE_AMP / zoom;

    image(GameState.bomberG, b.wx + dx, b.wy + dy, w, h);
    i++;
  }
  pop();
}
