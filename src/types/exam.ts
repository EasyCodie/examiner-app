export type SubjectCategory = 'STEM' | 'HUMANITIES';

export type MarkType = 'M' | 'A' | 'R' | 'N' | 'AG' | 'FT';

export interface MarkCodeItem {
  code: string; // e.g. "M1", "A1", "R1", "N2", "AG"
  type: MarkType;
  description: string;
  marks: number;
}

export interface QuestionDiagram {
  hasDiagram: boolean;
  type?: 'function_graph' | 'geometric_figure' | 'coordinate_grid' | 'tree_diagram' | 'physics_circuit' | 'other';
  title?: string;
  svgContent?: string;
  description?: string;
}

export interface SubQuestionPart {
  id: string; // e.g. "q1_a", "q1_b"
  partLetter: string; // e.g. "(a)", "(b)", "(a)(i)", "(b)"
  totalMarks: number;
  commandTerm: string;
  promptText: string;
  markCodes: MarkCodeItem[];
  markschemeExcerpt: string;
  ecfRules?: string;
  diagram?: QuestionDiagram;
}

export interface QuestionItem {
  id: string; // e.g. "q1"
  number: string; // e.g. "1", "2"
  pageNumber: number; // Page in the question paper (1-indexed)
  totalMarks: number;
  commandTerm: string; // e.g. "Calculate", "Show that", "Find", "Evaluate", "Justify"
  syllabusSubtopic: string; // e.g. "Topic 5.5: Definite integrals & fundamental theorem of calculus"
  formulaBookletRef?: string; // e.g. "Section 5.3, page 14: Integration by parts"
  promptText: string;
  markCodes: MarkCodeItem[];
  ecfRules?: string; // e.g. "Award FT marks for subsequent steps if arithmetic error in part (a) is correctly carried forward."
  markschemeExcerpt: string;
  diagramRequired?: boolean;
  diagram?: QuestionDiagram;
  subparts?: SubQuestionPart[];
}

export interface ExamManifest {
  id: string; // Unique slug
  title: string; // e.g. "Mathematics: analysis and approaches HL"
  subtitle: string; // e.g. "Paper 1 (Non-Calculator) - May 2024"
  subjectCode: string; // e.g. "MATH_AA_HL_P1"
  category: SubjectCategory;
  durationMinutes: number;
  totalMarks: number;
  readingTimeMinutes?: number;
  instructions: string[];
  gradeBoundaries: {
    grade7: number; // Min percentage or marks
    grade6: number;
    grade5: number;
    grade4: number;
    grade3: number;
    grade2: number;
    grade1: number;
  };
  questions: QuestionItem[];
  createdAt: string;
  isBundled?: boolean;
}

export interface CanvasStroke {
  points: { x: number; y: number; pressure?: number }[];
  color: string;
  width: number;
  tool: 'pen' | 'highlighter' | 'eraser';
  timestamp?: number;
  boxId?: string;
}

export interface PageStrokes {
  pageNumber: number;
  strokes: CanvasStroke[];
  undoStack: CanvasStroke[][];
  redoStack: CanvasStroke[][];
}

export interface QuestionSubmission {
  questionId: string;
  questionNumber: string;
  canvasImageBase64?: string; // Rendered composite image of working
  subpartImages?: Record<string, string>; // Rendered image per subpart box
  boxStrokes?: Record<string, CanvasStroke[]>; // Vector strokes per box
  textResponse?: string; // Essay response for humanities
  diagramImageBase64?: string; // Optional sketchpad image for humanities
  timeSpentSeconds: number;
}

export interface AwardedMarkItem {
  code: string;
  type: MarkType;
  awarded: boolean;
  marksAwarded: number;
  maxMarks: number;
  reason: string;
  isEcfApplied?: boolean;
}

export interface QuestionGrading {
  questionId: string;
  questionNumber: string;
  marksAwarded: number;
  maxMarks: number;
  examinerNotes: string;
  marginAnnotations: {
    label: string;
    type: 'tick' | 'cross' | 'ecf' | 'comment';
    text: string;
    coordinate?: { x: number; y: number };
  }[];
  markBreakdown: AwardedMarkItem[];
  ecfApplied: boolean;
  ecfExplanation?: string;
  syllabusSubtopic: string;
  subtopicMasteryScore: number; // 0 to 100%
  revisionRecommendation: string;
}

export interface ExamSession {
  id: string;
  paperId: string;
  paperTitle: string;
  subjectCategory: SubjectCategory;
  mode: 'TIMED_MOCK' | 'SOCRATIC_LEARN';
  startedAt: string;
  submittedAt?: string;
  timeRemainingSeconds: number;
  durationSeconds: number;
  submissions: Record<string, QuestionSubmission>; // questionId -> submission
  gradingResults?: {
    totalMarksAwarded: number;
    totalPossibleMarks: number;
    percentage: number;
    predictedGrade: number; // 1 to 7
    reasoningEffortUsed: 'high' | 'minimal';
    evaluations: QuestionGrading[];
    syllabusBreakdown: {
      subtopic: string;
      marksAwarded: number;
      totalMarks: number;
      percentage: number;
      status: 'mastered' | 'developing' | 'critical';
      targetedDrillPrompt: string;
    }[];
  };
}

export type PedagogicalTier = 1 | 2 | 3 | 4;

export interface SocraticMessage {
  id: string;
  sender: 'student' | 'tutor';
  text: string;
  timestamp: string;
  tierActive?: PedagogicalTier;
  formulaQuote?: string;
  diagnosticHighlight?: string;
  unlockedMarkscheme?: boolean;
}

export interface AiStudioConfig {
  modelName: string;
  gradingReasoningEffort: 'high' | 'medium' | 'low';
  socraticReasoningEffort: 'minimal' | 'low';
  thinkingBudgetGrading: number; // e.g. 16384 tokens
  thinkingBudgetSocratic: number; // e.g. 0 or 1024 tokens
  temperature: number;
  apiKey?: string;
}
