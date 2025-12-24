const axios = require('axios');
const cheerio = require('cheerio');
const pool = require('../config/db');

// 手机数据源配置
const PHONE_DATA_SOURCES = {
  // 使用 GSMArena 风格的数据（模拟数据，实际可替换为真实API）
  gsmarena: 'https://www.gsmarena.com',
  // 中关村在线
  zol: 'https://detail.zol.com.cn',
};

// 常见手机品牌和型号的官方数据（预置数据库）- 扩展版
const PHONE_DATABASE = {
  'OPPO': {
    'Reno13': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno13.jpg',
      official_price: 2699,
      screen_size: '6.59英寸',
      battery: '5600mAh',
      cpu: '天玑8350',
      camera: '5000万像素主摄',
      weight: '181g',
      dimensions: '157.9×74.7×7.24mm',
      os: 'ColorOS 15',
      release_date: '2024-11'
    },
    'Reno12': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno12.jpg',
      official_price: 2499,
      screen_size: '6.7英寸',
      battery: '5000mAh',
      cpu: '天玑8250',
      camera: '5000万像素',
      weight: '177g',
      dimensions: '161.4×74.1×7.6mm',
      os: 'ColorOS 14',
      release_date: '2024-05'
    },
    'FindX8': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-find-x8.jpg',
      official_price: 4299,
      screen_size: '6.59英寸',
      battery: '5630mAh',
      cpu: '天玑9400',
      camera: '5000万像素三摄',
      weight: '193g',
      dimensions: '157.4×74.4×7.85mm',
      os: 'ColorOS 15',
      release_date: '2024-10'
    },
    'Find X8': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-find-x8.jpg',
      official_price: 4299,
      screen_size: '6.59英寸',
      battery: '5630mAh',
      cpu: '天玑9400',
      camera: '5000万像素三摄',
      weight: '193g',
      dimensions: '157.4×74.4×7.85mm',
      os: 'ColorOS 15',
      release_date: '2024-10'
    },
    'A3Pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a3-pro.jpg',
      official_price: 1499,
      screen_size: '6.67英寸',
      battery: '5100mAh',
      cpu: '天玑6300',
      camera: '5000万像素',
      weight: '186g',
      dimensions: '162.73×75.51×7.68mm',
      os: 'ColorOS 14',
      release_date: '2024-04'
    },
    'A3 Pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a3-pro.jpg',
      official_price: 1499,
      screen_size: '6.67英寸',
      battery: '5100mAh',
      cpu: '天玑6300',
      camera: '5000万像素',
      weight: '186g',
      dimensions: '162.73×75.51×7.68mm',
      os: 'ColorOS 14',
      release_date: '2024-04'
    },
    'K12': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-k12.jpg',
      official_price: 1999,
      screen_size: '6.7英寸',
      battery: '5500mAh',
      cpu: '骁龙7 Gen3',
      camera: '5000万像素',
      weight: '186g',
      dimensions: '162.6×75.8×8.2mm',
      os: 'ColorOS 14',
      release_date: '2024-04'
    },
    'A3x': {
      image: 'https://image.oppo.com/content/dam/oppo/common/mkt/v2-2/a3x/navigation/a3x-black.png',
      official_price: 799,
      screen_size: '6.67英寸',
      battery: '5100mAh',
      cpu: '联发科G35',
      camera: '800万像素',
      weight: '188g',
      dimensions: '165.7×76×7.68mm',
      os: 'ColorOS 14',
      release_date: '2024-08'
    },
    'A3i': {
      image: 'https://image.oppo.com/content/dam/oppo/common/mkt/v2-2/a3i/navigation/a3i-green-v2.png',
      official_price: 999,
      screen_size: '6.67英寸',
      battery: '5100mAh',
      cpu: '天玑6300',
      camera: '5000万像素',
      weight: '186g',
      dimensions: '165.7×76×7.68mm',
      os: 'ColorOS 14',
      release_date: '2024-06'
    },
    'A5Pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a5-pro.jpg',
      official_price: 1999,
      screen_size: '6.7英寸',
      battery: '5800mAh',
      cpu: '骁龙695',
      camera: '5000万像素',
      weight: '187g',
      dimensions: '162.7×75.8×7.99mm',
      os: 'ColorOS 14',
      release_date: '2024-11'
    },
    'A5 Pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a5-pro.jpg',
      official_price: 1999,
      screen_size: '6.7英寸',
      battery: '5800mAh',
      cpu: '骁龙695',
      camera: '5000万像素',
      weight: '187g',
      dimensions: '162.7×75.8×7.99mm',
      os: 'ColorOS 14',
      release_date: '2024-11'
    },
    'A2Pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a2-pro.jpg',
      official_price: 1499,
      screen_size: '6.7英寸',
      battery: '5000mAh',
      cpu: '天玑7050',
      camera: '6400万像素',
      weight: '186g',
      dimensions: '162.6×75.1×7.96mm',
      os: 'ColorOS 13.1',
      release_date: '2023-12'
    },
    'A1Pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a1-pro.jpg',
      official_price: 1199,
      screen_size: '6.7英寸',
      battery: '4800mAh',
      cpu: '骁龙695',
      camera: '1亿像素',
      weight: '171g',
      dimensions: '160.2×73.3×7.7mm',
      os: 'ColorOS 13',
      release_date: '2022-11'
    },
    'A3': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a3.jpg',
      official_price: 1099,
      screen_size: '6.67英寸',
      battery: '5100mAh',
      cpu: '骁龙695',
      camera: '5000万像素',
      weight: '186g',
      dimensions: '165.7×76×7.68mm',
      os: 'ColorOS 14',
      release_date: '2024-04'
    },
    'K12X': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-k12x.jpg',
      official_price: 1299,
      screen_size: '6.67英寸',
      battery: '5500mAh',
      cpu: '骁龙695',
      camera: '5000万像素',
      weight: '190g',
      dimensions: '165.6×76.1×8.1mm',
      os: 'ColorOS 14',
      release_date: '2024-06'
    },
    'k12X': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-k12x.jpg',
      official_price: 1299,
      screen_size: '6.67英寸',
      battery: '5500mAh',
      cpu: '骁龙695',
      camera: '5000万像素',
      weight: '190g',
      dimensions: '165.6×76.1×8.1mm',
      os: 'ColorOS 14',
      release_date: '2024-06'
    },
    'k12x': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-k12x.jpg',
      official_price: 1299,
      screen_size: '6.67英寸',
      battery: '5500mAh',
      cpu: '骁龙695',
      camera: '5000万像素',
      weight: '190g',
      dimensions: '165.6×76.1×8.1mm',
      os: 'ColorOS 14',
      release_date: '2024-06'
    },
    'A36': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a36.jpg',
      official_price: 699,
      screen_size: '6.56英寸',
      battery: '5000mAh',
      cpu: '骁龙680',
      camera: '1300万像素',
      weight: '189g',
      dimensions: '163.8×75.1×8.15mm',
      os: 'ColorOS 12',
      release_date: '2022-01'
    },
    'A96': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a96.jpg',
      official_price: 1499,
      screen_size: '6.59英寸',
      battery: '5000mAh',
      cpu: '骁龙680',
      camera: '5000万像素',
      weight: '191g',
      dimensions: '160.6×73.8×8.4mm',
      os: 'ColorOS 12',
      release_date: '2022-03'
    },
    'Reno11': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno11.jpg',
      official_price: 2299,
      screen_size: '6.7英寸',
      battery: '5000mAh',
      cpu: '天玑8200',
      camera: '5000万像素',
      weight: '184g',
      dimensions: '161.4×74.1×7.59mm',
      os: 'ColorOS 14',
      release_date: '2023-11'
    },
    'A5活力': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a5-pro.jpg',
      official_price: 1199,
      screen_size: '6.67英寸',
      battery: '5000mAh',
      cpu: '天玑6300',
      camera: '5000万像素',
      weight: '186g',
      dimensions: '165.7×76×7.68mm',
      os: 'ColorOS 14',
      release_date: '2024-08'
    }
  },
  '一加': {
    'Ace3': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oneplus-ace-3.jpg',
      official_price: 2599,
      screen_size: '6.78英寸',
      battery: '5500mAh',
      cpu: '骁龙8 Gen2',
      camera: '5000万像素',
      weight: '207g',
      dimensions: '163.3×75.8×8.9mm',
      os: 'ColorOS 14',
      release_date: '2024-01'
    },
    '一加Ace3': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oneplus-ace-3.jpg',
      official_price: 2599,
      screen_size: '6.78英寸',
      battery: '5500mAh',
      cpu: '骁龙8 Gen2',
      camera: '5000万像素',
      weight: '207g',
      dimensions: '163.3×75.8×8.9mm',
      os: 'ColorOS 14',
      release_date: '2024-01'
    },
    'Ace5': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oneplus-ace-5.jpg',
      official_price: 2299,
      screen_size: '6.78英寸',
      battery: '6100mAh',
      cpu: '骁龙8 Gen3',
      camera: '5000万像素',
      weight: '197g',
      dimensions: '163.6×75.1×8.1mm',
      os: 'ColorOS 15',
      release_date: '2024-12'
    },
    '一加Ace5': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oneplus-ace-5.jpg',
      official_price: 2299,
      screen_size: '6.78英寸',
      battery: '6100mAh',
      cpu: '骁龙8 Gen3',
      camera: '5000万像素',
      weight: '197g',
      dimensions: '163.6×75.1×8.1mm',
      os: 'ColorOS 15',
      release_date: '2024-12'
    },
    '13': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/oneplus-13.jpg',
      official_price: 4299,
      screen_size: '6.82英寸',
      battery: '6000mAh',
      cpu: '骁龙8至尊版',
      camera: '5000万像素三摄',
      weight: '213g',
      dimensions: '162.9×76.5×8.5mm',
      os: 'OxygenOS 15',
      release_date: '2024-10'
    }
  },
  'realme': {
    'Neo7': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/realme-neo7.jpg',
      official_price: 2099,
      screen_size: '6.78英寸',
      battery: '7000mAh',
      cpu: '天玑9300+',
      camera: '5000万像素',
      weight: '213g',
      dimensions: '163.6×76.1×8.9mm',
      os: 'realme UI 6.0',
      release_date: '2024-12'
    },
    'realme Neo7': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/realme-neo7.jpg',
      official_price: 2099,
      screen_size: '6.78英寸',
      battery: '7000mAh',
      cpu: '天玑9300+',
      camera: '5000万像素',
      weight: '213g',
      dimensions: '163.6×76.1×8.9mm',
      os: 'realme UI 6.0',
      release_date: '2024-12'
    },
    '14Pro+': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/realme-14-pro-plus.jpg',
      official_price: 2299,
      screen_size: '6.83英寸',
      battery: '6000mAh',
      cpu: '骁龙7s Gen3',
      camera: '5000万像素潜望长焦',
      weight: '193g',
      dimensions: '161.5×75.1×8.2mm',
      os: 'realme UI 6.0',
      release_date: '2024-12'
    },
    'realme 14Pro+': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/realme-14-pro-plus.jpg',
      official_price: 2299,
      screen_size: '6.83英寸',
      battery: '6000mAh',
      cpu: '骁龙7s Gen3',
      camera: '5000万像素潜望长焦',
      weight: '193g',
      dimensions: '161.5×75.1×8.2mm',
      os: 'realme UI 6.0',
      release_date: '2024-12'
    },
    'realme 14Pro +': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/realme-14-pro-plus.jpg',
      official_price: 2299,
      screen_size: '6.83英寸',
      battery: '6000mAh',
      cpu: '骁龙7s Gen3',
      camera: '5000万像素潜望长焦',
      weight: '193g',
      dimensions: '161.5×75.1×8.2mm',
      os: 'realme UI 6.0',
      release_date: '2024-12'
    },
    'V60Pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/realme-v60-pro.jpg',
      official_price: 1299,
      screen_size: '6.72英寸',
      battery: '6000mAh',
      cpu: '天玑6300',
      camera: '5000万像素',
      weight: '192g',
      dimensions: '165.6×76×8.1mm',
      os: 'realme UI 5.0',
      release_date: '2024-08'
    },
    'V60Pro12': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/realme-v60-pro.jpg',
      official_price: 1299,
      screen_size: '6.72英寸',
      battery: '6000mAh',
      cpu: '天玑6300',
      camera: '5000万像素',
      weight: '192g',
      dimensions: '165.6×76×8.1mm',
      os: 'realme UI 5.0',
      release_date: '2024-08'
    },
    '真我v60': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/realme-v60.jpg',
      official_price: 799,
      screen_size: '6.72英寸',
      battery: '5000mAh',
      cpu: '虎贲T760',
      camera: '1300万像素',
      weight: '189g',
      dimensions: '165.6×76×8.1mm',
      os: 'realme UI 5.0',
      release_date: '2024-05'
    },
    '真我 v70': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/realme-v70.jpg',
      official_price: 899,
      screen_size: '6.72英寸',
      battery: '5000mAh',
      cpu: '天玑6100+',
      camera: '5000万像素',
      weight: '189g',
      dimensions: '165.6×76×8.1mm',
      os: 'realme UI 5.0',
      release_date: '2024-09'
    },
    'realme 12X': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/realme-12x.jpg',
      official_price: 1199,
      screen_size: '6.67英寸',
      battery: '5000mAh',
      cpu: '天玑6100+',
      camera: '5000万像素',
      weight: '186g',
      dimensions: '165×76×7.69mm',
      os: 'realme UI 5.0',
      release_date: '2024-04'
    },
    'realme11': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/realme-11.jpg',
      official_price: 1299,
      screen_size: '6.43英寸',
      battery: '5000mAh',
      cpu: '天玑6100',
      camera: '1.08亿像素',
      weight: '178g',
      dimensions: '159.9×73.3×7.95mm',
      os: 'realme UI 4.0',
      release_date: '2023-06'
    },
    'realme12Pro+ 12': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/realme-12-pro-plus.jpg',
      official_price: 2199,
      screen_size: '6.7英寸',
      battery: '5000mAh',
      cpu: '骁龙7s Gen2',
      camera: '6400万像素潜望',
      weight: '190g',
      dimensions: '161.46×73.92×8.55mm',
      os: 'realme UI 5.0',
      release_date: '2024-01'
    },
    'realme12Pro 至尊版': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/realme-12-pro-plus.jpg',
      official_price: 1899,
      screen_size: '6.7英寸',
      battery: '5000mAh',
      cpu: '骁龙7s Gen2',
      camera: '6400万像素',
      weight: '190g',
      dimensions: '161.46×73.92×8.55mm',
      os: 'realme UI 5.0',
      release_date: '2024-03'
    },
    'realme13Pro+': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/realme-13-pro-plus.jpg',
      official_price: 1799,
      screen_size: '6.7英寸',
      battery: '5200mAh',
      cpu: '骁龙7s Gen2',
      camera: '5000万像素潜望',
      weight: '188g',
      dimensions: '161×74.2×8.2mm',
      os: 'realme UI 5.0',
      release_date: '2024-08'
    },
    'reyalme13Pro+': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/realme-13-pro-plus.jpg',
      official_price: 1799,
      screen_size: '6.7英寸',
      battery: '5200mAh',
      cpu: '骁龙7s Gen2',
      camera: '5000万像素潜望',
      weight: '188g',
      dimensions: '161×74.2×8.2mm',
      os: 'realme UI 5.0',
      release_date: '2024-08'
    }
  },
  'vivo': {
    'X200': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-x200.jpg',
      official_price: 4299,
      screen_size: '6.67英寸',
      battery: '5800mAh',
      cpu: '天玑9400',
      camera: '5000万像素蔡司三摄',
      weight: '202g',
      dimensions: '160.27×74.81×7.99mm',
      os: 'OriginOS 5',
      release_date: '2024-10'
    },
    'X200Pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-x200-pro.jpg',
      official_price: 5299,
      screen_size: '6.78英寸',
      battery: '6000mAh',
      cpu: '天玑9400',
      camera: '5000万像素蔡司三摄',
      weight: '228g',
      dimensions: '164.1×75.9×8.5mm',
      os: 'OriginOS 5',
      release_date: '2024-10'
    },
    'Y300Pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y300-pro.jpg',
      official_price: 1799,
      screen_size: '6.77英寸',
      battery: '6500mAh',
      cpu: '骁龙6 Gen1',
      camera: '5000万像素',
      weight: '186g',
      dimensions: '164.08×75.68×7.69mm',
      os: 'OriginOS 4',
      release_date: '2024-09'
    },
    'Y300': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y300.jpg',
      official_price: 1499,
      screen_size: '6.67英寸',
      battery: '6000mAh',
      cpu: '骁龙4 Gen2',
      camera: '5000万像素',
      weight: '186g',
      dimensions: '164×75.7×7.69mm',
      os: 'OriginOS 4',
      release_date: '2024-09'
    },
    'S19': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-s19.jpg',
      official_price: 2699,
      screen_size: '6.78英寸',
      battery: '5500mAh',
      cpu: '天玑9200+',
      camera: '5000万像素',
      weight: '192g',
      dimensions: '164.5×75×7.19mm',
      os: 'OriginOS 4',
      release_date: '2024-05'
    },
    'y35+': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y35-plus.jpg',
      official_price: 999,
      screen_size: '6.64英寸',
      battery: '5000mAh',
      cpu: '骁龙680',
      camera: '5000万像素',
      weight: '182g',
      dimensions: '163.9×75.3×8.0mm',
      os: 'OriginOS 3',
      release_date: '2023-03'
    },
    'y36': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y36.jpg',
      official_price: 899,
      screen_size: '6.64英寸',
      battery: '5000mAh',
      cpu: '骁龙680',
      camera: '5000万像素',
      weight: '186g',
      dimensions: '164.1×76.1×8.0mm',
      os: 'OriginOS 3',
      release_date: '2023-04'
    },
    'y37': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y37.jpg',
      official_price: 799,
      screen_size: '6.64英寸',
      battery: '5000mAh',
      cpu: '联发科G85',
      camera: '5000万像素',
      weight: '182g',
      dimensions: '163.9×75.3×8.0mm',
      os: 'OriginOS 3',
      release_date: '2023-05'
    },
    'y100i': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y100i.jpg',
      official_price: 1299,
      screen_size: '6.67英寸',
      battery: '5000mAh',
      cpu: '天玑6020',
      camera: '5000万像素',
      weight: '186g',
      dimensions: '164×75.7×7.79mm',
      os: 'OriginOS 4',
      release_date: '2024-03'
    },
    'y100+': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y100-plus.jpg',
      official_price: 1499,
      screen_size: '6.67英寸',
      battery: '5000mAh',
      cpu: '天玑6080',
      camera: '5000万像素',
      weight: '186g',
      dimensions: '164×75.7×7.79mm',
      os: 'OriginOS 4',
      release_date: '2024-04'
    },
    'y200t': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y200t.jpg',
      official_price: 1099,
      screen_size: '6.64英寸',
      battery: '6000mAh',
      cpu: '骁龙4 Gen1',
      camera: '5000万像素',
      weight: '190g',
      dimensions: '164.3×76.0×8.1mm',
      os: 'OriginOS 4',
      release_date: '2024-01'
    },
    'y300i': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y300.jpg',
      official_price: 1299,
      screen_size: '6.67英寸',
      battery: '6000mAh',
      cpu: '骁龙4 Gen2',
      camera: '5000万像素',
      weight: '186g',
      dimensions: '164×75.7×7.69mm',
      os: 'OriginOS 4',
      release_date: '2024-09'
    },
    'y36c': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y36.jpg',
      official_price: 899,
      screen_size: '6.56英寸',
      battery: '5000mAh',
      cpu: '联发科G85',
      camera: '5000万像素',
      weight: '182g',
      dimensions: '163.9×75.3×8.0mm',
      os: 'OriginOS 3',
      release_date: '2023-06'
    },
    'y36m': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y36.jpg',
      official_price: 899,
      screen_size: '6.56英寸',
      battery: '5000mAh',
      cpu: '联发科G85',
      camera: '5000万像素',
      weight: '182g',
      dimensions: '163.9×75.3×8.0mm',
      os: 'OriginOS 3',
      release_date: '2023-06'
    },
    'IQOO z9x': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-z9x.jpg',
      official_price: 1099,
      screen_size: '6.72英寸',
      battery: '6000mAh',
      cpu: '骁龙6 Gen1',
      camera: '5000万像素',
      weight: '199g',
      dimensions: '164.7×76.2×8.9mm',
      os: 'OriginOS 4',
      release_date: '2024-05'
    },
    'iQOO z9x': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-z9x.jpg',
      official_price: 1099,
      screen_size: '6.72英寸',
      battery: '6000mAh',
      cpu: '骁龙6 Gen1',
      camera: '5000万像素',
      weight: '199g',
      dimensions: '164.7×76.2×8.9mm',
      os: 'OriginOS 4',
      release_date: '2024-05'
    },
    'IQOO 13': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-13.jpg',
      official_price: 3999,
      screen_size: '6.82英寸',
      battery: '6000mAh',
      cpu: '骁龙8至尊版',
      camera: '5000万像素',
      weight: '213g',
      dimensions: '163.4×76.1×8.1mm',
      os: 'OriginOS 5',
      release_date: '2024-10'
    },
    'iQOO z8': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-z8.jpg',
      official_price: 1499,
      screen_size: '6.64英寸',
      battery: '5000mAh',
      cpu: '天玑8200',
      camera: '6400万像素',
      weight: '193g',
      dimensions: '163.8×75.2×8.2mm',
      os: 'OriginOS 3',
      release_date: '2023-08'
    },
    'IQOO z9 turbo': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-z9-turbo.jpg',
      official_price: 1699,
      screen_size: '6.78英寸',
      battery: '6000mAh',
      cpu: '骁龙8s Gen3',
      camera: '5000万像素',
      weight: '194g',
      dimensions: '164.2×75.8×8.1mm',
      os: 'OriginOS 4',
      release_date: '2024-04'
    },
    'X60': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-x60.jpg',
      official_price: 2999,
      screen_size: '6.56英寸',
      battery: '4300mAh',
      cpu: '三星Exynos 1080',
      camera: '4800万像素蔡司三摄',
      weight: '176g',
      dimensions: '159.6×75.0×7.36mm',
      os: 'OriginOS',
      release_date: '2021-01'
    },
    'X60Pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-x60-pro.jpg',
      official_price: 4498,
      screen_size: '6.56英寸',
      battery: '4200mAh',
      cpu: '三星Exynos 1080',
      camera: '4800万像素蔡司三摄',
      weight: '178g',
      dimensions: '158.6×73.2×7.59mm',
      os: 'OriginOS',
      release_date: '2021-01'
    },
    'X60pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-x60-pro.jpg',
      official_price: 4498,
      screen_size: '6.56英寸',
      battery: '4200mAh',
      cpu: '三星Exynos 1080',
      camera: '4800万像素蔡司三摄',
      weight: '178g',
      dimensions: '158.6×73.2×7.59mm',
      os: 'OriginOS',
      release_date: '2021-01'
    }
  },
  '红米': {
    'Note14Pro+': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-14-pro-plus.jpg',
      official_price: 1999,
      screen_size: '6.67英寸',
      battery: '6200mAh',
      cpu: '骁龙7s Gen3',
      camera: '2亿像素',
      weight: '205g',
      dimensions: '162.53×74.67×8.66mm',
      os: 'HyperOS',
      release_date: '2024-09'
    },
    'Note14Pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-14-pro.jpg',
      official_price: 1599,
      screen_size: '6.67英寸',
      battery: '5500mAh',
      cpu: '天玑7300 Ultra',
      camera: '5000万像素',
      weight: '190g',
      dimensions: '162.33×74.42×8.24mm',
      os: 'HyperOS',
      release_date: '2024-09'
    },
    'K70': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-k70.jpg',
      official_price: 2499,
      screen_size: '6.67英寸',
      battery: '5000mAh',
      cpu: '骁龙8 Gen2',
      camera: '6400万像素',
      weight: '209g',
      dimensions: '162.78×75.83×8.59mm',
      os: 'HyperOS',
      release_date: '2023-11'
    },
    'K70Pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-k70-pro.jpg',
      official_price: 3299,
      screen_size: '6.67英寸',
      battery: '5000mAh',
      cpu: '骁龙8 Gen3',
      camera: '5000万像素',
      weight: '209g',
      dimensions: '162.78×75.83×8.49mm',
      os: 'HyperOS',
      release_date: '2023-11'
    },
    'Power': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-pro-plus.jpg',
      official_price: 1999,
      screen_size: '6.67英寸',
      battery: '5100mAh',
      cpu: '天玑7200 Ultra',
      camera: '2亿像素',
      weight: '204g',
      dimensions: '161.4×74.2×8.9mm',
      os: 'HyperOS',
      release_date: '2024-01'
    },
    'Turbo3': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-turbo-3.jpg',
      official_price: 1999,
      screen_size: '6.67英寸',
      battery: '5000mAh',
      cpu: '骁龙8s Gen3',
      camera: '5000万像素',
      weight: '186g',
      dimensions: '161.1×74.9×7.8mm',
      os: 'HyperOS',
      release_date: '2024-04'
    },
    'pilay9t': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-9t.jpg',
      official_price: 999,
      screen_size: '6.53英寸',
      battery: '5000mAh',
      cpu: '天玑800U',
      camera: '4800万像素',
      weight: '199g',
      dimensions: '161.96×77.25×9.05mm',
      os: 'MIUI 12',
      release_date: '2021-01'
    },
    '红米14r': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-14r.jpg',
      official_price: 699,
      screen_size: '6.88英寸',
      battery: '5160mAh',
      cpu: '联发科G81',
      camera: '5000万像素',
      weight: '200g',
      dimensions: '171.88×77.8×8.35mm',
      os: 'HyperOS',
      release_date: '2024-09'
    },
    '红米14R': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-14r.jpg',
      official_price: 699,
      screen_size: '6.88英寸',
      battery: '5160mAh',
      cpu: '联发科G81',
      camera: '5000万像素',
      weight: '200g',
      dimensions: '171.88×77.8×8.35mm',
      os: 'HyperOS',
      release_date: '2024-09'
    },
    'X60': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-mi-10t-lite.jpg',
      official_price: 1599,
      screen_size: '6.67英寸',
      battery: '4820mAh',
      cpu: '骁龙750G',
      camera: '6400万像素',
      weight: '214g',
      dimensions: '165.4×76.8×9mm',
      os: 'MIUI 12',
      release_date: '2020-10'
    },
    'X60Pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-mi-10t-pro.jpg',
      official_price: 2999,
      screen_size: '6.67英寸',
      battery: '5000mAh',
      cpu: '骁龙865',
      camera: '1.08亿像素',
      weight: '218g',
      dimensions: '165.1×76.4×9.33mm',
      os: 'MIUI 12',
      release_date: '2020-10'
    },
    'X60pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-mi-10t-pro.jpg',
      official_price: 2999,
      screen_size: '6.67英寸',
      battery: '5000mAh',
      cpu: '骁龙865',
      camera: '1.08亿像素',
      weight: '218g',
      dimensions: '165.1×76.4×9.33mm',
      os: 'MIUI 12',
      release_date: '2020-10'
    }
  },
  '荣耀': {
    'x50': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/honor-x50.jpg',
      official_price: 1399,
      screen_size: '6.78英寸',
      battery: '5800mAh',
      cpu: '骁龙6 Gen1',
      camera: '1.08亿像素',
      weight: '185g',
      dimensions: '161.9×75.2×7.98mm',
      os: 'MagicOS 7.2',
      release_date: '2023-07'
    },
    '荣耀x50': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/honor-x50.jpg',
      official_price: 1399,
      screen_size: '6.78英寸',
      battery: '5800mAh',
      cpu: '骁龙6 Gen1',
      camera: '1.08亿像素',
      weight: '185g',
      dimensions: '161.9×75.2×7.98mm',
      os: 'MagicOS 7.2',
      release_date: '2023-07'
    },
    'X60i': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/honor-x60i.jpg',
      official_price: 1299,
      screen_size: '6.7英寸',
      battery: '6000mAh',
      cpu: '骁龙4 Gen2',
      camera: '5000万像素',
      weight: '192g',
      dimensions: '165.5×75.9×7.98mm',
      os: 'MagicOS 8.0',
      release_date: '2024-10'
    },
    '荣耀X60i': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/honor-x60i.jpg',
      official_price: 1299,
      screen_size: '6.7英寸',
      battery: '6000mAh',
      cpu: '骁龙4 Gen2',
      camera: '5000万像素',
      weight: '192g',
      dimensions: '165.5×75.9×7.98mm',
      os: 'MagicOS 8.0',
      release_date: '2024-10'
    },
    'Magic7': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/honor-magic7.jpg',
      official_price: 4499,
      screen_size: '6.78英寸',
      battery: '5650mAh',
      cpu: '骁龙8至尊版',
      camera: '5000万像素',
      weight: '199g',
      dimensions: '162.7×75.8×8.0mm',
      os: 'MagicOS 9.0',
      release_date: '2024-10'
    },
    '200': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/honor-200.jpg',
      official_price: 2699,
      screen_size: '6.7英寸',
      battery: '5200mAh',
      cpu: '骁龙7 Gen3',
      camera: '5000万像素',
      weight: '187g',
      dimensions: '161.5×74.6×7.7mm',
      os: 'MagicOS 8.0',
      release_date: '2024-06'
    },
    '畅享 70': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/honor-play-70.jpg',
      official_price: 799,
      screen_size: '6.7英寸',
      battery: '6000mAh',
      cpu: '骁龙4 Gen1',
      camera: '5000万像素',
      weight: '192g',
      dimensions: '166.8×76.5×8.0mm',
      os: 'MagicOS 7.2',
      release_date: '2024-04'
    },
    '畅享70': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/honor-play-70.jpg',
      official_price: 799,
      screen_size: '6.7英寸',
      battery: '6000mAh',
      cpu: '骁龙4 Gen1',
      camera: '5000万像素',
      weight: '192g',
      dimensions: '166.8×76.5×8.0mm',
      os: 'MagicOS 7.2',
      release_date: '2024-04'
    },
    '畅玩50': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/honor-play-50.jpg',
      official_price: 699,
      screen_size: '6.56英寸',
      battery: '5200mAh',
      cpu: '骁龙480+',
      camera: '1300万像素',
      weight: '189g',
      dimensions: '163.9×75.6×8.5mm',
      os: 'MagicOS 7.1',
      release_date: '2023-09'
    },
    '畅玩60Plus': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/honor-play-60-plus.jpg',
      official_price: 1099,
      screen_size: '6.8英寸',
      battery: '6000mAh',
      cpu: '骁龙4 Gen2',
      camera: '5000万像素',
      weight: '195g',
      dimensions: '166.9×76.6×8.0mm',
      os: 'MagicOS 8.0',
      release_date: '2024-08'
    }
  },
  'iPhone': {
    '16': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16.jpg',
      official_price: 5999,
      screen_size: '6.1英寸',
      battery: '3561mAh',
      cpu: 'A18',
      camera: '4800万像素双摄',
      weight: '170g',
      dimensions: '147.6×71.6×7.8mm',
      os: 'iOS 18',
      release_date: '2024-09'
    },
    '16Plus': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-plus.jpg',
      official_price: 6999,
      screen_size: '6.7英寸',
      battery: '4674mAh',
      cpu: 'A18',
      camera: '4800万像素双摄',
      weight: '199g',
      dimensions: '160.9×77.8×7.8mm',
      os: 'iOS 18',
      release_date: '2024-09'
    },
    '16Pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro.jpg',
      official_price: 7999,
      screen_size: '6.3英寸',
      battery: '3582mAh',
      cpu: 'A18 Pro',
      camera: '4800万像素三摄',
      weight: '199g',
      dimensions: '149.6×71.5×8.25mm',
      os: 'iOS 18',
      release_date: '2024-09'
    },
    '16 Pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro.jpg',
      official_price: 7999,
      screen_size: '6.3英寸',
      battery: '3582mAh',
      cpu: 'A18 Pro',
      camera: '4800万像素三摄',
      weight: '199g',
      dimensions: '149.6×71.5×8.25mm',
      os: 'iOS 18',
      release_date: '2024-09'
    },
    '16 ProMax': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg',
      official_price: 9999,
      screen_size: '6.9英寸',
      battery: '4685mAh',
      cpu: 'A18 Pro',
      camera: '4800万像素三摄',
      weight: '227g',
      dimensions: '163×77.6×8.25mm',
      os: 'iOS 18',
      release_date: '2024-09'
    },
    '16ProMax': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg',
      official_price: 9999,
      screen_size: '6.9英寸',
      battery: '4685mAh',
      cpu: 'A18 Pro',
      camera: '4800万像素三摄',
      weight: '227g',
      dimensions: '163×77.6×8.25mm',
      os: 'iOS 18',
      release_date: '2024-09'
    },
    '15': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg',
      official_price: 5499,
      screen_size: '6.1英寸',
      battery: '3349mAh',
      cpu: 'A16',
      camera: '4800万像素双摄',
      weight: '171g',
      dimensions: '147.6×71.6×7.8mm',
      os: 'iOS 17',
      release_date: '2023-09'
    },
    '15Pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro.jpg',
      official_price: 7999,
      screen_size: '6.1英寸',
      battery: '3274mAh',
      cpu: 'A17 Pro',
      camera: '4800万像素三摄',
      weight: '187g',
      dimensions: '146.6×70.6×8.25mm',
      os: 'iOS 17',
      release_date: '2023-09'
    },
    '15ProMax': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg',
      official_price: 9999,
      screen_size: '6.7英寸',
      battery: '4422mAh',
      cpu: 'A17 Pro',
      camera: '4800万像素三摄',
      weight: '221g',
      dimensions: '159.9×76.7×8.25mm',
      os: 'iOS 17',
      release_date: '2023-09'
    }
  },
  '华为': {
    'Mate70': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/huawei-mate-70.jpg',
      official_price: 5499,
      screen_size: '6.7英寸',
      battery: '5300mAh',
      cpu: '麒麟9100',
      camera: '5000万像素XMAGE',
      weight: '206g',
      dimensions: '156.7×72.5×8.0mm',
      os: 'HarmonyOS NEXT',
      release_date: '2024-11'
    },
    'Pura70': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/huawei-pura-70.jpg',
      official_price: 5499,
      screen_size: '6.6英寸',
      battery: '4900mAh',
      cpu: '麒麟9010',
      camera: '5000万像素可变光圈',
      weight: '203g',
      dimensions: '157.6×73.3×7.9mm',
      os: 'HarmonyOS 4.2',
      release_date: '2024-04'
    }
  },
  '小米': {
    '15': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-15.jpg',
      official_price: 4499,
      screen_size: '6.36英寸',
      battery: '5400mAh',
      cpu: '骁龙8至尊版',
      camera: '5000万像素徕卡三摄',
      weight: '191g',
      dimensions: '152.3×71.2×8.08mm',
      os: 'HyperOS 2',
      release_date: '2024-10'
    },
    '小米15': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-15.jpg',
      official_price: 4499,
      screen_size: '6.36英寸',
      battery: '5400mAh',
      cpu: '骁龙8至尊版',
      camera: '5000万像素徕卡三摄',
      weight: '191g',
      dimensions: '152.3×71.2×8.08mm',
      os: 'HyperOS 2',
      release_date: '2024-10'
    },
    '14': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14.jpg',
      official_price: 3999,
      screen_size: '6.36英寸',
      battery: '4610mAh',
      cpu: '骁龙8 Gen3',
      camera: '5000万像素徕卡三摄',
      weight: '188g',
      dimensions: '152.8×71.5×8.2mm',
      os: 'HyperOS',
      release_date: '2023-10'
    },
    '小米14': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14.jpg',
      official_price: 3999,
      screen_size: '6.36英寸',
      battery: '4610mAh',
      cpu: '骁龙8 Gen3',
      camera: '5000万像素徕卡三摄',
      weight: '188g',
      dimensions: '152.8×71.5×8.2mm',
      os: 'HyperOS',
      release_date: '2023-10'
    },
    '14Ultra': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-ultra.jpg',
      official_price: 6499,
      screen_size: '6.73英寸',
      battery: '5300mAh',
      cpu: '骁龙8 Gen3',
      camera: '5000万像素徕卡四摄',
      weight: '229g',
      dimensions: '161.4×75.3×9.2mm',
      os: 'HyperOS',
      release_date: '2024-02'
    },
    'Civi4Pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-civi-4-pro.jpg',
      official_price: 2999,
      screen_size: '6.55英寸',
      battery: '4700mAh',
      cpu: '骁龙8s Gen3',
      camera: '5000万像素徕卡三摄',
      weight: '179g',
      dimensions: '157.2×72.8×7.45mm',
      os: 'HyperOS',
      release_date: '2024-03'
    }
  },
  'iQOO': {
    '13': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-13.jpg',
      official_price: 3999,
      screen_size: '6.82英寸',
      battery: '6000mAh',
      cpu: '骁龙8至尊版',
      camera: '5000万像素',
      weight: '213g',
      dimensions: '163.96×76.02×8.13mm',
      os: 'OriginOS 5',
      release_date: '2024-10'
    },
    'iQOO 13': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-13.jpg',
      official_price: 3999,
      screen_size: '6.82英寸',
      battery: '6000mAh',
      cpu: '骁龙8至尊版',
      camera: '5000万像素',
      weight: '213g',
      dimensions: '163.96×76.02×8.13mm',
      os: 'OriginOS 5',
      release_date: '2024-10'
    },
    'z9 turbo': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-z9-turbo.jpg',
      official_price: 1999,
      screen_size: '6.78英寸',
      battery: '6000mAh',
      cpu: '骁龙8s Gen3',
      camera: '5000万像素',
      weight: '194g',
      dimensions: '164.19×75.26×8.18mm',
      os: 'OriginOS 4',
      release_date: '2024-04'
    },
    'iQOO z9 turbo': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-z9-turbo.jpg',
      official_price: 1999,
      screen_size: '6.78英寸',
      battery: '6000mAh',
      cpu: '骁龙8s Gen3',
      camera: '5000万像素',
      weight: '194g',
      dimensions: '164.19×75.26×8.18mm',
      os: 'OriginOS 4',
      release_date: '2024-04'
    },
    'Neo9': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-neo9.jpg',
      official_price: 2299,
      screen_size: '6.78英寸',
      battery: '5160mAh',
      cpu: '骁龙8 Gen2',
      camera: '5000万像素',
      weight: '190g',
      dimensions: '164.15×75.23×7.99mm',
      os: 'OriginOS 4',
      release_date: '2023-12'
    },
    'Neo9Pro': {
      image: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-neo9-pro.jpg',
      official_price: 2999,
      screen_size: '6.78英寸',
      battery: '5160mAh',
      cpu: '天玑9300',
      camera: '5000万像素',
      weight: '190g',
      dimensions: '164.15×75.23×7.99mm',
      os: 'OriginOS 4',
      release_date: '2023-12'
    }
  }
};

