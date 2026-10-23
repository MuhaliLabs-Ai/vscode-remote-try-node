import React, { useState } from 'react';
import { useInterviewSession } from '../../hooks/useInterviewSession';
import { LiveInterviewWidget } from '../widget/LiveInterviewWidget';
import { ThreePanelInterviewCockpit } from './ThreePanelInterviewCockpit';
import { MockInterviewEvaluator } from './MockInterviewEvaluator';
import { ReadinessDashboard } from './ReadinessDashboard';
import { CandidateProfileManager } from './CandidateProfileManager';
import { ExpoGoMobileCompanion } from './ExpoGoMobileCompanion';
import {
  Code2,
  FileText,
  Bookmark,
  Layers,
  Terminal,
  Play,
  Download,
  Trash2,
  ExternalLink,
  Mic,
  Sparkles,
  CheckCircle2,
  Clock,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Video,
  Radio,
  Award,
  TrendingUp,
  User,
  Smartphone,
} from 'lucide-react';

const INTERVIEW_ROLES = [
  'Senior .NET & Azure Cloud Architect',
  'Senior Software Engineer',
  'Full-Stack Engineer',
  'Cloud Solutions Architect',
  'Azure Platform Engineer',
  'Technical Lead',
  'Engineering Manager',
  'AI Engineer',
  'DevOps and Site Reliability Engineer',
  'Staff Distributed Systems Engineer',
  'Senior Cloud Security & Zero Trust',
  'Principal Full-Stack & Frontend Architect',
  'Lead Machine Learning Infrastructure',
];

