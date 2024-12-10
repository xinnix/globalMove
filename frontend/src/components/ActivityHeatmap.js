import React from 'react';
import { Box, Typography, Tooltip, Stack } from '@mui/material';
import { format, eachDayOfInterval, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useTranslation } from 'react-i18next';

const ActivityHeatmap = ({ activities = [], stats = { notes: 158, tags: 5, days: 1294 } }) => {
  const { t } = useTranslation();
  
  // 确保 activities 是数组
  const activityData = Array.isArray(activities) ? activities : [];
  
  // 获取最近4个月的日期
  const today = new Date();
  const startDate = startOfMonth(subDays(today, 90)); // 从3个月前的月初开始
  const dates = eachDayOfInterval({
    start: startDate,
    end: today
  });

  // 将活动数据转换为日期映射
  const activityMap = activityData.reduce((acc, activity) => {
    if (activity && activity.date) {
      const date = format(new Date(activity.date), 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + 1;
    }
    return acc;
  }, {});

  // 计算颜色深度
  const getColor = (count) => {
    if (!count) return '#f0f0f0';  // 更浅的灰色
    if (count === 1) return '#e1f8e9';  // 非常浅的绿色
    if (count <= 3) return '#81c784';  // 中等绿色
    if (count <= 5) return '#43a047';  // 深绿色
    return '#2e7d32';  // 最深的绿色
  };

  // 按月分组
  const monthGroups = dates.reduce((acc, date) => {
    const month = format(date, 'M月');  // 使用中文月份
    if (!acc[month]) acc[month] = [];
    acc[month].push(date);
    return acc;
  }, {});

  // 统计数据
  const statsItems = [
    { label: '笔记', value: stats.notes },
    { label: '标签', value: stats.tags },
    { label: '天', value: stats.days }
  ];

  // 图例数据
  const legendItems = [
    { label: t('stats.noPractice'), count: 0 },
    { label: t('stats.oneTime'), count: 1 },
    { label: t('stats.twoToThree'), count: 2 },
    { label: t('stats.fourToFive'), count: 4 },
    { label: t('stats.moreThanFive'), count: 6 }
  ];

  return (
    <Box sx={{ 
      p: 4, 
      bgcolor: 'background.paper',
      borderRadius: 2,
    }}>
      {/* 统计数字 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-around',
        mb: 4
      }}>
        {statsItems.map(({ label, value }, index) => (
          <Box key={index} sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ 
              color: 'text.secondary',
              fontWeight: 'light',
              mb: 1
            }}>
              {value}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* 热力图 */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        {/* 图例 */}
        <Stack 
          direction="row" 
          spacing={2} 
          alignItems="center"
          justifyContent="flex-end"
          sx={{ mb: 2 }}
        >
          {legendItems.map(({ label, count }, index) => (
            <Stack 
              key={index} 
              direction="row" 
              spacing={1} 
              alignItems="center"
            >
              <Box sx={{
                width: 12,
                height: 12,
                bgcolor: getColor(count),
                borderRadius: 0.5
              }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {label}
              </Typography>
            </Stack>
          ))}
        </Stack>

        {/* 月份热力图 */}
        <Box sx={{ 
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 1,
          '& > div': {
            flex: 1,
            minWidth: 'auto'
          }
        }}>
          {Object.entries(monthGroups).map(([month, dates]) => (
            <Box key={month} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)', 
                gap: 1
              }}>
                {dates.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const count = activityMap[dateStr] || 0;
                  return (
                    <Tooltip 
                      key={dateStr}
                      title={`${format(date, 'yyyy-MM-dd')}: ${count}次练习`}
                      arrow
                    >
                      <Box sx={{
                        width: 16,
                        height: 16,
                        bgcolor: getColor(count),
                        borderRadius: 0.5,
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                        '&:hover': {
                          opacity: 0.8
                        }
                      }} />
                    </Tooltip>
                  );
                })}
              </Box>
              <Typography variant="caption" sx={{ 
                color: 'text.secondary',
                textAlign: 'center',
                mt: 1
              }}>
                {month}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ActivityHeatmap;
