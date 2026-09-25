# Criterion

Criterion is an exam practice app for IB Diploma students. You sit an IB-style paper under timed conditions, writing your working by hand on the page, and an AI examiner marks it the way IB examiners do: method marks (M1), accuracy marks (A1), reasoning marks (R1), and Error Carried Forward, so one early slip doesn't cost you every mark after it. When you want to practise instead of sit, a Socratic tutor guides you through a question in four tiers of hints and only shows the markscheme at the last one.

I built it as part of my IB CAS (Creativity, Activity, Service) portfolio.

> Criterion writes IB-style practice papers and marks them in the IB's method. It is not affiliated with or endorsed by the International Baccalaureate.

## What you can do

- **Timed exam**: sit a whole paper against the clock, including reading time, with the formula booklet at hand. You write your working on the page with a pen or mouse. Your work saves as you go, so you can leave and resume.
- **Examiner marking**: every question gets a mark-by-mark breakdown, the examiner's comments, a predicted IB grade (1–7) and a syllabus breakdown of where you lost marks.
- **Guided practice**: work through a question with a tutor that asks questions instead of giving the answer away.
- **Your own papers**: upload a question paper and its markscheme as PDFs to practise on them.

Your papers, scripts and results are stored in your browser (IndexedDB). Nothing is saved on a server.

## You need a free Gemini API key

Criterion uses Google's Gemini models for marking and tutoring. Each person uses their own key, so the app costs nothing to run and your key is only used for your own marking.

1. Go to [Google AI Studio](https://aistudio.google.com/apikey) and sign in with a Google account.
2. Click **Create API key** and copy it.
3. In Criterion, open **Settings** (the gear icon), paste the key under **API key**, and save.

The key stays in your browser. It is sent only with your own marking and tutoring requests.

A [Z.AI](https://z.ai) key for GLM-OCR handwriting recognition is **optional**. Marking works without it.

## Run it locally

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and add your Gemini key in Settings. You don't need a `.env` file: the server never uses a key of its own.

Before committing, run the checks:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Deploy

The app deploys to [Vercel](https://vercel.com) as a standard Next.js project with no environment variables. Import the repository and deploy. Every visitor brings their own Gemini key.

## Built with

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, the `@google/genai` SDK, IndexedDB via `idb-keyval`, and KaTeX for mathematics.

## Project docs

- [`PRODUCT.md`](PRODUCT.md): who Criterion is for and the rules it follows
- [`CONTEXT.md`](CONTEXT.md): the domain glossary (ECF, mark codes, tiers)
- [`DESIGN.md`](DESIGN.md): the "Subject Report" design system
- [`docs/adr/`](docs/adr/): architecture decision records
