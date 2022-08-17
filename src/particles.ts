import { drawSceneSprite, Sprite } from "./engine";

let _emitters: Emitter[] = [];
let _pool: Particle[] = [];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bounce: number;
  ttl: number;
  life: number;
  variant: number;
}

type Range = [init: number, spread: number];

function randomSpread([init, spread]: Range) {
  return init + Math.random() * spread;
}

function newParticle(): Particle {
  if (_pool.length) {
    return _pool.pop()!;
  } else {
    return {} as Particle;
  }
}

interface EmitterOptions {
  variants: Sprite[][];
  frequency: number;
  speed: Range;
  angle: Range;
  life: Range;
  bounce: Range;
  friction: number;
  gravity: number;
}

export class Emitter {
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  options: EmitterOptions;

  _clock = 0;
  _active = false;
  _particles = new Set<Particle>();
  _done = () => {};

  constructor(options: EmitterOptions) {
    _emitters.push(this);
    this.options = options;
  }

  start() {
    this._active = true;
  }

  stop() {
    this._active = false;
  }

  stopThenRemove() {
    this.stop();
    this._done = () => _emitters.splice(_emitters.indexOf(this), 1);
  }

  update(dt: number) {
    let t = dt / 1000;

    if (this._active) {
      this._clock += this.options.frequency;
      while (this._clock > 0) {
        this._clock -= 1;
        this._emit();
      }
    }

    for (let p of this._particles) {
      p.ttl -= dt;
      if (p.ttl <= 0) {
        this._particles.delete(p);
        _pool.push(p);
      } else {
        p.x += p.vx * t;
        p.y += p.vy * t;
        p.vy += this.options.gravity * t;

        if (p.y <= 0) {
          p.y = 0;
          p.vy *= -p.bounce;
          p.vx *= this.options.friction;
        }
      }
    }

    if (!this._active && this._particles.size === 0) {
      this._done();
    }
  }

  _emit() {
    let opts = this.options;
    let speed = randomSpread(opts.speed);
    let angle = randomSpread(opts.angle) + Math.PI / 2;
    let life = randomSpread(opts.life);
    let p = newParticle();
    p.life = life;
    p.ttl = life;
    p.x = randomSpread([this.x, this.width]);
    p.y = randomSpread([this.y, this.height]);
    p.bounce = randomSpread(opts.bounce);
    p.vx = speed * Math.cos(angle);
    p.vy = speed * Math.sin(angle);
    p.variant = Math.random() * opts.variants.length | 0;
    this._particles.add(p);
  }

  burst(count: number) {
    for (let i = 0; i < count; i++) {
      this._emit();
    }
  }
}

export function updateParticles(dt: number) {
  for (let e of _emitters) {
    e.update(dt);
  }

  _emitters = _emitters.filter(e => e._active || e._particles.size > 0);
}

export function drawParticles() {
  for (let e of _emitters) {
    for (let p of e._particles) {
      let variants = e.options.variants[p.variant];
      let progress = (p.life - p.ttl) / p.life;
      let sprite = variants[progress * variants.length | 0];
      drawSceneSprite(sprite, p.x, p.y);
    }
  }
}
