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

let envelope = envelopes.piano;

const vol = 0.2;

function play(freq) {
    let osc = aud.createOscillator();
    let gain = aud.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
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
    osc.type = 'square';
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
    if(notes[k]&&!e.repeat)down(k);
}

mouseup = e => {
    let k = e.target.textContent.toLowerCase();
    if(notes[k])up(k);
}

mouseleave = e => {
    let k = e.target.textContent.toLowerCase();
    up(k);
}

document.addEventListener('keydown', e => {
    let k = e.key.toLowerCase();
    if (notes[k] && !pressedKeys.has(k)) {
        pressedKeys.add(k);
        down(k);
    }
});

document.addEventListener('keyup', e => {
    let k = e.key.toLowerCase();
    if (notes[k]) {
        pressedKeys.delete(k);
        up(k);
    }
});

document.querySelectorAll("[data-envelope]").forEach(b => {
    b.addEventListener('click', e => {
        envelope = envelopes[e.target.dataset.envelope];
    });
});

function freq(n){
    return 440*2**((n-69)/12);
}