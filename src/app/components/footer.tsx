import { Link } from "react-router";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#1F2933] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">LH</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold">LeadHouse</span>
                <span className="text-xs text-gray-400">Discipline. Direction. Leadership.</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Empowering young men to build disciplined, purpose-driven lives through trusted mentorship.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="w-9 h-9 bg-[#00A651] rounded-full flex items-center justify-center hover:bg-[#006B3C] transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-[#00A651] rounded-full flex items-center justify-center hover:bg-[#006B3C] transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-[#00A651] rounded-full flex items-center justify-center hover:bg-[#006B3C] transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-[#00A651] rounded-full flex items-center justify-center hover:bg-[#006B3C] transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-[#00A651] transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-[#00A651] transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-gray-400 hover:text-[#00A651] transition-colors text-sm">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-400 hover:text-[#00A651] transition-colors text-sm">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h3 className="font-semibold text-lg mb-4">For Users</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/for-mentees" className="text-gray-400 hover:text-[#00A651] transition-colors text-sm">
                  For Mentees
                </Link>
              </li>
              <li>
                <Link to="/for-mentors" className="text-gray-400 hover:text-[#00A651] transition-colors text-sm">
                  For Mentors
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-[#00A651] transition-colors text-sm">
                  Success Stories
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-[#00A651] transition-colors text-sm">
                  Resources
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-gray-400 text-sm">
                <MapPin className="w-5 h-5 text-[#00A651] flex-shrink-0 mt-0.5" />
                <span>Kisumu, Kenya</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400 text-sm">
                <Mail className="w-5 h-5 text-[#00A651] flex-shrink-0" />
                <span>info@leadhouse.com</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400 text-sm">
                <Phone className="w-5 h-5 text-[#00A651] flex-shrink-0" />
                <span>+254 700 000 000</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} LeadHouse. All rights reserved. | 
            <a href="#" className="text-[#00A651] hover:underline ml-1">Privacy Policy</a> | 
            <a href="#" className="text-[#00A651] hover:underline ml-1">Terms of Service</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
