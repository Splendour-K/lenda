export const CATEGORIES = [
  {
    name: 'Formal Wear',
    subcategories: ['Suits', 'Dresses', 'Blazers', 'Formal Shoes', 'Bags (clutches, handbags)']
  },
  {
    name: 'Creator Gear',
    subcategories: ['Ring Lights', 'Tripods', 'Cameras', 'Microphones']
  },
  {
    name: 'Study Essentials',
    subcategories: ['Scientific Calculators', 'Projectors', 'Extension Boards', 'Power Banks']
  },
  {
    name: 'Events',
    subcategories: ['Speakers', 'Coolers', 'Basic Decorations']
  },
  {
    name: 'Travel',
    subcategories: ['Travel Bags', 'Small Carry-ons']
  }
];

export const EXCHANGE_RATES = {
  GHS: 1, // Base
  NGN: 110, // Approx 1 GHS = 110 NGN
  USD: 0.07 // Approx 1 GHS = 0.07 USD
};

export const CURRENCIES = {
  GHS: { symbol: 'GH₵', label: 'Ghanaian Cedi' },
  NGN: { symbol: '₦', label: 'Nigerian Naira' },
  USD: { symbol: '$', label: 'US Dollar' }
};
