import axe from 'axe-core';

/** Runs axe on a rendered container. Colour contrast is skipped: jsdom does not compute styles. */
export async function axeViolations(container: Element) {
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  return result.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );
}
