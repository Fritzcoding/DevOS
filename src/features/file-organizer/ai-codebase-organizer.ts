import path from 'path';
import fsExtra from 'fs-extra';
import ts from 'typescript';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface CodeNode {
  id: string;
  path: string;
  language: string;
  symbolType: 'file' | 'class' | 'interface' | 'method' | 'package';
  summary: string;
  dependencies: string[];
  relatedNodes: string[];
  metadata: Record<string, unknown>;
}

export interface ArchitectureViolation {
  rule: string;
  from: string;
  to: string;
  severity: RiskLevel;
  reason: string;
}

export interface RefactorMove {
  from: string;
  to: string;
  reason: string;
  confidence: number;
  risk: RiskLevel;
  affected_imports: string[];
  dependency_impact: string;
}

export interface OrganizerPlan {
  redundant_files: Array<{ path: string; reason: string; action: 'ARCHIVE' | 'DELETE' }>;
  moves: Array<{ from: string; to: string; reason: string }>;
  new_dirs_to_create: string[];
  summary: string;
  risk_level: RiskLevel;
  explainability: {
    architecture_summary: string;
    detected_domains: string[];
    coupling_hotspots: string[];
    violations: ArchitectureViolation[];
    confidence_overview: string;
  };
  semantic_graph: {
    nodes: CodeNode[];
    edge_count: number;
  };
  refactor_plan: RefactorMove[];
}

export type OrganizerMode = 'professional' | 'ai';

interface FileRecord {
  relPath: string;
  absPath: string;
  size: number;
  ext: string;
}

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  '.vite',
  '__pycache__',
  '.shimeji-trash',
  '.idea',
  '.vscode',
]);

const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.java']);
const PROTECTED_ROOT_FILES = new Set([
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'pom.xml',
  'build.gradle',
  'README.md',
  'readme.md',
  'tsconfig.json',
]);

const CATEGORY_RULES = [
  {
    name: 'financials',
    defaultDir: 'Financials',
    keywords: ['financial', 'financials', 'finance', 'spreadsheet', 'spreadsheets', 'csv', 'excel'],
    exts: ['.csv', '.tsv', '.xls', '.xlsx', '.ods'],
  },
  {
    name: 'documents',
    defaultDir: 'Documents',
    keywords: ['document', 'documents', 'docs', 'doc'],
    exts: ['.doc', '.docx', '.pdf', '.txt', '.md', '.rtf', '.odt', '.adoc'],
  },
  {
    name: 'images',
    defaultDir: 'Images',
    keywords: ['image', 'images', 'picture', 'pictures', 'photo', 'photos', 'asset', 'assets'],
    exts: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.bmp', '.tiff'],
  },
  {
    name: 'code',
    defaultDir: 'Code',
    keywords: ['code', 'source', 'scripts', 'html', 'javascript'],
    exts: ['.js', '.jsx', '.ts', '.tsx', '.html', '.htm', '.css', '.json', '.py', '.java', '.go', '.rs', '.sh', '.ps1', '.bat', '.cmd'],
  },
] as const;

const FINANCIAL_FILENAME_PATTERN = /(?:^|[_\W])(budget|invoice|receipt|tax|statement|expense|payroll|actuals?|q[1-4])(?:[_\W]|$)/i;

function safeRel(root: string, target: string): string {
  return path.relative(root, target).replace(/\\/g, '/');
}

function detectLanguage(ext: string): string {
  if (ext === '.java') return 'java';
  if (ext === '.ts' || ext === '.tsx') return 'typescript';
  if (ext === '.js' || ext === '.jsx') return 'javascript';
  return 'text';
}

function inferLayer(relPath: string): string {
  const p = relPath.toLowerCase();
  if (p.includes('/controller') || p.includes('controller.')) return 'controller';
  if (p.includes('/repository') || p.includes('repository.')) return 'repository';
  if (p.includes('/service') || p.includes('service.')) return 'service';
  if (p.includes('/ui/') || p.includes('/component') || p.endsWith('.tsx')) return 'ui';
  if (p.includes('/infra') || p.includes('/infrastructure')) return 'infrastructure';
  if (p.includes('/db/') || p.includes('/database')) return 'database';
  return 'unknown';
}

