import React from 'react';
import { useInterviewSession } from '../../hooks/useInterviewSession';
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Terminal,
  Cpu,
  BookOpen,
} from 'lucide-react';

interface ReadinessDashboardProps {
  session: ReturnType<typeof useInterviewSession>;
}

export const ReadinessDashboard: React.FC<ReadinessDashboardProps> = ({ session }) => {
  const { readinessMetrics, candidateProfile, answerHistory, savedAnswers } = session;

  const topics = [
    { name: 'System Design & Distributed Scalability', score: readinessMetrics.topicCoverage.systemDesign, color: 'bg-purple-500' },
    { name: '.NET / C# & Azure Cloud Architecture', score: readinessMetrics.topicCoverage.azureDotNetCloud, color: 'bg-blue-500' },
    { name: 'Algorithmic Complexity & Edge Cases', score: readinessMetrics.topicCoverage.codingAlgorithms, color: 'bg-cyan-500' },
    { name: 'Cloud Security & Zero Trust Architecture', score: readinessMetrics.topicCoverage.securityZeroTrust, color: 'bg-rose-500' },
    { name: 'STAR Behavioral & Technical Leadership', score: readinessMetrics.topicCoverage.behavioralLeadership, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-4 font-sans text-xs max-w-5xl mx-auto">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-400">OVERALL READINESS</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
            {session.mockEvaluation ? `${readinessMetrics.averageConfidence}%` : 'Not scored'}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            {session.mockEvaluation ? 'Based on the latest evaluation' : 'Complete a mock evaluation to get a score'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-400">QUESTIONS ANALYZED</div>
          <div className="text-xl font-bold font-mono text-purple-400 mt-0.5">
            {readinessMetrics.totalQuestionsAnswered}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">In active session</div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-400">ANSWER LIBRARY</div>
          <div className="text-xl font-bold font-mono text-blue-400 mt-0.5">
            {savedAnswers.length}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">Saved reference blueprints</div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-400">CANDIDATE PROFILE</div>
          <div className="text-xs font-semibold text-zinc-200 mt-1 truncate">
            {candidateProfile.name || 'No name provided'}
          </div>
          <div className="text-[10px] text-zinc-500 truncate">
            {candidateProfile.yearsOfExperience || 'Not provided'} yrs exp • {candidateProfile.primarySkills.slice(0, 2).join(', ') || 'No skills added'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Cols: Topic Coverage Bars */}
        <div className="lg:col-span-7 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="font-semibold text-zinc-100 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Technical Domain Readiness Breakdown
            </span>
            <span className="text-[10px] font-mono text-zinc-400">Target: Senior/Staff</span>
          </div>

          <div className="space-y-3">
            {topics.map((t, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-200">{t.name}</span>
                  <span className="font-mono text-zinc-400">{t.score}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${t.color} rounded-full transition-all duration-300`} style={{ width: `${t.score}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200 font-medium">Readiness Insight: </strong>
            {answerHistory.length > 0
              ? `Analyzed ${answerHistory.length} answer${answerHistory.length === 1 ? '' : 's'}. Coverage increases as you practice questions in each topic.`
              : 'No answers analyzed yet. Submit practice questions to begin building topic coverage.'}
          </div>
        </div>

        {/* Right 5 Cols: Revision Checklist */}
        <div className="lg:col-span-5 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="font-semibold text-zinc-100 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Identified Revision Focus Areas
            </span>
            <span className="text-[10px] font-mono text-amber-400">Priority Action</span>
          </div>

          <div className="space-y-2">
            {readinessMetrics.revisionItems.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded bg-zinc-950/70 border border-zinc-800/80 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-950 border border-amber-800 text-amber-300 text-[9px] font-mono flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-[11px] text-zinc-300 leading-snug">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
