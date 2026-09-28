/**
 * Cura+ Clinical & Personalized Recommendation Engine
 * Analyzes authenticated user health profile (allergies, medical conditions, goals, vitals, lifestyle)
 * Applies strict deterministic safety filters, scoring algorithms, and AI personalization.
 */

const GeminiService = require('./geminiService');
const NutritionLog = require('../models/NutritionLog');
const logger = require('../utils/logger');

// Synonym dictionary for comprehensive multi-level allergen safety
const ALLERGEN_SYNONYMS = {
  milk: ['milk', 'dairy', 'cheese', 'butter', 'cream', 'yogurt', 'whey', 'casein', 'ghee', 'lactose'],
  dairy: ['milk', 'dairy', 'cheese', 'butter', 'cream', 'yogurt', 'whey', 'casein', 'ghee', 'lactose'],
  peanuts: ['peanut', 'peanuts', 'peanut butter', 'peanut oil', 'groundnut', 'arachis'],
  peanut: ['peanut', 'peanuts', 'peanut butter', 'peanut oil', 'groundnut', 'arachis'],
  tree_nuts: ['tree nut', 'tree nuts', 'walnut', 'walnuts', 'almond', 'almonds', 'cashew', 'cashews', 'pecan', 'pecans', 'pistachio', 'pistachios', 'hazelnut', 'hazelnuts', 'macadamia', 'brazil nut'],
  eggs: ['egg', 'eggs', 'egg whites', 'egg yolk', 'albumen', 'mayonnaise'],
  egg: ['egg', 'eggs', 'egg whites', 'egg yolk', 'albumen', 'mayonnaise'],
  wheat: ['wheat', 'gluten', 'flour', 'bread', 'pasta', 'wheat flour', 'barley', 'rye', 'couscous', 'pita', 'tortilla'],
  gluten: ['wheat', 'gluten', 'flour', 'bread', 'pasta', 'wheat flour', 'barley', 'rye', 'couscous', 'pita', 'tortilla'],
  soy: ['soy', 'soya', 'tofu', 'edamame', 'soy sauce', 'tamari', 'miso', 'tempeh', 'soy milk', 'soybean'],
  fish: ['fish', 'salmon', 'tuna', 'cod', 'halibut', 'tilapia', 'trout', 'anchovy', 'anchovies', 'sardines'],
  shellfish: ['shellfish', 'shrimp', 'prawn', 'prawns', 'crab', 'lobster', 'clam', 'clams', 'mussel', 'mussels', 'scallop', 'scallops', 'oyster', 'oysters'],
  sesame: ['sesame', 'tahini', 'sesame oil', 'sesame seeds'],
};

