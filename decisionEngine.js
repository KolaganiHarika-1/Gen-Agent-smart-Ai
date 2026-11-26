const rules = [
  { words: ['urgent', 'asap', 'deadline', 'today'], priority: 'High', reason: 'Time-sensitive language detected.' },
  { words: ['customer', 'client', 'payment', 'production'], priority: 'High', reason: 'Customer or business-critical work detected.' },
  { words: ['plan', 'prepare', 'review', 'meeting'], priority: 'Medium', reason: 'Planning or review activity detected.' }
];

export function createDecision(input) {
  const text = String(input || '').trim();
  if (text.length < 8) {
    const error = new Error('Please describe your situation in at least 8 characters.');
    error.status = 400;
    throw error;
  }

  const lower = text.toLowerCase();
  const matched = rules.find(rule => rule.words.some(word => lower.includes(word)));
  const priority = matched?.priority || 'Medium';

  const steps = [
    'Clarify the desired outcome and any constraints.',
    'Break the work into small, verifiable actions.',
    'Complete the highest-priority action first.',
    'Review the result and update the task status.'
  ];

  if (priority === 'High') steps.unshift('Confirm the deadline and address the most time-sensitive risk first.');

  return {
    summary: `Recommended approach: handle this as a ${priority.toLowerCase()}-priority item.`,
    priority,
    rationale: matched?.reason || 'No explicit urgency keywords were found, so a balanced priority is recommended.',
    steps,
    risks: ['Missing information may change the recommendation.', 'Review the plan before taking consequential action.'],
    generatedBy: 'GenAgent local decision engine'
  };
}