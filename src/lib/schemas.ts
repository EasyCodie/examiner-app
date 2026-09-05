// JSON Schemas for Gemini 3.8 Flash structured outputs via @google/genai

export const MANIFEST_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Subject title (e.g. Mathematics: analysis and approaches HL)' },
    subtitle: { type: 'string', description: 'Session and paper details (e.g. Paper 1 Non-Calculator May 2024)' },
    subjectCode: { type: 'string', description: 'Short subject code (e.g. MATH_AA_HL_P1)' },
    category: { type: 'string', enum: ['STEM', 'HUMANITIES'], description: 'STEM for math/sciences (canvas overlay), HUMANITIES for essays (split-screen editor)' },
    durationMinutes: { type: 'integer', description: 'Official exam duration in minutes' },
    totalMarks: { type: 'integer', description: 'Total possible marks on this paper' },
    instructions: {
      type: 'array',
      items: { type: 'string' },
      description: 'Exam paper instructions'
    },
    gradeBoundaries: {
      type: 'object',
      properties: {
        grade7: { type: 'integer', description: 'Minimum percentage for Grade 7' },
        grade6: { type: 'integer', description: 'Minimum percentage for Grade 6' },
        grade5: { type: 'integer', description: 'Minimum percentage for Grade 5' },
        grade4: { type: 'integer', description: 'Minimum percentage for Grade 4' },
        grade3: { type: 'integer', description: 'Minimum percentage for Grade 3' },
        grade2: { type: 'integer', description: 'Minimum percentage for Grade 2' },
        grade1: { type: 'integer', description: 'Minimum percentage for Grade 1' }
      },
      required: ['grade7', 'grade6', 'grade5', 'grade4', 'grade3', 'grade2', 'grade1']
    },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique question id e.g. q1, q2_a' },
          number: { type: 'string', description: 'Human readable question label e.g. 1, 1(a), 2, 2(b)' },
          pageNumber: { type: 'integer', description: 'Sequential page index where this question appears (1-indexed, starting at Page 1 for the first question page. Exclude cover/instruction pages)' },
          totalMarks: { type: 'integer', description: 'Total marks for this specific sub-question' },
          commandTerm: { type: 'string', description: 'Official IB command term (Calculate, Find, Show that, Evaluate, Justify, Explain, Discuss)' },
          syllabusSubtopic: { type: 'string', description: 'Syllabus subtopic code and description (e.g. Topic 5.5: Integration by substitution)' },
          formulaBookletRef: { type: 'string', description: 'Formula booklet section reference if relevant' },
          promptText: { type: 'string', description: 'Complete prompt and equation text of the question, with all mathematical expressions strictly formatted in standard LaTeX using $...$ for inline math or $$...$$ for display equations' },
          markCodes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                code: { type: 'string', description: 'Mark code e.g. M1, A1, R1, N2, AG' },
                type: { type: 'string', enum: ['M', 'A', 'R', 'N', 'AG', 'FT'], description: 'M=Method, A=Accuracy, R=Reasoning, N=No working, AG=Answer given, FT=Follow through' },
                marks: { type: 'integer', description: 'Number of marks allocated to this code' },
                description: { type: 'string', description: 'Exact requirement from the markscheme to award this mark' }
              },
              required: ['code', 'type', 'marks', 'description']
            }
          },
          ecfRules: { type: 'string', description: 'Error carried forward rules from markscheme notes' },
          markschemeExcerpt: { type: 'string', description: 'Authoritative markscheme text and acceptable answers, with mathematical expressions formatted in standard LaTeX' },
          diagram: {
            type: 'object',
            properties: {
              hasDiagram: { type: 'boolean', description: 'True if this question contains a diagram, function graph, coordinate grid, or geometric figure' },
              type: { type: 'string', enum: ['function_graph', 'geometric_figure', 'coordinate_grid', 'tree_diagram', 'physics_circuit', 'other'] },
              title: { type: 'string' },
              svgContent: { type: 'string', description: 'Clean, standalone SVG markup reproducing the diagram/graph/axes with exact coordinates, curves, labels, and ticks from the paper' },
              description: { type: 'string', description: 'Detailed mathematical description of the diagram and coordinate points' }
            },
            required: ['hasDiagram']
          },
          subparts: {
            type: 'array',
            description: 'If the question has distinct subquestions (e.g. (a), (b), (c)), provide each subpart so they render as scrollable subquestion cards',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Subpart id e.g. q1_a, q1_b' },
                partLetter: { type: 'string', description: 'Part identifier e.g. (a), (b), (i), (ii)' },
                totalMarks: { type: 'integer', description: 'Marks for this specific subpart' },
                commandTerm: { type: 'string' },
                promptText: { type: 'string', description: 'Prompt and equations for this subpart in LaTeX' },
                markCodes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      code: { type: 'string' },
                      type: { type: 'string', enum: ['M', 'A', 'R', 'N', 'AG', 'FT'] },
                      marks: { type: 'integer' },
                      description: { type: 'string' }
                    },
                    required: ['code', 'type', 'marks', 'description']
                  }
                },
                markschemeExcerpt: { type: 'string' },
                ecfRules: { type: 'string' },
                diagram: {
                  type: 'object',
                  properties: {
                    hasDiagram: { type: 'boolean', description: 'True if this subpart contains a diagram, function graph, coordinate grid, or geometric figure' },
                    type: { type: 'string', enum: ['function_graph', 'geometric_figure', 'coordinate_grid', 'tree_diagram', 'physics_circuit', 'other'] },
                    title: { type: 'string' },
                    svgContent: { type: 'string', description: 'Clean, standalone SVG markup reproducing the diagram/graph/axes with exact coordinates, curves, labels, and ticks from the paper' },
                    description: { type: 'string', description: 'Detailed mathematical description of the diagram and coordinate points' }
                  },
                  required: ['hasDiagram']
                }
              },
              required: ['id', 'partLetter', 'totalMarks', 'commandTerm', 'promptText', 'markCodes', 'markschemeExcerpt']
            }
          }
        },
        required: ['id', 'number', 'pageNumber', 'totalMarks', 'commandTerm', 'syllabusSubtopic', 'promptText', 'markCodes', 'markschemeExcerpt']
      }
    }
  },
  required: ['title', 'subtitle', 'subjectCode', 'category', 'durationMinutes', 'totalMarks', 'instructions', 'gradeBoundaries', 'questions']
};

