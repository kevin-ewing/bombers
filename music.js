// music.js
// Fleet‑of‑planes ambience with heroic progression that reacts to GameState.sceneScale
// -------------------------------- CONFIGURABLE PARAMETERS --------------------------------

/* Transport -------------------------------------------------------- */
const BPM                   = 64;
const FADE_IN_TIME_SEC      = 90;
const MASTER_START_DB       = -40;
const MASTER_TARGET_DB      = -20;

/* Hum Layer -------------------------------------------------------- */
const HUM_BASE_NOTE         = 'D1';
const HUM_OSC_TYPE          = 'square';
const HUM_COUNT             = 4;
const HUM_DETUNE_RANGE_CENT = 12;
const HUM_GAIN_LEVEL        = 0.35;
const HUM_FILTER_CUTOFF_HZ  = 800;
const HUM_START_SPREAD_SEC  = 2;

/* Noise Layer ------------------------------------------------------ */
const NOISE_COLOR           = 'brown';
const NOISE_TARGET_DB       = -30;
const NOISE_FADE_TIME_SEC   = 45;

/* Drone Chords ----------------------------------------------------- */
const CHORD_ATTACK_SEC      = 1;
const CHORD_RELEASE_SEC     = 0.05;
const CHORD_FILTER_CUTOFF_HZ= 1200;
const CHORD_DURATION_MEAS   = '4m';
const CHORD_START_DELAY_MEAS= '1m';
const CHORD_PROGRESSIONS    = [
  ['D2', 'A2', 'F#3'],
  ['G2', 'D3', 'B3'],
  ['A2', 'E3', 'C#4'],
  ['D2', 'A2', 'F#3'],
];

/* Bass Line -------------------------------------------------------- */
const BASS_NOTES            = ['D0', 'G0', 'A0', 'D0'];
const BASS_ATTACK_SEC       = 0.05;
const BASS_RELEASE_SEC      = 0.5;
const BASS_FILTER_CUTOFF_HZ = 600;
const BASS_LOOP_INTERVAL    = '1m';
const BASS_START_DELAY_MEAS = '16m';

/* Scene‑scale interaction ----------------------------------------- */
const SCENE_SCALE_MIN           = 0.15;
const SCENE_SCALE_MAX           = 0.5;
const PAN_RANGE                 = 1;
const MASTER_FILTER_MIN_HZ      = 1500;
const MASTER_FILTER_MAX_HZ      = 4000;
const HUM_GAIN_FACTOR_MIN       = 0.6;      // relative to HUM_GAIN_LEVEL
const HUM_GAIN_FACTOR_MAX       = 1.2;
const DRONE_VOL_MIN_DB          = -18;
const DRONE_VOL_MAX_DB          = 0;
const BASS_VOL_MIN_DB           = -18;
const BASS_VOL_MAX_DB           = 0;
const LOG_INTERVAL_MS           = 500;
const SCENE_SMOOTH_FACTOR       = 0.12;     // 0‑1 lerp factor per tick

// -----------------------------------------------------------------------------------------

import * as Tone from 'https://cdn.skypack.dev/tone';
import { GameState } from './state.js';

/* Master chain ---------------------------------------------------- */
const masterVol    = new Tone.Volume(MASTER_START_DB);
const masterFilter = new Tone.Filter(3000, 'lowpass');
const masterPanner = new Tone.Panner(0);
masterVol.connect(masterFilter).connect(masterPanner).toDestination();

/* Hum layer ------------------------------------------------------- */
const humFilter = new Tone.Filter(HUM_FILTER_CUTOFF_HZ, 'lowpass').connect(masterVol);
const humGain   = new Tone.Gain(HUM_GAIN_LEVEL).connect(humFilter);
for (let i = 0; i < HUM_COUNT; i++) {
  const osc = new Tone.Oscillator(HUM_BASE_NOTE, HUM_OSC_TYPE);
  osc.detune.value = (Math.random() - 0.5) * HUM_DETUNE_RANGE_CENT;
  osc.connect(humGain).start(Tone.now() + Math.random() * HUM_START_SPREAD_SEC);
}

/* Noise layer ----------------------------------------------------- */
const noise = new Tone.Noise(NOISE_COLOR)
  .connect(new Tone.Filter(400, 'lowpass').connect(masterVol))
  .start();
