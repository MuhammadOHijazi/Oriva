let audioCtx: AudioContext | null = null;
let stopFn: (() => void) | null = null;

function getCtx(): AudioContext {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function beepOnce(ctx: AudioContext, startAt: number, freq: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(freq, startAt);
  gain.gain.setValueAtTime(0.35, startAt);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration);
}

export function playAlarmSound(durationSec = 10) {
  if (stopFn) {
    stopFn();
    stopFn = null;
  }

  const ctx = getCtx();
  const now = ctx.currentTime;

  const interval = 0.6;
  const beepDuration = 0.25;
  const beeps = Math.ceil(durationSec / interval);

  for (let i = 0; i < beeps; i++) {
    beepOnce(ctx, now + i * interval, 880, beepDuration);
    beepOnce(ctx, now + i * interval + beepDuration, 660, beepDuration * 0.7);
  }

  const timeout = window.setTimeout(() => stopAlarmSound(), durationSec * 1000 + 200);

  stopFn = () => {
    clearTimeout(timeout);
    try { ctx.close(); } catch { /* ignore */ }
    audioCtx = null;
  };
}

export function stopAlarmSound() {
  if (stopFn) {
    stopFn();
    stopFn = null;
  }
}
