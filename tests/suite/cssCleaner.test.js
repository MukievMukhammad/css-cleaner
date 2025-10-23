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
    test('Should parse valid CSS', () => {
        const css = '.test { color: red; }';
        const root = (0, cssParser_1.parseCSS)(css);
        assert.ok(root);
    });
    test('Should validate CSS', () => {
        assert.strictEqual((0, cssParser_1.isValidCSS)('.test { color: red; }'), true);
        assert.strictEqual((0, cssParser_1.isValidCSS)('invalid css {{{'), false);
    });
    test('Should convert AST back to CSS', () => {
        const css = '.test { color: red; }';
        const root = (0, cssParser_1.parseCSS)(css);
        const result = (0, cssParser_1.stringifyCSS)(root);
        assert.ok(result.includes('color'));
    });
});
suite('CSS Cleaner Test Suite', () => {
    test('Should merge duplicate selectors and preserve all properties', async () => {
        const css = `
            .button { color: red; }
            .link { background: blue; }
            .button { padding: 10px; }
        `;
        const result = await (0, cssCleaner_1.cleanCSS)(css);
        const buttonOccurrences = (result.match(/\.button/g) || []).length;
        // After cleaning, .button should appear only once
        assert.strictEqual(buttonOccurrences, 1);
        // Should preserve both properties: color and padding
        assert.ok(result.includes('color'), 'Should preserve color property');
        assert.ok(result.includes('red'), 'Should preserve color value');
        assert.ok(result.includes('padding'), 'Should preserve padding property');
        assert.ok(result.includes('10px'), 'Should preserve padding value');
        assert.ok(result.includes('background'), 'Should preserve background property');
        assert.ok(result.includes('blue'), 'Should preserve background value');
        // Both properties should be under the same .button selector
        const buttonBlockMatch = result.match(/\.button\s*\{[^}]+\}/);
        assert.ok(buttonBlockMatch, 'Should find .button block');
        const buttonBlock = buttonBlockMatch[0];
        assert.ok(buttonBlock.includes('color'), 'Button block should contain color');
        assert.ok(buttonBlock.includes('padding'), 'Button block should contain padding');
    });
    test('Should remove duplicate properties (keeping the last one)', async () => {
        const css = `
            .test {
                color: red;
                color: blue;
            }
        `;
        const result = await (0, cssCleaner_1.cleanCSS)(css);
        const colorOccurrences = (result.match(/color:/g) || []).length;
        // Should keep only one color property (the last one)
        assert.strictEqual(colorOccurrences, 1);
        assert.ok(result.includes('blue'));
        assert.ok(!result.includes('red') || result.indexOf('blue') > result.indexOf('red'));
    });
    test('Should remove duplicate properties in complex case (keeping last values)', async () => {
        const css = `
            .product-card {
                width: 240px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
                width: 220px;
                margin-bottom: 20px;
                background: #fff;
                transition: transform 0.2s;
                background: #f6f7fb;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.07);
                padding: 20px;
                width: 200px;
                text-align: center;
            }
        `;
        const result = await (0, cssCleaner_1.cleanCSS)(css);
        // Should keep only one width (the last one - 200px)
        const widthMatches = result.match(/width:\s*\d+px/g) || [];
        assert.strictEqual(widthMatches.length, 1, 'Should have only one width property');
        assert.ok(result.includes('200px'), 'Should keep the last width value (200px)');
        // Should keep only one background (the last one - #f6f7fb)
        const backgroundMatches = result.match(/background:/g) || [];
        assert.strictEqual(backgroundMatches.length, 1, 'Should have only one background property');
        assert.ok(result.includes('#f6f7fb'), 'Should keep the last background value');
        // Should preserve unique properties
        assert.ok(result.includes('margin-bottom'), 'Should preserve margin-bottom');
        assert.ok(result.includes('transition'), 'Should preserve transition');
        assert.ok(result.includes('border-radius'), 'Should preserve border-radius');
        assert.ok(result.includes('padding'), 'Should preserve padding');
        assert.ok(result.includes('text-align'), 'Should preserve text-align');
    });
    test('Should format CSS using Prettier', async () => {
        const css = `.test{color:red;padding:10px;}`;
        const result = await (0, cssCleaner_1.cleanCSS)(css, { prettify: true });
        // Prettier should add line breaks and indentation
        assert.ok(result.includes('\n'), 'Should contain line breaks');
        assert.ok(result.includes('  '), 'Should contain indentation');
    });
    test('Should count duplicate selectors', () => {
        const css = `
            .button { color: red; }
            .button { padding: 10px; }
            .button { margin: 5px; }
        `;
        const count = (0, cssCleaner_1.countDuplicates)(css);
        assert.strictEqual(count, 2); // 3 occurrences - 1 = 2 duplicates
    });
    test('Should count duplicate properties', () => {
        const css = `
            .test {
                width: 100px;
                width: 200px;
                width: 300px;
                color: red;
                color: blue;
            }
        `;
        const count = (0, cssCleaner_1.countDuplicatedProperties)(css);
        assert.strictEqual(count, 3); // 2 width duplicates + 1 color duplicate
    });
    test('Should return detailed statistics', async () => {
        const css = `
            .button { width: 100px; width: 200px; }
            .button { color: red; }
        `;
        const stats = await (0, cssCleaner_1.getCleaningStats)(css);
        assert.ok(stats.duplicatedSelectorsRemoved > 0, 'Should remove duplicate selectors');
        assert.ok(stats.duplicatedPropertiesRemoved > 0, 'Should remove duplicate properties');
        assert.ok(stats.cleanedSize < stats.originalSize, 'Cleaned size should be smaller');
        assert.ok(stats.percentReduction >= 0, 'Should calculate percent reduction');
    });
    test('Should handle empty CSS', async () => {
        const result = await (0, cssCleaner_1.cleanCSS)('');
        assert.strictEqual(result.trim(), '');
    });
    test('Should handle CSS with no duplicates', async () => {
        const css = `
            .button { color: red; }
            .link { background: blue; }
        `;
        const result = await (0, cssCleaner_1.cleanCSS)(css);
        // Should preserve both selectors
        assert.ok(result.includes('.button'), 'Should preserve .button');
        assert.ok(result.includes('.link'), 'Should preserve .link');
        assert.ok(result.includes('color'), 'Should preserve color');
        assert.ok(result.includes('background'), 'Should preserve background');
    });
});
//# sourceMappingURL=cssCleaner.test.js.map