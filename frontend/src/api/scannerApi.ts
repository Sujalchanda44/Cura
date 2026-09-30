import { apiClient } from './apiClient';

export interface ScanResult {
  scanType: 'image_vision' | 'barcode' | 'unknown';
  foodName: string;
  brand?: string;
  barcode?: string;
  nutriScore?: string | number;
  confidence?: number;
  servingSize?: string;
  isPackagedProduct?: boolean;
  isUnknownFood?: boolean;
  provider?: string;
  isFallbackMode?: boolean;
  isLimitedAnalysis?: boolean;
  detectedIngredients?: string[];
  ingredients?: string[];
  ingredientsText?: string;
  possibleAllergens?: string[];
  nutrition?: {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    sugar?: number;
    fat?: number;
    sodium?: number;
  };
  nutritionalBreakdown?: any;
  riskLevel: 'LOW' | 'CAUTION' | 'HIGH';
  riskReasons: string[];
  matchedUserAllergies: Array<{
    allergen: string;
    foundIn: string;
    severity: string;
    warning: string;
  }>;
  matchedIntolerances: Array<{
    intolerance: string;
    foundIn: string;
    warning: string;
  }>;
  healthConcerns: Array<{
    condition: string;
    concern: string;
    advice: string;
  }>;
  profileChecks: Array<{
    category: string;
    status: 'safe' | 'caution' | 'conflict';
    label: string;
  }>;
  recommendation: string;
  alternativeSuggestion?: string;
  uncertainIngredients?: string[];
  labelVerificationRequired?: boolean;
  imageUrl?: string | null;
  safetyStatus?: string;
  userProfileSummary?: {
    registeredAllergies: string[];
    medicalConditions: string[];
    dietType: string;
  };

  // Simplified Food Health Score & Progressive Disclosure Fields
  healthScore?: number;
  status?: 'excellent' | 'good' | 'caution' | 'harmful';
  shortVerdict?: string;
  mainConcern?: string;
  betterChoice?: string;
  energyImpact?: {
    relevant: boolean;
    label: string;
    value: string;
  };
  allergyConflict?: boolean;
  allergyName?: string | null;
  detailedAnalysis?: string;
  dashboardImpact?: {
    direction: 'increase' | 'decrease' | 'neutral';
    points: string;
    label: string;
  };
  updatedDashboardScore?: {
    score: number;
    status: string;
    grade: string;
    dietImpact?: any;
    insights?: string;
  };
}

export const scanFood = async (imageFile: File | Blob, textHint?: string, autoLog?: boolean): Promise<ScanResult> => {
  const formData = new FormData();
  formData.append('image', imageFile);
  if (textHint && textHint.trim()) {
    formData.append('textHint', textHint.trim());
  }
  if (autoLog) {
    formData.append('autoLog', 'true');
  }
  const response = await apiClient.post('/scanner/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data?.data;
};

export const scanBarcode = async (barcode: string, autoLog?: boolean): Promise<ScanResult> => {
  const response = await apiClient.post('/scanner/analyze', { barcode, autoLog });
  return response.data?.data;
};

export const logScannedMeal = async (mealData: {
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  ingredients?: string[];
  barcode?: string;
  imageUrl?: string | null;
  mealType?: string;
}) => {
  const response = await apiClient.post('/food/log-meal', mealData);
  return response.data?.data;
};

export const getProductDetails = async (barcode: string) => {
  const response = await apiClient.get(`/food/product/${barcode}`);
  return response.data?.data;
};

