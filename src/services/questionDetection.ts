import type { QuestionType } from '../types/interview';

export interface LocalQuestionDetection {
  hasQuestion: boolean;
  question?: string;
  questionType?: QuestionType;
  confidence?: number;
}

export function detectLocalQuestion(text: string, currentQuestion?: string): LocalQuestionDetection {
  const question = text.trim().replace(/^(?:um|uh|so|like|well|okay)[,\s]+/i, '').trim();
  if (!question) return { hasQuestion: false };

  const hasQuestionForm = /[?？]/.test(question) ||
    /^(?:(?:um|uh|so|well|okay|right)[,\s]+)*(?:how|what|why|when|where|which|who|can you|could you|would you|do you|tell me about|walk me through|explain|describe|design)\b/i.test(question);
  if (!hasQuestionForm) return { hasQuestion: false };

  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (currentQuestion && normalize(question) === normalize(currentQuestion)) {
    return { hasQuestion: false };
  }

  let questionType: QuestionType = 'technical';
  if (/tell me about a time|conflict|failure|led a team|proudest/i.test(question)) {
    questionType = 'behavioural';
  } else if (/design|system|scale|architecture|distributed/i.test(question)) {
    questionType = 'architecture';
  } else if (/algorithm|complexity|implement|code|function/i.test(question)) {
    questionType = 'coding';
  }

  return {
    hasQuestion: true,
    question: /[?？]$/.test(question) ? question : `${question}?`,
    questionType,
    confidence: 0.82,
  };
}