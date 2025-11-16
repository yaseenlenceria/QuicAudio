export class AudioVisualizer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationId: number | null = null;

  constructor(private onUpdate: (levels: number[]) => void, private barCount: number = 16) {}

  start(stream: MediaStream): void {
    this.stop();

    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    
    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyser);

    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);

    this.animate();
  }

  private animate = (): void => {
    if (!this.analyser || !this.dataArray) return;

    this.animationId = requestAnimationFrame(this.animate);
    this.analyser.getByteFrequencyData(this.dataArray);

    const levels: number[] = [];
    const step = Math.floor(this.dataArray.length / this.barCount);

    for (let i = 0; i < this.barCount; i++) {
      const start = i * step;
      const end = start + step;
      const slice = this.dataArray.slice(start, end);
      const average = slice.reduce((a, b) => a + b, 0) / slice.length;
      levels.push(average / 255); // Normalize to 0-1
    }

    this.onUpdate(levels);
  };

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.dataArray = null;
  }

  getAverageLevel(): number {
    if (!this.dataArray) return 0;
    const average = this.dataArray.reduce((a, b) => a + b, 0) / this.dataArray.length;
    return average / 255;
  }
}
