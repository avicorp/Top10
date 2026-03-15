# Top10 — Personalized Learning Platform

## Vision

A personalized learning platform where learners define their LearningDNA profile, pick topics, and Claude researches, summarizes, and builds quizzes adapted to their learning style.

## LearningDNA System

Every learner has a unique profile (`knowledge/LearningDNA.md`) that shapes all generated content. Per-topic overrides (`knowledge/{topic}/LearningDNA.md`) can customize any dimension for a specific topic. Every skill checks for LearningDNA before proceeding — if it doesn't exist, an interactive questionnaire creates it.

**Dimensions:** Language, Learner Type, Content Depth, Example Style, Visualization, Testing Frequency, Knowledge Level, Learning Goal.

### How DNA Shapes Content

- `Language: Hebrew` → all content, quizzes, explanations generated in Hebrew (RTL considered)
- `Learner type: Kids` → simple language, playful tone, everyday analogies, gamified quizzes
- `Learner type: Professional` → industry terminology, career-focused, production-ready examples
- `Content depth: Brief` → bullet-point summaries, skip theory
- `Content depth: Comprehensive` → full explanations with background theory
- `Visualization: High` → mermaid diagram for every major concept
- `Visualization: Low` → diagrams only for complex architectures
- `Testing: Heavy` → 10-20 questions per subtopic across all difficulty levels
- `Knowledge level: Expert refresher` → skip basics, focus on nuances and edge cases

## Directory Layout

```
knowledge/LearningDNA.md              — global learner profile
knowledge/{topic}/                     — topic content
knowledge/{topic}/LearningDNA.md       — optional per-topic DNA override
knowledge/{topic}/sources/             — research markdown files
knowledge/{topic}/quizzes/             — quiz bank JSON
learning-app/                          — React 19 + TypeScript + Vite + Tailwind + Mermaid UI
```

Legacy directories (2017, 2021, 2025, sys-design) are existing content — don't modify.

## Content Conventions

- Source markdown: H1 title, H2 numbered sections, H3 subsections, mermaid in triple backticks, `---` separators
- Each file includes `## References` with source URLs
- Quiz bank schema: `{id, topicSlug, question, options[], correctIndex, explanation, difficulty}`

## Build Pipeline

`learning-app/scripts/` parse markdown → JSON in `learning-app/src/data/`

## Tech Stack

React 19, TypeScript, Vite 6, Tailwind CSS 4, Mermaid 11, Vercel, Node 22

## Skills

- `/new-topic <name>` — create a new learning topic with directory structure
- `/research <topic> <subtopic>` — research and summarize a subtopic
- `/add-quizzes <topic>` — generate quiz questions from source material
- `/build-app` — rebuild learning app data from knowledge/ content

## Agents

- `content-reviewer` — validates learning materials quality
- `quiz-improver` — improves quiz questions quality
- `topic-expander` — suggests subtopics and scoping improvements
