import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { editLesson } from '../api';

function ChatEditor({ lessonId, onLessonUpdated, onProcessingChange, isMobile = false }) {
  const [messages, setMessages] = useState([
    // {
    //   role: 'assistant',
    //   content: '👋 Hi! I\'m your Doodlepad Agent. I can help you with:\n\n📝 **Text Edits:**\n• "Make the introduction longer"\n• "Rewrite everything in Batman theme"\n• "Add more examples to key concepts"\n\n🖼️ **Image Edits:**\n• "Make the intro image suitable for grade 5 kid"\n• "Change all images to cartoon style"\n• "Add an image to the summary section"\n• "Remove all images"\n\n➕ **Structure Changes:**\n• "Add a new section called \'Real World Examples\'"\n• "Add a \'Household Example\' section with an image"\n• "Remove the activities section"\n\nJust tell me what you want to change!'
    // }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);
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
    
    // Open chat window on mobile when message is sent
    if (isMobile) {
      setShowChatWindow(true);
    }
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessing(true);
    if (onProcessingChange) onProcessingChange(true);

    // Add initial processing message
    const processingMessageId = Date.now();
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: '🤔 Reading your request...',
        id: processingMessageId,
        isProcessing: true
      }
    ]);

    // Fake agentic thinking steps with longer delays
    const thinkingSteps = [
      { delay: 1500, message: '💭 Hmm, let me think about this...' },
      { delay: 1800, message: '🧠 Analyzing what needs to change...' },
      { delay: 1600, message: '📋 Planning the best approach...' },
      { delay: 1400, message: '✨ Crafting the perfect content...' },
      { delay: 1500, message: '🎨 Considering visual elements...' },
      { delay: 1300, message: '⚡ Putting it all together...' }
    ];

    // Show fake thinking steps
    const showThinkingSteps = async () => {
      for (const step of thinkingSteps) {
        await new Promise(resolve => setTimeout(resolve, step.delay));
        setMessages(prev => prev.map(msg => 
          msg.id === processingMessageId
            ? { ...msg, content: step.message }
            : msg
        ));
      }
    };

    // Start fake thinking animation
    const thinkingPromise = showThinkingSteps();
    let backendStarted = false;

    try {
      // Call streaming edit API
      const response = await fetch(`/api/edit-lesson/${lessonId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit lesson');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || '';
        
        for (const message of messages) {
          const lines = message.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                // Stop fake thinking when backend responds
                if (!backendStarted) {
                  backendStarted = true;
                }
                
                if (data.type === 'status') {
                  // Update the processing message
                  setMessages(prev => prev.map(msg => 
                    msg.id === processingMessageId
                      ? { ...msg, content: data.message }
                      : msg
                  ));
                } else if (data.type === 'complete') {
                  // Replace processing message with final message
                  setMessages(prev => prev.map(msg => 
                    msg.id === processingMessageId
                      ? { ...msg, content: data.message, isProcessing: false }
                      : msg
                  ));
                  
                  // Update the lesson in parent component
                  onLessonUpdated(data.lesson, data.images);
                } else if (data.type === 'error') {
                  setMessages(prev => prev.map(msg => 
                    msg.id === processingMessageId
                      ? { ...msg, content: `❌ ${data.message}`, isProcessing: false }
                      : msg
                  ));
                }
              } catch (e) {
                console.error('Failed to parse SSE message:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error editing lesson:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === processingMessageId
          ? { ...msg, content: '❌ An error occurred while processing your request. Please try again.', isProcessing: false }
          : msg
      ));
    } finally {
      setIsProcessing(false);
      if (onProcessingChange) onProcessingChange(false);
    }
  };

  const quickActions = [
    'Make intro image suitable for grade 5 kid',
    'Rewrite in Batman theme',
    'Change the intro image to cartoon style',
    'Make introduction longer'
  ];

  const handleQuickAction = (action) => {
    setInput(action);
  };

  if (isMobile) {
    // Mobile ChatGPT-style layout
    return (
      <>
        {/* Chat Overlay Window */}
        {showChatWindow && (
          <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-white border-t border-gray-200 shadow-2xl" style={{ height: '60vh', marginBottom: '4rem' }}>
            {/* Header with close button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-emerald-400 to-teal-500">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-white">Doodlepad Agent</h3>
              </div>
              <button
                onClick={() => setShowChatWindow(false)}
                disabled={isProcessing}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`chat-message ${message.role}`}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                </div>
              ))}
              {/* Processing message handled by main messages array */}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input - Always visible at bottom */}
        <div className="p-3 pb-safe">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="How can I help you?"
                disabled={isProcessing}
                className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isProcessing || !input.trim()}
                className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white p-2.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
      </>
    );
  }

  // Desktop layout
  return (
    <div className="lesson-card h-[calc(100vh-12rem)] flex flex-col sticky top-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-2 rounded-lg">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Doodlepad Agent</h3>
          <p className="text-xs text-gray-500">How can I help you?</p>
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
        {/* Processing message handled by main messages array */}
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
            placeholder="How can I help you?"
            disabled={isProcessing}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
