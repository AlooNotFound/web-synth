let aud = new AudioContext();

let notes = {
    a:60, w:61, s:62, e:63, d:64, f:65, t:66, g:67, y:68, h:69, u:70, j:71, k:72
}

let voices = new Map();
let pressedKeys = new Set();

const envelopes = {
    piano: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.5,
        release: 0.4
    },
    pad: {
        attack: 0.8,
        decay: 0.5,
        sustain: 0.7,
        release: 1
    },
    organ: {
        attack: 0.01,
        decay: 0.01,
        sustain: 1,
        release: 0.1
    }
}

const waveforms = {
    sine: 'sine',
    square: 'square',
    sawtooth: 'sawtooth',
    triangle: 'triangle'
}

let waveform = waveforms.sine;

let envelope = envelopes.piano;

const vol = 0.2;

const instruments = {
    synth: {
        down, up
    },
    guitar: {
        down: guitar,
        up: guitarUp
    }
}

let instrument = instruments.synth;

function play(freq) {
    let osc = aud.createOscillator();
    let gain = aud.createGain();
    osc.frequency.value = freq;
    osc.type = waveform;
    gain.gain.value = 0.2;
    osc.connect(gain);
    gain.connect(aud.destination);
    osc.start();
    osc.stop(aud.currentTime + 0.5);
}

function down(k){
    if (aud.state === "suspended") aud.resume();
    if (voices.has(k)) return;
    let osc = aud.createOscillator();
    let gain = aud.createGain();
    osc.frequency.value = freq(notes[k]);
    osc.type = waveform;
    // gain.gain.value = 0.2;
    osc.connect(gain);
    gain.connect(aud.destination);
    const now = aud.currentTime;
    const peak = vol;
    const sustain = vol * envelope.sustain;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + envelope.attack);
    gain.gain.linearRampToValueAtTime(sustain, now + envelope.attack + envelope.decay);
    osc.start();
    voices.set(k, { osc, gain });
}

function up(k){
    let x = voices.get(k);
    if (x) {
        const now = aud.currentTime;
        x.gain.gain.cancelScheduledValues(now);
        x.gain.gain.setTargetAtTime(0, now, envelope.release);
        x.osc.stop(now + envelope.release * 4);
        voices.delete(k);
    }
    else {
        return;
    }
}

for (let k in notes) {
    let b = document.createElement('button');
    let keys = document.getElementById('synth-controls');
    b.textContent= k.toUpperCase();
    b.addEventListener('mousedown', e => mousedown(e));
    b.addEventListener('mouseup', e => mouseup(e));
    b.addEventListener('mouseleave', e => mouseleave(e));
    keys.appendChild(b);
}

mousedown = e => {
    let k = e.target.textContent.toLowerCase();
    if(notes[k] !== undefined && !e.repeat)instrument.down(k);
}

mouseup = e => {
    let k = e.target.textContent.toLowerCase();
    if(notes[k])instrument.up(k);
}

mouseleave = e => {
    let k = e.target.textContent.toLowerCase();
    instrument.up(k);
}

document.addEventListener('keydown', e => {
    let k = e.key.toLowerCase();
    if (notes[k] !== undefined && !pressedKeys.has(k)) {
        pressedKeys.add(k);
        instrument.down(k);
    }
});

document.addEventListener('keyup', e => {
    let k = e.key.toLowerCase();
    if (notes[k] !== undefined) {
        pressedKeys.delete(k);
        instrument.up(k);
    }
});

document.querySelectorAll("[data-instrument]").forEach(b => {
    b.addEventListener('click', e => {
        instrument = instruments[e.target.dataset.instrument];
    });
});

document.querySelectorAll("[data-envelope]").forEach(b => {
    b.addEventListener('click', e => {
        envelope = envelopes[e.target.dataset.envelope];
    });
});

document.querySelectorAll("[data-waveform]").forEach(b => {
    b.addEventListener('click', e => {
        waveform = waveforms[e.target.dataset.waveform];
    });
});

function freq(n){
    return 440*2**((n-69)/12);
}

function kstrong(freq, dur = 3, decay = 0.996, damp = 0.5) {
    const smplRate = aud.smplRate;
    const buffSize = Math.floor(smplRate * dur);
    const buff = aud.createBuffer(1, buffSize, smplRate);
    const data = buff.getChannelData(0);
    const N = Math.max(2, Math.round(smplRate/freq));
    const ring = new Float32Array(N);
    for (let i = 0; i< N; i++) {
        ring[i] = Math.random() * 2 -1;
    }
    let idx = 0;
    for (let i = 0; i < buffSize; i++) {
        const curr = ring[idx];
        const nxt = ring[(idx + 1) % N];
        const newVal = decay * (damp * curr + (1 - damp) * nxt);
        data[i] = curr;
        ring[idx] = newVal;
        idx = (idx + 1) % N;
    }
    return buff;
}

function guitar(k) {
    if (voices.has(k)) return;
    if (aud.state === "suspended") aud.resume();
    const f = freq(notes[k]);
    const buff = kstrong(f);
    const src = aud.createBufferSource();
    src.buffer = buff;
    const filter = aud.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 8000;
    const gain = aud.createGain();
    const now = aud.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.003);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(aud.destination);
    src.start();
    voices.set(k, { src, gain });
}

function guitarUp(k) {
  const x = voices.get(k);
  if (x) {
    const now = aud.currentTime;
    x.gain.gain.cancelScheduledValues(now);
    x.gain.gain.setValueAtTime(x.gain.gain.value, now);
    x.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    x.src.stop(now + 0.3);
    voices.delete(k);
  }
}