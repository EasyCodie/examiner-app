# IB Examiner

Authoritative exam simulation, rigorous method-level marking, and Error Carried Forward assessment for IB Diploma students.

## Language

**Exam Manifest**:
An immutable JSON document compiling an official examination paper and its matching markscheme.
_Avoid_: Exam paper, test config, paper definition

**Exam Session**:
The complete record of a student's attempt on an exam paper, containing their submitted responses and finalized grading results.
_Avoid_: Test attempt, user session, run

**Question Submission**:
A student's recorded work for a specific question, capturing handwritten ink strokes, rendered working images, or written essay text.
_Avoid_: Answer, input, response data

**Question Evaluation**:
The examiner-grade marking result for a single question, specifying awarded mark codes, margin annotations, syllabus subtopic mastery, and revision recommendations.
_Avoid_: Question grading, score item, assessment detail

**Error Carried Forward (ECF)**:
An official Senior Examiner marking convention that credits correct downstream method and reasoning even when calculated from an incorrect upstream value, preventing double penalization.
_Avoid_: Follow-through, error propagation, partial credit

**Mark Code**:
A discrete rubric token defined in the official markscheme (e.g., M for Method, A for Accuracy, R for Reasoning, AG for Answer Given, FT for Follow Through).
_Avoid_: Rubric point, grading criteria, score tag

**Grade Boundary**:
The official percentage score thresholds mapping total marks to IB 1–7 scale grades.
_Avoid_: Cutoffs, grade curve, score tiers

**Syllabus Weakness Matrix**:
A structured diagnosis of student performance by syllabus subtopic, identifying mastered, developing, and critical areas either scoped to an active question or aggregated across the complete exam paper.
_Avoid_: Topic breakdown, skill map, performance report

**Authentic Exam Condition**:
Strict replication of official IB examination rules and visual constraints during a Timed Mock Exam, where candidate-facing materials present solely the question identifier, stimulus text, and mark allocations, completely stripped of syllabus classifications, markscheme criteria, command term definitions, or structured essay templates.
_Avoid_: Test mode, raw exam, unfiltered view

**Pedagogical Scaffolding**:
Structured guidance mechanisms (such as command term definitions, formula hints, essay structure templates, and markscheme rubrics) strictly confined to Socratic Learn Mode or post-evaluation review, engineered to teach without prematurely leaking assessment solutions.
_Avoid_: Hints, cheat codes, training wheels
