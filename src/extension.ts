import * as vscode from 'vscode';

// Функция активации - вызывается при загрузке расширения
export function activate(context: vscode.ExtensionContext) {
    console.log('CSS Cleaner активирован!');

    // Регистрация команды
    let disposable = vscode.commands.registerCommand('css-cleaner.cleanCSS', () => {
        // Получаем активный редактор
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) {
            vscode.window.showErrorMessage('Нет открытого файла');
            return;
        }

        // Получаем текст документа
        const document = editor.document;
        const text = document.getText();

        // Здесь будет ваша логика очистки CSS
        vscode.window.showInformationMessage('CSS Cleaner работает!');
    });

    context.subscriptions.push(disposable);
}

// Функция деактивации - вызывается при выгрузке
export function deactivate() {}
