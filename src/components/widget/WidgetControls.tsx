import React from 'react';
import { SessionStatus } from '../../types/interview';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Sparkles,
  Volume2,
  AlertOctagon,
  Globe,
  Radio,
  Headphones,
} from 'lucide-react';

interface WidgetControlsProps {
  status: SessionStatus;
  audioLevel: number;
  liveVoiceAudioLevel?: number;
  liveVoiceStatus?: 'disconnected' | 'connecting' | 'connected' | 'error' | 'unavailable';
  isLiveVoiceActive?: boolean;
  useSearchGrounding?: boolean;
  voicePersona?: string;
  errorMessage: string | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSimulateQuestion: (question: string) => void;
  onToggleLiveVoice?: () => void;
  onToggleSearchGrounding?: () => void;
  onChangeVoicePersona?: (persona: any) => void;
}

const SAMPLE_INTERVIEW_QUESTIONS = [
  {
    label: 'System Design: Distributed Rate Limiter',
    question: 'How would you design a distributed rate limiter that handles 100,000 requests per second across multi-region clusters?',
  },
  {
    label: 'Architecture: Cache Invalidation & Stampedes',
    question: 'How do you prevent cache stampedes and handle stale reads in a write-heavy microservices architecture?',
  },
  {
    label: 'Coding & Algorithmic Complexity',
    question: 'How would you find the longest substring without repeating characters, and what are its time and space complexities?',
  },
  {
    label: 'Behavioral STAR: Cross-team Technical Conflict',
    question: 'Tell me about a time when you disagreed with a staff architect on a critical migration decision. How did you resolve it?',
  },
  {
    label: 'Security: Broken Object Level Auth (BOLA)',
    question: 'How do you detect and prevent Broken Object Level Authorization (BOLA) and SSRF attacks in microservice APIs?',
  },
];

export const WidgetControls: React.FC<WidgetControlsProps> = ({
  status,
  audioLevel,
  liveVoiceAudioLevel = 0,
  liveVoiceStatus = 'disconnected',
  isLiveVoiceActive = false,
  useSearchGrounding = true,
  voicePersona = 'Zephyr',
  errorMessage,
  onStart,
  onPause,
  onResume,
  onStop,
  onSimulateQuestion,
  onToggleLiveVoice,
  onToggleSearchGrounding,
  onChangeVoicePersona,
}) => {
  const isListening = status === 'listening';
  const isPaused = status === 'paused';
  const isRequesting = status === 'requesting_permission';

  return (
    <div className="p-3 border-t border-zinc-800 bg-zinc-950/80 font-sans space-y-2.5">
      {/* Error alert banner if any */}
      {errorMessage && (
        <div className="p-2 rounded bg-rose-950/50 border border-rose-800/60 text-xs text-rose-200 flex items-start gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-semibold block">Microphone Notice:</span>
            {errorMessage}
          </div>
        </div>
      )}

      {/* Feature Toggles Row: Gemini Live Voice + Google Search Grounding */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {/* Toggle 1: Gemini 3.8 Live Voice Conversations */}
        <button
          onClick={onToggleLiveVoice}
          className={`flex items-center justify-between p-1.5 px-2 rounded-lg border transition-all ${
            isLiveVoiceActive
              ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-sm shadow-purple-900/40 ring-1 ring-purple-500/30'
              : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
          title="Enable bidirectional real-time voice conversation with gemini-3.8-live"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Radio
              className={`w-3.5 h-3.5 shrink-0 ${
                isLiveVoiceActive ? 'text-purple-400 animate-pulse' : 'text-zinc-500'
              }`}
            />
            <span className="font-medium truncate">Live Voice (3.8)</span>
          </div>
          <span
            className={`text-[9px] font-mono px-1 py-0.2 rounded ${
              isLiveVoiceActive
                ? 'bg-purple-800 text-purple-100 font-bold'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {isLiveVoiceActive ? liveVoiceStatus : 'OFF'}
          </span>
        </button>

        {/* Toggle 2: Google Search Grounding */}
        <button
          onClick={onToggleSearchGrounding}
          className={`flex items-center justify-between p-1.5 px-2 rounded-lg border transition-all ${
            useSearchGrounding
              ? 'bg-blue-950/80 border-blue-500 text-blue-200 shadow-sm shadow-blue-900/40 ring-1 ring-blue-500/30'
              : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
          title="Ground intelligence with live Google Search queries via gemini-3.8-flash"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Globe
              className={`w-3.5 h-3.5 shrink-0 ${
                useSearchGrounding ? 'text-blue-400' : 'text-zinc-500'
              }`}
            />
            <span className="font-medium truncate">Search Grounding</span>
          </div>
          <span
            className={`text-[9px] font-mono px-1 py-0.2 rounded ${
              useSearchGrounding
                ? 'bg-blue-800 text-blue-100 font-bold'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {useSearchGrounding ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Voice Persona Selector if Live Voice Active */}
      {isLiveVoiceActive && (
        <div className="flex items-center justify-between p-1.5 px-2 rounded bg-purple-950/30 border border-purple-800/40 text-[10px]">
          <div className="flex items-center gap-1 text-purple-300">
            <Headphones className="w-3 h-3 text-purple-400" />
            <span>Persona Voice:</span>
          </div>
          <div className="flex items-center gap-1">
            {['Zephyr', 'Kore', 'Fenrir', 'Puck', 'Charon'].map((voice) => (
              <button
                key={voice}
                onClick={() => onChangeVoicePersona?.(voice)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  voicePersona === voice
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900'
                }`}
              >
                {voice}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Primary Audio Controls Row */}
      <div className="flex items-center justify-between gap-2">
        {!isListening && !isPaused ? (
          <button
            onClick={onStart}
            disabled={isRequesting}
            className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-950/40"
            aria-label="Start listening to interview"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isRequesting ? 'Requesting Permission...' : 'Start Listening'}</span>
          </button>
        ) : (
          <>
            {isListening ? (
              <button
                onClick={onPause}
                className="flex-1 py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                aria-label="Pause listening"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={onResume}
                className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                aria-label="Resume listening"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Resume</span>
              </button>
            )}

            <button
              onClick={onStop}
              className="py-1.5 px-3 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-rose-700/50"
              aria-label="End session and stop microphone"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>End Session</span>
            </button>
          </>
        )}
      </div>

      {/* Audio Level Meter */}
      {(isListening || isLiveVoiceActive) && (
        <div className="flex items-center gap-2 px-1">
          <Volume2 className="w-3 h-3 text-zinc-400 shrink-0" />
          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-100 rounded-full ${
                isLiveVoiceActive
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-400'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-300'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  Math.max(5, isLiveVoiceActive ? liveVoiceAudioLevel : audioLevel)
                )}%`,
              }}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-400 w-7 text-right">
            {isLiveVoiceActive ? liveVoiceAudioLevel : audioLevel}%
          </span>
        </div>
      )}

      {/* Test Interview Simulation Injector */}
      <div className="pt-2 border-t border-zinc-800/80">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
            Simulate Interview Audio
          </span>
          <span className="text-[9px] text-zinc-500 font-mono">1-Click Live Test</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {SAMPLE_INTERVIEW_QUESTIONS.map((sample, i) => (
            <button
              key={i}
              onClick={() => onSimulateQuestion(sample.question)}
              className="text-[10px] text-zinc-400 hover:text-purple-300 bg-zinc-900/70 hover:bg-zinc-800 px-2 py-1 rounded border border-zinc-800/80 transition-colors text-left truncate max-w-full"
              title={sample.question}
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
