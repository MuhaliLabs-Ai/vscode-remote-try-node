import { useState, useEffect, useRef, useCallback } from 'react';
import {
  SessionStatus,
  TranscriptSegment,
  AnswerModel,
  WidgetPreferences,
  QuestionType,
  CandidateProfile,
  MockEvaluationResult,
  ReadinessMetrics,
} from '../types/interview';
import { audioCapture } from '../services/audioCapture';
import { speechService } from '../services/speechRecognition';
import { liveVoiceService } from '../services/liveAudioService';
import { mapSpokenTranscriptToVisual } from '../utils/voiceVisualMapper';

const PREFERENCES_KEY = 'applebee_widget_preferences';
const ANSWER_LIBRARY_KEY = 'applebee_saved_answers';
const CANDIDATE_PROFILE_KEY = 'applebee_candidate_profile';

const DEFAULT_PREFERENCES: WidgetPreferences = {
  theme: 'dark',
  corner: 'bottom-right',
  customPosition: null,
  autoDetectQuestions: true,
  soundAlerts: true,
  fontSize: 'normal',
  isMinimized: false,
  showTranscriptPanel: true,
  useGoogleSearchGrounding: true,
  voiceMode: false,
  voicePersona: 'Zephyr',
};

const DEFAULT_CANDIDATE_PROFILE: CandidateProfile = {
  name: '',
  targetRole: 'Senior .NET & Azure Cloud Architect',
  yearsOfExperience: 0,
  primarySkills: [],
  cloudPlatforms: [],
  frameworks: [],
  verifiedProjects: [],
  leadershipHighlights: [],
};

