import * as vscode from 'vscode';
import { cleanCSS, getCleaningStats } from './cssCleaner';

/**
 * Extension activation function
 * Called when the extension is first activated
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('CSS Cleaner is now active!');

    // Register the clean CSS command
    const cleanCommand = vscode.commands.registerCommand(
        'css-cleaner.cleanCSS',
        async () => {
            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                vscode.window.showErrorMessage('No file is open');
                return;
            }

            const document = editor.document;
            
            // Check if the file is a CSS file
            if (document.languageId !== 'css') {
                vscode.window.showWarningMessage(
                    'This file is not a CSS file'
                );
                return;
            }

            try {
                const originalCSS = document.getText();
                
                // Show progress notification
                await vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        title: 'Cleaning CSS...',
                        cancellable: false
                    },
                    async (progress) => {
                        progress.report({ increment: 20, message: 'Analyzing...' });
                        
                        const stats = await getCleaningStats(originalCSS);
                        
                        progress.report({ increment: 40, message: 'Cleaning...' });
                        
                        const cleanedCSS = await cleanCSS(originalCSS, {
                            // TODO: Add custom configurations
                            removeDuplicatedProperties: true,
                            removeDuplicatedValues: true,
                            sortProperties: true,
                            prettify: true
                        });
                        
                        progress.report({ increment: 30, message: 'Applying changes...' });
                        
                        // Replace the entire document text
                        const fullRange = new vscode.Range(
                            document.positionAt(0),
                            document.positionAt(originalCSS.length)
                        );
                        
                        await editor.edit((editBuilder) => {
                            editBuilder.replace(fullRange, cleanedCSS);
                        });
                        
                        progress.report({ increment: 10, message: 'Done!' });
                        
                        // Show detailed statistics
                        const message = [
                            'CSS successfully cleaned!',
                            `• Duplicate selectors removed: ${stats.duplicatedSelectorsRemoved}`,
                            `• Duplicate properties removed: ${stats.duplicatedPropertiesRemoved}`,
                            `• Size reduction: ${stats.percentReduction.toFixed(1)}%`
                        ].join('\n');
                        
                        vscode.window.showInformationMessage(message);
                    }
                );
            } catch (error) {
                vscode.window.showErrorMessage(
                    `CSS cleaning error: ${error}`
                );
            }
        }
    );

    context.subscriptions.push(cleanCommand);
}

/**
 * Extension deactivation function
 * Called when the extension is deactivated
 */
export function deactivate() {}
