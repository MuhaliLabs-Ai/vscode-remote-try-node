export function generateConceptFallbackAnswer(question: string) {
  if (!/polymorph/i.test(question)) return null;

  return {
    question,
    questionType: 'technical' as const,
    quickAnswer:
      'Polymorphism lets code use a shared base type or interface while the concrete object supplies the behavior. In C#, virtual dispatch selects an override at runtime, so callers can work with different implementations through one contract.',
    talkingPoints: [
      'Define a contract with an interface or an abstract/base class.',
      'Implement or override the operation in concrete types; virtual dispatch chooses the implementation for the actual object.',
      'Keep callers dependent on the abstraction, which makes implementations replaceable and easier to test.',
      'Distinguish runtime overriding from compile-time overloading, where the compiler chooses a method by its signature.',
    ],
    explanation:
      'For example, an INotifier interface can expose Send(message). EmailNotifier and SmsNotifier implement that operation differently. A method accepting INotifier can call Send without knowing which concrete type it received; the runtime dispatches the call to that type’s implementation. This is useful for extensibility and dependency inversion, but excessive indirection can make control flow harder to follow.',
    tradeoffs: [
      'Abstractions reduce coupling and simplify substitution, but add indirection and can obscure the concrete behavior during debugging.',
      'Use an interface or virtual method when implementations genuinely vary; a single implementation does not automatically need another abstraction.',
    ],
    visualization: {
      type: 'comparison',
      title: 'C# Polymorphism: Runtime Dispatch vs Overloading',
      description: 'Two ways a call can resolve to behavior in C#.',
      data: {
        optionA: {
          name: 'Overriding (runtime)',
          pros: ['Works through a base type or interface', 'Concrete implementation chosen at runtime'],
          cons: ['Requires an explicit virtual/interface contract', 'Can add indirection'],
        },
        optionB: {
          name: 'Overloading (compile time)',
          pros: ['Convenient APIs for different parameter signatures', 'Resolved by the compiler'],
          cons: ['Does not substitute behavior by runtime object type', 'Can become ambiguous with broad overload sets'],
        },
      },
    },
    followUps: [
      'What is the difference between an interface and an abstract class in C#?',
      'How does virtual method dispatch work in C#?',
      'When would you prefer composition over inheritance?',
    ],
    sources: [
      {
        title: 'Microsoft Learn: Polymorphism in C#',
        url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/polymorphism',
        domain: 'learn.microsoft.com',
        excerpt: 'C# language documentation for polymorphism and virtual method behavior.',
        verificationStatus: 'unverified' as const,
      },
    ],
    verificationStatus: 'unverified' as const,
    uncertainties: ['Local reference answer; live AI generation and search grounding were not used.'],
    searchGrounded: false,
    webSearchQueries: [],
    generationMode: 'local_fallback' as const,
  };
}