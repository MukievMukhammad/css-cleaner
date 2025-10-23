import postcss, { Root } from 'postcss';

/**
 * Parses CSS string into an AST (Abstract Syntax Tree)
 * 
 * @param cssContent - The CSS string to parse
 * @returns PostCSS Root node representing the CSS AST
 * @throws Error if CSS parsing fails
 */
export function parseCSS(cssContent: string): Root {
    try {
        return postcss.parse(cssContent);
    } catch (error) {
        throw new Error(`CSS parsing error: ${error}`);
    }
}

/**
 * Converts AST back to CSS string
 * 
 * @param root - PostCSS Root node
 * @returns CSS string representation
 */
export function stringifyCSS(root: Root): string {
    return root.toString();
}

/**
 * Checks if a string is valid CSS
 * 
 * @param cssContent - The CSS string to validate
 * @returns true if CSS is valid, false otherwise
 */
export function isValidCSS(cssContent: string): boolean {
    try {
        postcss.parse(cssContent);
        return true;
    } catch {
        return false;
    }
}
