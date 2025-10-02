import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Shield, Zap, Database, CheckCircle2 } from "lucide-react";
import heroImage from "@/assets/medical-hero.jpg";

const Welcome = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Extraction",
      description: "Advanced machine learning algorithms automatically extract data from clinical documents with 98%+ accuracy."
    },
    {
      icon: Shield,
      title: "HIPAA Compliant",
      description: "Enterprise-grade security with end-to-end encryption and HIPAA-compliant data storage."
    },
    {
      icon: Database,
      title: "Structured Data",
      description: "Convert unstructured medical documents into clean, searchable, and exportable data formats."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Trusted by 500+ Healthcare Facilities
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
              Clinical Data Extraction,
              <span className="block text-primary">Simplified</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform unstructured clinical documents into actionable data with AI-powered extraction. 
              Save time, reduce errors, and improve patient care.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Button 
                size="lg" 
                variant="medical"
                onClick={() => navigate("/auth")}
                className="text-lg px-8"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why MedExtract?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built specifically for healthcare professionals who need fast, accurate, and secure data extraction
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-8 text-center hover:shadow-medium transition-all">
                  <div className="inline-flex p-4 bg-primary/10 rounded-full mb-6">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { value: "98.4%", label: "Accuracy Rate" },
              { value: "10x", label: "Faster Processing" },
              { value: "500+", label: "Healthcare Clients" },
              { value: "5M+", label: "Documents Processed" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-5xl font-bold text-primary mb-2">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto p-12 text-center bg-gradient-primary text-primary-foreground">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Transform Your Clinical Data Workflow?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join hundreds of healthcare facilities already using MedExtract
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate("/auth")}
              className="text-lg px-8"
            >
              Start Extracting Data
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Welcome;
