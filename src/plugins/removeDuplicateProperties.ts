import { Plugin, Declaration } from 'postcss';

/**
 * Custom PostCSS plugin to remove duplicate properties within a rule
 * Keeps only the last occurrence of each property
 */
export function removeDuplicateProperties(): Plugin {
    return {
        postcssPlugin: 'remove-duplicate-properties',
        Rule(rule) {
            // Track properties and their last occurrence
            const propertyMap = new Map<string, Declaration>();
            const declarations: Declaration[] = [];
            
            // Collect all declarations
            rule.walkDecls((decl) => {
                declarations.push(decl);
            });
            
            // Find the last occurrence of each property
            declarations.forEach((decl) => {
                const prop = decl.prop.toLowerCase();
                
                // If property already exists, mark the old one for removal
                if (propertyMap.has(prop)) {
                    const oldDecl = propertyMap.get(prop);
                    if (oldDecl) {
                        oldDecl.remove();
                    }
                }
                
                // Store current declaration as the latest
                propertyMap.set(prop, decl);
            });
        }
    };
}

// Required for PostCSS plugins
removeDuplicateProperties.postcss = true;
