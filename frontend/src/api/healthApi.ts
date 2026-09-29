import { apiClient } from './apiClient';
import { getLocalDateString } from '@/lib/utils';

export const getDashboardData = async (date?: string) => {
  const targetDate = date || getLocalDateString();
  const response = await apiClient.get('/dashboard/summary', { params: { date: targetDate } });
  return response.data?.data;
};

export const getHealthDashboard = async (date?: string) => {
  const targetDate = date || getLocalDateString();
  const response = await apiClient.get('/health/dashboard', { params: { date: targetDate } });
  return response.data?.data;
};

export const getHealthScore = async (date?: string) => {
  const targetDate = date || getLocalDateString();
  const response = await apiClient.get('/dashboard/health-score', { params: { date: targetDate } });
  return response.data?.data;
};

export const getWeeklyReport = async () => {
  const response = await apiClient.get('/dashboard/weekly-report');
  return response.data?.data;
};

export const getMonthlyReport = async () => {
  const response = await apiClient.get('/dashboard/monthly-report');
  return response.data?.data;
};

export const saveOnboarding = async (data: any) => {
  const response = await apiClient.post('/user/onboarding', data);
  return response.data?.data;
};

export const logDailyMetric = async (data: any) => {
  const payload = {
    ...data,
    date: data?.date || getLocalDateString()
  };
  const response = await apiClient.post('/health/daily-log', payload);
  return response.data?.data;
};

export const getNotifications = async () => {
  const response = await apiClient.get('/notifications');
  return response.data?.data;
};

export const createMedicineReminder = async (data: any) => {
  const response = await apiClient.post('/notifications/medicine-reminder', data);
  return response.data?.data;
};

export const toggleReminder = async (id: string) => {
  const response = await apiClient.patch(`/notifications/${id}/toggle`);
  return response.data?.data;
};

export const deleteReminder = async (id: string) => {
  const response = await apiClient.delete(`/notifications/${id}`);
  return response.data?.data;
};

export const downloadPdfReport = async () => {
  const response = await apiClient.get('/reports/download-pdf', {
    responseType: 'blob',
  });
  return response.data;
};

export const getHealthReports = async () => {
  const [weeklyReport, notifications] = await Promise.all([
    getWeeklyReport(),
    getNotifications(),
  ]);

  return {
    weeklyData: weeklyReport || [],
    exerciseLog: (notifications || []).filter((n: any) => n.type === 'workout'),
  };
};
