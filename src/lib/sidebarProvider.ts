import * as vscode from "vscode";
import getErrors from "./getErrors";
import { getHtml } from "./utils";

class CustomSidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "uncanny-mrincredible.openview";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext<unknown>,
    _token: vscode.CancellationToken
  ): void | Thenable<void> {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    setInterval(() => {
      const errors = getErrors();
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

export default CustomSidebarViewProvider;
