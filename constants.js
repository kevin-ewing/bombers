// constants.js
export const PIXEL_SIZE   = 2;

export const PLANE_W      = 100;
export const PLANE_H      = 120;

export const BOMBER_W     = 220
export const BOMBER_H     = 240

export const BASE_ACCEL   = 0.4;
export const BASE_MAXSPD  = 12;
export const FRICTION     = 0.92;
export const BOOST_MULT   = 1.8;

export const SCALE_A      = 0.15;
export const SCALE_B      = 0.5;
export const SCALE_LERP   = 0.12;

export const TILE_SIZE    = 3;
export const SCROLL_BASE  = 6;

export const BASE_S       = 0.0015;
export const FOREST_S     = 0.0024;
export const PATCH_S      = 0.0013;
export const GRAIN_S      = 0.035;
export const GRAIN_S2     = 0.085;

export const CHUNK_COUNT    = 4;
export const ROWS_PER_FRAME = 4;

export const FARMS = [
  {h1:45,h2:55,s1:35,s2:65,b1:70,b2:90}, {h1:35,h2:45,s1:15,s2:35,b1:65,b2:85},
  {h1:70,h2:95,s1:40,s2:70,b1:55,b2:75}, {h1:25,h2:35,s1:30,s2:55,b1:35,b2:55},
  {h1:50,h2:60,s1:30,s2:55,b1:60,b2:80}, {h1:80,h2:100,s1:35,s2:65,b1:50,b2:70},
  {h1:30,h2:38,s1:40,s2:60,b1:45,b2:65}
];

/* river + beach */
export const RIVER_S      = 0.00008;
export const RIVER_THRESH = 0.035;
export const WATER_H      = 200;
export const WATER_S      = 55;
export const WATER_B      = 85;
export const BEACH_SIZE   = 0.0015;
export const BEACH_H      = 48;
export const BEACH_S      = 25;
export const BEACH_B      = 92;

/* extra fine grain */
export const ULTRA_GRAIN_S = 0.25;

/* clouds */
export const CLOUD_TILE_SIZE    = 6;
export const CLOUD_CHUNK_COUNT  = 3;
export const CLOUD_ROWS_PER_FRAME = 2;
export const CLOUD_SCROLL_MULT  = 2.4;      // faster downward motion
export const CLOUD_MACRO_S      = 0.00025;
export const CLOUD_DETAIL_S     = 0.0035;
export const CLOUD_WISP_S       = 0.03;
export const CLOUD_ALPHA_MIN    = 25;
export const CLOUD_ALPHA_MAX    = 85;
export const CLOUD_COVER_S       = 0.002;  // very coarse cloud-cover field
export const CLOUD_COVER_THRESH  = 0.02;     // higher → fewer clouds

export const RUMBLE_AMP = 2
export const RUMBLE_FREQ = 0.1