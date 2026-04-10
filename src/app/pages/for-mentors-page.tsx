import { motion } from "motion/react";
import { Link } from "react-router";
import {
  Heart,
  Award,
  Users,
  TrendingUp,
  Shield,
  Target,
  CheckCircle2,
  ArrowRight,
  Clock,
  Lightbulb,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const mentorTypes = [
  {
    icon: Users,
    title: "Professionals",
    description: "Corporate leaders, managers, and specialists sharing workplace wisdom",
  },
  {
    icon: Lightbulb,
    title: "Entrepreneurs",
    description: "Business owners guiding aspiring young entrepreneurs",
  },
  {
    icon: Award,
    title: "Skilled Tradesmen",
    description: "Experienced craftsmen mentoring in technical skills",
  },
  {
    icon: Heart,
    title: "Community Leaders",
    description: "Local leaders building strong community connections",
  },
  {
    icon: Target,
    title: "Coaches & Educators",
    description: "Teachers and coaches developing potential",
  },
];

const benefits = [
  {
    icon: Heart,
    title: "Make Real Impact",
    description: "Transform young men's lives and help build the next generation of leaders in your community.",
  },
  {
    icon: Users,
    title: "Share Your Journey",
    description: "Use your life experience and lessons learned to guide others who face similar challenges.",
  },
  {
    icon: TrendingUp,
    title: "Personal Growth",
    description: "Enhance your leadership and communication skills while giving back to society.",
  },
  {
    icon: Shield,
    title: "Vetted Community",
    description: "Join a trusted network of experienced mentors committed to positive change.",
  },
  {
    icon: Clock,
    title: "Flexible Commitment",
    description: "Choose mentorship formats and schedules that fit your lifestyle and availability.",
  },
  {
    icon: Award,
    title: "Recognition & Growth",
    description: "Gain recognition for your contribution and access to mentor development resources.",
  },
];

const requirements = [
  "Age 25-60 years",
  "Life or professional experience in relevant fields",
  "Commitment to guiding and supporting young men",
  "Pass background screening process",
  "Complete mentor onboarding training",
  "Dedicated 2-4 hours per month minimum",
];

const responsibilities = [
  {
    title: "One-on-One Mentorship",
    description: "Regular private sessions with assigned mentees to provide personalized guidance.",
  },
  {
    title: "Accountability Check-ins",
    description: "Monitor progress, celebrate wins, and help mentees stay committed to their goals.",
  },
  {
    title: "Group Discussions",
    description: "Lead or participate in group mentorship sessions on relevant topics.",
  },
  {
    title: "Share Real Experience",
    description: "Provide practical insights from your own life journey, challenges, and successes.",
  },
];

export function ForMentorsPage() {
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
                For Mentors Ages 25-60
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Shape the Next Generation
              </h1>
              
              <p className="text-xl text-white/90 leading-relaxed">
                Use your experience, wisdom, and journey to guide young men toward 
                disciplined, purpose-driven lives. Make an impact that lasts.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/dashboard">
                  <Button 
                    size="lg" 
                    className="bg-white text-[#00A651] hover:bg-gray-100 text-lg px-8 py-6"
                  >
                    Become a Mentor
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

              <div className="flex items-center space-x-6 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center"
                    >
                      <Users className="w-5 h-5" />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-semibold">500+ Mentors</p>
                  <p className="text-sm text-white/80">Making a difference</p>
                </div>
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
                  src="https://images.unsplash.com/photo-1609503842755-77f4a81d69ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtZW50b3IlMjBjb2FjaGluZ3xlbnwxfHx8fDE3NzI5ODUyMzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Professional mentor coaching"
                  className="w-full h-[500px] object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Types of Mentors */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-[#006B3C] mb-4">
              Who Can Be a Mentor?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We welcome experienced individuals from diverse backgrounds who are 
              passionate about guiding the next generation
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {mentorTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <motion.div
                  key={type.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-all border-none text-center">
                    <CardContent className="p-6 space-y-4">
                      <div className="w-14 h-14 mx-auto bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-full flex items-center justify-center">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="font-semibold text-[#006B3C]">{type.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{type.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Become a Mentor */}
      <section className="py-20 bg-gradient-to-b from-[#E8F5E9] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-[#006B3C] mb-4">
              Why Become a Mentor?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Mentorship is a rewarding experience that benefits both you and your mentees
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

      {/* Responsibilities */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-[#006B3C]">
                What You'll Do
              </h2>
              <p className="text-xl text-gray-700 leading-relaxed">
                As a mentor, you'll guide young men through life's challenges and help 
                them develop the skills they need to succeed.
              </p>
              
              <div className="space-y-4">
                {responsibilities.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#E8F5E9] p-5 rounded-lg"
                  >
                    <h4 className="font-semibold text-[#006B3C] mb-2 flex items-center">
                      <MessageCircle className="w-5 h-5 mr-2 text-[#00A651]" />
                      {item.title}
                    </h4>
                    <p className="text-gray-600 text-sm">{item.description}</p>
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
                  src="https://images.unsplash.com/photo-1764169689207-e23fb66e1fcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwYnVzaW5lc3MlMjBwcm9mZXNzaW9uYWwlMjBjb25maWRlbnR8ZW58MXx8fHwxNzczMDc5ODQ2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Professional confident mentor"
                  className="w-full h-[500px] object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-[#E8F5E9]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-[#006B3C] mb-4">
              Mentor Requirements
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              To ensure quality mentorship, we have specific criteria for our mentors
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="border-none shadow-xl">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  {requirements.map((requirement, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-3"
                    >
                      <CheckCircle2 className="w-6 h-6 text-[#00A651] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{requirement}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-[#006B3C] mb-4">
              How to Become a Mentor
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A simple 4-step process to join our community of mentors
            </p>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                step: "1",
                title: "Submit Application",
                desc: "Fill out our mentor application form with your background and experience",
              },
              {
                step: "2",
                title: "Background Screening",
                desc: "Complete our thorough vetting process to ensure safe mentorship",
              },
              {
                step: "3",
                title: "Onboarding Training",
                desc: "Participate in mentor training to learn best practices and platform tools",
              },
              {
                step: "4",
                title: "Start Mentoring",
                desc: "Get matched with mentees and begin making an impact",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6 flex items-center space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-[#006B3C] mb-2">{item.title}</h3>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-[#00A651] hidden lg:block" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
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
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-white/90">
              Join 500+ mentors who are transforming lives and building the next generation 
              of leaders in Kenya and beyond.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-white text-[#00A651] hover:bg-gray-100 text-lg px-8 py-6"
                >
                  Apply to Become a Mentor
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
        </div>
      </section>
    </div>
  );
}
