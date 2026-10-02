import {
  categoryIcon,
  categoryNameError,
  categoryNames,
  cleanCustomCategories,
  newCustomCategory,
} from '../categories';

const pets = { name: 'Pets', icon: '🐶' };
const kids = { name: 'Kids', icon: '👶' };

describe('categoryNames', () => {
  it('lists the built-in categories, then yours, then Other', () => {
    const names = categoryNames([pets, kids]);
    expect(names[0]).toBe('Food & Dining');
    expect(names.slice(-3)).toEqual(['Kids', 'Pets', 'Other']);
    expect(names.filter((n) => n === 'Other')).toHaveLength(1);
  });
});

describe('categoryIcon', () => {
  it('finds built-in and custom icons, with a fallback', () => {
    expect(categoryIcon('Groceries', [])).toBe('🛒');
    expect(categoryIcon('Pets', [pets])).toBe('🐶');
    expect(categoryIcon('Unknown', [pets])).toBe('📝');
  });
});

describe('categoryNameError', () => {
  it('accepts a new name', () => {
    expect(categoryNameError('  Home   office ', [pets])).toBeNull();
  });

  it('turns down empty, long and taken names', () => {
    expect(categoryNameError('  ', [])).toBe('Give the category a name.');
    expect(categoryNameError('x'.repeat(31), [])).toBe(
      'Keep the name to 30 characters.'
    );
    expect(categoryNameError('groceries', [])).toBe(
      "There's already a category called groceries."
    );
    expect(categoryNameError('PETS', [pets])).toBe(
      "There's already a category called PETS."
    );
    expect(categoryNameError('Transfer', [])).not.toBeNull();
  });
});

describe('newCustomCategory', () => {
  it('tidies the name and falls back to a default icon', () => {
    expect(newCustomCategory('  Home   office ', ' ')).toEqual({
      name: 'Home office',
      icon: '📝',
    });
  });
});

describe('cleanCustomCategories', () => {
  it('keeps well-formed categories that clash with nothing', () => {
    expect(
      cleanCustomCategories([
        pets,
        { name: 'pets', icon: '🐱' },
        { name: 'Shopping', icon: '🛍️' },
        { name: 42 },
        null,
        { name: 'Kids' },
      ])
    ).toEqual([pets, { name: 'Kids', icon: '📝' }]);
    expect(cleanCustomCategories('nope')).toEqual([]);
  });
});
