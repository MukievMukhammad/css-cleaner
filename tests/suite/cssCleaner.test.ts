import * as assert from "assert";
import {
  cleanCSS,
  countDuplicates,
  countDuplicatedProperties,
  getCleaningStats,
} from "../../src/cssCleaner";
import { parseCSS, stringifyCSS, isValidCSS } from "../../src/cssParser";

suite("CSS Parser Test Suite", () => {
  test("Should parse valid CSS", () => {
    const css = ".test { color: red; }";
    const root = parseCSS(css);
    assert.ok(root);
  });

  test("Should validate CSS", () => {
    assert.strictEqual(isValidCSS(".test { color: red; }"), true);
    assert.strictEqual(isValidCSS("invalid css {{{"), false);
  });

  test("Should convert AST back to CSS", () => {
    const css = ".test { color: red; }";
    const root = parseCSS(css);
    const result = stringifyCSS(root);
    assert.ok(result.includes("color"));
  });
});

suite("CSS Cleaner Test Suite", () => {
  test("Should merge duplicate selectors and preserve all properties", async () => {
    const css = `
            .button { color: red; }
            .link { background: blue; }
            .button { padding: 10px; }
        `;

    const result = await cleanCSS(css);
    const buttonOccurrences = (result.match(/\.button/g) || []).length;

    // After cleaning, .button should appear only once
    assert.strictEqual(buttonOccurrences, 1);

    // Should preserve both properties: color and padding
    assert.ok(result.includes("color"), "Should preserve color property");
    assert.ok(result.includes("red"), "Should preserve color value");
    assert.ok(result.includes("padding"), "Should preserve padding property");
    assert.ok(result.includes("10px"), "Should preserve padding value");
    assert.ok(
      result.includes("background"),
      "Should preserve background property"
    );
    assert.ok(result.includes("blue"), "Should preserve background value");

    // Both properties should be under the same .button selector
    const buttonBlockMatch = result.match(/\.button\s*\{[^}]+\}/);
    assert.ok(buttonBlockMatch, "Should find .button block");

    const buttonBlock = buttonBlockMatch[0];
    assert.ok(
      buttonBlock.includes("color"),
      "Button block should contain color"
    );
    assert.ok(
      buttonBlock.includes("padding"),
      "Button block should contain padding"
    );
  });

  test("Should remove duplicate properties (keeping the last one)", async () => {
    const css = `
            .test {
                color: red;
                color: blue;
            }
        `;

    const result = await cleanCSS(css);
    const colorOccurrences = (result.match(/color:/g) || []).length;

    // Should keep only one color property (the last one)
    assert.strictEqual(colorOccurrences, 1);
    assert.ok(result.includes("blue"));
    assert.ok(
      !result.includes("red") || result.indexOf("blue") > result.indexOf("red")
    );
  });

  test("Should remove duplicate properties in complex case (keeping last values)", async () => {
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

    const result = await cleanCSS(css);

    // Should keep only one width (the last one - 200px)
    const widthMatches = result.match(/width:\s*\d+px/g) || [];
    assert.strictEqual(
      widthMatches.length,
      1,
      "Should have only one width property"
    );
    assert.ok(
      result.includes("200px"),
      "Should keep the last width value (200px)"
    );

    // Should keep only one background (the last one - #f6f7fb)
    const backgroundMatches = result.match(/background:/g) || [];
    assert.strictEqual(
      backgroundMatches.length,
      1,
      "Should have only one background property"
    );
    assert.ok(
      result.includes("#f6f7fb"),
      "Should keep the last background value"
    );

    // Should preserve unique properties
    assert.ok(
      result.includes("margin-bottom"),
      "Should preserve margin-bottom"
    );
    assert.ok(result.includes("transition"), "Should preserve transition");
    assert.ok(
      result.includes("border-radius"),
      "Should preserve border-radius"
    );
    assert.ok(result.includes("padding"), "Should preserve padding");
    assert.ok(result.includes("text-align"), "Should preserve text-align");
  });

  test("Should format CSS using Prettier", async () => {
    const css = `.test{color:red;padding:10px;}`;

    const result = await cleanCSS(css, { prettify: true });

    // Prettier should add line breaks and indentation
    assert.ok(result.includes("\n"), "Should contain line breaks");
    assert.ok(result.includes("  "), "Should contain indentation");
  });

  test("Should count duplicate selectors", () => {
    const css = `
            .button { color: red; }
            .button { padding: 10px; }
            .button { margin: 5px; }
        `;

    const count = countDuplicates(css);
    assert.strictEqual(count, 2); // 3 occurrences - 1 = 2 duplicates
  });

  test("Should count duplicate properties", () => {
    const css = `
            .test {
                width: 100px;
                width: 200px;
                width: 300px;
                color: red;
                color: blue;
            }
        `;

    const count = countDuplicatedProperties(css);
    assert.strictEqual(count, 3); // 2 width duplicates + 1 color duplicate
  });

  test("Should return detailed statistics", async () => {
    const css = `
            .button { width: 100px; width: 200px; }
            .button { color: red; }
        `;

    const stats = await getCleaningStats(css);

    assert.ok(
      stats.duplicatedSelectorsRemoved > 0,
      "Should remove duplicate selectors"
    );
    assert.ok(
      stats.duplicatedPropertiesRemoved > 0,
      "Should remove duplicate properties"
    );
    assert.ok(
      stats.cleanedSize < stats.originalSize,
      "Cleaned size should be smaller"
    );
    assert.ok(
      stats.percentReduction >= 0,
      "Should calculate percent reduction"
    );
  });

  test("Should handle empty CSS", async () => {
    const result = await cleanCSS("");
    assert.strictEqual(result.trim(), "");
  });

  test("Should handle CSS with no duplicates", async () => {
    const css = `
            .button { color: red; }
            .link { background: blue; }
        `;

    const result = await cleanCSS(css);

    // Should preserve both selectors
    assert.ok(result.includes(".button"), "Should preserve .button");
    assert.ok(result.includes(".link"), "Should preserve .link");
    assert.ok(result.includes("color"), "Should preserve color");
    assert.ok(result.includes("background"), "Should preserve background");
  });

  test("Should handle real-world product card CSS with multiple duplicates", async () => {
    const css = `
            .product-card {
                background: #fff;
                background: #f6f7fb;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
                margin-bottom: 20px;
                padding: 20px;
                text-align: center;
                transition: transform 0.2s;
                width: 240px;
                width: 220px;
                width: 200px;
            }
        `;

    const result = await cleanCSS(css);

    // Should keep only one background (the last one - #f6f7fb)
    const backgroundMatches = result.match(/background:\s*[^;]+;/g) || [];
    assert.strictEqual(
      backgroundMatches.length,
      1,
      "Should have only one background property"
    );
    assert.ok(
      result.includes("#f6f7fb"),
      "Should keep the last background value (#f6f7fb)"
    );
    assert.ok(
      !result.includes("#fff") ||
        result.indexOf("#f6f7fb") > result.indexOf("#fff"),
      "Should not keep #fff or it should appear before #f6f7fb"
    );

    // Should keep only one box-shadow (even though both have identical values)
    const boxShadowMatches = result.match(/box-shadow:\s*[^;]+;/g) || [];
    assert.strictEqual(
      boxShadowMatches.length,
      1,
      "Should have only one box-shadow property"
    );
    assert.ok(
      result.includes("box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07)"),
      "Should preserve box-shadow value"
    );

    // Should keep only one width (the last one - 200px)
    const widthMatches = result.match(/width:\s*\d+px/g) || [];
    assert.strictEqual(
      widthMatches.length,
      1,
      "Should have only one width property"
    );
    assert.ok(
      result.includes("200px"),
      "Should keep the last width value (200px)"
    );
    assert.ok(
      !result.includes("240px") && !result.includes("220px"),
      "Should not keep previous width values (240px, 220px)"
    );

    // Should preserve all unique properties
    const uniqueProperties = [
      "border-radius",
      "margin-bottom",
      "padding",
      "text-align",
      "transition",
    ];

    uniqueProperties.forEach((prop) => {
      assert.ok(
        result.includes(prop),
        `Should preserve unique property: ${prop}`
      );
    });

    // Should have exactly 8 properties in total after cleaning
    // (background, box-shadow, width + 5 unique properties)
    const propertyMatches = result.match(/[a-z-]+:\s*[^;]+;/g) || [];
    assert.strictEqual(
      propertyMatches.length,
      8,
      "Should have exactly 8 properties after deduplication"
    );

    // Should be properly formatted
    assert.ok(
      result.includes(".product-card"),
      "Should preserve selector name"
    );
    assert.ok(
      result.includes("{") && result.includes("}"),
      "Should have proper CSS block structure"
    );
  });

  test("Should count correct statistics for product card CSS", async () => {
    const css = `
            .product-card {
                background: #fff;
                background: #f6f7fb;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
                margin-bottom: 20px;
                padding: 20px;
                text-align: center;
                transition: transform 0.2s;
                width: 240px;
                width: 220px;
                width: 200px;
            }
        `;

    // Count duplicates before cleaning
    const duplicateCount = countDuplicatedProperties(css);

    // Should find 4 duplicates:
    // - 1 duplicate background (2 total - 1 = 1 duplicate)
    // - 1 duplicate box-shadow (2 total - 1 = 1 duplicate)
    // - 2 duplicate width (3 total - 1 = 2 duplicates)
    // Total: 1 + 1 + 2 = 4 duplicates
    assert.strictEqual(
      duplicateCount,
      4,
      "Should correctly count 4 duplicate properties"
    );

    // Get detailed statistics
    const stats = await getCleaningStats(css);

    assert.strictEqual(
      stats.duplicatedPropertiesRemoved,
      4,
      "Should report 4 duplicate properties removed"
    );

    assert.ok(
      stats.cleanedSize < stats.originalSize,
      "Cleaned CSS should be smaller than original"
    );

    assert.ok(
      stats.percentReduction > 0,
      "Should have positive percent reduction"
    );
  });
});
