import { motion } from "motion/react";
import { Link } from "react-router";
import { Check, CreditCard, Smartphone, Shield, ArrowRight, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

const pricingTiers = [
  {
    name: "Monthly",
    price: "KES 500",
    period: "/month",
    description: "Perfect for getting started with mentorship",
    features: [
      "One-on-one mentor matching",
      "Unlimited messaging with mentor",
      "Monthly accountability sessions",
      "Access to resource library",
      "Progress tracking tools",
      "Group discussion participation",
      "Goal setting features",
      "Mobile and desktop access",
    ],
    popular: false,
    color: "from-[#4CAF50] to-[#2E7D32]",
  },
  {
    name: "Quarterly",
    price: "KES 1,350",
    period: "/3 months",
    description: "Best value for committed growth",
    features: [
      "Everything in Monthly",
      "Save 10% on monthly price",
      "Priority mentor matching",
      "Bi-weekly check-ins",
      "Access to exclusive workshops",
      "Peer accountability groups",
      "Extended mentor availability",
      "Quarterly progress reports",
    ],
    popular: true,
    color: "from-[#00A651] to-[#006B3C]",
  },
  {
    name: "Annual",
    price: "KES 4,800",
    period: "/year",
    description: "Maximum savings for long-term transformation",
    features: [
      "Everything in Quarterly",
      "Save 20% on monthly price",
      "VIP mentor selection",
      "Weekly check-ins available",
      "Premium workshops & events",
      "Leadership development program",
      "Certificate of completion",
      "Lifetime alumni network access",
    ],
    popular: false,
    color: "from-[#2E7D32] to-[#006B3C]",
  },
];

const paymentMethods = [
  {
    icon: Smartphone,
    title: "M-Pesa",
    description: "Easy mobile money payments via M-Pesa integration",
  },
  {
    icon: CreditCard,
    title: "Card Payments",
    description: "Secure debit/credit card payments via Pesapal & Flutterwave",
  },
];

const faqs = [
  {
    question: "Is there a free trial?",
    answer: "Yes! New users get a 7-day free trial to experience the platform and connect with a mentor before committing to a subscription.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Absolutely. You can cancel your subscription at any time. Your access will continue until the end of your billing period.",
  },
  {
    question: "What if I'm under 18?",
    answer: "Users under 18 years old require parental or guardian consent before accessing mentorship services. We'll guide you through the consent process during sign-up.",
  },
  {
    question: "How do I pay with M-Pesa?",
    answer: "During checkout, select M-Pesa as your payment method. You'll receive a prompt on your phone to authorize the payment. It's quick and secure.",
  },
  {
    question: "Can I switch mentors?",
    answer: "Yes! If you feel your current mentor isn't the right fit, you can request a new match at any time through your dashboard.",
  },
  {
    question: "Are mentor sessions private?",
    answer: "Yes, all one-on-one sessions are completely private. We use anonymous usernames to protect your privacy, and conversations are confidential.",
  },
  {
    question: "What happens if my mentor is unavailable?",
    answer: "Mentors commit to minimum availability, but if issues arise, we'll work with you to reschedule or temporarily match you with another qualified mentor.",
  },
  {
    question: "Do mentors get paid?",
    answer: "Currently, mentors participate voluntarily to make a positive impact. We have plans for recognition programs and premium mentorship tiers in the future.",
  },
];

export function PricingPage() {
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
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 leading-relaxed">
              Invest in your future with affordable mentorship plans. 
              Start your transformation journey today.
            </p>
            <div className="mt-8 inline-block px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full">
              <p className="text-lg font-medium">🎉 7-Day Free Trial for All New Users</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative ${tier.popular ? "md:-mt-4 md:mb-4" : ""}`}
              >
                {tier.popular && (
                  <div className="absolute -top-5 left-0 right-0 flex justify-center">
                    <div className="bg-gradient-to-r from-[#00A651] to-[#006B3C] text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <Card className={`h-full border-2 ${tier.popular ? "border-[#00A651] shadow-2xl" : "border-gray-200"}`}>
                  <CardHeader className={`bg-gradient-to-br ${tier.color} text-white p-8 rounded-t-lg`}>
                    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                    <div className="flex items-baseline mb-3">
                      <span className="text-5xl font-bold">{tier.price}</span>
                      <span className="text-xl ml-2 text-white/80">{tier.period}</span>
                    </div>
                    <p className="text-white/90">{tier.description}</p>
                  </CardHeader>
                  
                  <CardContent className="p-8 space-y-6">
                    <ul className="space-y-4">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start space-x-3">
                          <Check className="w-5 h-5 text-[#00A651] flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Link to="/dashboard" className="block">
                      <Button 
                        className={`w-full text-lg py-6 ${
                          tier.popular 
                            ? "bg-[#00A651] hover:bg-[#006B3C]" 
                            : "bg-gray-800 hover:bg-gray-900"
                        }`}
                      >
                        Get Started
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-gray-600">
              All plans include access to our secure platform and are protected by our{" "}
              <span className="text-[#00A651] font-semibold">Money-Back Guarantee</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-20 bg-[#E8F5E9]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-[#006B3C] mb-4">
              Flexible Payment Options
            </h2>
            <p className="text-xl text-gray-600">
              Choose the payment method that works best for you
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {paymentMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <motion.div
                  key={method.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full border-none shadow-lg">
                    <CardContent className="p-8 text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-full">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-semibold text-[#006B3C]">{method.title}</h3>
                      <p className="text-gray-600">{method.description}</p>
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
            className="mt-12 bg-white rounded-2xl p-8 text-center shadow-lg"
          >
            <Shield className="w-12 h-12 text-[#00A651] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-[#006B3C] mb-3">
              Secure & Encrypted Payments
            </h3>
            <p className="text-gray-700 max-w-2xl mx-auto">
              All transactions are secured with industry-standard encryption. We partner with 
              trusted payment providers like Pesapal and Flutterwave to ensure your financial 
              information is always protected.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <HelpCircle className="w-12 h-12 text-[#00A651] mx-auto mb-4" />
            <h2 className="text-3xl lg:text-4xl font-bold text-[#006B3C] mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Got questions? We've got answers.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-[#E8F5E9] rounded-lg px-6 border-none"
                >
                  <AccordionTrigger className="text-left font-semibold text-[#006B3C] hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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
              Start Your Free Trial Today
            </h2>
            <p className="text-xl text-white/90">
              Experience the power of mentorship risk-free. No credit card required for your 7-day trial.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-[#00A651] hover:bg-gray-100 text-lg px-8 py-6"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
              >
                Contact Sales
              </Button>
            </div>
            <p className="text-sm text-white/70 pt-4">
              Join 2,000+ young men already transforming their lives through mentorship
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