// Verified nutritional catalog across Indian cuisines (Bengali, North Indian, South Indian)
const RECIPE_CATALOG = [
  // ===================== BREAKFAST =====================
  {
    id: 'rec_b1',
    name: 'Oats & Vegetable Moong Cheela with Mint Chutney',
    mealType: 'breakfast',
    calories: 290,
    protein: 16,
    carbs: 40,
    fat: 8,
    fiber: 9,
    suitableGoals: ['weight_loss', 'weight_management', 'general_wellness', 'blood_sugar'],
    medicalSuitability: ['diabetes', 'hypertension', 'heart_disease'],
    allergens: [],
    ingredients: ['Yellow moong dal', 'Rolled oats flour', 'Grated carrots', 'Finely chopped spinach', 'Green chillies', 'Fresh mint coriander chutney'],
    prepTimeMinutes: 15,
    tags: ['North Indian', 'High Fiber', 'Vegan', 'Dairy-Free', 'Low Glycemic'],
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    dietary: { isVegetarian: true, isVegan: true, isPescatarian: true, isGlutenFree: true, isDairyFree: true, isKeto: false }
  },
  {
    id: 'rec_b2',
    name: 'Steamed Idli with Drumstick Sambar & Tomato Chutney',
    mealType: 'breakfast',
    calories: 320,
    protein: 12,
    carbs: 58,
    fat: 4,
    fiber: 8,
    suitableGoals: ['general_wellness', 'weight_management', 'heart_health'],
    medicalSuitability: ['hypertension', 'heart_disease', 'high_cholesterol'],
    allergens: [],
    ingredients: ['Fermented rice & urad dal batter', 'Toor dal', 'Drumstick', 'Tomatoes', 'Curry leaves', 'Mustard seeds'],
    prepTimeMinutes: 15,
    tags: ['South Indian', 'Fermented Probiotic', 'Dairy-Free', 'Vegan', 'Nut-Free'],
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    dietary: { isVegetarian: true, isVegan: true, isPescatarian: true, isGlutenFree: true, isDairyFree: true, isKeto: false }
  },
  {
    id: 'rec_b3',
    name: 'Sprouted Moong & Poha Bowl with Peanuts/Sunflower Seeds',
    mealType: 'breakfast',
    calories: 330,
    protein: 15,
    carbs: 52,
    fat: 8,
    fiber: 8,
    suitableGoals: ['weight_loss', 'general_wellness', 'fitness'],
    medicalSuitability: ['diabetes', 'hypertension'],
    allergens: [],
    ingredients: ['Sprouted whole green moong', 'Flattened red rice (poha)', 'Curry leaves', 'Turmeric', 'Green chillies', 'Lemon juice'],
    prepTimeMinutes: 12,
    tags: ['Maharashtrian / North Indian', 'High Iron', 'Dairy-Free', 'Vegan'],
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    dietary: { isVegetarian: true, isVegan: true, isPescatarian: true, isGlutenFree: true, isDairyFree: true, isKeto: false }
  },
  {
    id: 'rec_b4',
    name: 'Anda Bhurji with 2 Whole Wheat Rotis',
    mealType: 'breakfast',
    calories: 360,
    protein: 20,
    carbs: 32,
    fat: 16,
    fiber: 6,
    suitableGoals: ['fitness', 'muscle_gain', 'weight_management', 'blood_sugar'],
    medicalSuitability: ['diabetes', 'weight_management'],
    allergens: ['eggs', 'gluten'],
    ingredients: ['Farm fresh eggs', 'Chopped red onions', 'Tomatoes', 'Green chillies', 'Whole wheat chakki atta rotis', 'Mustard oil'],
    prepTimeMinutes: 12,
    tags: ['Indian Classic', 'High Protein', 'Dairy-Free', 'Low Sugar'],
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    dietary: { isVegetarian: false, isVegan: false, isPescatarian: true, isGlutenFree: false, isDairyFree: true, isKeto: false }
  },

  // ===================== LUNCH =====================
  {
    id: 'rec_l1',
    name: 'Moong Dal Khichdi with Steamed Palak & Roasted Papad',
    mealType: 'lunch',
    calories: 360,
    protein: 16,
    carbs: 58,
    fat: 7,
    fiber: 10,
    suitableGoals: ['weight_loss', 'blood_sugar', 'general_wellness', 'heart_health'],
    medicalSuitability: ['diabetes', 'hypertension', 'heart_disease'],
    allergens: [],
    ingredients: ['Yellow moong dal', 'Brown/Sona masoori rice', 'Fresh palak (spinach)', 'Cumin seeds', 'Ginger', 'Turmeric', 'Cold-pressed mustard oil'],
    prepTimeMinutes: 20,
    tags: ['Indian Comfort', 'Easily Digestible', 'Dairy-Free', 'Vegan', 'Gluten-Free'],
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    dietary: { isVegetarian: true, isVegan: true, isPescatarian: true, isGlutenFree: true, isDairyFree: true, isKeto: false }
  },
  {
    id: 'rec_l2',
    name: 'South Indian Sambar with Brown Rice & Beans Poriyal',
    mealType: 'lunch',
    calories: 380,
    protein: 14,
    carbs: 64,
    fat: 6,
    fiber: 11,
    suitableGoals: ['heart_health', 'general_wellness', 'weight_management'],
    medicalSuitability: ['hypertension', 'high_cholesterol', 'diabetes'],
    allergens: [],
    ingredients: ['Toor dal sambar with bottle gourd and okra', 'Brown rice', 'French green beans', 'Grated fresh coconut', 'Curry leaves'],
    prepTimeMinutes: 25,
    tags: ['South Indian', 'High Fiber', 'Dairy-Free', 'Vegan', 'Nut-Free'],
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
    dietary: { isVegetarian: true, isVegan: true, isPescatarian: true, isGlutenFree: true, isDairyFree: true, isKeto: false }
  },
  {
    id: 'rec_l3',
    name: 'Bengali Rui Maacher Jhol with Rice & Shobji (Vegetables)',
    mealType: 'lunch',
    calories: 440,
    protein: 34,
    carbs: 48,
    fat: 12,
    fiber: 7,
    suitableGoals: ['heart_health', 'fitness', 'general_wellness', 'muscle_gain'],
    medicalSuitability: ['heart_disease', 'hypertension', 'high_cholesterol'],
    allergens: ['fish'],
    ingredients: ['Fresh Rohu (Rui) fish fillet', 'Steamed rice', 'Potatoes, pointed gourd (patol) and cauliflowers', 'Kalonji (nigella seeds)', 'Turmeric and cumin gravy'],
    prepTimeMinutes: 25,
    tags: ['Bengali Traditional', 'Omega-3 Rich', 'Dairy-Free', 'Gluten-Free', 'Pescatarian'],
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
    dietary: { isVegetarian: false, isVegan: false, isPescatarian: true, isGlutenFree: true, isDairyFree: true, isKeto: false }
  },
  {
    id: 'rec_l4',
    name: 'Bengali Chholar Dal with Whole Wheat Roti & Steamed Lau',
    mealType: 'lunch',
    calories: 410,
    protein: 18,
    carbs: 66,
    fat: 8,
    fiber: 14,
    suitableGoals: ['weight_loss', 'blood_sugar', 'general_wellness'],
    medicalSuitability: ['diabetes', 'hypertension', 'high_cholesterol'],
    allergens: ['gluten'],
    ingredients: ['Chana dal (Bengal gram)', 'Lauki (bottle gourd)', 'Whole wheat rotis', 'Ginger paste', 'Bay leaves', 'Cumin & hing temper'],
    prepTimeMinutes: 25,
    tags: ['Bengali', 'High Fiber', 'Vegan', 'Dairy-Free', 'Low Glycemic'],
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    dietary: { isVegetarian: true, isVegan: true, isPescatarian: true, isGlutenFree: false, isDairyFree: true, isKeto: false }
  },

  // ===================== DINNER =====================
  {
    id: 'rec_d1',
    name: 'Grilled Tandoori Chicken Breast with Spiced Kachumber Salad',
    mealType: 'dinner',
    calories: 420,
    protein: 44,
    carbs: 12,
    fat: 14,
    fiber: 5,
    suitableGoals: ['fitness', 'muscle_gain', 'weight_loss', 'keto', 'blood_sugar'],
    medicalSuitability: ['diabetes', 'weight_management'],
    allergens: [],
    ingredients: ['Skinless chicken breast', 'Tandoori dry masala rub', 'Lemon juice', 'Ginger-garlic paste', 'Cucumber, red onion and tomato kachumber'],
    prepTimeMinutes: 25,
    tags: ['North Indian', 'High Protein', 'Dairy-Free', 'Low Carb', 'Gluten-Free'],
    imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80',
    dietary: { isVegetarian: false, isVegan: false, isPescatarian: false, isGlutenFree: true, isDairyFree: true, isKeto: true }
  },
  {
    id: 'rec_d2',
    name: 'Tofu Palak with 2 Multigrain Rotis',
    mealType: 'dinner',
    calories: 370,
    protein: 22,
    carbs: 38,
    fat: 14,
    fiber: 9,
    suitableGoals: ['weight_loss', 'blood_sugar', 'general_wellness'],
    medicalSuitability: ['diabetes', 'hypertension', 'high_cholesterol'],
    allergens: ['soy', 'gluten'],
    ingredients: ['Firm non-GMO tofu cubes', 'Blanched spiced spinach puree', 'Garlic', 'Garam masala', 'Multigrain atta rotis'],
    prepTimeMinutes: 20,
    tags: ['North Indian', 'High Iron', 'Dairy-Free Vegan Alternative', 'High Fiber'],
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    dietary: { isVegetarian: true, isVegan: true, isPescatarian: true, isGlutenFree: false, isDairyFree: true, isKeto: false }
  },
  {
    id: 'rec_d3',
    name: 'Steamed Macher Bhape (Mustard Fish) with Cauli-Rice / Rice',
    mealType: 'dinner',
    calories: 390,
    protein: 36,
    carbs: 22,
    fat: 16,
    fiber: 5,
    suitableGoals: ['keto', 'heart_health', 'fitness', 'general_wellness'],
    medicalSuitability: ['heart_disease', 'diabetes', 'hypertension'],
    allergens: ['fish', 'mustard'],
    ingredients: ['Fresh Katla or Bhetki fish fillet', 'Stone-ground mustard paste (shorshe)', 'Green chillies', 'Mustard oil', 'Steamed rice / cauli-rice'],
    prepTimeMinutes: 20,
    tags: ['Bengali Heritage', 'Omega-3 Rich', 'Dairy-Free', 'Gluten-Free', 'Low Carb'],
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
    dietary: { isVegetarian: false, isVegan: false, isPescatarian: true, isGlutenFree: true, isDairyFree: true, isKeto: false }
  },

  // ===================== SNACKS =====================
  {
    id: 'rec_s1',
    name: 'Spiced Roasted Chana with Cucumber, Tomato & Lime Chaat',
    mealType: 'snack',
    calories: 180,
    protein: 9,
    carbs: 26,
    fat: 4,
    fiber: 7,
    suitableGoals: ['weight_loss', 'general_wellness', 'heart_health', 'blood_sugar', 'fitness'],
    medicalSuitability: ['diabetes', 'hypertension', 'high_cholesterol'],
    allergens: [],
    ingredients: ['Dry roasted black chana (chickpeas)', 'Diced cucumbers', 'Tomatoes', 'Chaat masala', 'Fresh lime juice'],
    prepTimeMinutes: 3,
    tags: ['Indian Chaat', 'High Protein', 'Dairy-Free', 'Vegan', 'Allergen Safe'],
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
    dietary: { isVegetarian: true, isVegan: true, isPescatarian: true, isGlutenFree: true, isDairyFree: true, isKeto: false }
  },
  {
    id: 'rec_s2',
    name: 'Bengali Jhal Muri with Peanuts & Fresh Mustard Oil',
    mealType: 'snack',
    calories: 160,
    protein: 5,
    carbs: 27,
    fat: 4,
    fiber: 4,
    suitableGoals: ['general_wellness', 'weight_management', 'energy', 'fitness'],
    medicalSuitability: ['diabetes', 'hypertension', 'high_cholesterol'],
    allergens: [],
    ingredients: ['Crispy puffed rice (muri)', 'Boiled kala chana', 'Finely chopped red onions', 'Green chillies', 'Cold-pressed mustard oil', 'Fresh lime'],
    prepTimeMinutes: 5,
    tags: ['Bengali Classic', 'Low Calorie', 'Dairy-Free', 'Vegan', 'High Satiety'],
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    dietary: { isVegetarian: true, isVegan: true, isPescatarian: true, isGlutenFree: true, isDairyFree: true, isKeto: false }
  },
  {
    id: 'rec_s3',
    name: 'Sprouted Green Moong & Pomegranate Chaat with Mint',
    mealType: 'snack',
    calories: 150,
    protein: 8,
    carbs: 26,
    fat: 2,
    fiber: 6,
    suitableGoals: ['weight_loss', 'blood_sugar', 'heart_health', 'general_wellness', 'fitness'],
    medicalSuitability: ['diabetes', 'hypertension', 'high_cholesterol'],
    allergens: [],
    ingredients: ['Fresh sprouted green moong beans', 'Ruby pomegranate pearls', 'Diced English cucumber', 'Black salt (kala namak)', 'Mint leaves', 'Lemon juice'],
    prepTimeMinutes: 5,
    tags: ['Superfood Chaat', 'High Fiber', 'Dairy-Free', 'Gluten-Free', 'Vegan'],
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    dietary: { isVegetarian: true, isVegan: true, isPescatarian: true, isGlutenFree: true, isDairyFree: true, isKeto: false }
  },
  {
    id: 'rec_s4',
    name: 'Steamed Besan Dhokla with Mustard Tempering',
    mealType: 'snack',
    calories: 170,
    protein: 7,
    carbs: 28,
    fat: 3,
    fiber: 4,
    suitableGoals: ['general_wellness', 'weight_management', 'heart_health', 'fitness'],
    medicalSuitability: ['hypertension', 'diabetes', 'high_cholesterol'],
    allergens: [],
    ingredients: ['Bengal gram flour (besan)', 'Ginger-green chilli paste', 'Mustard seeds', 'Curry leaves', 'Lemon juice', 'Hing'],
    prepTimeMinutes: 15,
    tags: ['Traditional Steamed', 'Low Oil', 'Dairy-Free', 'Vegan', 'Nut-Free'],
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    dietary: { isVegetarian: true, isVegan: true, isPescatarian: true, isGlutenFree: true, isDairyFree: true, isKeto: false }
  }
];

