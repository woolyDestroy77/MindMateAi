import React from 'react';
import { motion } from 'framer-motion';
import { Testimonial } from '../../types';
import Card from '../ui/Card';

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah L.',
    text: 'MindMate AI helped me recognize patterns in my anxiety that I hadn\'t noticed before. The voice responses feel remarkably human and comforting during tough moments.',
    emotion: 'anxious',
    avatar: 'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=200'
  },
  {
    id: '2',
    name: 'Michael J.',
    text: 'As someone dealing with depression, having 24/7 support has been life-changing. The mood tracker has helped me see gradual improvements I might have missed otherwise.',
    emotion: 'sad',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200'
  },
  {
    id: '3',
    name: 'Elena R.',
    text: 'I use the multilingual feature to practice expressing emotions in my native language. MindMate AI adapts perfectly to cultural nuances in how I communicate my feelings.',
    emotion: 'happy',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200'
  },
  {
    id: '4',
    name: 'David K.',
    text: 'The emotion detection is surprisingly accurate. During a stressful work period, MindMate suggested techniques that helped me manage anger and frustration in healthier ways.',
    emotion: 'angry',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200'
  },
];

const TestimonialCard: React.FC<{ testimonial: Testimonial; index: number }> = ({ testimonial, index }) => {
  const emotionColorMap = {
    anxious: 'border-yellow-300',
    sad: 'border-blue-300',
    happy: 'border-green-300',
    angry: 'border-red-300',
    calm: 'border-sage-300',
    neutral: 'border-gray-300',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card variant="elevated" className="h-full">
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="flex flex-col h-full"
        >
          <div className="flex items-center mb-4">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className={`flex-shrink-0 h-12 w-12 rounded-full overflow-hidden border-2 ${emotionColorMap[testimonial.emotion]}`}
            >
              <img 
                src={testimonial.avatar} 
                alt={testimonial.name} 
                className="h-full w-full object-cover"
              />
            </motion.div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-gray-900">{testimonial.name}</h4>
              <p className="text-sm text-gray-600 capitalize">Managed: {testimonial.emotion} feelings</p>
            </div>
          </div>
          
          <div className="flex-grow">
            <p className="text-gray-700 italic">"{testimonial.text}"</p>
          </div>
          
          <motion.div
            initial={{ scale: 0.8 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="mt-4 flex items-center justify-end"
          >
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <motion.svg
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </motion.svg>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </Card>
    </motion.div>
  );
};

const Testimonials: React.FC = () => {
  return (
    <section id="testimonials" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Real People, Real Growth
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
            See how MindMate AI has helped others on their mental wellness journey.
          </p>
        </motion.div>
        
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <p className="text-base text-gray-600">
            Join thousands of others who have improved their mental wellbeing with MindMate AI.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;