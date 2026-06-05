import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fsExtra from 'fs-extra';
import { environmentBuilderFeature } from '../src/features/environment-builder/environment-builder';
import { generateOrganizerPlan } from '../src/features/file-organizer/ai-codebase-organizer';
import { legacyPlanToOperations } from '../src/features/file-organizer/engine/plan-adapter';
import { SafeFileOperationExecutor } from '../src/features/file-organizer/engine/safe-file-operation-executor';
import { FileOrganizerService } from '../src/features/file-organizer/engine/file-organizer-service';
import { aiClient } from '../src/services/ai/ai-client';

const samplesRoot = path.resolve('samples', 'workdir');

async function checkVisibleSamplesExist() {
  for (const sample of ['code-fixer', 'code-fixer-java-codebase', 'env-builder-node-basic', 'env-builder-python-basic', 'file-organizer-messy', 'file-organizer-logic', 'file-organizer-ai']) {
    assert.ok(await fsExtra.pathExists(path.join(samplesRoot, sample)), `Missing visible sample workdir: ${sample}`);
  }
  assert.ok(await fsExtra.pathExists(path.join(samplesRoot, 'code-fixer', 'clipboard-snippet.js')));
  assert.ok(await fsExtra.pathExists(path.join(samplesRoot, 'code-fixer-java-codebase', 'src', 'main', 'java', 'devopslite', 'sample', 'App.java')));
  assert.ok(await fsExtra.pathExists(path.join(samplesRoot, 'code-fixer-java-codebase', 'src', 'main', 'java', 'devopslite', 'sample', 'Calculator.java')));
  assert.ok(await fsExtra.pathExists(path.join(samplesRoot, 'code-fixer-java-codebase', 'src', 'main', 'java', 'devopslite', 'sample', 'ReportPrinter.java')));
}

async function checkEnvironmentSampleRuns() {
  const sample = path.join(samplesRoot, 'env-builder-node-basic');
  const scan = environmentBuilderFeature.scanProject(sample);
  assert.equal(scan.has_package_json, true);
  assert.ok(scan.config_files.includes('package.json'));

  const output = execSync('npm test', { cwd: sample, encoding: 'utf8' });
  assert.match(output, /env-builder sample ok/);

  const pythonSample = path.join(samplesRoot, 'env-builder-python-basic');
  const pythonScan = environmentBuilderFeature.scanProject(pythonSample);
  assert.equal(pythonScan.has_package_json, false);
  assert.equal(pythonScan.has_requirements, true);
  assert.ok(pythonScan.config_files.includes('requirements.txt'));
  assert.ok(pythonScan.files.some((file) => file.rel_path === 'src/app.py'));
}

async function checkCodeFixerSampleManualFixes() {
  const sample = path.join(samplesRoot, 'code-fixer');
  const clipboardCode = await fsExtra.readFile(path.join(sample, 'clipboard-snippet.js'), 'utf8');
  const clipboardFix = await aiClient.fixCodeManually(clipboardCode, 'javascript');
  assert.equal(clipboardFix.success, true);
  assert.match(clipboardFix.data.fixed_snippet, /console\.log/);
  assert.doesNotMatch(clipboardFix.data.fixed_snippet, /consol\.log/);
  assert.match(clipboardFix.data.fixed_snippet, /users\.forEach\(\(user\) => greet\(user\)\);/);
  assert.match(clipboardFix.data.fixed_snippet, /console\.log\("Average:", average\(\[2, 4, 6\]\)\);/);

  const singleFileCode = await fsExtra.readFile(path.join(sample, 'single-file-bug.js'), 'utf8');
  const singleFileFix = await aiClient.fixCodeManually(singleFileCode, 'javascript');
  assert.equal(singleFileFix.success, true);
  assert.match(singleFileFix.data.fixed_snippet, /return items\.reduce\(\(sum, item\) => sum \+ item\.price, 0\);/);
  assert.match(singleFileFix.data.fixed_snippet, /}\s*\n\s*function printInvoice/);
  assert.match(singleFileFix.data.fixed_snippet, /const grandTotal = total\(items\)/);
  assert.doesNotMatch(singleFileFix.data.fixed_snippet, /consol\.log/);

  const javaSample = path.join(samplesRoot, 'code-fixer-java-codebase', 'src', 'main', 'java', 'devopslite', 'sample');
  const calculatorCode = await fsExtra.readFile(path.join(javaSample, 'Calculator.java'), 'utf8');
  const calculatorFix = await aiClient.fixCodeManually(calculatorCode, 'java');
  assert.equal(calculatorFix.success, true);
  assert.match(calculatorFix.data.fixed_snippet, /return left \* right;/);
  assert.match(calculatorFix.data.fixed_snippet, /return left \/ right;/);

  const reportPrinterCode = await fsExtra.readFile(path.join(javaSample, 'ReportPrinter.java'), 'utf8');
  const reportPrinterFix = await aiClient.fixCodeManually(reportPrinterCode, 'java');
  assert.equal(reportPrinterFix.success, true);
  assert.match(reportPrinterFix.data.fixed_snippet, /System\.out\.println/);
  assert.doesNotMatch(reportPrinterFix.data.fixed_snippet, /System\.oot/);
}

