import * as XLSX from 'xlsx';
import { ChildProfile, DailyTaskCompletion, AppData } from '../types';

/**
 * 导出所有数据为JSON文件（用于备份）
 */
export const exportDataToJSON = (children: ChildProfile[], activeChildId: string | null, parentPassword?: string) => {
  if (children.length === 0) {
    alert('没有数据可以导出哦！');
    return;
  }

  // 创建完整的数据对象
  const data: AppData = {
    children: children,
    activeChildId: activeChildId,
    parentPassword: parentPassword
  };

  // 转换为JSON字符串，格式化输出
  const jsonString = JSON.stringify(data, null, 2);

  // 创建Blob并下载
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const fileName = `starachiever_backup_${dateStr}_${timeStr}.json`;

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * 导出所有小朋友的每日打卡明细到Excel文件
 */
export const exportChildrenToExcel = (children: ChildProfile[]) => {
  if (children.length === 0) {
    alert('没有数据可以导出哦！');
    return;
  }

  // 创建工作簿
  const workbook = XLSX.utils.book_new();

  // 为每个小朋友创建一个工作表
  children.forEach(child => {
    const sheetData = [];

    // 基本信息
    sheetData.push(['小朋友档案', '']);
    sheetData.push(['姓名', child.name]);
    sheetData.push(['头像', child.avatar]);
    sheetData.push(['当前积分', child.totalPoints]);
    sheetData.push(['连续打卡天数', child.currentStreak]);
    sheetData.push(['最后登录日期', child.lastLoginDate]);
    sheetData.push([]);

    // 统计数据
    sheetData.push(['累计统计', '']);
    sheetData.push(['完成任务总数', child.stats.totalTasksCompleted]);
    sheetData.push(['获得积分总数', child.stats.totalPointsEarned]);
    sheetData.push(['兑换奖励次数', child.stats.totalRewardsRedeemed || child.redemptions?.length || 0]);
    sheetData.push(['累计消耗积分', child.redemptions?.reduce((sum, r) => sum + r.cost, 0) || 0]);
    sheetData.push(['学习类任务', child.stats.categoryCounts.learning || 0]);
    sheetData.push(['健康类任务', child.stats.categoryCounts.health || 0]);
    sheetData.push(['家务类任务', child.stats.categoryCounts.chores || 0]);
    sheetData.push(['其他类任务', child.stats.categoryCounts.other || 0]);
    sheetData.push([]);

    // 积分消耗记录
    sheetData.push(['积分消耗记录', '']);
    sheetData.push([]);

    if (!child.redemptions || child.redemptions.length === 0) {
      sheetData.push(['暂无兑换记录', '']);
    } else {
      // 表头
      sheetData.push(['日期', '时间', '奖励名称', '奖励图标', '消耗积分']);
      sheetData.push([]);

      // 按日期排序（从新到旧）
      const sortedRedemptions = [...child.redemptions].sort((a, b) => b.date.localeCompare(a.date));

      sortedRedemptions.forEach(redemption => {
        // 格式化时间
        const redeemedTime = new Date(redemption.redeemedAt);
        const timeStr = redeemedTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        sheetData.push([
          redemption.date,
          timeStr,
          redemption.rewardTitle,
          redemption.rewardIcon,
          redemption.cost
        ]);
      });

      // 兑换汇总
      const totalCost = child.redemptions.reduce((sum, r) => sum + r.cost, 0);
      const totalCount = child.redemptions.length;
      sheetData.push([]);
      sheetData.push(['累计兑换', `共 ${totalCount} 次`, `消耗 ${totalCost} 积分`, '', '']);
    }
    sheetData.push([]);

    // 每日打卡明细
    sheetData.push(['每日打卡明细', '']);
    sheetData.push([]);

    // 检查是否有详细历史记录
    const dailyHistoryEntries = Object.entries(child.dailyHistory || {});

    if (dailyHistoryEntries.length === 0) {
      sheetData.push(['暂无详细记录', '从今天开始会记录每日完成任务的详细信息哦！']);
    } else {
      // 表头
      sheetData.push(['日期', '任务序号', '任务名称', '任务图标', '积分', '类别', '完成时间']);
      sheetData.push([]); // 空行

      // 按日期排序（从新到旧）
      const sortedEntries = dailyHistoryEntries.sort(([a], [b]) => b.localeCompare(a));

      sortedEntries.forEach(([date, dailyData]: [string, DailyTaskCompletion]) => {
        dailyData.tasks.forEach((task, index) => {
          const categoryMap: Record<string, string> = {
            'learning': '学习',
            'health': '健康',
            'chores': '家务',
            'other': '其他'
          };

          // 格式化完成时间
          const completedTime = new Date(task.completedTime);
          const timeStr = completedTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          sheetData.push([
            date,
            index + 1,
            task.title,
            task.icon,
            task.points,
            categoryMap[task.category] || task.category,
            timeStr
          ]);
        });

        // 每日汇总行
        sheetData.push([
          `${date} 小计`,
          `共完成 ${dailyData.totalTasks} 个任务`,
          '',
          '',
          `获得 ${dailyData.totalPoints} 积分`,
          '',
          ''
        ]);
        sheetData.push([]); // 日期之间空一行
      });
    }

    // 如果有旧的历史数据（只有数量没有详情），也导出来
    const oldHistoryEntries = Object.entries(child.history || {}).filter(
      ([date]) => !child.dailyHistory || !child.dailyHistory[date]
    );

    if (oldHistoryEntries.length > 0) {
      sheetData.push([]);
      sheetData.push(['历史记录（仅数量）', '']);
      sheetData.push(['日期', '完成任务数']);
      oldHistoryEntries.forEach(([date, count]) => {
        sheetData.push([date, count]);
      });
    }

    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // 设置列宽
    worksheet['!cols'] = [
      { wch: 15 }, // 日期
      { wch: 12 }, // 任务序号/时间
      { wch: 25 }, // 任务名称/奖励名称
      { wch: 8 },  // 任务图标/奖励图标
      { wch: 10 }, // 积分/消耗积分
      { wch: 10 }, // 类别
      { wch: 20 }  // 完成时间
    ];

    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, child.name);
  });

  // 生成Excel文件并下载
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const fileName = `小朋友打卡明细_${dateStr}_${timeStr}.xlsx`;

  XLSX.writeFile(workbook, fileName);
};
