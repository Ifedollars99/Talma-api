// Practice-test content: the faculty / department structure and the shared
// question pool used by the "Take a Test" flow.

export interface TestFaculty {
  id: number
  name: string
  departments: { id: number; name: string }[]
}

export interface TestQuestion {
  id: number
  question: string
  options: string[]
  correctIndex: number
}

export const testFaculties: TestFaculty[] = [
  {
    id: 1,
    name: 'Faculty of Science',
    departments: [
      { id: 101, name: 'Computer Science' },
      { id: 102, name: 'Data Engineering' },
      { id: 103, name: 'Engineering' },
      { id: 104, name: 'Cybersecurity' },
      { id: 105, name: 'Machine Learning' },
    ],
  },
  {
    id: 2,
    name: 'Faculty of Arts',
    departments: [
      { id: 201, name: 'English Language' },
      { id: 202, name: 'History' },
      { id: 203, name: 'Philosophy' },
    ],
  },
  {
    id: 3,
    name: 'Faculty of Social Sciences',
    departments: [
      { id: 301, name: 'Economics' },
      { id: 302, name: 'Political Science' },
      { id: 303, name: 'Mass Communication' },
    ],
  },
  {
    id: 4,
    name: 'Faculty of Management Sciences',
    departments: [
      { id: 401, name: 'Accounting' },
      { id: 402, name: 'Business Administration' },
      { id: 403, name: 'Marketing' },
    ],
  },
]

export const questionPool: TestQuestion[] = [
  {
    id: 1,
    question: 'What does CPU stand for?',
    options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Central Processor Unicode'],
    correctIndex: 0,
  },
  {
    id: 2,
    question: 'Which language runs in a web browser?',
    options: ['Java', 'C', 'Python', 'JavaScript'],
    correctIndex: 3,
  },
  {
    id: 3,
    question: 'What is the capital of Nigeria?',
    options: ['Lagos', 'Abuja', 'Ibadan', 'Kano'],
    correctIndex: 1,
  },
  {
    id: 4,
    question: 'H2O is the chemical formula for what?',
    options: ['Oxygen', 'Hydrogen', 'Water', 'Salt'],
    correctIndex: 2,
  },
  {
    id: 5,
    question: 'Which of these is a prime number?',
    options: ['4', '6', '9', '7'],
    correctIndex: 3,
  },
  {
    id: 6,
    question: 'Who is known as the father of computers?',
    options: ['Charles Babbage', 'Alan Turing', 'Bill Gates', 'Steve Jobs'],
    correctIndex: 0,
  },
  {
    id: 7,
    question: 'What is the powerhouse of the cell?',
    options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Cytoplasm'],
    correctIndex: 1,
  },
  {
    id: 8,
    question: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Jupiter', 'Mars', 'Saturn'],
    correctIndex: 2,
  },
  {
    id: 9,
    question: 'What does HTML stand for?',
    options: [
      'Hyper Trainer Marking Language',
      'HyperText Markup Language',
      'HyperText Machine Language',
      'Hyperlink Text Markup Language',
    ],
    correctIndex: 1,
  },
  {
    id: 10,
    question: 'Which gas do plants absorb from the atmosphere?',
    options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
    correctIndex: 2,
  },
  {
    id: 11,
    question: 'What is 12 x 8?',
    options: ['96', '86', '106', '94'],
    correctIndex: 0,
  },
  {
    id: 12,
    question: 'Which of these is an operating system?',
    options: ['Microsoft Word', 'Windows', 'Excel', 'Chrome'],
    correctIndex: 1,
  },
  {
    id: 13,
    question: 'Who wrote "Things Fall Apart"?',
    options: ['Wole Soyinka', 'Chinua Achebe', 'Chimamanda Adichie', 'Ben Okri'],
    correctIndex: 1,
  },
  {
    id: 14,
    question: 'What is the boiling point of water at sea level (°C)?',
    options: ['90', '100', '110', '120'],
    correctIndex: 1,
  },
  {
    id: 15,
    question: 'Which currency is used in Nigeria?',
    options: ['Cedi', 'Naira', 'Rand', 'Franc'],
    correctIndex: 1,
  },
]
