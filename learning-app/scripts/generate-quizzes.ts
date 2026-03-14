import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(import.meta.dirname, '..', 'src', 'data');

interface Vulnerability {
  id: string;
  version: string;
  code: string;
  title: string;
  slug: string;
  rank: number;
  scoreData: { cwes_mapped: number; max_incidence_rate: string; avg_incidence_rate: string } | null;
  description: { plainText: string };
  prevention: { plainText: string };
  attackScenarios: { title: string; description: string; codeBlocks: { code: string }[] }[];
  cweMappings: { id: number; name: string }[];
}

interface QuizQuestion {
  id: string;
  type: string;
  difficulty: string;
  version: string;
  vulnerabilitySlug: string | null;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  codeSnippet?: string;
}

function loadVersionData(version: string): Vulnerability[] {
  const filePath = path.join(DATA_DIR, `content-${version}.json`);
  if (!fs.existsSync(filePath)) return [];
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return data.vulnerabilities;
}

function generateIdentificationQuestions(vulns: Vulnerability[], version: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  for (const vuln of vulns) {
    const desc = vuln.description.plainText;
    if (desc.length < 50) continue;

    // Take first ~100 chars of description as excerpt
    const excerpt = desc.slice(0, 120).replace(/\n/g, ' ').trim();
    const otherVulns = vulns.filter(v => v.slug !== vuln.slug);
    if (otherVulns.length < 3) continue;

    const distractors = shuffle(otherVulns).slice(0, 3).map(v => v.title);
    const options = shuffle([vuln.title, ...distractors]);
    const correctIndex = options.indexOf(vuln.title);

    questions.push({
      id: `auto-id-${version}-${vuln.id}`,
      type: 'multiple_choice',
      difficulty: 'beginner',
      version,
      vulnerabilitySlug: vuln.slug,
      question: `Which ${version} OWASP Top 10 category best matches this description?\n\n"${excerpt}..."`,
      options,
      correctIndex,
      explanation: `This describes ${vuln.code} - ${vuln.title}.`,
    });
  }
  return questions;
}

function generatePreventionQuestions(vulns: Vulnerability[], version: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  for (const vuln of vulns) {
    const prevText = vuln.prevention.plainText;
    if (prevText.length < 50) continue;

    // Extract bullet points
    const bullets = prevText.split('\n').filter(l => l.trim().length > 20);
    if (bullets.length < 1) continue;

    const correctPrevention = bullets[0].trim().slice(0, 100);
    const otherVulns = vulns.filter(v => v.slug !== vuln.slug);
    const wrongBullets = otherVulns
      .flatMap(v => v.prevention.plainText.split('\n').filter(l => l.trim().length > 20))
      .slice(0, 10);

    if (wrongBullets.length < 3) continue;

    const distractors = shuffle(wrongBullets).slice(0, 3).map(b => b.trim().slice(0, 100));
    const options = shuffle([correctPrevention, ...distractors]);
    const correctIndex = options.indexOf(correctPrevention);

    questions.push({
      id: `auto-prev-${version}-${vuln.id}`,
      type: 'multiple_choice',
      difficulty: 'intermediate',
      version,
      vulnerabilitySlug: vuln.slug,
      question: `Which of the following is a recommended prevention for ${vuln.code} - ${vuln.title}?`,
      options,
      correctIndex,
      explanation: `This prevention measure comes from the ${vuln.code} guidelines.`,
    });
  }
  return questions;
}

function generateCodeReviewQuestions(vulns: Vulnerability[], version: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  for (const vuln of vulns) {
    for (const scenario of vuln.attackScenarios) {
      if (scenario.codeBlocks.length === 0) continue;
      const code = scenario.codeBlocks[0].code;
      if (code.length < 10 || code.length > 300) continue;

      const otherVulns = vulns.filter(v => v.slug !== vuln.slug);
      if (otherVulns.length < 3) continue;

      const distractors = shuffle(otherVulns).slice(0, 3).map(v => v.title);
      const options = shuffle([vuln.title, ...distractors]);
      const correctIndex = options.indexOf(vuln.title);

      questions.push({
        id: `auto-code-${version}-${vuln.id}-${scenario.title.replace(/\s/g, '')}`,
        type: 'code_review',
        difficulty: 'intermediate',
        version,
        vulnerabilitySlug: vuln.slug,
        question: `What vulnerability does this code demonstrate?`,
        options,
        correctIndex,
        explanation: `This code example demonstrates ${vuln.code} - ${vuln.title}.`,
        codeSnippet: code,
      });

      break; // One per vulnerability
    }
  }
  return questions;
}