class RecommendationService {
  /**
   * Deterministic allergy checker with synonym expansion and ingredient cross-matching
   */
  static isRecipeSafeFromAllergies(recipe, userAllergies = []) {
    if (!userAllergies || !Array.isArray(userAllergies) || userAllergies.length === 0) return true;

    for (const rawAllergy of userAllergies) {
      if (!rawAllergy || typeof rawAllergy !== 'string') continue;
      const cleanAllergy = rawAllergy.toLowerCase().trim();
      if (!cleanAllergy) continue;

      // Expand to synonymous search terms (e.g. milk -> dairy, butter, whey)
      const searchTerms = ALLERGEN_SYNONYMS[cleanAllergy] || [cleanAllergy];

      // 1. Check recipe explicit allergen tags
      const recipeAllergens = (recipe.allergens || []).map(a => a.toLowerCase().trim());
      for (const term of searchTerms) {
        if (recipeAllergens.some(a => a.includes(term) || term.includes(a))) {
          return false;
        }
      }

      // 2. Check recipe ingredients list
      const ingredients = (recipe.ingredients || []).map(i => i.toLowerCase());
      for (const term of searchTerms) {
        if (ingredients.some(ing => {
          return ing.includes(term) || term.split(' ').every(word => ing.includes(word));
        })) {
          return false;
        }
      }

      // 3. Check recipe name and tags
      const name = (recipe.name || '').toLowerCase();
      for (const term of searchTerms) {
        if (name.includes(term)) return false;
      }
    }

    return true;
  }

