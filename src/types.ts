export interface PhoneSpecs {
  screenSize?: string;
  battery?: string;
  cpu?: string;
  camera?: string;
  weight?: string;
  dimensions?: string;
  os?: string;
}

export interface Phone {
  id?: number;
  brand: string;
  brand_id?: number;
  model: string;
  ram: number;
  storage: number;
  color: string;
  price: number;
  availability: string;
  networkType: string;
  network_type?: string;
  // 新增图片和参数字段
  image?: string;
  officialPrice?: number;
  specs?: PhoneSpecs;
}

export interface PhoneGroup {
  brand: string;
  phones: Phone[];
}

export interface CrawlResult {
  name: string;
  link: string;
  thumbnail?: string;
  image?: string;
  specs?: PhoneSpecs;
}