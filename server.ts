import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateConceptFallbackAnswer } from './src/services/answerFallback';
import { detectLocalQuestion } from './src/services/questionDetection';
import { findAvailablePort } from './src/utils/portResolver';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const DEFAULT_PORT = Number(process.env.PORT || 3000);

// Initialize GoogleGenAI SDK with user-agent telemetry header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const app = express();
app.use(express.json({ limit: '15mb' }));

const httpServer = http.createServer(app);

// Attach WebSocketServer for Gemini 3.8 Live API real-time voice conversations
const wss = new WebSocketServer({ server: httpServer, path: '/live' });

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'applebee-interview-intelligence',
    aiConfigured: Boolean(apiKey),
    features: {
      structuredAnswers: true,
      liveVoice: Boolean(apiKey),
      searchGrounding: Boolean(apiKey),
      clientSpeechRecognition: 'browser-dependent',
    },
    timestamp: new Date().toISOString(),
  });
});

// Domain curated references as base fallbacks
const CURATED_SOURCES: Record<string, Array<{ title: string; url: string; domain: string; excerpt: string; verificationStatus: 'verified_doc' | 'consensus' | 'unverified' }>> = {
  architecture: [
    {
      title: 'Google Cloud Architecture Center: Microservices & Event-Driven Patterns',
      url: 'https://cloud.google.com/architecture',
      domain: 'cloud.google.com',
      excerpt: 'Reference architectures for distributed transaction management, event streaming, and horizontal scalability.',
      verificationStatus: 'verified_doc',
    },
    {
      title: 'AWS Well-Architected Framework: Reliability & Performance Pillars',
      url: 'https://aws.amazon.com/architecture/well-architected',
      domain: 'aws.amazon.com',
      excerpt: 'Best practices for failure isolation, circuit breaking, and multi-region replication.',
      verificationStatus: 'verified_doc',
    },
  ],
  security: [
    {
      title: 'OWASP Top 10 API Security Risks Standard',
      url: 'https://owasp.org/www-project-api-security',
      domain: 'owasp.org',
      excerpt: 'Definitive guide for mitigating Broken Object Level Authorization (BOLA), SSRF, and credential abuse.',
      verificationStatus: 'verified_doc',
    },
    {
      title: 'NIST Special Publication 800-207: Zero Trust Architecture',
      url: 'https://csrc.nist.gov/publications/detail/sp/800-207/final',
      domain: 'csrc.nist.gov',
      excerpt: 'Core tenets of continuous authentication, dynamic policy enforcement, and per-request verification.',
      verificationStatus: 'verified_doc',
    },
  ],
  coding: [
    {
      title: 'MDN Web Docs: Concurrency Model & JavaScript Event Loop',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop',
      domain: 'developer.mozilla.org',
      excerpt: 'Formal specification of the call stack, microtask queue (Promises), and macrotask rendering phases.',
      verificationStatus: 'verified_doc',
    },
    {
      title: 'React Official Documentation: Managing State & Effect Lifecycle',
      url: 'https://react.dev/learn/synchronizing-with-effects',
      domain: 'react.dev',
      excerpt: 'Official patterns for purity, memoization, synchronous reactive effects, and layout measurement.',
      verificationStatus: 'verified_doc',
    },
  ],
  behavioural: [
    {
      title: 'Harvard Business Review: The STAR Interview Method for Technical Leadership',
      url: 'https://hbr.org/topic/subject/interviews',
      domain: 'hbr.org',
      excerpt: 'Framework for structuring Situation, Task, Action, and quantifiable Business Results in senior evaluations.',
      verificationStatus: 'consensus',
    },
  ],
  troubleshooting: [
    {
      title: 'Google SRE Book: Practical Root Cause Analysis & Postmortem Culture',
      url: 'https://sre.google/sre-book/postmortem-culture',
      domain: 'sre.google',
      excerpt: 'Methodologies for telemetry triage, latency distribution analysis, and blameless remediation.',
      verificationStatus: 'verified_doc',
    },
  ],
};

