import { TranscriptSegment } from '../types/interview';

export interface SpeechRecognitionCallbacks {
  onSegment: (segment: TranscriptSegment) => void;
  onError: (error: Error) => void;
  onEnd: () => void;
}

export function getSpeechSegmentId(currentSegmentId: string | null, createId: () => string): string {
  return currentSegmentId || createId();
}

export class SpeechRecognitionService {
  private recognition: any = null;
  private isListening = false;
  private currentSegmentId: string | null = null;
  private shouldRestart = false;
  private simulationTimer: any = null;

  constructor() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    }
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;

    return Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  public start(callbacks: SpeechRecognitionCallbacks): boolean {
    if (this.isListening) return true;
    this.shouldRestart = true;

    if (!this.recognition) {
      // Return false so caller knows native speech recognition is not supported in this browser
      return false;
    }

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        const text = result[0].transcript.trim();
        const isFinal = result.isFinal;
        const confidence = result[0].confidence || 0.95;

        this.currentSegmentId = getSpeechSegmentId(
          this.currentSegmentId,
          () => 'seg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
        );

        const segment: TranscriptSegment = {
          id: this.currentSegmentId,
          text,
          timestamp: Date.now(),
          isFinal,
          confidence,
          speaker: 'unknown',
        };

        callbacks.onSegment(segment);

        if (isFinal) {
          this.currentSegmentId = null;
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      // 'no-speech' is common and harmless; others should be reported
      if (event.error !== 'no-speech') {
        callbacks.onError(new Error(`Speech recognition error: ${event.error}`));
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      callbacks.onEnd();
      // Auto-restart if session is still supposed to be active
      if (this.shouldRestart) {
        try {
          this.recognition.start();
        } catch {
          // Ignore restart race condition
        }
      }
    };

    try {
      this.recognition.start();
      return true;
    } catch (e: any) {
      callbacks.onError(e);
      return false;
    }
  }

  public stop() {
    this.shouldRestart = false;
    this.isListening = false;
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }

  /**
   * Simulates realistic live interview spoken text word-by-word into the transcript feed.
   * Useful for testing and environments where no physical microphone is connected.
   */
  public simulateSpokenQuestion(
    questionText: string,
    onSegment: (segment: TranscriptSegment) => void,
    onComplete?: () => void
  ) {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
    }

    const words = questionText.split(' ');
    let currentIndex = 0;
    const segmentId = 'sim_' + Date.now();

    this.simulationTimer = setInterval(() => {
      if (currentIndex < words.length) {
        currentIndex++;
        const currentText = words.slice(0, currentIndex).join(' ');
        const isFinal = currentIndex === words.length;

        onSegment({
          id: segmentId,
          text: currentText,
          timestamp: Date.now(),
          isFinal,
          confidence: 0.98,
          speaker: 'interviewer',
        });

        if (isFinal) {
          clearInterval(this.simulationTimer);
          this.simulationTimer = null;
          onComplete?.();
        }
      } else {
        clearInterval(this.simulationTimer);
        this.simulationTimer = null;
        onComplete?.();
      }
    }, 180);
  }
}

export const speechService = new SpeechRecognitionService();