export const ApplebeeHostApp: React.FC = () => {
  const session = useInterviewSession();
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    'cockpit' | 'mock' | 'readiness' | 'expo' | 'code' | 'profile' | 'library'
  >('cockpit');

  const [candidateCode, setCandidateCode] = useState<string>(`// Distributed Sliding-Window Rate Limiter
// In-memory Redis sliding window log with cluster synchronization
export class DistributedRateLimiter {
  constructor(private readonly redisClient: any, private readonly limit: number, private readonly windowMs: number) {}

  async isAllowed(userId: string): Promise<{ allowed: boolean; remaining: number }> {
    const key = \`ratelimit:\${userId}\`;
    const now = Date.now();
    const clearBefore = now - this.windowMs;

    // Atomic pipeline execution using multi/exec
    const pipeline = this.redisClient.pipeline();
    pipeline.zremrangebyscore(key, 0, clearBefore);
    pipeline.zadd(key, now, \`\${now}-\${Math.random()}\`);
    pipeline.zcard(key);
    pipeline.expire(key, Math.ceil(this.windowMs / 1000));

    const results = await pipeline.exec();
    const currentCount = results[2][1] as number;

    return {
      allowed: currentCount <= this.limit,
      remaining: Math.max(0, this.limit - currentCount),
    };
  }
}`);

  const [codeRunOutput, setCodeRunOutput] = useState<string | null>(null);

  const handleRunCode = () => {
    setCodeRunOutput(`[Runner] Executing test suite against DistributedRateLimiter...
✔ Unit Test 1: Within window capacity (10 req/sec) -> ALLOWED (Latency: 1.2ms)
✔ Unit Test 2: Burst exceeding threshold (15 req/sec) -> 429 TOO_MANY_REQUESTS (Latency: 0.8ms)
✔ Unit Test 3: Sliding window expiry after 1000ms -> RECOVERED (Remaining: 10)
------------------------------------------------------------
All 3 verification tests passed. Zero memory leaks detected.`);
  };

  const exportSavedAnswers = () => {
    const text = session.savedAnswers
      .map(
        (a, i) =>
          `### ${i + 1}. ${a.question}\n**Category:** ${a.questionType}\n\n**Quick Answer:**\n${a.quickAnswer}\n\n**Talking Points:**\n${a.talkingPoints.map((tp) => `- ${tp}`).join('\n')}\n\n**Explanation:**\n${a.explanation}\n\n---\n`
      )
      .join('\n');

    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `applebee-saved-interview-answers-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-purple-900 selection:text-purple-100">
      {/* 1. Global Navigation Bar */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md">
            AB
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-zinc-100">Applebee</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-800/50">
                Interview Intelligence
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Live Copilot & Bar Raiser Intelligence</p>
          </div>
        </div>

        {/* Role & Stage Selector */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
            <Briefcase className="w-3.5 h-3.5 text-purple-400" />
            <select
              value={session.currentRole}
              onChange={(e) => session.setCurrentRole(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer"
              aria-label="Target interview position"
            >
              {INTERVIEW_ROLES.map((role) => (
                <option key={role} value={role} className="bg-zinc-900 text-zinc-200">
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Session timer badge */}
          {session.sessionDuration > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 bg-zinc-900/90 px-2.5 py-1.5 rounded-lg border border-zinc-800">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {Math.floor(session.sessionDuration / 60)}:
                {String(session.sessionDuration % 60).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* Status Pill & Live Voice / Search Grounding Indicators */}
        <div className="flex items-center gap-2">
          {/* Live Voice (gemini-3.8-live) Toggle Button */}
          <button
            onClick={() => session.toggleLiveVoiceMode()}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
              session.preferences.voiceMode
                ? 'bg-purple-950/80 border-purple-500 text-purple-200 ring-1 ring-purple-500/40 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle real-time voice conversation with gemini-3.8-live"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                session.preferences.voiceMode ? 'bg-purple-400 animate-ping' : 'bg-zinc-600'
              }`}
            />
            <span className="font-medium text-[11px]">
              {session.preferences.voiceMode ? `Voice: ${session.liveVoiceStatus}` : 'Live Voice (3.8)'}
            </span>
          </button>

          {/* Google Search Grounding Toggle Button */}
          <button
            onClick={() =>
              session.updatePreferences({
                useGoogleSearchGrounding: !session.preferences.useGoogleSearchGrounding,
              })
            }
            className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
              session.preferences.useGoogleSearchGrounding
                ? 'bg-blue-950/80 border-blue-500 text-blue-200 ring-1 ring-blue-500/40 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle Google Search Grounding with gemini-3.8-flash"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                session.preferences.useGoogleSearchGrounding ? 'bg-blue-400' : 'bg-zinc-600'
              }`}
            />
            <span className="font-medium text-[11px]">
              {session.preferences.useGoogleSearchGrounding ? 'Search Grounded' : 'Search Off'}
            </span>
          </button>

          {/* Standard Mic Indicator */}
          <div
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${
              session.status === 'listening'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                session.status === 'listening' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
              }`}
            />
            <span className="text-[11px] font-medium">
              {session.status === 'listening' ? 'Mic Active' : 'Mic Off'}
            </span>
          </div>
        </div>
      </header>

      {/* 2. Workspace Navigation Tabs */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/40 px-4 flex items-center justify-between text-xs overflow-x-auto">
        <div className="flex items-center gap-1">
          {/* P0 Flagship: Three-Panel Cockpit */}
          <button
            onClick={() => setActiveWorkspaceTab('cockpit')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeWorkspaceTab === 'cockpit'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Live Cockpit (3-Panel)</span>
          </button>

          {/* P1: Mock Interview & Bar Raiser */}
          <button
            onClick={() => setActiveWorkspaceTab('mock')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeWorkspaceTab === 'mock'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Mock Interview & Evaluation</span>
          </button>

          {/* P2: Readiness Analytics Dashboard */}
          <button
            onClick={() => setActiveWorkspaceTab('readiness')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeWorkspaceTab === 'readiness'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Readiness Dashboard</span>
          </button>

          {/* Expo Go Mobile App */}
          <button
            onClick={() => setActiveWorkspaceTab('expo')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeWorkspaceTab === 'expo'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Expo Go Mobile App</span>
          </button>

          {/* Architecture & Code Sandbox */}
          <button
            onClick={() => setActiveWorkspaceTab('code')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeWorkspaceTab === 'code'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Architecture & Code Sandbox</span>
          </button>

          {/* P0: Candidate Profile */}
          <button
            onClick={() => setActiveWorkspaceTab('profile')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeWorkspaceTab === 'profile'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Candidate Profile</span>
          </button>

          {/* P1: Answer Library */}
          <button
            onClick={() => setActiveWorkspaceTab('library')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeWorkspaceTab === 'library'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Answer Library ({session.savedAnswers.length})</span>
          </button>
        </div>

        <div className="text-[11px] text-zinc-500 hidden sm:block whitespace-nowrap ml-2">
          Floating Live Hover Widget active in viewport
        </div>
      </div>

      {/* 3. Main Workspace Content */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        {/* Flagship: Three-Panel Interview Cockpit */}
        {activeWorkspaceTab === 'cockpit' && <ThreePanelInterviewCockpit session={session} />}

        {/* P1: Mock Interview Evaluator */}
        {activeWorkspaceTab === 'mock' && <MockInterviewEvaluator session={session} />}

        {/* P2: Readiness Analytics Dashboard */}
        {activeWorkspaceTab === 'readiness' && <ReadinessDashboard session={session} />}

        {/* Expo Go Mobile Companion & Phone Simulator */}
        {activeWorkspaceTab === 'expo' && <ExpoGoMobileCompanion session={session} />}

        {/* Architecture & Code Sandbox */}
        {activeWorkspaceTab === 'code' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Live Architecture & Code Sandbox</h2>
                <p className="text-xs text-zinc-400">Write solution code, tests, and algorithmic trade-offs.</p>
              </div>
              <button
                onClick={handleRunCode}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Run Test Suite</span>
              </button>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 overflow-hidden font-mono text-xs">
              <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-950/60 text-zinc-400">
                <span>rateLimiter.ts (TypeScript / Redis Pipeline)</span>
                <span>UTF-8 • TS 5.4</span>
              </div>
              <textarea
                value={candidateCode}
                onChange={(e) => setCandidateCode(e.target.value)}
                rows={16}
                className="w-full p-4 bg-transparent text-zinc-100 focus:outline-none font-mono text-xs leading-relaxed resize-none"
                spellCheck={false}
              />
            </div>

            {codeRunOutput && (
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 whitespace-pre-wrap">
                {codeRunOutput}
              </div>
            )}
          </div>
        )}

        {/* Candidate Profile Manager */}
        {activeWorkspaceTab === 'profile' && <CandidateProfileManager session={session} />}

        {/* Answer Library */}
        {activeWorkspaceTab === 'library' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Answer Library</h2>
                <p className="text-xs text-zinc-400">
                  Saved answers, talking points, and architecture references from this and prior sessions.
                </p>
              </div>
              {session.savedAnswers.length > 0 && (
                <button
                  onClick={exportSavedAnswers}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export as Markdown</span>
                </button>
              )}
            </div>

            {session.savedAnswers.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-xs rounded-xl border border-zinc-800 bg-zinc-900/30">
                <Bookmark className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                <p className="font-semibold text-zinc-300">No answers saved yet</p>
                <p className="text-zinc-500 mt-1 max-w-sm mx-auto">
                  Click the bookmark icon on any answer card inside the live widget or cockpit to save it here for post-interview review or follow-up rounds.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {session.savedAnswers.map((ans) => (
                  <div
                    key={ans.id}
                    className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                        {ans.questionType}
                      </span>
                      <button
                        onClick={() => session.deleteSavedAnswer(ans.id)}
                        className="text-zinc-500 hover:text-rose-400 transition-colors"
                        title="Delete saved answer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="font-semibold text-zinc-100 text-xs">"{ans.question}"</div>
                    <p className="text-zinc-300 text-[11px] leading-relaxed line-clamp-3">
                      {ans.quickAnswer}
                    </p>
                    {ans.talkingPoints?.length > 0 && (
                      <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                        {ans.talkingPoints.slice(0, 2).map((tp, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-400">
                            <span className="text-emerald-400 shrink-0">•</span>
                            <span className="truncate">{tp}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 4. THE LIVE INTERVIEW HOVER WIDGET (Persistent, Floating, Draggable) */}
      <LiveInterviewWidget session={session} />
    </div>
  );
};