function generateFallbackAnswer(question: string, role?: string) {
  const lower = question.toLowerCase();
  const conceptAnswer = generateConceptFallbackAnswer(question);
  if (conceptAnswer) return conceptAnswer;

  let questionType: 'technical' | 'behavioural' | 'coding' | 'architecture' | 'security' | 'troubleshooting' | 'general' = 'technical';
  
  if (lower.includes('tell me about a time') || lower.includes('conflict') || lower.includes('failure') || lower.includes('led a team') || lower.includes('proudest')) {
    questionType = 'behavioural';
  } else if (lower.includes('scale') || lower.includes('system design') || lower.includes('architecture') || lower.includes('microservice') || lower.includes('distributed') || lower.includes('kafka') || lower.includes('cache')) {
    questionType = 'architecture';
  } else if (lower.includes('security') || lower.includes('jwt') || lower.includes('auth') || lower.includes('xss') || lower.includes('csrf') || lower.includes('oauth') || lower.includes('sql injection') || lower.includes('bola')) {
    questionType = 'security';
  } else if (lower.includes('debug') || lower.includes('incident') || lower.includes('outage') || lower.includes('slow') || lower.includes('memory leak') || lower.includes('bottleneck')) {
    questionType = 'troubleshooting';
  } else if (lower.includes('algorithm') || lower.includes('complexity') || lower.includes('array') || lower.includes('tree') || lower.includes('graph') || lower.includes('code') || lower.includes('implement')) {
    questionType = 'coding';
  }

  // Specialized .NET & Azure Cloud Architecture (Exact User Exemplar)
  if (
    /\.net|azure|c#|asp\.net/i.test(question) &&
    /design|architect|scale|api|cloud|microservice|distributed/i.test(question)
  ) {
    return {
      question,
      questionType: 'architecture',
      quickAnswer: 'Use a stateless ASP.NET Core API, secure authentication, managed data storage, appropriate scaling, caching where beneficial, and end-to-end observability.',
      talkingPoints: [
        'Security: authentication, authorisation (Azure AD / Entra ID), secret management via Azure Key Vault.',
        'Scalability: stateless services on Azure App Service / AKS and horizontal scaling where appropriate.',
        'Reliability: timeouts, retries with exponential backoff using Polly, and resilience circuit breaker patterns.',
        'Performance: Azure Cache for Redis and database query optimisation.',
        'Observability: structured logs, metrics, distributed tracing via Azure Monitor & Application Insights.',
      ],
      explanation: 'A resilient Azure cloud API decouples client ingress via Azure API Management, directing requests to autoscaling ASP.NET Core container instances. Token verification occurs at the gateway layer, while downstream state operations leverage connection-pooled Azure SQL / Cosmos DB with Redis read-through caching to hit sub-5ms p99 latency SLAs.',
      tradeoffs: [
        'Managed cloud PaaS services reduce operational toil but increase vendor coupling.',
        'Multi-region active-active databases require conflict resolution strategies (e.g. Cosmos DB multi-master).',
      ],
      visualization: {
        type: 'architecture',
        title: 'Scalable .NET API Architecture on Azure',
        description: 'Client ingress through Azure API Management routing to ASP.NET Core API with Redis cache and Azure SQL/Cosmos DB monitored by Application Insights.',
        data: {
          nodes: [
            { id: '1', label: 'Client Ingress', role: 'Web / Mobile / Partner Clients', type: 'ingress' },
            { id: '2', label: 'Azure API Management', role: 'Rate Limiting, Auth, Policy Gateway', type: 'ingress' },
            { id: '3', label: 'ASP.NET Core API', role: 'Stateless Autoscaling Microservice Cluster', type: 'compute' },
            { id: '4', label: 'Azure Cache for Redis', role: 'In-Memory Read Model & Session Store', type: 'cache' },
            { id: '5', label: 'Azure SQL / Cosmos DB', role: 'Managed Relational / NoSQL Persistence', type: 'database' },
            { id: '6', label: 'Azure Application Insights', role: 'Distributed Tracing & Structured Logs', type: 'compute' },
          ],
          edges: [
            { from: '1', to: '2', label: 'HTTPS / TLS 1.3' },
            { from: '2', to: '3', label: 'Mutual TLS / JWT' },
            { from: '3', to: '4', label: 'StackExchange.Redis (<2ms)' },
            { from: '3', to: '5', label: 'EF Core / Connection Pool' },
            { from: '3', to: '6', label: 'OpenTelemetry Telemetry' },
          ],
        },
      },
      followUps: [
        'How would you handle database bottlenecks when traffic spikes 10x?',
        'What retry policy configuration do you recommend with Polly for transient Azure SQL errors?',
        'How do you manage secret rotation between Azure Key Vault and ASP.NET Core configuration?',
      ],
      sources: [
        {
          title: 'Microsoft Azure Architecture Center: Highly Scalable Web Apps',
          url: 'https://learn.microsoft.com/en-us/azure/architecture',
          domain: 'learn.microsoft.com',
          excerpt: 'Official reference architecture for deploying mission-critical stateless ASP.NET Core web APIs on Azure App Service and AKS.',
          verificationStatus: 'verified_doc',
        },
        {
          title: '.NET Official Documentation: Resilience and Transient Fault Handling with Polly',
          url: 'https://learn.microsoft.com/en-us/dotnet/core/resilience',
          domain: 'learn.microsoft.com',
          excerpt: 'Microsoft guidelines on implementing circuit breakers, rate limiters, and exponential backoff retry strategies.',
          verificationStatus: 'verified_doc',
        },
      ],
      verificationStatus: 'verified_doc' as const,
      uncertainties: ['Workload read-to-write ratio will determine whether Azure SQL Elastic Pools or Cosmos DB serverless is optimal.'],
    };
  }

  if (questionType === 'architecture') {
    return {
      question,
      questionType,
      quickAnswer: 'Isolate critical workloads into decoupled event-driven services with idempotency, distributed caching, and explicit fallback circuit breakers.',
      talkingPoints: [
        'Leverage an event-log (e.g. Apache Kafka) for decoupled async ingestion with replayability.',
        'Apply write-through / read-through caching using Redis with explicit TTL and jitter.',
        'Enforce bulkhead isolation and client circuit breakers to prevent cascading latency spikes.',
        'Use optimistic locking and idempotency keys to guarantee at-least-once consistency without two-phase locks.',
      ],
      explanation: 'In high-scale architectures, single-point bottlenecks emerge when synchronous RPC chains stall. By decoupling write pathways using an append-only event log and caching read models in memory, the system maintains linear throughput while isolating failure domains.',
      tradeoffs: [
        'Eventual consistency introduces stale reads during partition spikes.',
        'Managing distributed schema migrations requires backward/forward compatibility.',
      ],
      visualization: {
        type: 'architecture',
        title: 'Decoupled Scalable Architecture Pattern',
        description: 'Client ingress through API Gateway with Kafka event bus and replicated cache layer.',
        data: {
          nodes: [
            { id: '1', label: 'Client Ingress', role: 'API Gateway / Cloudflare', type: 'ingress' },
            { id: '2', label: 'Stateless Service Tier', role: 'Container Cluster (Autoscaled)', type: 'compute' },
            { id: '3', label: 'Distributed Cache', role: 'Redis Cluster (Read Path)', type: 'cache' },
            { id: '4', label: 'Event Streaming Log', role: 'Kafka / PubSub (Async Write)', type: 'queue' },
            { id: '5', label: 'Primary DB + Replicas', role: 'PostgreSQL / Spanner', type: 'database' },
          ],
          edges: [
            { from: '1', to: '2', label: 'HTTPS / TLS 1.3' },
            { from: '2', to: '3', label: 'Cache Query (<2ms)' },
            { from: '2', to: '4', label: 'Publish Event' },
            { from: '4', to: '5', label: 'Async Batch Ingestion' },
            { from: '5', to: '3', label: 'CDC Cache Invalidation' },
          ],
        },
      },
      followUps: [
        'How do you prevent cache stampedes when hot keys expire?',
        'What strategy do you use for distributed transactions across microservices?',
        'How would you handle backpressure if consumers fall behind the log watermark?',
      ],
      sources: CURATED_SOURCES.architecture,
      verificationStatus: 'verified_doc' as const,
      uncertainties: ['Specific traffic distribution and write-to-read ratio will dictate optimal partition sizing.'],
    };
  }

  if (questionType === 'behavioural') {
    return {
      question,
      questionType,
      quickAnswer: 'Demonstrate leadership by framing the business impact, your individual ownership, pragmatic technical compromise, and measurable outcome.',
      talkingPoints: [
        'Situation: High-stakes production constraint or cross-team architectural divergence.',
        'Task: Clarify business priority, align stakeholder expectations, and isolate root challenges.',
        'Action: Facilitated blameless RFC review, phased prototype rollout, and risk-mitigated milestones.',
        'Result: Delivered on schedule with zero customer downtime and 40% performance gain.',
      ],
      explanation: 'Senior engineering evaluation hinges on clear ownership and constructive conflict resolution. The STAR format highlights not just what was built, but how collaborative consensus was built without sacrificing quality or architectural integrity.',
      tradeoffs: [
        'Deep consensus gathering can delay initial velocity if not time-boxed.',
        'Documenting explicit tradeoffs early prevents retrospective scope creep.',
      ],
      visualization: {
        type: 'star',
        title: 'STAR Method Behavioral Delivery Blueprint',
        description: 'Structured narrative progression with measurable outcomes.',
        data: {
          situation: 'Legacy billing pipeline faced 3x volume surge during Q4 product launch, risking critical failure.',
          task: 'Tasked as technical lead to stabilize throughput within 3 weeks without introducing data loss.',
          action: 'Implemented queue throttling, structured rollback gates, and led bi-weekly cross-functional syncs.',
          result: 'Achieved 99.99% processing SLA, zero data loss, and saved 120+ engineering triage hours.',
        },
      },
      followUps: [
        'What would you have done differently with an additional month of runway?',
        'How did you communicate risks up to non-technical executive leadership?',
      ],
      sources: CURATED_SOURCES.behavioural,
      verificationStatus: 'consensus' as const,
      uncertainties: ['Tailor the company name and exact metrics to match your genuine career milestones.'],
    };
  }

  if (questionType === 'coding') {
    return {
      question,
      questionType,
      quickAnswer: 'Clarify constraints, identify edge cases, state brute-force complexity, then optimize using targeted data structures for optimal time and space.',
      talkingPoints: [
        'Clarify inputs: range of values, memory constraints, mutable vs immutable.',
        'State baseline O(N²) approach before pivoting to optimal O(N) or O(N log N) technique.',
        'Proactively highlight edge cases: empty input, duplicate values, extreme bounds.',
        'Walk through test case step-by-step prior to writing final code.',
      ],
      explanation: 'Interviewers evaluate communication and structured reasoning above raw memorization. Articulating the tradeoff between auxiliary memory (hash table, two-pointer) and traversal efficiency demonstrates senior engineering maturity.',
      tradeoffs: [
        'Trading memory space (O(N) hash map) for constant-time lookup O(1).',
        'In-place mutations save space but may violate functional immutability.',
      ],
      visualization: {
        type: 'coding',
        title: 'Complexity & Strategy Breakdown',
        description: 'Algorithmic efficiency progression and edge case coverage.',
        data: {
          timeComplexity: 'O(N) Optimal',
          spaceComplexity: 'O(N) Auxiliary',
          keyDataStructure: 'Hash Map / Two-Pointers',
          edgeCases: ['Empty array / null input', 'Duplicate values', 'Single element array', 'Overflow limits'],
          codeSnippet: `// Idiomatic two-pass / sliding-window optimal implementation
function solveOptimal(items: number[], target: number): [number, number] | null {
  const seen = new Map<number, number>();
  for (let i = 0; i < items.length; i++) {
    const complement = target - items[i];
    if (seen.has(complement)) {
      return [seen.get(complement)!, i];
    }
    seen.set(items[i], i);
  }
  return null;
}`,
        },
      },
      followUps: [
        'How does your solution behave if the input stream is too large to fit in memory?',
        'Can we solve this in O(1) auxiliary space if the input is pre-sorted?',
      ],
      sources: CURATED_SOURCES.coding,
      verificationStatus: 'verified_doc' as const,
      uncertainties: ['Clarify whether sorting in-place is permitted by the interviewer.'],
    };
  }

  return null;
}

