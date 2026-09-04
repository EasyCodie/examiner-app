import { ExamManifest } from '@/types/exam';

export const BUNDLED_MATH_AA_HL: ExamManifest = {
  id: 'math-aa-hl-specimen',
  title: 'Mathematics: analysis and approaches HL',
  subtitle: 'Paper 1 (Non-Calculator) — Authentic Examiner Specimen',
  subjectCode: 'MATH_AA_HL_P1',
  category: 'STEM',
  durationMinutes: 120,
  readingTimeMinutes: 5,
  totalMarks: 50,
  isBundled: true,
  createdAt: '2024-05-01T00:00:00.000Z',
  instructions: [
    'Write your answers in the answer boxes provided on the examination paper.',
    'A clean copy of the mathematics: analysis and approaches formula booklet is required for this paper.',
    'All answers should be given exactly or correct to three significant figures, unless stated otherwise.',
    'Unless otherwise stated in the question, all numerical answers should be given exactly.',
    'A full and correct answer with no working receives N marks. Where an answer is incorrect, marks will be given for a valid method, provided this is shown by written working.'
  ],
  gradeBoundaries: {
    grade7: 76,
    grade6: 64,
    grade5: 52,
    grade4: 40,
    grade3: 28,
    grade2: 16,
    grade1: 0
  },
  questions: [
    {
      id: 'math_q1',
      number: '1',
      pageNumber: 1,
      totalMarks: 6,
      commandTerm: 'Find',
      syllabusSubtopic: 'Topic 5.5: Definite integrals & substitution',
      formulaBookletRef: 'Section 5.5: ∫ f(g(x)) g\'(x) dx = ∫ f(u) du',
      promptText: 'Let $f(x) = x\\sqrt{2x^2 + 1}$.\n\nFind the exact value of the definite integral:\n$$\\int_{0}^{2} x\\sqrt{2x^2 + 1}\\,dx$$\n\nShow all relevant substitution steps and limits transformation.',
      markCodes: [
        { code: 'M1', type: 'M', marks: 1, description: 'Attempt at substitution: u = 2x^2 + 1 and du = 4x dx (or equivalent)' },
        { code: 'A1', type: 'A', marks: 1, description: 'Correct change of limits: x=0 => u=1, x=2 => u=9' },
        { code: 'M1', type: 'M', marks: 1, description: 'Integral rewritten in terms of u: (1/4) ∫_{1}^{9} u^{1/2} du' },
        { code: 'A1', type: 'A', marks: 1, description: 'Correct anti-differentiation: (1/4) * [ (2/3) u^{3/2} ]' },
        { code: 'M1', type: 'M', marks: 1, description: 'Correct substitution of transformed limits: (1/6) * (9^{3/2} - 1^{3/2})' },
        { code: 'A1', type: 'A', marks: 1, description: 'Exact simplified answer: 13/3 (or 26/6)' }
      ],
      ecfRules: 'Award FT method marks if an arithmetic slip in limits or constant factor is consistently evaluated.',
      markschemeExcerpt: 'u = 2x^2 + 1 => du/dx = 4x => x dx = du/4. Limits: x=0 => u=1, x=2 => u=9. (1/4) ∫_1^9 u^{1/2} du = (1/6) [u^{3/2}]_1^9 = (1/6)(27 - 1) = 26/6 = 13/3.'
    },
    {
      id: 'math_q2_a',
      number: '2(a)',
      pageNumber: 2,
      totalMarks: 4,
      commandTerm: 'Show that',
      syllabusSubtopic: 'Topic 1.9: Complex numbers & De Moivre\'s theorem',
      formulaBookletRef: 'Section 1.9: [r(cos θ + i sin θ)]^n = r^n(cos nθ + i sin nθ)',
      promptText: 'Let $z = \\cos\\left(\\frac{\\pi}{6}\\right) + i \\sin\\left(\\frac{\\pi}{6}\\right)$.\n\nShow that $z^3 = i$ and determine the smallest positive integer $n$ such that $z^n = 1$.',
      markCodes: [
        { code: 'M1', type: 'M', marks: 1, description: 'Apply De Moivre’s theorem: z^3 = cos(3*pi/6) + i sin(3*pi/6) = cos(pi/2) + i sin(pi/2)' },
        { code: 'AG', type: 'AG', marks: 1, description: 'Conclusion shown clearly: cos(pi/2) = 0, sin(pi/2) = 1 => z^3 = i' },
        { code: 'M1', type: 'M', marks: 1, description: 'Setting n*pi/6 = 2*k*pi for smallest positive integer n' },
        { code: 'A1', type: 'A', marks: 1, description: 'Smallest integer n = 12' }
      ],
      ecfRules: 'No ECF for the AG mark (must show zero and one explicitly). FT allowed for n if previous angle is miscopied.',
      markschemeExcerpt: 'z^3 = cos(pi/2) + i sin(pi/2) = 0 + i(1) = i. For z^n = 1, arg(z^n) = n*pi/6 = 2pi k. Minimum positive n is 12.'
    },
    {
      id: 'math_q2_b',
      number: '2(b)',
      pageNumber: 2,
      totalMarks: 5,
      commandTerm: 'Find',
      syllabusSubtopic: 'Topic 1.9: Roots of complex numbers and geometry on Argand diagram',
      formulaBookletRef: 'Section 1.9: Roots of complex numbers',
      promptText: 'Hence find all distinct complex solutions to $w^3 = 8i$, giving your answers in Cartesian form $a + bi$.',
      markCodes: [
        { code: 'M1', type: 'M', marks: 1, description: 'Express 8i in polar form: 8(cos(pi/2 + 2k*pi) + i sin(pi/2 + 2k*pi))' },
        { code: 'M1', type: 'M', marks: 1, description: 'Modulus of roots = 8^{1/3} = 2' },
        { code: 'A1', type: 'A', marks: 1, description: 'First root w_0 = 2(cos(pi/6) + i sin(pi/6)) = sqrt(3) + i' },
        { code: 'A1', type: 'A', marks: 1, description: 'Second root w_1 = 2(cos(5pi/6) + i sin(5pi/6)) = -sqrt(3) + i' },
        { code: 'A1', type: 'A', marks: 1, description: 'Third root w_2 = 2(cos(9pi/6) + i sin(9pi/6)) = -2i' }
      ],
      ecfRules: 'Full ECF awarded if student carries forward an incorrect modulus or initial argument correctly into Cartesian form.',
      markschemeExcerpt: 'w_k = 2 cis((pi/2 + 2k pi)/3) for k = 0, 1, 2. w_0 = sqrt(3) + i, w_1 = -sqrt(3) + i, w_2 = -2i.'
    },
    {
      id: 'math_q3_a',
      number: '3(a)',
      pageNumber: 3,
      totalMarks: 5,
      commandTerm: 'Find',
      syllabusSubtopic: 'Topic 5.11: Differential equations & separation of variables',
      formulaBookletRef: 'Section 5.11: Differential equations',
      promptText: 'A particle moves in a straight line such that its velocity $v$ (in $\\text{m/s}$) at time $t \\ge 0$ satisfies:\n\n$$\\frac{dv}{dt} = -2v^2$$\n\nGiven that $v = 4$ when $t = 0$, find an expression for $v$ in terms of $t$.',
      markCodes: [
        { code: 'M1', type: 'M', marks: 1, description: 'Separation of variables: ∫ -1/v^2 dv = ∫ 2 dt (or ∫ 1/v^2 dv = -2t + C)' },
        { code: 'A1', type: 'A', marks: 1, description: 'Correct integration: 1/v = 2t + C' },
        { code: 'M1', type: 'M', marks: 1, description: 'Use of initial condition t = 0, v = 4 to find C: 1/4 = C' },
        { code: 'A1', type: 'A', marks: 1, description: 'Equation: 1/v = 2t + 1/4 = (8t + 1)/4' },
        { code: 'A1', type: 'A', marks: 1, description: 'Final rearranged expression: v(t) = 4 / (8t + 1)' }
      ],
      ecfRules: 'Award FT marks for subsequent steps if an algebraic sign error occurs in integration but constant C and inversion are solved correctly.',
      markschemeExcerpt: 'dv/v^2 = -2 dt => -1/v = -2t + C1 => 1/v = 2t + C. t=0, v=4 => C = 1/4. v = 1/(2t + 1/4) = 4/(8t + 1).'
    },
    {
      id: 'math_q3_b',
      number: '3(b)',
      pageNumber: 3,
      totalMarks: 5,
      commandTerm: 'Determine',
      syllabusSubtopic: 'Topic 5.6: Definite integrals, displacement, and distance',
      formulaBookletRef: 'Section 5.6: s(t) = ∫ v(t) dt',
      promptText: 'Using your answer from part (a), determine the exact distance traveled by the particle between $t = 0$ and $t = 1$ seconds.',
      markCodes: [
        { code: 'M1', type: 'M', marks: 1, description: 'Set up distance integral: s = ∫_{0}^{1} v(t) dt' },
        { code: 'M1', type: 'M', marks: 1, description: 'Integration of 4/(8t + 1) gives (4/8) * ln|8t + 1| = (1/2) * ln|8t + 1|' },
        { code: 'A1', type: 'A', marks: 1, description: 'Correct antiderivative (1/2) ln(8t + 1)' },
        { code: 'M1', type: 'M', marks: 1, description: 'Substitute limits 0 and 1: (1/2)(ln 9 - ln 1)' },
        { code: 'A1', type: 'A', marks: 1, description: 'Exact value: (1/2) ln 9 = ln 3 meters' }
      ],
      ecfRules: 'RIGOROUS ERROR CARRIED FORWARD (ECF): If student obtained an erroneous expression for v(t) in 3(a), award FULL marks in 3(b) if their erroneous v(t) is integrated correctly with valid calculus methods.',
      markschemeExcerpt: 's = ∫_0^1 (4/(8t+1)) dt = [ (1/2) ln(8t+1) ]_0^1 = (1/2)(ln 9 - ln 1) = (1/2) ln(3^2) = ln 3.'
    },
    {
      id: 'math_q4',
      number: '4',
      pageNumber: 4,
      totalMarks: 7,
      commandTerm: 'Calculate',
      syllabusSubtopic: 'Topic 3.12: Vector equations of planes and lines',
      formulaBookletRef: 'Section 3.12: Vector product r · n = a · n',
      promptText: 'Consider the point $P(1, 2, -1)$ and the plane $\\Pi: 2x - y + 2z = 9$.\n\n(a) Find the vector equation of the line $L$ passing through $P$ and perpendicular to $\\Pi$.\n(b) Hence find the coordinates of the foot of the perpendicular from $P$ to $\\Pi$.\n(c) Calculate the shortest distance from $P$ to $\\Pi$.',
      markCodes: [
        { code: 'M1', type: 'M', marks: 1, description: 'Normal vector to plane is n = [2, -1, 2]^T' },
        { code: 'A1', type: 'A', marks: 1, description: 'Vector equation of line L: r = [1, 2, -1]^T + lambda * [2, -1, 2]^T' },
        { code: 'M1', type: 'M', marks: 1, description: 'Substitute line points into plane: 2(1 + 2 lambda) - (2 - lambda) + 2(-1 + 2 lambda) = 9' },
        { code: 'A1', type: 'A', marks: 1, description: 'Solve for lambda: 4 lambda + lambda + 4 lambda + (2 - 2 - 2) = 9 => 9 lambda - 2 = 9 => lambda = 11/9' },
        { code: 'A1', type: 'A', marks: 1, description: 'Foot of perpendicular: (31/9, 7/9, 13/9)' },
        { code: 'M1', type: 'M', marks: 1, description: 'Distance formula |lambda * |n|| or distance formula |2(1) - (2) + 2(-1) - 9| / sqrt(4 + 1 + 4)' },
        { code: 'A1', type: 'A', marks: 1, description: 'Exact shortest distance = 11/3' }
      ],
      ecfRules: 'Full ECF applied from part (a) line equation into foot of perpendicular and distance calculation.',
      markschemeExcerpt: 'Line L: r = (1, 2, -1) + t(2, -1, 2). 2(1+2t) - (2-t) + 2(-1+2t) = 9 => 9t - 2 = 9 => t = 11/9. Foot is (31/9, 7/9, 13/9). Distance = |2(1)-2+2(-1)-9|/sqrt(9) = |-11|/3 = 11/3.'
    },
    {
      id: 'math_q5',
      number: '5',
      pageNumber: 5,
      totalMarks: 8,
      commandTerm: 'Evaluate',
      syllabusSubtopic: 'Topic 5.8: Maximum/minimum problems & concavity',
      formulaBookletRef: 'Section 5.8: f\'\'(x) test for inflection and local extrema',
      promptText: 'Let $f(x) = x^2 e^{-x}$ for $x \\in \\mathbb{R}$.\n\n(a) Find $f\'(x)$ and show that the stationary points of $f$ occur at $x = 0$ and $x = 2$.\n(b) Determine the nature of each stationary point using the first or second derivative test.\n(c) Find the coordinates of the points of inflexion of the graph of $y = f(x)$.',
      markCodes: [
        { code: 'M1', type: 'M', marks: 1, description: 'Apply product rule: f\'(x) = 2x e^{-x} - x^2 e^{-x} = x(2 - x) e^{-x}' },
        { code: 'A1', type: 'A', marks: 1, description: 'Setting f\'(x) = 0 and noting e^{-x} > 0 gives x = 0 and x = 2' },
        { code: 'M1', type: 'M', marks: 1, description: 'Compute f\'\'(x) = (2 - 2x)e^{-x} - (2x - x^2)e^{-x} = (x^2 - 4x + 2)e^{-x}' },
        { code: 'R1', type: 'R', marks: 1, description: 'f\'\'(0) = 2 > 0 => Local minimum at (0, 0)' },
        { code: 'R1', type: 'R', marks: 1, description: 'f\'\'(2) = (4 - 8 + 2)e^{-2} = -2e^{-2} < 0 => Local maximum at (2, 4e^{-2})' },
        { code: 'M1', type: 'M', marks: 1, description: 'Set f\'\'(x) = 0 => x^2 - 4x + 2 = 0' },
        { code: 'A1', type: 'A', marks: 1, description: 'Solve quadratic: x = (4 +- sqrt(8))/2 = 2 +- sqrt(2)' },
        { code: 'A1', type: 'A', marks: 1, description: 'Full coordinates: (2 - sqrt(2), (6 - 4sqrt(2))e^{-(2-sqrt(2))}) and (2 + sqrt(2), (6 + 4sqrt(2))e^{-(2+sqrt(2))})' }
      ],
      ecfRules: 'Award FT reasoning marks if second derivative calculation has numerical error but sign deduction is logically correct.',
      markschemeExcerpt: 'f\'(x) = x(2-x)e^{-x} = 0 => x=0, x=2. f\'\'(x) = (x^2 - 4x + 2)e^{-x}. f\'\'(0)=2 > 0 min, f\'\'(2)=-2/e^2 < 0 max. Inflexion at x = 2 +- sqrt(2).'
    },
    {
      id: 'math_q6',
      number: '6',
      pageNumber: 6,
      totalMarks: 10,
      commandTerm: 'Show that',
      syllabusSubtopic: 'Topic 1.15: Proof by mathematical induction',
      formulaBookletRef: 'Section 1.15: Principle of mathematical induction',
      promptText: 'Prove by mathematical induction that for all positive integers $n \\ge 1$:\n\n$$\\sum_{r=1}^{n} r \\cdot 2^{r-1} = (n - 1) \\cdot 2^n + 1$$',
      markCodes: [
        { code: 'M1', type: 'M', marks: 1, description: 'Base case verification: For n = 1, LHS = 1 * 2^0 = 1, RHS = (1 - 1)*2^1 + 1 = 1' },
        { code: 'R1', type: 'R', marks: 1, description: 'Clear statement: LHS = RHS, therefore true for n = 1' },
        { code: 'M1', type: 'M', marks: 1, description: 'Induction hypothesis: Assume the statement is true for n = k, i.e. \\sum_{r=1}^{k} r 2^{r-1} = (k - 1) 2^k + 1' },
        { code: 'M1', type: 'M', marks: 1, description: 'Consider n = k + 1: \\sum_{r=1}^{k+1} r 2^{r-1} = [(k - 1) 2^k + 1] + (k + 1) 2^k' },
        { code: 'M1', type: 'M', marks: 1, description: 'Factor out 2^k: 2^k [(k - 1) + (k + 1)] + 1' },
        { code: 'A1', type: 'A', marks: 1, description: 'Simplify: 2^k [2k] + 1 = k * 2^{k+1} + 1' },
        { code: 'A1', type: 'A', marks: 1, description: 'Rewrite in inductive target form: ((k + 1) - 1) * 2^{k+1} + 1' },
        { code: 'R1', type: 'R', marks: 1, description: 'Conclusion: Stated that if true for n=k then true for n=k+1' },
        { code: 'R1', type: 'R', marks: 1, description: 'Since true for n=1, therefore true for all n in Z^+ by principle of mathematical induction' },
        { code: 'AG', type: 'AG', marks: 1, description: 'Rigorous complete proof structure with no logical gaps' }
      ],
      ecfRules: 'Final R1 (conclusion) can only be awarded if all previous method and algebraic steps are substantially complete.',
      markschemeExcerpt: 'Base step n=1 verified. Assume true for n=k. For n=k+1: LHS = (k-1)2^k + 1 + (k+1)2^k = 2^k(k-1+k+1) + 1 = 2^k(2k) + 1 = k 2^{k+1} + 1 = ((k+1)-1)2^{k+1}+1. Valid induction conclusion required.'
    }
  ]
};

