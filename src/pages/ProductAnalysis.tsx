import { CheckCircle2, AlertTriangle, ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function ProductAnalysis() {
  const navigate = useNavigate();

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
          <Card className="overflow-hidden border-2 border-slate-100">
            <div className="h-64 bg-slate-100 relative">
              {/* Product Image Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img src="https://images.unsplash.com/photo-1622484211148-91cc2eeb3a77?q=80&w=600&auto=format&fit=crop" alt="Protein Bar" className="w-full h-full object-cover" />
              </div>
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm text-sm font-bold flex items-center text-slate-900">
                <Heart className="h-4 w-4 mr-1 text-primary" fill="currentColor" />
                92/100
              </div>
            </div>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight">Dark Chocolate Protein Bar</h2>
                  <p className="text-slate-500 font-medium">HealthyLife Co.</p>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col items-center justify-center bg-green-50 rounded-xl p-4 border border-green-100">
                <div className="bg-green-100 p-2 rounded-full mb-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-bold text-green-800">Good Match For You</h3>
                <p className="text-sm text-green-600 text-center mt-1">Aligns with your muscle gain goals and has no allergen conflicts.</p>
              </div>
            </CardContent>
          </Card>
          
          <Button className="w-full h-12 text-base">Log to Diary</Button>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Facts</CardTitle>
              <CardDescription>Amount per serving (60g)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                  <div className="text-3xl font-bold text-slate-900">210</div>
                  <div className="text-xs font-medium text-slate-500 uppercase mt-1">Calories</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary"></div>
                  <div className="text-3xl font-bold text-slate-900">20g</div>
                  <div className="text-xs font-medium text-slate-500 uppercase mt-1">Protein</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-warning"></div>
                  <div className="text-3xl font-bold text-slate-900">24g</div>
                  <div className="text-xs font-medium text-slate-500 uppercase mt-1">Carbs</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-danger"></div>
                  <div className="text-3xl font-bold text-slate-900">8g</div>
                  <div className="text-xs font-medium text-slate-500 uppercase mt-1">Fat</div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <span className="font-medium text-slate-700">Dietary Fiber</span>
                  <span className="text-slate-900 font-bold">10g <span className="text-slate-400 font-normal text-xs ml-2">35% DV</span></span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <span className="font-medium text-slate-700">Total Sugars</span>
                  <span className="text-slate-900 font-bold">2g <span className="text-slate-400 font-normal text-xs ml-2">4% DV</span></span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <span className="font-medium text-slate-700">Sodium</span>
                  <span className="text-slate-900 font-bold">140mg <span className="text-slate-400 font-normal text-xs ml-2">6% DV</span></span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-success" /> Health Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start"><div className="h-1.5 w-1.5 rounded-full bg-success mt-1.5 mr-2 shrink-0"></div>Excellent source of protein</li>
                  <li className="flex items-start"><div className="h-1.5 w-1.5 rounded-full bg-success mt-1.5 mr-2 shrink-0"></div>High in dietary fiber</li>
                  <li className="flex items-start"><div className="h-1.5 w-1.5 rounded-full bg-success mt-1.5 mr-2 shrink-0"></div>Low in added sugars</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center text-slate-900">
                  <AlertTriangle className="h-5 w-5 mr-2 text-warning" /> Considerations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start"><div className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5 mr-2 shrink-0"></div>Contains tree nuts (almonds)</li>
                  <li className="flex items-start"><div className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5 mr-2 shrink-0"></div>Contains milk derivatives</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Better Alternatives</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary h-8">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Organic Plant Protein Bar', brand: 'Nature Fit', cals: 190, score: 98, img: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?q=80&w=200&auto=format&fit=crop' },
                  { name: 'Keto Nut Bar', brand: 'LowCarb Co', cals: 180, score: 95, img: 'https://images.unsplash.com/photo-1622484211148-91cc2eeb3a77?q=80&w=200&auto=format&fit=crop' }
                ].map((alt, i) => (
                  <div key={i} className="flex items-center p-3 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="h-16 w-16 rounded-lg bg-slate-200 overflow-hidden shrink-0 mr-4">
                      <img src={alt.img} alt={alt.name} className="w-full h-full object-cover opacity-80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{alt.name}</h4>
                      <p className="text-xs text-slate-500 truncate">{alt.brand}</p>
                      <div className="flex items-center space-x-3 mt-1 text-xs font-medium">
                        <span className="text-slate-600">{alt.cals} kcal</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end pl-2">
                      <div className="flex items-center text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-sm mb-1">
                        {alt.score}
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 text-xs px-2">Compare</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
