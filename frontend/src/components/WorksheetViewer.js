import React from 'react';
import { FileText, Download, Clock, BookOpen } from 'lucide-react';
import { downloadWorksheet } from '../api';

function WorksheetViewer({ worksheet, images, isProcessing = false }) {
  if (!worksheet) return null;

  const sections = worksheet.sections || [];

  const handleDownload = async () => {
    try {
      const blob = await downloadWorksheet(worksheet.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${worksheet.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading worksheet:', error);
      alert('Failed to download worksheet. Please try again.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 ${isProcessing ? 'opacity-50' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500 flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">{worksheet.title}</h1>
          </div>
          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap flex-shrink-0"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">Download</span>
          </button>
        </div>
        
        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
          {worksheet.subtitle && <span>{worksheet.subtitle}</span>}
          {worksheet.grade_level && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {worksheet.grade_level}
              </span>
            </>
          )}
          {worksheet.subject && (
            <>
              <span>•</span>
              <span>{worksheet.subject}</span>
            </>
          )}
          {worksheet.estimated_time && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {worksheet.estimated_time}
              </span>
            </>
          )}
        </div>

        {/* Instructions */}
        {worksheet.instructions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 font-semibold mb-1">Instructions:</p>
            <p className="text-blue-800">{worksheet.instructions}</p>
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {sections.map((section, sectionIdx) => {
          const imageKey = `section_${sectionIdx}`;
          const image = images[imageKey];
          const sectionType = section.type || 'short_answer';

          return (
            <div key={sectionIdx} className="bg-white border-b border-gray-200 p-4 sm:p-6 last:border-b-0">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2">{section.title}</h2>
              
              {section.instructions && (
                <p className="text-gray-600 italic mb-4">{section.instructions}</p>
              )}

              {/* Render based on section type */}
              {sectionType === 'practice_mastery' && (
                <PracticeMasterySection section={section} image={image} />
              )}

              {sectionType === 'instructional_reading' && (
                <InstructionalReadingSection section={section} image={image} />
              )}

              {sectionType === 'diagram_labeling' && (
                <DiagramLabelingSection section={section} image={image} />
              )}

              {sectionType === 'matching' && (
                <MatchingSection section={section} image={image} />
              )}

              {sectionType === 'fill_in_blank' && (
                <FillInBlankSection section={section} image={image} />
              )}

              {sectionType === 'short_answer' && (
                <ShortAnswerSection section={section} image={image} />
              )}

              {sectionType === 'creative_writing' && (
                <CreativeWritingSection section={section} image={image} />
              )}

              {sectionType === 'visual_tracing' && (
                <VisualTracingSection section={section} image={image} />
              )}

              {sectionType === 'word_problems' && (
                <WordProblemsSection section={section} image={image} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Section Components

function PracticeMasterySection({ section, image }) {
  const items = section.items || [];
  
  return (
    <div className="space-y-4">
      {image && (
        <img 
          key={image}
          src={image} 
          alt={section.title} 
          className="w-full max-w-2xl rounded-lg mb-4" 
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <div key={idx} className="border-l-4 border-emerald-500 pl-4 py-2">
            <p className="font-medium text-gray-900 mb-2">
              {idx + 1}. {item.question}
            </p>
            <div className="border-b-2 border-gray-300 pb-2">
              <p className="text-gray-400 text-sm">Answer:</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InstructionalReadingSection({ section, image }) {
  const questions = section.questions || [];
  
  return (
    <div className="space-y-4">
      {image && (
        <img 
          key={image}
          src={image} 
          alt={section.title} 
          className="w-full max-w-3xl rounded-lg mb-4" 
        />
      )}
      
      {section.passage && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <div className="prose max-w-none">
            {section.passage.split('\n\n').map((para, idx) => (
              <p key={idx} className="text-gray-800 mb-3 leading-relaxed">
                {para}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Questions:</h3>
        {questions.map((q, idx) => (
          <div key={idx} className="border-l-4 border-blue-500 pl-4">
            <p className="font-semibold text-gray-900 mb-2">
              {idx + 1}. {q.question}
              {q.points && (
                <span className="text-sm text-gray-500 ml-2">({q.points} points)</span>
              )}
            </p>
            <div className="space-y-2">
              <div className="border-b border-gray-300 py-2"></div>
              <div className="border-b border-gray-300 py-2"></div>
              <div className="border-b border-gray-300 py-2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiagramLabelingSection({ section, image }) {
  const labels = section.labels || [];
  
  return (
    <div className="space-y-4">
      {image && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
          <img 
            key={image}
            src={image} 
            alt={section.title} 
            className="w-full max-w-4xl mx-auto rounded-lg" 
          />
        </div>
      )}
      
      {labels.length > 0 && (
        <div>
          <p className="font-semibold text-gray-900 mb-3">Labels to use:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {labels.map((label, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-300 rounded px-3 py-2">
                <span className="text-gray-700">{idx + 1}. _______________</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchingSection({ section, image }) {
  const columnA = section.column_a || [];
  const columnB = section.column_b || [];
  
  return (
    <div className="space-y-4">
      {image && (
        <img 
          key={image}
          src={image} 
          alt={section.title} 
          className="w-full max-w-2xl rounded-lg mb-4" 
        />
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Column A</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold w-20">Match</th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Column B</th>
            </tr>
          </thead>
          <tbody>
            {Math.max(columnA.length, columnB.length) > 0 && 
              Array.from({ length: Math.max(columnA.length, columnB.length) }).map((_, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3">
                    {idx < columnA.length && (
                      <span className="text-gray-800">{idx + 1}. {columnA[idx]}</span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <span className="text-gray-400">____</span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {idx < columnB.length && (
                      <span className="text-gray-800">{String.fromCharCode(65 + idx)}. {columnB[idx]}</span>
                    )}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FillInBlankSection({ section, image }) {
  const items = section.items || [];
  
  return (
    <div className="space-y-4">
      {image && (
        <img 
          key={image}
          src={image} 
          alt={section.title} 
          className="w-full max-w-2xl rounded-lg mb-4" 
        />
      )}
      
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="border-l-4 border-purple-500 pl-4 py-2">
            <p className="text-gray-900">
              {idx + 1}. {item.question}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShortAnswerSection({ section, image }) {
  const items = section.items || [];
  
  return (
    <div className="space-y-6">
      {image && (
        <img 
          key={image}
          src={image} 
          alt={section.title} 
          className="w-full max-w-2xl rounded-lg mb-4" 
        />
      )}
      
      {items.map((item, idx) => (
        <div key={idx} className="border-l-4 border-indigo-500 pl-4">
          <p className="font-semibold text-gray-900 mb-2">
            {idx + 1}. {item.question}
            {item.points && (
              <span className="text-sm text-gray-500 ml-2">({item.points} points)</span>
            )}
          </p>
          <div className="space-y-2 mt-3">
            {Array.from({ length: item.answer_space === 'large' ? 5 : item.answer_space === 'medium' ? 3 : 2 }).map((_, lineIdx) => (
              <div key={lineIdx} className="border-b border-gray-300 py-2"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CreativeWritingSection({ section, image }) {
  const numLines = section.lines || 15;
  
  return (
    <div className="space-y-4">
      {image && (
        <img 
          key={image}
          src={image} 
          alt={section.title} 
          className="w-full max-w-3xl rounded-lg mb-4" 
        />
      )}
      
      {section.prompt && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <p className="text-purple-900 font-semibold mb-1">Writing Prompt:</p>
          <p className="text-purple-800">{section.prompt}</p>
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: numLines }).map((_, idx) => (
          <div key={idx} className="border-b border-gray-300 py-3"></div>
        ))}
      </div>
    </div>
  );
}

function VisualTracingSection({ section, image }) {
  const items = section.items || [];
  
  return (
    <div className="space-y-4">
      {image && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-dashed border-yellow-300 rounded-lg p-6 mb-4">
          <img 
            key={image}
            src={image} 
            alt={section.title} 
            className="w-full max-w-4xl mx-auto rounded-lg" 
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item, idx) => (
          <div key={idx} className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
            <p className="text-lg font-medium text-gray-900 mb-3">
              {idx + 1}. {item.question}
            </p>
            <div className="bg-white border border-gray-300 rounded h-24"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WordProblemsSection({ section, image }) {
  const items = section.items || [];
  
  return (
    <div className="space-y-6">
      {image && (
        <img 
          key={image}
          src={image} 
          alt={section.title} 
          className="w-full max-w-2xl rounded-lg mb-4" 
        />
      )}
      
      {items.map((item, idx) => (
        <div key={idx} className="border-2 border-teal-300 rounded-lg p-4 bg-teal-50">
          <p className="font-semibold text-gray-900 mb-3">
            {idx + 1}. {item.question}
            {item.points && (
              <span className="text-sm text-gray-500 ml-2">({item.points} points)</span>
            )}
          </p>
          <div className="bg-white border border-gray-300 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-600 font-medium">Show your work:</p>
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, lineIdx) => (
                <div key={lineIdx} className="border-b border-gray-300 py-2"></div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t-2 border-gray-400">
              <p className="text-sm text-gray-600 font-medium">Answer: _______________</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default WorksheetViewer;
