import { motion } from "motion/react";
import { Link } from "react-router";
import { UserPlus, Users, MessageCircle, TrendingUp, Shield, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Sign Up Anonymously",
    description: "Create your account using a unique anonymous username. Share your interests, career aspirations, and personal growth goals while maintaining your privacy.",
    features: [
      "Anonymous username system",
      "Secure profile creation",
      "Define your goals",
      "Share challenges privately",
    ],
    color: "from-[#00A651] to-[#006B3C]",
  },
  {
    number: "02",
    icon: Users,
    title: "Get Matched",
    description: "Our intelligent matching system pairs you with experienced mentors based on your career field, interests, personal growth needs, and location.",
    features: [
      "Smart algorithm matching",
      "Career-aligned mentors",
      "Vetted professionals",
      "Location-based options",
    ],
    color: "from-[#2E7D32] to-[#00A651]",
  },
  {
    number: "03",
    icon: MessageCircle,
    title: "Engage & Connect",
    description: "Start meaningful conversations with your mentor through one-on-one sessions, group discussions, and accountability check-ins.",
    features: [
      "One-on-one mentorship",
      "Group discussions",
      "Regular check-ins",
      "Mentorship challenges",
    ],
    color: "from-[#4CAF50] to-[#2E7D32]",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Track Your Growth",
    description: "Monitor your progress with our growth tracking tools. Set goals, track milestones, and receive valuable feedback from your mentor.",
    features: [
      "Progress tracking",
      "Goal setting tools",
      "Milestone monitoring",
      "Mentor feedback",
    ],
    color: "from-[#00A651] to-[#4CAF50]",
  },
];

const safetyFeatures = [
  {
    icon: Shield,
    title: "Mentor Vetting",
    description: "All mentors undergo thorough screening and onboarding to ensure safe, responsible mentorship.",
  },
  {
    icon: Lock,
    title: "Data Protection",
    description: "Full compliance with Kenya's Data Protection Act. Your information is encrypted and secure.",
  },
  {
    icon: CheckCircle2,
    title: "Parental Consent",
    description: "Users under 18 require parental or guardian consent before accessing mentorship services.",
  },
];

export function HowItWorksPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#00A651] via-[#006B3C] to-[#2E7D32] text-white py-20 lg:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] bg-repeat"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              How LeadHouse Works
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 leading-relaxed">
              A simple, structured process that connects you with experienced mentors 
              and transforms your life through accountability and guidance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-[#006B3C] mb-4">
              Your Journey in 4 Simple Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From sign-up to transformation, we've made the process seamless and effective
            </p>
          </motion.div>

          <div className="space-y-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;
              
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`grid lg:grid-cols-2 gap-12 items-center ${!isEven ? "lg:grid-flow-dense" : ""}`}
                >
                  <div className={`${!isEven ? "lg:col-start-2" : ""} space-y-6`}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-6xl font-bold text-[#E8F5E9]">{step.number}</span>
                    </div>
                    
                    <h3 className="text-3xl font-bold text-[#006B3C]">{step.title}</h3>
                    <p className="text-xl text-gray-700 leading-relaxed">{step.description}</p>
                    
                    <div className="space-y-3">
                      {step.features.map((feature) => (
                        <div key={feature} className="flex items-center space-x-3">
                          <CheckCircle2 className="w-5 h-5 text-[#00A651] flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`${!isEven ? "lg:col-start-1 lg:row-start-1" : ""}`}>
                    <Card className="overflow-hidden border-none shadow-xl">
                      <div className={`h-2 bg-gradient-to-r ${step.color}`}></div>
                      <CardContent className="p-8 bg-gradient-to-br from-white to-[#E8F5E9]">
                        <div className="aspect-[4/3] bg-white rounded-lg shadow-inner flex items-center justify-center">
                          <Icon className="w-32 h-32 text-[#81C784]" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Engagement Section */}
      <section className="py-20 bg-[#E8F5E9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-[#006B3C]">
                Multiple Ways to Engage
              </h2>
              <p className="text-xl text-gray-700 leading-relaxed">
                LeadHouse offers various formats to ensure meaningful mentorship experiences 
                that fit your needs and schedule.
              </p>
              
              <div className="space-y-4">
                {[
                  {
                    title: "One-on-One Sessions",
                    desc: "Private conversations with your mentor for personalized guidance",
                  },
                  {
                    title: "Group Mentorship",
                    desc: "Learn alongside peers in guided group discussions",
                  },
                  {
                    title: "Accountability Check-ins",
                    desc: "Regular progress reviews to keep you on track",
                  },
                  {
                    title: "Challenges & Activities",
                    desc: "Practical tasks that build discipline and skills",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-4 bg-white p-4 rounded-lg shadow-sm"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#006B3C] mb-1">{item.title}</h4>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1758691737082-abb40e6e3d05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtd29yayUyMGNvbGxhYm9yYXRpb24lMjBncm93dGh8ZW58MXx8fHwxNzczMDc5ODQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Teamwork and collaboration"
                  className="w-full h-[500px] object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Safety & Privacy */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-[#006B3C] mb-4">
              Your Safety is Our Priority
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We've implemented comprehensive safety measures to ensure a secure and 
              trusted mentorship environment
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {safetyFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-shadow border-none">
                    <CardContent className="p-8 space-y-4 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-full mb-4">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-[#006B3C]">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 bg-gradient-to-br from-[#E8F5E9] to-[#81C784]/20 rounded-2xl p-8 text-center"
          >
            <Shield className="w-12 h-12 text-[#00A651] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-[#006B3C] mb-3">
              Compliant with Kenya's Data Protection Act
            </h3>
            <p className="text-gray-700 max-w-2xl mx-auto">
              LeadHouse follows all regulations under the Office of the Data Protection Commissioner, 
              ensuring your personal information is handled with the highest standards of security and privacy.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#00A651] to-[#006B3C] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl lg:text-4xl font-bold">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-white/90">
              Join thousands of young men who are building disciplined, purpose-driven lives 
              through trusted mentorship.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
          </motion.div>
        </div>
      </section>
    </div>
  );
}
