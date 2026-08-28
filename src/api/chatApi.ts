// This is a placeholder for the chat API
export const sendChatMessage = async (message: string) => {
  console.log("Sending message to AI:", message);
  return {
    id: Date.now().toString(),
    text: "I am an AI assistant placeholder. I can help analyze your health and food data.",
    sender: 'ai'
  };
};