async function checkOrganizerPlanAndApply() {
  const logicSample = path.join(samplesRoot, 'file-organizer-logic');
  const aiSample = path.join(samplesRoot, 'file-organizer-ai');
  try {
    const service = new FileOrganizerService(logicSample, undefined, undefined, {
      featureFlags: { enabled: true, semanticIndexing: false, aiReasoning: false, autonomousApply: false, watchers: false },
    });
    const preview = await service.buildPreview('Sort this project into a professional structure while keeping source code imports safe.');

  assert.equal(preview.riskLevel, 'low');
  assert.ok(preview.operations.some((operation) => operation.from === 'Product Roadmap.md' && operation.to === 'docs/Product Roadmap.md'));
  assert.ok(preview.operations.some((operation) => operation.from === 'customer screenshot.png' && operation.to === 'assets/images/customer screenshot.png'));
  assert.ok(preview.operations.some((operation) => operation.from === 'support tickets.csv' && operation.to === 'data/support tickets.csv'));
  assert.ok(preview.operations.some((operation) => operation.from === 'trace.log' && operation.to === 'logs/trace.log'));
  assert.ok(preview.operations.some((operation) => operation.from === 'embedding-model.gguf' && operation.to === 'models/embedding-model.gguf'));
  assert.ok(!preview.operations.some((operation) => operation.from === '.env.local' || operation.from === 'package.json'));

  const logicExecutor = new SafeFileOperationExecutor(logicSample);
  const logicResult = await logicExecutor.apply(preview.operations);
  assert.equal(logicResult.success, true, logicResult.errors.join('\n'));
  assert.ok(await fsExtra.pathExists(path.join(logicSample, 'docs', 'Product Roadmap.md')));
  assert.ok(await fsExtra.pathExists(path.join(logicSample, 'assets', 'images', 'customer screenshot.png')));
  assert.ok(await fsExtra.pathExists(path.join(logicSample, 'data', 'support tickets.csv')));
  assert.ok(await fsExtra.pathExists(path.join(logicSample, 'logs', 'trace.log')));
  assert.ok(await fsExtra.pathExists(path.join(logicSample, 'models', 'embedding-model.gguf')));
  assert.ok(await fsExtra.pathExists(path.join(logicSample, '.env.local')));
  assert.ok(await fsExtra.pathExists(path.join(logicSample, 'package.json')));

    const instruction = 'Group financial spreadsheets into Financials, documents into Documents, and images into Images. Rename poorly formatted names to snake_case.';
    const plan = await generateOrganizerPlan(aiSample, instruction, 'ai');

  assert.ok(plan.moves.some((move) => move.from === 'Q1 Budget.csv' && move.to === 'Financials/q1_budget.csv'));
  assert.ok(plan.moves.some((move) => move.from === 'Project Notes.md' && move.to === 'documents/project_notes.md'));
  assert.ok(plan.moves.some((move) => move.from === 'logo final.png' && move.to === 'images/logo_final.png'));
  assert.ok(plan.moves.some((move) => move.from === 'Vendor Receipt.pdf' && move.to === 'Financials/vendor_receipt.pdf'));
  assert.ok(plan.moves.some((move) => move.from === 'Team Photo.JPG' && move.to === 'images/team_photo.jpg'));
  assert.ok(plan.moves.some((move) => move.from === 'Launch Checklist.txt' && move.to === 'documents/launch_checklist.txt'));
  assert.ok(!plan.moves.some((move) => move.from === 'package.json' || move.from === '.env.local'));

    const executor = new SafeFileOperationExecutor(aiSample);
    const result = await executor.apply(legacyPlanToOperations(plan));
    assert.equal(result.success, true, result.errors.join('\n'));
    assert.ok(await fsExtra.pathExists(path.join(aiSample, 'Financials', 'q1_budget.csv')));
    assert.ok(await fsExtra.pathExists(path.join(aiSample, 'documents', 'project_notes.md')));
    assert.ok(await fsExtra.pathExists(path.join(aiSample, 'images', 'logo_final.png')));
    assert.ok(await fsExtra.pathExists(path.join(aiSample, 'Financials', 'vendor_receipt.pdf')));
    assert.ok(await fsExtra.pathExists(path.join(aiSample, 'images', 'team_photo.jpg')));
    assert.ok(await fsExtra.pathExists(path.join(aiSample, 'documents', 'launch_checklist.txt')));
    assert.ok(await fsExtra.pathExists(path.join(aiSample, '.env.local')));
  } finally {
    await fsExtra.remove(logicSample);
    await fsExtra.remove(aiSample);
    await fsExtra.copy(path.resolve('samples', 'pristine', 'file-organizer-logic'), logicSample, { overwrite: true, errorOnExist: false });
    await fsExtra.copy(path.resolve('samples', 'pristine', 'file-organizer-ai'), aiSample, { overwrite: true, errorOnExist: false });
  }
}

async function main() {
  await checkVisibleSamplesExist();
  await checkCodeFixerSampleManualFixes();
  await checkEnvironmentSampleRuns();
  await checkOrganizerPlanAndApply();
  console.log('[samples] Visible manual samples exist and verified.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
