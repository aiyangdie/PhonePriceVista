import { Phone, PhoneGroup } from '../types';

export function parsePhoneData(data: string): PhoneGroup[] {
  // 按行分割数据
  const lines = data.split('\n').filter(line => line.trim());
  
  // 跳过前两行（日期和标题）
  const dataLines = lines.slice(2);
  
  const phoneGroups: PhoneGroup[] = [];
  let currentBrand = '';
  
  dataLines.forEach(line => {
    // 跳过空行
    if (!line.trim()) return;
    
    // 检查是否是品牌标题行
    if (line.includes('系列') || line.includes('手机系烈')) {
      currentBrand = line.trim();
      return;
    }
    
    // 解析手机数据
    const match = line.match(/([A-Za-z0-9\s\+]+)\s+(\d+)\+(\d+)\s*(?:5g|4g)?\s*([^\d]+)\s*(\d+)(?:¥|￥)?\s*(现货|怕抓|没货|原封|نەخ مال)?/i);
    
    if (match) {
      const [_, model, ram, storage, color, price, status] = match;
      
      // 清理数据
      const cleanModel = model.trim();
      const cleanColor = color.trim();
      const cleanPrice = parseInt(price);
      const cleanStatus = status?.trim() || '正常';
      
      // 确定品牌
      let brand = currentBrand;
      if (!brand) {
        if (cleanModel.toLowerCase().includes('reno') || cleanModel.toLowerCase().includes('find')) {
          brand = 'OPPO';
        } else if (cleanModel.toLowerCase().includes('a3') || cleanModel.toLowerCase().includes('a5')) {
          brand = 'OPPO';
        } else if (cleanModel.toLowerCase().includes('ace')) {
          brand = '一加';
        } else if (cleanModel.toLowerCase().includes('realme') || cleanModel.toLowerCase().includes('真我')) {
          brand = 'realme';
        } else if (cleanModel.toLowerCase().includes('x') || cleanModel.toLowerCase().includes('y') || cleanModel.toLowerCase().includes('iqoo')) {
          brand = 'vivo';
        } else if (cleanModel.toLowerCase().includes('红米') || cleanModel.toLowerCase().includes('note')) {
          brand = '红米';
        } else if (cleanModel.toLowerCase().includes('荣耀')) {
          brand = '荣耀';
        } else if (cleanModel.toLowerCase().includes('16')) {
          brand = 'iPhone';
        }
      }
      
      // 查找或创建品牌组
      let group = phoneGroups.find(g => g.brand === brand);
      if (!group) {
        group = { brand, phones: [] };
        phoneGroups.push(group);
      }
      
      // 添加手机数据
      group.phones.push({
        brand,
        model: cleanModel,
        ram: parseInt(ram),
        storage: parseInt(storage),
        color: cleanColor,
        price: cleanPrice,
        networkType: line.toLowerCase().includes('5g') ? '5G' : '4G',
        availability: cleanStatus
      });
    }
  });
  
  // 按品牌名称排序
  phoneGroups.sort((a, b) => a.brand.localeCompare(b.brand));
  
  // 对每个品牌内的手机按价格排序
  phoneGroups.forEach(group => {
    group.phones.sort((a, b) => a.price - b.price);
  });
  
  return phoneGroups;
} 