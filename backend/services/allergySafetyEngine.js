/**
 * Clinical Allergy & Health Safety Engine
 * Deterministic evaluation of food ingredients against stored user health profiles.
 * Normalizes aliases, detects derived allergens, and enforces medical safety.
 */

class AllergySafetyEngine {
  // Common allergen and derived ingredient dictionary with boundary matching
  static ALLERGEN_DERIVATIVES = {
    milk: [
      'milk', 'dairy', 'butter', 'ghee', 'cream', 'malai', 'paneer', 'cheese',
      'curd', 'dahi', 'yogurt', 'yoghurt', 'whey', 'casein', 'caseinate',
      'milk solids', 'milk powder', 'condensed milk', 'mawa', 'khoya', 'rabri',
      'custard', 'lactose', 'makhan', 'buttermilk', 'chaas', 'lassi'
    ],
    peanuts: [
      'peanut', 'peanuts', 'groundnut', 'groundnuts', 'peanut butter',
      'peanut flour', 'peanut oil', 'arachis oil', 'moongphali', 'mungfali'
    ],
    'tree nuts': [
      'tree nut', 'tree nuts', 'almond', 'badam', 'cashew', 'kaju', 'walnut',
      'akhrot', 'pistachio', 'pista', 'hazelnut', 'pecan', 'macadamia',
      'pine nut', 'chilgoza', 'praline', 'marzipan'
    ],
    eggs: [
      'egg', 'eggs', 'egg white', 'egg yolk', 'anda', 'ande', 'albumin',
      'ovalbumin', 'mayonnaise', 'meringue', 'egg powder', 'lysozyme'
    ],
    'wheat / gluten': [
      'wheat', 'gluten', 'atta', 'maida', 'sooji', 'suji', 'semolina', 'rava',
      'durum', 'barley', 'jau', 'rye', 'malt', 'spelt', 'seitan', 'bulgur',
      'farina', 'couscous', 'breadcrumbs', 'wheat flour'
    ],
    gluten: [
      'gluten', 'wheat', 'atta', 'maida', 'sooji', 'suji', 'semolina', 'rava',
      'barley', 'rye', 'malt'
    ],
    soy: [
      'soy', 'soya', 'soybean', 'soybeans', 'soya chunks', 'edamame', 'tofu',
      'soya milk', 'soy sauce', 'tamari', 'tempeh', 'soy lecithin', 'tvp'
    ],
    seafood: [
      'fish', 'salmon', 'tuna', 'machli', 'maach', 'cod', 'mackerel',
      'pomfret', 'rohu', 'katla', 'hilsa', 'surmai', 'anchovy', 'shellfish',
      'prawn', 'prawns', 'shrimp', 'shrimps', 'jhinga', 'crab', 'lobster',
      'oyster', 'clam', 'squid'
    ],
    shellfish: [
      'shellfish', 'prawn', 'prawns', 'shrimp', 'shrimps', 'jhinga',
      'crab', 'lobster', 'oyster', 'clam', 'mussel', 'scallop'
    ],
    sesame: [
      'sesame', 'sesame seeds', 'til', 'tahini', 'gingelly oil', 'sesame oil'
    ],
    mustard: [
      'mustard', 'mustard seeds', 'mustard oil', 'sarson', 'rai', 'kasundi'
    ]
  };

