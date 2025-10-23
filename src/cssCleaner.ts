import postcss from 'postcss';
import combineDuplicatedSelectors from 'postcss-combine-duplicated-selectors';
import discardDuplicates from 'postcss-discard-duplicates';
import sorting from 'postcss-sorting';
import prettier from 'prettier';

export interface CleanerOptions {
    removeDuplicatedProperties?: boolean;
    removeDuplicatedValues?: boolean;
    sortProperties?: boolean;
    prettify?: boolean;
}

/**
 * Cleans CSS: merges duplicate selectors, removes duplicate properties,
 * and formats the result
 * 
 * @param cssContent - The CSS string to clean
 * @param options - Cleaning options
 * @returns Cleaned and formatted CSS string
 */
export async function cleanCSS(
    cssContent: string, 
    options: CleanerOptions = {}
): Promise<string> {
    const {
        removeDuplicatedProperties = true,
        removeDuplicatedValues = true,
        sortProperties = false,
        prettify = true
    } = options;

    try {
        // Build the plugins array
        const plugins: any[] = [];

        // 1. Combine duplicate selectors
        const combineOptions: any = {};
        if (removeDuplicatedProperties) {
            combineOptions.removeDuplicatedProperties = true;
        }
        if (removeDuplicatedValues) {
            combineOptions.removeDuplicatedValues = true;
        }
        plugins.push(combineDuplicatedSelectors(combineOptions));

        // 2. Remove duplicate properties within a single selector
        // (keeps only the last occurrence)
        plugins.push(discardDuplicates());

        // 3. Sort properties
        if (sortProperties) {
            plugins.push(sorting({
                order: ['custom-properties', 'dollar-variables', 'declarations', 'at-rules', 'rules'],
                'properties-order': 'alphabetical'
            }));
        }

        // Apply PostCSS plugins
        const result = await postcss(plugins).process(cssContent, { from: undefined });
        let cleanedCSS = result.css;

        // 4. Format using Prettier
        if (prettify) {
            cleanedCSS = await prettier.format(cleanedCSS, {
                parser: 'css',
                printWidth: 80,
                tabWidth: 2,
                useTabs: false,
                singleQuote: false,
                trailingComma: 'none',
                bracketSpacing: true
            });
        }

        return cleanedCSS;
    } catch (error) {
        throw new Error(`CSS processing error: ${error}`);
    }
}

/**
 * Counts the number of duplicate selectors in CSS
 * 
 * @param cssContent - The CSS string to analyze
 * @returns Number of duplicate selectors found
 */
export function countDuplicates(cssContent: string): number {
    const root = postcss.parse(cssContent);
    const selectors = new Map<string, number>();
    
    root.walkRules((rule) => {
        const selector = rule.selector;
        selectors.set(selector, (selectors.get(selector) || 0) + 1);
    });
    
    let duplicateCount = 0;
    selectors.forEach((count) => {
        if (count > 1) {
            duplicateCount += count - 1;
        }
    });
    
    return duplicateCount;
}

/**
 * Counts the number of duplicate properties within selectors
 * 
 * @param cssContent - The CSS string to analyze
 * @returns Number of duplicate properties found
 */
export function countDuplicatedProperties(cssContent: string): number {
    const root = postcss.parse(cssContent);
    let duplicateCount = 0;
    
    root.walkRules((rule) => {
        const properties = new Map<string, number>();
        
        rule.walkDecls((decl) => {
            const prop = decl.prop;
            properties.set(prop, (properties.get(prop) || 0) + 1);
        });
        
        properties.forEach((count) => {
            if (count > 1) {
                duplicateCount += count - 1;
            }
        });
    });
    
    return duplicateCount;
}

/**
 * Returns detailed cleaning statistics
 * 
 * @param cssContent - The CSS string to analyze
 * @returns Object with detailed statistics about the cleaning process
 */
export async function getCleaningStats(cssContent: string): Promise<{
    originalSize: number;
    cleanedSize: number;
    duplicatedSelectorsRemoved: number;
    duplicatedPropertiesRemoved: number;
    percentReduction: number;
}> {
    const originalSize = cssContent.length;
    const duplicatedSelectorsBefore = countDuplicates(cssContent);
    const duplicatedPropertiesBefore = countDuplicatedProperties(cssContent);
    
    const cleaned = await cleanCSS(cssContent);
    const cleanedSize = cleaned.length;
    const duplicatedSelectorsAfter = countDuplicates(cleaned);
    const duplicatedPropertiesAfter = countDuplicatedProperties(cleaned);
    
    return {
        originalSize,
        cleanedSize,
        duplicatedSelectorsRemoved: duplicatedSelectorsBefore - duplicatedSelectorsAfter,
        duplicatedPropertiesRemoved: duplicatedPropertiesBefore - duplicatedPropertiesAfter,
        percentReduction: originalSize > 0 
            ? ((originalSize - cleanedSize) / originalSize) * 100 
            : 0
    };
}
