import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2 } from 'lucide-react';

function ChatEditor({ lessonId, contentType = 'lesson', onLessonUpdated, onProcessingChange, isMobile = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    // Only scroll within the chat container, not the whole page
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
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
        content: '⏳ Processing your request...',
        id: processingMessageId,
        isProcessing: true
      }
    ]);

    try {
      // Call streaming edit API based on content type
      const endpoint = contentType === 'presentation' 
        ? `/api/edit-presentation/${lessonId}`
        : contentType === 'worksheet'
        ? `/api/edit-worksheet/${lessonId}`
        : `/api/edit-lesson/${lessonId}`;
      
      console.log('Calling edit API with lessonId:', lessonId);
      console.log('Content type:', contentType);
      console.log('Endpoint:', endpoint);
      console.log('Edit request:', userMessage);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request: userMessage }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to edit lesson: ${response.status} - ${errorText}`);
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
                
                if (data.type === 'status') {
                  // Update the processing message
                  setMessages(prev => prev.map(msg => 
                    msg.id === processingMessageId
                      ? { ...msg, content: data.message }
                      : msg
                  ));
                } else if (data.type === 'lesson' || data.type === 'presentation' || data.type === 'worksheet') {
                  // Received updated content - use the data directly
                  console.log(`Received updated ${data.type}:`, data);
                  if (onLessonUpdated) {
                    const content = data.lesson || data.presentation || data.worksheet;
                    console.log('Updated content:', content);
                    console.log('Content has contentType:', content?.contentType);
                    
                    // IMPORTANT: Update the content immediately with the data we received
                    // This ensures we show the updated content right away
                    if (content) {
                      console.log('ChatEditor: Immediately updating with received content');
                      onLessonUpdated(content, {});
                    }
                    
                    // Then fetch full data with images from the appropriate endpoint
                    const fetchEndpoint = contentType === 'presentation' 
                      ? `/api/presentation/${lessonId}`
                      : contentType === 'worksheet'
                      ? `/api/worksheet/${lessonId}`
                      : `/api/lesson/${lessonId}`;
                    
                    console.log('Fetching from endpoint:', fetchEndpoint);
                    
                    fetch(fetchEndpoint)
                      .then(res => res.json())
                      .then(result => {
                        console.log('Fetch result:', result);
                        if (result.success && onLessonUpdated) {
                          const contentData = result.lesson || result.presentation || result.worksheet;
                          // Only update if we have images or if the content is different
                          const hasImages = Object.keys(result.images || {}).length > 0;
                          const contentChanged = JSON.stringify(contentData) !== JSON.stringify(content);
                          
                          if (hasImages || contentChanged) {
                            console.log('ChatEditor: Updating with fetched content and images');
                            console.log('ChatEditor: Fetched content type:', contentData?.contentType);
                            console.log('ChatEditor: Fetched images:', Object.keys(result.images || {}));
                            onLessonUpdated(contentData, result.images || {});
                          } else {
                            console.log('ChatEditor: No need to update, content is the same and no images');
                          }
                        } else {
                          console.error('Fetch failed or no success:', result);
                        }
                      })
                      .catch(err => console.error('Failed to fetch updated content:', err));
                  }
                } else if (data.type === 'image') {
                  // Handle new images as they come in
                  console.log('Received new image:', data.key);
                  // Images will be updated when lesson is fetched
                } else if (data.type === 'complete') {
                  // Replace processing message with final message
                  setMessages(prev => prev.map(msg => 
                    msg.id === processingMessageId
                      ? { ...msg, content: data.message, isProcessing: false }
                      : msg
                  ));
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

  const lessonQuickActions = [
    'Make intro image suitable for grade 5 kid',
    'Rewrite in Batman theme',
    'Change the intro image to cartoon style',
    'Make introduction longer'
  ];

  const presentationQuickActions = [
    'Make the first slide image black and white',
    'Translate to Bangla',
    'Add a conclusion slide',
    'Make all slides more colorful'
  ];

  const quickActions = contentType === 'presentation' ? presentationQuickActions : lessonQuickActions;

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
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
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
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto py-4 space-y-3">
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
