import { cn } from '@/lib/utils';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function simpleMarkdownToHtml(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const tag = listType;
      const items = listItems
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join('');
      result.push(`<${tag}>${items}</${tag}>`);
      listItems = [];
    }
    listType = null;
    inList = false;
  };

  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const processInline = (line: string): string => {
    return line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);
    const ulMatch = line.match(/^-\s+(.+)$/);
    const olMatch = line.match(/^(\d+)\.\s+(.+)$/);

    if (h2Match) {
      flushList();
      const text = processInline(h2Match[1].trim());
      const id = slugify(h2Match[1].trim());
      result.push(`<h2 id="${id}">${text}</h2>`);
    } else if (h3Match) {
      flushList();
      const text = processInline(h3Match[1].trim());
      const id = slugify(h3Match[1].trim());
      result.push(`<h3 id="${id}">${text}</h3>`);
    } else if (ulMatch) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
        inList = true;
      }
      listItems.push(ulMatch[1]);
    } else if (olMatch) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
        inList = true;
      }
      listItems.push(olMatch[2]);
    } else if (line.trim() === '') {
      flushList();
      result.push('<br />');
    } else {
      flushList();
      result.push(`<p>${processInline(line)}</p>`);
    }
  }

  flushList();
  return result.join('\n');
}

interface ArticleContentProps {
  content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
  const html = simpleMarkdownToHtml(content);

  return (
    <div
      className={cn(
        'prose prose-slate max-w-none dark:prose-invert',
        'prose-headings:scroll-mt-24',
        'prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4',
        'prose-h3:text-lg prose-h3:font-medium prose-h3:mt-6 prose-h3:mb-3',
        'prose-p:leading-relaxed prose-p:mb-4',
        'prose-ul:my-4 prose-ol:my-4',
        'prose-li:my-1',
        'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
        'prose-strong:font-semibold'
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
