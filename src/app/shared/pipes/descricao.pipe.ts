import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Converte texto simples do lojista em HTML formatado:
 *  - Linhas em branco  → quebra de parágrafo
 *  - Linhas com "- "   → item de lista não-ordenada
 *  - *texto*           → <strong>texto</strong>  (negrito)
 *  - Demais linhas     → <p>...</p>
 *
 * Uso no template: [innerHTML]="produto.descricao | descricao"
 */
@Pipe({ name: 'descricao', standalone: true, pure: true })
export class DescricaoPipe implements PipeTransform {
  constructor(private readonly san: DomSanitizer) {}

  transform(raw: string | null | undefined): SafeHtml {
    return this.san.bypassSecurityTrustHtml(parseDescricao(raw));
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyInline(text: string): string {
  let s = escHtml(text);
  // **negrito** (dois asteriscos)
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // *negrito* (um asterisco — estilo WhatsApp)
  s = s.replace(/\*([^*\n]+?)\*/g, '<strong>$1</strong>');
  return s;
}

const BULLET_RE = /^(?:[-•]|\d+\.)\s+(.*)/;

export function parseDescricao(raw: string | null | undefined): string {
  if (!raw?.trim()) return '';

  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' = 'ul';

  const flushList = () => {
    if (!listItems.length) return;
    const tag = listType;
    blocks.push(
      `<${tag} class="product__desc-list">` +
        listItems.map(l => `<li>${l}</li>`).join('') +
      `</${tag}>`
    );
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Linha vazia → fecha lista pendente, cria separação de parágrafo
    if (!trimmed) {
      flushList();
      continue;
    }

    const m = BULLET_RE.exec(trimmed);
    if (m) {
      // Verifica se é lista ordenada (1. 2. …) ou não-ordenada
      const newType: 'ul' | 'ol' = /^\d+\./.test(trimmed) ? 'ol' : 'ul';
      if (listItems.length && newType !== listType) flushList();
      listType = newType;
      listItems.push(applyInline(m[1]));
      continue;
    }

    // Linha normal: fecha lista, emite parágrafo
    flushList();
    blocks.push(`<p>${applyInline(trimmed)}</p>`);
  }

  flushList();
  return blocks.join('');
}
