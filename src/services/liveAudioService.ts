/**
 * Gemini 3.8 Live API Client Service (Real-time Voice Conversations)
 * Compliant with @google/genai Live API specification:
 * - 16kHz input audio (PCM 16-bit little-endian)
 * - 24kHz output audio scheduled playback for gapless streaming
 * - Interruption handling & source node tracking
 */

export interface LiveVoiceCallbacks {
  onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'unavailable') => void;
  onAudioLevel?: (inputLevel: number, outputLevel: number) => void;
  onInterrupted?: () => void;
  onError?: (error: Error) => void;
  onTranscription?: (text: string, isModel: boolean, isTurnComplete: boolean) => void;
}

export class LiveVoiceService {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private mediaStream: MediaStream | null = null;
  private isConnected = false;
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private callbacks: LiveVoiceCallbacks = {};
  private status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'unavailable' = 'disconnected';

  public async start(callbacks: LiveVoiceCallbacks) {
    this.callbacks = callbacks;
    this.setStatus('connecting');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {};

      this.ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.status === 'connected') {
            try {
              await this.startAudioStream();
              this.isConnected = true;
              this.setStatus('connected');
            } catch (err) {
              this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
              this.setStatus('error');
              this.cleanupAudio();
              this.ws?.close();
            }
            return;
          }
          if (msg.status === 'unavailable') {
            this.setStatus('unavailable');
            this.callbacks.onError?.(new Error(msg.message || 'Live Voice is unavailable.'));
            this.ws?.close();
            return;
          }
          if (msg.audio) {
            this.playAudioChunk(msg.audio);
          }
          if (msg.transcription) {
            this.callbacks.onTranscription?.(
              msg.transcription,
              msg.role === 'model',
              Boolean(msg.turnComplete)
            );
          }
          if (msg.interrupted) {
            this.handleInterruption();
          }
        } catch (e) {
          console.warn('Error parsing Live message:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Live WebSocket error:', err);
        this.callbacks.onError?.(new Error('WebSocket connection error'));
        this.setStatus('error');
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (this.status !== 'unavailable' && this.status !== 'error') {
          this.setStatus('disconnected');
        }
        this.cleanupAudio();
      };
    } catch (e: any) {
      this.callbacks.onError?.(e);
      this.setStatus('error');
    }
  }

  private async startAudioStream() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone capture is not supported in this browser.');
    }
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) throw new Error('Web Audio is not supported in this browser.');

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.inputAudioCtx = new AudioCtx({ sampleRate: 16000 });
    this.outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
    this.nextStartTime = this.outputAudioCtx.currentTime;

    const source = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);
    this.scriptProcessor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputAudioCtx.destination);

    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.isConnected || this.ws?.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      const level = Math.min(100, Math.round(rms * 180));
      this.callbacks.onAudioLevel?.(level, 0);

      const pcmBuffer = this.floatTo16BitPCM(inputData);
      const base64Audio = this.arrayBufferToBase64(pcmBuffer);
      this.ws?.send(JSON.stringify({ audio: base64Audio }));
    };
  }

  private setStatus(status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'unavailable') {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  private playAudioChunk(base64Data: string) {
    if (!this.outputAudioCtx) return;

    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit PCM raw chunk (24kHz mono) to AudioBuffer
      const int16 = new Int16Array(bytes.buffer);
      const audioBuffer = this.outputAudioCtx.createBuffer(1, int16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < int16.length; i++) {
        channelData[i] = int16[i] / 32768.0;
      }

      const sourceNode = this.outputAudioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(this.outputAudioCtx.destination);

      // Schedule gapless continuous playback
      const currentTime = this.outputAudioCtx.currentTime;
      const startTime = Math.max(currentTime, this.nextStartTime);
      sourceNode.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;

      this.activeSources.push(sourceNode);
      sourceNode.onended = () => {
        this.activeSources = this.activeSources.filter((s) => s !== sourceNode);
      };
    } catch (e) {
      console.warn('Playback chunk error:', e);
    }
  }

  private handleInterruption() {
    // User spoke while model was responding; stop all buffered playback
    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch {}
    });
    this.activeSources = [];
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }
    this.callbacks.onInterrupted?.();
  }

  public sendTextMessage(text: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ text }));
    }
  }

  public triggerVoiceResponseSimulation() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ simulateVoiceResponse: true }));
    }
  }

  public stop() {
    this.isConnected = false;
    this.handleInterruption();
    this.cleanupAudio();

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.setStatus('disconnected');
  }

  private cleanupAudio() {
    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.disconnect();
      } catch {}
      this.scriptProcessor = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.mediaStream = null;
    }

    if (this.inputAudioCtx && this.inputAudioCtx.state !== 'closed') {
      try {
        this.inputAudioCtx.close();
      } catch {}
      this.inputAudioCtx = null;
    }

    if (this.outputAudioCtx && this.outputAudioCtx.state !== 'closed') {
      try {
        this.outputAudioCtx.close();
      } catch {}
      this.outputAudioCtx = null;
    }
  }

  private floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const liveVoiceService = new LiveVoiceService();
