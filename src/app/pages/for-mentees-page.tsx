import { motion } from "motion/react";
import { Link } from "react-router";
import {
  GraduationCap,
  Briefcase,
  Heart,
  Brain,
  Users,
  Target,
  TrendingUp,
  DollarSign,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  BookOpen,
  Lock,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const challenges = [
  {
    icon: Briefcase,
    title: "Career & Education",
    description: "Get guidance on choosing career paths, university decisions, internships, and discovering your passions.",
    color: "from-[#00A651] to-[#006B3C]",
  },
  {
    icon: Smartphone,
    title: "Digital Discipline",
    description: "Break free from digital addictions including pornography, gaming, and social media dependency.",
    color: "from-[#2E7D32] to-[#00A651]",
  },
  {
    icon: Heart,
    title: "Mental Health",
    description: "Find support for anxiety, depression, stress, and identity struggles in a safe environment.",
    color: "from-[#4CAF50] to-[#2E7D32]",
  },
  {
    icon: Shield,
    title: "Substance Abuse",
    description: "Get education and accountability to avoid drug abuse, alcohol misuse, and risky behaviors.",
    color: "from-[#00A651] to-[#4CAF50]",
  },
  {
    icon: Users,
    title: "Relationships",
    description: "Navigate healthy friendships, dating, masculinity, respect, and marriage preparation.",
    color: "from-[#006B3C] to-[#2E7D32]",
  },
  {
    icon: Target,
    title: "Self-Discipline",
    description: "Build daily routines, focus, motivation, goal setting, and lasting habit formation.",
    color: "from-[#2E7D32] to-[#006B3C]",
  },
  {
    icon: DollarSign,
    title: "Financial Literacy",
    description: "Learn practical skills in budgeting, saving, entrepreneurship, and wealth building.",
    color: "from-[#00A651] to-[#2E7D32]",
  },
  {
    icon: Brain,
    title: "Personal Development",
    description: "Develop critical thinking, leadership skills, and emotional intelligence.",
    color: "from-[#4CAF50] to-[#00A651]",
  },
];

const benefits = [
  {
    icon: Users,
    title: "Experienced Mentors",
    description: "Connect with professionals aged 25-60 who have walked similar paths and overcome similar challenges.",
  },
  {
    icon: Lock,
    title: "Anonymous Identity",
    description: "Discuss sensitive topics freely using our anonymous username system that protects your privacy.",
  },
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    description: "Monitor growth with goal tracking, milestone achievements, and regular mentor feedback.",
  },
  {
    icon: Clock,
    title: "Flexible Schedule",
    description: "Engage with mentors at times that work for you through one-on-one and group sessions.",
  },
  {
    icon: BookOpen,
    title: "Resource Library",
    description: "Access curated content, guides, and tools to support your personal development journey.",
  },
  {
    icon: Shield,
    title: "Safe Environment",
    description: "All mentors are vetted and screened to ensure responsible, ethical mentorship.",
  },
];

const testimonials = [
  {
    name: "David K.",
    age: "21",
    role: "University Student",
    quote: "LeadHouse helped me overcome my addiction to gaming and social media. My mentor gave me practical strategies and held me accountable. I'm now focused on my studies and future.",
    image: "https://images.unsplash.com/photo-1584365132623-e273491c69d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIweW91dGglMjBsZWFkZXJzaGlwJTIwY29uZmlkZW50fGVufDF8fHx8MTc3MzA3OTg0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    name: "James M.",
    age: "19",
    role: "Career Seeker",
    quote: "I was lost after high school. My mentor helped me discover my passion for technology and guided me through career options. Now I'm pursuing software development with confidence.",
    image: "https://images.unsplash.com/photo-1764169689207-e23fb66e1fcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwYnVzaW5lc3MlMjBwcm9mZXNzaW9uYWwlMjBjb25maWRlbnR8ZW58MXx8fHwxNzczMDc5ODQ2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
];

export function ForMenteesPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#00A651] via-[#006B3C] to-[#2E7D32] text-white py-20 lg:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] bg-repeat"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium">
                For Young Men Ages 16-25
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Find Your Path. Build Your Future.
              </h1>
              
              <p className="text-xl text-white/90 leading-relaxed">
                Connect with experienced mentors who understand your challenges and will 
                guide you toward becoming the man you're meant to be.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/dashboard">
                  <Button 
                    size="lg" 
                    className="bg-white text-[#00A651] hover:bg-gray-100 text-lg px-8 py-6"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
                >
                  Learn More
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1584365132623-e273491c69d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIweW91dGglMjBsZWFkZXJzaGlwJTIwY29uZmlkZW50fGVufDF8fHx8MTc3MzA3OTg0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Young confident leader"
                  className="w-full h-[500px] object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Challenges We Address */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-[#006B3C] mb-4">
              Real Challenges. Real Solutions.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're navigating career decisions, struggling with digital addiction, 
              or seeking personal growth—we're here to help.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {challenges.map((challenge, index) => {
              const Icon = challenge.icon;
              return (
                <motion.div
                  key={challenge.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Card className="h-full hover:shadow-xl transition-all border-none bg-gradient-to-br from-white to-[#E8F5E9] group">
                    <CardContent className="p-6 space-y-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${challenge.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#006B3C]">{challenge.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{challenge.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 bg-gradient-to-b from-[#E8F5E9] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-[#006B3C] mb-4">
              What You Get as a Mentee
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Access powerful tools and resources designed to accelerate your personal growth
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-none">
                    <CardContent className="p-6 space-y-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-xl flex items-center justify-center">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-[#006B3C]">{benefit.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-[#006B3C] mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from young men whose lives have been transformed through mentorship
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full border-none bg-gradient-to-br from-[#E8F5E9] to-white">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                        <ImageWithFallback
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#006B3C]">{testimonial.name}</h4>
                        <p className="text-sm text-gray-600">{testimonial.role}, Age {testimonial.age}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed italic">"{testimonial.quote}"</p>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <CheckCircle2 key={star} className="w-5 h-5 text-[#00A651]" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Get Started */}
      <section className="py-20 bg-gradient-to-br from-[#00A651] to-[#006B3C] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-8"
          >
            <h2 className="text-3xl lg:text-4xl font-bold">
              Ready to Start Your Transformation?
            </h2>
            <p className="text-xl text-white/90">
              Join 2,000+ young men who are building disciplined, purpose-driven lives 
              through trusted mentorship.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 py-8">
              {[
                { step: "1", title: "Sign Up", desc: "Create your profile" },
                { step: "2", title: "Get Matched", desc: "Find your mentor" },
                { step: "3", title: "Start Growing", desc: "Transform your life" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-lg mb-1">{item.title}</h4>
                  <p className="text-white/80 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-white text-[#00A651] hover:bg-gray-100 text-lg px-8 py-6"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
                >
                  View Pricing
                </Button>
              </Link>
            </div>

            <p className="text-sm text-white/70 pt-4">
              *Users under 18 require parental or guardian consent
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}