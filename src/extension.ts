import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Эта функция вызывается при активации расширения
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "file-content-combiner" is now active!111111111111112');

	// Регистрируем нашу команду.
	let disposable = vscode.commands.registerCommand('file-content-combiner.combineFiles', async (uri: vscode.Uri, selectedUris: vscode.Uri[]) => {
		// uri - это первый выбранный ресурс
		// selectedUris - это массив ВСЕХ выбранных ресурсов (файлов/папок)

		if (!selectedUris || selectedUris.length === 0) {
			vscode.window.showWarningMessage('No files selected.');
			return;
		}

		// Фильтруем только файлы (исключаем папки)
		const fileUris = selectedUris.filter(uri => {
			// Простая проверка: если у URI есть расширение, считаем его файлом
			return path.extname(uri.fsPath) !== '';
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

// Функция для комбинирования содержимого файлов
async function combineFilesContent(fileUris: vscode.Uri[]): Promise<string> {
	let result = '';

	for (const uri of fileUris) {
		try {
			// Читаем файл используя VSCode API
			const fileContent = await vscode.workspace.fs.readFile(uri);
			const fileName = path.basename(uri.fsPath);

			// Добавляем разделитель с именем файла
			result += `// файл: ${fileName}\n`;
			result += Buffer.from(fileContent).toString('utf8');
			result += '\n\n';

		} catch (error) {
			vscode.window.showErrorMessage(`Error reading file ${uri.fsPath}: ${error}`);
		}
	}

	return result;
}


// Функция для отображения результата
function showCombinedContent(content: string) {
	// Создаем новую вкладку (документ) в VSCode
	const documentPromise = vscode.workspace.openTextDocument({
		content: content,
		language: 'plaintext'
	});

	// Показываем этот документ пользователю
	documentPromise.then(document => {
		vscode.window.showTextDocument(document);
	});
}

export function deactivate() { }
