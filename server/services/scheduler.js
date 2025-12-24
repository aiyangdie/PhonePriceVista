/**
 * 定时任务服务
 * 每天凌晨0点自动同步手机数据（图片、参数、官方价格）
 */

const pool = require('../config/db');
const phoneCrawler = require('./phoneCrawler');

// 存储定时器
let scheduledTask = null;

// 计算到下一个0点的毫秒数
function getMillisecondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

// 同步所有手机数据
async function syncAllPhoneData() {
  console.log('========================================');
  console.log(`[${new Date().toLocaleString()}] 开始自动同步手机数据...`);
  console.log('========================================');
  
  try {
    // 获取所有手机
    const [phones] = await pool.query(`
      SELECT p.id, p.model, p.price, b.name as brand_name 
      FROM phones p 
      LEFT JOIN brands b ON p.brand_id = b.id
    `);
    
    let successCount = 0;
    let failedCount = 0;
    let priceUpdated = 0;
    
    for (const phone of phones) {
      const info = await phoneCrawler.getPhoneInfo(phone.brand_name, phone.model);
      
      if (info) {
        try {
          // 更新手机数据（图片、参数、官方价格）
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
              os = COALESCE(?, os),
              updated_at = NOW()
            WHERE id = ?
          `, [info.image, info.official_price, info.screen_size, info.battery, 
              info.cpu, info.camera, info.weight, info.dimensions, info.os, phone.id]);
          
          // 记录价格历史（如果价格有变化）
          if (info.official_price && info.official_price !== phone.price) {
            await pool.query(`
              INSERT INTO price_history (phone_id, price, price_type, recorded_at) 
              VALUES (?, ?, 'official', NOW())
            `, [phone.id, info.official_price]);
            priceUpdated++;
          }
          
          successCount++;
        } catch (err) {
          console.error(`同步失败 [${phone.brand_name} ${phone.model}]:`, err.message);
          failedCount++;
        }
      } else {
        failedCount++;
      }
    }
    
    // 记录同步日志
    await pool.query(`
      INSERT INTO sync_logs (sync_type, total_records, success_records, failed_records, status, synced_at) 
      VALUES ('auto', ?, ?, ?, 'completed', NOW())
    `, [phones.length, successCount, failedCount]);
    
    console.log('========================================');
    console.log(`[${new Date().toLocaleString()}] 同步完成!`);
    console.log(`总计: ${phones.length}, 成功: ${successCount}, 失败: ${failedCount}, 价格更新: ${priceUpdated}`);
    console.log('========================================');
    
    return { total: phones.length, success: successCount, failed: failedCount, priceUpdated };
  } catch (error) {
    console.error('自动同步失败:', error);
    
    // 记录失败日志
    await pool.query(`
      INSERT INTO sync_logs (sync_type, total_records, success_records, failed_records, status, error_message, synced_at) 
      VALUES ('auto', 0, 0, 0, 'failed', ?, NOW())
    `, [error.message]);
    
    throw error;
  }
}

// 启动定时任务
function startScheduler() {
  console.log('[Scheduler] 定时任务服务已启动');
  console.log('[Scheduler] 将在每天凌晨 0:00 自动同步数据');
  
  // 计算到下一个0点的时间
  const msUntilMidnight = getMillisecondsUntilMidnight();
  const hoursUntil = Math.floor(msUntilMidnight / 1000 / 60 / 60);
  const minutesUntil = Math.floor((msUntilMidnight / 1000 / 60) % 60);
  
  console.log(`[Scheduler] 下次同步时间: ${hoursUntil}小时${minutesUntil}分钟后`);
  
  // 设置第一次执行（在下一个0点）
  scheduledTask = setTimeout(() => {
    syncAllPhoneData();
    
    // 之后每24小时执行一次
    scheduledTask = setInterval(() => {
      syncAllPhoneData();
    }, 24 * 60 * 60 * 1000); // 24小时
    
  }, msUntilMidnight);
}

// 停止定时任务
function stopScheduler() {
  if (scheduledTask) {
    clearTimeout(scheduledTask);
    clearInterval(scheduledTask);
    scheduledTask = null;
    console.log('[Scheduler] 定时任务已停止');
  }
}

// 手动触发同步
async function manualSync() {
  console.log('[Scheduler] 手动触发同步...');
  return await syncAllPhoneData();
}

// 获取同步状态
async function getSyncStatus() {
  try {
    const [logs] = await pool.query(`
      SELECT * FROM sync_logs ORDER BY synced_at DESC LIMIT 10
    `);
    
    const [nextSync] = await pool.query(`
      SELECT NOW() as now
    `);
    
    const msUntilMidnight = getMillisecondsUntilMidnight();
    const nextSyncTime = new Date(Date.now() + msUntilMidnight);
    
    return {
      isRunning: scheduledTask !== null,
      nextSyncTime: nextSyncTime.toISOString(),
      recentLogs: logs
    };
  } catch (error) {
    console.error('获取同步状态失败:', error);
    return { isRunning: false, error: error.message };
  }
}

module.exports = {
  startScheduler,
  stopScheduler,
  manualSync,
  syncAllPhoneData,
  getSyncStatus
};