noise.volume.value = -Infinity;
noise.volume.linearRampToValueAtTime(NOISE_TARGET_DB, Tone.now() + NOISE_FADE_TIME_SEC);

/* Drone chords ---------------------------------------------------- */
const drone = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'sawtooth' },
  envelope: { attack: CHORD_ATTACK_SEC, decay: 0.5, sustain: 1, release: CHORD_RELEASE_SEC },
}).connect(new Tone.Filter(CHORD_FILTER_CUTOFF_HZ, 'lowpass').connect(masterVol));

/* Bass ------------------------------------------------------------ */
const bass = new Tone.MonoSynth({
  oscillator: { type: 'triangle' },
  filter: { type: 'lowpass', frequency: BASS_FILTER_CUTOFF_HZ, rolloff: -24, Q: 1 },
  envelope: { attack: BASS_ATTACK_SEC, decay: 0.6, sustain: 0.8, release: BASS_RELEASE_SEC },
}).connect(masterVol);

/* Sequencing ------------------------------------------------------ */
new Tone.Sequence(
  (time, chord) => drone.triggerAttackRelease(chord, CHORD_DURATION_MEAS, time),
  CHORD_PROGRESSIONS,
  CHORD_DURATION_MEAS
).start(CHORD_START_DELAY_MEAS);

const bassLoop = new Tone.Loop(
  (time) =>
    bass.triggerAttackRelease(
      BASS_NOTES[bassLoop.iterations % BASS_NOTES.length],
      BASS_LOOP_INTERVAL,
      time
    ),
  BASS_LOOP_INTERVAL
).start(BASS_START_DELAY_MEAS);

/* Transport ------------------------------------------------------- */
Tone.Transport.bpm.value = BPM;

/* Scene‑scale smoothing & mapping -------------------------------- */
let smoothedSceneScale = GameState.sceneScale ?? SCENE_SCALE_MIN;

function applySceneScale(scale = SCENE_SCALE_MIN) {
  const clamped = Math.min(Math.max(scale, SCENE_SCALE_MIN), SCENE_SCALE_MAX);
  const norm    = (clamped - SCENE_SCALE_MIN) / (SCENE_SCALE_MAX - SCENE_SCALE_MIN);

  masterPanner.pan.value = -PAN_RANGE / 2 + norm * PAN_RANGE;
  masterFilter.frequency.value =
    MASTER_FILTER_MIN_HZ + norm * (MASTER_FILTER_MAX_HZ - MASTER_FILTER_MIN_HZ);

  humGain.gain.value =
    HUM_GAIN_LEVEL * (HUM_GAIN_FACTOR_MIN + norm * (HUM_GAIN_FACTOR_MAX - HUM_GAIN_FACTOR_MIN));

  drone.volume.value = DRONE_VOL_MIN_DB + norm * (DRONE_VOL_MAX_DB - DRONE_VOL_MIN_DB);
  bass.volume.value  = BASS_VOL_MIN_DB  + norm * (BASS_VOL_MAX_DB  - BASS_VOL_MIN_DB);
}

setInterval(() => {
  const target = GameState.sceneScale ?? SCENE_SCALE_MIN;
  smoothedSceneScale += (target - smoothedSceneScale) * SCENE_SMOOTH_FACTOR;
  applySceneScale(smoothedSceneScale);
  console.log('GameState.sceneScale (smoothed):', smoothedSceneScale.toFixed(3));
}, LOG_INTERVAL_MS);

/* Public API ------------------------------------------------------ */
export async function startMusic() {
  if (Tone.context.state !== 'running') await Tone.start();
  if (Tone.Transport.state !== 'started') {
    Tone.Transport.start();
    masterVol.volume.linearRampToValueAtTime(
      MASTER_TARGET_DB,
      Tone.now() + FADE_IN_TIME_SEC
    );
  }
}

export function stopMusic() {
  Tone.Transport.stop();
}

/* Autostart ------------------------------------------------------- */
['pointerdown', 'touchstart', 'keydown', 'mousedown'].forEach((evt) =>
  window.addEventListener(evt, () => startMusic(), { once: true })
);

/* Initial mapping ------------------------------------------------- */
applySceneScale(smoothedSceneScale);
