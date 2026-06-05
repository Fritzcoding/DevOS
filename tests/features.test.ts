import assert from 'node:assert/strict';
import path from 'node:path';
import fsExtra from 'fs-extra';
import { environmentBuilderFeature } from '../src/features/environment-builder/environment-builder';
import { generateOrganizerPlan } from '../src/features/file-organizer/ai-codebase-organizer';
import { legacyPlanToOperations } from '../src/features/file-organizer/engine/plan-adapter';
import { SafeFileOperationExecutor } from '../src/features/file-organizer/engine/safe-file-operation-executor';
import { FileOrganizerService } from '../src/features/file-organizer/engine/file-organizer-service';

const root = path.resolve('tests', 'fixtures', 'workdir');

async function testEnvironmentBuilderScan() {
  const fixture = path.join(root, 'environment-node-python');
  const scan = environmentBuilderFeature.scanProject(fixture);

  assert.equal(scan.has_package_json, true);
  assert.equal(scan.has_requirements, true);
  assert.equal(scan.has_pom, false);
  assert.ok(scan.config_files.includes('package.json'));
  assert.ok(scan.config_files.includes('requirements.txt'));
  assert.ok(scan.files.some((file) => file.rel_path === 'src/index.js'));
  assert.ok(!scan.files.some((file) => file.rel_path.includes('node_modules')));
}

async function testFileOrganizerPreviewAndDryRun() {
  const logicFixture = path.join(root, 'organizer-logic-files');
  const service = new FileOrganizerService(logicFixture, undefined, undefined, {
    featureFlags: { enabled: true, semanticIndexing: false, aiReasoning: false, autonomousApply: false, watchers: false },
  });
  const preview = await service.buildPreview('Sort this project into a professional structure while keeping source code imports safe.');

  assert.equal(preview.riskLevel, 'low');
  assert.ok(preview.operations.some((operation) => operation.from === 'Product Roadmap.md' && operation.to === 'docs/Product Roadmap.md'));
  assert.ok(preview.operations.some((operation) => operation.from === 'customer screenshot.png' && operation.to === 'assets/images/customer screenshot.png'));
  assert.ok(preview.operations.some((operation) => operation.from === 'support tickets.csv' && operation.to === 'data/support tickets.csv'));

  const logicExecutor = new SafeFileOperationExecutor(logicFixture);
  const logicDryRun = await logicExecutor.apply(preview.operations, { dryRun: true });
  assert.equal(logicDryRun.success, true);
  assert.ok(await fsExtra.pathExists(path.join(logicFixture, 'Product Roadmap.md')));
  assert.ok(!(await fsExtra.pathExists(path.join(logicFixture, 'docs', 'Product Roadmap.md'))));

  const aiFixture = path.join(root, 'organizer-ai-files');
  const plan = await generateOrganizerPlan(
    aiFixture,
    'Group financial spreadsheets into Financials and documents into Documents. Rename poorly formatted names to snake_case.',
    'ai'
  );

  assert.equal(plan.risk_level, 'low');
  assert.ok(plan.moves.some((move) => move.from === 'Q1 Budget.csv' && move.to === 'Financials/q1_budget.csv'));
  assert.ok(plan.moves.some((move) => move.from === 'Project Notes.md' && move.to === 'documents/project_notes.md'));
  assert.ok(plan.moves.some((move) => move.from === 'Vendor Receipt.pdf' && move.to === 'Financials/vendor_receipt.pdf'));

  const executor = new SafeFileOperationExecutor(aiFixture);
  const dryRun = await executor.apply(legacyPlanToOperations(plan), { dryRun: true });
  assert.equal(dryRun.success, true);
  assert.ok(await fsExtra.pathExists(path.join(aiFixture, 'Q1 Budget.csv')));
  assert.ok(!(await fsExtra.pathExists(path.join(aiFixture, 'Financials', 'q1_budget.csv'))));
}

async function testFileOrganizerApplyAndRollback() {
  const fixture = path.join(root, 'organizer-ai-files');
  const plan = await generateOrganizerPlan(fixture, 'Group financial spreadsheets into Financials.', 'ai');
  const onlyBudgetMove = {
    ...plan,
    refactor_plan: plan.refactor_plan.filter((move) => move.from === 'Q1 Budget.csv'),
    moves: plan.moves.filter((move) => move.from === 'Q1 Budget.csv'),
  };
  const executor = new SafeFileOperationExecutor(fixture);
  const applyResult = await executor.apply(legacyPlanToOperations(onlyBudgetMove));

  assert.equal(applyResult.success, true);
  assert.ok(await fsExtra.pathExists(path.join(fixture, 'Financials', 'Q1 Budget.csv')));
  assert.ok(!(await fsExtra.pathExists(path.join(fixture, 'Q1 Budget.csv'))));

  const rollbackResult = await executor.rollback(applyResult.rollbackBatchId);
  assert.equal(rollbackResult.success, true);
  assert.ok(await fsExtra.pathExists(path.join(fixture, 'Q1 Budget.csv')));
}

async function main() {
  await testEnvironmentBuilderScan();
  await testFileOrganizerPreviewAndDryRun();
  await testFileOrganizerApplyAndRollback();
  console.log('[tests] Env Builder and File Organizer feature tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
