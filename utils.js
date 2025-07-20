// utils.js
export const fract       = v => v - Math.floor(v);
export const stableHash  = (x,y,r)=>
  fract(Math.sin((x*374761 + y*668265 + r*2147483))*43758.5453);
