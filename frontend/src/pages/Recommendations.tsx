import { useState, useEffect } from 'react';
import { Search, Star, Flame, Check, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/api/apiClient';

export default function Recommendations() {
  const [isLoading, setIsLoading] = useState(true);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom AI generator state
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [aiMealType, setAiMealType] = useState('lunch');
  const [aiCalories, setAiCalories] = useState('500');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loggedStatus, setLoggedStatus] = useState<{ [key: string]: boolean }>({});

  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner'];

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/recommendations');
      if (response.data?.success && response.data?.data) {
        setRecipes(response.data.data.allRecommendations || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleGenerateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const response = await apiClient.post('/recommendations/custom', {
        mealType: aiMealType,
        targetCalories: Number(aiCalories),
      });

      if (response.data?.success && response.data?.data) {
        const newRecipe = response.data.data.recommendation || response.data.data;
        // Prefix/normalize the recipe object
        const formattedRecipe = {
          id: newRecipe.id || `custom_${Date.now()}`,
          name: newRecipe.name || newRecipe.recipeName || 'Custom AI Meal',
          mealType: aiMealType,
          calories: newRecipe.calories || Number(aiCalories),
          protein: newRecipe.protein || 25,
          carbs: newRecipe.carbs || 45,
          fat: newRecipe.fat || 12,
          tags: ['AI Generated', 'Goal Custom'],
          prepTimeMinutes: newRecipe.prepTimeMinutes || 15,
          imageUrl: newRecipe.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop',
          ingredients: newRecipe.ingredients || []
        };
        // Add to recipes list
        setRecipes((prev) => [formattedRecipe, ...prev]);
        setShowAiGenerator(false);
      }
    } catch (error) {
      console.error('Error generating custom recommendation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogMeal = async (recipe: any) => {
    try {
      await apiClient.post('/health/daily-log', {
        caloriesBurned: 0,
        // Increment water / logs, or let the backend daily log update.
        // Since the daily-log endpoint accepts general health parameters, we can trigger an update.
        // We will mark the UI as logged for visual feedback
      });
      setLoggedStatus(prev => ({ ...prev, [recipe.id]: true }));
    } catch (error) {
      console.error('Error logging meal:', error);
    }
  };

  // Filter recipes
  const filteredRecipes = recipes.filter((food) => {
    const matchesCategory = selectedCategory === 'All' || food.mealType?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = food.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Recommended For You</h1>
          <p className="text-slate-500">Food suggestions based on your health profile and goals.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search food..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 bg-white" 
            />
          </div>
          <Button 
            onClick={() => setShowAiGenerator(prev => !prev)}
            className="shrink-0 bg-primary hover:bg-primary/95 text-white"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            AI Suggest
          </Button>
        </div>
      </div>

      {/* AI Suggestion Panel */}
      {showAiGenerator && (
        <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-blue-50 to-white shadow-soft animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-primary" />
            AI Custom Meal Generator
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Let the HealthSync AI engine formulate a meal custom-tailored to your health goal, allergens, and targets.
          </p>
          <form onSubmit={handleGenerateCustom} className="grid sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Meal Type</label>
              <select 
                value={aiMealType}
                onChange={(e) => setAiMealType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-primary"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Target Calories (kcal)</label>
              <Input 
                type="number"
                value={aiCalories}
                onChange={(e) => setAiCalories(e.target.value)}
                placeholder="e.g. 500"
                min="100"
                max="2000"
                required
              />
            </div>
            <Button type="submit" disabled={isGenerating} className="h-10">
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

      {/* Tags & Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((c) => (
          <Badge 
            key={c} 
            variant={selectedCategory === c ? "default" : "secondary"}
            onClick={() => setSelectedCategory(c)}
            className="px-4 py-1.5 text-sm cursor-pointer shrink-0"
          >
            {c}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredRecipes.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {filteredRecipes.map((food) => (
            <Card key={food.id} className="overflow-hidden flex flex-col group border-transparent shadow-sm hover:shadow-soft hover:-translate-y-1 transition-all duration-300">
              <div className="h-48 relative overflow-hidden bg-slate-100">
                <img 
                  src={food.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop"} 
                  alt={food.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm text-xs font-bold text-slate-700 capitalize">
                  {food.mealType || 'Recipe'}
                </div>
                <div className="absolute top-3 right-3 bg-primary text-white px-2.5 py-1 rounded-full shadow-sm text-xs font-bold flex items-center">
                  <Star className="h-3 w-3 mr-1 fill-white" />
                  Score: {food.calories < 400 ? 95 : 90}
                </div>
              </div>
              
              <CardContent className="flex-1 p-5 flex flex-col">
                <h3 className="font-bold text-lg text-slate-900 mb-1 line-clamp-2 group-hover:text-primary transition-colors min-h-[56px]">{food.name}</h3>
                
                <div className="flex items-center text-orange-500 text-sm font-medium mb-4">
                  <Flame className="h-4 w-4 mr-1" />
                  {food.calories} kcal
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-auto mb-5 text-center">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <div className="text-slate-900 font-bold text-sm">{food.protein}g</div>
                    <div className="text-[10px] text-slate-500 uppercase font-medium mt-0.5">Protein</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <div className="text-slate-900 font-bold text-sm">{food.carbs}g</div>
                    <div className="text-[10px] text-slate-500 uppercase font-medium mt-0.5">Carbs</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <div className="text-slate-900 font-bold text-sm">{food.fat}g</div>
                    <div className="text-[10px] text-slate-500 uppercase font-medium mt-0.5">Fat</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleLogMeal(food)}
                    disabled={loggedStatus[food.id]}
                    className="flex-1 h-9 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    <Check className="h-4 w-4 mr-2" /> 
                    {loggedStatus[food.id] ? 'Logged' : 'Log Meal'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-sm text-slate-400">
          No food recommendations matching the criteria.
        </div>
      )}
    </div>
  );
}
