const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const API_TIMEOUT = 15000; // 15秒超时

// 带超时的fetch封装
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = API_TIMEOUT): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

// 图片代理URL - 解决防盗链问题
export function getProxyImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;
  return `${API_BASE}/image-proxy?url=${encodeURIComponent(imageUrl)}`;
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
  networkType: string;
  network_type?: string;
  availability: string;
}

export interface Brand {
  id: number;
  name: string;
}

export interface PhoneGroup {
  brand: string;
  phones: Phone[];
}

// 获取分组的手机数据
export async function fetchPhoneGroups(): Promise<PhoneGroup[]> {
  const response = await fetchWithTimeout(`${API_BASE}/phones/grouped`);
  if (!response.ok) throw new Error('Failed to fetch phones');
  return response.json();
}

// 获取所有品牌
export async function fetchBrands(): Promise<Brand[]> {
  const response = await fetchWithTimeout(`${API_BASE}/phones/brands`);
  if (!response.ok) throw new Error('Failed to fetch brands');
  return response.json();
}

// 添加手机
export async function addPhone(phone: Omit<Phone, 'id' | 'brand'>): Promise<{ id: number }> {
  const response = await fetch(`${API_BASE}/phones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand_id: phone.brand_id,
      model: phone.model,
      ram: phone.ram,
      storage: phone.storage,
      color: phone.color,
      price: phone.price,
      network_type: phone.networkType || phone.network_type,
      availability: phone.availability
    })
  });
  if (!response.ok) throw new Error('Failed to add phone');
  return response.json();
}

// 更新手机
export async function updatePhone(id: number, phone: Partial<Phone>): Promise<void> {
  const response = await fetch(`${API_BASE}/phones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand_id: phone.brand_id,
      model: phone.model,
      ram: phone.ram,
      storage: phone.storage,
      color: phone.color,
      price: phone.price,
      network_type: phone.networkType || phone.network_type,
      availability: phone.availability
    })
  });
  if (!response.ok) throw new Error('Failed to update phone');
}

// 删除手机
export async function deletePhone(id: number): Promise<void> {
  const response = await fetchWithTimeout(`${API_BASE}/phones/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete phone');
}

// 添加品牌
export async function addBrand(name: string): Promise<{ id: number }> {
  const response = await fetch(`${API_BASE}/phones/brands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!response.ok) throw new Error('Failed to add brand');
  return response.json();
}

// 检查后端是否可用
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/health`, {}, 5000); // 5秒超时
    return response.ok;
  } catch {
    return false;
  }
}

// ==================== 爬虫相关 API ====================

// 搜索手机（从 GSMArena）
export async function searchPhonesOnline(query: string): Promise<any[]> {
  const response = await fetchWithTimeout(`${API_BASE}/crawler/search?q=${encodeURIComponent(query)}`, {}, 30000);
  if (!response.ok) throw new Error('搜索失败');
  const result = await response.json();
  return result.data || [];
}

// 获取手机详情
export async function fetchPhoneDetails(url: string): Promise<any> {
  const response = await fetchWithTimeout(`${API_BASE}/crawler/details?url=${encodeURIComponent(url)}`, {}, 30000);
  if (!response.ok) throw new Error('获取详情失败');
  const result = await response.json();
  return result.data;
}

// 获取品牌手机列表
export async function fetchBrandPhonesOnline(brand: string, limit: number = 20): Promise<any[]> {
  const response = await fetchWithTimeout(`${API_BASE}/crawler/brand/${encodeURIComponent(brand)}?limit=${limit}`, {}, 30000);
  if (!response.ok) throw new Error('获取品牌手机失败');
  const result = await response.json();
  return result.data || [];
}

// 爬取并导入手机数据
export async function crawlAndImport(brand?: string, limit: number = 10): Promise<any> {
  const response = await fetchWithTimeout(`${API_BASE}/crawler/crawl-and-import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brand, limit, fetchDetails: true })
  }, 60000); // 60秒超时，爬取操作耗时较长
  if (!response.ok) throw new Error('爬取导入失败');
  return response.json();
}

// 获取带图片和参数的分组手机数据
export async function fetchPhoneGroupsWithSpecs(): Promise<PhoneGroup[]> {
  const response = await fetchWithTimeout(`${API_BASE}/crawler/phones-grouped-with-specs`);
  if (!response.ok) throw new Error('Failed to fetch phones');
  return response.json();
}
