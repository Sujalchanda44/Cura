// This is a placeholder for the health API
export const getDashboardData = async () => {
  return {
    score: 85,
    weight: 71.2,
    bmi: 22.4,
    water: 1.8,
    caloriesBurned: 1450,
    sleep: "7h 12m",
    exercise: "45m"
  };
};

export const getHealthReports = async () => {
  return {
    weeklyData: [],
    exerciseLog: []
  };
};
