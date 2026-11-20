import type { CaseSessionConfig, CaseStage, CaseType, Difficulty, ParsedTable, ScorecardRow } from '../types/case';

export const CASE_STAGES: CaseStage[] = [
  'Clarify',
  'Structure',
  'Analyse',
  'Recommend',
  'Feedback',
];

export const INDUSTRIES = [
  'Coffee shops',
  'Airlines',
  'Clothing retail',
  'Fitness gyms',
  'Hotels',
  'Food delivery',
  'Consumer electronics',
  'Grocery stores',
] as const;

export const PROFITABILITY_ROOT_CAUSES = [
  'falling customer volume',
  'lower average price or spend',
  'a shift to lower-margin products',
  'rising variable costs',
  'rising fixed costs',
] as const;

export function buildCaseStartPayload(
  caseType: CaseType,
  difficulty: Difficulty,
  selectedIndustry: string,
): CaseSessionConfig {
  const resolvedIndustry =
    selectedIndustry === 'Let CaseCoach choose'
      ? INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)]
      : selectedIndustry;

  const initialVisibleMessage = `${caseType} case, ${difficulty.toLowerCase()} difficulty, ${resolvedIndustry.toLowerCase()} industry.`;

  let hiddenSetting: string | null = null;
  let hiddenInstruction = '';

  if (caseType === 'Profitability') {
    const rootCause =
      PROFITABILITY_ROOT_CAUSES[Math.floor(Math.random() * PROFITABILITY_ROOT_CAUSES.length)];
    hiddenSetting = rootCause;
    hiddenInstruction = `\n[Hidden case setting from the app. Do not mention it to the student. Build this case around this root cause: ${rootCause}.]`;
  } else if (caseType === 'Market entry') {
    const attractiveness = Math.random() < 0.5 ? 'attractive' : 'unattractive';
    hiddenSetting = `${attractiveness} economics of entry`;
    hiddenInstruction = `\n[Hidden case setting from the app. Do not mention it to the student. Build the case data so that the economics of entry are ${attractiveness}.]`;
  }

  return {
    caseType,
    difficulty,
    industry: resolvedIndustry,
    hiddenSetting,
    initialVisibleMessage,
    initialApiMessage: `${initialVisibleMessage}${hiddenInstruction}`,
  };
}

const STAGE_TAG_REGEX = /\[STAGE:\s*(Clarify|Structure|Analyse|Recommend|Feedback)\s*\]/gi;

export function parseStageTag(rawText: string): {
  stage: CaseStage | null;
  displayContent: string;
} {
  let detectedStage: CaseStage | null = null;
  const matches = [...rawText.matchAll(STAGE_TAG_REGEX)];
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1][1];
    const normalized = CASE_STAGES.find(
      (s) => s.toLowerCase() === lastMatch.toLowerCase(),
    );
    if (normalized) {
      detectedStage = normalized;
    }
  }

  const displayContent = rawText
    .replace(STAGE_TAG_REGEX, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { stage: detectedStage, displayContent };
}

function splitMarkdownRow(line: string): string[] {
  const trimmed = line.trim();
  const withoutOuterPipes = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  return withoutOuterPipes.split('|').map((cell) => cell.trim());
}

function isSeparatorLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|') || !trimmed.includes('-')) {
    return false;
  }
  const cells = splitMarkdownRow(trimmed);
  return (
    cells.length > 0 &&
    cells.every((cell) => /^:?-{2,}:?$/.test(cell.replace(/\s+/g, '')))
  );
}

export function extractMarkdownTables(markdown: string): ParsedTable[] {
  const lines = markdown.split(/\r?\n/);
  const tables: ParsedTable[] = [];
  let i = 0;

  while (i < lines.length - 1) {
    const currentLine = lines[i].trim();
    const nextLine = lines[i + 1].trim();

    if (currentLine.includes('|') && isSeparatorLine(nextLine)) {
      const headers = splitMarkdownRow(currentLine);
      const tableLines = [lines[i], lines[i + 1]];
      const rows: string[][] = [];

      let j = i + 2;
      while (j < lines.length) {
        const rowLine = lines[j].trim();
        if (!rowLine || !rowLine.includes('|')) {
          break;
        }
        const parsedCells = splitMarkdownRow(rowLine);
        const normalizedCells = headers.map((_, idx) => parsedCells[idx] ?? '');
        rows.push(normalizedCells);
        tableLines.push(lines[j]);
        j++;
      }

      if (headers.length >= 2 && rows.length > 0) {
        tables.push({
          headers,
          rows,
          markdown: tableLines.join('\n'),
        });
      }

      i = j;
      continue;
    }

    i++;
  }

  return tables;
}

export function isScorecardTable(headers: string[]): boolean {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  return (
    normalized.includes('skill') &&
    normalized.includes('rating') &&
    normalized.includes('evidence') &&
    normalized.includes('improvement')
  );
}

export function extractScorecardRows(markdown: string): ScorecardRow[] | null {
  const tables = extractMarkdownTables(markdown);
  const scorecardTable = tables.find((t) => isScorecardTable(t.headers));
  if (!scorecardTable) {
    return null;
  }

  const normalizedHeaders = scorecardTable.headers.map((h) => h.trim().toLowerCase());
  const skillIdx = normalizedHeaders.indexOf('skill');
  const ratingIdx = normalizedHeaders.indexOf('rating');
  const evidenceIdx = normalizedHeaders.indexOf('evidence');
  const improvementIdx = normalizedHeaders.indexOf('improvement');

  return scorecardTable.rows.map((row) => ({
    skill: row[skillIdx] ?? '',
    rating: row[ratingIdx] ?? '',
    evidence: row[evidenceIdx] ?? '',
    improvement: row[improvementIdx] ?? '',
  }));
}
