import * as assert from 'assert';
import { cleanCSS, countDuplicates, getCleaningStats } from '../../src/cssCleaner';
import { parseCSS, stringifyCSS, isValidCSS } from '../../src/cssParser';

suite('CSS Parser Test Suite', () => {
    test('Должен парсить валидный CSS', () => {
        const css = '.test { color: red; }';
        const root = parseCSS(css);
        assert.ok(root);
    });

    test('Должен проверять валидность CSS', () => {
        assert.strictEqual(isValidCSS('.test { color: red; }'), true);
        assert.strictEqual(isValidCSS('invalid css {{{'), false);
    });

    test('Должен конвертировать AST обратно в CSS', () => {
        const css = '.test { color: red; }';
        const root = parseCSS(css);
        const result = stringifyCSS(root);
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
        
        const result = await cleanCSS(css);
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
        
        const result = await cleanCSS(css);
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
        
        const count = countDuplicates(css);
        assert.strictEqual(count, 2); // 3 occurrence - 1 = 2 duplicates
    });

    test('Должен возвращать статистику очистки', async () => {
        const css = `
            .button { color: red; }
            .button { padding: 10px; }
        `;
        
        const stats = await getCleaningStats(css);
        
        assert.ok(stats.originalSize > 0);
        assert.ok(stats.cleanedSize > 0);
        assert.ok(stats.duplicatedPropertiesRemoved > 0);
        assert.ok(stats.duplicatedSelectorsRemoved > 0);
        assert.ok(stats.cleanedSize < stats.originalSize);
    });

    test('Должен обрабатывать пустой CSS', async () => {
        const result = await cleanCSS('');
        assert.strictEqual(result, '');
    });
});