function markFallbackUnverified(answer: any) {
  return {
    ...answer,
    generationMode: 'local_fallback',
    verificationStatus: 'unverified',
    searchGrounded: false,
    webSearchQueries: [],
    sources: (answer.sources || []).map((source: any) => ({
      ...source,
      verificationStatus: 'unverified',
    })),
  };
}

// 1. Detect Question Endpoint
app.post('/api/interview/detect-question', async (req: Request, res: Response) => {
  try {
    const { transcript, recentSegments, currentQuestion } = req.body;
    const combinedText = (recentSegments || [])
      .map((s: { text: string }) => s.text)
      .join(' ')
      .trim();

    if (!combinedText && !transcript) {
      res.json({ hasQuestion: false });
      return;
    }

    const textToAnalyze = combinedText || transcript;

    if (!ai) {
      res.json(detectLocalQuestion(textToAnalyze, currentQuestion));
      return;
    }

    const prompt = `You are a real-time interview question detector for an engineering copilot.
Examine this recent conversation transcript fragment:
"${textToAnalyze}"

Determine if the speaker (interviewer) asked an interview question, coding challenge, system design prompt, or behavioral question.
Ignore casual conversation, small talk, and candidate answers.
If this is just an existing question already asked ("${currentQuestion || ''}"), do not trigger duplicate.

Respond with strict JSON ONLY:
{
  "hasQuestion": boolean,
  "question": string,
  "questionType": "technical" | "behavioural" | "coding" | "architecture" | "security" | "troubleshooting" | "general",
  "confidence": number
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text?.trim() || '{}';
    const parsed = JSON.parse(rawText);
    res.json(parsed);
  } catch (error: any) {
    console.error('Error detecting question:', error?.message);
    res.status(500).json({ error: 'Question detection failed', details: error?.message });
  }
});

// 2. Structured Answer with Google Search Grounding (`gemini-3.8-flash`)
app.post('/api/interview/answer', async (req: Request, res: Response) => {
  try {
    const { question, context, role, profile, useSearchGrounding = true } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    if (!ai) {
      const fallback = generateFallbackAnswer(question, role);
      if (!fallback) {
        res.status(503).json({ error: 'AI answer generation is unavailable and no local answer exists for this question.' });
        return;
      }
      res.json(markFallbackUnverified(fallback));
      return;
    }

    let searchSources: any[] = [];
    let webSearchQueries: string[] = [];

    // Execute Google Search Grounding with gemini-3.8-flash if requested
    if (useSearchGrounding) {
      try {
        const searchPrompt = `Research current best practices, official architectural standards, RFCs, and industry documentation for this technical interview question:
"${question}"
Role: ${role || 'Senior Software Engineer'}
Context: ${context || 'Technical Interview'}
Provide an authoritative factual overview and citing official technical references.`;

        const searchRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: searchPrompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        const candidate = searchRes.candidates?.[0];
        const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
        webSearchQueries = candidate?.groundingMetadata?.webSearchQueries || [];

        searchSources = groundingChunks
          .filter((chunk: any) => chunk.web?.uri)
          .map((chunk: any) => {
            let domain = 'google.com';
            try {
              domain = new URL(chunk.web.uri).hostname.replace('www.', '');
            } catch {}
            return {
              title: chunk.web.title || chunk.web.uri,
              url: chunk.web.uri,
              domain,
              excerpt: 'Retrieved via live Google Search Grounding',
              verificationStatus: 'verified_doc' as const,
            };
          });
      } catch (searchErr: any) {
        console.warn('Google Search Grounding notice:', searchErr?.message);
      }
    }

    // Generate strict JSON structured interview answer card
    const profileContext = profile
      ? JSON.stringify({
          targetRole: profile.targetRole,
          yearsOfExperience: profile.yearsOfExperience,
          primarySkills: profile.primarySkills,
          cloudPlatforms: profile.cloudPlatforms,
          frameworks: profile.frameworks,
          projects: profile.verifiedProjects,
          leadershipHighlights: profile.leadershipHighlights,
        })
      : 'No candidate-provided profile.';

    const systemPrompt = `You are the lead technical intelligence engine for Applebee Interview Intelligence.
A candidate is currently in a live engineering/technical interview for: ${role || 'Senior Software Engineer / Architect'}.
The interviewer just asked:
"${question}"

Additional conversation context: ${context || 'None'}
Candidate-reported background (not independently verified): ${profileContext}
Google Search queries analyzed: ${webSearchQueries.join(', ') || 'Standard cloud architecture'}

Never invent candidate projects, employers, years of experience, metrics, or achievements. Use only details present in the candidate-reported background; otherwise give a general technical answer or explicitly ask the candidate to supply a real example.

Provide an authoritative, high-density, glanceable interview answer that the candidate can review in 5 seconds while speaking.
Requirements:
1. "quickAnswer": Exactly 1-2 punchy, highly articulate sentences giving the core direct answer.
2. "talkingPoints": 3 to 5 concise bullet points containing recommended verbiage, architecture decisions, and metrics.
3. "explanation": Deeper technical explanation (2-3 paragraphs) detailing mechanics, protocols, and internal workings.
4. "tradeoffs": 2-3 genuine engineering tradeoffs or constraints.
5. "visualization": A structured visual model suitable for the question type:
   - For architecture/system design: { type: "architecture", title: string, description: string, data: { nodes: [{id, label, role, type: 'ingress'|'compute'|'database'|'cache'|'queue'}], edges: [{from, to, label}] } }
   - For process/troubleshooting: { type: "flowchart", title: string, description: string, data: { steps: [{id, title, action, outcome}] } }
   - For trade-offs / comparisons: { type: "comparison", title: string, description: string, data: { optionA: { name, pros: [], cons: [] }, optionB: { name, pros: [], cons: [] } } }
   - For coding / algorithms: { type: "coding", title: string, description: string, data: { timeComplexity, spaceComplexity, keyDataStructure, edgeCases: [], codeSnippet: string } }
   - For behavioral: { type: "star", title: string, description: string, data: { situation, task, action, result } }
   - For security: { type: "security_threat", title: string, description: string, data: { threats: [{ threat, attackVector, mitigation }] } }
6. "followUps": 3 realistic follow-up questions the interviewer might ask next.
7. "sources": Include genuine documentation references.
8. "verificationStatus": "verified_doc" | "consensus" | "unverified".
9. "uncertainties": Any explicit assumptions made.

Output MUST be valid JSON conforming to this schema without extra wrapping.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text?.trim() || '{}';
    let parsedAnswer;
    try {
      parsedAnswer = JSON.parse(raw);
    } catch {
      parsedAnswer = generateFallbackAnswer(question, role);
      if (!parsedAnswer) {
        res.status(502).json({ error: 'The AI answer could not be parsed and no local answer exists for this question.' });
        return;
      }
      parsedAnswer = markFallbackUnverified(parsedAnswer);
    }

    // Merge Google Search grounding chunks if retrieved
    if (searchSources.length > 0) {
      parsedAnswer.sources = [...searchSources.slice(0, 4), ...(parsedAnswer.sources || []).slice(0, 2)];
      parsedAnswer.verificationStatus = 'verified_doc';
    } else {
      parsedAnswer.sources = (parsedAnswer.sources || []).map((source: any) => ({
        ...source,
        verificationStatus: 'unverified',
      }));
      parsedAnswer.verificationStatus = 'unverified';
    }

    parsedAnswer.searchGrounded = searchSources.length > 0;
    parsedAnswer.webSearchQueries = webSearchQueries;
    parsedAnswer.generationMode = parsedAnswer.generationMode || 'ai';

    res.json(parsedAnswer);
  } catch (error: any) {
    console.error('Error generating answer:', error?.message);
    const question = req.body.question || '';
    const fallback = generateFallbackAnswer(question, req.body.role);
    if (!fallback) {
      res.status(502).json({ error: 'AI answer generation failed and no local answer exists for this question.' });
      return;
    }
    res.json(markFallbackUnverified(fallback));
  }
});

