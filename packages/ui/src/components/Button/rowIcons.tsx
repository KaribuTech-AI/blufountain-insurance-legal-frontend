/**
 * Icons for table row actions. A button picks one from its label, so a row can show a small
 * icon where the label would otherwise repeat down the column. The label stays in the page
 * for screen readers and as the tooltip.
 */
const PATHS = {
  edit: 'M3.5 16.5l.7-3.3L13.6 3.8a1.7 1.7 0 0 1 2.4 0l.2.2a1.7 1.7 0 0 1 0 2.4L6.8 15.8zM12 5.5l2.5 2.5',
  check: 'M4 10.5l4 4 8-9',
  x: 'M5 5l10 10M15 5L5 15',
  trash: 'M4.5 6h11M8 6V4h4v2M6 6l.7 10h6.6L14 6M8.5 9v4.5M11.5 9v4.5',
  plus: 'M10 4v12M4 10h12',
  eye: 'M1.8 10S5 4.5 10 4.5 18.2 10 18.2 10 15 15.5 10 15.5 1.8 10 1.8 10zM7.5 10a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0',
  refresh: 'M16 10a6 6 0 1 1-1.8-4.3M16 3.5v3.7h-3.7',
  download: 'M10 3.5v9M6.5 9.5 10 13l3.5-3.5M4 16h12',
  link: 'M8.5 11.5a3 3 0 0 0 4.2 0l2.3-2.3a3 3 0 0 0-4.2-4.2l-.8.8M11.5 8.5a3 3 0 0 0-4.2 0L5 10.8a3 3 0 0 0 4.2 4.2l.8-.8',
  question: 'M7.5 7.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8M10 14.5h.01',
  send: 'M17 3 9 11M17 3l-5 14-3-6-6-3z',
  arrow: 'M4 10h12M11 5l5 5-5 5',
} as const;

export type RowIcon = keyof typeof PATHS;

// First match wins, so the more specific words come first.
const RULES: Array<[RegExp, RowIcon]> = [
  [/\b(remove|delete|discard)\b/i, 'trash'],
  [/\b(decline|reject|refuse|cancel|revoke|void|close|dismiss|stop)\b/i, 'x'],
  [
    /\b(approve|accept|confirm|mark|pay|paid|collect|received|complete|done|verify|called)\b/i,
    'check',
  ],
  [/\b(edit|update|change|amend|rename|reassign|reschedule|adjust|set)\b/i, 'edit'],
  [/\b(query|ask|question)\b/i, 'question'],
  [/\b(resend|retry|refresh|renew|reload)\b/i, 'refresh'],
  [/\b(download|export|print|save)\b/i, 'download'],
  [/\b(assign|link|attach|connect)\b/i, 'link'],
  [/\b(send|notify|remind|sms|message)\b/i, 'send'],
  [/\b(add|new|record|register|log|create|start|schedule|book|raise)\b/i, 'plus'],
  [/\b(view|open|review|see|details|check|inspect)\b/i, 'eye'],
  [/\b(go|next|continue)\b/i, 'arrow'],
];

export function rowIconFor(label: string): RowIcon | undefined {
  const text = label.trim();
  if (!text || text.length > 40) return undefined;
  return RULES.find(([pattern]) => pattern.test(text))?.[1];
}

export function RowIconSvg({ name, className }: { name: RowIcon; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}
