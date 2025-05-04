import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Box,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Alert,
  TextField,
  InputAdornment,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Theme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import CircleIcon from '@mui/icons-material/Circle';
import { PhoneGroup } from './types';
import { parsePhoneData } from './utils/parseData';

function App() {
  const [phoneGroups, setPhoneGroups] = useState<PhoneGroup[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 搜索和筛选状态
  const [searchText, setSearchText] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');

  // 颜色转为可用的色值（简单映射，实际可扩展）
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
    '彩': 'linear-gradient(90deg,#2196f3,#ffb6c1,#FFD700)',
    '原': '#bdbdbd',
    '沙漠色': '#c2b280',
    '光': '#bdbdbd',
    '青白': 'linear-gradient(90deg,#00bfae,#fff)',
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/2025年5月02日.json');
        if (!response.ok) {
          throw new Error('数据文件不存在或无法访问');
        }
        const data = await response.text();
        if (!data.trim()) {
          throw new Error('数据文件为空');
        }
        const parsedData = parsePhoneData(data);
        if (parsedData.length === 0) {
          throw new Error('没有找到有效数据');
        }
        setPhoneGroups(parsedData);
        if (parsedData.length > 0) {
          setSelectedBrand(parsedData[0].brand);
        }
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载数据时发生错误');
        setLoading(false);
        setPhoneGroups([]);
      }
    };

    fetchData();
  }, []);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // 处理价格范围变化
  const handlePriceChange = (event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as [number, number]);
  };

  // 获取所有手机列表
  const getAllPhones = () => {
    return phoneGroups.flatMap(group => group.phones);
  };

  // 过滤手机列表
  const getFilteredPhones = () => {
    let phones = getAllPhones();

    // 品牌过滤
    if (selectedBrand && selectedBrand !== '全部') {
      phones = phones.filter(phone => phone.brand === selectedBrand);
    }
    // 搜索过滤
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      phones = phones.filter(phone => 
        phone.brand.toLowerCase().includes(searchLower) ||
        phone.model.toLowerCase().includes(searchLower) ||
        phone.color.toLowerCase().includes(searchLower)
      );
    }
    // 价格范围过滤
    phones = phones.filter(phone => 
      phone.price >= priceRange[0] && phone.price <= priceRange[1]
    );
    // 库存状态过滤
    if (availabilityFilter !== 'all') {
      phones = phones.filter(phone => 
        phone.availability === availabilityFilter
      );
    }
    return phones;
  };

  const drawer = (
    <div>
      <List>
        <ListItem 
          onClick={() => {
            setSelectedBrand('全部');
            setDrawerOpen(false);
          }}
          sx={{ cursor: 'pointer', fontWeight: selectedBrand === '全部' ? 'bold' : 'normal', bgcolor: selectedBrand === '全部' ? 'rgba(0,0,0,0.08)' : 'inherit' }}
        >
          <ListItemText primary="全部" />
        </ListItem>
        {phoneGroups.map((group) => (
          <ListItem 
            key={group.brand}
            onClick={() => {
              setSelectedBrand(group.brand);
              setDrawerOpen(false);
            }}
            sx={{ cursor: 'pointer', fontWeight: selectedBrand === group.brand ? 'bold' : 'normal', bgcolor: selectedBrand === group.brand ? 'rgba(0,0,0,0.08)' : 'inherit' }}
          >
            <ListItemText primary={group.brand} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  const filteredPhones = getFilteredPhones();

  // 卡片式手机展示
  const PhoneCard = ({ phone }: { phone: any }) => (
    <Card elevation={3} sx={{ borderRadius: 3, minWidth: 260, maxWidth: 340, m: 1, transition: '0.2s', ':hover': { boxShadow: 8 } }}>
      <CardContent>
        <Box display="flex" flexDirection="column" alignItems="center" mb={1}>
          <img
            src={`/phone-images/${phone.brand}_${phone.model}.jpg`}
            alt={phone.model}
            style={{ width: 120, height: 120, objectFit: 'contain', marginBottom: 8 }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
          <Typography variant="h6" fontWeight={700} mr={1}>{phone.model}</Typography>
          <Chip label={phone.networkType} size="small" color={phone.networkType === '5G' ? 'primary' : 'default'} sx={{ ml: 1 }} />
        </Box>
        <Box display="flex" alignItems="center" mb={1}>
          {/* 颜色圆点 */}
          <CircleIcon sx={{ color: colorMap[phone.color] || '#bdbdbd', fontSize: 20, border: '1px solid #eee', borderRadius: '50%', background: colorMap[phone.color]?.startsWith('linear') ? undefined : colorMap[phone.color], mr: 1 }} />
          <Typography variant="body2" color="textSecondary">{phone.color}</Typography>
        </Box>
        <Box display="flex" gap={1} mb={1}>
          <Chip label={`${phone.ram}GB`} size="small" color="info" />
          <Chip label={`${phone.storage}GB`} size="small" color="info" />
        </Box>
        <Box display="flex" alignItems="center" mb={1}>
          <Typography variant="h5" color="error" fontWeight={700}>
            ¥{phone.price}
          </Typography>
        </Box>
        <Box>
          <Chip 
            label={phone.availability || '正常'} 
            color={
              phone.availability === '现货' ? 'success' :
              phone.availability === '怕抓' ? 'warning' :
              phone.availability === '没货' ? 'error' : 'default'
            }
            size="small"
          />
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container>
        <Typography variant="h6" align="center" style={{ marginTop: '2rem' }}>
          加载中...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" style={{ marginTop: '2rem' }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (phoneGroups.length === 0) {
    return (
      <Container>
        <Alert severity="info" style={{ marginTop: '2rem' }}>
          没有可用的数据
        </Alert>
      </Container>
    );
  }

  return (
    <div>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            手机价格展示
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
      >
        {drawer}
      </Drawer>

      <Container maxWidth="lg" style={{ marginTop: '2rem' }}>
        <Box sx={{ display: 'grid', gap: 3 }}>
          {/* 搜索和筛选卡片 */}
          <Box>
            <Card elevation={2}>
              <CardHeader title="搜索和筛选" />
              <CardContent>
                <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                  <Box>
                    <TextField
                      fullWidth
                      label="搜索"
                      variant="outlined"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  <Box>
                    <FormControl fullWidth>
                      <InputLabel>库存状态</InputLabel>
                      <Select
                        value={availabilityFilter}
                        label="库存状态"
                        onChange={(e) => setAvailabilityFilter(e.target.value)}
                      >
                        <MenuItem value="all">全部</MenuItem>
                        <MenuItem value="现货">现货</MenuItem>
                        <MenuItem value="怕抓">怕抓</MenuItem>
                        <MenuItem value="没货">没货</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}>
                    <Typography gutterBottom>价格范围</Typography>
                    <Slider
                      value={priceRange}
                      onChange={handlePriceChange}
                      valueLabelDisplay="auto"
                      min={0}
                      max={5000}
                      step={100}
                    />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption">¥{priceRange[0]}</Typography>
                      <Typography variant="caption">¥{priceRange[1]}</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* 结果统计 */}
          <Box>
            <Typography variant="subtitle1" color="textSecondary">
              找到 {filteredPhones.length} 个结果
            </Typography>
          </Box>

          {/* 手机列表 */}
          <Box display="flex" flexWrap="wrap" justifyContent="flex-start">
            {filteredPhones.map((phone, index) => (
              <PhoneCard phone={phone} key={index} />
            ))}
          </Box>
        </Box>
      </Container>
    </div>
  );
}

export default App;
