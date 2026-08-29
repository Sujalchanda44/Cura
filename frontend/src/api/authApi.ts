import { apiClient } from './apiClient';

export const loginUser = async (credentials: any) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data?.data;
};

export const registerUser = async (userData: any) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data?.data;
};
