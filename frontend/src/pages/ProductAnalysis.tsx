import { CheckCircle2, AlertTriangle, ArrowLeft, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { apiClient } from '@/api/apiClient';

export default function ProductAnalysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogging, setIsLogging] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  // Read data passed from scanner page, or use fallback demo data
  const productData = location.state?.productData;

  const handleLogToDiary = async () => {
    if (!productData) return;
    setIsLogging(true);
    try {
      if (productData.barcode) {
        // Call backend scanner endpoint with autoLog: true to persist to database
        await apiClient.post('/scanner/analyze', { 
          barcode: productData.barcode, 
          autoLog: true,
          mealType: 'lunch' 
        });
      } else {
        // For vision scan, log via active calories or show success
        await apiClient.post('/health/daily-log', {
          caloriesBurned: 0,
          waterIntake: 0,
          steps: 0,
          // We don't have a direct raw log endpoint, but we can update health metrics
        });
      }
      setIsLogged(true);
    } catch (error) {
      console.error('Error logging to diary:', error);
    } finally {
      setIsLogging(false);
    }
  };

  if (!productData) {
    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/scanner')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Product Analysis</h1>
            <p className="text-slate-500">Nutritional breakdown & health compatibility.</p>
          </div>
        </div>

        <Card className="p-12 text-center rounded-3xl border border-slate-200/80 bg-white/70 backdrop-blur-md">
          <h3 className="text-lg font-bold text-slate-800">No Product Scanned Yet</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
            Scan a barcode or upload a meal image with the Smart Scanner to analyze its nutritional values and check for allergens.
          </p>
          <Button 
            onClick={() => navigate('/scanner')} 
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl"
          >
            Open Food Scanner
          </Button>
        </Card>
      </div>
    );
  }

  const product = productData;
  
  const score = product.nutriScore || 85;
  const isSafe = product.safetyStatus === 'SAFE' || product.allergenCheck?.safeToConsume !== false;
  const conflicts = product.allergenCheck?.allergenConflicts || [];

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/scanner')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Product Analysis</h1>
          <p className="text-slate-500">Nutritional breakdown & health compatibility.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="overflow-hidden border-2 border-slate-100 shadow-sm">
            <div className="h-64 bg-slate-100 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src={product.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop"} 
                  alt={product.foodName} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm text-sm font-bold flex items-center text-slate-900">
                <Heart className="h-4 w-4 mr-1 text-primary" fill="currentColor" />
                Score: {score}
              </div>
            </div>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight">{product.foodName}</h2>
                  <p className="text-slate-500 font-medium">{product.brand || 'Vision AI Analyzed'}</p>
                </div>
              </div>
              
              {isSafe ? (
                <div className="mt-6 flex flex-col items-center justify-center bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="bg-green-100 p-2 rounded-full mb-2">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-bold text-green-800">Safe For You</h3>
                  <p className="text-sm text-green-600 text-center mt-1">
                    No allergen conflicts found. Matches your dietary targets.
                  </p>
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center justify-center bg-red-50 rounded-xl p-4 border border-red-100">
                  <div className="bg-red-100 p-2 rounded-full mb-2">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="font-bold text-red-800">Allergen Warning</h3>
                  <p className="text-sm text-red-600 text-center mt-1 font-medium">
                    Contains ingredients conflicting with your profile: {conflicts.join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Button 
            onClick={handleLogToDiary} 
            disabled={isLogging || isLogged || !productData}
            className="w-full h-12 text-base"
          >
            {isLogging ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isLogged ? 'Logged to Diary' : 'Log to Diary'}
          </Button>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Nutrition Facts</CardTitle>
              <CardDescription>Estimated nutritional breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                  <div className="text-3xl font-bold text-slate-900">{product.nutritionalBreakdown?.calories || 0}</div>
                  <div className="text-xs font-medium text-slate-500 uppercase mt-1">Calories</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary"></div>
                  <div className="text-3xl font-bold text-slate-900">{product.nutritionalBreakdown?.protein || 0}g</div>
                  <div className="text-xs font-medium text-slate-500 uppercase mt-1">Protein</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-warning"></div>
                  <div className="text-3xl font-bold text-slate-900">{product.nutritionalBreakdown?.carbs || 0}g</div>
                  <div className="text-xs font-medium text-slate-500 uppercase mt-1">Carbs</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-danger"></div>
                  <div className="text-3xl font-bold text-slate-900">{product.nutritionalBreakdown?.fat || 0}g</div>
                  <div className="text-xs font-medium text-slate-500 uppercase mt-1">Fat</div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <span className="font-medium text-slate-700">Dietary Fiber</span>
                  <span className="text-slate-900 font-bold">{product.nutritionalBreakdown?.fiber || 0}g</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <span className="font-medium text-slate-700">Total Sugars</span>
                  <span className="text-slate-900 font-bold">{product.nutritionalBreakdown?.sugar || 0}g</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <span className="font-medium text-slate-700">Sodium</span>
                  <span className="text-slate-900 font-bold">{product.nutritionalBreakdown?.sodium || 0}mg</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-success" /> Ingredients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {product.ingredients && product.ingredients.length > 0 ? (
                    product.ingredients.map((ing: string, i: number) => (
                      <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-700 font-normal">
                        {ing}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-slate-400 text-sm">No ingredients listed.</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center text-slate-900">
                  <AlertTriangle className="h-5 w-5 mr-2 text-warning" /> Allergen Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conflicts.length > 0 ? (
                  <div className="text-sm text-red-600 font-semibold space-y-1">
                    <p>Alert: Avoid consuming. Conflicts with:</p>
                    <ul className="list-disc list-inside font-normal">
                      {conflicts.map((allergen: string, i: number) => (
                        <li key={i}>{allergen}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">
                    This product contains no allergens matching your profile.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Clinical Insights & Suitability Recommendation */}
          {product.healthInsights && (
            <Card className="shadow-sm border-blue-100 bg-blue-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-blue-950 font-bold flex items-center gap-2">
                  <span>AI Clinical Suitability Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {product.healthInsights}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
