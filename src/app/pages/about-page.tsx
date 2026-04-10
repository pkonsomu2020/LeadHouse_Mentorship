import { motion } from "motion/react";
import { Target, Eye, Shield, Users, TrendingUp, Heart } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const coreValues = [
  {
    icon: Target,
    title: "Discipline",
    description: "Building habits and self-control necessary for success in all areas of life.",
    gradient: "from-[#00A651] to-[#006B3C]",
  },
  {
    icon: Shield,
    title: "Integrity",
    description: "Promoting honesty, responsibility, and ethical leadership in every decision.",
    gradient: "from-[#2E7D32] to-[#00A651]",
  },
  {
    icon: Users,
    title: "Brotherhood",
    description: "Creating supportive communities of men who uplift and encourage one another.",
    gradient: "from-[#4CAF50] to-[#2E7D32]",
  },
  {
    icon: TrendingUp,
    title: "Growth",
    description: "Encouraging continuous learning, development, and striving for excellence.",
    gradient: "from-[#00A651] to-[#4CAF50]",
  },
  {
    icon: Heart,
    title: "Accountability",
    description: "Helping young men stay committed to their goals and responsibilities.",
    gradient: "from-[#006B3C] to-[#2E7D32]",
  },
];

const milestones = [
  { year: "2026", title: "Founded", description: "LeadHouse was established in Kisumu, Kenya" },
  { year: "Q1", title: "Pilot Launch", description: "Recruited first mentors and onboarded initial mentees" },
  { year: "Q2", title: "500+ Mentees", description: "Reached our first major milestone" },
  { year: "Q3", title: "National Expansion", description: "Expanded to 15+ cities across Kenya" },
  { year: "Q4", title: "2,000+ Lives", description: "Transformed thousands of young men's lives" },
];

export function AboutPage() {
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
              Building a Generation of Leaders
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 leading-relaxed">
              LeadHouse is more than a platform—it's a movement to raise disciplined, 
              responsible, and purpose-driven men equipped to lead in their careers, 
              families, and communities.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-xl mb-4">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#006B3C]">Our Vision</h2>
              <p className="text-xl text-gray-700 leading-relaxed">
                To raise a generation of disciplined, responsible, and purpose-driven men 
                equipped to lead in their careers, families, and communities.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We envision a world where young men have access to the guidance and support 
                they need to overcome challenges, develop strong character, and achieve their 
                full potential. Through meaningful mentorship relationships, we're building a 
                future where leadership is grounded in integrity and service.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#2E7D32] to-[#00A651] rounded-xl mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#006B3C]">Our Mission</h2>
              <p className="text-xl text-gray-700 leading-relaxed">
                To provide a safe, structured, and accessible mentorship platform where young 
                men can receive guidance, develop life skills, and grow through meaningful 
                relationships with experienced mentors.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We connect young men aged 16-25 with experienced mentors aged 25-60 who provide 
                wisdom, accountability, and practical life insights. Our platform addresses real 
                challenges including career uncertainty, mental health, relationships, and personal 
                development.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-[#E8F5E9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3R1ZGVudHMlMjBzdHVkeWluZyUyMHRvZ2V0aGVyfGVufDF8fHx8MTc3MzA1MzgzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="University students studying together"
                  className="w-full h-[500px] object-cover"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6 order-1 lg:order-2"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-[#006B3C]">
                Why LeadHouse Exists
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  In today's fast-paced world, young men face unprecedented challenges. From 
                  navigating career decisions to managing digital addiction, from building healthy 
                  relationships to developing self-discipline—the journey to manhood has never been 
                  more complex.
                </p>
                <p>
                  Many young men lack access to experienced mentors who can provide guidance, 
                  accountability, and real-life wisdom. This gap often leads to uncertainty, poor 
                  decisions, and unrealized potential.
                </p>
                <p>
                  LeadHouse was created to bridge this gap. We believe that every young man deserves 
                  a mentor—someone who has walked similar paths, faced similar challenges, and can 
                  offer trusted guidance. Through our platform, we're creating a community where 
                  mentorship is accessible, structured, and transformative.
                </p>
                <p className="font-semibold text-[#006B3C]">
                  Together, we're raising a generation of leaders who will shape a better future.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-[#006B3C] mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These principles guide every mentorship relationship on our platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreValues.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-all border-none bg-gradient-to-br from-white to-[#E8F5E9]">
                    <CardContent className="p-6 space-y-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${value.gradient} rounded-xl flex items-center justify-center`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-[#006B3C]">{value.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Journey/Timeline */}
      <section className="py-20 bg-gradient-to-b from-[#E8F5E9] to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-[#006B3C] mb-4">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600">
              From a local initiative to a transformative movement
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[#81C784] hidden md:block"></div>

            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative flex items-start space-x-6"
                >
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-full flex items-center justify-center text-white font-bold shadow-lg z-10">
                    {milestone.year}
                  </div>
                  <Card className="flex-1 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold text-[#006B3C] mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-gray-600">{milestone.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-20 bg-gradient-to-br from-[#00A651] to-[#006B3C] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Our Impact in Numbers
            </h2>
            <p className="text-xl text-white/90">
              Real results from real mentorship relationships
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { value: "2,000+", label: "Young Men Mentored" },
              { value: "500+", label: "Expert Mentors" },
              { value: "15+", label: "Cities Covered" },
              { value: "95%", label: "Success Rate" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-5xl font-bold mb-2">{stat.value}</p>
                <p className="text-white/80">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
