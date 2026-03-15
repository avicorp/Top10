---
name: new-topic
description: Create a new learning topic with directory structure and optional per-topic LearningDNA override
user_invocable: true
arguments: <topic-name>
---

# /new-topic — Create a New Learning Topic

## Usage
`/new-topic <topic-name>`

Example: `/new-topic kubernetes`

## Flow

### Step 1: DNA Gate
1. Check if `knowledge/LearningDNA.md` exists
2. If missing → run the DNA Creation Flow before proceeding:
   a. Inform the user: "Before we start, let's set up your default Learning DNA — this shapes how all content is generated for you."
   b. Ask 8 questions one at a time using AskUserQuestion with multiple-choice options:
      - **Language:** English / Spanish / Hebrew / Chinese / Arabic
      - **Learner Type:** Kids (6-12) / Youth (13-22) / Professional (23-60) / Lifelong (60+)
      - **Content Depth:** Brief / Standard / Detailed / Comprehensive
      - **Example Style:** Minimal / Code-focused / Real-world scenarios / Mixed
      - **Visualization:** Low / Medium / High
      - **Testing Frequency:** Light (3-5 per topic) / Standard (5-10) / Heavy (10-20)
      - **Knowledge Level:** Beginner / Some exposure / Working knowledge / Expert refresher
      - **Learning Goal:** Quick refresher / Practical skills / Deep understanding / Interview prep
   c. Write responses to `knowledge/LearningDNA.md`
   d. Confirm: "Your default Learning DNA is set. You can update it anytime or create topic-specific overrides."

### Step 2: Create Directory Structure
Create the following structure:
```
knowledge/{topic-name}/
  sources/
    overview.md
  quizzes/
    quiz-bank.json    # empty array: []
```

### Step 3: Generate overview.md
Generate `overview.md` shaped by the merged LearningDNA:
- Read `knowledge/LearningDNA.md` for the current DNA settings
- **Expert refresher** → concise topic map with advanced subtopics
- **Beginner** → detailed overview with prerequisites listed
- **Kids** → simple, fun introduction with everyday analogies
- **Content depth: Brief** → bullet-point overview
- **Content depth: Comprehensive** → full introduction with context and background
- The overview should list potential subtopics to research next

### Step 4: Per-Topic DNA Override
1. Ask the user: "Would you like to adjust your Learning DNA for {topic}? Your defaults are: [show current global values]"
2. If yes: ask the same 8 questions, but each shows the global default as the first option labeled "(Current default)"
3. If the user changes any answers: write `knowledge/{topic}/LearningDNA.md` with the full profile including changes
4. If no changes: no per-topic file is created, global defaults apply

### Step 5: Suggest Next Steps
Tell the user: "Topic '{topic}' is ready! Next steps:"
- `/research {topic} <subtopic>` — to research and summarize a subtopic
- `/add-quizzes {topic}` — to generate quiz questions (after researching subtopics)
