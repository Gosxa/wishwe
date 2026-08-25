export const formatCategoryDisplayName = (name: string): string =>
  name.charAt(0).toLowerCase() + name.slice(1);

export const formatCategoryHashtag = (name: string): string =>
  `#${formatCategoryDisplayName(name)}`;

export const categoryTourId = (name: string): string =>
  `category-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}`;
