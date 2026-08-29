import { apiClient } from './apiClient';

export const scanFood = async (imageFile: File | Blob) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  const response = await apiClient.post('/scanner/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data?.data;
};

export const scanBarcode = async (barcode: string) => {
  const response = await apiClient.post('/scanner/analyze', { barcode });
  return response.data?.data;
};

export const getProductDetails = async (barcode: string) => {
  const response = await apiClient.get(`/food/product/${barcode}`);
  return response.data?.data;
};
