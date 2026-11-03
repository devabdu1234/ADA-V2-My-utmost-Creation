// Tiny synthesized UI sounds (no audio files needed).
let ctx = null;
function ac() {
    try {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        return ctx;
    } catch (e) {
        return null;
    }
}

function tone(freq, start, dur, gain = 0.06, type = 'sine') {
    const c = ac();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime + start);
    g.gain.setValueAtTime(0, c.currentTime + start);
    g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + dur + 0.05);
}

function noise(start, dur, gain = 0.08, f0 = 400, f1 = 4000) {
    const c = ac();
    if (!c) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(f0, c.currentTime + start);
    bp.frequency.exponentialRampToValueAtTime(f1, c.currentTime + start + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, c.currentTime + start);
    g.gain.linearRampToValueAtTime(gain, c.currentTime + start + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    src.connect(bp); bp.connect(g); g.connect(c.destination);
    src.start(c.currentTime + start);
}

function sweep(f0, f1, start, dur, gain = 0.08, type = 'sine') {
    const c = ac();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, c.currentTime + start);
    o.frequency.exponentialRampToValueAtTime(f1, c.currentTime + start + dur);
    g.gain.setValueAtTime(0, c.currentTime + start);
    g.gain.linearRampToValueAtTime(gain, c.currentTime + start + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + dur + 0.05);
}

export const sfx = {
    // boot: CRT snap + sub-bass swell rising under the whole sequence
    swell() { noise(0, 0.12, 0.12, 2000, 6000); sweep(38, 110, 0.05, 4.2, 0.14); sweep(76, 220, 0.6, 3.6, 0.04, 'triangle'); },
    // title hit: deep impact + bright chord
    hit() { sweep(90, 40, 0, 1.4, 0.22); [523.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.02 + i * 0.03, 1.6, 0.035)); noise(0, 0.5, 0.05, 300, 120); },
    // iris: rising whoosh
    whoosh() { noise(0, 0.9, 0.1, 200, 5000); sweep(200, 1200, 0, 0.8, 0.03, 'triangle'); },
    summon() { tone(220, 0, 0.35, 0.05, 'triangle'); tone(660, 0.08, 0.3, 0.04); tone(990, 0.16, 0.4, 0.03); },
    blip() { tone(1200, 0, 0.08, 0.025, 'square'); },
    chirp() { tone(1500, 0, 0.09, 0.07); tone(2100, 0.11, 0.12, 0.07); },
    alert() { tone(520, 0, 0.18, 0.07, 'sawtooth'); tone(390, 0.2, 0.25, 0.06, 'sawtooth'); },
};
