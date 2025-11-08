import React from 'react';
import { BookOpen, Lightbulb, Target, CheckCircle, ExternalLink, Image as ImageIcon } from 'lucide-react';

function LessonViewer({ lesson, images }) {
  if (!lesson) return null;

  console.log('LessonViewer - lesson:', lesson);
  console.log('LessonViewer - images:', images);
  console.log('LessonViewer - images keys:', Object.keys(images || {}));

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="lesson-card bg-gradient-to-br from-primary-500 to-indigo-600 text-white">
        <div className="flex items-start gap-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{lesson.title}</h1>
            {lesson.subtitle && (
              <p className="text-xl text-white/90">{lesson.subtitle}</p>
            )}
            <div className="mt-4 flex items-center gap-4 text-sm text-white/80">
              <span>Version {lesson.version}</span>
              <span>•</span>
              <span>Topic: {lesson.topic}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Introduction */}
      {lesson.introduction && (
        <div className="lesson-card">
          <h2 className="lesson-heading">
            <BookOpen className="w-6 h-6 text-primary-500" />
            Introduction
          </h2>
          <p className="lesson-text">{lesson.introduction.text}</p>
          {images.introduction && (
            <img
              src={images.introduction}
              alt="Introduction"
              className="lesson-image"
            />
          )}
        </div>
      )}

      {/* Key Concepts */}
      {lesson.key_concepts && lesson.key_concepts.length > 0 && (
        <div className="lesson-card">
          <h2 className="lesson-heading">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            Key Concepts
          </h2>
          <div className="space-y-4">
            {lesson.key_concepts.map((concept, index) => (
              <div key={index} className="concept-card">
                <h3 className="lesson-subheading text-blue-700">
                  {concept.title}
                </h3>
                <p className="lesson-text">{concept.description}</p>
                {images[`key_concept_${index}`] && (
                  <img
                    src={images[`key_concept_${index}`]}
                    alt={concept.title}
                    className="lesson-image"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Content */}
      {lesson.detailed_content && lesson.detailed_content.length > 0 && (
        <div className="lesson-card">
          <h2 className="lesson-heading">
            <Target className="w-6 h-6 text-purple-500" />
            Detailed Content
          </h2>
          <div className="space-y-6">
            {lesson.detailed_content.map((section, index) => (
              <div key={index} className="lesson-section">
                <h3 className="lesson-subheading">{section.heading}</h3>
                {section.paragraphs && section.paragraphs.map((paragraph, pIndex) => (
                  <p key={pIndex} className="lesson-text">{paragraph}</p>
                ))}
                {images[`detailed_content_${index}`] && (
                  <img
                    src={images[`detailed_content_${index}`]}
                    alt={section.heading}
                    className="lesson-image"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activities */}
      {lesson.activities && (
        <div className="lesson-card">
          <h2 className="lesson-heading">
            <CheckCircle className="w-6 h-6 text-green-500" />
            {lesson.activities.title || 'Practice Activities'}
          </h2>
          {images.activities && (
            <img
              src={images.activities}
              alt="Activities"
              className="lesson-image mb-4"
            />
          )}
          <div className="space-y-3">
            {lesson.activities.items && lesson.activities.items.map((activity, index) => (
              <div key={index} className="activity-card">
                <div className="flex items-start gap-3">
                  <div className="bg-green-200 text-green-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-1">
                      {activity.title}
                    </h4>
                    <p className="text-gray-600 text-sm">{activity.description}</p>
                    {activity.type && (
                      <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        {activity.type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {lesson.summary && (
        <div className="lesson-card bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
          <h2 className="lesson-heading">
            <CheckCircle className="w-6 h-6 text-amber-600" />
            Summary
          </h2>
          <p className="lesson-text font-medium text-gray-700">{lesson.summary.text}</p>
          {lesson.summary.key_points && lesson.summary.key_points.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-gray-800 mb-2">Key Takeaways:</h3>
              <ul className="space-y-2">
                {lesson.summary.key_points.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Additional Resources */}
      {lesson.additional_resources && lesson.additional_resources.length > 0 && (
        <div className="lesson-card">
          <h2 className="lesson-heading">
            <ExternalLink className="w-6 h-6 text-blue-500" />
            Additional Resources
          </h2>
          <ul className="space-y-2">
            {lesson.additional_resources.map((resource, index) => (
              <li key={index} className="flex items-start gap-2">
                <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1" />
                <span className="text-gray-700">{resource}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default LessonViewer;
