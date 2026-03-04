import fs from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeHighlight from 'rehype-highlight';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const OUT = path.resolve(import.meta.dirname, '..', 'src', 'data');

interface ScoreData {
  cwes_mapped: number;
  max_incidence_rate: string;
  avg_incidence_rate: string;
  max_coverage: string;
  avg_coverage: string;
  avg_weighted_exploit: string;
  avg_weighted_impact: string;
  total_occurrences: string;
  total_cves: string;
}

interface RiskRating {
  exploitability: number;
  prevalence: number;
  detectability: number;
  technical_impact: number;
}

interface VulnerabilitySection {
  html: string;
  plainText: string;
}

interface AttackScenario {
  title: string;
  description: string;
  codeBlocks: { language: string; code: string; label?: string }[];
}

interface Reference {
  title: string;
  url: string;
  category: 'owasp' | 'external';
}

interface CweMapping {
  id: number;
  name: string;
  url: string;
}

interface Vulnerability {
  id: string;
  version: string;
  code: string;
  title: string;
  slug: string;
  rank: number;
  iconPath: string | null;
  backgroundHtml: string | null;
  scoreData: ScoreData | null;
  riskRating: RiskRating | null;
  description: VulnerabilitySection;
  prevention: VulnerabilitySection;
  attackScenarios: AttackScenario[];
  references: Reference[];
  cweMappings: CweMapping[];
}

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeHighlight, { detect: true })
  .use(rehypeStringify, { allowDangerousHtml: true });

