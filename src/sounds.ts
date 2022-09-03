import { randomElement } from "./helpers";

function freq(step: number): number {
  // fn = f0 * a^n
  // where // f0 = the frequency of one fixed note which must be defined. A common choice is setting the A above middle C (A4) at f0 = 440 Hz.  // n = the number of half steps away from the fixed note you are. If you are at a higher note, n is positive. If you are on a lower note, n is negative.
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
const BPM = 130;

const SCALE = [
  A4,
  B4,
  C4,
  D4,
  E4,
  F4,
  Ab4,
  A5,
];

let masterGain = new GainNode(ctx, { gain: 0.9 });
masterGain.connect(ctx.destination);

function whitenoise(length: number) {
  let bufferSize = ctx.sampleRate * length;
  let buffer = new AudioBuffer({
    length: bufferSize,
    sampleRate: ctx.sampleRate,
  });
  let data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  return new AudioBufferSourceNode(ctx, { buffer });
}

export function cast() {
  bell();
}

export function bell() {
  let t = ctx.currentTime;
  let gain = new GainNode(ctx, { gain: 0.2 });
  gain.connect(masterGain);

  let convolver = reverb(2, 3);
  convolver.connect(gain);

  let hz = freq(randomElement(SCALE));

  let filter = new BiquadFilterNode(ctx, {
    type: "lowpass",
    frequency: hz,
  });
  filter.connect(gain);
  filter.connect(convolver);

  let osc = new OscillatorNode(ctx, {
    frequency: filter.frequency.value,
    type: "sine",
  });
  osc.connect(filter);
  osc.start(t);
  osc.stop(t + 5);
  osc.onended = () => filter.disconnect();

  filter.frequency.exponentialRampToValueAtTime(0.001, t + 0.1);
  gain.gain.linearRampToValueAtTime(0.01, t + 5);
  return gain;
}

export function chime() {
  let t = ctx.currentTime;
  let gain = new GainNode(ctx, { gain: 0.2 });
  gain.connect(masterGain);

  let convolver = reverb(2, 3);
  convolver.connect(gain);

  let hz = freq(randomElement(SCALE));

  let filter = new BiquadFilterNode(ctx, {
    type: "lowpass",
    frequency: hz,
  });
  filter.connect(gain);
  filter.connect(convolver);

  let osc = new OscillatorNode(ctx, {
    frequency: filter.frequency.value,
    type: "sine",
  });
  osc.connect(filter);
  osc.start(t);
  osc.stop(t + 5);
  osc.onended = () => filter.disconnect();

  filter.frequency.exponentialRampToValueAtTime(0.1, t + 1);
  gain.gain.linearRampToValueAtTime(0.01, t + 5);
  return gain;
}

export function ascending() {
  let t = ctx.currentTime;
  let gain = new GainNode(ctx, { gain: 0.2 });
  gain.connect(masterGain);

  let convolver = reverb(2, 3);
  convolver.connect(gain);

  let hz = freq(randomElement(SCALE));

  let filter = new BiquadFilterNode(ctx, {
    type: "lowpass",
    frequency: hz,
  });
  filter.connect(gain);
  filter.connect(convolver);

  let osc = new OscillatorNode(ctx, {
    frequency: filter.frequency.value,
    type: "sine",
  });
  osc.connect(filter);
  osc.start();

  SCALE.forEach((step, index) => {
    osc.frequency.setValueAtTime(freq(step), t + index * E);
  });

  filter.frequency.exponentialRampToValueAtTime(0.1, t + 1);
  gain.gain.linearRampToValueAtTime(0.01, t + 5);
  return gain;
}

function reverb(duration = 3, decay = 2) {
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

function plink(node: AudioNode): AudioNode {
  let gain = new GainNode(ctx, { gain: 0.2 });
  gain.connect(masterGain);

  let convolver = reverb(3, 2);
  convolver.connect(gain);

  let hz = freq(randomElement(SCALE));

  let filter = new BiquadFilterNode(ctx, {
    type: "lowpass",
    frequency: hz,
  });
  filter.connect(gain);
  filter.connect(convolver);
  node.connect(filter);
  return gain;
}

type Effect = (node: AudioNode) => AudioNode;

function sequence(pattern: number[], retune: number = 0, effect: Effect = node => node) {
  let gainNode = new GainNode(ctx, { gain: 0.4 });

  let osc = new OscillatorNode(ctx, {
    periodicWave: ctx.createPeriodicWave(ORGAN, ORGAN),
    frequency: __,
  });
  effect(osc).connect(gainNode);

  let time = ctx.currentTime;

  function loop() {
    let looper = new OscillatorNode(ctx);
    looper.start(time);
    for (let i = 0; i < pattern.length; i += 2) {
      let note = pattern[i];
      let hold = 60 / BPM * 1 / (pattern[i + 1] / 4);
      let hz = freq(note + retune);
      osc.frequency.setValueAtTime(hz, time); time += hold;
    }
    looper.stop(time);
    looper.onended = loop;
  }

  loop();
  osc.start();
  let convolver = reverb(3, 2);
  convolver.connect(masterGain);
  gainNode.connect(convolver);
}

let init = false;

function play() {
  if (init) return;
  init = true;

  sequence([
    A4, Q,
    __, Q,
  ], -36);

  //sequence([
  //  A4, W,
  //  B4, W,
  //  C4, W,
  //  B4, W,
  //], -36);

  //sequence([
  //  A4, Q,
  //  B4, Q,
  //  C4, Q,
  //  B4, Q,
  //], -12);

  //sequence([
  //  A4, Q,
  //  B4, Q,
  //  C4, Q,
  //  B4, Q,
  //], -12, plink);

  //let p1 = [
  //  E4, E,
  //  Eb4, E,
  //  C4, E,
  //  B4, E,
  //];
  //let p2 = [
  //  Gb4, E,
  //  Eb4, E,
  //  C4, E,
  //  B4, E,
  //];
  //let p3 = [
  //  C4, E,
  //  B4, E,
  //  D4, E,
  //  C4, E,
  //];
  //let p = [...p1, ...p1, ...p1, ...p2, ...p1, ...p1, ...p1, ...p3];
  //sequence(p, -12, plink);
}

document.body.addEventListener("click", () => {
  ctx.resume();
  play();
});

export {}
