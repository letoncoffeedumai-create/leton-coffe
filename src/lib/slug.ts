/**
 * Utility to generate clean and unique category slugs
 * Examples:
 * - "Coffee & Espresso" -> "coffee-espresso"
 * - "Signature Series" -> "signature-series"
 * - "Fruity & Mocktail" -> "fruity-mocktail"
 */
export function generateCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, '') // strip & so "Coffee & Espresso" becomes "coffee espresso"
    .replace(/[^a-z0-9]+/g, '-') // convert spaces and symbols into single hyphen
    .replace(/^-+|-+$/g, ''); // trim leading and trailing hyphens
}

/**
 * Ensures that a slug is unique among the existing list of categories.
 * If duplicate found, appends -1, -2, etc.
 */
export function ensureUniqueCategorySlug(
  baseSlug: string,
  existingCategories: { id: string; slug: string }[],
  currentId?: string
): string {
  const fallback = baseSlug || 'kategori';
  const otherSlugs = new Set(
    existingCategories
      .filter((c) => !currentId || c.id !== currentId)
      .map((c) => c.slug)
  );

  if (!otherSlugs.has(fallback)) return fallback;

  let counter = 1;
  while (otherSlugs.has(`${fallback}-${counter}`)) {
    counter++;
  }
  return `${fallback}-${counter}`;
}
