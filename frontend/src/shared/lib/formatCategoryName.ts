export const formatCategoryDisplayName = (name: string): string =>
  name.charAt(0).toLowerCase() + name.slice(1);

export const formatCategoryHashtag = (name: string): string =>
  `#${formatCategoryDisplayName(name)}`;