// 从预置数据库获取手机信息
async function getPhoneInfo(brand, model) {
  // 先从预置数据库查找
  const brandData = PHONE_DATABASE[brand];
  if (brandData) {
    // 模糊匹配型号
    for (const [key, value] of Object.entries(brandData)) {
      if (model.toLowerCase().includes(key.toLowerCase()) || 
          key.toLowerCase().includes(model.toLowerCase())) {
        return { ...value, matched_model: key };
      }
    }
  }
  return null;
}

// 尝试从网络获取手机信息（备用方案）
async function fetchPhoneInfoFromWeb(brand, model) {
  try {
    // 这里可以添加实际的爬虫逻辑
    // 由于大多数网站有反爬措施，这里使用预置数据
    return null;
  } catch (error) {
    console.error('Fetch phone info error:', error.message);
    return null;
  }
}

// 同步单个手机的官方数据
async function syncPhoneOfficialData(phoneId) {
  try {
    const [phones] = await pool.query(`
      SELECT p.*, b.name as brand_name 
      FROM phones p 
      LEFT JOIN brands b ON p.brand_id = b.id 
      WHERE p.id = ?
    `, [phoneId]);
    
    if (phones.length === 0) return { success: false, error: 'Phone not found' };
    
    const phone = phones[0];
    const info = await getPhoneInfo(phone.brand_name, phone.model);
    
    if (info) {
      await pool.query(`
        UPDATE phones SET 
          image_url = COALESCE(?, image_url),
          official_price = COALESCE(?, official_price),
          screen_size = COALESCE(?, screen_size),
          battery = COALESCE(?, battery),
          cpu = COALESCE(?, cpu),
          camera = COALESCE(?, camera),
          weight = COALESCE(?, weight),
          dimensions = COALESCE(?, dimensions),
          os = COALESCE(?, os)
        WHERE id = ?
      `, [info.image, info.official_price, info.screen_size, info.battery, 
          info.cpu, info.camera, info.weight, info.dimensions, info.os, phoneId]);
      
      return { success: true, data: info };
    }
    
    return { success: false, error: 'No matching data found' };
  } catch (error) {
    console.error('Sync phone data error:', error);
    return { success: false, error: error.message };
  }
}