function generateScoreQuestions(vulns: Vulnerability[], version: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const withScores = vulns.filter(v => v.scoreData);
  if (withScores.length < 4) return questions;

  // Highest CWE count
  const sorted = [...withScores].sort((a, b) => (b.scoreData!.cwes_mapped) - (a.scoreData!.cwes_mapped));
  const highest = sorted[0];
  const distractors = shuffle(sorted.slice(1)).slice(0, 3).map(v => `${v.code} - ${v.title}`);
  const options = shuffle([`${highest.code} - ${highest.title}`, ...distractors]);

  questions.push({
    id: `auto-score-cwes-${version}`,
    type: 'multiple_choice',
    difficulty: 'advanced',
    version,
    vulnerabilitySlug: null,
    question: `Which ${version} OWASP Top 10 vulnerability has the highest number of mapped CWEs (${highest.scoreData!.cwes_mapped})?`,
    options,
    correctIndex: options.indexOf(`${highest.code} - ${highest.title}`),
    explanation: `${highest.code} - ${highest.title} has ${highest.scoreData!.cwes_mapped} mapped CWEs, the most of any category in the ${version} edition.`,
  });

  return questions;
}

function generateVersionMapQuestions(): QuizQuestion[] {
  const mapPath = path.join(DATA_DIR, 'version-map.json');
  if (!fs.existsSync(mapPath)) return [];
  const versionMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
  const questions: QuizQuestion[] = [];

  for (const mapping of versionMap) {
    if (!mapping['2017'] || !mapping['2021']) continue;

    const slug2017 = mapping['2017'] as string;
    const title2017 = slug2017.split('-').slice(2).join(' ');

    questions.push({
      id: `auto-vmap-${slug2017}`,
      type: 'multiple_choice',
      difficulty: 'intermediate',
      version: 'cross-version',
      vulnerabilitySlug: null,
      question: `The 2017 category covering "${mapping.concept}" was ranked differently in 2021. How did the OWASP Top 10 evolve for this category?`,
      options: [
        `It was merged into another category`,
        `It moved positions but remained a standalone category`,
        `It was removed from the Top 10`,
        `It stayed at the same position`,
      ],
      correctIndex: 1,
      explanation: `"${mapping.concept}" appears in both 2017 and 2021 editions but at different positions, reflecting changing threat landscapes.`,
    });
  }

  return questions.slice(0, 3); // Limit to avoid repetition
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function main() {
  console.log('Generating quizzes...');

  const allQuestions: QuizQuestion[] = [];

  for (const version of ['2017', '2021', '2025']) {
    const vulns = loadVersionData(version);
    if (vulns.length === 0) {
      console.log(`  Skipping ${version} - no data yet`);
      continue;
    }

    const idQuestions = generateIdentificationQuestions(vulns, version);
    const prevQuestions = generatePreventionQuestions(vulns, version);
    const codeQuestions = generateCodeReviewQuestions(vulns, version);
    const scoreQuestions = generateScoreQuestions(vulns, version);

    allQuestions.push(...idQuestions, ...prevQuestions, ...codeQuestions, ...scoreQuestions);
    console.log(`  ${version}: ${idQuestions.length} identification + ${prevQuestions.length} prevention + ${codeQuestions.length} code review + ${scoreQuestions.length} score questions`);
  }

  // Cross-version questions
  const versionMapQuestions = generateVersionMapQuestions();
  allQuestions.push(...versionMapQuestions);
  console.log(`  Cross-version: ${versionMapQuestions.length} questions`);

  // Merge hand-crafted questions
  const quizBankPath = path.resolve(import.meta.dirname, 'quiz-bank.json');
  if (fs.existsSync(quizBankPath)) {
    const handCrafted: QuizQuestion[] = JSON.parse(fs.readFileSync(quizBankPath, 'utf-8'));
    allQuestions.push(...handCrafted);
    console.log(`  Hand-crafted: ${handCrafted.length} questions`);
  }

  console.log(`  Total: ${allQuestions.length} questions`);

  fs.writeFileSync(
    path.join(DATA_DIR, 'quizzes.json'),
    JSON.stringify(allQuestions, null, 2)
  );

  // Generate sysdesign quizzes
  const sysdesignQuizBankPath = path.resolve(import.meta.dirname, 'sysdesign-quiz-bank.json');
  if (fs.existsSync(sysdesignQuizBankPath)) {
    const sysdesignQuestions = JSON.parse(fs.readFileSync(sysdesignQuizBankPath, 'utf-8'));
    fs.writeFileSync(
      path.join(DATA_DIR, 'sysdesign-quizzes.json'),
      JSON.stringify(sysdesignQuestions, null, 2)
    );
    console.log(`  System Design: ${sysdesignQuestions.length} questions`);
  }

  console.log('Quiz generation complete!');
}

main();
