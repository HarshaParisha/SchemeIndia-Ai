export type Room = { id: string; name: string; category: string; description?: string }

export const ROOMS: Room[] = [
  {
    id: 'exam-stress',
    name: 'Exam Stress',
    category: 'Students',
    description: 'A quiet corner for pressure, fear, and last-minute panic — without judgment.',
  },
  {
    id: 'family-pressure',
    name: 'Family Pressure',
    category: 'Support',
    description: 'When expectations feel heavy and you need a kinder perspective.',
  },
  {
    id: 'career-confusion',
    name: 'Career Confusion',
    category: 'Students',
    description: 'Ask anything about options, paths, and “what should I do next?”.',
  },
  {
    id: 'first-job-anxiety',
    name: 'First Job Anxiety',
    category: 'Working Life',
    description: 'For interviews, office worries, and the “am I good enough?” days.',
  },
  {
    id: 'general-support',
    name: 'General Support',
    category: 'Support',
    description: 'A gentle room for anything you want to share.',
  },
  {
    id: 'farmer-community',
    name: 'Farmer Community',
    category: 'Farmers',
    description: 'Talk crop decisions, weather stress, loans, insurance, and schemes.',
  },
]
