export type DiagnosticLevel = 'error' | 'warning' | 'info';

export interface Diagnostic {
  level: DiagnosticLevel;
  code: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

export class DiagnosticCollection {
  private diagnostics: Diagnostic[] = [];

  error(
    code: string,
    message: string,
    location?: { file?: string; line?: number; column?: number },
    suggestion?: string,
  ): void {
    this.diagnostics.push({ level: 'error', code, message, ...location, suggestion });
  }

  warning(
    code: string,
    message: string,
    location?: { file?: string; line?: number; column?: number },
    suggestion?: string,
  ): void {
    this.diagnostics.push({ level: 'warning', code, message, ...location, suggestion });
  }

  info(
    code: string,
    message: string,
    location?: { file?: string; line?: number; column?: number },
  ): void {
    this.diagnostics.push({ level: 'info', code, message, ...location });
  }

  hasErrors(): boolean {
    return this.diagnostics.some((d) => d.level === 'error');
  }

  getAll(): readonly Diagnostic[] {
    return this.diagnostics;
  }

  getErrors(): Diagnostic[] {
    return this.diagnostics.filter((d) => d.level === 'error');
  }

  getWarnings(): Diagnostic[] {
    return this.diagnostics.filter((d) => d.level === 'warning');
  }

  format(): string {
    return this.diagnostics
      .map((d) => {
        const loc = d.file
          ? ` at ${d.file}${d.line ? `:${d.line}` : ''}${d.column ? `:${d.column}` : ''}`
          : '';
        const sug = d.suggestion ? `\n  Suggestion: ${d.suggestion}` : '';
        return `[${d.level.toUpperCase()}] ${d.code}: ${d.message}${loc}${sug}`;
      })
      .join('\n');
  }
}
