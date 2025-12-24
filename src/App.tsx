import React, { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import { 
  Container, 
  Typography, 
  Box,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  InputAdornment,
  Slider,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import { PhoneGroup, Phone } from './types';
import { parsePhoneData } from './utils/parseData';
import { fetchPhoneGroups, checkHealth, fetchPhoneGroupsWithSpecs, getProxyImageUrl } from './services/api';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: 'transparent',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#ffffff',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
      },
    },
  },
});

// 颜色映射表
const colorMap: Record<string, string> = {
  '黑': '#222',
  '白': '#fff',
  '蓝': '#2196f3',
  '金': '#FFD700',
  '紫': '#9c27b0',
  '青': '#00bfae',
  '粉': '#ffb6c1',
  '红': '#e53935',
  '银': '#bdbdbd',
  '橙': '#ff9800',
  '绿': '#43a047',
  '彩': '#2196f3',
  '原': '#bdbdbd',
  '沙漠色': '#c2b280',
  '光': '#bdbdbd',
  '青白': '#00bfae',
};


// 安全解析价格（数据库可能返回字符串）
const parsePrice = (price: any): number => {
  if (typeof price === 'number') return price;
  if (typeof price === 'string') return parseFloat(price) || 0;
  return 0;
};

// 手机卡片组件 - 现代化设计（带图片和参数）
const PhoneCard = memo(({ phone, onShowDetail, index = 0 }: { phone: Phone; onShowDetail?: (phone: Phone) => void; index?: number }) => {
  const [imageError, setImageError] = React.useState(false);
  
  const statusConfig = {
    '现货': { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: '✓', glow: 'rgba(16, 185, 129, 0.2)' },
    '怕抓': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: '⚠', glow: 'rgba(245, 158, 11, 0.2)' },
    '没货': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: '✗', glow: 'rgba(239, 68, 68, 0.2)' },
  };
  const status = statusConfig[phone.availability?.trim() as keyof typeof statusConfig] || { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', icon: '●', glow: 'transparent' };
  
  const price = parsePrice(phone.price);
  const officialPrice = parsePrice(phone.officialPrice);

  return (
    <Box
      onClick={() => onShowDetail?.(phone)}
      sx={{
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: 4,
        p: 2.5,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.05)',
        animation: `fadeInUp 0.5s ease ${index * 0.05}s both`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #667eea, #764ba2)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
        '&:hover': {
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15), 0 8px 16px rgba(0,0,0,0.08)',
          border: '1px solid rgba(102, 126, 234, 0.3)',
          '&::before': {
            opacity: 1,
          },
        },
      }}
    >
      {/* 手机图片 */}
      <Box
        sx={{
          width: '100%',
          height: 160,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {phone.image && !imageError ? (
          <Box
            component="img"
            src={getProxyImageUrl(phone.image)}
            alt={phone.model}
            loading="lazy"
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transition: 'opacity 0.3s ease',
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
            }}
          >
            <Box sx={{ fontSize: 40, mb: 0.5 }}>📱</Box>
            <Box sx={{ fontSize: 12 }}>暂无图片</Box>
          </Box>
        )}
      </Box>

      {/* 头部：品牌 + 网络类型 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          {phone.brand}
        </Typography>
        <Box
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: 1,
            fontSize: 11,
            fontWeight: 700,
            bgcolor: phone.networkType === '5G' ? '#667eea' : '#e5e7eb',
            color: phone.networkType === '5G' ? 'white' : '#374151',
          }}
        >
          {phone.networkType}
        </Box>
      </Box>

      {/* 型号 */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1, lineHeight: 1.3, fontSize: 16 }}>
        {phone.model}
      </Typography>

      {/* 关键参数 */}
      {phone.specs && (phone.specs.cpu || phone.specs.battery || phone.specs.screenSize) && (
        <Box sx={{ mb: 1.5, fontSize: 11, color: '#64748b' }}>
          {phone.specs.cpu && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
              <span>💻</span> {phone.specs.cpu.slice(0, 30)}{phone.specs.cpu.length > 30 ? '...' : ''}
            </Box>
          )}
          {phone.specs.battery && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
              <span>🔋</span> {phone.specs.battery}
            </Box>
          )}
          {phone.specs.screenSize && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <span>📱</span> {phone.specs.screenSize}
            </Box>
          )}
        </Box>
      )}

      {/* 配置信息 */}
      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.5,
            bgcolor: '#f8fafc',
            borderRadius: 1.5,
            fontSize: 12,
          }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: colorMap[phone.color || ''] || '#9ca3af',
              border: '1px solid rgba(0,0,0,0.1)',
            }}
          />
          <span>{phone.color || '默认'}</span>
        </Box>
        {((phone.ram || 0) > 0 || (phone.storage || 0) > 0) && (
          <Box
            sx={{
              px: 1,
              py: 0.5,
              bgcolor: '#f8fafc',
              borderRadius: 1.5,
              fontSize: 12,
              color: '#64748b',
            }}
          >
            {(phone.ram || 0) > 0 ? `${phone.ram}+` : ''}{phone.storage || 0}GB
          </Box>
        )}
      </Box>

      {/* 价格和库存 */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-end">
        <Box>
          {price > 0 ? (
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: '#dc2626',
                letterSpacing: '-0.5px',
                fontSize: 20,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500 }}>¥</span>
              {price.toLocaleString()}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              价格待定
            </Typography>
          )}
          {officialPrice > 0 && officialPrice !== price && (
            <Typography variant="caption" color="text.disabled" sx={{ textDecoration: 'line-through' }}>
              官方价 ¥{officialPrice.toLocaleString()}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.25,
            borderRadius: 1,
            fontSize: 11,
            fontWeight: 600,
            bgcolor: status.bg,
            color: status.color,
          }}
        >
          <span>{status.icon}</span>
          {phone.availability || '正常'}
        </Box>
      </Box>
    </Box>
  );
});

