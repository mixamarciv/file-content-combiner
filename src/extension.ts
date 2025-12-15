import * as vscode from 'vscode';

const MAX_TOTAL_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

async function collectFilesRecursively(uri: vscode.Uri): Promise<vscode.Uri[]> {
	const stat = await vscode.workspace.fs.stat(uri);

	if (stat.type === vscode.FileType.File) {
		return [uri];
	}

	if (stat.type === vscode.FileType.Directory) {
		const entries = await vscode.workspace.fs.readDirectory(uri);

		const files: vscode.Uri[] = [];

		for (const [name, type] of entries) {
			const childUri = vscode.Uri.joinPath(uri, name);

			if (type === vscode.FileType.File) {
				files.push(childUri);
			} else if (type === vscode.FileType.Directory) {
				const nestedFiles = await collectFilesRecursively(childUri);
				files.push(...nestedFiles);
			}
		}

		return files;
	}

	return [];
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

		const allFileUris: vscode.Uri[] = [];

		for (const uri of selectedUris) {
			try {
				const files = await collectFilesRecursively(uri);
				allFileUris.push(...files);
			} catch (error) {
				vscode.window.showErrorMessage(`Error processing ${uri.fsPath}: ${error}`);
			}
		}

		if (allFileUris.length === 0) {
			vscode.window.showWarningMessage('No files found in selection.');
			return;
		}

		const combinedText = await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: 'Combining files...',
				cancellable: true
			},
			async (progress, token) => {
				return await combineFilesContent(allFileUris, progress, token);
			}
		);

		if (combinedText) {
			showCombinedContent(combinedText);
		}
	});

	context.subscriptions.push(disposable);
}

// Функция для комбинирования содержимого файлов.
async function combineFilesContent(
	fileUris: vscode.Uri[],
	progress: vscode.Progress<{ message?: string; increment?: number }>,
	token: vscode.CancellationToken
): Promise<string | undefined> {
	let result = '';
	let totalSize = 0;
	const increment = 100 / fileUris.length;

	for (const uri of fileUris) {
		if (token.isCancellationRequested) {
			vscode.window.showWarningMessage('Operation cancelled.');
			return;
		}

		try {
			const stat = await vscode.workspace.fs.stat(uri);

			if (totalSize + stat.size > MAX_TOTAL_SIZE_BYTES) {
				const sizeMb = (MAX_TOTAL_SIZE_BYTES / 1024 / 1024).toFixed(2);
				vscode.window.showErrorMessage(`Total size limit exceeded (${sizeMb} MB)`);
				return;
			}

			const fileContent = await vscode.workspace.fs.readFile(uri);
			const filePath = vscode.workspace.asRelativePath(uri.path);

			totalSize += stat.size;

			result += `\`\`\` файл: ${filePath}\n`;
			result += Buffer.from(fileContent).toString('utf8');
			result += '\n```\n\n';

			progress.report({
				message: filePath,
				increment
			});
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