  /**
   * Deterministically evaluate food against authenticated user's health profile
   */
  static evaluatePersonalizedSafety(foodData, userProfile = {}) {
    const userAllergies = (Array.isArray(userProfile.allergies) ? userProfile.allergies : []).map(a => String(a).trim());
    const userIntolerances = (Array.isArray(userProfile.foodIntolerances) ? userProfile.foodIntolerances : []).map(i => String(i).trim());
    const medicalConditions = (Array.isArray(userProfile.medicalConditions) ? userProfile.medicalConditions : []).map(c => String(c).trim());

    const foodName = foodData.foodName || foodData.identifiedFood || 'Food Item';
    const ingredients = Array.isArray(foodData.ingredients || foodData.detectedIngredients)
      ? (foodData.ingredients || foodData.detectedIngredients)
      : [];
    const allIngredientsText = `${foodName} ${ingredients.join(' ')} ${foodData.ingredientsText || ''}`.toLowerCase();

    const matchedUserAllergies = [];
    const matchedIntolerances = [];
    const healthConcerns = [];
    const profileChecks = [];
    const riskReasons = [];

    // 1. Cross-reference registered allergies
    for (const allergy of userAllergies) {
      const allergyLower = allergy.toLowerCase();
      let detectedIn = [];

      for (const [allergenKey, derivatives] of Object.entries(this.ALLERGEN_DERIVATIVES)) {
        if (allergyLower.includes(allergenKey) || allergenKey.includes(allergyLower)) {
          for (const deriv of derivatives) {
            const regex = new RegExp(`\\b${deriv}\\b`, 'i');
            if (regex.test(allIngredientsText)) {
              detectedIn.push(deriv);
            }
          }
        }
      }

      if (detectedIn.length === 0 && allIngredientsText.includes(allergyLower)) {
        detectedIn.push(allergy);
      }

      detectedIn = Array.from(new Set(detectedIn));

      if (detectedIn.length > 0) {
        const foundStr = detectedIn.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(', ');
        matchedUserAllergies.push({
          allergen: allergy,
          foundIn: foundStr,
          severity: 'HIGH',
          warning: `${allergy}-derived ingredients (${foundStr}) detected. Avoid this food based on your registered allergy.`
        });
        riskReasons.push(`${allergy}-derived ingredient (${foundStr}) detected matching your registered allergy.`);
        profileChecks.push({
          category: `Allergy: ${allergy}`,
          status: 'conflict',
          label: `${allergy} conflict detected in ${foundStr}`
        });
      } else {
        profileChecks.push({
          category: `Allergy: ${allergy}`,
          status: 'safe',
          label: `No ${allergy} detected`
        });
      }
    }

    // 2. Cross-reference food intolerances
    for (const intolerance of userIntolerances) {
      const intolLower = intolerance.toLowerCase();
      if (intolLower.includes('lactose')) {
        const dairyFound = this.ALLERGEN_DERIVATIVES.milk.filter(d => allIngredientsText.includes(d));
        if (dairyFound.length > 0) {
          const foundStr = dairyFound.slice(0, 3).join(', ');
          matchedIntolerances.push({
            intolerance: 'Lactose',
            foundIn: foundStr,
            warning: `Contains dairy ingredients (${foundStr}) which may trigger your registered lactose intolerance.`
          });
          riskReasons.push(`Dairy ingredients present which may trigger lactose intolerance.`);
          profileChecks.push({
            category: 'Intolerance: Lactose',
            status: 'caution',
            label: `Lactose-containing ingredients (${foundStr})`
          });
        } else {
          profileChecks.push({
            category: 'Intolerance: Lactose',
            status: 'safe',
            label: 'No lactose-bearing ingredients detected'
          });
        }
      }
    }

    // 3. Cross-reference medical conditions
    for (const condition of medicalConditions) {
      const condLower = condition.toLowerCase();

      if (condLower.includes('diabetes')) {
        const sugarKeywords = ['sugar', 'added sugar', 'syrup', 'glucose', 'jaggery', 'gur', 'honey', 'mithai', 'halwa', 'sweet', 'gulab jamun', 'jalebi', 'rasgulla', 'corn syrup'];
        const hasHighSugar = sugarKeywords.some(k => allIngredientsText.includes(k));
        const estSugar = Number(foodData.nutrition?.sugar || 0);

        if (hasHighSugar || estSugar > 12) {
          healthConcerns.push({
            condition: 'Diabetes',
            concern: 'High added sugar / refined carbohydrates detected',
            advice: 'This food appears high in carbohydrates or added sugars and may trigger rapid blood glucose fluctuations. Consider low-glycemic alternatives.'
          });
          riskReasons.push('High sugar / glycemic impact unsuited for diabetes management.');
          profileChecks.push({
            category: 'Condition: Diabetes',
            status: 'caution',
            label: 'High carbohydrate / sugar consideration'
          });
        } else {
          profileChecks.push({
            category: 'Condition: Diabetes',
            status: 'safe',
            label: 'Moderate glycemic balance'
          });
        }
      } else if (condLower.includes('hypertension') || condLower.includes('blood pressure')) {
        const saltKeywords = ['pickle', 'achar', 'papad', 'namkeen', 'salted', 'soy sauce', 'cured', 'msg', 'monosodium glutamate', 'salty'];
        const hasHighSalt = saltKeywords.some(k => allIngredientsText.includes(k));
        const estSodium = Number(foodData.nutrition?.sodium || 0);

        if (hasHighSalt || estSodium > 700) {
          healthConcerns.push({
            condition: 'Hypertension',
            concern: 'High sodium content detected',
            advice: 'This item appears to contain elevated sodium levels which may be unsuitable for a low-sodium cardiovascular diet.'
          });
          riskReasons.push('Elevated sodium level may conflict with hypertension goals.');
          profileChecks.push({
            category: 'Condition: Hypertension',
            status: 'caution',
            label: 'High sodium concern'
          });
        } else {
          profileChecks.push({
            category: 'Condition: Hypertension',
            status: 'safe',
            label: 'Acceptable sodium profile'
          });
        }
      } else if (condLower.includes('celiac') || condLower.includes('gluten')) {
        const glutenFound = this.ALLERGEN_DERIVATIVES.gluten.filter(g => allIngredientsText.includes(g));
        if (glutenFound.length > 0) {
          healthConcerns.push({
            condition: 'Celiac / Gluten Sensitivity',
            concern: `Gluten detected (${glutenFound.join(', ')})`,
            advice: 'Contains wheat/gluten-bearing grains. Unsafe for celiac disease or gluten intolerance.'
          });
          riskReasons.push(`Gluten-containing ingredients detected (${glutenFound.join(', ')}).`);
          profileChecks.push({
            category: 'Condition: Celiac / Gluten',
            status: 'conflict',
            label: `Gluten conflict (${glutenFound.join(', ')})`
          });
        } else {
          profileChecks.push({
            category: 'Condition: Celiac / Gluten',
            status: 'safe',
            label: 'No gluten ingredients detected'
          });
        }
      } else if (condLower.includes('cholesterol') || condLower.includes('heart')) {
        const friedKeywords = ['deep fried', 'fried', 'trans fat', 'vanaspati', 'shortening', 'butter', 'dalda', 'bhujia', 'pakora'];
        const hasHighFat = friedKeywords.some(k => allIngredientsText.includes(k));
        if (hasHighFat) {
          healthConcerns.push({
            condition: condition,
            concern: 'Elevated saturated fats or deep-frying detected',
            advice: 'High in saturated fats or deep-fried preparation. Portion control or baking/steaming alternatives recommended.'
          });
          profileChecks.push({
            category: `Condition: ${condition}`,
            status: 'caution',
            label: 'High saturated fat / fried preparation'
          });
        }
      }
    }

    // Determine Final Risk Level
    let riskLevel = 'LOW';
    if (matchedUserAllergies.length > 0) {
      riskLevel = 'HIGH';
    } else if (matchedIntolerances.length > 0 || healthConcerns.some(h => h.concern.toLowerCase().includes('gluten') || h.concern.toLowerCase().includes('unsafe'))) {
      riskLevel = 'HIGH';
    } else if (healthConcerns.length > 0 || (foodData.uncertainIngredients && foodData.uncertainIngredients.length > 0)) {
      riskLevel = 'CAUTION';
    }

    if (riskReasons.length === 0) {
      riskReasons.push('No relevant allergy or major profile conflict detected.');
    }

    // Recommendations
    let recommendation = '';
    let alternativeSuggestion = '';

    if (riskLevel === 'HIGH') {
      const topConflict = matchedUserAllergies[0]?.allergen || 'registered allergy';
      recommendation = `Based on your registered ${topConflict} allergy, consuming this food is not recommended. Avoid consuming this food unless a qualified healthcare professional has advised otherwise.`;
      if (topConflict.toLowerCase().includes('milk')) {
        alternativeSuggestion = 'Consider a dairy-free alternative such as Tofu Matar, Vegetable Kadai cooked with mustard/olive oil, or cashew/coconut milk curries.';
      } else if (topConflict.toLowerCase().includes('peanut')) {
        alternativeSuggestion = 'Enjoy a version prepared with roasted seeds (sunflower, pumpkin) or plain roasted chana instead of peanuts.';
      } else if (topConflict.toLowerCase().includes('gluten') || topConflict.toLowerCase().includes('wheat')) {
        alternativeSuggestion = 'Opt for gluten-free grains such as rice, jowar, bajra, or ragi rotis.';
      } else {
        alternativeSuggestion = 'Choose verified allergen-free alternatives prepared in a cross-contamination-safe kitchen.';
      }
    } else if (riskLevel === 'CAUTION') {
      recommendation = `Consume with mindful portion moderation. ${healthConcerns[0]?.advice || 'Verify package ingredients and preparation methods.'}`;
      alternativeSuggestion = 'Pair with high-fiber raw vegetables or a light lentil salad to balance macronutrients and glycemic response.';
    } else {
      recommendation = 'This meal aligns well with your registered health profile and dietary baseline. Enjoy as part of your balanced wellness plan!';
      alternativeSuggestion = 'A side of green salad or fresh seasonal fruit provides additional micronutrient density.';
    }

    // Compute Food Health Score & Simplified Presentation Fields
    const scoreData = AllergySafetyEngine.computeFoodHealthScore(foodData, {
      riskLevel,
      riskReasons,
      matchedUserAllergies,
      matchedIntolerances,
      healthConcerns,
      recommendation,
      alternativeSuggestion
    }, userProfile);

    return {
      riskLevel,
      riskReasons,
      matchedUserAllergies,
      matchedIntolerances,
      healthConcerns,
      profileChecks,
      recommendation,
      alternativeSuggestion,
      healthScore: scoreData.healthScore,
      status: scoreData.status,
      shortVerdict: scoreData.shortVerdict,
      mainConcern: scoreData.mainConcern,
      betterChoice: scoreData.betterChoice,
      energyImpact: scoreData.energyImpact,
      allergyConflict: scoreData.allergyConflict,
      allergyName: scoreData.allergyName,
      detailedAnalysis: scoreData.detailedAnalysis
    };
  }

