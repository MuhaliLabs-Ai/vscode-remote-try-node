import React, { useState } from 'react';
import { useInterviewSession } from '../../hooks/useInterviewSession';
import { VisualizationPanel } from '../widget/visualizations/VisualizationPanel';
import { FollowUpList } from '../widget/FollowUpList';
import { SourceList } from '../widget/SourceList';
import {
  Mic,
  MicOff,
  Radio,
  Sparkles,
  Volume2,
  Copy,
  Check,
  Bookmark,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  HelpCircle,
  Trash2,
  Layers,
  Terminal,
  Shield,
  Users,
  Wrench,
  Cpu,
  Globe,
  Briefcase,
  Play,
  Pause,
  Square,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface ThreePanelInterviewCockpitProps {
  session: ReturnType<typeof useInterviewSession>;
}

export const ThreePanelInterviewCockpit: React.FC<ThreePanelInterviewCockpitProps> = ({ session }) => {
  const [copied, setCopied] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(true);
  const [customQuestionInput, setCustomQuestionInput] = useState('');

  const {
    status,
    audioLevel,
    liveVoiceAudioLevel,
    liveVoiceStatus,
    sessionDuration,
    transcript,
    currentAnswer,
    answerHistory,
    savedAnswers,
    preferences,
    candidateProfile,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    clearTranscript,
    requestAnswer,
    saveCurrentAnswer,
    simulateInterviewQuestion,
    toggleLiveVoiceMode,
    setCurrentAnswer,
    updatePreferences,
  } = session;

  const copyAnswer = () => {
    if (!currentAnswer) return;
    const text = `Question: ${currentAnswer.question}\n\nQuick Answer:\n${currentAnswer.quickAnswer}\n\nTalking Points:\n${currentAnswer.talkingPoints.map((tp) => `• ${tp}`).join('\n')}\n\nExplanation:\n${currentAnswer.explanation}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSaved = currentAnswer && savedAnswers.some((a) => a.id === currentAnswer.id || a.question === currentAnswer.question);

  const getQuestionTypeBadge = (type: string) => {
    switch (type) {
      case 'architecture':
        return { label: 'System Architecture & Cloud', color: 'text-purple-400 border-purple-800/60 bg-purple-950/40', icon: Layers };
      case 'security':
        return { label: 'Security & Auth', color: 'text-rose-400 border-rose-800/60 bg-rose-950/40', icon: Shield };
      case 'coding':
        return { label: 'Algorithms & Coding', color: 'text-cyan-400 border-cyan-800/60 bg-cyan-950/40', icon: Terminal };
      case 'behavioural':
        return { label: 'Behavioral & Leadership', color: 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40', icon: Users };
      case 'troubleshooting':
        return { label: 'Debugging & Incident Triage', color: 'text-amber-400 border-amber-800/60 bg-amber-950/40', icon: Wrench };
      default:
        return { label: 'Technical Concept', color: 'text-blue-400 border-blue-800/60 bg-blue-950/40', icon: Cpu };
    }
  };

  const TypeIcon = currentAnswer ? getQuestionTypeBadge(currentAnswer.questionType).icon : Cpu;
  const typeBadge = currentAnswer ? getQuestionTypeBadge(currentAnswer.questionType) : null;

  return (
    <div className="space-y-3 font-sans">
      {/* Cockpit Sub-Header & Live Prompts */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-200">Focused Three-Panel Cockpit</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400">
            Targeting: <strong className="text-purple-300 font-normal">{session.currentRole}</strong>
          </span>
          {candidateProfile.verifiedProjects[0] && (
            <span className="text-zinc-500 hidden xl:inline">
              (Personalized with real project: <span className="text-zinc-300">"{candidateProfile.verifiedProjects[0].title}"</span>)
            </span>
          )}
        </div>

        {/* Quick Simulation Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] text-zinc-500 font-mono">Quick Inquire:</span>
          <button
            onClick={() => simulateInterviewQuestion('How would you design a scalable .NET API on Azure?')}
            className="text-[10px] font-mono px-2 py-1 rounded bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/50 text-blue-200 transition-colors whitespace-nowrap"
          >
            .NET API on Azure
          </button>
          <button
            onClick={() => simulateInterviewQuestion('How do you prevent cache stampedes and handle stale reads in a write-heavy microservices architecture?')}
            className="text-[10px] font-mono px-2 py-1 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/50 text-purple-200 transition-colors whitespace-nowrap"
          >
            Cache Stampedes
          </button>
          <button
            onClick={() => simulateInterviewQuestion('Tell me about a time when you disagreed with a staff architect on a critical migration decision. How did you resolve it?')}
            className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/50 text-emerald-200 transition-colors whitespace-nowrap"
          >
            STAR Behavioral
          </button>
        </div>
      </div>

      {/* Main 3-Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ============================================================== */}
        {/* 1. LEFT PANEL (Width: ~30% / 4 Cols): Live Transcript & Audio */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    status === 'listening' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                  }`}
                />
                <span className="font-semibold text-xs text-zinc-200">Live Transcript & Mic</span>
              </div>
              <div className="flex items-center gap-1.5">
                {transcript.length > 0 && (
                  <button
                    onClick={clearTranscript}
                    className="text-zinc-500 hover:text-rose-400 transition-colors"
                    title="Clear transcript"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Audio Session Controls */}
            <div className="flex items-center gap-2">
              {status !== 'listening' && status !== 'paused' ? (
                <button
                  onClick={startSession}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Start Microphone</span>
                </button>
              ) : (
                <>
                  {status === 'listening' ? (
                    <button
                      onClick={pauseSession}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button
                      onClick={resumeSession}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Resume</span>
                    </button>
                  )}
                  <button
                    onClick={stopSession}
                    className="py-1.5 px-3 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                </>
              )}
            </div>

            {/* Live Audio Meter */}
            {status === 'listening' && (
              <div className="flex items-center gap-2 px-1 text-xs">
                <Volume2 className="w-3 h-3 text-zinc-400" />
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-100 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(5, audioLevel))}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-zinc-400 w-7 text-right">
                  {audioLevel}%
                </span>
              </div>
            )}

            {/* Gemini 3.8 Live Voice Toggle */}
            <div className="pt-2 border-t border-zinc-800/80">
              <button
                onClick={() => toggleLiveVoiceMode()}
                className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all text-xs ${
                  preferences.voiceMode
                    ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-sm'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Radio className={`w-3.5 h-3.5 ${preferences.voiceMode ? 'text-purple-400 animate-pulse' : 'text-zinc-500'}`} />
                  <span className="font-medium">Live Voice (gemini-3.8-live)</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300">
                  {preferences.voiceMode ? liveVoiceStatus : 'Disabled'}
                </span>
              </button>
            </div>

            {/* Transcript Scroll Area */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs">
              {transcript.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  <p>Awaiting spoken audio.</p>
                  <p className="text-[11px] text-zinc-600 mt-1">
                    Microphone is active with permission. Speak or click a sample inquiry.
                  </p>
                </div>
              ) : (
                transcript.map((seg) => (
                  <div
                    key={seg.id}
                    className={`p-2 rounded transition-colors group ${
                      seg.isFinal ? 'bg-zinc-950/70 border border-zinc-800/70' : 'bg-zinc-950/30 border border-dashed border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-0.5">
                      <span className="font-semibold text-purple-400">
                        {seg.speaker === 'candidate'
                          ? 'Candidate (You)'
                          : seg.speaker === 'assistant'
                            ? 'Applebee'
                            : seg.speaker === 'interviewer'
                              ? 'Lead Interviewer'
                              : 'Speaker (unidentified)'}
                      </span>
                      {seg.isFinal && seg.text.trim() && seg.speaker !== 'assistant' && (
                        <button
                          onClick={() => requestAnswer(seg.text)}
                          className="opacity-0 group-hover:opacity-100 text-purple-400 hover:text-purple-300 text-[10px] flex items-center gap-1 transition-opacity"
                          title="Analyze and answer this segment"
                        >
                          <HelpCircle className="w-3 h-3" />
                          <span>Answer this</span>
                        </button>
                      )}
                    </div>
                    <p className={`text-xs leading-relaxed ${seg.isFinal ? 'text-zinc-200' : 'text-zinc-400 italic'}`}>
                      {seg.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Manual Question Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (customQuestionInput.trim()) {
                  requestAnswer(customQuestionInput.trim());
                  setCustomQuestionInput('');
                }
              }}
              className="pt-2 border-t border-zinc-800/80 flex items-center gap-1.5"
            >
              <input
                type="text"
                value={customQuestionInput}
                onChange={(e) => setCustomQuestionInput(e.target.value)}
                placeholder="Type or paste question..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={!customQuestionInput.trim()}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white rounded text-xs transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CENTRE PANEL (Width: ~42% / 5 Cols): Question, Quick Answer, Talking Pts */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-3">
          {currentAnswer ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3.5 select-text">
              {/* Question Header & Type */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  {typeBadge && (
                    <span
                      className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border font-semibold ${typeBadge.color}`}
                    >
                      <TypeIcon className="w-3 h-3" />
                      {typeBadge.label}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => requestAnswer(currentAnswer.question)}
                      className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                      title="Regenerate answer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={saveCurrentAnswer}
                      className={`p-1 rounded transition-colors ${
                        isSaved ? 'text-purple-400 bg-purple-950/60' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                      }`}
                      title="Save to Answer Library"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={copyAnswer}
                      className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                      title="Copy structured response"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <h2 className="text-sm font-semibold text-zinc-100 leading-snug">
                  "{currentAnswer.question}"
                </h2>
                {currentAnswer.generationMode === 'local_fallback' && (
                  <p className="mt-1.5 text-[10px] text-amber-300">
                    AI response unavailable. Showing a local reference answer.
                  </p>
                )}
              </div>

              {/* Quick Answer (Glanceable in 5 Seconds) */}
              <div className="p-3.5 rounded-lg bg-purple-950/20 border border-purple-500/30">
                <div className="flex items-center gap-1.5 mb-1 text-purple-300 font-mono text-[10px] font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Essential Quick Answer</span>
                </div>
                <p className="text-xs text-zinc-100 font-medium leading-relaxed">
                  {currentAnswer.quickAnswer}
                </p>
              </div>

              {/* Key Talking Points (3-5 Bullet Points) */}
              <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800/90 space-y-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 block">
                  Key Talking Points & Architectural Priorities
                </span>
                <div className="space-y-1.5">
                  {currentAnswer.talkingPoints?.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-zinc-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                      <span className="leading-relaxed">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trade-offs & Limitations */}
              {currentAnswer.tradeoffs?.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/30 text-xs text-amber-200/90">
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-300 uppercase tracking-wider font-mono mb-1">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    Engineering Trade-offs & Operational Realities
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-100/80">
                    {currentAnswer.tradeoffs.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Expandable Deep Dive Explanation */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 overflow-hidden">
                <button
                  onClick={() => setShowDeepDive(!showDeepDive)}
                  className="w-full p-2.5 flex items-center justify-between text-xs text-zinc-300 hover:text-zinc-100"
                >
                  <span className="font-semibold text-[11px]">
                    {showDeepDive ? 'Collapse In-Depth Technical Deep Dive' : 'Expand In-Depth Technical Deep Dive'}
                  </span>
                  {showDeepDive ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showDeepDive && (
                  <div className="p-3 pt-0 text-xs text-zinc-300 leading-relaxed border-t border-zinc-800/60 mt-1 whitespace-pre-line">
                    {currentAnswer.explanation}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-12 text-center text-zinc-500 text-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-950/40 border border-purple-800/40 flex items-center justify-center mx-auto text-purple-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-zinc-200 text-sm">Centre Intelligence Panel Ready</h3>
              <p className="text-[11px] text-zinc-500 max-w-sm mx-auto leading-relaxed">
                Start audio capture or choose an interview question from the left panel. As the interviewer speaks, Applebee generates the direct quick answer, structured talking points, and trade-offs.
              </p>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. RIGHT PANEL (Width: ~28% / 3 Cols): Visual Explanation, Follow-ups, Sources */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 space-y-3">
          {currentAnswer ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 space-y-3.5">
              {/* 1. Visual Explanation Engine */}
              {currentAnswer.visualization && (
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Visual Explanation Model
                  </span>
                  <VisualizationPanel visualization={currentAnswer.visualization} />
                </div>
              )}

              {/* 2. Likely Follow-Up Questions */}
              {currentAnswer.followUps?.length > 0 && (
                <FollowUpList
                  followUps={currentAnswer.followUps}
                  onSelectFollowUp={(q) => requestAnswer(q)}
                />
              )}

              {/* 3. Grounded Sources & Documentation References */}
              <SourceList
                sources={currentAnswer.sources}
                verificationStatus={currentAnswer.verificationStatus}
                searchGrounded={currentAnswer.searchGrounded}
                webSearchQueries={currentAnswer.webSearchQueries}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-zinc-500 text-xs space-y-2">
              <span className="font-semibold text-zinc-300 block">Right Panel Awaiting Content</span>
              <p className="text-[11px] text-zinc-500">
                Visual architecture diagrams, likely follow-up predictions, and grounded sources will render here automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
