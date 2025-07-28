import { AudioManager } from '@/services/AudioManager';
import { Song } from '@/types/game';

export class EnhancedAudioManager extends AudioManager {
  private gamepadsSupported: boolean = false;
  private gamepadConnected: boolean = false;

  constructor() {
    super();
    this.initializeGamepadSupport();
  }

  private initializeGamepadSupport() {
    // Check if gamepad API is supported
    if (typeof window !== 'undefined' && 'getGamepads' in navigator) {
      this.gamepadsSupported = true;
      
      // Listen for gamepad connection events
      window.addEventListener('gamepadconnected', (e) => {
        console.log('🎮 Gamepad connected:', e.gamepad.id);
        this.gamepadConnected = true;
      });

      window.addEventListener('gamepaddisconnected', (e) => {
        console.log('🎮 Gamepad disconnected:', e.gamepad.id);
        this.gamepadConnected = false;
      });
    }
  }

  public playSong(song: Song) {
    super.playSong(song);
  }

  public stopSong() {
    super.stopSong();
  }

  public setVolume(volume: number) {
    super.setVolume(volume);
  }

  public toggleMute() {
    super.toggleMute();
  }

  public seekTo(time: number) {
    super.seekTo(time);
  }

  public isPlaying(): boolean {
    return super.isPlaying();
  }

  public getCurrentTime(): number {
    return super.getCurrentTime();
  }

  public getDuration(): number {
    return super.getDuration();
  }

  public changePlaybackRate(rate: number) {
    super.changePlaybackRate(rate);
  }

  public isMuted(): boolean {
    return super.isMuted();
  }

  public setMuted(muted: boolean) {
    super.setMuted(muted);
  }

  public getVolume(): number {
    return super.getVolume();
  }

  public preloadSong(song: Song) {
    super.preloadSong(song);
  }

  public clearPreloadedSong(song: Song) {
    super.clearPreloadedSong(song);
  }

  public setCrossfadeDuration(duration: number) {
    super.setCrossfadeDuration(duration);
  }

  public applyCrossfade(song: Song) {
    super.applyCrossfade(song);
  }

  public isCrossfading(): boolean {
    return super.isCrossfading();
  }

  public setDistortion(amount: number) {
    super.setDistortion(amount);
  }

  public setReverb(amount: number) {
    super.setReverb(amount);
  }

  public setDelay(amount: number) {
    super.setDelay(amount);
  }

  public setPanning(amount: number) {
    super.setPanning(amount);
  }

  public setEQ(band: number, gain: number) {
    super.setEQ(band, gain);
  }

  public resetEQ() {
    super.resetEQ();
  }

  public analyzeFrequencyData() {
    super.analyzeFrequencyData();
  }

  public getFrequencyData(): Uint8Array {
    return super.getFrequencyData();
  }

  public analyzeWaveformData() {
    super.analyzeWaveformData();
  }

  public getWaveformData(): Float32Array {
    return super.getWaveformData();
  }

  public connectSourceToDestination() {
    super.connectSourceToDestination();
  }

  public disconnectSourceFromDestination() {
    super.disconnectSourceFromDestination();
  }

  public fadeOut(duration: number) {
    super.fadeOut(duration);
  }

  public fadeIn(duration: number) {
    super.fadeIn(duration);
  }

  public pauseSong() {
    super.pauseSong();
  }

  public resumeSong() {
    super.resumeSong();
  }

  public attachMediaStream(stream: MediaStream) {
    super.attachMediaStream(stream);
  }

  public detachMediaStream() {
    super.detachMediaStream();
  }

  public applyFilter(type: BiquadFilterType, frequency: number, gain: number, Q: number) {
    super.applyFilter(type, frequency, gain, Q);
  }

  public removeFilter() {
    super.removeFilter();
  }

  public setFilterFrequency(frequency: number) {
    super.setFilterFrequency(frequency);
  }

  public setFilterGain(gain: number) {
    super.setFilterGain(gain);
  }

  public setFilterQ(Q: number) {
    super.setFilterQ(Q);
  }

  public getFilterFrequency(): number {
    return super.getFilterFrequency();
  }

  public getFilterGain(): number {
    return super.getFilterGain();
  }

  public getFilterQ(): number {
    return super.getFilterQ();
  }

  public applyConvolver(buffer: AudioBuffer) {
    super.applyConvolver(buffer);
  }

  public removeConvolver() {
    super.removeConvolver();
  }

  public setConvolverBuffer(buffer: AudioBuffer) {
    super.setConvolverBuffer(buffer);
  }

  public getConvolverBuffer(): AudioBuffer | null {
    return super.getConvolverBuffer();
  }

  public setConvolverMix(mix: number) {
    super.setConvolverMix(mix);
  }

  public getConvolverMix(): number {
    return super.getConvolverMix();
  }

  public applyCompressor(threshold: number, knee: number, ratio: number, attack: number, release: number) {
    super.applyCompressor(threshold, knee, ratio, attack, release);
  }

  public removeCompressor() {
    super.removeCompressor();
  }

  public setCompressorThreshold(threshold: number) {
    super.setCompressorThreshold(threshold);
  }

  public setCompressorKnee(knee: number) {
    super.setCompressorKnee(knee);
  }

  public setCompressorRatio(ratio: number) {
    super.setCompressorRatio(ratio);
  }

  public setCompressorAttack(attack: number) {
    super.setCompressorAttack(attack);
  }

  public setCompressorRelease(release: number) {
    super.setCompressorRelease(release);
  }

  public getCompressorThreshold(): number {
    return super.getCompressorThreshold();
  }

  public getCompressorKnee(): number {
    return super.getCompressorKnee();
  }

  public getCompressorRatio(): number {
    return super.getCompressorRatio();
  }

  public getCompressorAttack(): number {
    return super.getCompressorAttack();
  }

  public getCompressorRelease(): number {
    return super.getCompressorRelease();
  }

  public isGamepadConnected(): boolean {
    if (!this.gamepadsSupported) return false;
    
    if (typeof window !== 'undefined' && 'getGamepads' in navigator) {
      const gamepads = (navigator as any).getGamepads();
      return gamepads && Array.from(gamepads).some((gamepad: any) => gamepad !== null);
    }
    
    return false;
  }

  public getGamepadInput() {
    if (!this.gamepadsSupported || typeof window === 'undefined') return null;
    
    if ('getGamepads' in navigator) {
      const gamepads = (navigator as any).getGamepads();
      return gamepads ? gamepads[0] : null;
    }
    
    return null;
  }
}
