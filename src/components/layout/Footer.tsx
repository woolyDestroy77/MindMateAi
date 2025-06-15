import React from 'react';
import { Heart, Twitter, Instagram, Facebook, Github } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-lavender-600 to-sage-500 bg-clip-text text-transparent">
              PureMind AI
            </div>
            <p className="text-gray-600 text-sm">
              AI-powered mental wellness companion that's always there to support your emotional wellbeing.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-lavender-600 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-500 hover:text-lavender-600 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-500 hover:text-lavender-600 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-500 hover:text-lavender-600 transition-colors">
                <Github size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Product</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-lavender-600 transition-colors">Features</a></li>
              <li><a href="#" className="text-gray-600 hover:text-lavender-600 transition-colors">Pricing</a></li>
              <li><a href="#" className="text-gray-600 hover:text-lavender-600 transition-colors">Testimonials</a></li>
              <li><a href="#" className="text-gray-600 hover:text-lavender-600 transition-colors">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Resources</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-lavender-600 transition-colors">Mental Health Guide</a></li>
              <li><a href="#" className="text-gray-600 hover:text-lavender-600 transition-colors">AI Ethics</a></li>
              <li><a href="#" className="text-gray-600 hover:text-lavender-600 transition-colors">Privacy Practices</a></li>
              <li><a href="#" className="text-gray-600 hover:text-lavender-600 transition-colors">Support Resources</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Company</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-lavender-600 transition-colors">About Us</a></li>
              <li><a href="#" className="text-gray-600 hover:text-lavender-600 transition-colors">Contact</a></li>
              <li><a href="#" className="text-gray-600 hover:text-lavender-600 transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-600 hover:text-lavender-600 transition-colors">Partners</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm text-center">
            © {new Date().getFullYear()} PureMind AI. All rights reserved. Made with <Heart size={14} className="inline text-red-500" /> for better mental wellness.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;