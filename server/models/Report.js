/**
 * Report Model for Storing Generated Health Summaries
 */

const memoryDb = require('../../database/memoryStore');

class Report {
  static async create(reportData) {
    return memoryDb.create('reports', {
      userId: reportData.userId,
      type: reportData.type, // 'weekly' | 'monthly'
      periodStart: reportData.periodStart,
      periodEnd: reportData.periodEnd,
      summary: reportData.summary,
      healthScoreAverage: reportData.healthScoreAverage,
      nutritionAverage: reportData.nutritionAverage,
      activityAverage: reportData.activityAverage,
      aiInsights: reportData.aiInsights,
      generatedAt: new Date().toISOString()
    });
  }

  static async findByUserId(userId) {
    const list = await memoryDb.find('reports', { userId });
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async findById(id) {
    return memoryDb.findById('reports', id);
  }
}

module.exports = Report;
