---
name: build-app
description: Rebuild learning app data from knowledge/ content and scaffold UI if needed
user_invocable: true
arguments: "[topic]"
---

# /build-app — Rebuild Learning App Data

## Usage
`/build-app` — rebuild all topics
`/build-app <topic>` — rebuild a specific topic

## Flow

### Step 1: Scan Knowledge Directory
- Scan `knowledge/` for topics with content (directories containing `sources/` with markdown files)
- If a specific topic is provided, only process that topic
- Skip directories without source content

### Step 2: Parse Content to JSON
For each topic with content:
1. Check if a parse script exists in `learning-app/scripts/` for this topic
2. If not, create one following the pattern of existing scripts (`parse-content.ts`, `parse-sysdesign.ts`):
   - Read all markdown files from `knowledge/{topic}/sources/`
   - Parse H1/H2/H3 structure, mermaid diagrams, content sections
   - Output JSON to `learning-app/src/data/{topic}-topics.json`
3. If quiz bank exists at `knowledge/{topic}/quizzes/quiz-bank.json`:
   - Copy/transform to `learning-app/src/data/{topic}-quizzes.json`
4. Run the parse script: `npx tsx learning-app/scripts/parse-{topic}.ts`

### Step 3: Scaffold UI Pages (if needed)
If the topic lacks UI pages in `learning-app/src/`, scaffold following the sysdesign pattern:
- Check `learning-app/src/` for existing topic pages
- If missing, create the following based on the sysdesign implementation:
  - Topic home page
  - Topic detail page
  - Quiz page
  - Layout component
  - Routes configuration
  - TypeScript types
  - Progress tracking utilities

Reference the existing sysdesign implementation for patterns:
- `learning-app/src/` directory structure
- Component patterns and styling
- Route configuration
- Data loading patterns

### Step 4: Build Verification
Run the build to verify everything compiles:
```bash
cd learning-app && npm run build
```

### Step 5: Report
Report what was built:
- Which topics were processed
- Which parse scripts were created/run
- Which UI pages were scaffolded
- Build success/failure status