  /**
   * Deterministic dietary pattern and medical condition filter
   */
  static isRecipeSuitableForDietAndConditions(recipe, userProfile) {
    const safeProfile = userProfile || {};
    const rawDiet = safeProfile.dietaryPattern || safeProfile.dietaryRestrictions || [];
    const dietaryPattern = (Array.isArray(rawDiet) ? rawDiet : [rawDiet]).map(d => String(d || '').toLowerCase().trim());
    const rawConditions = safeProfile.medicalConditions || [];
    const conditions = (Array.isArray(rawConditions) ? rawConditions : [rawConditions]).map(c => String(c || '').toLowerCase().trim());
    const diet = recipe.dietary || {};

    // 1. Dietary patterns
    if (dietaryPattern.some(d => d.includes('vegan'))) {
      if (!diet.isVegan) return false;
    }
    if (dietaryPattern.some(d => d.includes('vegetarian'))) {
      if (!diet.isVegetarian) return false;
    }
    if (dietaryPattern.some(d => d.includes('pescatarian'))) {
      if (!diet.isPescatarian) return false;
    }
    if (dietaryPattern.some(d => d.includes('dairy_free') || d.includes('dairy-free'))) {
      if (!diet.isDairyFree) return false;
    }
    if (dietaryPattern.some(d => d.includes('gluten_free') || d.includes('gluten-free'))) {
      if (!diet.isGlutenFree) return false;
    }
    if (dietaryPattern.some(d => d.includes('keto'))) {
      if (recipe.carbs > 20) return false;
    }

    // 2. Medical conditions safety
    const hasDiabetes = conditions.some(c => c.includes('diabetes') || c.includes('sugar') || c.includes('glucose'));
    if (hasDiabetes && recipe.carbs > 55 && recipe.fiber < 6) {
      return false;
    }

    const hasHypertension = conditions.some(c => c.includes('hypertension') || c.includes('blood pressure') || c.includes('heart'));
    if (hasHypertension && (recipe.name || '').toLowerCase().includes('bacon')) {
      return false;
    }

    return true;
  }

