/**
 * Nutrition Log Model & Aggregation Methods
 */

const memoryDb = require('../../database/memoryStore');

class NutritionLog {
  static async create(logData) {
    const today = new Date().toISOString().split('T')[0];
    const log = {
      userId: logData.userId,
      date: logData.date || today,
      mealType: logData.mealType || 'snack', // breakfast, lunch, dinner, snack
      name: logData.name,
      calories: Number(logData.calories) || 0,
      protein: Number(logData.protein) || 0,
      carbs: Number(logData.carbs) || 0,
      fat: Number(logData.fat) || 0,
      fiber: Number(logData.fiber) || 0,
      ingredients: Array.isArray(logData.ingredients) ? logData.ingredients : [],
      barcode: logData.barcode || null,
      imageUrl: logData.imageUrl || null
    };

    return memoryDb.create('nutritionLogs', log);
  }

  static async findByUserAndDate(userId, date) {
    const logs = await memoryDb.find('nutritionLogs', { userId, date });
    return logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async findByUserDateRange(userId, startDate, endDate) {
    const allLogs = await memoryDb.find('nutritionLogs', { userId });
    return allLogs.filter(log => log.date >= startDate && log.date <= endDate);
  }

  static async getDailyTotals(userId, date) {
    const logs = await this.findByUserAndDate(userId, date);
    return logs.reduce(
      (acc, log) => {
        acc.calories += log.calories || 0;
        acc.protein += log.protein || 0;
        acc.carbs += log.carbs || 0;
        acc.fat += log.fat || 0;
        acc.fiber += log.fiber || 0;
        acc.itemsCount += 1;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, itemsCount: 0 }
    );
  }

  static async delete(id, userId) {
    const log = await memoryDb.findById('nutritionLogs', id);
    if (!log || log.userId !== userId) return false;
    return memoryDb.delete('nutritionLogs', id);
  }
}

module.exports = NutritionLog;
