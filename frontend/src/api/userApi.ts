import { apiClient } from './apiClient';

export const getUserProfile = async () => {
  const response = await apiClient.get('/user/profile');
  return response.data?.data;
};

export const updateUserProfile = async (userData: any) => {
  const response = await apiClient.put('/user/profile', userData);
  return response.data?.data;
};

export const updateHealthProfile = async (data: any) => {
  const response = await apiClient.put('/health-profile', data);
  return response.data?.data;
};

export const changePassword = async (data: any) => {
  const response = await apiClient.put('/user/change-password', data);
  return response.data?.data;
};

export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await apiClient.post('/user/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data?.data;
};

export const uploadAvatarBase64 = async (base64: string) => {
  const response = await apiClient.post('/user/avatar', { avatarBase64: base64 });
  return response.data?.data;
};

export const deleteAvatar = async () => {
  const response = await apiClient.delete('/user/avatar');
  return response.data?.data;
};

export const getGoalAnalysis = async (goalOptions?: any) => {
  const response = await apiClient.post('/ai/goal-analysis', goalOptions || {});
  return response.data?.data;
};

export const updateHealthGoals = async (goalData: any) => {
  const response = await apiClient.put('/health-profile', goalData);
  return response.data?.data;
};

