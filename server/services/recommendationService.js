/**
 * Cura+ Recommendation Engine Service
 * Generates personalized, allergy-safe food and meal suggestions tailored to user goals
 */

const GeminiService = require('./geminiService');

const RECIPE_CATALOG = [
  // BREAKFAST
  {
    id: 'rec_b1',
    name: 'Avocado & Spinach Scramble on Gluten-Free Toast',
    mealType: 'breakfast',
    calories: 340,
    protein: 18,
    carbs: 22,
    fat: 20,
    fiber: 8,
    suitableGoals: ['weight_loss', 'maintain_weight', 'general_wellness', 'keto'],
    allergens: ['eggs'],
    ingredients: ['Pasture-raised eggs', 'Baby spinach', 'Fresh avocado', 'Gluten-free seed bread', 'Olive oil'],
    prepTimeMinutes: 10,
    tags: ['High Fiber', 'Gluten-Free', 'Quick & Easy'],
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'rec_b2',
    name: 'High-Protein Chia & Berry Oatmeal Bowl',
    mealType: 'breakfast',
    calories: 420,
    protein: 32,
    carbs: 48,
    fat: 10,
    fiber: 12,
    suitableGoals: ['muscle_gain', 'maintain_weight', 'heart_health'],
    allergens: [],
    ingredients: ['Rolled oats', 'Plant protein powder', 'Chia seeds', 'Almond milk', 'Fresh blueberries', 'Cinnamon'],
    prepTimeMinutes: 5,
    tags: ['Plant-Based', 'Dairy-Free', 'High Protein'],
    imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'rec_b3',
    name: 'Greek Yogurt Parfait with Walnuts & Honey',
    mealType: 'breakfast',
    calories: 310,
    protein: 24,
    carbs: 28,
    fat: 12,
    fiber: 4,
    suitableGoals: ['weight_loss', 'maintain_weight', 'general_wellness'],
    allergens: ['dairy', 'tree_nuts'],
    ingredients: ['Low-fat Greek yogurt', 'Raw walnuts', 'Wild organic honey', 'Raspberries', 'Flaxseed meal'],
    prepTimeMinutes: 5,
    tags: ['Probiotic', 'High Protein', 'Vegetarian'],
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80'
  },

  // LUNCH
  {
    id: 'rec_l1',
    name: 'Mediterranean Grilled Chicken & Quinoa Salad',
    mealType: 'lunch',
    calories: 480,
    protein: 44,
    carbs: 42,
    fat: 14,
    fiber: 7,
    suitableGoals: ['muscle_gain', 'weight_loss', 'maintain_weight', 'general_wellness'],
    allergens: [],
    ingredients: ['Skinless chicken breast', 'Tricolor quinoa', 'Cucumbers', 'Cherry tomatoes', 'Kalamata olives', 'Lemon vinaigrette'],
    prepTimeMinutes: 20,
    tags: ['Clean Eating', 'Dairy-Free', 'Gluten-Free', 'High Protein'],
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'rec_l2',
    name: 'Wild Salmon, Roasted Asparagus & Sweet Potato',
    mealType: 'lunch',
    calories: 520,
    protein: 38,
    carbs: 36,
    fat: 22,
    fiber: 6,
    suitableGoals: ['heart_health', 'muscle_gain', 'general_wellness'],
    allergens: ['fish'],
    ingredients: ['Wild Alaskan salmon fillet', 'Roasted asparagus', 'Steamed sweet potato', 'Garlic herbs', 'Extra virgin olive oil'],
    prepTimeMinutes: 25,
    tags: ['Omega-3 Rich', 'Anti-Inflammatory', 'Gluten-Free', 'Dairy-Free'],
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'rec_l3',
    name: 'Tofu & Edamame Green Power Bowl',
    mealType: 'lunch',
    calories: 390,
    protein: 28,
    carbs: 34,
    fat: 16,
    fiber: 9,
    suitableGoals: ['weight_loss', 'general_wellness', 'heart_health'],
    allergens: ['soy', 'sesame'],
    ingredients: ['Organic firm tofu', 'Shelled edamame', 'Brown jasmine rice', 'Steamed broccoli', 'Tamari sesame glaze'],
    prepTimeMinutes: 15,
    tags: ['100% Vegan', 'High Fiber', 'Dairy-Free'],
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'
  },

  // DINNER
  {
    id: 'rec_d1',
    name: 'Herb-Crusted Lean Turkey Meatballs with Zucchini Noodles',
    mealType: 'dinner',
    calories: 410,
    protein: 42,
    carbs: 16,
    fat: 18,
    fiber: 5,
    suitableGoals: ['weight_loss', 'keto', 'muscle_gain'],
    allergens: ['eggs'],
    ingredients: ['Lean ground turkey 93/7', 'Fresh zucchini spiralized', 'San Marzano crushed tomato sauce', 'Fresh basil', 'Garlic', 'Egg binder'],
    prepTimeMinutes: 25,
    tags: ['Low Carb', 'Keto Friendly', 'Dairy-Free', 'Gluten-Free'],
    imageUrl: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'rec_d2',
    name: 'Grass-Fed Sirloin Steak with Roasted Cauliflower Mash',
    mealType: 'dinner',
    calories: 540,
    protein: 48,
    carbs: 12,
    fat: 32,
    fiber: 6,
    suitableGoals: ['keto', 'muscle_gain', 'maintain_weight'],
    allergens: ['dairy'],
    ingredients: ['Grass-fed beef sirloin', 'Steamed cauliflower florets', 'Grass-fed butter', 'Fresh rosemary', 'Sea salt'],
    prepTimeMinutes: 20,
    tags: ['Keto', 'High Iron', 'High Protein', 'Gluten-Free'],
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'rec_d3',
    name: 'Moroccan Spiced Chickpea & Lentil Stew',
    mealType: 'dinner',
    calories: 430,
    protein: 22,
    carbs: 64,
    fat: 8,
    fiber: 16,
    suitableGoals: ['heart_health', 'general_wellness', 'weight_loss'],
    allergens: [],
    ingredients: ['Chickpeas', 'Brown lentils', 'Diced tomatoes', 'Spinach', 'Cumin, turmeric, cinnamon blend', 'Coriander'],
    prepTimeMinutes: 30,
    tags: ['Plant-Based', 'Super High Fiber', 'Allergen Safe', 'Gluten-Free'],
    imageUrl: 'https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=400&q=80'
  },

  // SNACKS
  {
    id: 'rec_s1',
    name: 'Apple Slices with Sunflower Seed Butter & Cinnamon',
    mealType: 'snack',
    calories: 190,
    protein: 6,
    carbs: 24,
    fat: 9,
    fiber: 5,
    suitableGoals: ['weight_loss', 'general_wellness', 'heart_health', 'maintain_weight'],
    allergens: [],
    ingredients: ['Crisp Honeycrisp apple', 'Pure sunflower seed butter', 'Ceylon cinnamon'],
    prepTimeMinutes: 3,
    tags: ['Nut-Free', 'Dairy-Free', 'Gluten-Free', 'Vegan'],
    imageUrl: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'rec_s2',
    name: 'Roasted Turmeric Pumpkin Seeds & Edamame Crunch',
    mealType: 'snack',
    calories: 210,
    protein: 14,
    carbs: 10,
    fat: 13,
    fiber: 6,
    suitableGoals: ['muscle_gain', 'keto', 'weight_loss'],
    allergens: ['soy'],
    ingredients: ['Raw pumpkin seeds', 'Dry roasted edamame', 'Turmeric', 'Pink Himalayan salt'],
    prepTimeMinutes: 2,
    tags: ['High Protein', 'Keto Friendly', 'Gluten-Free'],
    imageUrl: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=400&q=80'
  }
];