  /**
   * Compute Simplified Food Health Score & Actionable Presentation Fields
   * Zones:
   * 0-39: Harmful / High Risk (Red)
   * 40-69: Caution (Orange/Yellow)
   * 70-84: Good (Light Green)
   * 85-100: Excellent (Green)
   */
  static computeFoodHealthScore(foodData = {}, safetyEval = {}, userProfile = {}) {
    const matchedAllergies = safetyEval.matchedUserAllergies || [];
    const matchedIntolerances = safetyEval.matchedIntolerances || [];
    const healthConcerns = safetyEval.healthConcerns || [];

    const calories = Number(foodData.nutrition?.calories || 0);
    const protein = Number(foodData.nutrition?.protein || 0);
    const carbs = Number(foodData.nutrition?.carbohydrates || foodData.nutrition?.carbs || 0);
    const fat = Number(foodData.nutrition?.fat || 0);
    const sugar = Number(foodData.nutrition?.sugar || 0);
    const sodium = Number(foodData.nutrition?.sodium || 0);

    let healthScore = 86; // baseline healthy score
    let allergyConflict = false;
    let allergyName = null;
    let mainConcern = '';

    // 1. Check for registered allergy match (drastic impact on score)
    if (matchedAllergies.length > 0) {
      allergyConflict = true;
      allergyName = matchedAllergies[0].allergen;
      healthScore = Math.max(12, 34 - (matchedAllergies.length - 1) * 6);
      const foundIn = matchedAllergies[0].foundIn ? ` (${matchedAllergies[0].foundIn})` : '';
      mainConcern = `${allergyName} detected${foundIn} • Conflicts with your registered allergy`;
    } else if (matchedIntolerances.length > 0) {
      allergyConflict = true;
      allergyName = matchedIntolerances[0].intolerance;
      healthScore = 36;
      mainConcern = `${allergyName} detected • Conflicts with your food intolerance`;
    } else if (healthConcerns.some(h => (h.condition || '').toLowerCase().includes('celiac') && (h.concern || '').toLowerCase().includes('gluten'))) {
      healthScore = 22;
      mainConcern = 'Gluten detected • Severe celiac conflict';
    } else if (healthConcerns.length > 0) {
      // Medical condition concerns (diabetes, hypertension, cholesterol)
      const topConcern = healthConcerns[0];
      healthScore = 54;
      if (topConcern.condition.toLowerCase().includes('diabetes')) {
        healthScore = 48;
        mainConcern = 'High sugar / carbohydrates • May elevate blood sugar';
      } else if (topConcern.condition.toLowerCase().includes('hypertension')) {
        healthScore = 52;
        mainConcern = 'Elevated sodium detected • May impact blood pressure';
      } else {
        healthScore = 55;
        mainConcern = `${topConcern.concern} (${topConcern.condition})`;
      }
    } else {
      // General nutritional adjustments
      if (calories > 800) healthScore -= 14;
      else if (calories > 600) healthScore -= 8;

      if (sugar > 20) healthScore -= 12;
      else if (sugar > 10) healthScore -= 5;

      if (sodium > 900) healthScore -= 8;

      if (protein >= 20 && sugar <= 6) healthScore += 8;
      else if (protein >= 12) healthScore += 4;

      healthScore = Math.min(96, Math.max(70, healthScore));
      mainConcern = 'Matches your health profile and dietary baseline';
    }

    // Determine status & shortVerdict based on score zones
    let status = 'good';
    let shortVerdict = 'Good choice for you';

    if (healthScore < 40) {
      status = 'harmful';
      shortVerdict = 'Not a good match for you';
    } else if (healthScore < 70) {
      status = 'caution';
      shortVerdict = 'Okay in moderation';
    } else if (healthScore < 85) {
      status = 'good';
      shortVerdict = 'Good choice for you';
    } else {
      status = 'excellent';
      shortVerdict = 'Excellent match';
    }

    // Better choice (1 short practical line)
    let betterChoice = safetyEval.alternativeSuggestion || '';
    if (betterChoice.startsWith('Consider a dairy-free alternative such as ')) {
      betterChoice = betterChoice.replace('Consider a dairy-free alternative such as ', '');
    } else if (betterChoice.startsWith('Enjoy a version prepared with ')) {
      betterChoice = betterChoice.replace('Enjoy a version prepared with ', '');
    } else if (betterChoice.startsWith('Opt for ')) {
      betterChoice = betterChoice.replace('Opt for ', '');
    }
    if (betterChoice.includes('.')) {
      betterChoice = betterChoice.split('.')[0].trim();
    }
    if (!betterChoice) {
      if (status === 'harmful') betterChoice = 'Choose an allergen-free alternative meal';
      else if (status === 'caution') betterChoice = 'Pair with high-fiber greens or whole foods';
      else betterChoice = 'Fresh vegetables or seasonal salad';
    }

    // Energy Impact (only relevant if calorie data exists)
    let energyImpact = {
      relevant: calories > 0,
      label: calories >= 550 ? 'High calorie' : (calories >= 300 ? 'Moderate calorie' : 'Light energy'),
      value: calories > 0 ? `${calories} kcal` : 'Calorie data pending'
    };
    if (calories > 600) {
      energyImpact.label = 'High energy meal';
    } else if (calories > 0 && calories <= 350 && protein >= 12) {
      energyImpact.label = 'Lean nutrient-dense';
    }

    const detailedAnalysis = safetyEval.recommendation || (safetyEval.riskReasons && safetyEval.riskReasons.join('. ')) || '';

    return {
      healthScore,
      status,
      shortVerdict,
      mainConcern,
      betterChoice,
      energyImpact,
      nutrition: {
        calories,
        protein,
        carbs,
        fat,
        sugar,
        sodium
      },
      allergyConflict,
      allergyName,
      detailedAnalysis
    };
  }
}

module.exports = AllergySafetyEngine;
