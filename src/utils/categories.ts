// src/utils/categories.ts
// The built-in categories plus the ones you add yourself.
import { TAG_CATEGORIES } from '../constants/financial';

export interface CustomCategory {
  name: string;
  icon: string;
}

// Icons to pick from for a new category.
export const CUSTOM_CATEGORY_ICONS = [
  '🏷️',
  '🐶',
  '👶',
  '🎓',
  '🎁',
  '💇',
  '🏋️',
  '🏡',
  '🚗',
  '✈️',
  '💼',
  '💊',
  '📚',
  '🎮',
  '☕',
  '🍷',
  '🧾',
  '💰',
  '❤️',
  '🔧',
];

export const DEFAULT_CATEGORY_ICON = '📝';
const MAX_NAME_LENGTH = 30;
// Names the app gives meaning to, which can't be taken.
const RESERVED = ['transfer'];

const BUILT_IN = Object.keys(TAG_CATEGORIES);

export const isBuiltInCategory = (name: string): boolean =>
  Object.prototype.hasOwnProperty.call(TAG_CATEGORIES, name);

// Every category, for menus: the built-in ones, then yours alphabetically,
// with "Other" last.
export const categoryNames = (custom: CustomCategory[]): string[] => [
  ...BUILT_IN.filter((name) => name !== 'Other'),
  ...custom.map((c) => c.name).sort((a, b) => a.localeCompare(b)),
  'Other',
];

export const categoryIcon = (name: string, custom: CustomCategory[]): string =>
  TAG_CATEGORIES[name]?.icon ??
  custom.find((c) => c.name === name)?.icon ??
  DEFAULT_CATEGORY_ICON;

const tidy = (name: string) => name.trim().replace(/\s+/g, ' ');

// Why a new category can't have this name, or null when it can.
export const categoryNameError = (
  name: string,
  custom: CustomCategory[]
): string | null => {
  const tidied = tidy(name);
  if (tidied === '') return 'Give the category a name.';
  if (tidied.length > MAX_NAME_LENGTH) {
    return `Keep the name to ${MAX_NAME_LENGTH} characters.`;
  }
  const lower = tidied.toLowerCase();
  if (
    RESERVED.includes(lower) ||
    [...BUILT_IN, ...custom.map((c) => c.name)].some(
      (existing) => existing.toLowerCase() === lower
    )
  ) {
    return `There's already a category called ${tidied}.`;
  }
  return null;
};

export const newCustomCategory = (
  name: string,
  icon: string
): CustomCategory => ({
  name: tidy(name),
  icon: icon.trim() || DEFAULT_CATEGORY_ICON,
});

// Keeps well-formed categories that don't clash with a built-in one or each
// other. Used for saved categories and backups, which may be hand-edited.
export const cleanCustomCategories = (value: unknown): CustomCategory[] => {
  if (!Array.isArray(value)) return [];
  const result: CustomCategory[] = [];
  for (const item of value) {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof item.name !== 'string'
    ) {
      continue;
    }
    if (categoryNameError(item.name, result) !== null) continue;
    result.push(
      newCustomCategory(
        item.name,
        typeof item.icon === 'string' ? item.icon.slice(0, 16) : ''
      )
    );
  }
  return result;
};
