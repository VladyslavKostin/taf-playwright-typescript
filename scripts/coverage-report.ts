/**
 * Coverage-visibility tool (not code coverage) — reports which site pages and priorities are
 * exercised by the suite, using Playwright's own tag resolution as the source of truth (via
 * `playwright test --list --reporter=json`) rather than regex-parsing spec source.
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { PAGE_REGISTRY, type PageId } from '../src/core/coverage/page-registry';

type PlaywrightSpec = {
  title: string;
  file: string;
  tags?: string[];
  suites?: PlaywrightListSuite[];
};

type PlaywrightListSuite = {
  title: string;
  file: string;
  specs?: PlaywrightSpec[];
  suites?: PlaywrightListSuite[];
};

type PlaywrightListReport = {
  suites: PlaywrightListSuite[];
};

type CollectedSpec = {
  title: string;
  file: string;
  pages: string[];
  priority: 'smoke' | 'regression' | null;
};

const PRIORITY_TAGS = new Set(['smoke', 'regression']);

function collectSpecs(suites: PlaywrightListSuite[] | undefined, acc: CollectedSpec[]): void {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      const tags = spec.tags ?? [];
      const pages = tags.filter((t) => t.startsWith('page:')).map((t) => t.slice('page:'.length));
      const priority = tags.find((t): t is 'smoke' | 'regression' => PRIORITY_TAGS.has(t)) ?? null;
      acc.push({ title: spec.title, file: spec.file, pages, priority });
    }
    collectSpecs(suite.suites, acc);
  }
}

function runPlaywrightList(): string {
  try {
    return execSync('npx playwright test --list --reporter=json', {
      cwd: process.cwd(),
      encoding: 'utf-8',
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (error) {
    // Playwright exits non-zero on "No tests found" but still prints valid JSON to stdout.
    const stdout = (error as { stdout?: string }).stdout;
    if (stdout) return stdout;
    throw error;
  }
}

function loadSpecs(): CollectedSpec[] {
  const json = runPlaywrightList();
  const report = JSON.parse(json) as PlaywrightListReport;
  const specs: CollectedSpec[] = [];
  collectSpecs(report.suites, specs);
  return specs;
}

function buildMatrix(specs: CollectedSpec[]) {
  const matrix = new Map<PageId, { smoke: number; regression: number; total: number; files: Set<string> }>();
  for (const page of PAGE_REGISTRY) {
    matrix.set(page, { smoke: 0, regression: 0, total: 0, files: new Set() });
  }

  const warnings: string[] = [];
  const knownPages = new Set<string>(PAGE_REGISTRY);

  for (const spec of specs) {
    if (spec.pages.length === 0) {
      warnings.push(`No @page:* tag: "${spec.title}" (${spec.file})`);
      continue;
    }
    for (const page of spec.pages) {
      if (!knownPages.has(page)) {
        warnings.push(`Unknown page tag "@page:${page}" (not in page-registry.ts): "${spec.title}" (${spec.file})`);
        continue;
      }
      const row = matrix.get(page as PageId)!;
      row.total += 1;
      row.files.add(spec.file);
      if (spec.priority === 'smoke') row.smoke += 1;
      if (spec.priority === 'regression') row.regression += 1;
    }
  }

  return { matrix, warnings };
}

function printConsoleReport(matrix: ReturnType<typeof buildMatrix>['matrix'], warnings: string[]) {
  console.log('\nPage x Tag coverage\n');
  const rows = [...matrix.entries()].map(([page, stats]) => ({
    page,
    total: stats.total,
    smoke: stats.smoke,
    regression: stats.regression,
    specFiles: stats.files.size,
  }));
  console.table(rows);

  const untested = rows.filter((r) => r.total === 0).map((r) => r.page);
  if (untested.length > 0) {
    console.log(`\n⚠ Pages with ZERO coverage: ${untested.join(', ')}`);
  } else {
    console.log('\n✓ Every registered page has at least one test.');
  }

  if (warnings.length > 0) {
    console.log(`\n⚠ ${warnings.length} tagging warning(s):`);
    for (const w of warnings) console.log(`  - ${w}`);
  }
}

function writeHtmlReport(matrix: ReturnType<typeof buildMatrix>['matrix'], warnings: string[]) {
  const rows = [...matrix.entries()]
    .map(
      ([page, stats]) => `<tr class="${stats.total === 0 ? 'zero' : ''}">
        <td>${page}</td><td>${stats.total}</td><td>${stats.smoke}</td><td>${stats.regression}</td>
        <td>${[...stats.files].join(', ') || '—'}</td>
      </tr>`,
    )
    .join('\n');
  const warningRows = warnings.map((w) => `<li>${w}</li>`).join('\n');

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Coverage Report</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; }
  tr.zero { background: #ffe8e8; }
  th { background: #f0f0f0; }
</style></head>
<body>
  <h1>Page x Tag Coverage Report</h1>
  <table>
    <thead><tr><th>Page</th><th>Total specs</th><th>@smoke</th><th>@regression</th><th>Spec files</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  ${warnings.length > 0 ? `<h2>Warnings</h2><ul>${warningRows}</ul>` : ''}
</body></html>`;

  writeFileSync('coverage-report.html', html, 'utf-8');
  console.log('\nHTML report written to coverage-report.html');
}

function main() {
  const specs = loadSpecs();
  const { matrix, warnings } = buildMatrix(specs);
  printConsoleReport(matrix, warnings);
  writeHtmlReport(matrix, warnings);
}

main();
