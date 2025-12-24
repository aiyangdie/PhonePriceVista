import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { Brand, addPhone, updatePhone, deletePhone, fetchBrands, addBrand } from '../services/api';

interface Phone {
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

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  phones: Phone[];
  onRefresh: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ open, onClose, phones, onRefresh }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [editPhone, setEditPhone] = useState<Phone | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [showBrandDialog, setShowBrandDialog] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const [formData, setFormData] = useState({
    brand_id: 0,
    model: '',
    ram: 8,
    storage: 128,
    color: '',
    price: 0,
    networkType: '5G',
    availability: '正常'
  });

  useEffect(() => {
    if (open) {
      loadBrands();
    }
  }, [open]);

  const loadBrands = async () => {
    try {
      const data = await fetchBrands();
      setBrands(data);
    } catch (error) {
      console.error('Failed to load brands:', error);
    }
  };

  const handleAdd = () => {
    setIsAddMode(true);
    setEditPhone(null);
    setFormData({
      brand_id: brands[0]?.id || 0,
      model: '',
      ram: 8,
      storage: 128,
      color: '',
      price: 0,
      networkType: '5G',
      availability: '正常'
    });
  };

  const handleEdit = (phone: Phone) => {
    setIsAddMode(false);
    setEditPhone(phone);
    setFormData({
      brand_id: phone.brand_id || brands.find(b => b.name === phone.brand)?.id || 0,
      model: phone.model,
      ram: phone.ram,
      storage: phone.storage,
      color: phone.color,
      price: phone.price,
      networkType: phone.networkType || phone.network_type || '5G',
      availability: phone.availability
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这个手机吗？')) return;
    try {
      await deletePhone(id);
      setSnackbar({ open: true, message: '删除成功', severity: 'success' });
      onRefresh();
    } catch (error) {
      setSnackbar({ open: true, message: '删除失败', severity: 'error' });
    }
  };

  const handleSubmit = async () => {
    // 表单验证
    if (!formData.brand_id) {
      setSnackbar({ open: true, message: '请选择品牌', severity: 'error' });
      return;
    }
    if (!formData.model.trim()) {
      setSnackbar({ open: true, message: '请输入型号', severity: 'error' });
      return;
    }
    if (formData.price < 0) {
      setSnackbar({ open: true, message: '价格不能为负数', severity: 'error' });
      return;
    }
    
    try {
      if (isAddMode) {
        await addPhone(formData);
        setSnackbar({ open: true, message: '添加成功', severity: 'success' });
      } else if (editPhone?.id) {
        await updatePhone(editPhone.id, formData);
        setSnackbar({ open: true, message: '更新成功', severity: 'success' });
      }
      setEditPhone(null);
      setIsAddMode(false);
      onRefresh();
    } catch (error) {
      setSnackbar({ open: true, message: '操作失败', severity: 'error' });
    }
  };

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return;
    try {
      await addBrand(newBrandName);
      setSnackbar({ open: true, message: '品牌添加成功', severity: 'success' });
      setNewBrandName('');
      setShowBrandDialog(false);
      loadBrands();
    } catch (error) {
      setSnackbar({ open: true, message: '品牌添加失败', severity: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700}>📱 设备管理</Typography>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            添加手机
          </Button>
          <Button variant="outlined" onClick={() => setShowBrandDialog(true)}>
            添加品牌
          </Button>
        </Box>

        {(isAddMode || editPhone) && (
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#f8fafc' }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              {isAddMode ? '添加新手机' : '编辑手机'}
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' } }}>
              <FormControl fullWidth size="small">
                <InputLabel>品牌</InputLabel>
                <Select
                  value={formData.brand_id}
                  label="品牌"
                  onChange={(e) => setFormData({ ...formData, brand_id: Number(e.target.value) })}
                >
                  {brands.map(b => (
                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="型号"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
              <TextField
                size="small"
                label="内存 (GB)"
                type="number"
                value={formData.ram}
                onChange={(e) => setFormData({ ...formData, ram: Number(e.target.value) })}
              />
              <TextField
                size="small"
                label="存储 (GB)"
                type="number"
                value={formData.storage}
                onChange={(e) => setFormData({ ...formData, storage: Number(e.target.value) })}
              />
              <TextField
                size="small"
                label="颜色"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
              <TextField
                size="small"
                label="价格"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              />
              <FormControl fullWidth size="small">
                <InputLabel>网络</InputLabel>
                <Select
                  value={formData.networkType}
                  label="网络"
                  onChange={(e) => setFormData({ ...formData, networkType: e.target.value })}
                >
                  <MenuItem value="5G">5G</MenuItem>
                  <MenuItem value="4G">4G</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>库存</InputLabel>
                <Select
                  value={formData.availability}
                  label="库存"
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                >
                  <MenuItem value="现货">现货</MenuItem>
                  <MenuItem value="正常">正常</MenuItem>
                  <MenuItem value="怕抓">怕抓</MenuItem>
                  <MenuItem value="没货">没货</MenuItem>
                  <MenuItem value="原封">原封</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={handleSubmit}>
                {isAddMode ? '添加' : '保存'}
              </Button>
              <Button variant="outlined" onClick={() => { setEditPhone(null); setIsAddMode(false); }}>
                取消
              </Button>
            </Box>
          </Paper>
        )}

        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>品牌</TableCell>
                <TableCell>型号</TableCell>
                <TableCell>配置</TableCell>
                <TableCell>颜色</TableCell>
                <TableCell align="right">价格</TableCell>
                <TableCell>网络</TableCell>
                <TableCell>库存</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {phones.map((phone, index) => (
                <TableRow key={phone.id || index} hover>
                  <TableCell>{phone.brand}</TableCell>
                  <TableCell>{phone.model}</TableCell>
                  <TableCell>{phone.ram}+{phone.storage}GB</TableCell>
                  <TableCell>{phone.color}</TableCell>
                  <TableCell align="right">¥{(phone.price || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip label={phone.networkType} size="small" color={phone.networkType === '5G' ? 'primary' : 'default'} />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={phone.availability} 
                      size="small" 
                      color={
                        phone.availability === '现货' ? 'success' :
                        phone.availability === '怕抓' ? 'warning' :
                        phone.availability === '没货' ? 'error' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEdit(phone)}><EditIcon fontSize="small" /></IconButton>
                    {phone.id && (
                      <IconButton size="small" color="error" onClick={() => handleDelete(phone.id!)}><DeleteIcon fontSize="small" /></IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <Dialog open={showBrandDialog} onClose={() => setShowBrandDialog(false)}>
        <DialogTitle>添加品牌</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="品牌名称"
            fullWidth
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBrandDialog(false)}>取消</Button>
          <Button onClick={handleAddBrand} variant="contained">添加</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default AdminPanel;
