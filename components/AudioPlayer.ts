// Utility to manage audio output queue
export class AudioPlayer {
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private nextStartTime: number = 0;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000
    });
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    // Ensure volume is up by default
    this.gainNode.gain.value = 1; 
  }

  setMute(isMuted: boolean) {
    if (this.gainNode) {
        // Smooth transition to avoid clicking
        const currentTime = this.audioContext.currentTime;
        this.gainNode.gain.cancelScheduledValues(currentTime);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
        this.gainNode.gain.linearRampToValueAtTime(isMuted ? 0 : 1, currentTime + 0.1);
    }
  }

  async play(base64Audio: string) {
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = this.audioContext.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    // Connect to gainNode instead of destination directly
    source.connect(this.gainNode);

    const currentTime = this.audioContext.currentTime;
    // Schedule next chunk
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }
    
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
  }
}