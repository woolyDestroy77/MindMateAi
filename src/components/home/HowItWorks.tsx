import React from 'react';
import { PenTool, BarChart2, FileText, ArrowRight } from 'lucide-react';

const steps = [
  {
    id: 1,
    name: 'Journal',
    description: 'Start by writing about your thoughts and feelings in our intuitive digital journal interface.',
    icon: PenTool,
    color: 'bg-lavender-500',
  },
  {
    id: 2,
    name: 'Express',
    description: 'Share your emotions through text or voice. Our system analyzes patterns in your expressions.',
    icon: FileText,
    color: 'bg-sage-500',
  },
  {
    id: 3,
    name: 'Track',
    description: 'Review your emotional patterns in the mood tracker. Identify triggers and track progress over time.',
    icon: BarChart2,
    color: 'bg-lavender-500',
  },
  {
    id: 4,
    name: 'Grow',
    description: 'Receive personalized insights and strategies to help manage emotions and improve mental wellbeing.',
    icon: ArrowRight,
    color: 'bg-sage-500',
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            How PureMind AI Works
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
            Our intelligent system helps you understand and track your emotional journey.
          </p>
        </div>
        
        <div className="mt-16">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            <div className="relative">
              <div className="relative lg:h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-lavender-100 to-sage-100 rounded-2xl opacity-20 transform -rotate-6"></div>
                <div className="relative h-full bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div className="h-12 bg-gradient-to-r from-lavender-600 to-sage-500 flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="mx-auto text-white font-medium">PureMind AI Journal</div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex flex-col space-y-3">
                      <div className="bg-lavender-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-500">Today, 2:30 PM</span>
                          <span className="text-xl">😌</span>
                        </div>
                        <p className="text-sm text-gray-700">Had a productive morning. Feeling calm and focused after my meditation session.</p>
                      </div>
                      
                      <div className="bg-sage-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-500">Yesterday, 6:45 PM</span>
                          <span className="text-xl">😊</span>
                        </div>
                        <p className="text-sm text-gray-700">Great day at work! Completed my project and received positive feedback from my team.</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-500">2 days ago, 8:20 AM</span>
                          <span className="text-xl">😐</span>
                        </div>
                        <p className="text-sm text-gray-700">Feeling a bit overwhelmed with deadlines. Need to practice some stress management techniques.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center border rounded-full pl-4 pr-2 py-1">
                      <input type="text" placeholder="How are you feeling today?" className="flex-1 outline-none text-sm" />
                      <button className="bg-lavender-500 text-white rounded-full p-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <dl className="space-y-10">
                {steps.map((step) => (
                  <div key={step.id} className="relative">
                    <dt>
                      <div className={`absolute flex items-center justify-center h-12 w-12 rounded-md ${step.color} text-white`}>
                        <step.icon className="h-6 w-6" />
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{step.name}</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-600">{step.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;