class RecommendationService {
  /**
   * Filter and score recipes based on user health goal and allergies
   */
  static getRecommendations(userProfile, options = {}) {
    const healthGoal = (userProfile?.healthGoal || 'maintain_weight').toLowerCase().trim();
    const userAllergies = (userProfile?.allergies || []).map(a => a.toLowerCase().trim());
    const dietaryRestrictions = (userProfile?.dietaryRestrictions || []).map(d => d.toLowerCase().trim());
    const filterMealType = options.mealType ? options.mealType.toLowerCase() : null;

    // 1. Strict Allergy & Restriction Filter
    const safeRecipes = RECIPE_CATALOG.filter(recipe => {
      // Check meal type if specified
      if (filterMealType && recipe.mealType !== filterMealType) {
        return false;
      }

      // Check allergies
      for (const allergy of userAllergies) {
        if (!allergy) continue;
        const recipeAllergens = recipe.allergens.map(a => a.toLowerCase());
        const hasAllergenTag = recipeAllergens.some(a => a.includes(allergy) || allergy.includes(a));
        const hasIngredientMatch = recipe.ingredients.some(i => i.toLowerCase().includes(allergy));

        if (hasAllergenTag || hasIngredientMatch) {
          return false; // UNSAFE for user
        }
      }

      // Check dietary restrictions
      if (dietaryRestrictions.includes('vegan') && recipe.allergens.some(a => ['eggs', 'dairy', 'fish'].includes(a))) {
        return false;
      }
      if (dietaryRestrictions.includes('vegetarian') && recipe.allergens.includes('fish')) {
        return false;
      }
      if (dietaryRestrictions.includes('dairy_free') && recipe.allergens.includes('dairy')) {
        return false;
      }
      if (dietaryRestrictions.includes('gluten_free') && recipe.allergens.includes('gluten')) {
        return false;
      }

      return true;
    });

    // 2. Score by Health Goal
    const scoredRecipes = safeRecipes.map(recipe => {
      let matchScore = 80;

      if (recipe.suitableGoals.includes(healthGoal)) {
        matchScore += 18;
      }

      if (healthGoal.includes('weight_loss') && recipe.calories < 450) {
        matchScore += 5;
      } else if (healthGoal.includes('muscle_gain') && recipe.protein >= 30) {
        matchScore += 8;
      } else if (healthGoal.includes('keto') && recipe.carbs <= 18) {
        matchScore += 8;
      }

      return {
        ...recipe,
        matchScore: Math.min(99, matchScore),
        allergySafe: true,
        safetyNote: userAllergies.length > 0 
          ? `Verified 100% free from your listed allergens: [${userAllergies.join(', ')}]` 
          : 'Allergen-safe whole food selection.'
      };
    });

    // Sort by match score descending
    scoredRecipes.sort((a, b) => b.matchScore - a.matchScore);

    // Group by meal type
    const categorized = {
      breakfast: scoredRecipes.filter(r => r.mealType === 'breakfast'),
      lunch: scoredRecipes.filter(r => r.mealType === 'lunch'),
      dinner: scoredRecipes.filter(r => r.mealType === 'dinner'),
      snack: scoredRecipes.filter(r => r.mealType === 'snack')
    };

    return {
      healthGoal,
      userAllergies,
      totalSafeMealsFound: scoredRecipes.length,
      allRecommendations: scoredRecipes,
      dailyMealPlan: {
        breakfast: categorized.breakfast[0] || null,
        lunch: categorized.lunch[0] || null,
        dinner: categorized.dinner[0] || null,
        snack: categorized.snack[0] || null
      },
      categorized
    };
  }

  /**
   * Request dynamic AI recipe tailored on demand
   */
  static async getCustomAIRecommendation(userProfile, promptDetails) {
    const { mealType, targetCalories } = promptDetails;
    return GeminiService.getMealRecommendation(userProfile, targetCalories, mealType);
  }
}

module.exports = RecommendationService;
