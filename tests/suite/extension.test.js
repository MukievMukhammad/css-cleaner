"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const cssCleaner_1 = require("../../cssCleaner");
const cssParser_1 = require("../../cssParser");
suite('CSS Parser Test Suite', () => {
    test('Должен парсить валидный CSS', () => {
        const css = '.test { color: red; }';
        const root = (0, cssParser_1.parseCSS)(css);
        assert.ok(root);
    });
    test('Должен проверять валидность CSS', () => {
        assert.strictEqual((0, cssParser_1.isValidCSS)('.test { color: red; }'), true);
        assert.strictEqual((0, cssParser_1.isValidCSS)('invalid css {{{'), false);
    });
    test('Должен конвертировать AST обратно в CSS', () => {
        const css = '.test { color: red; }';
        const root = (0, cssParser_1.parseCSS)(css);
        const result = (0, cssParser_1.stringifyCSS)(root);
        assert.ok(result.includes('color'));
    });
});
suite('CSS Cleaner Test Suite', () => {
    test('Должен объединять дублирующиеся селекторы', async () => {
        const css = `
            .button { color: red; }
            .link { background: blue; }
            .button { padding: 10px; }
        `;
        const result = await (0, cssCleaner_1.cleanCSS)(css);
        const buttonOccurrences = (result.match(/\.button/g) || []).length;
        // После очистки .button должен встречаться только один раз
        assert.strictEqual(buttonOccurrences, 1);
    });
    test('Должен удалять дублирующиеся свойства', async () => {
        const css = `
            .test {
                color: red;
                color: blue;
            }
        `;
        const result = await (0, cssCleaner_1.cleanCSS)(css);
        const colorOccurrences = (result.match(/color:/g) || []).length;
        // Должно остаться только одно свойство color (последнее)
        assert.strictEqual(colorOccurrences, 1);
        assert.ok(result.includes('blue'));
    });
    test('Должен подсчитывать дубликаты', () => {
        const css = `
            .button { color: red; }
            .button { padding: 10px; }
            .button { margin: 5px; }
        `;
        const count = (0, cssCleaner_1.countDuplicates)(css);
        assert.strictEqual(count, 2); // 3 occurrence - 1 = 2 duplicates
    });
    test('Должен возвращать статистику очистки', async () => {
        const css = `
            .button { color: red; }
            .button { padding: 10px; }
        `;
        const stats = await (0, cssCleaner_1.getCleaningStats)(css);
        assert.ok(stats.originalSize > 0);
        assert.ok(stats.cleanedSize > 0);
        assert.ok(stats.duplicatesRemoved > 0);
        assert.ok(stats.cleanedSize < stats.originalSize);
    });
    test('Должен обрабатывать пустой CSS', async () => {
        const result = await (0, cssCleaner_1.cleanCSS)('');
        assert.strictEqual(result, '');
    });
});
//# sourceMappingURL=extension.test.js.map