export const QUESTION_EVALUATION_SCHEMA = {
  type: 'object',
  properties: {
    questionId: { type: 'string' },
    questionNumber: { type: 'string' },
    marksAwarded: { type: 'integer', description: 'Total marks awarded for this question attempt' },
    maxMarks: { type: 'integer', description: 'Total possible marks' },
    subpartScores: {
      type: 'object',
      description: 'Granular scores per lettered subpart e.g. "(a)", "(b)", "(c)" if the question has subquestions',
      additionalProperties: {
        type: 'object',
        properties: {
          marksAwarded: { type: 'integer', description: 'Marks awarded for this subpart' },
          maxMarks: { type: 'integer', description: 'Maximum marks for this subpart' },
          ecfApplied: { type: 'boolean', description: 'True if Error Carried Forward was credited in this subpart' },
          reason: { type: 'string', description: 'Examiner justification for this subpart score' }
        },
        required: ['marksAwarded', 'maxMarks']
      }
    },
    examinerNotes: { type: 'string', description: 'Senior IB examiner feedback detailing the student\'s mathematical/economic reasoning' },
    marginAnnotations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Annotation label e.g. M1 awarded, A0 lost, ECF applied' },
          type: { type: 'string', enum: ['tick', 'cross', 'ecf', 'comment'] },
          text: { type: 'string', description: 'Brief annotation note' },
          subpartPartLetter: { type: 'string', description: 'Part letter e.g. "(a)", "(b)" this annotation belongs to' }
        },
        required: ['label', 'type', 'text']
      }
    },
    markBreakdown: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Mark code evaluated (e.g. M1, A1, R1)' },
          type: { type: 'string', enum: ['M', 'A', 'R', 'N', 'AG', 'FT'] },
          awarded: { type: 'boolean', description: 'Whether this specific mark is awarded' },
          marksAwarded: { type: 'integer', description: 'Marks awarded for this code (usually 1 or 0)' },
          maxMarks: { type: 'integer' },
          reason: { type: 'string', description: 'Detailed justification citing student working and markscheme' },
          isEcfApplied: { type: 'boolean', description: 'True if error carried forward rule was applied to prevent double penalty' }
        },
        required: ['code', 'type', 'awarded', 'marksAwarded', 'maxMarks', 'reason']
      }
    },
    ecfApplied: { type: 'boolean', description: 'True if error carried forward was triggered on this question' },
    ecfExplanation: { type: 'string', description: 'Explanation of how the upstream error was propagated without penalty' },
    syllabusSubtopic: { type: 'string', description: 'Syllabus subtopic tested' },
    subtopicMasteryScore: { type: 'integer', description: 'Estimated mastery percentage (0 to 100)' },
    revisionRecommendation: { type: 'string', description: 'Targeted revision advice and drill suggestions for this topic' }
  },
  required: ['questionId', 'questionNumber', 'marksAwarded', 'maxMarks', 'examinerNotes', 'marginAnnotations', 'markBreakdown', 'ecfApplied', 'syllabusSubtopic', 'subtopicMasteryScore', 'revisionRecommendation']
};

// Backward-compatible alias for existing call sites
export const GRADING_RESPONSE_SCHEMA = QUESTION_EVALUATION_SCHEMA;

export const SOCRATIC_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    text: { type: 'string', description: 'Conversational response from the tutor to guide the student forward' },
    tierActive: { type: 'integer', description: 'The pedagogical tier of this response (1, 2, 3, or 4)' },
    formulaQuote: { type: 'string', description: 'Quote or snippet from the formula booklet or key theory if Tier 2' },
    diagnosticHighlight: { type: 'string', description: 'Pinpoint of student current step or arithmetic slip if Tier 3' },
    unlockedMarkscheme: { type: 'boolean', description: 'True ONLY if Tier 4 is explicitly reached/unlocked' }
  },
  required: ['text', 'tierActive', 'unlockedMarkscheme']
};