export const BUNDLED_ECONOMICS_HL: ExamManifest = {
  id: 'econ-hl-specimen',
  title: 'Economics Higher Level',
  subtitle: 'Paper 1 (Extended Response) — Authentic Examiner Specimen',
  subjectCode: 'ECON_HL_P1',
  category: 'HUMANITIES',
  durationMinutes: 75,
  readingTimeMinutes: 5,
  totalMarks: 50,
  isBundled: true,
  createdAt: '2024-05-01T00:00:00.000Z',
  instructions: [
    'Answer two questions in total: one from Section A and one from Section B.',
    'Each 10-mark question should be fully developed with theoretical definitions, a clearly labeled diagram, and step-by-step real-world explanation.',
    'Each 15-mark question requires comprehensive evaluation with synthesis of stakeholders, short-run vs long-run tradeoffs, and real-world examples.',
    'Use the integrated diagram canvas to draw and label your economic models.'
  ],
  gradeBoundaries: {
    grade7: 74,
    grade6: 62,
    grade5: 50,
    grade4: 38,
    grade3: 26,
    grade2: 14,
    grade1: 0
  },
  questions: [
    {
      id: 'econ_q1_a',
      number: '1(a)',
      pageNumber: 1,
      totalMarks: 10,
      commandTerm: 'Explain',
      syllabusSubtopic: 'Topic 2.8: Market failure — negative externalities of consumption',
      promptText: 'Explain how the consumption of demerit goods (such as petrol-powered vehicles or tobacco) leads to market failure.\n\nSupport your answer with an accurately labeled negative externality of consumption diagram showing the marginal private benefit (MPB), marginal social benefit (MSB), and resulting welfare loss.',
      diagramRequired: true,
      markCodes: [
        { code: 'M1', type: 'M', marks: 2, description: 'Accurate economic definition of market failure and negative externalities of consumption / demerit goods.' },
        { code: 'A1', type: 'A', marks: 3, description: 'Diagram correctly drawn with labeled axes (Price/Cost, Quantity), MPB, MSB where MPB > MSB, MPC=MSC, free market equilibrium (Qm, Pm), social optimum (Qopt, Popt), and triangle of welfare loss.' },
        { code: 'R1', type: 'R', marks: 3, description: 'Step-by-step theoretical explanation of divergence between private and social benefits and overconsumption in the free market.' },
        { code: 'A1', type: 'A', marks: 2, description: 'Application of theory to a concrete demerit good example (e.g. urban vehicle emissions or secondhand smoke).' }
      ],
      ecfRules: 'If diagram labels axes inversely, award max 2/3 for diagram accuracy but full marks for correct theoretical text explanation.',
      markschemeExcerpt: 'Market failure is allocative inefficiency where MSB != MSC. Consumption generates external costs onto third parties, so MPB > MSB. Free market overallocates resources (Qm > Qopt), causing a deadweight welfare loss shaded toward social optimum.'
    },
    {
      id: 'econ_q1_b',
      number: '1(b)',
      pageNumber: 2,
      totalMarks: 15,
      commandTerm: 'Evaluate',
      syllabusSubtopic: 'Topic 2.8 & 2.11: Government intervention — indirect carbon taxes vs command-and-control regulation',
      promptText: 'Evaluate the view that implementing an indirect carbon tax is the most effective government policy to correct market failure arising from carbon-intensive production and consumption.',
      diagramRequired: true,
      markCodes: [
        { code: 'M1', type: 'M', marks: 3, description: 'Clear explanation of the carbon tax mechanism (internalizing the externality, shifting MPC upward to MSC, Pigouvian tax).' },
        { code: 'A1', type: 'A', marks: 3, description: 'Supporting diagram showing tax shifting supply curve from S1 (MPC) to S2 (MPC + tax) eliminating welfare loss.' },
        { code: 'R1', type: 'R', marks: 4, description: 'Evaluation of advantages: market incentive for green innovation, revenue generation for government to subsidize clean energy alternatives.' },
        { code: 'R1', type: 'R', marks: 3, description: 'Evaluation of limitations: inelastic demand for energy, regressive burden on low-income households, difficulty measuring true external cost.' },
        { code: 'AG', type: 'AG', marks: 2, description: 'Synthesis/Conclusion: nuanced judgment weighing tax against alternatives (tradable permits, direct regulation, subsidies).' }
      ],
      ecfRules: 'Award high evaluation marks if student balances short-run vs long-run effects and provides real-world context (e.g. EU ETS or national carbon taxes).',
      markschemeExcerpt: 'Level 4 response (13-15 marks) thoroughly addresses: theoretical internalization via Pigouvian tax; price elasticity of demand constraints; equity impacts on lower-income deciles; comparisons with command-and-control standards and subsidies; supported final judgment.'
    },
    {
      id: 'econ_q2_a',
      number: '2(a)',
      pageNumber: 3,
      totalMarks: 10,
      commandTerm: 'Explain',
      syllabusSubtopic: 'Topic 3.3: Macroeconomic equilibrium & Demand-pull inflation',
      promptText: 'Explain two factors that could cause demand-pull inflation in an economy.\n\nSupport your answer with an AD/AS diagram showing the upward pressure on the general price level.',
      diagramRequired: true,
      markCodes: [
        { code: 'M1', type: 'M', marks: 2, description: 'Definition of demand-pull inflation (persistent increase in average price level driven by aggregate demand outpacing aggregate supply).' },
        { code: 'A1', type: 'A', marks: 3, description: 'Accurate AD/AS diagram showing rightward shift of AD (from AD1 to AD2) along an upward-sloping or vertical LRAS, illustrating increase in average price level (PL1 to PL2).' },
        { code: 'R1', type: 'R', marks: 3, description: 'Detailed analysis of two distinct AD components (e.g. consumer spending driven by low interest rates, or fiscal stimulus / export boom).' },
        { code: 'A1', type: 'A', marks: 2, description: 'Explanation of resource bottlenecks and inflationary gap when economy operates near or beyond potential Yp.' }
      ],
      ecfRules: 'Full marks awarded whether student uses Monetarist/New Classical vertical LRAS or Keynesian AS curve, provided logic is consistent.',
      markschemeExcerpt: 'AD = C + I + G + (X - M). Shift from AD1 to AD2 creates an inflationary gap (Y > Yp). Factor 1 (e.g. expansionary monetary policy reducing borrowing cost), Factor 2 (e.g. depreciation boosting net exports). Diagram clearly annotated.'
    },
    {
      id: 'econ_q2_b',
      number: '2(b)',
      pageNumber: 4,
      totalMarks: 15,
      commandTerm: 'Discuss',
      syllabusSubtopic: 'Topic 3.5: Monetary policy vs supply-side policy in managing inflation',
      promptText: 'Discuss the view that contractionary monetary policy is the most effective policy for an economy experiencing high inflation.',
      diagramRequired: true,
      markCodes: [
        { code: 'M1', type: 'M', marks: 3, description: 'Mechanism of contractionary monetary policy (central bank raising interest rates, increasing cost of credit, decreasing C and I, dampening AD).' },
        { code: 'A1', type: 'A', marks: 3, description: 'Diagrammatic analysis: Money market (interest rate hike) and AD/AS diagram showing shift of AD back towards full employment output.' },
        { code: 'R1', type: 'R', marks: 4, description: 'Arguments in favor: central bank independence, quick implementation compared to fiscal policy, no political election bias.' },
        { code: 'R1', type: 'R', marks: 3, description: 'Arguments against: time lags (12-18 months), stagflation risk if inflation is cost-push (supply side), higher mortgage costs, negative impact on economic growth and unemployment.' },
        { code: 'AG', type: 'AG', marks: 2, description: 'Nuanced conclusion: effectiveness depends on the underlying source of inflation (demand-pull vs cost-push supply shock) and economic spare capacity.' }
      ],
      ecfRules: 'Award full marks for balanced consideration of supply-side alternative policies or fiscal contraction in the evaluation.',
      markschemeExcerpt: 'Level 4 response (13-15 marks) contrasts monetary transmission with cost-push shocks; analyzes interest-rate sensitivity of consumer debt; evaluates impact on exchange rate and imported inflation; concludes with dependency on cause of inflation.'
    }
  ]
};

