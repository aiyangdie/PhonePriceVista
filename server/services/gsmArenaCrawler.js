const axios = require('axios');
const cheerio = require('cheerio');

// 配置请求头，模拟浏览器
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
};

// 延迟函数，避免请求过快
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 带重试的请求函数
const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, { 
        headers, 
        timeout: 15000,
        ...options 
      });
      return response;
    } catch (error) {
      console.log(`Attempt ${i + 1} failed for ${url}: ${error.message}`);
      if (i === retries - 1) throw error;
      await delay(1000 * (i + 1)); // 递增延迟
    }
  }
};

// 品牌映射（中文品牌名到 GSMArena 品牌标识）
const BRAND_MAP = {
  'OPPO': 'oppo-phones-82',
  'vivo': 'vivo-phones-98',
  '小米': 'xiaomi-phones-80',
  '红米': 'xiaomi-phones-80',
  '华为': 'huawei-phones-58',
  '荣耀': 'honor-phones-121',
  'iPhone': 'apple-phones-48',
  '苹果': 'apple-phones-48',
  '一加': 'oneplus-phones-95',
  'realme': 'realme-phones-118',
  'iQOO': 'vivo-phones-98',
  '三星': 'samsung-phones-9',
  'Samsung': 'samsung-phones-9',
};

// 从 GSMArena 获取品牌的手机列表
async function fetchBrandPhones(brandSlug, limit = 20) {
  try {
    const url = `https://www.gsmarena.com/${brandSlug}.php`;
    console.log(`Fetching: ${url}`);
    
    const response = await fetchWithRetry(url);
    const $ = cheerio.load(response.data);
    
    const phones = [];
    $('.makers ul li').slice(0, limit).each((i, el) => {
      const $el = $(el);
      const link = $el.find('a').attr('href');
      const name = $el.find('span').text().trim();
      const img = $el.find('img').attr('src');
      
      if (link && name) {
        phones.push({
          name,
          link: `https://www.gsmarena.com/${link}`,
          thumbnail: img,
        });
      }
    });
    
    return phones;
  } catch (error) {
    console.error(`Error fetching brand phones:`, error.message);
    return [];
  }
}

// 从 GSMArena 获取单个手机的详细信息
async function fetchPhoneDetails(phoneUrl) {
  try {
    console.log(`Fetching details: ${phoneUrl}`);
    
    const response = await fetchWithRetry(phoneUrl);
    const $ = cheerio.load(response.data);
    
    // 获取主图
    const mainImage = $('.specs-photo-main img').attr('src') || 
                      $('.specs-photo-main a').attr('href') ||
                      '';
    
    // 获取手机名称
    const name = $('h1.specs-phone-name-title').text().trim();
    
    // 解析规格表
    const specs = {};
    
    // 遍历所有规格表
    $('table').each((i, table) => {
      $(table).find('tr').each((j, tr) => {
        const $tr = $(tr);
        const header = $tr.find('th').text().trim();
        const key = $tr.find('td.ttl').text().trim();
        const value = $tr.find('td.nfo').text().trim();
        
        if (key && value) {
          specs[key] = value;
        }
      });
    });
    
    // 提取关键规格
    const phoneData = {
      name,
      image: mainImage,
      specs: {
        // 发布日期
        releaseDate: specs['Announced'] || specs['Status'] || '',
        // 尺寸
        dimensions: specs['Dimensions'] || '',
        weight: specs['Weight'] || '',
        // 屏幕
        screenSize: specs['Size'] || '',
        screenType: specs['Type'] || '',
        resolution: specs['Resolution'] || '',
        // 处理器
        cpu: specs['CPU'] || specs['Chipset'] || '',
        chipset: specs['Chipset'] || '',
        gpu: specs['GPU'] || '',
        // 内存
        memory: specs['Internal'] || '',
        // 电池
        battery: specs['Type'] ? (specs['Type'].match(/(\d+)\s*mAh/) ? specs['Type'] : '') : '',
        charging: specs['Charging'] || '',
        // 摄像头
        mainCamera: specs['Single'] || specs['Dual'] || specs['Triple'] || specs['Quad'] || '',
        selfieCamera: specs['Single '] || '', // 注意空格
        // 操作系统
        os: specs['OS'] || '',
        // 网络
        network: specs['Technology'] || '',
        // 价格
        price: specs['Price'] || '',
      },
      rawSpecs: specs,
    };
    
    return phoneData;
  } catch (error) {
    console.error(`Error fetching phone details:`, error.message);
    return null;
  }
}

