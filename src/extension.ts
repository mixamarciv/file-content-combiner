import * as fs from 'fs';
import * as vscode from 'vscode';

function isDirectorySync(filePath: string): boolean {
    try {
        const stat = fs.statSync(filePath);
        return stat.isDirectory();
    } catch (error) {
        return false;
    }
}

// Эта функция вызывается при активации расширения.
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "file-content-combiner" is now active!');

	// Регистрируем контекстную команду для списка файлов проекта.
	let disposable = vscode.commands.registerCommand('file-content-combiner.combineFiles', async (uri: vscode.Uri, selectedUris: vscode.Uri[]) => {
		// uri - это первый выбранный ресурс
		// selectedUris - это массив ВСЕХ выбранных ресурсов (файлов/папок)

		if (!selectedUris || selectedUris.length === 0) {
			vscode.window.showWarningMessage('No files selected.');
			return;
		}

		// Фильтруем только файлы (исключаем папки)
		const fileUris = selectedUris.filter(uri => {
			return !isDirectorySync(uri.fsPath);
		});

		if (fileUris.length === 0) {
			vscode.window.showWarningMessage('Please select at least one file.');
			return;
		}

		const combinedText = await combineFilesContent(fileUris);

		showCombinedContent(combinedText);

		vscode.window.showInformationMessage('Hello World from file-content-combiner!');
	});

	context.subscriptions.push(disposable);
}

// Функция для комбинирования содержимого файлов.
async function combineFilesContent(fileUris: vscode.Uri[]): Promise<string> {
	let result = '';

	for (const uri of fileUris) {
		try {
			const fileContent = await vscode.workspace.fs.readFile(uri);
			const filePath = vscode.workspace.asRelativePath(uri.path);

			result += `\`\`\` файл: ${filePath}\n`;
			result += Buffer.from(fileContent).toString('utf8');
			result += '```\n\n';
		} catch (error) {
			vscode.window.showErrorMessage(`Error reading file ${uri.fsPath}: ${error}`);
		}
	}

	return result;
}

// Функция для отображения результата
function showCombinedContent(content: string) {
	const documentPromise = vscode.workspace.openTextDocument({
		content: content,
		language: 'plaintext'
	});

	documentPromise.then(document => {
		vscode.window.showTextDocument(document);
	});
}

export function deactivate() { }