function folderDomain(relPath: string): string {
  const parts = relPath.split('/');
  if (parts.length < 2) return 'root';
  return parts[parts[0] === 'src' ? 1 : 0] || 'root';
}

function parseTSLike(file: FileRecord, content: string): CodeNode {
  const source = ts.createSourceFile(file.relPath, content, ts.ScriptTarget.Latest, true);
  const dependencies: string[] = [];
  const classes: string[] = [];
  const methods: string[] = [];
  const interfaces: string[] = [];

  const walk = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
      const d = node.moduleSpecifier.getText(source).replace(/^['"]|['"]$/g, '');
      dependencies.push(d);
    }
    if (ts.isClassDeclaration(node) && node.name) classes.push(node.name.getText(source));
    if (ts.isInterfaceDeclaration(node) && node.name) interfaces.push(node.name.getText(source));
    if ((ts.isMethodDeclaration(node) || ts.isFunctionDeclaration(node)) && node.name) {
      methods.push(node.name.getText(source));
    }
    ts.forEachChild(node, walk);
  };
  walk(source);

  return {
    id: file.relPath,
    path: file.relPath,
    language: detectLanguage(file.ext),
    symbolType: 'file',
    summary: `Classes:${classes.length} Interfaces:${interfaces.length} Methods/Functions:${methods.length}`,
    dependencies,
    relatedNodes: [],
    metadata: {
      layer: inferLayer(file.relPath),
      domain: folderDomain(file.relPath),
      classes,
      interfaces,
      methods: methods.slice(0, 20),
    },
  };
}

function parseJava(file: FileRecord, content: string): CodeNode {
  const lines = content.split('\n');
  const dependencies: string[] = [];
  const annotations: string[] = [];
  const classes: string[] = [];
  const methods: string[] = [];
  let pkg = '';
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('package ')) pkg = line.replace('package ', '').replace(';', '').trim();
    if (line.startsWith('import ')) dependencies.push(line.replace('import ', '').replace(';', '').trim());
    if (line.startsWith('@')) annotations.push(line.slice(1).split(/[ (]/)[0]);
    const classMatch = line.match(/\b(class|interface)\s+([A-Za-z0-9_]+)/);
    if (classMatch) classes.push(classMatch[2]);
    const methodMatch = line.match(/(?:public|private|protected)\s+[\w<>\[\], ?]+\s+([A-Za-z0-9_]+)\s*\(/);
    if (methodMatch) methods.push(methodMatch[1]);
  }

  return {
    id: file.relPath,
    path: file.relPath,
    language: 'java',
    symbolType: 'file',
    summary: `Package:${pkg || 'unknown'} Classes:${classes.length} Methods:${methods.length}`,
    dependencies,
    relatedNodes: [],
    metadata: {
      package: pkg,
      layer: inferLayer(file.relPath),
      domain: folderDomain(file.relPath),
      annotations,
      classes,
      methods: methods.slice(0, 30),
    },
  };
}

function parseFile(file: FileRecord, content: string): CodeNode {
  if (file.ext === '.java') return parseJava(file, content);
  if (file.ext === '.ts' || file.ext === '.tsx' || file.ext === '.js' || file.ext === '.jsx') return parseTSLike(file, content);
  return {
    id: file.relPath,
    path: file.relPath,
    language: 'text',
    symbolType: 'file',
    summary: 'Non-code file',
    dependencies: [],
    relatedNodes: [],
    metadata: { layer: inferLayer(file.relPath), domain: folderDomain(file.relPath) },
  };
}

