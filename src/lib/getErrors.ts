import * as vscode from "vscode";

export default function getErrors(): number {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return 0;
  }
  const document = activeTextEditor.document;

  let numErrors = 0;
  let numWarnings = 0;

  const aggregatedDiagnostics = new Map<number, vscode.Diagnostic[]>();

  for (const diagnostic of vscode.languages.getDiagnostics(document.uri)) {
    const { severity, range } = diagnostic;
    const key = range.start.line;

    if (aggregatedDiagnostics.has(key)) {
      aggregatedDiagnostics.get(key)?.push(diagnostic);
    } else {
      aggregatedDiagnostics.set(key, [diagnostic]);
    }

    switch (severity) {
      case vscode.DiagnosticSeverity.Error:
        numErrors += 1;
        break;

      case vscode.DiagnosticSeverity.Warning:
        numWarnings += 1;
        break;
    }
  }

  return numErrors;
}
