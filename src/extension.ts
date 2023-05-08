"use strict";

import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log("Extension activated");

  const provider = new CustomSidebarViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CustomSidebarViewProvider.viewType,
      provider
    )
  );

  let _statusBarItem: vscode.StatusBarItem;
  let errorLensEnabled = true;

  const disposableEnableErrorLens = vscode.commands.registerCommand(
    "ErrorLens.enable",
    () => {
      errorLensEnabled = true;
      updateDecorationsForActiveEditor();
    }
  );

  context.subscriptions.push(disposableEnableErrorLens);

  const disposableDisableErrorLens = vscode.commands.registerCommand(
    "ErrorLens.disable",
    () => {
      errorLensEnabled = false;
      updateDecorationsForActiveEditor();
    }
  );

  context.subscriptions.push(disposableDisableErrorLens);

  vscode.languages.onDidChangeDiagnostics(
    (diagnosticChangeEvent) => {
      onChangedDiagnostics(diagnosticChangeEvent);
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidOpenTextDocument(
    (textDocument) => {
      updateDecorationsForUri(textDocument.uri);
    },
    null,
    context.subscriptions
  );

  vscode.window.onDidChangeActiveTextEditor(
    () => {
      updateDecorationsForActiveEditor();
    },
    null,
    context.subscriptions
  );

  function onChangedDiagnostics(
    diagnosticChangeEvent: vscode.DiagnosticChangeEvent
  ) {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (!activeTextEditor) {
      return;
    }

    for (const uri of diagnosticChangeEvent.uris) {
      if (uri.fsPath === activeTextEditor.document.uri.fsPath) {
        updateDecorationsForUri(uri);
        break;
      }
    }
  }

  function updateDecorationsForActiveEditor() {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (!activeTextEditor) {
      return;
    }

    updateDecorationsForUri(activeTextEditor.document.uri);
  }

  function updateDecorationsForUri(uriToDecorate: vscode.Uri) {
    if (!uriToDecorate || uriToDecorate.scheme !== "file") {
      return;
    }

    const diagnostics = vscode.languages.getDiagnostics(uriToDecorate);
    let numErrors = 0;
    let numWarnings = 0;

    if (errorLensEnabled) {
      for (const diagnostic of diagnostics) {
        switch (diagnostic.severity) {
          case vscode.DiagnosticSeverity.Error:
            numErrors += 1;
            break;

          case vscode.DiagnosticSeverity.Warning:
            numWarnings += 1;
            break;
        }
      }
    }
  }
}

class CustomSidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "uncanny-mrincredible.openview";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    setInterval(() => {
      const errors = getNumErrors();
      const face = this.getFace(errors);
      webviewView.webview.html = this.getHtmlContent(webviewView.webview, face);
    }, 1000);
  }

  private getFace(errors: number): string {
    if (errors === 0) {
      return "incredible0.png";
    } else if (errors < 5) {
      return "incredible1.png";
    } else if (errors < 10) {
      return "incredible2.png";
    } else {
      return "incredible3.png";
    }
  }

  private getHtmlContent(webview: vscode.Webview, face: string): string {
    const stylesheetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "assets", "main.css")
    );

    const imageUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "assets", face)
    );

    return getHtml(imageUri);
  }
}

function getHtml(doomFace: any) {
  return `
    <!DOCTYPE html>
			<html lang="en">
			<body>
			<section class="wrapper">
        <img class="doomFaces" src="${doomFace}" alt="" >
        <h1 id="errorNum">${getNumErrors() + " errors"}</h1>
			</section>
      </body>
		</html>
  `;
}

function getNumErrors(): number {
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

export function deactivate() {}
