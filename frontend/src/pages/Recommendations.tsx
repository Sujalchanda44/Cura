import { useState, useEffect } from 'react';
import { Search, Star, Flame, Check, Sparkles, Loader2, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export default function Recommendations() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const userName = user?.name || 'You';

  const [isLoading, setIsLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState<'idle' | 'analyzing' | 'finding'>('idle');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // AI Suggest active state
  const [isAiActive, setIsAiActive] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  
  // Custom AI generator state
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [aiMealType, setAiMealType] = useState('lunch');
  const [aiCalories, setAiCalories] = useState('500');
  const [isGenerating, setIsGenerating] = useState(false);

  // Meal logging status
  const [loggedStatus, setLoggedStatus] = useState<{ [key: string]: boolean }>({});
  const [logSuccessToast, setLogSuccessToast] = useState<string | null>(null);

  const categories = [
    { id: 'All', label: t('rec.all', 'All') },
    { id: 'Breakfast', label: t('rec.breakfast', 'Breakfast') },
    { id: 'Lunch', label: t('rec.lunch', 'Lunch') },
    { id: 'Dinner', label: t('rec.dinner', 'Dinner') },
    { id: 'Snack', label: t('rec.snack', 'Snack') },
  ];

  // 1. Fetch personalized recommendations from backend engine
  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setIsAiActive(false);
    setAiSummary(null);

    try {
      const response = await apiClient.get('/recommendations');
      if (response.data?.success && response.data?.data) {
        setRecipes(response.data.data.allRecommendations || []);
      }
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      setError("We couldn't load recommendations right now. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch meals already logged today to mark button as "✓ Logged"
  const fetchLoggedToday = async () => {
    try {
      const res = await apiClient.get('/recommendations/logged-today');
      if (res.data?.success && res.data?.data) {
        const { loggedMealNames = [], loggedMealIds = [] } = res.data.data;
        const statusMap: { [key: string]: boolean } = {};
        loggedMealNames.forEach((n: string) => { statusMap[n] = true; });
        loggedMealIds.forEach((id: string) => { statusMap[id] = true; });
        setLoggedStatus(prev => ({ ...prev, ...statusMap }));
      }
    } catch (e) {
      // Non-critical background sync
    }
  };

  useEffect(() => {
    fetchRecommendations();
    fetchLoggedToday();
  }, []);

  // 3. Functional AI Suggest Button
  const handleAiSuggest = async () => {
    setIsLoading(true);
    setLoadingPhase('analyzing');
    setError(null);

    const phaseTimer = setTimeout(() => {
      setLoadingPhase('finding');
    }, 700);

    try {
      const response = await apiClient.post('/recommendations/ai-suggest');
      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        setRecipes(data.allRecommendations || []);
        setIsAiActive(true);
        setAiSummary(data.summary || "Based on your clinical profile, here are today's personalized suggestions.");
        setSelectedCategory('All');
      }
    } catch (err: any) {
      console.error('Error generating AI suggestions:', err);
      setError("We couldn't generate recommendations right now. Please try again.");
    } finally {
      clearTimeout(phaseTimer);
      setIsLoading(false);
      setLoadingPhase('idle');
    }
  };

  // 4. Custom AI Meal Plan Generator
  const handleGenerateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      const response = await apiClient.post('/recommendations/custom', {
        mealType: aiMealType,
        targetCalories: Number(aiCalories),
      });

      if (response.data?.success && response.data?.data) {
        const newRecipe = response.data.data.recommendation || response.data.data;
        const formattedRecipe = {
          id: newRecipe.id || `custom_${Date.now()}`,
          name: newRecipe.name || newRecipe.recipeName || 'Custom AI Meal',
          mealType: aiMealType,
          calories: newRecipe.calories || Number(aiCalories),
          protein: newRecipe.protein || (newRecipe.macros?.protein ? parseInt(newRecipe.macros.protein) : 25),
          carbs: newRecipe.carbs || (newRecipe.macros?.carbs ? parseInt(newRecipe.macros.carbs) : 45),
          fat: newRecipe.fat || (newRecipe.macros?.fat ? parseInt(newRecipe.macros.fat) : 12),
          matchScore: 95,
          reason: newRecipe.reason || `Formulated for your custom target of ${aiCalories} kcal and dietary profile.`,
          tags: ['AI Generated', 'Goal Custom'],
          prepTimeMinutes: newRecipe.prepTimeMinutes || 15,
          imageUrl: newRecipe.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop',
          ingredients: newRecipe.ingredients || []
        };

        setRecipes(prev => [formattedRecipe, ...prev]);
        setShowAiGenerator(false);
      }
    } catch (err) {
      console.error('Error generating custom recommendation:', err);
      setError('Could not generate custom recipe. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 5. Functional Log Meal
  const handleLogMeal = async (recipe: any) => {
    try {
      await apiClient.post('/recommendations/log-meal', {
        mealId: recipe.id,
        name: recipe.name,
        mealType: recipe.mealType,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        fiber: recipe.fiber,
        ingredients: recipe.ingredients,
        imageUrl: recipe.imageUrl,
      });

      const normalizedName = (recipe.name || '').toLowerCase().trim();
      setLoggedStatus(prev => ({
        ...prev,
        [recipe.id]: true,
        [normalizedName]: true
      }));

      setLogSuccessToast(`Logged "${recipe.name}" to your daily nutrition tracker.`);
      setTimeout(() => setLogSuccessToast(null), 3500);
    } catch (err) {
      console.error('Error logging meal:', err);
      setError('Failed to log meal. Please try again.');
    }
  };

  // 6. Dynamic search and meal filtering
  const filteredRecipes = recipes.filter((food) => {
    const matchesCategory = selectedCategory === 'All' || (food.mealType || '').toLowerCase() === selectedCategory.toLowerCase();
    
    const query = searchTerm.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesName = (food.name || '').toLowerCase().includes(query);
    const matchesIngredients = (food.ingredients || []).some((ing: string) => ing.toLowerCase().includes(query));
    const matchesTags = (food.tags || []).some((tag: string) => tag.toLowerCase().includes(query));
    const matchesMealType = (food.mealType || '').toLowerCase().includes(query);
    const matchesReason = (food.reason || '').toLowerCase().includes(query);

    return matchesCategory && (matchesName || matchesIngredients || matchesTags || matchesMealType || matchesReason);
  });

  return (
    <div className="space-y-6">
      {/* Header with Search and AI Suggest */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 transition-colors">
            {t('rec.title', 'Recommended For You')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t('rec.subtitle', `Personalized for ${userName} using your health profile, dietary preferences, and goals.`)}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input 
              placeholder={t('rec.searchPlaceholder', 'Search food, ingredients, tags...')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" 
            />
          </div>
          <Button 
            onClick={handleAiSuggest}
            disabled={isLoading}
            className="shrink-0 bg-[#C1F3BA] hover:bg-[#ADE8A5] text-[#134E2F] font-bold shadow-xs cursor-pointer transition-colors"
            title="Generate AI-personalized recommendations based on your clinical profile"
          >
            {isLoading && loadingPhase !== 'idle' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4 text-[#134E2F]" />
                {t('rec.aiSuggest', 'AI Suggest')}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* AI Suggest Active Banner */}
      {isAiActive && aiSummary && (
        <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl flex items-center justify-between text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white dark:text-emerald-950 flex items-center justify-center shrink-0 shadow-xs font-bold">
              <Sparkles className="h-4 w-4" />
            </div>
            <span>{aiSummary}</span>
          </div>
          <button 
            onClick={fetchRecommendations}
            className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-emerald-100 underline shrink-0 ml-3 cursor-pointer"
          >
            Reset to Standard
          </button>
        </div>
      )}

      {/* Success Notification Alert */}
      {logSuccessToast && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-medium rounded-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{logSuccessToast}</span>
        </div>
      )}

      {/* Error Alert with Retry Button */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-300 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleAiSuggest} className="border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 cursor-pointer">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Custom AI Suggestion Panel (Collapsible) */}
      {showAiGenerator && (
        <Card className="p-6 border border-[#C1F3BA]/40 dark:border-[#273322] bg-gradient-to-br from-[#F2FBF1] to-white dark:from-[#151A12] dark:to-[#1C2318] shadow-sm animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center">
            <Sparkles className="h-5 w-5 text-[#134E2F] dark:text-[#C1F3BA] mr-2" />
            Generate Custom Indian Recipe with AI
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Specify a target calorie budget and meal slot. Gemini AI will formulate an Indian meal tailored strictly to your profile.
          </p>
          <form onSubmit={handleGenerateCustom} className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Meal Slot:</label>
              <select 
                value={aiMealType} 
                onChange={(e) => setAiMealType(e.target.value)}
                className="h-9 px-3 rounded-lg border border-slate-200 dark:border-[#273322] bg-white dark:bg-[#1C2318] text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Calories:</label>
              <Input 
                type="number" 
                value={aiCalories} 
                onChange={(e) => setAiCalories(e.target.value)} 
                className="h-9 w-24 text-xs" 
                min="100" 
                max="1200" 
              />
              <span className="text-xs text-slate-400">kcal</span>
            </div>

            <Button 
              type="submit" 
              disabled={isGenerating} 
              size="sm" 
              className="bg-[#C1F3BA] hover:bg-[#ADE8A5] text-[#134E2F] font-bold cursor-pointer transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Formulating...
                </>
              ) : 'Generate Recipe'}
            </Button>
          </form>
        </Card>
      )}

      {/* Tags & Meal Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((c) => (
          <button
            key={c.id} 
            type="button"
            onClick={() => setSelectedCategory(c.id)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold cursor-pointer shrink-0 transition-all",
              selectedCategory === c.id
                ? "bg-[#C1F3BA] text-[#134E2F] dark:text-[#0A0E08] font-bold shadow-xs"
                : "bg-white dark:bg-[#1C2318] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#273322] hover:bg-slate-50 dark:hover:bg-[#273322]"
            )}
          >
            {c.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowAiGenerator(prev => !prev)}
          className="text-xs text-[#134E2F] dark:text-[#C1F3BA] font-semibold hover:underline ml-auto shrink-0 pl-2 cursor-pointer transition-colors"
        >
          {showAiGenerator ? 'Hide custom generator' : '+ Custom calorie target'}
        </button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col h-[40vh] items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#134E2F] dark:text-[#C1F3BA]" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 animate-pulse">
            {loadingPhase === 'analyzing'
              ? 'Analyzing your health profile...'
              : loadingPhase === 'finding'
              ? 'Finding suitable Indian foods...'
              : 'Loading personalized recommendations...'}
          </p>
        </div>
      ) : filteredRecipes.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {filteredRecipes.map((food) => {
            const isLogged = loggedStatus[food.id] || loggedStatus[(food.name || '').toLowerCase().trim()];

            return (
              <Card key={food.id} className="overflow-hidden flex flex-col group border border-slate-200/80 dark:border-[#273322] shadow-sm hover:shadow-soft hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-[#151A12]">
                <div className="h-48 relative overflow-hidden bg-slate-100 dark:bg-[#1C2318]">
                  <img 
                    src={food.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop"} 
                    alt={food.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-[#151A12]/90 backdrop-blur-xs px-2.5 py-1 rounded-md shadow-xs text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
                    {food.mealType || 'Recipe'}
                  </div>
                  <div className="absolute top-3 right-3 bg-[#C1F3BA] text-[#134E2F] font-bold px-2.5 py-1 rounded-full shadow-xs text-xs flex items-center">
                    <Star className="h-3 w-3 mr-1 fill-[#134E2F]" />
                    {t('rec.match', 'Match')}: {food.matchScore || 92}
                  </div>
                </div>
                
                <CardContent className="flex-1 p-5 flex flex-col">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-[#C1F3BA] transition-colors min-h-[56px]">
                    {food.name}
                  </h3>

                  {/* Why this was recommended */}
                  {food.reason && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#1C2318] border border-slate-100 dark:border-[#273322] p-2.5 rounded-lg mb-3 line-clamp-2 leading-relaxed">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Why: </span>
                      {food.reason}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center text-orange-500 font-bold">
                      <Flame className="h-4 w-4 mr-1 shrink-0" />
                      {food.calories} kcal
                    </div>
                    {food.relevantGoal && (
                      <span className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md font-medium flex items-center border border-emerald-200/50 dark:border-emerald-800/50">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        {food.relevantGoal}
                      </span>
                    )}
                  </div>
                  
                  {/* Macros Grid */}
                  <div className="grid grid-cols-3 gap-2 mt-auto mb-5 text-center">
                    <div className="bg-slate-50 dark:bg-[#1C2318] border border-slate-100 dark:border-[#273322] p-2 rounded-lg transition-colors">
                      <div className="text-slate-900 dark:text-slate-100 font-bold text-sm">{food.protein}g</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold mt-0.5">{t('rec.protein', 'Protein')}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#1C2318] border border-slate-100 dark:border-[#273322] p-2 rounded-lg transition-colors">
                      <div className="text-slate-900 dark:text-slate-100 font-bold text-sm">{food.carbs}g</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold mt-0.5">{t('rec.carbs', 'Carbs')}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#1C2318] border border-slate-100 dark:border-[#273322] p-2 rounded-lg transition-colors">
                      <div className="text-slate-900 dark:text-slate-100 font-bold text-sm">{food.fat}g</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold mt-0.5">{t('rec.fat', 'Fat')}</div>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleLogMeal(food)}
                      disabled={isLogged}
                      className={
                        isLogged
                          ? "flex-1 h-9 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-not-allowed font-semibold"
                          : "flex-1 h-9 bg-[#C1F3BA] hover:bg-[#ADE8A5] text-[#134E2F] font-bold cursor-pointer shadow-xs transition-colors"
                      }
                    >
                      <Check className="h-4 w-4 mr-2" /> 
                      {isLogged ? t('rec.logged', '✓ Logged') : t('rec.logMeal', 'Log Meal')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white dark:bg-[#151A12] rounded-2xl border border-slate-100 dark:border-[#273322] p-8 shadow-xs transition-colors">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-[#1C2318] text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-1">No recommendations match your current criteria</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            {searchTerm 
              ? `No meals matching "${searchTerm}" found in this category.` 
              : 'No meals found matching your current dietary restrictions and allergies.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {selectedCategory !== 'All' && (
              <Button variant="outline" size="sm" onClick={() => setSelectedCategory('All')} className="cursor-pointer border-slate-200 dark:border-[#273322] text-slate-700 dark:text-slate-300">
                View All Safe Foods
              </Button>
            )}
            {searchTerm && (
              <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="cursor-pointer">
                Clear Search
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