function resolveInternalEdges(nodes: CodeNode[]): number {
  const pathByLeaf = new Map<string, string[]>();
  for (const node of nodes) {
    const base = path.basename(node.path, path.extname(node.path));
    const cur = pathByLeaf.get(base) || [];
    cur.push(node.path);
    pathByLeaf.set(base, cur);
  }
  let edges = 0;
  for (const node of nodes) {
    for (const dep of node.dependencies) {
      const leaf = dep.split('/').pop() || dep.split('.').pop() || dep;
      const hits = pathByLeaf.get(leaf);
      if (hits?.length) {
        node.relatedNodes.push(...hits.filter((p) => p !== node.path));
        edges += hits.length;
      }
    }
  }
  return edges;
}

function architectureViolations(nodes: CodeNode[]): ArchitectureViolation[] {
  const violations: ArchitectureViolation[] = [];
  const byPath = new Map(nodes.map((n) => [n.path, n]));
  for (const node of nodes) {
    const fromLayer = String(node.metadata.layer || 'unknown');
    for (const rel of node.relatedNodes) {
      const toLayer = String(byPath.get(rel)?.metadata.layer || 'unknown');
      if (fromLayer === 'controller' && toLayer === 'repository') {
        violations.push({ rule: 'controller -> repository forbidden', from: node.path, to: rel, severity: 'high', reason: 'Controller should go through service layer.' });
      }
      if (fromLayer === 'ui' && (toLayer === 'database' || toLayer === 'infrastructure')) {
        violations.push({ rule: 'ui -> infrastructure/database forbidden', from: node.path, to: rel, severity: 'high', reason: 'UI should depend on application/service boundaries.' });
      }
    }
  }
  return violations;
}

