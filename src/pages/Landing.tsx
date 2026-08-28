import { ArrowRight, Activity, ScanLine, Utensils, MessageSquareHeart, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-transparent -z-10" />
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            AI-Powered Personal Health
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto mb-6 leading-tight">
            Your Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">AI Health</span> Companion
          </h1>
          
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Track your health, understand your food, and make smarter daily decisions with AI-powered personalized insights.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/register">
              <Button size="lg" className="rounded-full px-8 h-14 text-base shadow-lg shadow-primary/25">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-base bg-white">
              Learn More
            </Button>
          </div>

          <div className="mt-16 flex justify-center items-center space-x-8 text-sm font-medium text-slate-500">
            <div className="flex items-center"><CheckCircle2 className="h-4 w-4 text-success mr-2" /> Personalized Insights</div>
            <div className="flex items-center"><CheckCircle2 className="h-4 w-4 text-success mr-2" /> AI Food Analysis</div>
            <div className="flex items-center"><CheckCircle2 className="h-4 w-4 text-success mr-2" /> Smart Product Scanner</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need for better health</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Cura+ combines advanced AI with nutritional science to provide you with actionable insights.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-soft transition-all duration-300">
              <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Personalized Health Tracking</h3>
              <p className="text-slate-600">Track your health metrics and understand your progress over time with intelligent analytics.</p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-soft transition-all duration-300">
              <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <ScanLine className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">AI Food Scanner</h3>
              <p className="text-slate-600">Scan food products and instantly understand their nutritional value and compatibility with you.</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-soft transition-all duration-300">
              <div className="bg-orange-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <Utensils className="h-6 w-6 text-warning" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Recommendations</h3>
              <p className="text-slate-600">Get food recommendations based on your personal health profile and daily goals.</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-soft transition-all duration-300">
              <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <MessageSquareHeart className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">AI Health Assistant</h3>
              <p className="text-slate-600">Ask questions and receive personalized health guidance from our advanced medical AI model.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-16">How It Works</h2>
          
          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2"></div>
            
            {[
              { step: 1, title: 'Create Profile', desc: 'Create your comprehensive health profile.' },
              { step: 2, title: 'Scan Food', desc: 'Scan or track your daily food intake.' },
              { step: 3, title: 'AI Analysis', desc: 'AI analyzes your data against your profile.' },
              { step: 4, title: 'Get Insights', desc: 'Receive personalized recommendations.' }
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mb-6 border-4 border-slate-50 shadow-sm">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-6">Take control of your health with Cura+.</h2>
          <p className="text-primary-foreground/80 mb-10 text-lg max-w-2xl mx-auto">
            Join thousands of users who are making smarter daily health decisions with AI.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-primary hover:bg-slate-100 rounded-full px-8 h-14 text-base">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