// 批量同步所有手机的官方数据
async function syncAllPhonesOfficialData() {
  try {
    const [phones] = await pool.query(`
      SELECT p.id, p.model, b.name as brand_name 
      FROM phones p 
      LEFT JOIN brands b ON p.brand_id = b.id
    `);
    
    let successCount = 0;
    let failedCount = 0;
    
    for (const phone of phones) {
      const result = await syncPhoneOfficialData(phone.id);
      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }
    }
    
    return { total: phones.length, success: successCount, failed: failedCount };
  } catch (error) {
    console.error('Sync all phones error:', error);
    throw error;
  }
}

// 搜索手机信息（从预置数据库）
function searchPhoneDatabase(query) {
  const results = [];
  const queryLower = query.toLowerCase();
  
  for (const [brand, models] of Object.entries(PHONE_DATABASE)) {
    for (const [model, data] of Object.entries(models)) {
      if (brand.toLowerCase().includes(queryLower) || 
          model.toLowerCase().includes(queryLower)) {
        results.push({
          brand,
          model,
          ...data
        });
      }
    }
  }
  
  return results;
}

// 获取所有预置手机数据
function getAllPhoneDatabase() {
  const results = [];
  
  for (const [brand, models] of Object.entries(PHONE_DATABASE)) {
    for (const [model, data] of Object.entries(models)) {
      results.push({
        brand,
        model,
        ...data
      });
    }
  }
  
  return results;
}

module.exports = {
  getPhoneInfo,
  syncPhoneOfficialData,
  syncAllPhonesOfficialData,
  searchPhoneDatabase,
  getAllPhoneDatabase,
  PHONE_DATABASE
};