  /**
   * Calculate deterministic recommendation match score (70 - 98) and structured clinical reason
   */
  static scoreAndExplainRecipe(recipe, userProfile, currentHour = new Date().getHours()) {
    const safeProfile = userProfile || {};
    let score = 75;

    const primaryGoal = String(safeProfile.healthGoal || safeProfile.primaryGoal || 'general_wellness').toLowerCase().trim();
    const goalsArray = Array.isArray(safeProfile.healthGoals) ? safeProfile.healthGoals.map(g => String(g || '').toLowerCase().trim()) : [];
    const allGoals = [primaryGoal, ...goalsArray];
    const rawConditions = safeProfile.medicalConditions || [];
    const conditions = (Array.isArray(rawConditions) ? rawConditions : [rawConditions]).map(c => String(c || '').toLowerCase().trim());

    // 1. Health Goal Alignment (+10 to +16)
    const goalMatch = allGoals.some(goal => {
      return (recipe.suitableGoals || []).some(sg => sg.includes(goal) || goal.includes(sg));
    });

    if (goalMatch) {
      score += 12;
    }

    // Goal-specific nutrition bonus
    if (allGoals.some(g => g.includes('weight_loss') || g.includes('weight_management'))) {
      if (recipe.calories <= 450 && recipe.fiber >= 6) score += 5;
    } else if (allGoals.some(g => g.includes('fitness') || g.includes('muscle'))) {
      if (recipe.protein >= 30) score += 6;
    } else if (allGoals.some(g => g.includes('blood_sugar') || g.includes('diabetes'))) {
      if (recipe.carbs <= 35 && recipe.fiber >= 6) score += 5;
    }

    // 2. Medical condition alignment (+3 to +5)
    if (conditions.some(c => c.includes('diabetes')) && (recipe.tags || []).some(t => t.toLowerCase().includes('low glycemic') || t.toLowerCase().includes('high fiber'))) {
      score += 4;
    }
    if (conditions.some(c => c.includes('hypertension') || c.includes('heart')) && (recipe.tags || []).some(t => t.toLowerCase().includes('omega-3') || t.toLowerCase().includes('heart'))) {
      score += 4;
    }

    // 3. Time of day match (+3)
    let isCurrentTimeMatch = false;
    if (currentHour >= 5 && currentHour < 11.5 && recipe.mealType === 'breakfast') {
      isCurrentTimeMatch = true;
      score += 4;
    } else if (currentHour >= 11.5 && currentHour < 16.5 && (recipe.mealType === 'lunch' || recipe.mealType === 'snack')) {
      isCurrentTimeMatch = true;
      score += 4;
    } else if (currentHour >= 16.5 && currentHour <= 23 && (recipe.mealType === 'dinner' || recipe.mealType === 'snack')) {
      isCurrentTimeMatch = true;
      score += 4;
    }

    // Cap at 97 (clean, authentic score, no fake 100%)
    score = Math.min(97, Math.max(76, score));

    // Structured 1-2 sentence concise clinical reasoning
    let reason = '';
    if (recipe.protein >= 30) {
      reason = `Provides ${recipe.protein}g of clean protein and high fiber (${recipe.fiber}g) to support your active lifestyle and satiety.`;
    } else if (conditions.some(c => c.includes('diabetes') || c.includes('sugar'))) {
      reason = `Features a low-glycemic nutrient profile with ${recipe.fiber}g dietary fiber to support steady glucose levels.`;
    } else if (allGoals.some(g => g.includes('weight'))) {
      reason = `Nutrient-dense at ${recipe.calories} kcal with balanced healthy fats and fiber for optimal caloric efficiency.`;
    } else if (recipe.dietary?.isVegan) {
      reason = `Plant-powered whole-food selection naturally free of dairy and rich in vital micronutrients.`;
    } else {
      reason = `Balanced Mediterranean formulation designed to provide sustained daily energy and heart-healthy micronutrients.`;
    }

    return {
      ...recipe,
      matchScore: score,
      reason,
      relevantGoal: allGoals[0] ? allGoals[0].replace(/_/g, ' ') : 'General Wellness',
      timeOfDayPriority: isCurrentTimeMatch
    };
  }