export const MAY_2021_MATH_AA_HL_P1: ExamManifest = {
  id: 'math-aa-hl-may-2021',
  title: 'Mathematics: analysis and approaches HL',
  subtitle: 'Paper 1 (Non-Calculator) — May 2021 (TZ1)',
  subjectCode: 'MATH_AA_HL_P1',
  category: 'STEM',
  durationMinutes: 120,
  readingTimeMinutes: 5,
  totalMarks: 110,
  isBundled: true,
  createdAt: '2021-05-06T13:00:00.000Z',
  instructions: [
    'Write your session number in the boxes above.',
    'Do not open this examination paper until instructed to do so.',
    'You are not permitted access to any calculator for this paper.',
    'Section A: answer all questions in the answer boxes provided.',
    'Section B: answer all questions in the answer booklet provided.',
    'Unless otherwise stated in the question, all numerical answers should be given exactly or correct to three significant figures.',
    'A clean copy of the mathematics: analysis and approaches formula booklet is required for this paper.',
    'The maximum mark for this examination paper is [110 marks].'
  ],
  gradeBoundaries: {
    grade7: 74,
    grade6: 62,
    grade5: 50,
    grade4: 38,
    grade3: 26,
    grade2: 15,
    grade1: 0
  },
  questions: [
    {
      id: 'm21_q1',
      number: '1',
      pageNumber: 1,
      totalMarks: 5,
      commandTerm: 'Write down',
      syllabusSubtopic: 'Topic 2.2 & 2.5: Function transformations & composite functions',
      promptText: 'The graph of $y = f(x)$ for $-4 \\le x \\le 6$ is shown in the following diagram.',
      diagram: {
        hasDiagram: true,
        type: 'function_graph',
        title: 'Graph of y = f(x)',
        svgContent: '<svg viewBox="-50 -70 120 160" width="100%" height="220" xmlns="http://www.w3.org/2000/svg" class="stroke-slate-800 fill-none text-[10px] font-mono"><rect x="-45" y="-65" width="110" height="150" fill="#f8fafc" stroke="#cbd5e1" stroke-width="0.5"/><line x1="-45" y1="0" x2="65" y2="0" stroke="#0f172a" stroke-width="1.2"/><line x1="0" y1="85" x2="0" y2="-65" stroke="#0f172a" stroke-width="1.2"/><text x="66" y="3" fill="#0f172a" stroke="none">x</text><text x="-3" y="-66" fill="#0f172a" stroke="none">y</text><text x="-43" y="10" fill="#64748b" stroke="none">-4</text><text x="-23" y="10" fill="#64748b" stroke="none">-2</text><text x="-4" y="10" fill="#64748b" stroke="none">0</text><text x="18" y="10" fill="#64748b" stroke="none">2</text><text x="38" y="10" fill="#64748b" stroke="none">4</text><text x="58" y="10" fill="#64748b" stroke="none">6</text><text x="3" y="-38" fill="#64748b" stroke="none">4</text><text x="3" y="-58" fill="#64748b" stroke="none">6</text><text x="3" y="-78" fill="#64748b" stroke="none">8</text><text x="3" y="22" fill="#64748b" stroke="none">-2</text><text x="3" y="42" fill="#64748b" stroke="none">-4</text><text x="3" y="62" fill="#64748b" stroke="none">-6</text><path d="M -40 -40 L 0 -40 Q 20 -80 60 20" stroke="#0f172a" stroke-width="2" fill="none"/><circle cx="-40" cy="-40" r="2" fill="#0f172a"/><circle cx="60" cy="20" r="2" fill="#0f172a"/></svg>'
      },
      subparts: [
        {
          id: 'm21_q1_a',
          partLetter: '(a)',
          totalMarks: 2,
          commandTerm: 'Write down',
          promptText: 'Write down the value of:\n(i) $f(2)$;\n(ii) $(f \\circ f)(2)$.',
          markCodes: [
            { code: 'A1', type: 'A', marks: 1, description: 'f(2) = 6' },
            { code: 'A1', type: 'A', marks: 1, description: '(f ∘ f)(2) = f(6) = -2' }
          ],
          markschemeExcerpt: '(i) f(2) = 6 [A1]\n(ii) (f ∘ f)(2) = f(6) = -2 [A1]'
        },
        {
          id: 'm21_q1_b',
          partLetter: '(b)',
          totalMarks: 3,
          commandTerm: 'Sketch',
          promptText: 'Let $g(x) = \\frac{1}{2}f(x) + 1$ for $-4 \\le x \\le 6$. On the axes above, sketch the graph of $g$.',
          markCodes: [
            { code: 'M1', type: 'M', marks: 1, description: 'Attempt at vertical stretch by scale factor 1/2 or vertical translation +1' },
            { code: 'A1', type: 'A', marks: 1, description: 'Correct maximum point at (2, 4)' },
            { code: 'A1', type: 'A', marks: 1, description: 'Horizontal segment from (-4, 3) to (0, 3) and correct right endpoint at (6, 0)' }
          ],
          markschemeExcerpt: 'Vertical stretch with scale factor 1/2, followed by translation (0, 1). Transformed vertex at (2, 4). Endpoints: (-4, 3) and (6, 0).'
        }
      ],
      markCodes: [
        { code: 'A1', type: 'A', marks: 1, description: 'f(2) = 6' },
        { code: 'A1', type: 'A', marks: 1, description: '(f ∘ f)(2) = -2' },
        { code: 'M1', type: 'M', marks: 1, description: 'Attempt at transformation' },
        { code: 'A1', type: 'A', marks: 1, description: 'Vertex at (2, 4)' },
        { code: 'A1', type: 'A', marks: 1, description: 'Correct endpoints (-4,3) and (6,0)' }
      ],
      markschemeExcerpt: '(a)(i) f(2) = 6 (ii) f(6) = -2. (b) Maximum at (2, 4), endpoints at (-4, 3) and (6, 0).'
    },
    {
      id: 'm21_q2',
      number: '2',
      pageNumber: 2,
      totalMarks: 5,
      commandTerm: 'Find',
      syllabusSubtopic: 'Topic 1.2: Arithmetic sequences and series',
      formulaBookletRef: 'Section 1.2: u_n = u_1 + (n-1)d, S_n = (n/2)(2u_1 + (n-1)d)',
      promptText: 'Consider an arithmetic sequence where $u_8 = S_8 = 8$. Find the value of the first term, $u_1$, and the value of the common difference, $d$.',
      markCodes: [
        { code: 'M1', type: 'M', marks: 1, description: 'Using sum formula: S_8 = (8/2)(u_1 + u_8) = 4(u_1 + 8) = 8' },
        { code: 'A1', type: 'A', marks: 1, description: 'Equation 4(u_1 + 8) = 8 or 8u_1 + 28d = 8' },
        { code: 'A1', type: 'A', marks: 1, description: 'u_1 = -6' },
        { code: 'M1', type: 'M', marks: 1, description: 'Using u_8 = u_1 + 7d: -6 + 7d = 8' },
        { code: 'A1', type: 'A', marks: 1, description: 'd = 2' }
      ],
      ecfRules: 'Award FT for common difference d if arithmetic error in u_1 is carried forward correctly into u_1 + 7d = 8.',
      markschemeExcerpt: 'S_8 = (8/2)(u_1 + 8) = 8 => 4(u_1 + 8) = 8 => u_1 + 8 = 2 => u_1 = -6. u_8 = u_1 + 7d => 8 = -6 + 7d => 7d = 14 => d = 2.'
    },
    {
      id: 'm21_q3',
      number: '3',
      pageNumber: 3,
      totalMarks: 5,
      commandTerm: 'Find',
      syllabusSubtopic: 'Topic 4.2 & 4.3: Box-and-whisker diagrams & outliers',
      formulaBookletRef: 'Section 4.3: IQR = Q_3 - Q_1, Outliers: x < Q_1 - 1.5*IQR or x > Q_3 + 1.5*IQR',
      promptText: 'A research student weighed lizard eggs in grams and recorded the results. The following box and whisker diagram shows a summary of the results where $L$ and $U$ are the lower and upper quartiles respectively.\n\nThe interquartile range is $20\\text{ grams}$ and there are no outliers in the results.',
      diagram: {
        hasDiagram: true,
        type: 'other',
        title: 'Box and whisker diagram for lizard eggs (grams)',
        svgContent: '<svg viewBox="0 0 400 90" width="100%" height="90" xmlns="http://www.w3.org/2000/svg" class="text-xs font-mono"><line x1="30" y1="50" x2="370" y2="50" stroke="#0f172a" stroke-width="1.5"/><line x1="50" y1="35" x2="50" y2="65" stroke="#0f172a" stroke-width="1.5"/><line x1="50" y1="50" x2="110" y2="50" stroke="#0f172a" stroke-width="1.5"/><rect x="110" y="30" width="150" height="40" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5"/><line x1="200" y1="30" x2="200" y2="70" stroke="#0f172a" stroke-width="1.5"/><line x1="260" y1="50" x2="350" y2="50" stroke="#0f172a" stroke-width="1.5"/><line x1="350" y1="35" x2="350" y2="65" stroke="#0f172a" stroke-width="1.5"/><text x="45" y="82" fill="#0f172a" font-weight="600">10</text><text x="106" y="82" fill="#0f172a" font-weight="600">L</text><text x="193" y="82" fill="#0f172a" font-weight="600">40</text><text x="256" y="82" fill="#0f172a" font-weight="600">U</text><text x="343" y="82" fill="#0f172a" font-weight="600">75</text><text x="260" y="20" fill="#64748b" font-style="italic" font-size="10">diagram not to scale</text></svg>'
      },
      subparts: [
        {
          id: 'm21_q3_a',
          partLetter: '(a)',
          totalMarks: 3,
          commandTerm: 'Find',
          promptText: 'Find the minimum possible value of $U$.',
          markCodes: [
            { code: 'M1', type: 'M', marks: 1, description: 'Using upper outlier boundary formula: U + 1.5 * IQR = U + 30' },
            { code: 'M1', type: 'M', marks: 1, description: 'Since 75 is not an outlier: 75 <= U + 30' },
            { code: 'A1', type: 'A', marks: 1, description: 'Minimum possible value of U is 45' }
          ],
          markschemeExcerpt: 'IQR = 20. Outlier threshold = U + 1.5(20) = U + 30. No outliers implies 75 <= U + 30 => U >= 45. Min U = 45.'
        },
        {
          id: 'm21_q3_b',
          partLetter: '(b)',
          totalMarks: 2,
          commandTerm: 'Hence find',
          promptText: 'Hence, find the minimum possible value of $L$.',
          markCodes: [
            { code: 'M1', type: 'M', marks: 1, description: 'Using IQR = U - L = 20 => L = U - 20' },
            { code: 'A1', type: 'A', marks: 1, description: 'Minimum possible value of L = 45 - 20 = 25' }
          ],
          markschemeExcerpt: 'L = U - 20. When U = 45, L = 25. Checking lower bound: 25 - 1.5(20) = -5 <= 10, valid. Min L = 25.'
        }
      ],
      markCodes: [
        { code: 'M1', type: 'M', marks: 1, description: 'Upper boundary U + 30' },
        { code: 'M1', type: 'M', marks: 1, description: 'Inequality U + 30 >= 75' },
        { code: 'A1', type: 'A', marks: 1, description: 'U_min = 45' },
        { code: 'M1', type: 'M', marks: 1, description: 'L = U - 20' },
        { code: 'A1', type: 'A', marks: 1, description: 'L_min = 25' }
      ],
      markschemeExcerpt: '(a) U + 1.5(20) >= 75 => U >= 45. Min U = 45. (b) L = 45 - 20 = 25.'
    },
    {
      id: 'm21_q4',
      number: '4',
      pageNumber: 4,
      totalMarks: 7,
      commandTerm: 'Show that',
      syllabusSubtopic: 'Topic 5.6: Derivatives of exponential functions and common tangents',
      formulaBookletRef: 'Section 5.6: (e^x)\' = e^x',
      promptText: 'Consider the functions $f(x) = -(x-h)^2 + 2k$ and $g(x) = e^{x-2} + k$ where $h, k \\in \\mathbb{R}$.',
      subparts: [
        {
          id: 'm21_q4_a',
          partLetter: '(a)',
          totalMarks: 1,
          commandTerm: 'Find',
          promptText: 'Find $f\'(x)$.',
          markCodes: [
            { code: 'A1', type: 'A', marks: 1, description: 'f\'(x) = -2(x - h)' }
          ],
          markschemeExcerpt: 'f\'(x) = -2(x - h) [A1]'
        },
        {
          id: 'm21_q4_b',
          partLetter: '(b)',
          totalMarks: 3,
          commandTerm: 'Show that',
          promptText: 'The graphs of $f$ and $g$ have a common tangent at $x = 3$. Show that $h = \\frac{e+6}{2}$.',
          markCodes: [
            { code: 'A1', type: 'A', marks: 1, description: 'g\'(3) = e^{3-2} = e' },
            { code: 'M1', type: 'M', marks: 1, description: 'Equating gradients at x = 3: f\'(3) = g\'(3) => -2(3 - h) = e' },
            { code: 'AG', type: 'AG', marks: 1, description: 'Clear algebraic progression: -6 + 2h = e => h = (e+6)/2' }
          ],
          markschemeExcerpt: 'g\'(x) = e^{x-2} => g\'(3) = e. Common tangent => f\'(3) = g\'(3) => -2(3 - h) = e => 2h = e + 6 => h = (e + 6)/2.'
        },
        {
          id: 'm21_q4_c',
          partLetter: '(c)',
          totalMarks: 3,
          commandTerm: 'Show that',
          promptText: 'Hence, show that $k = e + \\frac{e^2}{4}$.',
          markCodes: [
            { code: 'M1', type: 'M', marks: 1, description: 'Equating function values at x = 3: f(3) = g(3)' },
            { code: 'A1', type: 'A', marks: 1, description: '3 - h = 3 - (e+6)/2 = -e/2' },
            { code: 'AG', type: 'AG', marks: 1, description: '-( -e/2 )^2 + 2k = e + k => k = e + e^2/4' }
          ],
          markschemeExcerpt: 'f(3) = g(3) => -(3 - h)^2 + 2k = e + k => k = e + (3 - h)^2. Since 3 - h = -e/2, k = e + (-e/2)^2 = e + e^2/4.'
        }
      ],
      markCodes: [
        { code: 'A1', type: 'A', marks: 1, description: 'f\'(x) = -2(x - h)' },
        { code: 'A1', type: 'A', marks: 1, description: 'g\'(3) = e' },
        { code: 'M1', type: 'M', marks: 1, description: '-2(3 - h) = e' },
        { code: 'AG', type: 'AG', marks: 1, description: 'h = (e+6)/2' },
        { code: 'M1', type: 'M', marks: 1, description: 'f(3) = g(3)' },
        { code: 'A1', type: 'A', marks: 1, description: '3 - h = -e/2' },
        { code: 'AG', type: 'AG', marks: 1, description: 'k = e + e^2/4' }
      ],
      markschemeExcerpt: '(a) f\'(x) = -2(x-h). (b) f\'(3) = g\'(3) => 2h = e + 6. (c) f(3) = g(3) => k = e + e^2/4.'
    },
    {
      id: 'm21_q5',
      number: '5',
      pageNumber: 5,
      totalMarks: 8,
      commandTerm: 'Show that',
      syllabusSubtopic: 'Topic 3.5 & 3.8: Double angle trigonometric identities & equations',
      formulaBookletRef: 'Section 3.5: sin 2x = 2 sin x cos x, cos 2x = cos^2 x - sin^2 x = 1 - 2 sin^2 x',
      promptText: 'Trigonometric identities and equations:',
      subparts: [
        {
          id: 'm21_q5_a',
          partLetter: '(a)',
          totalMarks: 2,
          commandTerm: 'Show that',
          promptText: 'Show that $\\sin 2x + \\cos 2x - 1 = 2\\sin x(\\cos x - \\sin x)$.',
          markCodes: [
            { code: 'M1', type: 'M', marks: 1, description: 'Applying double angle identities: sin 2x = 2 sin x cos x and cos 2x = 1 - 2 sin^2 x' },
            { code: 'AG', type: 'AG', marks: 1, description: '2 sin x cos x + (1 - 2 sin^2 x) - 1 = 2 sin x cos x - 2 sin^2 x = 2 sin x(cos x - sin x)' }
          ],
          markschemeExcerpt: 'LHS = 2 sin x cos x + (1 - 2 sin^2 x) - 1 = 2 sin x(cos x - sin x) = RHS.'
        },
        {
          id: 'm21_q5_b',
          partLetter: '(b)',
          totalMarks: 6,
          commandTerm: 'Solve',
          promptText: 'Hence or otherwise, solve $\\sin 2x + \\cos 2x - 1 + \\cos x - \\sin x = 0$ for $0 < x < 2\\pi$.',
          markCodes: [
            { code: 'M1', type: 'M', marks: 1, description: 'Factoring: 2 sin x(cos x - sin x) + (cos x - sin x) = (cos x - sin x)(2 sin x + 1) = 0' },
            { code: 'A1', type: 'A', marks: 1, description: 'cos x - sin x = 0 => tan x = 1' },
            { code: 'A1', type: 'A', marks: 1, description: 'x = pi/4, 5pi/4' },
            { code: 'M1', type: 'M', marks: 1, description: '2 sin x + 1 = 0 => sin x = -1/2' },
            { code: 'A1', type: 'A', marks: 1, description: 'x = 7pi/6, 11pi/6' },
            { code: 'A1', type: 'A', marks: 1, description: 'Final solution set: x = pi/4, 7pi/6, 5pi/4, 11pi/6' }
          ],
          markschemeExcerpt: '(cos x - sin x)(2 sin x + 1) = 0. cos x = sin x => x = pi/4, 5pi/4. sin x = -1/2 => x = 7pi/6, 11pi/6.'
        }
      ],
      markCodes: [
        { code: 'M1', type: 'M', marks: 1, description: 'Double angle identities applied' },
        { code: 'AG', type: 'AG', marks: 1, description: 'Factorization shown' },
        { code: 'M1', type: 'M', marks: 1, description: '(cos x - sin x)(2 sin x + 1) = 0' },
        { code: 'A1', type: 'A', marks: 1, description: 'x = pi/4' },
        { code: 'A1', type: 'A', marks: 1, description: 'x = 5pi/4' },
        { code: 'M1', type: 'M', marks: 1, description: 'sin x = -1/2' },
        { code: 'A1', type: 'A', marks: 1, description: 'x = 7pi/6' },
        { code: 'A1', type: 'A', marks: 1, description: 'x = 11pi/6' }
      ],
      markschemeExcerpt: '(a) sin 2x + cos 2x - 1 = 2 sin x(cos x - sin x). (b) x = pi/4, 7pi/6, 5pi/4, 11pi/6.'
    },
    {
      id: 'm21_q6',
      number: '6',
      pageNumber: 6,
      totalMarks: 4,
      commandTerm: 'Find',
      syllabusSubtopic: 'Topic 3.3: Reciprocal trigonometric identities and quadrants',
      formulaBookletRef: 'Section 3.3: 1 + cot^2 θ = csc^2 θ',
      promptText: 'It is given that $\\csc\\theta = \\frac{3}{2}$, where $\\frac{\\pi}{2} < \\theta < \\frac{3\\pi}{2}$. Find the exact value of $\\cot\\theta$.',
      markCodes: [
        { code: 'R1', type: 'R', marks: 1, description: 'Deducing quadrant: csc θ = 3/2 > 0 implies sin θ > 0. In (pi/2, 3pi/2), this restricts θ to Quadrant 2' },
        { code: 'M1', type: 'M', marks: 1, description: 'Applying identity: cot^2 θ = csc^2 θ - 1 = (3/2)^2 - 1 = 5/4' },
        { code: 'A1', type: 'A', marks: 1, description: 'cot θ = ± sqrt(5)/2' },
        { code: 'A1', type: 'A', marks: 1, description: 'In Quadrant 2, cot θ < 0, therefore cot θ = -sqrt(5)/2' }
      ],
      ecfRules: 'Award FT for correct negative sign selection if student has correct algebraic reasoning from an arithmetic slip in cot^2 θ.',
      markschemeExcerpt: 'sin θ = 2/3 > 0 with pi/2 < θ < 3pi/2 means θ is in the second quadrant. cot^2 θ = (3/2)^2 - 1 = 5/4. In second quadrant cot θ < 0, so cot θ = -sqrt(5)/2.'
    },
    {
      id: 'm21_q7',
      number: '7',
      pageNumber: 7,
      totalMarks: 8,
      commandTerm: 'Find',
      syllabusSubtopic: 'Topic 1.8: Polynomials, Vieta\'s formulas & conjugate roots',
      formulaBookletRef: 'Section 1.8: Complex roots of real polynomials occur in conjugate pairs',
      promptText: 'Consider the quartic equation $z^4 + 4z^3 + 8z^2 + 80z + 400 = 0$, $z \\in \\mathbb{C}$.\n\nTwo of the roots of this equation are $a + bi$ and $b + ai$, where $a, b \\in \\mathbb{Z}$.\n\nFind the possible values of $a$.',
      markCodes: [
        { code: 'R1', type: 'R', marks: 1, description: 'Recognizing complex conjugate pairs: roots are a + bi, a - bi, b + ai, b - ai' },
        { code: 'M1', type: 'M', marks: 1, description: 'Sum of roots: (a+bi)+(a-bi)+(b+ai)+(b-ai) = 2a + 2b = -4 => a + b = -2' },
        { code: 'M1', type: 'M', marks: 1, description: 'Product of roots: (a^2+b^2)(b^2+a^2) = (a^2+b^2)^2 = 400 => a^2 + b^2 = 20' },
        { code: 'M1', type: 'M', marks: 1, description: 'Substitute b = -2 - a into a^2 + b^2 = 20: a^2 + (a+2)^2 = 20 => 2a^2 + 4a - 16 = 0' },
        { code: 'A1', type: 'A', marks: 1, description: 'Simplified quadratic: a^2 + 2a - 8 = 0 => (a + 4)(a - 2) = 0' },
        { code: 'A1', type: 'A', marks: 1, description: 'a = -4' },
        { code: 'A1', type: 'A', marks: 1, description: 'a = 2' },
        { code: 'R1', type: 'R', marks: 1, description: 'Verifying intermediate coefficient of z^2: e.g. sum of pairwise products matches 8' }
      ],
      ecfRules: 'Full ECF awarded if signs in sum or product of roots are carried forward consistently.',
      markschemeExcerpt: 'Conjugate roots: a ± bi and b ± ai. Sum of roots: 2(a + b) = -4 => a + b = -2. Product of roots: (a^2+b^2)^2 = 400 => a^2 + b^2 = 20. a^2 + (-2-a)^2 = 20 => a^2 + 2a - 8 = 0 => a = -4 or a = 2.'
    },
    {
      id: 'm21_q8',
      number: '8',
      pageNumber: 8,
      totalMarks: 5,
      commandTerm: 'Find',
      syllabusSubtopic: 'Topic 5.14: L\'Hôpital\'s rule',
      formulaBookletRef: 'Section 5.14: lim f(x)/g(x) = lim f\'(x)/g\'(x)',
      promptText: 'Use l’Hôpital’s rule to find:\n$$\\lim_{x \\to 0} \\left(\\frac{\\arctan 2x}{\\tan 3x}\\right)$$',
      markCodes: [
        { code: 'R1', type: 'R', marks: 1, description: 'State 0/0 indeterminate form at x = 0' },
        { code: 'M1', type: 'M', marks: 1, description: 'Differentiating numerator and denominator' },
        { code: 'A1', type: 'A', marks: 1, description: 'd/dx (arctan 2x) = 2 / (1 + 4x^2)' },
        { code: 'A1', type: 'A', marks: 1, description: 'd/dx (tan 3x) = 3 sec^2 3x' },
        { code: 'A1', type: 'A', marks: 1, description: 'Evaluate limit: (2 / 1) / (3 * 1) = 2/3' }
      ],
      ecfRules: 'Award FT marks if chain rule coefficient is omitted consistently.',
      markschemeExcerpt: 'At x = 0, form is 0/0. By l\'Hôpital\'s rule: lim = lim [ (2/(1+4x^2)) / (3 sec^2 3x) ] = (2/1) / (3*1) = 2/3.'
    },
    {
      id: 'm21_q9',
      number: '9',
      pageNumber: 9,
      totalMarks: 8,
      commandTerm: 'Find',
      syllabusSubtopic: 'Topic 1.10: Permutations, combinations and restrictions',
      formulaBookletRef: 'Section 1.10: Permutations nPr = n!/(n-r)!',
      promptText: 'A farmer has six sheep pens, arranged in a grid with three rows and two columns as shown in the following diagram.\n\nFive sheep called Amber, Brownie, Curly, Daisy and Eden are to be placed in the pens. Each pen is large enough to hold all of the sheep. Amber and Brownie are known to fight.\n\nFind the number of ways of placing the sheep in the pens in each of the following cases:',
      diagram: {
        hasDiagram: true,
        type: 'other',
        title: '3x2 Grid of Sheep Pens',
        svgContent: '<svg viewBox="0 0 240 160" width="100%" height="160" xmlns="http://www.w3.org/2000/svg" class="stroke-slate-900 stroke-[1.5] fill-none text-xs font-mono"><rect x="20" y="20" width="200" height="120" fill="#f8fafc"/><line x1="120" y1="20" x2="120" y2="140" stroke="#0f172a"/><line x1="20" y1="60" x2="220" y2="60" stroke="#0f172a"/><line x1="20" y1="100" x2="220" y2="100" stroke="#0f172a"/></svg>'
      },
      subparts: [
        {
          id: 'm21_q9_a',
          partLetter: '(a)',
          totalMarks: 4,
          commandTerm: 'Find',
          promptText: 'Each pen is large enough to contain five sheep. Amber and Brownie must not be placed in the same pen.',
          markCodes: [
            { code: 'M1', type: 'M', marks: 1, description: 'Total placements without restriction: 6^5 = 7776' },
            { code: 'M1', type: 'M', marks: 1, description: 'Placements where Amber and Brownie are together: 6 * 6^3 = 1296' },
            { code: 'M1', type: 'M', marks: 1, description: 'Alternative: Amber has 6 choices, Brownie has 5 choices => 6 * 5 * 6^3' },
            { code: 'A1', type: 'A', marks: 1, description: '6480 ways' }
          ],
          markschemeExcerpt: 'Total ways = 6^5. Amber and Brownie in same pen = 6 * 6^3 = 1296. Total valid = 7776 - 1296 = 6480.'
        },
        {
          id: 'm21_q9_b',
          partLetter: '(b)',
          totalMarks: 4,
          commandTerm: 'Find',
          promptText: 'Each pen may only contain one sheep. Amber and Brownie must not be placed in pens which share a boundary.',
          markCodes: [
            { code: 'M1', type: 'M', marks: 1, description: 'Total arrangements of 5 sheep in 6 pens: 6! / (6-5)! = 720' },
            { code: 'M1', type: 'M', marks: 1, description: 'Count boundary edges in 3x2 grid: 3 horizontal + 4 vertical = 7 edges (14 ordered pairs)' },
            { code: 'M1', type: 'M', marks: 1, description: 'Remaining 3 sheep: 4 * 3 * 2 = 24 => 14 * 24 = 336 forbidden ways' },
            { code: 'A1', type: 'A', marks: 1, description: '720 - 336 = 384 ways' }
          ],
          markschemeExcerpt: 'Total arrangements = 6! = 720. Shared boundaries: 7 pairs * 2 = 14 ways to place Amber and Brownie adjacent. Other 3 sheep placed in 4 remaining pens: 4P3 = 24 ways. Unfavorable = 14 * 24 = 336. Favorable = 720 - 336 = 384.'
        }
      ],
      markCodes: [
        { code: 'M1', type: 'M', marks: 1, description: 'Total 6^5 = 7776' },
        { code: 'M1', type: 'M', marks: 1, description: 'Same pen = 1296' },
        { code: 'A1', type: 'A', marks: 1, description: '6480 ways (part a)' },
        { code: 'M1', type: 'M', marks: 1, description: 'Total 6P5 = 720' },
        { code: 'M1', type: 'M', marks: 1, description: 'Boundary count = 7 edges' },
        { code: 'M1', type: 'M', marks: 1, description: 'Adjacent = 336' },
        { code: 'A1', type: 'A', marks: 1, description: '384 ways (part b)' }
      ],
      markschemeExcerpt: '(a) 6^5 - 6^4 = 6480. (b) 6P5 - 7 * 2 * 4P3 = 720 - 336 = 384.'
    },
    {
      id: 'm21_q10',
      number: '10',
      pageNumber: 10,
      totalMarks: 16,
      commandTerm: 'Find',
      syllabusSubtopic: 'Topic 4.7 & 4.8: Discrete probability distributions and expectation',
      formulaBookletRef: 'Section 4.7: E(X) = Σ x P(X = x)',
      promptText: 'Section B (Question 10):\n\nA biased four-sided die, A, is rolled. Let $X$ be the score obtained when die A is rolled. The probability distribution for $X$ is given in the following table:\n\n$$\\begin{array}{|c|c|c|c|c|}\\hline x & 1 & 2 & 3 & 4 \\\\\\hline P(X=x) & p & p & p & \\frac{1}{2}p \\\\\\hline\\end{array}$$\n\nA second biased four-sided die, B, is rolled. Let $Y$ be the score obtained when die B is rolled with distribution:\n\n$$\\begin{array}{|c|c|c|c|c|}\\hline y & 1 & 2 & 3 & 4 \\\\\\hline P(Y=y) & q & q & q & r \\\\\\hline\\end{array}$$',
      subparts: [
        {
          id: 'm21_q10_a',
          partLetter: '(a)',
          totalMarks: 2,
          commandTerm: 'Find',
          promptText: 'Find the value of $p$.',
          markCodes: [
            { code: 'M1', type: 'M', marks: 1, description: 'Sum of probabilities = 1: p + p + p + 0.5p = 1 => 3.5p = 1' },
            { code: 'A1', type: 'A', marks: 1, description: 'p = 2/7' }
          ],
          markschemeExcerpt: 'p + p + p + p/2 = 1 => 7p/2 = 1 => p = 2/7.'
        },
        {
          id: 'm21_q10_b',
          partLetter: '(b)',
          totalMarks: 2,
          commandTerm: 'Hence find',
          promptText: 'Hence, find the value of $E(X)$.',
          markCodes: [
            { code: 'M1', type: 'M', marks: 1, description: 'E(X) = 1(2/7) + 2(2/7) + 3(2/7) + 4(1/7)' },
            { code: 'A1', type: 'A', marks: 1, description: 'E(X) = 16/7' }
          ],
          markschemeExcerpt: 'E(X) = (2 + 4 + 6 + 4)/7 = 16/7.'
        },
        {
          id: 'm21_q10_c',
          partLetter: '(c)',
          totalMarks: 3,
          commandTerm: 'State & Hence find',
          promptText: '(i) State the range of possible values of $r$.\n(ii) Hence, find the range of possible values of $q$.',
          markCodes: [
            { code: 'A1', type: 'A', marks: 1, description: '0 < r < 1' },
            { code: 'M1', type: 'M', marks: 1, description: '3q + r = 1 => q = (1 - r)/3' },
            { code: 'A1', type: 'A', marks: 1, description: '0 < q < 1/3' }
          ],
          markschemeExcerpt: '(i) 0 < r < 1. (ii) 3q = 1 - r => since 0 < r < 1, 0 < q < 1/3.'
        },
        {
          id: 'm21_q10_d',
          partLetter: '(d)',
          totalMarks: 3,
          commandTerm: 'Hence find',
          promptText: 'Hence, find the range of possible values for $E(Y)$.',
          markCodes: [
            { code: 'M1', type: 'M', marks: 1, description: 'E(Y) = q + 2q + 3q + 4r = 6q + 4(1 - 3q) = 4 - 6q' },
            { code: 'A1', type: 'A', marks: 1, description: 'When q -> 0, E(Y) -> 4; when q -> 1/3, E(Y) -> 2' },
            { code: 'A1', type: 'A', marks: 1, description: '2 < E(Y) < 4' }
          ],
          markschemeExcerpt: 'E(Y) = 6q + 4r = 4 - 6q. Since 0 < q < 1/3, 2 < E(Y) < 4.'
        },
        {
          id: 'm21_q10_e',
          partLetter: '(e)',
          totalMarks: 6,
          commandTerm: 'Find',
          promptText: 'Agnes and Barbara play a game using these dice. Agnes rolls die A once and Barbara rolls die B once. The probability that Agnes’ score is less than Barbara’s score is $\\frac{1}{2}$. Find the value of $E(Y)$.',
          markCodes: [
            { code: 'M1', type: 'M', marks: 1, description: 'Summing probabilities P(A < B) = P(A=1, B>1) + P(A=2, B>2) + P(A=3, B=4)' },
            { code: 'M1', type: 'M', marks: 1, description: 'P(A < B) = (2/7)(2q + r) + (2/7)(q + r) + (2/7)(r) = (2/7)(3q + 3r)' },
            { code: 'A1', type: 'A', marks: 1, description: 'Equating to 1/2: (2/7)(3q + 3r) = 1/2 => 3q + 3r = 7/4' },
            { code: 'M1', type: 'M', marks: 1, description: 'Substitute 3q + r = 1 => 2r = 3/4 => r = 3/8' },
            { code: 'A1', type: 'A', marks: 1, description: 'q = (1 - 3/8)/3 = 5/24' },
            { code: 'A1', type: 'A', marks: 1, description: 'E(Y) = 4 - 6(5/24) = 4 - 5/4 = 11/4' }
          ],
          markschemeExcerpt: 'P(A < B) = (2/7)(3q + 3r) = 1/2 => 3q + 3r = 7/4. With 3q + r = 1, r = 3/8 and q = 5/24. E(Y) = 4 - 6(5/24) = 11/4 (or 2.75).'
        }
      ],
      markCodes: [
        { code: 'M1', type: 'M', marks: 1, description: 'p equation' },
        { code: 'A1', type: 'A', marks: 1, description: 'p = 2/7' },
        { code: 'M1', type: 'M', marks: 1, description: 'E(X) formula' },
        { code: 'A1', type: 'A', marks: 1, description: 'E(X) = 16/7' },
        { code: 'A1', type: 'A', marks: 1, description: '0 < r < 1' },
        { code: 'A1', type: 'A', marks: 1, description: '0 < q < 1/3' },
        { code: 'M1', type: 'M', marks: 1, description: 'E(Y) = 4 - 6q' },
        { code: 'A1', type: 'A', marks: 2, description: '2 < E(Y) < 4' },
        { code: 'M1', type: 'M', marks: 2, description: 'P(A < B) formulation' },
        { code: 'A1', type: 'A', marks: 2, description: 'r = 3/8, q = 5/24' },
        { code: 'A1', type: 'A', marks: 2, description: 'E(Y) = 11/4' }
      ],
      markschemeExcerpt: '(a) p = 2/7. (b) E(X) = 16/7. (c) 0 < r < 1, 0 < q < 1/3. (d) 2 < E(Y) < 4. (e) E(Y) = 11/4.'
    },
    {
      id: 'm21_q11',
      number: '11',
      pageNumber: 11,
      totalMarks: 19,
      commandTerm: 'Show that',
      syllabusSubtopic: 'Topic 3.12, 3.13 & 3.14: Vectors in 3D, angle between lines & point of intersection',
      formulaBookletRef: 'Section 3.13: r = a + λ b, cos θ = |a · b| / (|a||b|)',
      promptText: 'Section B (Question 11):\n\nConsider the line $L_1$ defined by the Cartesian equation $\\frac{x+1}{2} = y = 3-z$.',
      subparts: [
        {
          id: 'm21_q11_a',
          partLetter: '(a)',
          totalMarks: 4,
          commandTerm: 'Show that & Find',
          promptText: '(i) Show that the point $(-1, 0, 3)$ lies on $L_1$.\n(ii) Find a vector equation of $L_1$.',
          markCodes: [
            { code: 'R1', type: 'R', marks: 1, description: 'Substitute (-1, 0, 3): (-1+1)/2 = 0 = 3 - 3 = 0, therefore lies on L_1' },
            { code: 'M1', type: 'M', marks: 1, description: 'Direction vector d_1 = (2, 1, -1)' },
            { code: 'A1', type: 'A', marks: 1, description: 'r = (-1, 0, 3) + λ(2, 1, -1)' },
            { code: 'A1', type: 'A', marks: 1, description: 'State parameter λ in R' }
          ],
          markschemeExcerpt: '(-1+1)/2 = 0 = 3-3 = 0. r = (-1, 0, 3) + λ(2, 1, -1).'
        },
        {
          id: 'm21_q11_b',
          partLetter: '(b)',
          totalMarks: 8,
          commandTerm: 'Find',
          promptText: 'Consider a second line $L_2$ defined by the vector equation $\\mathbf{r} = \\begin{pmatrix}0\\\\1\\\\2\\end{pmatrix} + t\\begin{pmatrix}a\\\\1\\\\-1\\end{pmatrix}$ where $t \\in \\mathbb{R}$ and $a \\in \\mathbb{R}$.\n\nFind the possible values of $a$ when the acute angle between $L_1$ and $L_2$ is $45^\\circ$.',
          markCodes: [
            { code: 'M1', type: 'M', marks: 1, description: 'Scalar product formula: cos 45° = |d_1 · d_2| / (|d_1| * |d_2|)' },
            { code: 'A1', type: 'A', marks: 1, description: 'd_1 · d_2 = 2a + 1 + 1 = 2a + 2' },
            { code: 'A1', type: 'A', marks: 1, description: '|d_1| = sqrt(4 + 1 + 1) = sqrt(6)' },
            { code: 'A1', type: 'A', marks: 1, description: '|d_2| = sqrt(a^2 + 1 + 1) = sqrt(a^2 + 2)' },
            { code: 'M1', type: 'M', marks: 1, description: '1/sqrt(2) = |2a + 2| / (sqrt(6) * sqrt(a^2 + 2))' },
            { code: 'M1', type: 'M', marks: 1, description: 'Squaring both sides: 1/2 = (2a+2)^2 / (6(a^2+2)) => 3(a^2+2) = 4a^2 + 8a + 4' },
            { code: 'A1', type: 'A', marks: 1, description: 'a^2 + 8a - 2 = 0 or factoring quadratic' },
            { code: 'A1', type: 'A', marks: 1, description: 'Solving quadratic: a = -4 ± 3√2 (or exact values)' }
          ],
          markschemeExcerpt: 'cos 45 = 1/√2 = |2a+2| / (√6 √(a^2+2)) => 3(a^2+2) = 4(a+1)^2 => a^2 + 8a - 2 = 0 => a = -4 ± 3√2.'
        },
        {
          id: 'm21_q11_c',
          partLetter: '(c)',
          totalMarks: 7,
          commandTerm: 'Find',
          promptText: 'It is given that the lines $L_1$ and $L_2$ have a unique point of intersection, $A$, when $a \\ne k$.\n\nFind the value of $k$, and find the coordinates of the point $A$ in terms of $a$.',
          markCodes: [
            { code: 'M1', type: 'M', marks: 1, description: 'Equating components: -1 + 2λ = at, λ = 1 + t, 3 - λ = 2 - t' },
            { code: 'A1', type: 'A', marks: 1, description: 'From y and z components: λ - t = 1, consistent' },
            { code: 'M1', type: 'M', marks: 1, description: 'Solve for t and λ in terms of a: -1 + 2(1 + t) = at => 1 + 2t = at => t(a - 2) = 1' },
            { code: 'A1', type: 'A', marks: 1, description: 'Intersection requires a ≠ 2, so k = 2' },
            { code: 'A1', type: 'A', marks: 1, description: 't = 1/(a - 2), λ = (a - 1)/(a - 2)' },
            { code: 'A1', type: 'A', marks: 1, description: 'x = a/(a - 2)' },
            { code: 'A1', type: 'A', marks: 1, description: 'Coordinates of A: ( a/(a-2), (a-1)/(a-2), (2a-5)/(a-2) )' }
          ],
          markschemeExcerpt: 'k = 2. t = 1/(a-2), λ = (a-1)/(a-2). A = ( a/(a-2), (a-1)/(a-2), (2a-5)/(a-2) ).'
        }
      ],
      markCodes: [
        { code: 'R1', type: 'R', marks: 1, description: 'Point on line' },
        { code: 'M1', type: 'M', marks: 1, description: 'Direction vector' },
        { code: 'A1', type: 'A', marks: 2, description: 'Vector equation' },
        { code: 'M1', type: 'M', marks: 2, description: 'Angle formula' },
        { code: 'A1', type: 'A', marks: 4, description: 'Dot product and magnitudes' },
        { code: 'A1', type: 'A', marks: 2, description: 'Values of a' },
        { code: 'M1', type: 'M', marks: 2, description: 'Intersection system' },
        { code: 'A1', type: 'A', marks: 1, description: 'k = 2' },
        { code: 'A1', type: 'A', marks: 4, description: 'Point A coordinates' }
      ],
      markschemeExcerpt: '(a) r = (-1,0,3) + λ(2,1,-1). (b) a = -4 ± 3√2. (c) k = 2, A = (a/(a-2), (a-1)/(a-2), (2a-5)/(a-2)).'
    },
    {
      id: 'm21_q12',
      number: '12',
      pageNumber: 12,
      totalMarks: 20,
      commandTerm: 'Show that',
      syllabusSubtopic: 'Topic 5.15 & 1.15: Proof by mathematical induction & Maclaurin series',
      formulaBookletRef: 'Section 5.15: Maclaurin series f(x) = f(0) + f\'(0)x + f\'\'(0)x^2/2! + ...',
      promptText: 'Section B (Question 12):\n\nLet $f(x) = \\sqrt{1+x}$ for $x > -1$.',
      subparts: [
        {
          id: 'm21_q12_a',
          partLetter: '(a)',
          totalMarks: 3,
          commandTerm: 'Show that',
          promptText: 'Show that $f\'\'(x) = -\\frac{1}{4\\sqrt{(1+x)^3}}$.',
          markCodes: [
            { code: 'A1', type: 'A', marks: 1, description: 'f\'(x) = (1/2)(1+x)^(-1/2)' },
            { code: 'M1', type: 'M', marks: 1, description: 'f\'\'(x) = (1/2)(-1/2)(1+x)^(-3/2)' },
            { code: 'AG', type: 'AG', marks: 1, description: 'f\'\'(x) = -1 / (4 (1+x)^(3/2)) = -1 / (4 √(1+x)^3)' }
          ],
          markschemeExcerpt: 'f\'(x) = (1/2)(1+x)^(-1/2). f\'\'(x) = (-1/4)(1+x)^(-3/2) = -1 / (4 √(1+x)^3).'
        },
        {
          id: 'm21_q12_b',
          partLetter: '(b)',
          totalMarks: 9,
          commandTerm: 'Prove',
          promptText: 'Use mathematical induction to prove that $f^{(n)}(x) = \\left(-\\frac{1}{4}\\right)^{n-1} \\frac{(2n-3)!}{(n-2)!} (1+x)^{\\frac{1}{2}-n}$ for $n \\in \\mathbb{Z}, n \\ge 2$.',
          markCodes: [
            { code: 'R1', type: 'R', marks: 1, description: 'Base step n = 2: f^(2)(x) = (-1/4)^1 * (1! / 0!) * (1+x)^(-3/2) = -1/4 (1+x)^(-3/2)' },
            { code: 'A1', type: 'A', marks: 1, description: 'Base step verified true for n = 2' },
            { code: 'M1', type: 'M', marks: 1, description: 'Induction hypothesis: assume true for n = k' },
            { code: 'M1', type: 'M', marks: 1, description: 'Differentiating f^(k)(x) to find f^(k+1)(x): d/dx [ (-1/4)^(k-1) ((2k-3)!/(k-2)!) (1+x)^(1/2 - k) ]' },
            { code: 'A1', type: 'A', marks: 1, description: '(1/2 - k)(1+x)^(-1/2 - k) = -(2k-1)/2 * (1+x)^(1/2 - (k+1))' },
            { code: 'M1', type: 'M', marks: 1, description: 'Rewrite factor -(2k-1)/2 = (-1/4) * (2k-1) * 2' },
            { code: 'A1', type: 'A', marks: 1, description: '((2k-3)! / (k-2)!) * (2k-1) * 2 = ((2k-1)! / (k-1)!) = (2(k+1)-3)! / ((k+1)-2)!' },
            { code: 'A1', type: 'A', marks: 1, description: 'Obtaining (-1/4)^k * ((2(k+1)-3)! / ((k+1)-2)!) * (1+x)^(1/2 - (k+1))' },
            { code: 'R1', type: 'R', marks: 1, description: 'Conclusion: true for n=2, and if true for n=k then true for n=k+1. Hence true for all integers n >= 2.' }
          ],
          markschemeExcerpt: 'Base case n = 2 holds. Assume true for n = k. Differentiate: f^(k+1)(x) = f^(k)\'(x). Simplify algebra with factorial properties. Complete induction statement.'
        },
        {
          id: 'm21_q12_c',
          partLetter: '(c)',
          totalMarks: 8,
          commandTerm: 'Find',
          promptText: 'Let $g(x) = e^{mx}, m \\in \\mathbb{Q}$. Consider the function $h$ defined by $h(x) = f(x) \\times g(x)$ for $x > -1$.\n\nIt is given that the $x^2$ term in the Maclaurin series for $h(x)$ has a coefficient of $\\frac{7}{4}$. Find the possible values of $m$.',
          markCodes: [
            { code: 'M1', type: 'M', marks: 1, description: 'Maclaurin series for f(x): f(0) = 1, f\'(0) = 1/2, f\'\'(0) = -1/4 => f(x) = 1 + (1/2)x - (1/8)x^2 + ...' },
            { code: 'M1', type: 'M', marks: 1, description: 'Maclaurin series for g(x): e^(mx) = 1 + mx + (m^2/2)x^2 + ...' },
            { code: 'M1', type: 'M', marks: 1, description: 'Multiply expansions to collect x^2 coefficient: 1 * (m^2/2) + (1/2) * m + (-1/8) * 1' },
            { code: 'A1', type: 'A', marks: 1, description: 'Coefficient = m^2/2 + m/2 - 1/8' },
            { code: 'M1', type: 'M', marks: 1, description: 'Equate to 7/4: m^2/2 + m/2 - 1/8 = 7/4 => 4m^2 + 4m - 1 = 14 => 4m^2 + 4m - 15 = 0' },
            { code: 'M1', type: 'M', marks: 1, description: 'Factoring quadratic: (2m - 3)(2m + 5) = 0' },
            { code: 'A1', type: 'A', marks: 1, description: 'm = 3/2' },
            { code: 'A1', type: 'A', marks: 1, description: 'm = -5/2' }
          ],
          markschemeExcerpt: 'f(x) = 1 + x/2 - x^2/8 + ... g(x) = 1 + mx + m^2 x^2 / 2 + ... Coeff of x^2 is m^2/2 + m/2 - 1/8 = 7/4 => 4m^2 + 4m - 15 = 0 => m = 3/2 or m = -5/2.'
        }
      ],
      markCodes: [
        { code: 'A1', type: 'A', marks: 1, description: 'f\'(x)' },
        { code: 'M1', type: 'M', marks: 1, description: 'f\'\'(x)' },
        { code: 'AG', type: 'AG', marks: 1, description: 'f\'\'(x) shown' },
        { code: 'R1', type: 'R', marks: 1, description: 'Induction base step' },
        { code: 'M1', type: 'M', marks: 2, description: 'Induction hypothesis & differentiation' },
        { code: 'A1', type: 'A', marks: 3, description: 'Factorial and algebraic simplification' },
        { code: 'R1', type: 'R', marks: 1, description: 'Induction conclusion' },
        { code: 'M1', type: 'M', marks: 3, description: 'Maclaurin series expansion & multiplication' },
        { code: 'M1', type: 'M', marks: 2, description: 'Quadratic equation 4m^2 + 4m - 15 = 0' },
        { code: 'A1', type: 'A', marks: 2, description: 'm = 3/2, m = -5/2' }
      ],
      markschemeExcerpt: '(a) f\'\'(x) = -1 / (4 √(1+x)^3). (b) Complete proof by mathematical induction. (c) m = 3/2 or m = -5/2.'
    }
  ]
};

export const ALL_BUNDLED_PAPERS: ExamManifest[] = [
  MAY_2021_MATH_AA_HL_P1,
  BUNDLED_MATH_AA_HL,
  BUNDLED_ECONOMICS_HL
];