function suggestMoves(files: FileRecord[], nodes: CodeNode[]): RefactorMove[] {
  const moves: RefactorMove[] = [];
  const protectedTop = new Set(['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'pom.xml', 'build.gradle', 'README.md', 'tsconfig.json']);
  const nodeByPath = new Map(nodes.map((n) => [n.path, n]));
  for (const file of files) {
    const rel = file.relPath;
    const base = path.posix.basename(rel);
    const ext = file.ext.toLowerCase();
    const topLevel = !rel.includes('/');
    if (/(_backup|_old|\.bak)$/i.test(base)) continue;
    let target: string | null = null;
    if (topLevel && !protectedTop.has(base)) {
      if (['.md', '.txt', '.adoc'].includes(ext)) target = `docs/${base}`;
      if (['.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico'].includes(ext)) target = `assets/${base}`;
      if (['.sh', '.ps1', '.bat', '.cmd'].includes(ext)) target = `scripts/${base}`;
    }

    const node = nodeByPath.get(rel);
    const isJava = ext === '.java' && node;
    if (!target && isJava) {
      const declaredPackage = String(node?.metadata.package || '');
      if (declaredPackage) {
        const packagePath = declaredPackage.replace(/\./g, '/');
        const srcIdx = rel.indexOf('/java/');
        if (srcIdx > -1) {
          const expectedPrefix = rel.slice(0, srcIdx + '/java/'.length) + packagePath;
          const expected = `${expectedPrefix}/${base}`.replace(/\\/g, '/');
          if (expected !== rel) target = expected;
        }
      }
    }

    if (!target || target === rel) continue;
    const importRisk = CODE_EXTS.has(ext);
    const confidence = importRisk ? 0.62 : 0.9;
    moves.push({
      from: rel,
      to: target,
      reason: importRisk
        ? 'Path/package inconsistency reduces architecture clarity and complicates ownership.'
        : 'Top-level non-source file can be grouped into a conventional directory.',
      confidence,
      risk: importRisk ? 'medium' : 'low',
      affected_imports: importRisk ? ['Potential import/package updates required'] : [],
      dependency_impact: importRisk ? 'Moderate: package/import references may need updates.' : 'Low: content unaffected.',
    });
  }
  return moves;
}

function normalizeRel(input: string): string {
  return input
    .trim()
    .replace(/^["'`]|["'`]$/g, '')
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '');
}

function hasExplicitProfessionalIntent(instruction: string): boolean {
  return /\b(professional|conventional|standard|by type|file type|assets|images|documents|docs|financials|finance|code|scripts|rename|snake_case)\b/i.test(instruction);
}

function wantsSnakeCaseRename(instruction: string): boolean {
  return /\b(rename|clean names?|poorly formatted|snake_case|snake case)\b/i.test(instruction);
}

function toSnakeCaseFilename(filename: string): string {
  const ext = path.posix.extname(filename).toLowerCase();
  let stem = ext ? filename.slice(0, -ext.length) : filename;
  if (ext && stem.toLowerCase().endsWith(ext)) {
    stem = stem.slice(0, -ext.length);
  }
  const normalized = stem
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .toLowerCase();
  return `${normalized || 'file'}${ext}`;
}

function categoryDirFromInstruction(instruction: string, rule: typeof CATEGORY_RULES[number]): string | null {
  const lower = instruction.toLowerCase();
  if (!rule.keywords.some((keyword) => lower.includes(keyword))) return null;

  const escapedDefault = rule.defaultDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const explicit = instruction.match(new RegExp(`\\b(${escapedDefault})\\b`, 'i'))?.[1];
  if (explicit) return explicit;

  return rule.defaultDir;
}

function buildExplicitInstructionPlan(files: FileRecord[], instruction: string): RefactorMove[] {
  const moves: RefactorMove[] = [];
  const byPath = new Map(files.map((file) => [file.relPath.toLowerCase(), file]));
  const existing = new Set(files.map((file) => file.relPath.toLowerCase()));
  const lines = instruction.split(/\r?\n|;/).map((line) => line.trim()).filter(Boolean);

  const addMove = (fromRaw: string, toRaw: string, reason: string) => {
    const from = normalizeRel(fromRaw);
    const to = normalizeRel(toRaw);
    const source = byPath.get(from.toLowerCase());
    if (!source || !to || to.endsWith('/')) return;
    if (path.posix.basename(from) !== path.posix.basename(to)) return;
    if (existing.has(to.toLowerCase())) return;
    moves.push({
      from: source.relPath,
      to,
      reason,
      confidence: 0.94,
      risk: CODE_EXTS.has(source.ext) ? 'medium' : 'low',
      affected_imports: CODE_EXTS.has(source.ext) ? ['Imports may need review after moving this code file.'] : [],
      dependency_impact: CODE_EXTS.has(source.ext) ? 'Moderate: code location changes can affect relative imports.' : 'Low: same filename, path-only move.',
    });
  };

  for (const line of lines) {
    const arrow = line.match(/(?:move\s+)?(.+?)\s*(?:->|=>| to )\s*(.+)$/i);
    if (arrow) {
      addMove(arrow[1], arrow[2], 'Explicit move requested by AI instruction.');
    }
  }

  return moves;
}

function buildInstructionCategoryPlan(files: FileRecord[], instruction: string): RefactorMove[] {
  if (!hasExplicitProfessionalIntent(instruction)) return [];
  const lower = instruction.toLowerCase();
  const moves: RefactorMove[] = [];
  const existing = new Set(files.map((file) => file.relPath.toLowerCase()));
  const plannedDestinations = new Set<string>();
  const renameToSnakeCase = wantsSnakeCaseRename(instruction);
  const allowNested = lower.includes('recursive') || lower.includes('all');

  const addByExt = (exts: readonly string[], targetDir: string, reason: string) => {
    for (const file of files) {
      const base = path.posix.basename(file.relPath);
      const ext = file.ext.toLowerCase();
      const financeDocument =
        targetDir.toLowerCase() === 'financials' &&
        ['.pdf', '.doc', '.docx', '.txt'].includes(ext) &&
        FINANCIAL_FILENAME_PATTERN.test(base);
      if (!exts.includes(ext) && !financeDocument) continue;
      if (PROTECTED_ROOT_FILES.has(base)) continue;
      if (
        targetDir.toLowerCase() === 'documents' &&
        ['.pdf', '.doc', '.docx', '.txt'].includes(ext) &&
        categoryDirFromInstruction(instruction, CATEGORY_RULES[0]) &&
        FINANCIAL_FILENAME_PATTERN.test(base)
      ) {
        continue;
      }
      const targetBase = renameToSnakeCase ? toSnakeCaseFilename(base) : base;
      const target = `${targetDir.replace(/\/+$/, '')}/${targetBase}`;
      const targetKey = target.toLowerCase();
      if (file.relPath === target || existing.has(targetKey) || plannedDestinations.has(targetKey)) continue;
      if (file.relPath.includes('/') && !allowNested) continue;
      plannedDestinations.add(targetKey);
      moves.push({
        from: file.relPath,
        to: target,
        reason: renameToSnakeCase && targetBase !== base ? `${reason} Filename normalized to snake_case.` : reason,
        confidence: 0.82,
        risk: CODE_EXTS.has(file.ext) || file.ext === '.html' ? 'medium' : 'low',
        affected_imports: CODE_EXTS.has(file.ext) ? ['Moving code may require import/path review.'] : [],
        dependency_impact: CODE_EXTS.has(file.ext) || file.ext === '.html'
          ? 'Moderate: code location changes can affect relative imports or linked assets.'
          : 'Low: category-only move.',
      });
    }
  };

  for (const rule of CATEGORY_RULES) {
    const targetDir = categoryDirFromInstruction(instruction, rule);
    if (targetDir) {
      addByExt(rule.exts, targetDir, `Instruction requested ${rule.name} grouping.`);
    }
  }

  return moves;
}

function dedupeMoves(moves: RefactorMove[]): RefactorMove[] {
  const seen = new Set<string>();
  return moves.filter((move) => {
    const key = `${move.from.toLowerCase()}->${move.to.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function findRedundant(files: FileRecord[]): Array<{ path: string; reason: string; action: 'ARCHIVE' | 'DELETE' }> {
  const out: Array<{ path: string; reason: string; action: 'ARCHIVE' | 'DELETE' }> = [];
  const bySize = new Map<number, string[]>();
  for (const f of files) {
    if (f.size > 100) bySize.set(f.size, [...(bySize.get(f.size) || []), f.relPath]);
    if (/(_backup|_old| copy|\.bak)$/i.test(path.posix.basename(f.relPath))) {
      out.push({ path: f.relPath, reason: 'Likely backup/duplicate artifact; archive instead of deleting.', action: 'ARCHIVE' });
    }
  }
  for (const paths of bySize.values()) {
    if (paths.length > 2) {
      out.push({ path: paths[paths.length - 1], reason: 'Potential duplicate by size cluster; requires manual review.', action: 'ARCHIVE' });
    }
  }
  return out;
}

async function scanFiles(rootDir: string): Promise<FileRecord[]> {
  const root = path.resolve(rootDir);
  const files: FileRecord[] = [];
  const walk = async (dir: string) => {
    const entries = await fsExtra.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.github') continue;
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) await walk(path.join(dir, entry.name));
        continue;
      }
      if (!entry.isFile()) continue;
      const abs = path.join(dir, entry.name);
      const stat = await fsExtra.stat(abs);
      if (stat.size > 1_500_000) continue;
      const relPath = safeRel(root, abs);
      files.push({ relPath, absPath: abs, size: stat.size, ext: path.extname(entry.name).toLowerCase() });
    }
  };
  await walk(root);
  return files;
}

export async function generateOrganizerPlan(rootDir: string, instruction?: string, mode: OrganizerMode = 'professional'): Promise<OrganizerPlan> {
  const files = await scanFiles(rootDir);
  const semanticCandidates = files.filter((f) => CODE_EXTS.has(f.ext)).slice(0, 600);
  const nodes: CodeNode[] = [];
  for (const file of semanticCandidates) {
    const content = await fsExtra.readFile(file.absPath, 'utf8').catch(() => '');
    nodes.push(parseFile(file, content));
  }
  const edgeCount = resolveInternalEdges(nodes);
  const violations = architectureViolations(nodes);
  const movePlan = dedupeMoves(mode === 'ai'
    ? [...buildExplicitInstructionPlan(files, instruction || ''), ...buildInstructionCategoryPlan(files, instruction || '')]
    : suggestMoves(files, nodes));
  const redundant = mode === 'ai' ? [] : findRedundant(files);
  const newDirs = Array.from(new Set(movePlan.map((m) => path.posix.dirname(m.to)).filter((d) => d && d !== '.')));

  const detectedDomains = Array.from(new Set(nodes.map((n) => String(n.metadata.domain || 'root')))).slice(0, 12);
  const hotNodes = [...nodes]
    .sort((a, b) => (b.relatedNodes.length + b.dependencies.length) - (a.relatedNodes.length + a.dependencies.length))
    .slice(0, 8)
    .map((n) => n.path);
  const confidenceAvg = movePlan.length
    ? movePlan.reduce((sum, m) => sum + m.confidence, 0) / movePlan.length
    : 0.86;
  const highRisk = violations.some((v) => v.severity === 'high') || movePlan.some((m) => m.risk === 'high');
  const mediumRisk = movePlan.some((m) => m.risk === 'medium') || violations.length > 0;
  const riskLevel: RiskLevel = highRisk ? 'high' : mediumRisk ? 'medium' : 'low';

  const instructionNote = instruction?.trim()
    ? `${mode === 'ai' ? 'AI instruction mode' : 'Professional mode'} considered: "${instruction.trim().slice(0, 180)}".`
    : 'No custom instruction supplied; using conservative architecture rules.';

  return {
    redundant_files: redundant,
    moves: movePlan.map((m) => ({ from: m.from, to: m.to, reason: m.reason })),
    new_dirs_to_create: newDirs,
    summary: mode === 'ai' && movePlan.length === 0
      ? `Analyzed ${nodes.length} code file(s). No safe moves were generated because the instruction did not map to existing files or explicit categories.`
      : `Generated semantic organization plan with ${nodes.length} analyzed code file(s), ${edgeCount} dependency edge(s), ${violations.length} architecture rule alert(s), and ${movePlan.length} proposed move(s).`,
    risk_level: riskLevel,
    explainability: {
      architecture_summary: instructionNote,
      detected_domains: detectedDomains,
      coupling_hotspots: hotNodes,
      violations,
      confidence_overview: `Average confidence ${Math.round(confidenceAvg * 100)}%. High-risk suggestions are intentionally excluded from auto-apply paths.`,
    },
    semantic_graph: {
      nodes,
      edge_count: edgeCount,
    },
    refactor_plan: movePlan,
  };
}

export function validateOrganizationPlan(rootDir: string, organization: any): string[] {
  const errors: string[] = [];
  const root = path.resolve(rootDir);
  const destinations = new Set<string>();
  const checkRel = (value: string, label: string) => {
    const candidate = path.resolve(root, value || '');
    const rel = path.relative(root, candidate);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      errors.push(`${label} is outside project root: ${value}`);
    }
  };

  for (const move of organization?.moves || []) {
    const from = String(move?.from || '');
    const to = String(move?.to || '');
    checkRel(from, 'Move source');
    checkRel(to, 'Move destination');
    if (path.posix.basename(from.replace(/\\/g, '/')) !== path.posix.basename(to.replace(/\\/g, '/')) && organization?.allow_renames !== true) {
      errors.push(`Move renames are blocked unless explicitly enabled: ${from} -> ${to}`);
    }
    const key = to.toLowerCase().replace(/\\/g, '/');
    if (destinations.has(key)) {
      errors.push(`Multiple moves target the same destination: ${to}`);
    }
    destinations.add(key);
  }
  for (const file of organization?.redundant_files || []) {
    checkRel(String(file?.path || ''), 'Redundant file path');
  }
  return errors;
}