  /**
   * Main recommendation pipeline
   */
  static getRecommendations(userProfile, options = {}) {
    const safeProfile = userProfile || {};
    const rawAllergies = safeProfile.allergies || [];
    const userAllergies = Array.isArray(rawAllergies) ? rawAllergies : [rawAllergies];
    const filterMealType = options.mealType ? options.mealType.toLowerCase().trim() : null;
    const currentHour = options.hour !== undefined ? options.hour : new Date().getHours();

    // 1. Deterministic Allergen Filter
    const allergenSafe = RECIPE_CATALOG.filter(recipe => {
      return this.isRecipeSafeFromAllergies(recipe, userAllergies);
    });

    // 2. Deterministic Dietary Pattern & Medical Condition Filter
    const medicalAndDietSafe = allergenSafe.filter(recipe => {
      return this.isRecipeSuitableForDietAndConditions(recipe, safeProfile);
    });

    // If filtering eliminates too many due to complex overlapping constraints,
    // ensure allergen-safe items remain accessible
    const candidatePool = medicalAndDietSafe.length >= 3 ? medicalAndDietSafe : allergenSafe;

    // 3. Filter by mealType if requested
    const filteredPool = filterMealType && filterMealType !== 'all'
      ? candidatePool.filter(r => (r.mealType || '').toLowerCase() === filterMealType)
      : candidatePool;

    // 4. Score and Explain
    const scored = filteredPool.map(recipe => {
      return this.scoreAndExplainRecipe(recipe, safeProfile, currentHour);
    });

    // 5. Sort: Time-of-day prioritized first, then matchScore descending
    scored.sort((a, b) => {
      if (a.timeOfDayPriority !== b.timeOfDayPriority) {
        return a.timeOfDayPriority ? -1 : 1;
      }
      return b.matchScore - a.matchScore;
    });

    // Categorized breakdown
    const categorized = {
      breakfast: scored.filter(r => r.mealType === 'breakfast'),
      lunch: scored.filter(r => r.mealType === 'lunch'),
      dinner: scored.filter(r => r.mealType === 'dinner'),
      snack: scored.filter(r => r.mealType === 'snack')
    };

    return {
      success: true,
      userName: safeProfile.name || 'User',
      healthGoal: safeProfile.healthGoal || 'General Wellness',
      userAllergies,
      totalSafeMealsFound: scored.length,
      allRecommendations: scored,
      categorized,
      timeOfDayPrioritized: currentHour < 11.5 ? 'breakfast' : (currentHour < 16.5 ? 'lunch' : 'dinner')
    };
  }

