import { apiClient } from './apiClient';

export const sendChatMessage = async (message: string) => {
  const response = await apiClient.post('/chat/message', { message });
  return {
    id: Date.now().toString(),
    text: response.data?.data?.reply || response.data?.data?.aiResponse || 'No response generated.',
    sender: 'ai',
  };
};