export function useInterviewSession() {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [liveVoiceAudioLevel, setLiveVoiceAudioLevel] = useState<number>(0);
  const [liveVoiceStatus, setLiveVoiceStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error' | 'unavailable'>('disconnected');
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<AnswerModel | null>(null);
  const [answerHistory, setAnswerHistory] = useState<AnswerModel[]>([]);
  const [savedAnswers, setSavedAnswers] = useState<AnswerModel[]>([]);
  const [detectedQuestionCount, setDetectedQuestionCount] = useState<number>(0);
  const [currentRole, setCurrentRole] = useState<string>('Senior .NET & Azure Cloud Architect');
  const [mockEvaluation, setMockEvaluation] = useState<MockEvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Live voice to visual synchronization state
  const [activeVoiceEntities, setActiveVoiceEntities] = useState<string[]>([]);
  const [liveVoiceHighlightSummary, setLiveVoiceHighlightSummary] = useState<string>('');
  const [isModelSpeaking, setIsModelSpeaking] = useState<boolean>(false);

  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile>(() => {
    try {
      const stored = localStorage.getItem(CANDIDATE_PROFILE_KEY);
      return stored ? { ...DEFAULT_CANDIDATE_PROFILE, ...JSON.parse(stored) } : DEFAULT_CANDIDATE_PROFILE;
    } catch {
      return DEFAULT_CANDIDATE_PROFILE;
    }
  });

  const [preferences, setPreferences] = useState<WidgetPreferences>(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const timerRef = useRef<any>(null);
  const detectionTimeoutRef = useRef<any>(null);
  const lastAnalyzedTextRef = useRef<string>('');
  const isProcessingRef = useRef<boolean>(false);

  // Load saved answers from storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ANSWER_LIBRARY_KEY);
      if (saved) {
        setSavedAnswers(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load saved answers:', e);
    }
  }, []);

  // Save profile updates
  const updateCandidateProfile = useCallback((updates: Partial<CandidateProfile>) => {
    setCandidateProfile((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(CANDIDATE_PROFILE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Save preferences changes
  const updatePreferences = useCallback((updates: Partial<WidgetPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Play subtle chime when answer is ready
  const playAnswerChime = useCallback(() => {
    if (!preferences.soundAlerts) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }, [preferences.soundAlerts]);

  // Request answer with Google Search Grounding and Candidate Profile personalization
  const requestAnswer = useCallback(
    async (questionText: string, questionType?: QuestionType) => {
      if (!questionText || isProcessingRef.current) return;
      isProcessingRef.current = true;
      setStatus('processing');
      setErrorMessage(null);

      try {
        const response = await fetch('/api/interview/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: questionText,
            role: currentRole,
            context: transcript.slice(-4).map((s) => s.text).join(' '),
            useSearchGrounding: preferences.useGoogleSearchGrounding,
            profile: candidateProfile,
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || `Answer service returned HTTP ${response.status}`);
        }
        if (typeof data.quickAnswer !== 'string' || !Array.isArray(data.talkingPoints)) {
          throw new Error('Answer service returned an incomplete response.');
        }
        const newAnswer: AnswerModel = {
          id: 'ans_' + Date.now(),
          question: data.question || questionText,
          questionType: data.questionType || questionType || 'technical',
          quickAnswer: data.quickAnswer,
          talkingPoints: data.talkingPoints,
          explanation: data.explanation || '',
          tradeoffs: data.tradeoffs || [],
          visualization: data.visualization || null,
          followUps: data.followUps || [],
          sources: data.sources || [],
          verificationStatus: data.verificationStatus || 'unverified',
          uncertainties: data.uncertainties || [],
          timestamp: Date.now(),
          searchGrounded: data.searchGrounded || false,
          webSearchQueries: data.webSearchQueries || [],
          generationMode: data.generationMode || 'ai',
          personalizedProjectContext: candidateProfile.verifiedProjects[0]?.title,
        };

        setCurrentAnswer(newAnswer);
        setAnswerHistory((prev) => [newAnswer, ...prev.slice(0, 9)]);
        setDetectedQuestionCount((prev) => prev + 1);
        setStatus('answer_ready');
        playAnswerChime();
      } catch (err: any) {
        console.error('Error generating answer:', err);
        setErrorMessage(`Failed to generate answer: ${err.message}`);
        setStatus('error');
      } finally {
        isProcessingRef.current = false;
      }
    },
    [currentRole, transcript, preferences.useGoogleSearchGrounding, candidateProfile, playAnswerChime]
  );

  // Evaluate candidate answer in mock interview
  const evaluateAnswer = useCallback(
    async (question: string, candidateAnswer: string) => {
      setIsEvaluating(true);
      try {
        const res = await fetch('/api/interview/evaluate-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            candidateAnswer,
            role: currentRole,
            profile: candidateProfile,
          }),
        });
        const evalData = await res.json();
        if (!res.ok) {
          throw new Error(evalData.error || `Evaluation service returned HTTP ${res.status}`);
        }
        setMockEvaluation(evalData);
      } catch (err) {
        setErrorMessage(`Evaluation unavailable: ${err instanceof Error ? err.message : 'Unknown service error'}`);
      } finally {
        setIsEvaluating(false);
      }
    },
    [currentRole, candidateProfile]
  );

  // Debounced question detector
  const analyzeTranscriptForQuestion = useCallback(
    async (segments: TranscriptSegment[]) => {
      if (!preferences.autoDetectQuestions || isProcessingRef.current) return;

      const recentText = segments.slice(-3).map((s) => s.text).join(' ').trim();
      if (!recentText || recentText === lastAnalyzedTextRef.current || recentText.length < 15) {
        return;
      }

      lastAnalyzedTextRef.current = recentText;

      try {
        const res = await fetch('/api/interview/detect-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recentSegments: segments.slice(-3),
            currentQuestion: currentAnswer?.question,
          }),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.hasQuestion && result.question) {
            await requestAnswer(result.question, result.questionType);
          }
        }
      } catch (e) {
        console.warn('Question detection network check skipped:', e);
      }
    },
    [preferences.autoDetectQuestions, currentAnswer?.question, requestAnswer]
  );

  // Add transcript segment
  const handleNewSegment = useCallback(
    (segment: TranscriptSegment) => {
      setTranscript((prev) => {
        const existingIdx = prev.findIndex((s) => s.id === segment.id);
        let updated: TranscriptSegment[];
        if (existingIdx !== -1) {
          updated = [...prev];
          updated[existingIdx] = segment;
        } else {
          updated = [...prev, segment];
        }

        if (segment.isFinal || segment.text.split(' ').length >= 6) {
          if (detectionTimeoutRef.current) {
            clearTimeout(detectionTimeoutRef.current);
          }
          detectionTimeoutRef.current = setTimeout(() => {
            analyzeTranscriptForQuestion(updated);
          }, 600);
        }

        return updated;
      });
    },
    [analyzeTranscriptForQuestion]
  );

  // Start standard listening session
  const startSession = useCallback(async () => {
    setStatus('requesting_permission');
    setErrorMessage(null);

    try {
      await audioCapture.requestAndStart({
        onLevelChange: (lvl) => setAudioLevel(lvl),
        onError: (err) => {
          setErrorMessage(err.message);
          setStatus('error');
        },
      });

      const speechStarted = speechService.start({
        onSegment: handleNewSegment,
        onError: (err) => {
          setErrorMessage(err.message);
        },
        onEnd: () => {},
      });

      setStatus('listening');
      if (!speechStarted) {
        setErrorMessage('Microphone is active, but speech recognition is not supported in this browser.');
      }

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Microphone access denied or unavailable.');
      setStatus('error');
      audioCapture.stop();
    }
  }, [handleNewSegment]);

  // Toggle Gemini 3.8 Live API Real-Time Voice Conversation Mode
  const toggleLiveVoiceMode = useCallback(async (enable?: boolean) => {
    const shouldEnable = enable !== undefined ? enable : !preferences.voiceMode;

    if (!shouldEnable) {
      liveVoiceService.stop();
      updatePreferences({ voiceMode: false });
      setLiveVoiceStatus('disconnected');
      return;
    }

    try {
      updatePreferences({ voiceMode: true });
      await liveVoiceService.start({
        onStatusChange: (s) => setLiveVoiceStatus(s),
        onAudioLevel: (inLvl, outLvl) => {
          setLiveVoiceAudioLevel(Math.max(inLvl, outLvl));
        },
        onTranscription: (text, isModel, isTurnComplete) => {
          setIsModelSpeaking(isModel && !isTurnComplete);
          if (!isModel && isTurnComplete) {
            analyzeTranscriptForQuestion([
              {
                id: `live_input_${Date.now()}`,
                speaker: 'unknown',
                text,
                timestamp: Date.now(),
                isFinal: true,
              },
            ]);
          }
          if (isModel) {
            setCurrentAnswer((prev) => {
              const mapped = mapSpokenTranscriptToVisual(
                text,
                prev?.visualization || null,
                prev?.questionType || 'architecture'
              );
              setActiveVoiceEntities(mapped.activeEntities);
              setLiveVoiceHighlightSummary(mapped.highlightSummary);

              if (!prev) return prev;
              return {
                ...prev,
                visualization: mapped.visualization,
              };
            });
          }

          // Also record into transcript stream
          setTranscript((prev) => {
            const lastSegment = prev[prev.length - 1];
            const speaker = isModel ? 'assistant' : 'unknown';
            if (lastSegment && lastSegment.speaker === speaker && !lastSegment.isFinal) {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...lastSegment,
                text: `${lastSegment.text} ${text}`.trim(),
                isFinal: isTurnComplete,
              };
              return updated;
            } else {
              return [
                ...prev,
                {
                  id: 'live_voice_' + Date.now(),
                  speaker,
                  text,
                  timestamp: Date.now(),
                  isFinal: isTurnComplete,
                },
              ];
            }
          });

          if (isTurnComplete) {
            setIsModelSpeaking(false);
          }
        },
        onInterrupted: () => {
          console.log('[Live Voice] Model turn interrupted by user speech');
          setIsModelSpeaking(false);
        },
        onError: (err) => {
          setErrorMessage(err.message);
          setIsModelSpeaking(false);
        },
      });
    } catch (e: any) {
      setErrorMessage(`Live voice initialization error: ${e.message}`);
      updatePreferences({ voiceMode: false });
    }
  }, [preferences.voiceMode, updatePreferences, analyzeTranscriptForQuestion]);

  // High-fidelity voice simulation helper: transcribes voice responses chunk-by-chunk and animates visual topology live
  const simulateVoiceResponseAndVisualize = useCallback(
    (customText?: string) => {
      setIsModelSpeaking(true);
      const voiceScript = [
        'Client requests arrive through Azure API Management for TLS termination and token authentication.',
        'The gateway routes to stateless ASP.NET Core API microservice containers running on Azure App Service.',
        'High-frequency read queries are served directly from Azure Cache for Redis with sub-5ms latency.',
        'Relational data persistence is managed by Azure SQL with Polly implementing exponential backoff retries.',
        'Azure Application Insights monitors distributed telemetry and alerts on p99 latency regressions.',
      ];

      const scriptToRun = customText ? [customText] : voiceScript;
      let step = 0;

      const interval = setInterval(() => {
        if (step >= scriptToRun.length) {
          clearInterval(interval);
          setIsModelSpeaking(false);
          return;
        }

        const chunk = scriptToRun[step];
        setLiveVoiceAudioLevel(68 + Math.round(Math.random() * 25));

        // Map chunk to visual diagram
        setCurrentAnswer((prev) => {
          const mapped = mapSpokenTranscriptToVisual(
            chunk,
            prev?.visualization || null,
            prev?.questionType || 'architecture'
          );
          setActiveVoiceEntities(mapped.activeEntities);
          setLiveVoiceHighlightSummary(mapped.highlightSummary);

          if (!prev) return prev;
          return {
            ...prev,
            visualization: mapped.visualization,
          };
        });

        // Add to transcript
        setTranscript((prev) => [
          ...prev,
          {
            id: 'voice_sim_' + Date.now() + '_' + step,
            speaker: 'interviewer',
            text: chunk,
            timestamp: Date.now(),
            isFinal: true,
          },
        ]);

        step++;
      }, 1500);
    },
    []
  );

  // Pause listening
  const pauseSession = useCallback(() => {
    audioCapture.stop();
    speechService.stop();
    if (preferences.voiceMode) {
      liveVoiceService.stop();
    }
    setAudioLevel(0);
    setStatus('paused');
  }, [preferences.voiceMode]);

  // Resume listening
  const resumeSession = useCallback(async () => {
    await startSession();
  }, [startSession]);

  // Stop session
  const stopSession = useCallback(() => {
    audioCapture.stop();
    speechService.stop();
    liveVoiceService.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
      detectionTimeoutRef.current = null;
    }
    setAudioLevel(0);
    setLiveVoiceAudioLevel(0);
    setStatus('ended');
  }, []);

  // Clear live transcript
  const clearTranscript = useCallback(() => {
    setTranscript([]);
    lastAnalyzedTextRef.current = '';
  }, []);

  // Save current answer to library
  const saveCurrentAnswer = useCallback(() => {
    if (!currentAnswer) return;
    setSavedAnswers((prev) => {
      if (prev.some((a) => a.id === currentAnswer.id || a.question === currentAnswer.question)) {
        return prev;
      }
      const updated = [currentAnswer, ...prev];
      try {
        localStorage.setItem(ANSWER_LIBRARY_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [currentAnswer]);

  // Delete answer from library
  const deleteSavedAnswer = useCallback((id: string) => {
    setSavedAnswers((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      try {
        localStorage.setItem(ANSWER_LIBRARY_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Simulate an interviewer asking a realistic technical question
  const simulateInterviewQuestion = useCallback(
    (questionText: string) => {
      if (status !== 'listening') {
        setStatus('listening');
      }

      speechService.simulateSpokenQuestion(
        questionText,
        (segment) => {
          handleNewSegment(segment);
        },
        () => {
          requestAnswer(questionText);
        }
      );
    },
    [status, handleNewSegment, requestAnswer]
  );

  // Compute readiness metrics dynamically
  const readinessMetrics: ReadinessMetrics = {
    topicCoverage: {
      systemDesign: Math.min(100, answerHistory.filter((a) => a.questionType === 'architecture').length * 20),
      azureDotNetCloud: Math.min(100, answerHistory.filter((a) => /\.net|azure/i.test(a.question)).length * 20),
      codingAlgorithms: Math.min(100, answerHistory.filter((a) => a.questionType === 'coding').length * 20),
      securityZeroTrust: Math.min(100, answerHistory.filter((a) => a.questionType === 'security').length * 20),
      behavioralLeadership: Math.min(100, answerHistory.filter((a) => a.questionType === 'behavioural').length * 20),
    },
    totalQuestionsAnswered: detectedQuestionCount,
    averageConfidence: mockEvaluation?.score ?? 0,
    revisionItems: [
      'State workload assumptions and measurable service-level objectives when discussing scalability.',
      'Explain retry, circuit-breaker, idempotency, and timeout trade-offs for transient failures.',
      'Compare relational and partitioned NoSQL consistency and failure modes against the workload.',
    ],
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      audioCapture.stop();
      speechService.stop();
      liveVoiceService.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (detectionTimeoutRef.current) clearTimeout(detectionTimeoutRef.current);
    };
  }, []);

  return {
    status,
    errorMessage,
    audioLevel,
    liveVoiceAudioLevel,
    liveVoiceStatus,
    sessionDuration,
    transcript,
    currentAnswer,
    answerHistory,
    savedAnswers,
    detectedQuestionCount,
    currentRole,
    preferences,
    candidateProfile,
    mockEvaluation,
    isEvaluating,
    readinessMetrics,
    setCurrentRole,
    updatePreferences,
    updateCandidateProfile,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    clearTranscript,
    requestAnswer,
    evaluateAnswer,
    saveCurrentAnswer,
    deleteSavedAnswer,
    simulateInterviewQuestion,
    setCurrentAnswer,
    toggleLiveVoiceMode,
    activeVoiceEntities,
    liveVoiceHighlightSummary,
    isModelSpeaking,
    simulateVoiceResponseAndVisualize,
  };
}
