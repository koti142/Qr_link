import React from 'react';
import { Star } from 'lucide-react';

export const Testimonial: React.FC = () => {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-white border border-white/20 shadow-2xl">
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-lg leading-relaxed mb-6 font-light">
        "Vissito has completely transformed how we manage our global supply chain. The insights are instantaneous, and the interface is simply beautiful."
      </p>
      <div className="flex items-center gap-4">
        <img 
          src="https://picsum.photos/100/100" 
          alt="User" 
          className="w-12 h-12 rounded-full border-2 border-white/50 object-cover"
        />
        <div>
          <div className="font-semibold">Elena Rodriguez</div>
          <div className="text-sm text-brand-100">CTO, Nexus Industries</div>
        </div>
      </div>
    </div>
  );
};