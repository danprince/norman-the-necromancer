import { randomElement } from "./helpers";

function freq(step: number): number {
  // fn = f0 * a^n where:
  // f0 = the frequency of one fixed note which must be defined. A common choice is setting the A above middle C (A4) at f0 = 440 Hz. 
  // n = the number of half steps away from the fixed note you are. If you are at a higher note, n is positive. If you are on a lower note, n is negative.
  // fn = the frequency of the note n half steps away.
  // a = (2)1/12 = the twelth root of 2 = the number which when multiplied by itself 12 times equals 2 = 1.059463094359...
  return 440 * Math.pow(Math.pow(2, 1/12), step);
}

let ctx = new AudioContext();

// Rest
const __ = -24000;

// Note lengths
const W = 1; // Whole
const H = 2; // Half
const Q = 4; // Quarter
const E = 8; // Eighth
const S = 16; // Sixteenth

// Notes
const A3 = -12;
const Bb3 = -11;
const B3 = -10;
const C3 = -9;
const Db3 = -8;
const D3 = -7;
const Eb3 = -6;
const E3 = -5;
const F3 = -4;
const Gb3 = -3;
const G3 = -2;
const Ab4 = -1;
const A4 = 0;
const Bb4 = 1;
const B4 = 2;
const C4 = 3;
const Db4 = 4;
const D4 = 5;
const Eb4 = 6;
const E4 = 7;
const F4 = 8;
const Gb4 = 9;
const G4 = 10;
const Ab5 = 11;
const A5 = 12;
const Bb5 = 13;
const B5 = 14;
const C5 = 15;
const Db5 = 16;
const D5 = 17;
const Eb5 = 18;
const E5 = 19;
const F5 = 20;
const Gb5 = 21;
const G5 = 22;

// Waves
const ORGAN = [-0.8, 1, 0.8, 0.8, -0.8, -0.8, -1];

// Tempo
export const BPM = 240;

const A_HARMONIC_MINOR = [
  A3, B3, C3, D3, F3, E3, Ab4, A4,
  A4, B4, C4, D4, F4, E4, Ab5, A5,
];

let masterGain = new GainNode(ctx, { gain: 0 });
masterGain.connect(ctx.destination);

function createReverb(duration = 3, decay = 2) {
  let convolver = new ConvolverNode(ctx, {});

  let rate = ctx.sampleRate;
  let length = rate * duration;
  let impulse = ctx.createBuffer(2, length, rate);
  let left = impulse.getChannelData(0)
  let right = impulse.getChannelData(1)

  for (let i = 0; i < length; i++) {
    left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }

  convolver.buffer = impulse;

  return convolver;
}

interface Synth {
  volume: GainNode,
  gain: GainNode;
  osc: OscillatorNode;
  filter: BiquadFilterNode;
  play(time: number, frequency: number, duration: number): void;
  start(): void;
  enter(): void;
  exit(): void;
}

function Synth(): Synth {
  let volume = new GainNode(ctx, { gain: 1 });
  volume.connect(masterGain);
  let gain = new GainNode(ctx, { gain: 0 });
  gain.connect(volume);
  let filter = new BiquadFilterNode(ctx, {
    type: "lowpass",
    frequency: 500,
  });
  filter.connect(gain);
  let osc = new OscillatorNode(ctx);
  osc.connect(filter);
  return {
    gain,
    osc,
    filter,
    volume,
    play(time, frequency) {
      gain.gain.setValueAtTime(0.2, time);
      osc.frequency.setValueAtTime(frequency, time);
    },
    start() {
      this.osc.start();
      this.enter();
    },
    enter() {
      volume.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1);
    },
    exit() {
      volume.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
    },
  };
}

function Organ(duration = 1, decay = 1): Synth {
  let synth = Synth();
  synth.osc.setPeriodicWave(ctx.createPeriodicWave(ORGAN, ORGAN));
  let reverb = createReverb(duration, decay);
  reverb.connect(synth.gain);
  synth.filter.connect(reverb);
  synth.filter.type = "highpass";
  synth.filter.frequency.value = 200;
  return synth;
}

function Kick(): Synth {
  let synth = Synth();
  synth.filter.type = "lowpass";
  synth.filter.frequency.value = 80;
  synth.osc.frequency.value = 150;
  synth.play = time => {
    synth.osc.frequency.setValueAtTime(150, time);
    synth.gain.gain.setValueAtTime(1, time);
    synth.filter.frequency.setValueAtTime(80, time);
    synth.osc.frequency.exponentialRampToValueAtTime(0.001, time + 0.5);
    synth.gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    synth.filter.frequency.linearRampToValueAtTime(0.001, time + 0.5);
  };
  return synth;
}

function Lead(): Synth {
  let synth = Synth();
  let convolver = createReverb(3, 1);
  convolver.connect(synth.gain);
  synth.filter.connect(convolver);
  synth.osc.type = "sawtooth";
  synth.play = (time, frequency) => {
    synth.osc.frequency.setValueAtTime(frequency, time);
    synth.gain.gain.setValueAtTime(0.25, time);
    synth.gain.gain.setTargetAtTime(0, time + 0.05, 0.2);
  };
  return synth;
}

