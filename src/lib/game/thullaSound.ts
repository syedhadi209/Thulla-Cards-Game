/** One short descending sting. Skips quietly if the browser blocks audio. */
export async function playThullaSting() {
  const AudioCtx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  let ctx: AudioContext | null = null;
  try {
    ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    if (ctx.state === "suspended") {
      await ctx.close();
      return;
    }

    const now = ctx.currentTime;
    const notes = [392, 349, 311, 247];
    notes.forEach((freq, i) => {
      const start = now + i * 0.16;
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.09, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      osc.connect(gain);
      gain.connect(ctx!.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });

    window.setTimeout(() => {
      void ctx?.close();
    }, 1100);
  } catch {
    void ctx?.close();
  }
}
