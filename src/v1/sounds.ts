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
const BPM = 140;

let masterGain = new GainNode(ctx, { gain: 0.2 });
masterGain.connect(ctx.destination);

let filter = new BiquadFilterNode(ctx, {
  type: "lowpass",
  frequency: 0,
});

filter.connect(ctx.destination);

export function explosion() {
  // Generate noise
  let bufferSize = ctx.sampleRate * 3;
  let buffer = new AudioBuffer({
    length: bufferSize,
    sampleRate: ctx.sampleRate,
  });
  let data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  let noise = new AudioBufferSourceNode(ctx, { buffer });

  let f1 = new BiquadFilterNode(ctx, {
    type: "lowpass",
    frequency: 600,
  });
  f1.frequency.linearRampToValueAtTime(0.00001, 0.8);
  f1.connect(masterGain);

  let f2 = new BiquadFilterNode(ctx, {
    type: "peaking",
    frequency: 0,
  });
  f2.connect(masterGain);

  let gain = new GainNode(ctx, { gain: 1.5 });
  gain.connect(f1);
  gain.connect(f2);

  let osc = new OscillatorNode(ctx, { frequency: 40 });
  osc.connect(gain);
  osc.frequency.linearRampToValueAtTime(0, 0.8);
  osc.start();

  noise.connect(gain);
  noise.start();
}

function sequence(pattern: number[], retune: number = 0) {
  let osc = new OscillatorNode(ctx, {
    periodicWave: ctx.createPeriodicWave(ORGAN, ORGAN),
    frequency: __,
  });
  let gainNode = new GainNode(ctx, { gain: 0.4 });
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
  osc.connect(gainNode);
  gainNode.connect(filter);
}

let pattern = [
  A4, Q,
  B4, Q,
  B4, Q,
  B4, Q,
  B4, Q,
];

document.body.addEventListener("click", () => sequence(pattern, 0));
export {}
