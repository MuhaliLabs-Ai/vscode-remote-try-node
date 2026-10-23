import React, { useRef, useEffect, useState } from 'react';
import { TranscriptSegment } from '../../types/interview';
import { Trash2, Send, Search, HelpCircle, User, Bot } from 'lucide-react';

interface TranscriptPanelProps {
  transcript: TranscriptSegment[];
  onManualQuestionSubmit: (question: string) => void;
  onClearTranscript: () => void;
  onSelectSegment: (text: string) => void;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  transcript,
  onManualQuestionSubmit,
  onClearTranscript,
  onSelectSegment,
}) => {
  const [manualInput, setManualInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of live transcript
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onManualQuestionSubmit(manualInput.trim());
      setManualInput('');
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-col h-56 border-b border-zinc-800 bg-zinc-950/60">
      {/* Panel header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/80 bg-zinc-900/40 text-[11px]">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span className="font-semibold text-zinc-300">Live Transcript Feed</span>
          <span className="text-[10px] font-mono text-zinc-500">
            ({transcript.length} segments)
          </span>
        </div>
        {transcript.length > 0 && (
          <button
            onClick={onClearTranscript}
            className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-rose-400 transition-colors"
            title="Clear transcript"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Transcript scroll area */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 text-xs font-sans">
        {transcript.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-6 px-4">
            <p className="text-[11px] leading-relaxed">
              No audio transcribed yet. Start the session or use a test prompt below.
            </p>
            <span className="text-[10px] text-zinc-600 mt-1">
              Spoken questions are analyzed in real-time.
            </span>
          </div>
        ) : (
          transcript.map((seg) => (
            <div
              key={seg.id}
              className={`group p-2 rounded transition-colors ${
                seg.isFinal ? 'bg-zinc-900/50' : 'bg-zinc-900/20 border border-dashed border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-purple-400">
                    {seg.speaker === 'candidate'
                      ? 'Candidate'
                      : seg.speaker === 'assistant'
                        ? 'Applebee'
                        : seg.speaker === 'interviewer'
                          ? 'Interviewer'
                          : 'Speaker (unidentified)'}
                  </span>
                  <span>•</span>
                  <span className="font-mono">{formatTime(seg.timestamp)}</span>
                  {!seg.isFinal && (
                    <span className="text-amber-400 text-[9px] font-mono">[interim...]</span>
                  )}
                </div>
                {seg.isFinal && seg.text.trim() && seg.speaker !== 'assistant' && (
                  <button
                    onClick={() => onSelectSegment(seg.text)}
                    className="opacity-0 group-hover:opacity-100 text-purple-400 hover:text-purple-300 transition-opacity text-[10px] flex items-center gap-0.5 focus:opacity-100"
                    title="Answer this transcript segment"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>Answer this</span>
                  </button>
                )}
              </div>
              <p
                className={`text-[11px] leading-relaxed select-text ${
                  seg.isFinal ? 'text-zinc-200' : 'text-zinc-400 italic'
                }`}
              >
                {seg.text}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Manual question prompt input */}
      <form
        onSubmit={handleSubmit}
        className="p-1.5 border-t border-zinc-800/80 bg-zinc-900/30 flex items-center gap-1.5"
      >
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Ask or paste an interview question..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
        />
        <button
          type="submit"
          disabled={!manualInput.trim()}
          className="p-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded transition-colors"
          title="Submit question"
          aria-label="Submit question"
        >
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
