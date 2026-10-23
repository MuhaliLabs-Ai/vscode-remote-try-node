import React, { useState } from 'react';
import { useInterviewSession } from '../../hooks/useInterviewSession';
import {
  User,
  Briefcase,
  Layers,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface CandidateProfileManagerProps {
  session: ReturnType<typeof useInterviewSession>;
}

export const CandidateProfileManager: React.FC<CandidateProfileManagerProps> = ({ session }) => {
  const { candidateProfile, updateCandidateProfile } = session;
  const [profileData, setProfileData] = useState(candidateProfile);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    updateCandidateProfile(profileData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const addProject = () => {
    setProfileData((current) => ({
      ...current,
      verifiedProjects: [
        ...current.verifiedProjects,
        {
          id: `project_${Date.now()}`,
          title: '',
          role: '',
          techStack: '',
          architectureSummary: '',
          measurableOutcome: '',
        },
      ],
    }));
  };

  const updateProject = (
    projectId: string,
    field: 'title' | 'role' | 'techStack' | 'architectureSummary' | 'measurableOutcome',
    value: string
  ) => {
    setProfileData((current) => ({
      ...current,
      verifiedProjects: current.verifiedProjects.map((project) =>
        project.id === projectId ? { ...project, [field]: value } : project
      ),
    }));
  };

  const removeProject = (projectId: string) => {
    setProfileData((current) => ({
      ...current,
      verifiedProjects: current.verifiedProjects.filter((project) => project.id !== projectId),
    }));
  };

  return (
    <div className="space-y-4 font-sans text-xs max-w-5xl mx-auto">
      {/* Notice Banner */}
      <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Candidate Profile & Experience Context
          </h2>
          <p className="text-zinc-400 text-[11px] mt-0.5">
            Add your own experience details. Answers use these candidate-reported details and do not independently verify them.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-colors shadow-sm"
        >
          {savedSuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
          <span>{savedSuccess ? 'Saved!' : 'Save Profile'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Basic Info & Skills */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
            <span className="font-semibold text-zinc-200 block text-xs border-b border-zinc-800 pb-2">
              Personal & Role Details
            </span>

            <div>
              <label className="text-[10px] text-zinc-400 font-mono block mb-1">CANDIDATE NAME</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                placeholder="Your name"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 font-mono block mb-1">TARGET INTERVIEW ROLE</label>
              <input
                type="text"
                value={profileData.targetRole}
                onChange={(e) => setProfileData({ ...profileData, targetRole: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 font-mono block mb-1">YEARS OF PROFESSIONAL EXPERIENCE</label>
              <input
                type="number"
                min={0}
                value={profileData.yearsOfExperience}
                onChange={(e) => setProfileData({ ...profileData, yearsOfExperience: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 font-mono block mb-1">PRIMARY SKILLS & TECH STACK (COMMA-SEPARATED)</label>
              <input
                type="text"
                value={profileData.primarySkills.join(', ')}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    primarySkills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 font-mono block mb-1">CLOUD PLATFORMS & FRAMEWORKS</label>
              <input
                type="text"
                value={[...profileData.cloudPlatforms, ...profileData.frameworks].join(', ')}
                onChange={(e) => {
                  const items = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                  setProfileData({
                    ...profileData,
                    cloudPlatforms: items.filter((x) => ['Azure', 'AWS', 'GCP', 'Cloud'].includes(x)),
                    frameworks: items.filter((x) => !['Azure', 'AWS', 'GCP', 'Cloud'].includes(x)),
                  });
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500 font-mono text-[11px]"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Candidate-reported project examples */}
        <div className="lg:col-span-7 space-y-3">
          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-semibold text-zinc-200 block text-xs">
                Project Examples
              </span>
              <button
                onClick={addProject}
                className="flex items-center gap-1 text-[10px] text-purple-300 hover:text-purple-200"
              >
                <Plus className="w-3 h-3" /> Add project
              </button>
            </div>

            <div className="space-y-3">
              {profileData.verifiedProjects.length === 0 && (
                <p className="text-[11px] text-zinc-500">
                  No project examples added. Answers will not claim personal project experience.
                </p>
              )}
              {profileData.verifiedProjects.map((proj, idx) => (
                <div key={proj.id} className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      aria-label={`Project ${idx + 1} title`}
                      value={proj.title}
                      onChange={(e) => updateProject(proj.id, 'title', e.target.value)}
                      placeholder="Project name"
                      className="min-w-0 flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-100"
                    />
                    <button
                      onClick={() => removeProject(proj.id)}
                      aria-label={`Remove project ${idx + 1}`}
                      className="p-1 text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    aria-label={`Project ${idx + 1} role`}
                    value={proj.role}
                    onChange={(e) => updateProject(proj.id, 'role', e.target.value)}
                    placeholder="Your role"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-100"
                  />
                  <input
                    aria-label={`Project ${idx + 1} technology stack`}
                    value={proj.techStack}
                    onChange={(e) => updateProject(proj.id, 'techStack', e.target.value)}
                    placeholder="Technology stack"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] font-mono text-zinc-100"
                  />
                  <textarea
                    aria-label={`Project ${idx + 1} summary`}
                    value={proj.architectureSummary}
                    onChange={(e) => updateProject(proj.id, 'architectureSummary', e.target.value)}
                    placeholder="What you built and the problem it solved"
                    rows={2}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-100"
                  />
                  <textarea
                    aria-label={`Project ${idx + 1} outcome`}
                    value={proj.measurableOutcome}
                    onChange={(e) => updateProject(proj.id, 'measurableOutcome', e.target.value)}
                    placeholder="Measured outcome, if available"
                    rows={2}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-100"
                  />
                </div>
              ))}
            </div>

            {/* Leadership Highlights */}
            <div className="pt-2 border-t border-zinc-800 space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                Leadership & Governance Highlights:
              </span>
              {profileData.leadershipHighlights.map((hl, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>{hl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