// 3. Dedicated Google Search Grounding Query Endpoint
app.post('/api/interview/search-grounding', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    if (!ai) {
      res.status(503).json({
        query,
        error: 'Search grounding is unavailable because GEMINI_API_KEY is not configured.',
        summary: '',
        sources: [],
        webSearchQueries: [],
        searchGrounded: false,
        verificationStatus: 'unverified',
      });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Provide an accurate, grounded summary with real documentation and RFC references for: "${query}".`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const candidate = response.candidates?.[0];
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
    const webSearchQueries = candidate?.groundingMetadata?.webSearchQueries || [];

    const sources = groundingChunks
      .filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => {
        let domain = 'web';
        try {
          domain = new URL(chunk.web.uri).hostname.replace('www.', '');
        } catch {}
        return {
          title: chunk.web.title || chunk.web.uri,
          url: chunk.web.uri,
          domain,
          excerpt: 'Verified live web reference via Google Search Grounding',
          verificationStatus: 'verified_doc' as const,
        };
      });

    res.json({
      query,
      summary: response.text || '',
      sources,
      webSearchQueries,
      searchGrounded: sources.length > 0,
      verificationStatus: sources.length > 0 ? 'verified_doc' : 'unverified',
    });
  } catch (err: any) {
    console.warn('Search grounding API notice (quota/network):', err?.message);
    res.status(502).json({
      error: 'Search grounding failed. No verified sources are available for this query.',
      summary: '',
      sources: [],
      webSearchQueries: [],
      searchGrounded: false,
      verificationStatus: 'unverified',
    });
  }
});

// 4. Mock Interview Answer Evaluation Endpoint (P1 Rubric Evaluation)
app.post('/api/interview/evaluate-answer', async (req: Request, res: Response) => {
  try {
    const { question, candidateAnswer, role, profile } = req.body;

    if (!question || !candidateAnswer) {
      res.status(400).json({ error: 'question and candidateAnswer are required' });
      return;
    }

    if (!ai) {
      // High-grade heuristic evaluation
      const length = candidateAnswer.trim().split(/\s+/).length;
      const mentionsTradeoffs = /tradeoff|limitation|latency|scale|cost|consistency/i.test(candidateAnswer);
      const mentionsMetrics = /\d+%|\d+ms|qps|sla|p99/i.test(candidateAnswer);

      const baseScore = Math.min(94, Math.max(68, Math.round(50 + (length / 8) + (mentionsTradeoffs ? 15 : 5) + (mentionsMetrics ? 12 : 4))));

      res.json({
        score: baseScore,
        evaluationMode: 'heuristic',
        feedback: `Strong technical structure. Your answer articulates core operational realities with clear prioritization. ${mentionsTradeoffs ? 'Good identification of architectural trade-offs.' : 'Consider proactively noting edge-case trade-offs.'}`,
        rubricScores: {
          clarityAndStructure: Math.min(100, baseScore + 2),
          technicalDepth: Math.min(100, baseScore - 1),
          tradeoffsArticulation: mentionsTradeoffs ? 88 : 70,
          productionReadiness: mentionsMetrics ? 90 : 75,
        },
        strengths: [
          'Directly addresses the primary question prompt without deflection.',
          'Frames abstractions around production-grade deployment standards.',
        ],
        improvements: [
          'Quantify SLAs (e.g. p99 latency target < 5ms) earlier in the response.',
          'Elaborate on failover strategy in the event of cross-zone network partition.',
        ],
      });
      return;
    }

    const evalPrompt = `You are a Principal Engineering Bar Raiser evaluating a candidate's answer in a live mock interview.
Target Role: ${role || 'Staff Engineer'}
Interview Question: "${question}"
Candidate Answer: "${candidateAnswer}"
Candidate-reported background (not independently verified): ${profile?.targetRole || 'not provided'}, ${profile?.yearsOfExperience ?? 'unspecified'} years experience.

Evaluate the response across 4 criteria (each 0-100):
1. clarityAndStructure (STAR framework / logical progression)
2. technicalDepth (precision of abstractions, protocols, mechanisms)
3. tradeoffsArticulation (acknowledging trade-offs and alternative designs)
4. productionReadiness (observability, reliability, scalability metrics)

Output strict JSON ONLY:
{
  "score": number (weighted overall 0-100),
  "feedback": string (2-3 sentences concise bar raiser assessment),
  "rubricScores": {
    "clarityAndStructure": number,
    "technicalDepth": number,
    "tradeoffsArticulation": number,
    "productionReadiness": number
  },
  "strengths": string[] (2-3 bullet items),
  "improvements": string[] (2-3 concrete revision suggestions)
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: evalPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({ ...parsed, evaluationMode: 'ai' });
  } catch (error: any) {
    console.error('Answer evaluation error:', error?.message);
    res.status(502).json({ error: 'AI answer evaluation failed. Please retry when the evaluation service is available.' });
  }
});

