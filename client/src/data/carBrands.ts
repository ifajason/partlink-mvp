/**
 * 台灣常見汽車品牌清單（覆蓋 95%+ 中古零件市場）
 * 排序方式：依台灣市場保有量大致排序，方便賣家快速選擇
 *
 * 資料維護：每年 Q1 review 一次，新增當年上市新品牌
 * 上次更新：2026-04-27
 */

export interface CarBrand {
  /** 中文顯示名稱（賣家常用） */
  zh: string;
  /** 英文/原文名稱（搜尋備援） */
  en: string;
  /** 別名（用於搜尋與識別） */
  aliases?: string[];
  /** 產地分類（前端可分組顯示） */
  origin: "JP" | "KR" | "US" | "DE" | "IT" | "FR" | "UK" | "SE" | "CZ" | "TW" | "CN" | "OTHER";
}

export const CAR_BRANDS: CarBrand[] = [
  // 日系（台灣市佔最大）
  { zh: "Toyota", en: "Toyota", aliases: ["豐田", "TOYOTA"], origin: "JP" },
  { zh: "Honda", en: "Honda", aliases: ["本田", "HONDA"], origin: "JP" },
  { zh: "Nissan", en: "Nissan", aliases: ["日產", "NISSAN", "尼桑"], origin: "JP" },
  { zh: "Mitsubishi", en: "Mitsubishi", aliases: ["三菱", "MITSUBISHI"], origin: "JP" },
  { zh: "Mazda", en: "Mazda", aliases: ["馬自達", "MAZDA", "萬事得"], origin: "JP" },
  { zh: "Suzuki", en: "Suzuki", aliases: ["鈴木", "SUZUKI"], origin: "JP" },
  { zh: "Subaru", en: "Subaru", aliases: ["速霸陸", "SUBARU", "斯巴魯"], origin: "JP" },
  { zh: "Lexus", en: "Lexus", aliases: ["凌志", "LEXUS"], origin: "JP" },
  { zh: "Infiniti", en: "Infiniti", aliases: ["極致", "INFINITI"], origin: "JP" },
  { zh: "Acura", en: "Acura", aliases: ["謳歌", "ACURA"], origin: "JP" },
  { zh: "Daihatsu", en: "Daihatsu", aliases: ["大發", "DAIHATSU"], origin: "JP" },
  { zh: "Isuzu", en: "Isuzu", aliases: ["五十鈴", "ISUZU"], origin: "JP" },
  { zh: "Hino", en: "Hino", aliases: ["日野", "HINO"], origin: "JP" },

  // 韓系
  { zh: "Hyundai", en: "Hyundai", aliases: ["現代", "HYUNDAI"], origin: "KR" },
  { zh: "Kia", en: "Kia", aliases: ["起亞", "KIA"], origin: "KR" },

  // 美系
  { zh: "Ford", en: "Ford", aliases: ["福特", "FORD"], origin: "US" },
  { zh: "Chevrolet", en: "Chevrolet", aliases: ["雪佛蘭", "CHEVROLET", "CHEVY"], origin: "US" },
  { zh: "Chrysler", en: "Chrysler", aliases: ["克萊斯勒", "CHRYSLER"], origin: "US" },
  { zh: "Jeep", en: "Jeep", aliases: ["吉普", "JEEP"], origin: "US" },
  { zh: "Tesla", en: "Tesla", aliases: ["特斯拉", "TESLA"], origin: "US" },
  { zh: "Cadillac", en: "Cadillac", aliases: ["凱迪拉克", "CADILLAC"], origin: "US" },
  { zh: "GMC", en: "GMC", aliases: ["GMC"], origin: "US" },
  { zh: "Buick", en: "Buick", aliases: ["別克", "BUICK"], origin: "US" },
  { zh: "Dodge", en: "Dodge", aliases: ["道奇", "DODGE"], origin: "US" },
  { zh: "Lincoln", en: "Lincoln", aliases: ["林肯", "LINCOLN"], origin: "US" },

  // 德系
  { zh: "BMW", en: "BMW", aliases: ["寶馬", "BMW", "巴伐利亞"], origin: "DE" },
  { zh: "Mercedes-Benz", en: "Mercedes-Benz", aliases: ["賓士", "賓士", "BENZ", "MERCEDES", "M-BENZ"], origin: "DE" },
  { zh: "Audi", en: "Audi", aliases: ["奧迪", "AUDI"], origin: "DE" },
  { zh: "Volkswagen", en: "Volkswagen", aliases: ["福斯", "VOLKSWAGEN", "VW", "大眾"], origin: "DE" },
  { zh: "Porsche", en: "Porsche", aliases: ["保時捷", "PORSCHE"], origin: "DE" },
  { zh: "Mini", en: "Mini", aliases: ["MINI"], origin: "DE" },
  { zh: "Smart", en: "Smart", aliases: ["SMART"], origin: "DE" },
  { zh: "Opel", en: "Opel", aliases: ["歐寶", "OPEL"], origin: "DE" },

  // 義系
  { zh: "Fiat", en: "Fiat", aliases: ["飛雅特", "FIAT"], origin: "IT" },
  { zh: "Alfa Romeo", en: "Alfa Romeo", aliases: ["愛快羅密歐", "ALFA"], origin: "IT" },
  { zh: "Maserati", en: "Maserati", aliases: ["瑪莎拉蒂", "MASERATI"], origin: "IT" },
  { zh: "Ferrari", en: "Ferrari", aliases: ["法拉利", "FERRARI"], origin: "IT" },
  { zh: "Lamborghini", en: "Lamborghini", aliases: ["藍寶堅尼", "LAMBORGHINI"], origin: "IT" },

  // 法系
  { zh: "Peugeot", en: "Peugeot", aliases: ["寶獅", "PEUGEOT", "標緻"], origin: "FR" },
  { zh: "Citroen", en: "Citroën", aliases: ["雪鐵龍", "CITROEN"], origin: "FR" },
  { zh: "Renault", en: "Renault", aliases: ["雷諾", "RENAULT"], origin: "FR" },
  { zh: "DS", en: "DS Automobiles", aliases: ["DS"], origin: "FR" },

  // 英系
  { zh: "Land Rover", en: "Land Rover", aliases: ["路華", "LAND ROVER", "LANDROVER"], origin: "UK" },
  { zh: "Jaguar", en: "Jaguar", aliases: ["捷豹", "JAGUAR"], origin: "UK" },
  { zh: "Bentley", en: "Bentley", aliases: ["賓利", "BENTLEY"], origin: "UK" },
  { zh: "Rolls-Royce", en: "Rolls-Royce", aliases: ["勞斯萊斯", "ROLLS-ROYCE"], origin: "UK" },
  { zh: "Aston Martin", en: "Aston Martin", aliases: ["奧斯頓馬丁", "ASTON"], origin: "UK" },
  { zh: "MG", en: "MG", aliases: ["名爵", "MG"], origin: "UK" },
  { zh: "Lotus", en: "Lotus", aliases: ["蓮花", "LOTUS"], origin: "UK" },
  { zh: "McLaren", en: "McLaren", aliases: ["邁凱倫", "MCLAREN"], origin: "UK" },

  // 北歐
  { zh: "Volvo", en: "Volvo", aliases: ["富豪", "VOLVO", "沃爾沃"], origin: "SE" },
  { zh: "Saab", en: "Saab", aliases: ["紳寶", "SAAB"], origin: "SE" },

  // 捷克
  { zh: "Skoda", en: "Škoda", aliases: ["斯柯達", "SKODA"], origin: "CZ" },

  // 台灣
  { zh: "Luxgen", en: "Luxgen", aliases: ["納智捷", "LUXGEN"], origin: "TW" },
  { zh: "中華汽車", en: "CMC", aliases: ["中華", "CMC", "三菱中華"], origin: "TW" },
  { zh: "裕隆", en: "Yulon", aliases: ["裕隆", "YULON"], origin: "TW" },

  // 中國
  { zh: "BYD", en: "BYD", aliases: ["比亞迪", "BYD"], origin: "CN" },

  // 其他
  { zh: "SEAT", en: "SEAT", aliases: ["西雅特", "SEAT"], origin: "OTHER" },
  { zh: "其他", en: "Other", aliases: ["其他品牌"], origin: "OTHER" },
];

/**
 * 模糊搜尋品牌（用於賣家快速上架的 autocomplete）
 * @example searchBrands("豐田") → [Toyota]
 * @example searchBrands("BMW") → [BMW]
 */
export function searchBrands(query: string): CarBrand[] {
  if (!query.trim()) return CAR_BRANDS;
  const q = query.trim().toUpperCase();
  return CAR_BRANDS.filter(brand => {
    if (brand.zh.toUpperCase().includes(q)) return true;
    if (brand.en.toUpperCase().includes(q)) return true;
    if (brand.aliases?.some(alias => alias.toUpperCase().includes(q))) return true;
    return false;
  });
}

/**
 * 由顯示名稱反查標準品牌名（normalize 用）
 */
export function normalizeBrandName(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const found = CAR_BRANDS.find(brand => {
    if (brand.zh === trimmed || brand.en === trimmed) return true;
    if (brand.aliases?.includes(trimmed)) return true;
    if (brand.aliases?.some(a => a.toUpperCase() === trimmed.toUpperCase())) return true;
    return false;
  });
  return found?.zh || null;
}
