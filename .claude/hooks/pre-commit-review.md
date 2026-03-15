---
name: pre-commit-review
description: 3-iteration review loop for knowledge/ changes — validates quality before commits
---

# Pre-Commit Review Hook

## Trigger
Pre-commit hook that activates when files in `knowledge/` are staged for commit. Non-knowledge commits pass through normally.

## 3-Iteration Review Loop

### Iteration 1: Initial Review
1. Dispatch `content-reviewer` agent to scan all staged `knowledge/` files
2. Checks performed:
   - Markdown structure (H1 → H2 → H3 hierarchy)
   - `## References` section present with URLs
   - Content depth matches LearningDNA settings
   - Mermaid diagram syntax validity
   - No orphaned subtopics (mentioned in overview but no source file)
3. If issues found: auto-fix what's possible (missing separators, missing language tags)
4. Stage any auto-fixes
5. Report issues that need manual review

### Iteration 2: Build + Secondary Review
1. Run `/build-app` to regenerate learning-app data from updated knowledge/
2. Dispatch `content-reviewer` agent again (catches issues introduced by auto-fixes)
3. Dispatch `quiz-improver` agent to review any staged quiz files:
   - Quiz bank JSON schema compliance
   - Explanation quality
   - Difficulty distribution vs DNA settings
4. Auto-fix remaining auto-fixable issues
5. Stage any new fixes

### Iteration 3: Final Pass
1. Dispatch `content-reviewer` agent for final review
2. If issues remain: WARN but allow commit (log remaining issues)
3. If clean: commit proceeds without warnings

## Exit Behavior
After 3 iterations, remaining issues are logged as warnings but the commit is allowed to proceed.

Output format:
```
[Learning Review] 3/3 iterations complete
✓ N checks passed
⚠ M warnings remaining:
  - knowledge/{topic}/sources/{file}.md: {issue description}
  - knowledge/{topic}/quizzes/quiz-bank.json: {issue description}
Committing with warnings.
```

If all checks pass:
```
[Learning Review] 3/3 iterations complete
✓ All N checks passed
Commit approved.
```

## Checks Summary

| Check | Auto-fixable | Category |
|-------|-------------|----------|
| H1 title present | No | Structure |
| Heading hierarchy (H1→H2→H3) | No | Structure |
| Section separators (`---`) | Yes | Structure |
| `## References` section exists | Yes (adds empty) | References |
| References contain URLs | No | References |
| Mermaid language tag on code blocks | Yes | Mermaid |
| Mermaid syntax valid | No | Mermaid |
| Content depth matches DNA | No | DNA Alignment |
| Visualization density matches DNA | No | DNA Alignment |
| Content language matches DNA | No | DNA Alignment |
| Quiz JSON schema valid | No | Quiz |
| Quiz explanations educational | No | Quiz |
| Quiz difficulty distribution | No | Quiz |
| Orphaned subtopic references | No | Coverage |
