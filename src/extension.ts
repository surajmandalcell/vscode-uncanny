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
  let errorLensEnabled: boolean = true;

  let disposableEnableErrorLens = vscode.commands.registerCommand(
    "ErrorLens.enable",
    () => {
      errorLensEnabled = true;

      const activeTextEditor: vscode.TextEditor | undefined =
        vscode.window.activeTextEditor;
      if (activeTextEditor) {
        updateDecorationsForUri(activeTextEditor.document.uri);
      }
    }
  );

  context.subscriptions.push(disposableEnableErrorLens);

  let disposableDisableErrorLens = vscode.commands.registerCommand(
    "ErrorLens.disable",
    () => {
      errorLensEnabled = false;

      const activeTextEditor: vscode.TextEditor | undefined =
        vscode.window.activeTextEditor;
      if (activeTextEditor) {
        updateDecorationsForUri(activeTextEditor.document.uri);
      }
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
    (textEditor) => {
      if (textEditor === undefined) {
        return;
      }
      updateDecorationsForUri(textEditor.document.uri);
    },
    null,
    context.subscriptions
  );

  function onChangedDiagnostics(
    diagnosticChangeEvent: vscode.DiagnosticChangeEvent
  ) {
    if (!vscode.window) {
      return;
    }

    const activeTextEditor: vscode.TextEditor | undefined =
      vscode.window.activeTextEditor;
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

  function updateDecorationsForUri(uriToDecorate: vscode.Uri) {
    if (!uriToDecorate) {
      return;
    }

    if (uriToDecorate.scheme !== "file") {
      return;
    }

    if (!vscode.window) {
      return;
    }

    const activeTextEditor: vscode.TextEditor | undefined =
      vscode.window.activeTextEditor;
    if (!activeTextEditor) {
      return;
    }

    if (!activeTextEditor.document.uri.fsPath) {
      return;
    }

    let numErrors = 0;
    let numWarnings = 0;

    if (errorLensEnabled) {
      let aggregatedDiagnostics: any = {};
      let diagnostic: vscode.Diagnostic;

      for (diagnostic of vscode.languages.getDiagnostics(uriToDecorate)) {
        let key = "line" + diagnostic.range.start.line;

        if (aggregatedDiagnostics[key]) {
          aggregatedDiagnostics[key].arrayDiagnostics.push(diagnostic);
        } else {
          aggregatedDiagnostics[key] = {
            line: diagnostic.range.start.line,
            arrayDiagnostics: [diagnostic],
          };
        }

        switch (diagnostic.severity) {
          case 0:
            numErrors += 1;
            break;

          case 1:
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

    webviewView.webview.html = this.getHtmlContent0(webviewView.webview);

    setInterval(() => {
      let errors = getNumErrors();
      if (errors === 0) {
        webviewView.webview.html = this.getHtmlContent0(webviewView.webview);
      } else if (errors < 5) {
        webviewView.webview.html = this.getHtmlContent1(webviewView.webview);
      } else if (errors < 10) {
        webviewView.webview.html = this.getHtmlContent2(webviewView.webview);
      } else {
        webviewView.webview.html = this.getHtmlContent3(webviewView.webview);
      }
    }, 1000);
  }

  private getHtmlContent0(webview: vscode.Webview): string {
    const stylesheetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "assets", "main.css")
    );

    const face0 = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "assets", "incredible0.png")
    );

    return getHtml(face0);
  }

  private getHtmlContent1(webview: vscode.Webview): string {
    const stylesheetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "assets", "main.css")
    );

    const face1 = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "assets", "incredible1.png")
    );

    return getHtml(face1);
  }

  private getHtmlContent2(webview: vscode.Webview): string {
    const stylesheetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "assets", "main.css")
    );

    const face2 = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "assets", "incredible2.png")
    );

    return getHtml(face2);
  }

  private getHtmlContent3(webview: vscode.Webview): string {
    const stylesheetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "assets", "main.css")
    );

    const face3 = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "assets", "incredible3.png")
    );

    return getHtml(face3);
  }
}

function getHtml(doomFace: any) {
  return `
    <!DOCTYPE html>
			<html lang="en">
			<head>

			</head>

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
  const activeTextEditor: vscode.TextEditor | undefined =
    vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return 0;
  }
  const document: vscode.TextDocument = activeTextEditor.document;

  let numErrors = 0;
  let numWarnings = 0;

  let aggregatedDiagnostics: any = {};
  let diagnostic: vscode.Diagnostic;

  for (diagnostic of vscode.languages.getDiagnostics(document.uri)) {
    let key = "line" + diagnostic.range.start.line;

    if (aggregatedDiagnostics[key]) {
      aggregatedDiagnostics[key].arrayDiagnostics.push(diagnostic);
    } else {
      aggregatedDiagnostics[key] = {
        line: diagnostic.range.start.line,
        arrayDiagnostics: [diagnostic],
      };
    }

    switch (diagnostic.severity) {
      case 0:
        numErrors += 1;
        break;

      case 1:
        numWarnings += 1;
        break;
    }
  }

  return numErrors;
}

export function deactivate() {}