function App() {
  const [phoneGroups, setPhoneGroups] = useState<PhoneGroup[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useBackend, setUseBackend] = useState(false);
  
  // 搜索和筛选状态
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 防抖搜索 - 性能优化
  const handleSearchChange = useCallback((value: string) => {
    setSearchText(value);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  }, []);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 15000]);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');
  
  // 手机详情弹窗状态
  const [detailPhone, setDetailPhone] = useState<Phone | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailImageError, setDetailImageError] = useState(false);
  
  const handleShowDetail = useCallback((phone: Phone) => {
    setDetailPhone(phone);
    setDetailImageError(false);
    setDetailOpen(true);
  }, []);
  
  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // 先检查后端是否可用
    const backendAvailable = await checkHealth();
    setUseBackend(backendAvailable);
    
    try {
      let parsedData: PhoneGroup[];
      
      if (backendAvailable) {
        // 优先使用带图片和参数的 API
        try {
          parsedData = await fetchPhoneGroupsWithSpecs();
        } catch {
          // 如果失败，回退到普通 API
          parsedData = await fetchPhoneGroups();
        }
      } else {
        // 从本地 JSON 文件获取数据
        const response = await fetch('/2025年5月02日.json');
        if (!response.ok) {
          throw new Error('数据文件不存在或无法访问');
        }
        const data = await response.text();
        if (!data.trim()) {
          throw new Error('数据文件为空');
        }
        parsedData = parsePhoneData(data);
      }
      
      if (parsedData.length === 0) {
        throw new Error('没有找到有效数据');
      }
      setPhoneGroups(parsedData);
      if (parsedData.length > 0 && !selectedBrand) {
        setSelectedBrand('全部');
      }
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据时发生错误');
      setLoading(false);
      setPhoneGroups([]);
    }
  }, [selectedBrand]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // 处理价格范围变化
  const handlePriceChange = (event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as [number, number]);
  };

  // 过滤手机列表 - 使用 useMemo 缓存结果
  const filteredPhones = useMemo(() => {
    let phones = phoneGroups.flatMap(group => group.phones);

    // 品牌过滤
    if (selectedBrand && selectedBrand !== '全部') {
      phones = phones.filter(phone => phone.brand === selectedBrand);
    }
    // 搜索过滤（使用防抖后的值）
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      phones = phones.filter(phone =>
        (phone.brand || '').toLowerCase().includes(searchLower) ||
        (phone.model || '').toLowerCase().includes(searchLower) ||
        (phone.color || '').toLowerCase().includes(searchLower)
      );
    }
    // 价格范围过滤
    phones = phones.filter(phone => {
      const price = parsePrice(phone.price);
      return price >= priceRange[0] && price <= priceRange[1];
    });
    // 库存状态过滤
    if (availabilityFilter !== 'all') {
      phones = phones.filter(phone =>
        phone.availability?.trim() === availabilityFilter
      );
    }
    // 排序
    if (sortBy === 'price-asc') {
      phones.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sortBy === 'price-desc') {
      phones.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    } else if (sortBy === 'storage-desc') {
      phones.sort((a, b) => (b.storage || 0) - (a.storage || 0));
    }
    return phones;
  }, [phoneGroups, selectedBrand, debouncedSearch, priceRange, availabilityFilter, sortBy]);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box 
          display="flex" 
          flexDirection="column"
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
          sx={{ bgcolor: 'transparent', position: 'relative', zIndex: 1 }}
        >
          <Box
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              borderRadius: 5,
              p: 6,
              textAlign: 'center',
              boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.8)',
              animation: 'fadeInUp 0.6s ease',
            }}
          >
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
              <CircularProgress 
                size={60} 
                thickness={4}
                sx={{ 
                  color: '#667eea',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  },
                }} 
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: 24,
                }}
              >
                📱
              </Box>
            </Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              正在加载数据
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              请稍候，精彩即将呈现...
            </Typography>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <Box 
          display="flex" 
          flexDirection="column"
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
          sx={{ bgcolor: 'transparent', position: 'relative', zIndex: 1 }}
        >
          <Box
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              borderRadius: 5,
              p: 6,
              textAlign: 'center',
              maxWidth: 420,
              boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.8)',
              animation: 'fadeInUp 0.6s ease',
            }}
          >
            <Box sx={{ 
              fontSize: 56, 
              mb: 2,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
            }}>
              ⚠️
            </Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1, color: '#ef4444' }}>
              加载失败
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
              {error}
            </Typography>
            <Box
              component="button"
              onClick={() => window.location.reload()}
              sx={{
                px: 5,
                py: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 3,
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.5)',
                },
              }}
            >
              重新加载
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  if (phoneGroups.length === 0) {
    return (
      <ThemeProvider theme={theme}>
        <Box 
          display="flex" 
          flexDirection="column"
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
          sx={{ bgcolor: 'transparent', position: 'relative', zIndex: 1 }}
        >
          <Box
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              borderRadius: 5,
              p: 6,
              textAlign: 'center',
              boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.8)',
              animation: 'fadeInUp 0.6s ease',
            }}
          >
            <Box sx={{ 
              fontSize: 56, 
              mb: 2,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
            }}>
              📱
            </Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              暂无数据
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              没有可用的手机数据
            </Typography>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
        {/* 现代化导航栏 - 玻璃拟态 */}
        <AppBar 
          position="sticky" 
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Toolbar sx={{ py: 1.5 }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer}
              sx={{ 
                mr: 2,
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                📱 手机价格展示
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 500 }}>
                实时更新 · {phoneGroups.length} 个品牌
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 0.75,
                bgcolor: 'rgba(255,255,255,0.15)',
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                {filteredPhones.length}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                款在售
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {/* 现代化侧边栏 - 玻璃拟态 */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer}
          PaperProps={{
            sx: {
              width: 320,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRight: '1px solid rgba(255,255,255,0.3)',
            }
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              mb: 0.5 
            }}>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: 2, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              }}>
                📱
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  选择品牌
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  共 {phoneGroups.length} 个品牌
                </Typography>
              </Box>
            </Box>
            <Box sx={{ 
              height: 3, 
              background: 'linear-gradient(90deg, #667eea, #764ba2)', 
              borderRadius: 2, 
              mt: 2, 
              mb: 3 
            }} />
            <List disablePadding>
              <ListItemButton 
                onClick={() => {
                  setSelectedBrand('全部');
                  setDrawerOpen(false);
                }}
                sx={{ 
                  borderRadius: 2,
                  mb: 0.5,
                  bgcolor: selectedBrand === '全部' ? '#f0f4ff' : 'transparent',
                  border: selectedBrand === '全部' ? '1px solid #667eea' : '1px solid transparent',
                  '&:hover': { bgcolor: '#f8fafc' },
                }}
              >
                <ListItemText 
                  primary="全部品牌" 
                  primaryTypographyProps={{ 
                    fontWeight: selectedBrand === '全部' ? 600 : 400,
                    color: selectedBrand === '全部' ? 'primary.main' : 'text.primary',
                  }}
                />
              </ListItemButton>
              {phoneGroups.map((group) => (
                <ListItemButton 
                  key={group.brand}
                  onClick={() => {
                    setSelectedBrand(group.brand);
                    setDrawerOpen(false);
                  }}
                  sx={{ 
                    borderRadius: 2,
                    mb: 0.5,
                    bgcolor: selectedBrand === group.brand ? '#f0f4ff' : 'transparent',
                    border: selectedBrand === group.brand ? '1px solid #667eea' : '1px solid transparent',
                    '&:hover': { bgcolor: '#f8fafc' },
                  }}
                >
                  <ListItemText 
                    primary={group.brand} 
                    primaryTypographyProps={{ 
                      fontWeight: selectedBrand === group.brand ? 600 : 400,
                      color: selectedBrand === group.brand ? 'primary.main' : 'text.primary',
                    }}
                  />
                  <Box
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      fontSize: 12,
                      fontWeight: 600,
                      bgcolor: '#f1f5f9',
                      color: '#64748b',
                    }}
                  >
                    {group.phones.length}
                  </Box>
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Drawer>

        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 搜索和筛选区域 - 玻璃拟态 */}
            <Box
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                borderRadius: 4,
                p: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                border: '1px solid rgba(255,255,255,0.8)',
              }}
            >
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr' }, alignItems: 'end' }}>
                <TextField
                  fullWidth
                  placeholder="搜索手机型号、品牌、颜色..."
                  variant="outlined"
                  size="small"
                  value={searchText}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#9ca3af' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      '& fieldset': { borderColor: 'transparent' },
                      '&:hover fieldset': { borderColor: '#e2e8f0' },
                      '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                    },
                  }}
                />
                <FormControl fullWidth size="small">
                  <Select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    displayEmpty
                    sx={{ 
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      '& fieldset': { borderColor: 'transparent' },
                      '&:hover fieldset': { borderColor: '#e2e8f0' },
                    }}
                  >
                    <MenuItem value="all">全部库存</MenuItem>
                    <MenuItem value="现货">✓ 现货</MenuItem>
                    <MenuItem value="怕抓">⚠ 怕抓</MenuItem>
                    <MenuItem value="没货">✗ 没货</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    displayEmpty
                    sx={{ 
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      '& fieldset': { borderColor: 'transparent' },
                      '&:hover fieldset': { borderColor: '#e2e8f0' },
                    }}
                  >
                    <MenuItem value="default">默认排序</MenuItem>
                    <MenuItem value="price-asc">价格从低到高</MenuItem>
                    <MenuItem value="price-desc">价格从高到低</MenuItem>
                    <MenuItem value="storage-desc">存储从大到小</MenuItem>
                  </Select>
                </FormControl>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    价格: ¥{priceRange[0]} - ¥{priceRange[1]}
                  </Typography>
                  <Slider
                    value={priceRange}
                    onChange={handlePriceChange}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => `¥${v}`}
                    min={0}
                    max={15000}
                    step={100}
                    size="small"
                    sx={{ py: 0 }}
                  />
                </Box>
              </Box>

              {/* 品牌快捷筛选 */}
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label="全部"
                  size="small"
                  onClick={() => setSelectedBrand('全部')}
                  sx={{
                    bgcolor: selectedBrand === '全部' || !selectedBrand ? 'primary.main' : '#f1f5f9',
                    color: selectedBrand === '全部' || !selectedBrand ? 'white' : 'text.primary',
                    fontWeight: 500,
                    '&:hover': { bgcolor: selectedBrand === '全部' || !selectedBrand ? 'primary.dark' : '#e2e8f0' },
                  }}
                />
                {phoneGroups.map((group) => (
                  <Chip
                    key={group.brand}
                    label={group.brand}
                    size="small"
                    onClick={() => setSelectedBrand(group.brand)}
                    sx={{
                      bgcolor: selectedBrand === group.brand ? 'primary.main' : '#f1f5f9',
                      color: selectedBrand === group.brand ? 'white' : 'text.primary',
                      fontWeight: 500,
                      '&:hover': { bgcolor: selectedBrand === group.brand ? 'primary.dark' : '#e2e8f0' },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* 结果统计 */}
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Typography variant="body1" color="text.secondary">
                共找到 <strong style={{ color: '#1e293b' }}>{filteredPhones.length}</strong> 款手机
                {selectedBrand && selectedBrand !== '全部' && (
                  <span style={{ marginLeft: 8 }}>
                    · {selectedBrand}
                  </span>
                )}
              </Typography>
              <Box display="flex" gap={1}>
                {searchText && (
                  <Chip 
                    label={`搜索: ${searchText}`}
                    onDelete={() => { setSearchText(''); setDebouncedSearch(''); }}
                    size="small"
                    sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 500 }}
                  />
                )}
                {availabilityFilter !== 'all' && (
                  <Chip 
                    label={availabilityFilter}
                    onDelete={() => setAvailabilityFilter('all')}
                    size="small"
                    sx={{ bgcolor: '#ecfdf5', color: '#065f46', fontWeight: 500 }}
                  />
                )}
                {sortBy !== 'default' && (
                  <Chip 
                    label={sortBy === 'price-asc' ? '价格↑' : sortBy === 'price-desc' ? '价格↓' : '存储↓'}
                    onDelete={() => setSortBy('default')}
                    size="small"
                    sx={{ bgcolor: '#ede9fe', color: '#5b21b6', fontWeight: 500 }}
                  />
                )}
              </Box>
            </Box>

            {/* 手机列表 */}
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 2,
              }}
            >
              {filteredPhones.map((phone, index) => (
                <PhoneCard 
                  phone={phone} 
                  key={`${phone.model}-${phone.color}-${index}`}
                  onShowDetail={handleShowDetail}
                  index={index % 20}
                />
              ))}
            </Box>

            {filteredPhones.length === 0 && (
              <Box 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                justifyContent="center"
                sx={{ 
                  py: 8,
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 4,
                  border: '1px solid rgba(255,255,255,0.8)',
                }}
              >
                <Box sx={{ fontSize: 48, mb: 2 }}>📱</Box>
                <Typography variant="h6" color="text.secondary" fontWeight={500}>
                  没有找到匹配的手机
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  尝试调整筛选条件
                </Typography>
              </Box>
            )}
          </Box>
        </Container>

        {/* 页脚 - 玻璃拟态 */}
        <Box
          component="footer"
          sx={{
            py: 4,
            textAlign: 'center',
            mt: 4,
            mx: 3,
            mb: 3,
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.5)',
          }}
        >
          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
            📱 手机价格展示系统 · 数据仅供参考
            {useBackend && ' · ✨ 已连接数据库'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 1 }}>
            共 {phoneGroups.reduce((sum, g) => sum + g.phones.length, 0)} 款手机 · {new Date().getFullYear()} © PhonePriceVista
          </Typography>
        </Box>

        {/* 手机详情弹窗 */}
        <Dialog
          open={detailOpen}
          onClose={handleCloseDetail}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              maxHeight: '90vh',
            }
          }}
        >
          {detailPhone && (
            <>
              <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: '1px solid #f0f0f0',
                pb: 2,
              }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {detailPhone.brand}
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {detailPhone.model}
                  </Typography>
                </Box>
                <IconButton onClick={handleCloseDetail} size="small">
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ pt: 3 }}>
                <Grid container spacing={3}>
                  {/* 图片区域 */}
                  <Grid item xs={12} md={5}>
                    <Box
                      sx={{
                        width: '100%',
                        height: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#f8fafc',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      {detailPhone.image && !detailImageError ? (
                        <Box
                          component="img"
                          src={getProxyImageUrl(detailPhone.image)}
                          alt={detailPhone.model}
                          loading="lazy"
                          onError={() => setDetailImageError(true)}
                          sx={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <Box sx={{ fontSize: 64, color: '#cbd5e1' }}>📱</Box>
                      )}
                    </Box>
                    {/* 价格 */}
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#fef2f2', borderRadius: 2 }}>
                      {parsePrice(detailPhone.price) > 0 ? (
                        <Typography variant="h4" fontWeight={800} color="#dc2626">
                          ¥{parsePrice(detailPhone.price).toLocaleString()}
                        </Typography>
                      ) : (
                        <Typography variant="h5" color="text.secondary">
                          价格待定
                        </Typography>
                      )}
                      {parsePrice(detailPhone.officialPrice) > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          官方指导价: ¥{parsePrice(detailPhone.officialPrice).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  
                  {/* 参数区域 */}
                  <Grid item xs={12} md={7}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                      📋 详细参数
                    </Typography>
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: 1.5,
                    }}>
                      {/* 基本配置 */}
                      <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">颜色</Typography>
                        <Typography variant="body2" fontWeight={500}>{detailPhone.color || '未知'}</Typography>
                      </Box>
                      <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">存储</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {(detailPhone.ram || 0) > 0 ? `${detailPhone.ram}GB + ` : ''}{detailPhone.storage || 0}GB
                        </Typography>
                      </Box>
                      <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">网络</Typography>
                        <Typography variant="body2" fontWeight={500}>{detailPhone.networkType || '未知'}</Typography>
                      </Box>
                      <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">库存状态</Typography>
                        <Typography variant="body2" fontWeight={500}>{detailPhone.availability || '正常'}</Typography>
                      </Box>
                      
                      {/* 详细参数 */}
                      {detailPhone.specs?.cpu && (
                        <Box sx={{ p: 1.5, bgcolor: '#f0f4ff', borderRadius: 1.5 }}>
                          <Typography variant="caption" color="text.secondary">💻 处理器</Typography>
                          <Typography variant="body2" fontWeight={500}>{detailPhone.specs.cpu}</Typography>
                        </Box>
                      )}
                      {detailPhone.specs?.screenSize && (
                        <Box sx={{ p: 1.5, bgcolor: '#f0f4ff', borderRadius: 1.5 }}>
                          <Typography variant="caption" color="text.secondary">📱 屏幕</Typography>
                          <Typography variant="body2" fontWeight={500}>{detailPhone.specs.screenSize}</Typography>
                        </Box>
                      )}
                      {detailPhone.specs?.battery && (
                        <Box sx={{ p: 1.5, bgcolor: '#f0f4ff', borderRadius: 1.5 }}>
                          <Typography variant="caption" color="text.secondary">🔋 电池</Typography>
                          <Typography variant="body2" fontWeight={500}>{detailPhone.specs.battery}</Typography>
                        </Box>
                      )}
                      {detailPhone.specs?.camera && (
                        <Box sx={{ p: 1.5, bgcolor: '#f0f4ff', borderRadius: 1.5 }}>
                          <Typography variant="caption" color="text.secondary">📷 摄像头</Typography>
                          <Typography variant="body2" fontWeight={500}>{detailPhone.specs.camera}</Typography>
                        </Box>
                      )}
                      {detailPhone.specs?.os && (
                        <Box sx={{ p: 1.5, bgcolor: '#f0f4ff', borderRadius: 1.5 }}>
                          <Typography variant="caption" color="text.secondary">⚙️ 系统</Typography>
                          <Typography variant="body2" fontWeight={500}>{detailPhone.specs.os}</Typography>
                        </Box>
                      )}
                      {detailPhone.specs?.weight && (
                        <Box sx={{ p: 1.5, bgcolor: '#f0f4ff', borderRadius: 1.5 }}>
                          <Typography variant="caption" color="text.secondary">⚖️ 重量</Typography>
                          <Typography variant="body2" fontWeight={500}>{detailPhone.specs.weight}</Typography>
                        </Box>
                      )}
                      {detailPhone.specs?.dimensions && (
                        <Box sx={{ p: 1.5, bgcolor: '#f0f4ff', borderRadius: 1.5, gridColumn: 'span 2' }}>
                          <Typography variant="caption" color="text.secondary">📐 尺寸</Typography>
                          <Typography variant="body2" fontWeight={500}>{detailPhone.specs.dimensions}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>
            </>
          )}
        </Dialog>

      </Box>
    </ThemeProvider>
  );
}

export default App;
