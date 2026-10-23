import assert from 'node:assert/strict';
import { generateConceptFallbackAnswer } from '../services/answerFallback';
import { detectLocalQuestion } from '../services/questionDetection';
import { getSpeechSegmentId } from '../services/speechRecognition';
import { isSpokenEntityActive, mapSpokenTranscriptToVisual } from '../utils/voiceVisualMapper';
import type { VisualizationModel } from '../types/interview';

let passed = 0;

function test(name: string, run: () => void) {
  run();
  passed++;
  console.log(`PASS ${passed}: ${name}`);
}

test('polymorphism fallback explains C# runtime dispatch', () => {
  const answer = generateConceptFallbackAnswer('what is polymorphism');
  assert.ok(answer);
  assert.match(answer.quickAnswer, /runtime/i);
  assert.match(answer.explanation, /INotifier/);
  assert.doesNotMatch(`${answer.quickAnswer} ${answer.explanation}`, /REST|gRPC|event broker|consistency/i);
});

test('local fallback identifies itself and does not claim verified sources', () => {
  const answer = generateConceptFallbackAnswer('Explain polymorphism in C#');
  assert.ok(answer);
  assert.equal(answer.generationMode, 'local_fallback');
  assert.equal(answer.verificationStatus, 'unverified');
  assert.equal(answer.searchGrounded, false);
  assert.ok(answer.sources.every((source) => source.verificationStatus === 'unverified'));
});

test('polymorphism fallback declines unrelated topics', () => {
  assert.equal(generateConceptFallbackAnswer('How does Azure API Management work?'), null);
});

test('local question detection ignores ordinary statements', () => {
  assert.deepEqual(detectLocalQuestion('I worked with Redis and .NET services'), { hasQuestion: false });
});

test('local question detection recognizes a direct question', () => {
  const result = detectLocalQuestion('What is polymorphism?');
  assert.equal(result.hasQuestion, true);
  assert.equal(result.question, 'What is polymorphism?');
  assert.equal(result.questionType, 'technical');
});

test('local question detection deduplicates an already answered question', () => {
  assert.equal(detectLocalQuestion('What is polymorphism?', 'What is polymorphism?').hasQuestion, false);
});

test('local question detection classifies architecture prompts', () => {
  assert.equal(detectLocalQuestion('How would you design a scalable API?').questionType, 'architecture');
});

test('local question detection classifies behavioral prompts', () => {
  assert.equal(detectLocalQuestion('Tell me about a time you resolved a conflict').questionType, 'behavioural');
});

test('browser speech interim and final results reuse one transcript segment ID', () => {
  const interimId = getSpeechSegmentId(null, () => 'segment-1');
  const finalId = getSpeechSegmentId(interimId, () => 'segment-2');
  assert.equal(finalId, interimId);
});

test('voice mapper recognizes spoken Azure architecture entities', () => {
  const result = mapSpokenTranscriptToVisual(
    'Requests pass Azure API Management and ASP.NET Core before Redis and Azure SQL.',
    null
  );
  assert.ok(result.activeEntities.includes('Azure API Management'));
  assert.ok(result.activeEntities.includes('ASP.NET Core API'));
  assert.ok(result.activeEntities.includes('Azure Cache for Redis'));
  assert.equal(result.visualization.type, 'architecture');
});

test('voice mapper adds newly spoken infrastructure to an existing diagram', () => {
  const current: VisualizationModel = {
    type: 'architecture',
    title: 'Existing topology',
    description: '',
    data: { nodes: [{ id: '1', label: 'ASP.NET Core API', type: 'compute' }], edges: [] },
  };
  const result = mapSpokenTranscriptToVisual('The service reads through Redis.', current);
  assert.ok(result.visualization.data.nodes.some((node: { label: string }) => node.label === 'Azure Cache for Redis'));
  assert.equal(result.visualization.data.edges.length, 1);
});

test('voice mapper tracks the STAR result section', () => {
  const result = mapSpokenTranscriptToVisual('The result was a lower incident rate.', null, 'behavioural');
  assert.equal(result.visualization.type, 'star');
  assert.deepEqual(result.activeEntities, ['Result']);
});

test('spoken entity matching handles labels case-insensitively', () => {
  assert.equal(isSpokenEntityActive('Azure Cache for Redis', ['azure cache for redis']), true);
});

test('spoken entity matching returns false for unrelated entities', () => {
  assert.equal(isSpokenEntityActive('Azure SQL', ['Azure Cache for Redis']), false);
});

console.log(`\n${passed} application behavior tests passed.`);