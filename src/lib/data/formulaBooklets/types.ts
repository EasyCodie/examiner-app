export interface FormulaItem {
  id: string; // e.g. "math-aa-sec-5-5" or "pl-triangle-area"
  code: string; // e.g. "SL 5.5", "AHL 5.16", "Prior Learning"
  title: string; // e.g. "Integral of x^n", "Integration by parts"
  latex: string; // KaTeX math expression
  variablesDescription?: string; // e.g. "where b is the base, h is the height"
  topicNumber: number; // 0 for Prior Learning, 1 to 5 for topics
  isAhl?: boolean; // true if Higher Level only
  keywords: string[]; // Search terms e.g. ["integral", "power rule", "calculus", "polynomial"]
}

export interface FormulaTopic {
  number: number; // 0 for Prior Learning, 1 to 5
  name: string; // e.g. "Topic 1: Number and algebra"
  shortName: string; // e.g. "1. Number & Algebra"
  subsections: FormulaItem[];
}

export interface FormulaBooklet {
  id: string; // e.g. "math_aa"
  title: string; // "Mathematics: analysis and approaches formula booklet"
  curriculum: string; // "Diploma Programme"
  version: string; // "Version 1.3"
  firstExaminationsYear: number; // 2021
  subjectCodes: string[]; // ["MATH_AA_HL", "MATH_AA_SL", "MATH_AA"]
  priorLearning: FormulaItem[];
  topics: FormulaTopic[];
}
