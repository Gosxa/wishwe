type NamedCategory = { id: number; name: string };

const PREFERRED = [
  'food & drinks',
  'food & dining',
  'coffee & chats',
  'food',
  'coffee',
  'drink',
];

export const pickOnboardingCategory = (
  categories: NamedCategory[],
): NamedCategory | null => {
  for (const wanted of PREFERRED) {
    const match = categories.find(category =>
      category.name.toLowerCase().includes(wanted),
    );

    if (match) return match;
  }

  return categories[0] ?? null;
};
