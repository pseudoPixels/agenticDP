import React from 'react';
import { FileText, Presentation, BookOpen, Edit3, Save, Download, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function HowItWorks() {
  const navigate = useNavigate();

  const features = [
    {
      icon: BookOpen,
      title: 'Create Lessons',
      description: 'Generate comprehensive, engaging lessons on any topic. Simply describe what you need, and our AI creates structured content with key concepts, activities, and resources.',
      color: 'from-blue-400 to-blue-600'
    },
    {
      icon: FileText,
      title: 'Build Worksheets',
      description: 'Create custom worksheets tailored to any grade level. From practice problems to creative writing prompts, get professionally designed worksheets in seconds.',
      color: 'from-emerald-400 to-emerald-600'
    },
    {
      icon: Presentation,
      title: 'Design Presentations',
      description: 'Generate beautiful presentation decks with slides, content, and visuals. Perfect for classroom teaching or student projects.',
      color: 'from-purple-400 to-purple-600'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Describe What You Need',
      description: 'Simply type in what educational resource you want to create. Be as specific or general as you like.',
      icon: Sparkles
    },
    {
      number: '2',
      title: 'AI Generates Content',
      description: 'Our intelligent system creates professional, curriculum-aligned content with images and structured layouts.',
      icon: Edit3
    },
    {
      number: '3',
      title: 'Edit & Customize',
      description: 'Use natural language to refine your content. Ask for changes, additions, or modifications anytime.',
      icon: Edit3
    },
    {
      number: '4',
      title: 'Save & Download',
      description: 'Save your resources to your library and download them as PDF or PPTX files ready to use.',
      icon: Download
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            How Doodlepad Works
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Create professional educational resources in minutes with the power of AI. 
            No design skills required.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
            What You Can Create
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Steps */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
            Simple 4-Step Process
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
            From idea to finished resource in just a few clicks
          </p>
          
          <div className="space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col md:flex-row items-start gap-6"
                >
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  <div className="hidden md:block flex-shrink-0">
                    <Icon className="w-12 h-12 text-emerald-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { title: 'AI-Powered Generation', desc: 'Advanced AI creates high-quality educational content' },
              { title: 'Natural Language Editing', desc: 'Edit resources by simply describing what you want' },
              { title: 'Professional Templates', desc: 'Beautiful, curriculum-aligned designs out of the box' },
              { title: 'Instant Downloads', desc: 'Export as PDF or PPTX files ready to print or present' },
              { title: 'Save to Library', desc: 'Organize all your resources in one place' },
              { title: 'Student Assignment', desc: 'Assign resources to students and track progress' }
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-400 to-teal-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Start creating amazing educational resources today
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg text-lg"
          >
            Create Your First Resource
          </button>
        </div>
      </section>
    </div>
  );
}

export default HowItWorks;
