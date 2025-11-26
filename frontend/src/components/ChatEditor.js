import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2, Sparkles } from 'lucide-react';
import { editLesson } from '../api';

function ChatEditor({ lessonId, onLessonUpdated, isMobile = false }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your Doodlepad Agent. I can help you with:\n\n📝 **Text Edits:**\n• "Make the introduction longer"\n• "Rewrite everything in Batman theme"\n• "Add more examples to key concepts"\n\n🖼️ **Image Edits:**\n• "Make the intro image suitable for grade 5 kid"\n• "Change all images to cartoon style"\n• "Add an image to the summary section"\n• "Remove all images"\n\n➕ **Structure Changes:**\n• "Add a new section called \'Real World Examples\'"\n• "Add a \'Household Example\' section with an image"\n• "Remove the activities section"\n\nJust tell me what you want to change!'
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || isProcessing) {
      return;
    }

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessing(true);

    try {
      // Call edit API
      const response = await editLesson(lessonId, userMessage);
      
      console.log('Edit response:', response);
      console.log('Updated images:', response.images);
      
      if (response.success) {
        // Add assistant response
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: response.message || 'Lesson updated successfully! The changes have been applied.'
          }
        ]);
        
        // Update the lesson in parent component
        onLessonUpdated(response.lesson, response.images);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'Sorry, I couldn\'t process that request. Please try rephrasing it.'
          }
        ]);
      }
    } catch (error) {
      console.error('Error editing lesson:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred while processing your request. Please try again.'
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickActions = [
    'Make intro image suitable for grade 5 kid',
    'Rewrite in Batman theme',
    'Change all images to cartoon style',
    'Make introduction longer'
  ];

  const handleQuickAction = (action) => {
    setInput(action);
  };

  if (isMobile) {
    // Mobile ChatGPT-style layout
    return (
      <div className="p-4">
        {/* Input - Always visible at bottom */}
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your edit request..."
              disabled={isProcessing}
              className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isProcessing || !input.trim()}
              className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white p-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="lesson-card h-[calc(100vh-12rem)] flex flex-col sticky top-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="bg-gradient-to-br from-primary-500 to-indigo-600 p-2 rounded-lg">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Edit Lesson</h3>
          <p className="text-xs text-gray-500">Chat to modify the lesson</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-message ${message.role}`}
          >
            <p className="text-sm whitespace-pre-line">{message.content}</p>
          </div>
        ))}
        {isProcessing && (
          <div className="chat-message assistant flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Processing your request...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="py-3 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action)}
                disabled={isProcessing}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-50"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="pt-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your edit request..."
            disabled={isProcessing}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatEditor;