async function mdToHtml(md: string): Promise<string> {
  const result = await markdownProcessor.process(md);
  return String(result);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ─── Icon mapping ───
const ICON_MAP_2025: Record<string, string> = {
  'A01': 'TOP_10_Icons_Final_Broken_Access_Control.png',
  'A02': 'TOP_10_Icons_Final_Security_Misconfiguration.png',
  'A03': 'TOP_10_Icons_Final_Vulnerable_Outdated_Components.png',
  'A04': 'TOP_10_Icons_Final_Crypto_Failures.png',
  'A05': 'TOP_10_Icons_Final_Injection.png',
  'A06': 'TOP_10_Icons_Final_Insecure_Design.png',
  'A07': 'TOP_10_Icons_Final_Identification_and_Authentication_Failures.png',
  'A08': 'TOP_10_Icons_Final_Software_and_Data_Integrity_Failures.png',
  'A09': 'TOP_10_Icons_Final_Security_Logging_and_Monitoring_Failures.png',
  'A10': 'TOP_10_Icons_Final_Mishandling_of_Exceptional_Conditions.png',
};

const ICON_MAP_2021: Record<string, string> = {
  'A01': 'TOP_10_Icons_Final_Broken_Access_Control.png',
  'A02': 'TOP_10_Icons_Final_Crypto_Failures.png',
  'A03': 'TOP_10_Icons_Final_Injection.png',
  'A04': 'TOP_10_Icons_Final_Insecure_Design.png',
  'A05': 'TOP_10_Icons_Final_Security_Misconfiguration.png',
  'A06': 'TOP_10_Icons_Final_Vulnerable_Outdated_Components.png',
  'A07': 'TOP_10_Icons_Final_Identification_and_Authentication_Failures.png',
  'A08': 'TOP_10_Icons_Final_Software_and_Data_Integrity_Failures.png',
  'A09': 'TOP_10_Icons_Final_Security_Logging_and_Monitoring_Failures.png',
  'A10': 'TOP_10_Icons_Final_SSRF.png',
};

// ─── Section splitting ───
function splitSections(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = content.split('\n');
  let currentHeading = '__preamble__';
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^## (.+)$/);
    if (headingMatch) {
      if (currentContent.length > 0) {
        sections.set(currentHeading, currentContent.join('\n').trim());
      }
      currentHeading = headingMatch[1].replace(/\.\s*$/, '').trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  if (currentContent.length > 0) {
    sections.set(currentHeading, currentContent.join('\n').trim());
  }
  return sections;
}

function findSection(sections: Map<string, string>, ...names: string[]): string | null {
  for (const name of names) {
    for (const [key, value] of sections) {
      if (key.toLowerCase() === name.toLowerCase()) return value;
    }
  }
  // Partial match
  for (const name of names) {
    for (const [key, value] of sections) {
      if (key.toLowerCase().includes(name.toLowerCase())) return value;
    }
  }
  return null;
}

// ─── Parse score data from HTML table (2025) ───
function parseHtmlScoreTable(html: string): ScoreData | null {
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const cells: string[] = [];
  let match;
  while ((match = tdRegex.exec(html)) !== null) {
    cells.push(match[1].trim());
  }
  if (cells.length < 18) return null;
  // First 9 are headers, next 9 are values
  return {
    cwes_mapped: parseInt(cells[9]) || 0,
    max_incidence_rate: cells[10],
    avg_incidence_rate: cells[11],
    max_coverage: cells[12],
    avg_coverage: cells[13],
    avg_weighted_exploit: cells[14],
    avg_weighted_impact: cells[15],
    total_occurrences: cells[16],
    total_cves: cells[17],
  };
}

// ─── Parse score data from markdown pipe table (2021) ───
function parseMdScoreTable(md: string): ScoreData | null {
  const lines = md.split('\n').filter(l => l.trim().startsWith('|'));
  if (lines.length < 3) return null;
  // Third line has values (first is header, second is separator)
  const vals = lines[2].split('|').map(s => s.trim()).filter(Boolean);
  if (vals.length < 9) return null;
  return {
    cwes_mapped: parseInt(vals[0]) || 0,
    max_incidence_rate: vals[1],
    avg_incidence_rate: vals[2],
    avg_weighted_exploit: vals[3],
    avg_weighted_impact: vals[4],
    max_coverage: vals[5],
    avg_coverage: vals[6],
    total_occurrences: vals[7],
    total_cves: vals[8],
  };
}

// ─── Parse risk rating from 2017 table ───
function parseRiskRating(tableRow: string): RiskRating | null {
  const exploitMatch = tableRow.match(/Exploitability\s+(\d)/i);
  const prevalenceMatch = tableRow.match(/Prevalence\s+(\d)/i);
  const detectMatch = tableRow.match(/Detectability\s+(\d)/i);
  const techMatch = tableRow.match(/Technical\s+(\d)/i);
  if (!exploitMatch || !prevalenceMatch || !detectMatch || !techMatch) return null;
  return {
    exploitability: parseInt(exploitMatch[1]),
    prevalence: parseInt(prevalenceMatch[1]),
    detectability: parseInt(detectMatch[1]),
    technical_impact: parseInt(techMatch[1]),
  };
}

// ─── Parse attack scenarios ───
function parseAttackScenarios(text: string): AttackScenario[] {
  const scenarios: AttackScenario[] = [];
  // Split on **Scenario #N** pattern
  const parts = text.split(/\*\*Scenario #\d+[^*]*\*\*:?\s*/);

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const codeBlocks: { language: string; code: string; label?: string }[] = [];

    // Extract fenced code blocks
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let codeMatch;
    while ((codeMatch = codeBlockRegex.exec(part)) !== null) {
      codeBlocks.push({
        language: codeMatch[1] || 'text',
        code: codeMatch[2].trim(),
      });
    }

    // Extract inline code blocks (backtick-wrapped lines that look like code examples)
    if (codeBlocks.length === 0) {
      const inlineCodeRegex = /`([^`]{10,})`/g;
      let inlineMatch;
      while ((inlineMatch = inlineCodeRegex.exec(part)) !== null) {
        codeBlocks.push({
          language: 'text',
          code: inlineMatch[1].trim(),
        });
      }
    }

    const descriptionText = part
      .replace(/```\w*\n[\s\S]*?```/g, '')
      .replace(/`[^`]{10,}`/g, '')
      .trim();

    scenarios.push({
      title: `Scenario #${i}`,
      description: descriptionText,
      codeBlocks,
    });
  }
  return scenarios;
}

// ─── Parse references ───
function parseReferences(text: string, hasSubsections: boolean): Reference[] {
  const refs: Reference[] = [];
  if (hasSubsections) {
    // 2017 style with ### OWASP and ### External
    let category: 'owasp' | 'external' = 'owasp';
    for (const line of text.split('\n')) {
      if (line.match(/###.*external/i)) { category = 'external'; continue; }
      if (line.match(/###.*owasp/i)) { category = 'owasp'; continue; }
      const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        refs.push({ title: linkMatch[1], url: linkMatch[2], category });
      }
    }
  } else {
    // 2021/2025 flat list
    for (const line of text.split('\n')) {
      const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const title = linkMatch[1];
        const url = linkMatch[2];
        const isOwasp = url.includes('owasp.org') || title.toLowerCase().includes('owasp');
        refs.push({ title, url, category: isOwasp ? 'owasp' : 'external' });
      }
    }
  }
  return refs;
}

// ─── Parse CWE mappings ───
function parseCweMappings(text: string): CweMapping[] {
  const cwes: CweMapping[] = [];
  const cweRegex = /\[CWE-(\d+)\s+([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = cweRegex.exec(text)) !== null) {
    cwes.push({ id: parseInt(match[1]), name: match[2].trim(), url: match[3] });
  }
  return cwes;
}

// ─── Parse CWEs from 2017 external references ───
function parseCwesFromReferences(refs: Reference[]): CweMapping[] {
  const cwes: CweMapping[] = [];
  for (const ref of refs) {
    const cweMatch = ref.title.match(/CWE-(\d+):\s*(.*)/);
    if (cweMatch) {
      cwes.push({ id: parseInt(cweMatch[1]), name: cweMatch[2].trim(), url: ref.url });
    }
  }
  return cwes;
}

// ─── 2025 Parser ───
async function parse2025(): Promise<Vulnerability[]> {
  const dir = path.join(ROOT, '2025', 'docs', 'en');
  const files = fs.readdirSync(dir).filter(f => /^A\d{2}_2025/.test(f)).sort();
  const vulns: Vulnerability[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    const rankMatch = file.match(/A(\d{2})/);
    const rank = rankMatch ? parseInt(rankMatch[1]) : 0;
    const id = `A${rank.toString().padStart(2, '0')}`;
    const code = `${id}:2025`;

    // Parse title: strip icon markdown like ![icon](../assets/...) {...}
    const titleLine = content.split('\n')[0];
    const title = titleLine
      .replace(/^#\s+/, '')           // Remove leading #
      .replace(/\s*!\[icon\]\(.*$/, '') // Strip ![icon](...){...}
      .replace(/^\S+\s+/, '')          // Remove code prefix like "A01:2025 "
      .trim();

    const sections = splitSections(content);

    // Score table - find the raw HTML table in the score section
    const scoreSection = findSection(sections, 'Score table', 'Score');
    let scoreData: ScoreData | null = null;
    if (scoreSection && scoreSection.includes('<table>')) {
      scoreData = parseHtmlScoreTable(scoreSection);
    }

    // Background
    const bgRaw = findSection(sections, 'Background');
    const backgroundHtml = bgRaw ? await mdToHtml(bgRaw) : null;

    // Description
    const descRaw = findSection(sections, 'Description') || '';
    const descHtml = await mdToHtml(descRaw);

    // Prevention
    const prevRaw = findSection(sections, 'How to prevent', 'How to Prevent') || '';
    const prevHtml = await mdToHtml(prevRaw);

    // Attack scenarios
    const scenarioRaw = findSection(sections, 'Example attack scenarios', 'Example Attack Scenarios') || '';
    const attackScenarios = parseAttackScenarios(scenarioRaw);

    // References
    const refRaw = findSection(sections, 'References') || '';
    const references = parseReferences(refRaw, false);

    // CWE mappings
    const cweRaw = findSection(sections, 'List of Mapped CWEs') || '';
    const cweMappings = parseCweMappings(cweRaw);

    const slug = slugify(`${code}-${title}`);
    const iconPath = ICON_MAP_2025[id] ? `icons/2025/${ICON_MAP_2025[id]}` : null;

    vulns.push({
      id, version: '2025', code, title, slug, rank, iconPath,
      backgroundHtml,
      scoreData, riskRating: null,
      description: { html: descHtml, plainText: stripHtml(descHtml) },
      prevention: { html: prevHtml, plainText: stripHtml(prevHtml) },
      attackScenarios, references, cweMappings,
    });
  }
  return vulns;
}

// ─── 2021 Parser ───
async function parse2021(): Promise<Vulnerability[]> {
  const dir = path.join(ROOT, '2021', 'docs', 'en');
  const files = fs.readdirSync(dir).filter(f => /^A\d{2}_2021/.test(f) && !f.includes('A00') && !f.includes('A11')).sort();
  const vulns: Vulnerability[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    const rankMatch = file.match(/A(\d{2})/);
    const rank = rankMatch ? parseInt(rankMatch[1]) : 0;
    const id = `A${rank.toString().padStart(2, '0')}`;
    const code = `${id}:2021`;

    // Parse title: strip code prefix, "–" separator, and icon markdown
    const titleLine = content.split('\n')[0];
    let title = titleLine
      .replace(/^#\s+/, '')              // Remove leading #
      .replace(/\s*!\[icon\]\(.*$/, '')  // Strip ![icon](...){...}
      .trim();
    // Remove code + separator: "A01:2021 – " or "A01:2021 "
    if (title.includes('–')) {
      title = title.replace(/^\S+\s+–\s+/, '').trim();
    } else {
      title = title.replace(/^\S+\s+/, '').trim();
    }

    const sections = splitSections(content);

    // Score data from Factors section (markdown pipe table)
    const factorsRaw = findSection(sections, 'Factors');
    let scoreData: ScoreData | null = null;
    if (factorsRaw) {
      scoreData = parseMdScoreTable(factorsRaw);
    }

    // Background/Overview
    const bgRaw = findSection(sections, 'Overview');
    const backgroundHtml = bgRaw ? await mdToHtml(bgRaw) : null;

    // Description
    const descRaw = findSection(sections, 'Description') || '';
    const descHtml = await mdToHtml(descRaw);

    // Prevention
    const prevRaw = findSection(sections, 'How to Prevent') || '';
    const prevHtml = await mdToHtml(prevRaw);

    // Attack scenarios
    const scenarioRaw = findSection(sections, 'Example Attack Scenarios') || '';
    const attackScenarios = parseAttackScenarios(scenarioRaw);

    // References
    const refRaw = findSection(sections, 'References') || '';
    const references = parseReferences(refRaw, false);

    // CWE mappings
    const cweRaw = findSection(sections, 'List of Mapped CWEs') || '';
    const cweMappings = parseCweMappings(cweRaw);

    const slug = slugify(`${code}-${title}`);
    const iconPath = ICON_MAP_2021[id] ? `icons/2021/${ICON_MAP_2021[id]}` : null;

    vulns.push({
      id, version: '2021', code, title, slug, rank, iconPath,
      backgroundHtml,
      scoreData, riskRating: null,
      description: { html: descHtml, plainText: stripHtml(descHtml) },
      prevention: { html: prevHtml, plainText: stripHtml(prevHtml) },
      attackScenarios, references, cweMappings,
    });
  }
  return vulns;
}

// ─── 2017 Parser ───
const FILE_MAP_2017: { file: string; id: string; rank: number }[] = [
  { file: '0xa1-injection.md', id: 'A1', rank: 1 },
  { file: '0xa2-broken-authentication.md', id: 'A2', rank: 2 },
  { file: '0xa3-sensitive-data-disclosure.md', id: 'A3', rank: 3 },
  { file: '0xa4-xxe.md', id: 'A4', rank: 4 },
  { file: '0xa5-broken-access-control.md', id: 'A5', rank: 5 },
  { file: '0xa6-security-misconfiguration.md', id: 'A6', rank: 6 },
  { file: '0xa7-xss.md', id: 'A7', rank: 7 },
  { file: '0xa8-insecure-deserialization.md', id: 'A8', rank: 8 },
  { file: '0xa9-known-vulns.md', id: 'A9', rank: 9 },
  { file: '0xaa-logging-detection-response.md', id: 'A10', rank: 10 },
];

async function parse2017(): Promise<Vulnerability[]> {
  const dir = path.join(ROOT, '2017', 'en');
  const vulns: Vulnerability[] = [];

  for (const entry of FILE_MAP_2017) {
    const filePath = path.join(dir, entry.file);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf-8');
    const code = `${entry.id}:2017`;

    // Parse title
    const titleLine = content.split('\n')[0];
    const title = titleLine.replace(/^#\s+\S+\s+/, '').trim();

    // Parse risk rating from the first table
    const tableLines = content.split('\n').filter(l => l.includes('Exploitability') || l.includes('Technical'));
    const riskRating = tableLines.length > 0 ? parseRiskRating(tableLines[0]) : null;

    const sections = splitSections(content);

    // Description (from "Is the Application Vulnerable?" section)
    const descRaw = findSection(sections, 'Is the Application Vulnerable?', 'Is the Application Vulnerable') || '';
    const descHtml = await mdToHtml(descRaw);

    // Prevention
    const prevRaw = findSection(sections, 'How To Prevent', 'How to Prevent') || '';
    const prevHtml = await mdToHtml(prevRaw);

    // Attack scenarios
    const scenarioRaw = findSection(sections, 'Example Attack Scenarios') || '';
    const attackScenarios = parseAttackScenarios(scenarioRaw);

    // References (with subsections)
    const refRaw = findSection(sections, 'References') || '';
    const hasSubsections = refRaw.includes('### ');
    const references = parseReferences(refRaw, hasSubsections);

    // CWE mappings from external references
    const cweMappings = parseCwesFromReferences(references.filter(r => r.category === 'external'));

    const slug = slugify(`${code}-${title}`);

    vulns.push({
      id: entry.id, version: '2017', code, title, slug, rank: entry.rank,
      iconPath: null,
      backgroundHtml: null,
      scoreData: null, riskRating,
      description: { html: descHtml, plainText: stripHtml(descHtml) },
      prevention: { html: prevHtml, plainText: stripHtml(prevHtml) },
      attackScenarios, references, cweMappings,
    });
  }
  return vulns;
}

// ─── Copy icons ───
function copyIcons() {
  const iconOutDir = path.join(OUT, '..', 'assets', 'icons');
  for (const ver of ['2021', '2025'] as const) {
    const srcDir = path.join(ROOT, ver, 'docs', 'assets');
    const destDir = path.join(iconOutDir, ver);
    fs.mkdirSync(destDir, { recursive: true });
    const iconFiles = fs.readdirSync(srcDir).filter(f => f.startsWith('TOP_10_Icons'));
    for (const f of iconFiles) {
      fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));
    }
  }
  console.log('  Icons copied.');
}

// ─── Version mapping ───
const VERSION_MAP = [
  { concept: 'Broken Access Control', '2017': 'a5-2017-broken-access-control', '2021': 'a01-2021-broken-access-control', '2025': 'a01-2025-broken-access-control' },
  { concept: 'Cryptographic Failures', '2017': 'a3-2017-sensitive-data-disclosure', '2021': 'a02-2021-cryptographic-failures', '2025': 'a04-2025-cryptographic-failures' },
  { concept: 'Injection', '2017': 'a1-2017-injection', '2021': 'a03-2021-injection', '2025': 'a05-2025-injection' },
  { concept: 'Insecure Design', '2017': null, '2021': 'a04-2021-insecure-design', '2025': 'a06-2025-insecure-design' },
  { concept: 'Security Misconfiguration', '2017': 'a6-2017-security-misconfiguration', '2021': 'a05-2021-security-misconfiguration', '2025': 'a02-2025-security-misconfiguration' },
  { concept: 'Vulnerable & Outdated Components / Supply Chain', '2017': 'a9-2017-using-components-with-known-vulnerabilities', '2021': 'a06-2021-vulnerable-and-outdated-components', '2025': 'a03-2025-software-supply-chain-failures' },
  { concept: 'Authentication Failures', '2017': 'a2-2017-broken-authentication', '2021': 'a07-2021-identification-and-authentication-failures', '2025': 'a07-2025-authentication-failures' },
  { concept: 'Software & Data Integrity Failures', '2017': 'a8-2017-insecure-deserialization', '2021': 'a08-2021-software-and-data-integrity-failures', '2025': 'a08-2025-software-or-data-integrity-failures' },
  { concept: 'Security Logging & Monitoring Failures', '2017': 'a10-2017-insufficient-logging-detection-response', '2021': 'a09-2021-security-logging-and-monitoring-failures', '2025': 'a09-2025-security-logging-and-alerting-failures' },
  { concept: 'SSRF / Mishandling Exceptional Conditions', '2017': null, '2021': 'a10-2021-server-side-request-forgery-ssrf-', '2025': 'a10-2025-mishandling-of-exceptional-conditions' },
  { concept: 'XXE', '2017': 'a4-2017-xxe', '2021': null, '2025': null },
  { concept: 'XSS', '2017': 'a7-2017-xss', '2021': null, '2025': null },
];

// ─── Main ───
async function main() {
  console.log('Parsing OWASP Top 10 content...');
  fs.mkdirSync(OUT, { recursive: true });

  const [v2025, v2021, v2017] = await Promise.all([
    parse2025(),
    parse2021(),
    parse2017(),
  ]);

  console.log(`  2025: ${v2025.length} vulnerabilities`);
  console.log(`  2021: ${v2021.length} vulnerabilities`);
  console.log(`  2017: ${v2017.length} vulnerabilities`);

  fs.writeFileSync(path.join(OUT, 'content-2025.json'), JSON.stringify({ version: '2025', vulnerabilities: v2025 }, null, 2));
  fs.writeFileSync(path.join(OUT, 'content-2021.json'), JSON.stringify({ version: '2021', vulnerabilities: v2021 }, null, 2));
  fs.writeFileSync(path.join(OUT, 'content-2017.json'), JSON.stringify({ version: '2017', vulnerabilities: v2017 }, null, 2));
  fs.writeFileSync(path.join(OUT, 'version-map.json'), JSON.stringify(VERSION_MAP, null, 2));

  copyIcons();

  console.log('Content parsing complete!');
}

main().catch(err => { console.error(err); process.exit(1); });