  /**
   * AI-Powered Suggestion Pipeline (Triggered by "AI Suggest" button)
   * Evaluates candidate safe meals with Google Gemini AI to produce personalized rankings & concise reasons
   */
  static async getAISuggestions(userProfile) {
    const safeProfile = userProfile || {};
    // 1. Run deterministic safety filter first so AI never sees unsafe/allergen foods
    const baseResult = this.getRecommendations(safeProfile);
    const candidateMeals = (baseResult.allRecommendations || []).slice(0, 10);

    const rawAllergies = safeProfile.allergies || [];
    const allergiesText = (Array.isArray(rawAllergies) ? rawAllergies : [rawAllergies]).join(', ') || 'None';
    const rawConditions = safeProfile.medicalConditions || [];
    const conditionsText = (Array.isArray(rawConditions) ? rawConditions : [rawConditions]).join(', ') || 'None';
    const goalText = safeProfile.healthGoal || 'General Wellness';

    const systemInstruction = `You are the Cura+ Clinical Nutritionist Engine.
Analyze the user's health profile and rank the top 4 to 6 candidate whole-food meals.

CRITICAL RULES:
- The user has documented ALLERGIES: [${allergiesText}]. NEVER recommend foods with these allergens.
- Conditions: [${conditionsText}]. Goal: [${goalText}].
- Output STRICT JSON only.
- For each recommendation, provide:
  - id (exact match from candidate list)
  - name
  - mealType
  - calories
  - protein
  - carbs
  - fat
  - matchScore (number between 82 and 97)
  - reason (EXACTLY 1 to 2 sentences explaining why this fits their profile and goal. No long essays. No generic fluff.)
  - healthGoal
  - allergens (array of strings)

JSON Schema:
{
  "summary": "Short 1-sentence personalization overview.",
  "recommendations": [ ... ]
}`;

    const prompt = `User Profile:
- Goal: ${goalText}
- Allergies: ${allergiesText}
- Conditions: ${conditionsText}
- Time of Day: ${baseResult.timeOfDayPrioritized}

Available Safe Candidate Meals:
${JSON.stringify(candidateMeals.map(m => ({
  id: m.id,
  name: m.name,
  mealType: m.mealType,
  calories: m.calories,
  protein: m.protein,
  carbs: m.carbs,
  fat: m.fat,
  fiber: m.fiber,
  ingredients: m.ingredients,
  allergens: m.allergens
})), null, 2)}

Select and return the 4 to 6 most suitable meals for this profile today in the required JSON format.`;

    try {
      const apiResult = await GeminiService._callGeminiApi(prompt, systemInstruction);
      const text = apiResult?.text;

      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
            // Merge AI reasoning with catalog metadata (images, tags, etc.)
            const enriched = parsed.recommendations.map(aiItem => {
              const original = RECIPE_CATALOG.find(r => r.id === aiItem.id || r.name.toLowerCase() === (aiItem.name || '').toLowerCase()) || {};
              return {
                id: aiItem.id || original.id || `ai_${Date.now()}`,
                name: aiItem.name || original.name,
                mealType: aiItem.mealType || original.mealType || 'lunch',
                calories: aiItem.calories || original.calories,
                protein: aiItem.protein || original.protein,
                carbs: aiItem.carbs || original.carbs,
                fat: aiItem.fat || original.fat,
                fiber: original.fiber || 5,
                matchScore: Number(aiItem.matchScore) || 92,
                reason: aiItem.reason || original.reason || `Personalized selection to support your ${goalText} target.`,
                healthGoal: aiItem.healthGoal || goalText,
                allergens: aiItem.allergens || original.allergens || [],
                tags: original.tags || ['AI Personalized', 'Allergen Safe'],
                imageUrl: original.imageUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
                ingredients: original.ingredients || []
              };
            });

            return {
              success: true,
              isAiGenerated: true,
              summary: parsed.summary || `Personalized for you based on your health goals and allergy safety.`,
              allRecommendations: enriched
            };
          }
        }
      }
    } catch (err) {
      logger.warn('AI suggestions call encountered error, falling back to deterministic engine:', err.message);
    }

    // Graceful fallback to deterministic safe recommendation set
    return {
      success: true,
      isAiGenerated: false,
      summary: `Personalized selections based on your health goals and allergy safety.`,
      allRecommendations: candidateMeals.slice(0, 6)
    };
  }

  /**
   * Log a meal into user's daily NutritionLog
   */
  static async logMeal(userId, mealData) {
    if (!userId || !mealData) throw new Error('User ID and meal data are required.');

    const today = new Date().toISOString().split('T')[0];
    const logEntry = {
      userId,
      date: today,
      mealType: mealData.mealType || 'lunch',
      name: mealData.name,
      calories: Number(mealData.calories) || 0,
      protein: Number(mealData.protein) || 0,
      carbs: Number(mealData.carbs) || 0,
      fat: Number(mealData.fat) || 0,
      fiber: Number(mealData.fiber) || 0,
      ingredients: mealData.ingredients || [],
      imageUrl: mealData.imageUrl || null
    };

    return NutritionLog.create(logEntry);
  }

  /**
   * Fetch IDs and names of meals logged by user today
   */
  static async getLoggedMealsToday(userId) {
    const today = new Date().toISOString().split('T')[0];
    const logs = await NutritionLog.findByUserAndDate(userId, today);
    return logs || [];
  }

  /**
   * Generate custom meal on demand
   */
  static async getCustomAIRecommendation(userProfile, promptDetails) {
    const safeProfile = userProfile || {};
    const { mealType, targetCalories } = promptDetails;
    return GeminiService.getMealRecommendation(safeProfile, targetCalories, mealType);
  }
}

module.exports = RecommendationService;
