import { Search, SlidersHorizontal, Star, Flame, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Drinks'];
const filters = ['High Protein', 'Low Carb', 'Vegan', 'Under 400 kcal'];

const recommendations = [
  {
    id: 1,
    name: 'Grilled Salmon with Quinoa',
    category: 'Dinner',
    calories: 450,
    protein: '35g',
    carbs: '25g',
    fat: '15g',
    score: 98,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 2,
    name: 'Avocado Chicken Salad',
    category: 'Lunch',
    calories: 380,
    protein: '28g',
    carbs: '12g',
    fat: '22g',
    score: 95,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 3,
    name: 'Oatmeal with Berries & Nuts',
    category: 'Breakfast',
    calories: 320,
    protein: '10g',
    carbs: '45g',
    fat: '12g',
    score: 92,
    image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 4,
    name: 'Greek Yogurt with Honey',
    category: 'Snacks',
    calories: 180,
    protein: '15g',
    carbs: '20g',
    fat: '4g',
    score: 90,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=400&auto=format&fit=crop'
  }
];

export default function Recommendations() {
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
            <Input placeholder="Search food..." className="pl-9 h-10 bg-white" />
          </div>
          <Button variant="outline" size="icon" className="shrink-0 bg-white">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tags & Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((c, i) => (
            <Badge 
              key={c} 
              variant={i === 0 ? "default" : "secondary"}
              className="px-4 py-1.5 text-sm cursor-pointer shrink-0"
            >
              {c}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2 shrink-0">Filters:</span>
          {filters.map((f) => (
            <div key={f} className="flex items-center px-3 py-1 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-600 cursor-pointer hover:bg-slate-50 shrink-0">
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((food) => (
          <Card key={food.id} className="overflow-hidden flex flex-col group border-transparent shadow-sm hover:shadow-soft hover:-translate-y-1 transition-all duration-300">
            <div className="h-48 relative overflow-hidden bg-slate-100">
              <img 
                src={food.image} 
                alt={food.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm text-xs font-bold text-slate-700">
                {food.category}
              </div>
              <div className="absolute top-3 right-3 bg-primary text-white px-2 py-1 rounded-full shadow-sm text-xs font-bold flex items-center">
                <Star className="h-3 w-3 mr-1 fill-white" />
                {food.score}
              </div>
            </div>
            
            <CardContent className="flex-1 p-5 flex flex-col">
              <h3 className="font-bold text-lg text-slate-900 mb-1 line-clamp-1 group-hover:text-primary transition-colors">{food.name}</h3>
              
              <div className="flex items-center text-orange-500 text-sm font-medium mb-4">
                <Flame className="h-4 w-4 mr-1" />
                {food.calories} kcal
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-auto mb-5 text-center">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-900 font-bold text-sm">{food.protein}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-medium mt-0.5">Protein</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-900 font-bold text-sm">{food.carbs}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-medium mt-0.5">Carbs</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-900 font-bold text-sm">{food.fat}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-medium mt-0.5">Fat</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1 h-9 bg-primary/10 text-primary hover:bg-primary/20">
                  <Check className="h-4 w-4 mr-2" /> Log Meal
                </Button>
                <Button variant="outline" className="flex-1 h-9 border-slate-200">
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
