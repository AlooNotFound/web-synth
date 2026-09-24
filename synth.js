let aud = new AudioContext();

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