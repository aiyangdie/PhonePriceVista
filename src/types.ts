export interface Phone {
  brand: string;
  model: string;
  ram: number;
  storage: number;
  color: string;
  price: number;
  availability: string;
  networkType?: string;
}

export interface PhoneGroup {
  brand: string;
  phones: Phone[];
} 