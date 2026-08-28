// This is a placeholder for the user API
export const getUserProfile = async () => {
  return {
    name: "John Doe",
    email: "john.doe@example.com",
    height: 175,
    weight: 71.2,
    bmi: 22.4,
    bloodType: "O+"
  };
};

export const updateHealthProfile = async (data: any) => {
  console.log("Updating profile:", data);
  return { success: true };
};
