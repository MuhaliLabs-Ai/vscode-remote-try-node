import React, { useState } from 'react';
import { AnswerModel } from '../../types/interview';
import { VisualizationPanel } from './visualizations/VisualizationPanel';
import { FollowUpList } from './FollowUpList';
import { SourceList } from './SourceList';
import {
  Copy,
  Check,
  Bookmark,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Cpu,
  Shield,
  Layers,
  Terminal,
  Users,
  Wrench,
} from 'lucide-react';

interface QuickAnswerCardProps {
  answer: AnswerModel;
  onFollowUp: (question: string) => void;
  onSave: () => void;
  onRegenerate: () => void;
  isSaved?: boolean;
  activeVoiceEntities?: string[];
  isLiveVoiceActive?: boolean;
  liveVoiceHighlightSummary?: string;
}

export const QuickAnswerCard: React.FC<QuickAnswerCardProps> = ({
  answer,
  onFollowUp,
  onSave,
  onRegenerate,
  isSaved,
  activeVoiceEntities = [],
  isLiveVoiceActive = false,
  liveVoiceHighlightSummary,
}) => {
  const [copied, setCopied] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showVisual, setShowVisual] = useState(true);

  const copyFullAnswer = () => {
    const textToCopy = `Question: ${answer.question}\n\nQuick Answer:\n${answer.quickAnswer}\n\nTalking Points:\n${answer.talkingPoints.map((tp) => `• ${tp}`).join('\n')}\n\nExplanation:\n${answer.explanation}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getQuestionTypeBadge = (type: string) => {
    switch (type) {
      case 'architecture':
        return { label: 'System Architecture', color: 'text-purple-400 border-purple-800/60 bg-purple-950/40', icon: Layers };
      case 'security':
        return { label: 'Security & Auth', color: 'text-rose-400 border-rose-800/60 bg-rose-950/40', icon: Shield };
      case 'coding':
        return { label: 'Algorithms & Coding', color: 'text-cyan-400 border-cyan-800/60 bg-cyan-950/40', icon: Terminal };
      case 'behavioural':
        return { label: 'Behavioral & Leadership', color: 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40', icon: Users };
      case 'troubleshooting':
        return { label: 'Debugging & Outage', color: 'text-amber-400 border-amber-800/60 bg-amber-950/40', icon: Wrench };
      default:
        return { label: 'Technical Concept', color: 'text-blue-400 border-blue-800/60 bg-blue-950/40', icon: Cpu };
    }
  };

  const typeBadge = getQuestionTypeBadge(answer.questionType);
  const TypeIcon = typeBadge.icon;

  return (
    <div className="space-y-3 font-sans select-text">
      {/* Question Header & Category */}
      <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span
            className={`flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border font-semibold ${typeBadge.color}`}
          >
            <TypeIcon className="w-3 h-3" />
            {typeBadge.label}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={onRegenerate}
              className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
              title="Regenerate answer"
              aria-label="Regenerate answer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onSave}
              className={`p-1 rounded transition-colors ${
                isSaved
                  ? 'text-purple-400 bg-purple-950/50'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              title={isSaved ? 'Saved to Answer Library' : 'Save to Answer Library'}
              aria-label="Save to Answer Library"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={copyFullAnswer}
              className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
              title="Copy response"
              aria-label="Copy response"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <h3 className="text-xs font-semibold text-zinc-100 leading-snug">
          "{answer.question}"
        </h3>
        {answer.generationMode === 'local_fallback' && (
          <p className="mt-2 text-[10px] text-amber-300">
            AI response unavailable. Showing a local reference answer.
          </p>
        )}
      </div>

      {/* 1. Concise Quick Answer (Glanceable) */}
      <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-500/30">
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider font-mono">
            Direct 5-Second Response
          </span>
        </div>
        <p className="text-xs text-zinc-100 font-medium leading-relaxed">
          {answer.quickAnswer}
        </p>
      </div>

      {/* 2. Key Talking Points (3-5 Bullet points) */}
      {answer.talkingPoints?.length > 0 && (
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2 font-mono">
            Actionable Talking Points
          </span>
          <div className="space-y-1.5">
            {answer.talkingPoints.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-zinc-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                <span className="leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Trade-offs / Limitations (Amber warning badges) */}
      {answer.tradeoffs?.length > 0 && (
        <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/30 text-xs text-amber-200/90">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-300 uppercase tracking-wider font-mono mb-1">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            Engineering Trade-offs & Caveats
          </div>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-100/80">
            {answer.tradeoffs.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Structured Visual Explanation */}
      {answer.visualization && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Visual Architecture & Model
            </span>
            <button
              onClick={() => setShowVisual(!showVisual)}
              className="text-[10px] text-zinc-400 hover:text-zinc-200 font-mono"
            >
              {showVisual ? 'Hide Diagram' : 'Show Diagram'}
            </button>
          </div>
          {showVisual && (
            <VisualizationPanel
              visualization={answer.visualization}
              activeVoiceEntities={activeVoiceEntities}
              isLiveVoiceActive={isLiveVoiceActive}
              liveVoiceHighlightSummary={liveVoiceHighlightSummary}
            />
          )}
        </div>
      )}

      {/* 5. Deep Technical Explanation (Expandable) */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/30">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full p-2.5 flex items-center justify-between text-xs text-zinc-300 hover:text-zinc-100 focus:outline-none"
          aria-expanded={showExplanation}
        >
          <span className="font-semibold text-[11px] tracking-wide">
            {showExplanation ? 'Hide In-Depth Explanation' : 'Read In-Depth Technical Explanation'}
          </span>
          {showExplanation ? (
            <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </button>
        {showExplanation && (
          <div className="p-3 pt-0 text-xs text-zinc-300 leading-relaxed border-t border-zinc-800/60 mt-1 whitespace-pre-line">
            {answer.explanation}
          </div>
        )}
      </div>

      {/* 6. Likely Follow-up Questions */}
      <FollowUpList followUps={answer.followUps} onSelectFollowUp={onFollowUp} />

      {/* 7. Grounded Sources & Documentation References */}
      <SourceList
        sources={answer.sources}
        verificationStatus={answer.verificationStatus}
        searchGrounded={answer.searchGrounded}
        webSearchQueries={answer.webSearchQueries}
      />
    </div>
  );
};