function sequence(pattern: number[], retune: number = 0, synth: Synth) {
  let time = ctx.currentTime;

  function loop() {
    let looper = new OscillatorNode(ctx);
    looper.start(time);
    for (let i = 0; i < pattern.length; i += 2) {
      let note = pattern[i];
      let hold = 60 / BPM * 1 / (pattern[i + 1] / 4);
      let hz = freq(note + retune);
      synth.play(time, hz, hold);
      time += hold;
    }
    looper.stop(time);
    looper.onended = () => {
      loop();
    }
  }

  loop();
}

let init = false;

function createPattern(
  beats = 4,
  lengths = [W, H, Q, E],
  notes = A_HARMONIC_MINOR,
) {
  let time = beats;
  let pattern = [];

  while (time > 0) {
    let length = randomElement(lengths);
    let note = randomElement(notes);
    let duration = 1 / length;
    if (time - duration < 0) continue;
    time -= duration;
    pattern.push(note, length);
  }
  return pattern;
}

// prettier-ignore
const BASS_MELODY = [2,4,5,8,-12,8,-1,4,-12,4,-10,8,-4,4,-4,8,0,4,2,4,-9,4,12,4,12,8,12,8,0,8,12,4,3,8,5,4,-12,4,-12,4,2,4,5,8,-12,8,-1,4,-12,4,-10,8,-4,4,-4,8,0,4,2,4,-9,4,12,4,12,8,12,8,0,8,12,4,3,8,5,4,-12,4,-12,4,2,4,5,8,-12,8,-1,4,-12,4,-10,8,-4,4,-4,8,0,4,2,4,-9,4,12,4,12,8,12,8,0,8,12,4,3,8,5,4,-12,4,-12,4,12,4,-4,8,2,8,-1,4,-9,8,-7,4,-10,4,-7,4,7,4,-1,4,-7,4,-4,8,-5,8,2,4,-5,8,-4,4,-12,4,-1,4,2,4,2,4,5,8,-12,8,-1,4,-12,4,-10,8,-4,4,-4,8,0,4,2,4,-9,4,12,4,12,8,12,8,0,8,12,4,3,8,5,4,-12,4,-12,4,2,4,5,8,-12,8,-1,4,-12,4,-10,8,-4,4,-4,8,0,4,2,4,-9,4,12,4,12,8,12,8,0,8,12,4,3,8,5,4,-12,4,-12,4,2,4,5,8,-12,8,-1,4,-12,4,-10,8,-4,4,-4,8,0,4,2,4,-9,4,12,4,12,8,12,8,0,8,12,4,3,8,5,4,-12,4,-12,4,-5,8,-5,8,-12,8,-5,4,0,4,-5,4,-5,8,-5,4,-12,4,-12,4,-12,8,0,8,0,8,0,4,-5,8,-12,8,0,8,-12,4,0,8,-5,4,0,4,-12,8];

function createBassline() {
  let a = createPattern(4, [E, Q], [A_HARMONIC_MINOR, A3, A3, A3, A3, A3].flat());
  let b = createPattern(4, [E, Q], A_HARMONIC_MINOR);
  return [a, a, a, b].flat();
  //return BASS_MELODY;
}

function createLeadLine() {
  let a = [A4, E, __, E, A4, E, __, E];
  let b = [E4, Q, A4, E, E4, E, __, E, A4, E, E4, E, __, E];
  let c = [__, H];
  return [a, c, a, c, a, c, b].flat();
}

export let synths = {
  kick: Kick(),
  ambientOrgan: Organ(6, 1),
  lead: Organ(2, 0.5),
  bass: Lead(),
  kingsOrgan1: Organ(3, 0.25),
  kingsOrgan2: Organ(3, 1),
  kingsBass: Organ(),
};

export function play() {
  if (init) return;
  init = true;

  let kingsBass = [
    A4, W / 2,
    B4, W / 2,
    C4, W / 2,
    B4, W / 2,
  ];

  sequence([A4, H, __, H], -36, synths.kick);
  sequence([A4, E, A3, E], -36, synths.ambientOrgan);
  sequence(createLeadLine(), -12, synths.lead);
  sequence(createBassline(), -24, synths.bass);

  {
    // King's Theme
    let p1 = [A4, H, B4, H, C4, H, B4, H];
    let p2 = [A4, H, B4, H, C4, H, D4, H];
    let p = [p1, p1, p1, p2].flat();
    sequence(p, 0, synths.kingsOrgan1);
    sequence(p, -12, synths.kingsOrgan2);
    sequence(kingsBass, -36, synths.kingsBass);
  }

  let t = ctx.currentTime;
  masterGain.gain.linearRampToValueAtTime(0.5, t + 5);
  useLevelSynths();
}

let normalLevelSynths: Synth[] = [synths.kick, synths.bass, synths.lead];
let bossLevelSynths: Synth[] = [synths.kingsBass, synths.kingsOrgan1, synths.kingsOrgan2];

export function useShopSynths() {
  synths.kick.exit();
  synths.lead.exit();
}

export function useLevelSynths() {
  if (game.level === 0) synths.ambientOrgan.start();
  if (game.level === 1) synths.bass.start();
  if (game.level === 2) synths.kick.start();
  if (game.level === 4) synths.lead.start();
  if (game.level === 9) {
    for (let synth of normalLevelSynths) synth.exit()
    for (let synth of bossLevelSynths) synth.start()
  } else {
    for (let synth of normalLevelSynths) synth.enter();
  }
}
