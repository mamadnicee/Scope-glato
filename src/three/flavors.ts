export type ToppingKind =
  | 'cherry'
  | 'strawberry'
  | 'blueberry'
  | 'chocolate'
  | 'pistachio'
  | 'mint'
  | 'kiwi'
  | 'date';

export type TopperKind = Extract<
  ToppingKind,
  'cherry' | 'blueberry' | 'pistachio' | 'chocolate' | 'kiwi' | 'date'
>;

export type Decor = 'sprinkles' | 'nuts';

export interface Flavor {
  id: string;
  fa: string;
  en: string;
  giant: string;
  price: string;
  priceValue: number;
  kcal: number;
  note: string;
  base: string;
  bg: { inner: string; mid: string; outer: string };
  accent: string;
  ink: string;
  /** [top scoop, bottom scoop] */
  scoops: [string, string];
  toppings: ToppingKind[];
  topper: TopperKind;
  decor: Decor;
  tag?: string;
}

export const FLAVORS: Flavor[] = [
  {
    id: 'strawberry',
    fa: 'توت‌فرنگی',
    en: 'Strawberry Bliss',
    giant: 'STRAWBERRY',
    price: '۸۹ هزار تومان',
    priceValue: 89000,
    kcal: 180,
    note: 'توت‌فرنگی تازه‌ی کردستان + وانیل ماداگاسکار',
    base: 'شیر تازه‌ی گاوداری محلی',
    bg: { inner: '#e0507f', mid: '#6d1236', outer: '#17040c' },
    accent: '#ffe7a3',
    ink: '#2a0613',
    scoops: ['#ff8fb0', '#ffd3df'],
    toppings: ['cherry', 'strawberry'],
    topper: 'cherry',
    decor: 'sprinkles',
    tag: 'پرفروش‌ترین',
  },
  {
    id: 'blueberry',
    fa: 'بلوبری',
    en: 'Midnight Blueberry',
    giant: 'BLUEBERRY',
    price: '۹۵ هزار تومان',
    priceValue: 95000,
    kcal: 165,
    note: 'بلوبری وحشی + تکه‌های شکلات تلخ ۷۰٪',
    base: 'خامه‌ی تازه‌ی پرچرب',
    bg: { inner: '#5552e8', mid: '#1f1b70', outer: '#07051d' },
    accent: '#ffc9e8',
    ink: '#140f3f',
    scoops: ['#8f82ff', '#cfc8ff'],
    toppings: ['blueberry', 'chocolate'],
    topper: 'blueberry',
    decor: 'sprinkles',
  },
  {
    id: 'pistachio',
    fa: 'پسته',
    en: 'Persian Pistachio',
    giant: 'PISTACHIO',
    price: '۱۱۰ هزار تومان',
    priceValue: 110000,
    kcal: 210,
    note: 'پسته‌ی اکبری رفسنجان + نعناع تازه',
    base: 'شیر تازه‌ی گاوداری محلی',
    bg: { inner: '#2f9f6c', mid: '#0e4b31', outer: '#03150d' },
    accent: '#ffd9a0',
    ink: '#06210f',
    scoops: ['#b9db7c', '#f4e7c6'],
    toppings: ['pistachio', 'mint'],
    topper: 'pistachio',
    decor: 'nuts',
    tag: 'امضای اسکوپ',
  },
  {
    id: 'chocolate',
    fa: 'شکلات تلخ',
    en: 'Dark Chocolate',
    giant: 'CHOCOLATE',
    price: '۹۸ هزار تومان',
    priceValue: 98000,
    kcal: 240,
    note: 'کاکائو ۷۰٪ فاریاب + خلال پسته‌ی رفسنجان',
    base: 'خامه‌ی تازه‌ی پرچرب',
    bg: { inner: '#8a5330', mid: '#3a1f0e', outer: '#120803' },
    accent: '#ffd9a0',
    ink: '#2a1408',
    scoops: ['#6b4023', '#8f5c34'],
    toppings: ['chocolate', 'pistachio'],
    topper: 'chocolate',
    decor: 'nuts',
  },
  {
    id: 'saffron',
    fa: 'زعفران و زرشک',
    en: 'Saffron Barberry',
    giant: 'SAFFRON',
    price: '۱۲۵ هزار تومان',
    priceValue: 125000,
    kcal: 195,
    note: 'زعفران قائنات + زرشک‌ی تازه‌ی بیرجند',
    base: 'شیر تازه‌ی گاوداری محلی',
    bg: { inner: '#e8a33d', mid: '#8a4a12', outer: '#241002' },
    accent: '#fff0c2',
    ink: '#2e1804',
    scoops: ['#f2c14e', '#ffe9a8'],
    toppings: ['pistachio', 'cherry'],
    topper: 'pistachio',
    decor: 'nuts',
    tag: 'ایرانی اصیل',
  },
  {
    id: 'sourcherry',
    fa: 'آلبالو',
    en: 'Sour Cherry',
    giant: 'SOUR CHERRY',
    price: '۹۲ هزار تومان',
    priceValue: 92000,
    kcal: 150,
    note: 'آلبالوی تازه‌ی اردبیل با ترشی ملایم و خنک',
    base: 'شیر تازه‌ی گاوداری محلی',
    bg: { inner: '#b0203f', mid: '#4d0a20', outer: '#160309' },
    accent: '#ffe0e6',
    ink: '#2b0410',
    scoops: ['#a5132f', '#d94f66'],
    toppings: ['cherry', 'strawberry'],
    topper: 'cherry',
    decor: 'sprinkles',
  },
  {
    id: 'coconut',
    fa: 'نارگیل',
    en: 'Toasted Coconut',
    giant: 'COCONUT',
    price: '۱۰۵ هزار تومان',
    priceValue: 105000,
    kcal: 205,
    note: 'پودر نارگیل برشته + تکه‌های شکلات شیری',
    base: 'شیر نارگیل و خامه‌ی تازه',
    bg: { inner: '#9c9184', mid: '#463f37', outer: '#14120f' },
    accent: '#ffe9c9',
    ink: '#231f1a',
    scoops: ['#fdf6ec', '#ffffff'],
    toppings: ['chocolate', 'strawberry'],
    topper: 'chocolate',
    decor: 'sprinkles',
  },
  {
    id: 'kiwi',
    fa: 'کیوی',
    en: 'Green Kiwi',
    giant: 'KIWI',
    price: '۹۹ هزار تومان',
    priceValue: 99000,
    kcal: 140,
    note: 'کیوی شمال با ترشی خنک و دانه‌های چیا',
    base: 'ماست یونانی و شیر تازه',
    bg: { inner: '#7fbf3f', mid: '#2f5c14', outer: '#0d1c05' },
    accent: '#eaffc4',
    ink: '#11260a',
    scoops: ['#9ed36a', '#d7f0a8'],
    toppings: ['kiwi', 'mint'],
    topper: 'kiwi',
    decor: 'sprinkles',
  },
  {
    id: 'date',
    fa: 'خرما و گردو',
    en: 'Date & Walnut',
    giant: 'DATE',
    price: '۱۱۵ هزار تومان',
    priceValue: 115000,
    kcal: 230,
    note: 'خرمای ممتاز بم + گردوی تازه‌ی تویسرکان',
    base: 'شیر تازه‌ی گاوداری محلی',
    bg: { inner: '#8a5a2b', mid: '#42280f', outer: '#150c04' },
    accent: '#ffd9a8',
    ink: '#1f1206',
    scoops: ['#5b3a1e', '#7d5433'],
    toppings: ['date', 'chocolate'],
    topper: 'date',
    decor: 'nuts',
  },
];

export const TOPPING_LABELS: Record<ToppingKind, { fa: string; en: string; desc: string }> = {
  cherry: { fa: 'گیلاس', en: 'Cherry', desc: 'چیده‌شده از باغ‌های تاکستان' },
  strawberry: { fa: 'توت‌فرنگی', en: 'Strawberry', desc: 'کردستان، برداشت صبحگاهی' },
  blueberry: { fa: 'بلوبری', en: 'Blueberry', desc: 'بلوبری وحشی یخ‌زده‌ی تازه' },
  chocolate: { fa: 'شکلات', en: 'Chocolate', desc: 'کاکائو ۷۰٪ بدون روغن پالم' },
  pistachio: { fa: 'پسته', en: 'Pistachio', desc: 'اکبری رفسنجان، دست‌چین' },
  mint: { fa: 'نعناع تازه', en: 'Fresh Mint', desc: 'از گلخانه‌ی کارگاه خودمان' },
  kiwi: { fa: 'کیوی', en: 'Kiwi', desc: 'شمال کشور، رسیده‌ی کامل' },
  date: { fa: 'خرما', en: 'Date', desc: 'خرمای ممتاز بم، بدون شکر افزوده' },
};