// 搜索手机
async function searchPhones(query) {
  try {
    const searchUrl = `https://www.gsmarena.com/results.php3?sQuickSearch=yes&sName=${encodeURIComponent(query)}`;
    console.log(`Searching: ${searchUrl}`);
    
    const response = await fetchWithRetry(searchUrl);
    const $ = cheerio.load(response.data);
    
    const results = [];
    $('.makers ul li').each((i, el) => {
      const $el = $(el);
      const link = $el.find('a').attr('href');
      const name = $el.find('span').text().trim();
      const img = $el.find('img').attr('src');
      
      if (link && name) {
        results.push({
          name,
          link: `https://www.gsmarena.com/${link}`,
          thumbnail: img,
        });
      }
    });
    
    return results;
  } catch (error) {
    console.error(`Error searching phones:`, error.message);
    return [];
  }
}

// 获取最新手机列表
async function fetchLatestPhones(limit = 30) {
  try {
    const url = 'https://www.gsmarena.com/';
    console.log(`Fetching latest phones from: ${url}`);
    
    const response = await fetchWithRetry(url);
    const $ = cheerio.load(response.data);
    
    const phones = [];
    
    // 首页通常会有最新手机
    $('.module-phones-link, .brandmenu-v2 a').slice(0, limit).each((i, el) => {
      const $el = $(el);
      const link = $el.attr('href');
      const name = $el.text().trim();
      const img = $el.find('img').attr('src');
      
      if (link && name && link.includes('.php') && !link.includes('makers')) {
        phones.push({
          name,
          link: link.startsWith('http') ? link : `https://www.gsmarena.com/${link}`,
          thumbnail: img,
        });
      }
    });
    
    return phones;
  } catch (error) {
    console.error(`Error fetching latest phones:`, error.message);
    return [];
  }
}

// 批量获取多个手机的详细信息
async function fetchMultiplePhoneDetails(phoneList, delayMs = 2000) {
  const results = [];
  
  for (const phone of phoneList) {
    try {
      const details = await fetchPhoneDetails(phone.link);
      if (details) {
        results.push({
          ...phone,
          ...details,
        });
      }
      // 延迟以避免被封
      await delay(delayMs);
    } catch (error) {
      console.error(`Error fetching ${phone.name}:`, error.message);
    }
  }
  
  return results;
}

// 获取热门手机
async function fetchTopPhones() {
  try {
    const url = 'https://www.gsmarena.com/top_10_by_interest-review-702.php';
    console.log(`Fetching top phones from: ${url}`);
    
    const response = await axios.get(url, { headers, timeout: 15000 });
    const $ = cheerio.load(response.data);
    
    const phones = [];
    $('.module-rankings .ranking-box, .article-body a').each((i, el) => {
      const $el = $(el);
      const link = $el.attr('href');
      const name = $el.find('span, strong').first().text().trim() || $el.text().trim();
      const img = $el.find('img').attr('src');
      
      if (link && name && link.includes('.php')) {
        phones.push({
          name,
          link: link.startsWith('http') ? link : `https://www.gsmarena.com/${link}`,
          thumbnail: img,
        });
      }
    });
    
    return phones.slice(0, 20);
  } catch (error) {
    console.error(`Error fetching top phones:`, error.message);
    return [];
  }
}

module.exports = {
  fetchBrandPhones,
  fetchPhoneDetails,
  searchPhones,
  fetchLatestPhones,
  fetchMultiplePhoneDetails,
  fetchTopPhones,
  BRAND_MAP,
  delay,
};
