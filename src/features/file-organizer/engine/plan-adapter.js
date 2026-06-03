"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.legacyPlanToOperations = legacyPlanToOperations;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
function legacyPlanToOperations(plan) {
    const operations = [];
    const moves = plan.refactor_plan?.length ? plan.refactor_plan : plan.moves || [];
    for (const move of moves) {
        const isRename = path_1.default.posix.basename(move.from.replace(/\\/g, '/')) !== path_1.default.posix.basename(move.to.replace(/\\/g, '/'));
        operations.push({
            id: operationId(isRename ? 'rename' : 'move', move.from, move.to),
            type: isRename ? 'rename' : 'move',
            from: move.from,
            to: move.to,
            reason: move.reason || 'Move suggested by file organizer.',
            confidence: move.confidence ?? 0.9,
            risk: move.risk || 'low',
            reversible: true,
        });
    }
    for (const file of plan.redundant_files || []) {
        operations.push({
            id: operationId('archive', file.path, `.shimeji-trash/${file.path}`),
            type: 'archive',
            from: file.path,
            to: `.shimeji-trash/${file.path}`,
            reason: file.reason || 'Archive redundant file for reversible cleanup.',
            confidence: 0.9,
            risk: 'medium',
            reversible: true,
        });
    }
    return operations;
}
function operationId(type, from, to) {
    return crypto_1.default.createHash('sha256').update(`${type}:${from || ''}:${to || ''}`).digest('hex');
}
