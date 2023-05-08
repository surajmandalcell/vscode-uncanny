"use strict";

import * as vscode from "vscode";
import CustomSidebarViewProvider from "./lib/sidebarProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log("Extension activated");

  const provider = new CustomSidebarViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CustomSidebarViewProvider.viewType,
      provider
    )
  );

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

export function deactivate() {}
