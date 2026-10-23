import React, { useState } from 'react';
import { useInterviewSession } from '../../hooks/useInterviewSession';
import {
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Send,
  Loader2,
  Radio,
  Volume2,
} from 'lucide-react';

interface MockInterviewEvaluatorProps {
  session: ReturnType<typeof useInterviewSession>;
}

const MOCK_QUESTIONS = [
  {
    role: '.NET & Azure Cloud Architect',
    question: 'How would you design a scalable .NET API on Azure to handle 100k requests/min with sub-5ms latency?',
    hint: 'Mention stateless ASP.NET Core API on AKS, Azure API Management, Redis read caching, Polly retries, and Azure Key Vault.',
  },
  {
    role: 'Staff Distributed Systems Engineer',
    question: 'How do you handle cache stampedes when high-traffic cache keys expire in a distributed microservices architecture?',
    hint: 'Mention mutex locking, probabilistic early expiration (XFetch), and background refreshers.',
  },
  {
    role: 'Senior Engineering Leadership',
    question: 'Tell me about a time when you disagreed with a staff architect on a critical migration decision. How did you resolve it?',
    hint: 'Use STAR: Situation, Task, Action (RFC review, phased prototype), and measurable Result (zero downtime, 40% performance gain).',
  },
];

export const MockInterviewEvaluator: React.FC<MockInterviewEvaluatorProps> = ({ session }) => {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [candidateResponse, setCandidateResponse] = useState('');

  const activeQuestion = MOCK_QUESTIONS[selectedQuestionIndex];
  const { mockEvaluation, isEvaluating, evaluateAnswer, candidateProfile, preferences, toggleLiveVoiceMode, liveVoiceStatus } = session;

  const handleSubmitEvaluation = () => {
    if (candidateResponse.trim()) {
      evaluateAnswer(activeQuestion.question, candidateResponse.trim());
    }
  };

  return (
    <div className="space-y-4 font-sans text-xs max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-purple-400" />
            AI Mock Interview & Bar Raiser Evaluation
          </h2>
          <p className="text-zinc-400 text-[11px] mt-0.5">
            Simulate high-stakes technical interviews. Practice answering aloud or in writing, and receive immediate rubric scoring against Senior/Staff engineering standards.
          </p>
        </div>

        <button
          onClick={() => toggleLiveVoiceMode()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
            preferences.voiceMode
              ? 'bg-purple-800 text-white border-purple-600'
              : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>{preferences.voiceMode ? `Voice: ${liveVoiceStatus}` : 'Enable Live Voice'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Col: Question selector & candidate workspace */}
        <div className="lg:col-span-7 space-y-3">
          {/* Scenario Selector */}
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">
              Select Mock Interview Scenario:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {MOCK_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedQuestionIndex(idx);
                    setCandidateResponse('');
                  }}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    selectedQuestionIndex === idx
                      ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                      : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="font-semibold text-[11px] truncate">{q.role}</div>
                  <div className="text-[10px] text-zinc-500 truncate mt-0.5">{q.question}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Question Prompt */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>INTERVIEWER PROMPT</span>
              <span className="text-purple-400">{activeQuestion.role}</span>
            </div>
            <p className="text-sm font-semibold text-zinc-100 leading-snug">
              "{activeQuestion.question}"
            </p>
            <div className="p-2 rounded bg-zinc-950/70 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-zinc-300 font-normal">Candidate Blueprint Hint: </strong>
                {activeQuestion.hint}
              </span>
            </div>
          </div>

          {/* Candidate Response Editor */}
          <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-zinc-200">Your Structured Answer</span>
              <button
                onClick={() =>
                  setCandidateResponse(
                    `To design a scalable .NET API on Azure, I would architect a stateless ASP.NET Core service tier containerized on Azure Kubernetes Service (AKS). Ingress is managed via Azure API Management for rate limiting, JWT token validation, and OAuth 2.0 policy enforcement. For performance, we implement Azure Cache for Redis for read models with sub-2ms latency, backed by Azure Cosmos DB / Azure SQL with connection pooling. Reliability is achieved using Polly resilience pipelines with exponential backoff and circuit breakers for transient failures, while secrets are managed via Azure Key Vault. End-to-end telemetry and distributed tracing are captured through Azure Monitor and Application Insights.`
                  )
                }
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Insert Sample Strong Response
              </button>
            </div>
            <textarea
              value={candidateResponse}
              onChange={(e) => setCandidateResponse(e.target.value)}
              placeholder="Structure your answer: Start with the high-level design, list core components (stateless API, auth, scaling, caching), state trade-offs, and quantify reliability/observability..."
              rows={8}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 text-xs leading-relaxed focus:outline-none focus:border-purple-500 resize-none font-sans"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-mono">
                {candidateResponse.trim().split(/\s+/).filter(Boolean).length} words
              </span>
              <button
                onClick={handleSubmitEvaluation}
                disabled={isEvaluating || !candidateResponse.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white font-medium text-xs transition-colors shadow-sm"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating Answer...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit to Bar Raiser Evaluation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Evaluation Rubric Card */}
        <div className="lg:col-span-5 space-y-3">
          {mockEvaluation ? (
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3.5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-400">
                    Evaluation Assessment
                  </span>
                  <div className="text-sm font-semibold text-zinc-100">Senior Technical Score</div>
                  <span className="text-[10px] text-zinc-500">
                    {mockEvaluation.evaluationMode === 'heuristic' ? 'Heuristic estimate (AI unavailable)' : 'AI rubric evaluation'}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-950 border border-purple-500/50 flex items-center justify-center font-bold text-lg text-purple-300 font-mono">
                  {mockEvaluation.score}
                </div>
              </div>

              {/* Rubric Breakdown */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                  4 Core Pillar Breakdown:
                </span>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-zinc-300">Clarity & Structure (STAR)</span>
                      <span className="font-mono text-purple-400">
                        {mockEvaluation.rubricScores.clarityAndStructure}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-400 rounded-full"
                        style={{ width: `${mockEvaluation.rubricScores.clarityAndStructure}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-zinc-300">Technical Depth & Primitives</span>
                      <span className="font-mono text-blue-400">
                        {mockEvaluation.rubricScores.technicalDepth}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full"
                        style={{ width: `${mockEvaluation.rubricScores.technicalDepth}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-zinc-300">Trade-offs Articulation</span>
                      <span className="font-mono text-amber-400">
                        {mockEvaluation.rubricScores.tradeoffsArticulation}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${mockEvaluation.rubricScores.tradeoffsArticulation}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-zinc-300">Production Reliability & SLAs</span>
                      <span className="font-mono text-emerald-400">
                        {mockEvaluation.rubricScores.productionReadiness}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${mockEvaluation.rubricScores.productionReadiness}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bar Raiser Assessment Feedback */}
              <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 text-[11px] leading-relaxed text-zinc-300">
                <span className="font-semibold text-zinc-100 block mb-1">
                  Bar Raiser Summary:
                </span>
                {mockEvaluation.feedback}
              </div>

              {/* Strengths */}
              {mockEvaluation.strengths?.length > 0 && (
                <div className="space-y-1">
                  <span className="font-semibold text-emerald-400 text-[10px] uppercase font-mono">
                    Key Strengths Observed:
                  </span>
                  {mockEvaluation.strengths.map((str, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Concrete Improvements */}
              {mockEvaluation.improvements?.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-zinc-800">
                  <span className="font-semibold text-amber-400 text-[10px] uppercase font-mono">
                    Recommended Revisions Before Real Interview:
                  </span>
                  {mockEvaluation.improvements.map((imp, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-300">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{imp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center text-zinc-500 space-y-2">
              <Award className="w-8 h-8 mx-auto text-zinc-600 mb-1" />
              <div className="font-semibold text-zinc-300">Awaiting Answer Submission</div>
              <p className="text-[11px] text-zinc-500">
                Submit an answer on the left to generate your 4-pillar rubric score and bar raiser critique.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
