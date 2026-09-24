let aud = new AudioContext();

let notes = {
    a:60, w:61, s:62, e:63, d:64, f:65, t:66, g:67, y:68, h:69, u:70, j:71, k:72
}

let voices = new Map();

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
    if (voices.has(k)) return;
    let osc = aud.createOscillator();
    let gain = aud.createGain();
    osc.frequency.value = freq(notes[k]);
    osc.type = 'square';
    gain.gain.value = 0.2;
    osc.connect(gain);
    gain.connect(aud.destination);
    osc.start();
    voices.set(k, { osc, gain });
}

function up(k){
    let x = voices.get(k);
    if (x) {
        x.gain.gain.setTargetAtTime(0, aud.currentTime, 0.05);
        x.osc.stop(aud.currentTime + 0.2);
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
    if(notes[k]&&!e.repeat)down(k);
});

document.addEventListener('keyup', e => {
    let k = e.key.toLowerCase();
    if(notes[k])up(k);
});

function freq(n){
    return 440*2**((n-69)/12);
}