// 4. WebSocket Server for Real-Time Gemini 3.8 Live Voice Conversations
wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[Gemini 3.8 Live API] Client connected to live voice session');

  let liveSession: any = null;

  if (ai) {
    try {
      liveSession = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
          // Real-time transcription for spoken voice responses
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction:
            'You are the Applebee Live Interview Voice Intelligence Copilot. You converse in real time with technical interview candidates. Keep voice responses glanceable, punchy, crisp, and senior-level.',
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts || [];
            let modelText = '';
            let audioData: string | undefined;

            for (const part of parts as any[]) {
              if (part.text) {
                modelText += part.text;
              }
              if (part.inlineData?.data) {
                audioData = part.inlineData.data;
              }
            }

            const outputTrans = (message.serverContent as any)?.outputAudioTranscription?.text;
            const inputTrans = (message.serverContent as any)?.inputTranscription?.text;
            const transcription = modelText || outputTrans;

            if (clientWs.readyState === WebSocket.OPEN) {
              if (inputTrans) {
                clientWs.send(
                  JSON.stringify({
                    transcription: inputTrans,
                    turnComplete: true,
                    role: 'unknown',
                  })
                );
              }
              if (audioData || transcription) {
                clientWs.send(
                  JSON.stringify({
                    audio: audioData,
                    transcription: transcription || undefined,
                    turnComplete: message.serverContent?.turnComplete,
                    role: 'model',
                  })
                );
              }
              if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ interrupted: true }));
              }
            }
          },
        },
      });

      clientWs.send(
        JSON.stringify({
          status: 'connected',
          model: 'gemini-3.8-live',
          voice: 'Zephyr',
        })
      );
    } catch (err: any) {
      console.warn('[Gemini Live API] Connect warning:', err?.message);
      clientWs.send(
        JSON.stringify({
          status: 'unavailable',
          message: 'The Live Voice provider connection failed. Check the server key, model access, and network logs.',
        })
      );
    }
  } else {
    clientWs.send(
      JSON.stringify({
        status: 'unavailable',
        message: 'Live Voice requires GEMINI_API_KEY. Configure the server key and restart the app.',
      })
    );
  }

  clientWs.on('message', async (data: Buffer | string) => {
    try {
      const parsed = JSON.parse(data.toString());

      // If client sent audio PCM chunk (16kHz)
      if (parsed.audio && liveSession) {
        liveSession.sendRealtimeInput({
          audio: {
            data: parsed.audio,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      }

      // If client sent text prompt or voice question to Live API
      if (parsed.text && liveSession) {
        liveSession.sendRealtimeInput({
          text: parsed.text,
        });
      }

      // Simulated voice response loop for testing and offline environments
      if (parsed.simulateVoiceResponse && clientWs.readyState === WebSocket.OPEN) {
        const spokenChunks = [
          'For a scalable .NET API on Azure, client ingress passes through Azure API Management.',
          'The gateway enforces JWT validation and rate limiting before forwarding to ASP.NET Core API microservices.',
          'Stateful operations use read-through Azure Cache for Redis to guarantee sub-5ms p99 response times.',
          'Persistence is partitioned across Azure SQL and Cosmos DB with Polly handling transient retry resilience.',
        ];

        for (let i = 0; i < spokenChunks.length; i++) {
          setTimeout(() => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  transcription: spokenChunks[i],
                  turnComplete: i === spokenChunks.length - 1,
                  role: 'model',
                })
              );
            }
          }, i * 1200);
        }
      }
    } catch (e) {
      // Ignore audio parsing jitter
    }
  });

  clientWs.on('close', () => {
    console.log('[Gemini 3.8 Live API] Client disconnected');
    if (liveSession && typeof liveSession.close === 'function') {
      try {
        liveSession.close();
      } catch {}
    }
  });

  clientWs.on('error', (err) => {
    console.warn('[Gemini Live API] WebSocket error:', err.message);
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = await findAvailablePort(DEFAULT_PORT);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Applebee Live Interview server running at http://0.0.0.0:${PORT}`);
    console.log(`Gemini 3.8 Live API WebSocket available at ws://0.0.0.0:${PORT}/live`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start Applebee server:', error);
  process.exit(1);
});
