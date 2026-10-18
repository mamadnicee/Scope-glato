export type ToppingKind =
  | 'cherry'
  | 'strawberry'
  | 'blueberry'
  | 'chocolate'
  | 'pistachio'
  | 'mint';

export interface Flavor {
  id: string;
  fa: string;
  en: string;
  giant: string;
  price: string;
  kcal: string;
  note: string;
  bg: { inner: string; mid: string; outer: string };
  accent: string;
  ink: string;
  /** [top scoop, bottom scoop] */
  scoops: [string, string];
  toppings: ToppingKind[];
  topper: 'cherry' | 'blueberries' | 'pistachio';
  decor: 'sprinkles' | 'nuts';
}

export const FLAVORS: Flavor[] = [
  {
    id: 'strawberry',
    fa: 'توت‌فرنگی',
    en: 'Strawberry Bliss',
    giant: 'STRAWBERRY',
    price: '۸۹ هزار تومان',
    kcal: '۱۸۰',
    note: 'توت‌فرنگی تازه‌ی کردستان + وانیل ماداگاسکار',
    bg: { inner: '#e0507f', mid: '#6d1236', outer: '#17040c' },
    accent: '#ffe7a3',
    ink: '#2a0613',
    scoops: ['#ff8fb0', '#ffd3df'],
    toppings: ['cherry', 'strawberry'],
    topper: 'cherry',
    decor: 'sprinkles',
  },
  {
    id: 'blueberry',
    fa: 'بلوبری',
    en: 'Midnight Blueberry',
    giant: 'BLUEBERRY',
    price: '۹۵ هزار تومان',
    kcal: '۱۶۵',
    note: 'بلوبری وحشی + تکه‌های شکلات تلخ ۷۰٪',
    bg: { inner: '#5552e8', mid: '#1f1b70', outer: '#07051d' },
    accent: '#ffc9e8',
    ink: '#140f3f',
    scoops: ['#8f82ff', '#cfc8ff'],
    toppings: ['blueberry', 'chocolate'],
    topper: 'blueberries',
    decor: 'sprinkles',
  },
  {
    id: 'pistachio',
    fa: 'پسته',
    en: 'Persian Pistachio',
    giant: 'PISTACHIO',
    price: '۱۱۰ هزار تومان',
    kcal: '۲۱۰',
    note: 'پسته‌ی اکبری رفسنجان + نعناع تازه',
    bg: { inner: '#2f9f6c', mid: '#0e4b31', outer: '#03150d' },
    accent: '#ffd9a0',
    ink: '#06210f',
    scoops: ['#b9db7c', '#f4e7c6'],
    toppings: ['pistachio', 'mint'],
    topper: 'pistachio',
    decor: 'nuts',
  },
];
