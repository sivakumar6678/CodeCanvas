import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { FaMicrophone, FaMicrophoneSlash, FaDownload, FaPaperPlane, FaLanguage, FaLightbulb, FaLink, FaFileAlt } from 'react-icons/fa';
import '../styles/tools_styles/brainstorming.scss';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const Brainstorming = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [correction, setCorrection] = useState(null);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [showMindMap, setShowMindMap] = useState(false);
  const [context, setContext] = useState({
    projectType: null,
    features: [],
    techStack: null,
    requirements: [],
    currentTopic: null,
    projectDetails: {},
    aiSuggestions: []
  });
  const brainstormingRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial greeting with AI-generated options
    setMessages([
      {
        type: 'ai',
        content: `👋 **Welcome to AI Project Brainstorming!**\n\nI'm here to help you plan your project. Let's start by understanding what you want to build.\n\n🔹 I can help you with:\n• Web Applications\n• Mobile Apps\n• Desktop Software\n• Games\n• AI/ML Projects\n• And more!\n\nTell me about your project idea, and I'll help you break it down.`,
        suggestions: [
          'I want to build a website',
          'I need a mobile app',
          'I have a game idea',
          'I want to create an AI project',
          'Other type of project'
        ]
      }
    ]);

    gsap.from(brainstormingRef.current, {
      y: 30,
      duration: 1,
      ease: 'power3.out'
    });
  }, []);

  // Enhanced common typos with more variations
  const commonTypos = {
    'portfollo': 'portfolio',
    'wbsite': 'website',
    'annimatoins': 'animations',
    'ecomerce': 'e-commerce',
    'landingpage': 'landing page',
    'blg': 'blog',
    'platfrm': 'platform',
    'mobil': 'mobile',
    'desktopapp': 'desktop app',
    'ai/ml': 'AI/ML',
    'financ': 'finance',
    'budjet': 'budget',
    'trakr': 'tracker',
    'analitics': 'analytics',
    'dashbord': 'dashboard',
    'autentication': 'authentication',
    'databse': 'database',
    'integraion': 'integration',
    'api': 'API',
    'ui/ux': 'UI/UX'
  };

  // Enhanced language detection with more languages
  const detectLanguage = (text) => {
    // Check for non-Latin characters
    const hasNonLatin = /[^\u0000-\u007F]/.test(text);
    
    // Check for specific language patterns
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh'; // Chinese
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja'; // Japanese
    if (/[\uAC00-\uD7AF]/.test(text)) return 'ko'; // Korean
    if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Hindi
    if (/[\u0600-\u06FF]/.test(text)) return 'ar'; // Arabic
    if (/[\u0400-\u04FF]/.test(text)) return 'ru'; // Russian
    if (/[\u00C0-\u00FF]/.test(text)) return 'es'; // Spanish
    if (/[\u00E0-\u00FF]/.test(text)) return 'fr'; // French
    if (/[\u00E0-\u00FF]/.test(text)) return 'de'; // German
    if (/[\u00E0-\u00FF]/.test(text)) return 'it'; // Italian
    
    // Add more language patterns
    if (/[\u0E00-\u0E7F]/.test(text)) return 'th'; // Thai
    if (/[\u0D00-\u0D7F]/.test(text)) return 'ml'; // Malayalam
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu
    if (/[\u0B00-\u0B7F]/.test(text)) return 'or'; // Odia
    if (/[\u0A00-\u0A7F]/.test(text)) return 'pa'; // Punjabi
    
    return 'en';
  };

  // Check for typos and suggest corrections
  const checkTypos = (text) => {
    const words = text.toLowerCase().split(' ');
    let hasTypos = false;
    let correctedText = text;

    words.forEach(word => {
      if (commonTypos[word]) {
        hasTypos = true;
        correctedText = correctedText.replace(word, commonTypos[word]);
      }
    });

    return hasTypos ? correctedText : null;
  };

  // Generate AI-powered suggestions based on context and user input
  const generateSuggestions = (currentContext, userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Ensure we have a valid context object
    const context = currentContext || {
      projectType: null,
      features: [],
      techStack: null,
      requirements: [],
      currentTopic: null,
      projectDetails: {},
      aiSuggestions: []
    };
    
    // Generate context-aware suggestions
    if (!context.projectType) {
      if (lowerMessage.includes('website')) {
        return [
          'Portfolio Website',
          'E-commerce Site',
          'Blog Platform',
          'Landing Page',
          'Web Application'
        ];
      } else if (lowerMessage.includes('mobile')) {
        return [
          'iOS App',
          'Android App',
          'Cross-platform App',
          'Mobile Game',
          'Mobile Web App'
        ];
      } else if (lowerMessage.includes('game')) {
        return [
          '2D Game',
          '3D Game',
          'Mobile Game',
          'Web Game',
          'Desktop Game'
        ];
      } else if (lowerMessage.includes('finance') || lowerMessage.includes('budget')) {
        return [
          'Budget Tracker',
          'Investment Portfolio',
          'Expense Manager',
          'Financial Dashboard',
          'Bill Reminder App'
        ];
      }
    } else if (context.projectType && (!context.features || context.features.length === 0)) {
      // Generate feature suggestions based on project type
      if (context.projectType.includes('website')) {
        return [
          'User Authentication',
          'Database Integration',
          'Payment System',
          'Admin Dashboard',
          'API Integration'
        ];
      } else if (context.projectType.includes('mobile')) {
        return [
          'Push Notifications',
          'Offline Support',
          'User Profiles',
          'Location Services',
          'Camera Integration'
        ];
      } else if (context.projectType.includes('finance')) {
        return [
          'AI Budget Recommendations',
          'Expense Categorization',
          'Financial Reports',
          'Bill Reminders',
          'Investment Tracking'
        ];
      }
    } else if (context.features && context.features.length > 0 && !context.techStack) {
      // Suggest tech stack based on features
      if (context.features.some(f => f.includes('AI'))) {
        return [
          'Python + TensorFlow',
          'React + Node.js + TensorFlow.js',
          'Vue + Python + FastAPI',
          'Next.js + OpenAI API',
          'Custom AI Stack'
        ];
      } else if (context.features.some(f => f.includes('Real-time'))) {
        return [
          'React + Socket.io',
          'Vue + Firebase',
          'Angular + WebSocket',
          'Next.js + Pusher',
          'Custom Real-time Stack'
        ];
      }
      return [
        'React + Node.js',
        'Vue + Python',
        'Angular + Java',
        'Flutter',
        'Custom Stack'
      ];
    }

    // Generate follow-up suggestions based on current context
    if (context.projectDetails && Object.keys(context.projectDetails).length > 0) {
      return [
        'Add more features',
        'Review current plan',
        'Get tech recommendations',
        'View mind map',
        'Export plan'
      ];
    }

    return [
      'Tell me more',
      'Start over',
      'Export plan',
      'Get examples',
      'Ask questions'
    ];
  };

  // Generate AI response using Gemini API
  const generateAIResponse = async (userMessage) => {
    try {
      // Check for typos first
      const correctedText = checkTypos(userMessage.toLowerCase());
      if (correctedText && correctedText !== userMessage.toLowerCase()) {
        setCorrection({
          original: userMessage,
          corrected: correctedText
        });
        return {
          type: 'ai',
          content: `🔍 **Typo Detection & Correction**\n\nI noticed some potential typos in your input:\n\nUser Input: "${userMessage}"\nAI Suggests: "${correctedText}"\n\nWould you like to proceed with the corrected text?`,
          suggestions: ['Yes, use corrected text', 'No, let me rephrase']
        };
      }

      // Detect language
      const language = detectLanguage(userMessage);
      if (language !== 'en') {
        setDetectedLanguage(language);
        return {
          type: 'ai',
          content: `🌐 **Language Detection**\n\nI detected ${language.toUpperCase()}! Let me help you in English.\n\nYour message: "${userMessage}"\n\nWould you like to continue in English?`,
          suggestions: ['Continue in English', 'Try again']
        };
      }

      // Call Gemini API
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an AI project brainstorming assistant. Help the user plan their project. 
              Current context: ${JSON.stringify(context)}
              Previous conversation: ${JSON.stringify(messages)}
              User's latest message: "${userMessage}"
              
              Generate a helpful response with:
              1. A natural, conversational tone
              2. Relevant follow-up questions
              3. 3-5 clickable suggestions as buttons
              4. Markdown formatting for better readability
              5. Emojis for visual appeal
              
              Format your response as JSON with:
              {
                "content": "Your markdown-formatted response",
                "suggestions": ["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5"]
              }`
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to generate AI response');
      }

      const data = await response.json();
      
      // Extract the text from the Gemini API response
      const aiResponseText = data.candidates[0].content.parts[0].text;
      
      // Try to parse the response as JSON
      let aiResponse;
      try {
        // Clean up the response text to ensure it's valid JSON
        const cleanedText = aiResponseText
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        
        aiResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        // If parsing fails, create a default response
        aiResponse = {
          content: aiResponseText,
          suggestions: generateSuggestions(context, userMessage)
        };
      }

      // Update context based on AI response
      if (aiResponse.content.toLowerCase().includes('project type')) {
        setContext(prev => ({ ...prev, projectType: userMessage }));
      } else if (aiResponse.content.toLowerCase().includes('features')) {
        setContext(prev => ({ 
          ...prev, 
          features: [...(prev.features || []), userMessage],
          currentTopic: 'features'
        }));
      } else if (aiResponse.content.toLowerCase().includes('tech stack')) {
        setContext(prev => ({ 
          ...prev, 
          techStack: userMessage,
          currentTopic: 'tech'
        }));
      }

      return {
        type: 'ai',
        content: aiResponse.content,
        suggestions: aiResponse.suggestions || generateSuggestions(context, userMessage)
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      return {
        type: 'ai',
        content: `❌ **Error**\n\nI apologize, but I encountered an error while processing your request. Please try again or rephrase your message.\n\nError details: ${error.message}`,
        suggestions: ['Try again', 'Start over', 'Ask for help']
      };
    }
  };

  // Generate feature suggestions based on project type and user input
  const generateFeatureSuggestions = (projectType, userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    let description = '';
    let suggestions = [];

    switch (projectType) {
      case 'website':
        if (lowerMessage.includes('portfolio')) {
          description = `• Project showcase with filtering and search\n• Responsive image galleries\n• Skills and experience timeline\n• Contact form with validation\n• Social media integration\n\nWhich feature would you like to implement first?`;
          suggestions = [
            'Project Showcase',
            'Image Gallery',
            'Skills Timeline',
            'Contact Form',
            'Social Integration'
          ];
        } else if (lowerMessage.includes('e-commerce')) {
          description = `• Product catalog with categories\n• Shopping cart functionality\n• User authentication\n• Order management system\n• Payment gateway integration\n\nWhat's your priority?`;
          suggestions = [
            'Product Catalog',
            'Shopping Cart',
            'User Auth',
            'Order System',
            'Payment Integration'
          ];
        }
        break;

      case 'mobile':
        if (lowerMessage.includes('ios') || lowerMessage.includes('android')) {
          description = `• User authentication and profiles\n• Push notifications\n• Offline data storage\n• Location services\n• Camera and media access\n\nWhich feature interests you?`;
          suggestions = [
            'User Auth',
            'Push Notifications',
            'Offline Storage',
            'Location Services',
            'Media Access'
          ];
        }
        break;

      case 'finance':
        if (lowerMessage.includes('budget') || lowerMessage.includes('expense')) {
          description = `• Expense tracking and categorization\n• Budget planning and alerts\n• Financial reports and charts\n• Bill reminders and notifications\n• Data export functionality\n\nWhat would you like to implement?`;
          suggestions = [
            'Expense Tracking',
            'Budget Planning',
            'Financial Reports',
            'Bill Reminders',
            'Data Export'
          ];
        }
        break;

      case 'ai':
        if (lowerMessage.includes('machine learning') || lowerMessage.includes('neural')) {
          description = `• Data preprocessing pipeline\n• Model training interface\n• Performance metrics dashboard\n• Model deployment system\n• API integration\n\nWhich aspect would you like to focus on?`;
          suggestions = [
            'Data Pipeline',
            'Training Interface',
            'Metrics Dashboard',
            'Deployment System',
            'API Integration'
          ];
        }
        break;
    }

    return { description, suggestions };
  };

  // Generate tech stack suggestions based on features
  const generateTechStackSuggestions = (features, userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    let description = '';
    let suggestions = [];

    if (features.some(f => f.toLowerCase().includes('ai') || f.toLowerCase().includes('ml'))) {
      description = `• Python + TensorFlow for ML models\n• React + Node.js for the frontend\n• FastAPI for the backend API\n• PostgreSQL for data storage\n• Docker for containerization\n\nWhich stack would you prefer?`;
      suggestions = [
        'Python + TensorFlow',
        'React + Node.js',
        'FastAPI Backend',
        'PostgreSQL DB',
        'Docker Setup'
      ];
    } else if (features.some(f => f.toLowerCase().includes('real-time'))) {
      description = `• React + Socket.io for real-time features\n• Node.js + Express backend\n• MongoDB for flexible data storage\n• Redis for caching\n• AWS for deployment\n\nWhich stack interests you?`;
      suggestions = [
        'React + Socket.io',
        'Node.js Backend',
        'MongoDB Storage',
        'Redis Cache',
        'AWS Deployment'
      ];
    } else {
      description = `• React + Node.js for full-stack development\n• Vue + Python for modern stack\n• Angular + Java for enterprise\n• Flutter for cross-platform\n• Custom stack based on needs\n\nWhat's your preference?`;
      suggestions = [
        'React + Node.js',
        'Vue + Python',
        'Angular + Java',
        'Flutter',
        'Custom Stack'
      ];
    }

    return { description, suggestions };
  };

  // Generate follow-up questions based on current context
  const generateFollowUpQuestions = (context, userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    let response = '';

    if (context.projectType && context.features && context.techStack) {
      response = `🎯 **Project Summary**\n\nLet's review your project plan:\n\n`;
      response += `🔹 Project Type: ${context.projectType}\n`;
      response += `🔹 Features: ${context.features.join(', ')}\n`;
      response += `🔹 Tech Stack: ${context.techStack}\n\n`;
      response += `Would you like to:\n`;
      response += `• Add more features\n`;
      response += `• Review the current plan\n`;
      response += `• Get technical recommendations\n`;
      response += `• View the mind map\n`;
      response += `• Export the plan`;
    } else {
      response = `❓ **Need More Information**\n\nI want to make sure I understand your needs correctly. Could you please provide more details about:\n\n`;
      if (!context.projectType) {
        response += `• What type of project you want to build\n`;
      }
      if (!context.features || context.features.length === 0) {
        response += `• What features you'd like to include\n`;
      }
      if (!context.techStack) {
        response += `• Your preferred technology stack\n`;
      }
      response += `\nFeel free to describe your vision in detail.`;
    }

    return response;
  };

  // Add typing animation for AI responses
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = async (message) => {
    if (!message.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: message }]);
    setInputValue('');
    setIsProcessing(true);
    setIsTyping(true);

    // Generate AI response
    const aiResponse = await generateAIResponse(message);
    if (aiResponse) {
      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add AI response with typing animation
      setMessages(prev => [...prev, aiResponse]);
      
      // Animate the new message
      gsap.from(`.message:last-child`, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: 'power2.out'
      });
    }

    setIsProcessing(false);
    setIsTyping(false);
  };

  const handleCorrection = (useCorrected) => {
    if (useCorrected) {
      handleSubmit(correction.corrected);
    }
    setCorrection(null);
  };

  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event) => {
        const message = event.results[0][0].transcript;
        setInputValue(message);
        handleSubmit(message);
      };

      recognition.start();
    }
  };

  const exportSession = () => {
    // Create a more detailed export object
    const data = {
      conversation: messages,
      context,
      timestamp: new Date().toISOString(),
      mindMap: showMindMap,
      projectSummary: {
        type: context.projectType,
        features: context.features,
        techStack: context.techStack,
        requirements: context.requirements,
        tools: generateRecommendedTools(context),
        estimatedTimeline: generateTimeline(context),
        nextSteps: generateNextSteps(context)
      }
    };

    // Create export options
    const exportOptions = {
      json: {
        content: JSON.stringify(data, null, 2),
        type: 'application/json',
        filename: 'brainstorming-session.json'
      },
      markdown: {
        content: generateMarkdownExport(data),
        type: 'text/markdown',
        filename: 'brainstorming-session.md'
      },
      pdf: {
        content: generatePDFContent(data),
        type: 'application/pdf',
        filename: 'brainstorming-session.pdf'
      }
    };

    // Show export options modal
    setShowExportModal(true);
    setExportOptions(exportOptions);
  };

  // Generate timeline based on project complexity
  const generateTimeline = (context) => {
    const features = context.features?.length || 0;
    const complexity = context.techStack?.includes('AI') ? 1.5 : 1;
    
    const baseTime = features * 2; // 2 weeks per feature
    const totalWeeks = Math.ceil(baseTime * complexity);
    
    return {
      totalWeeks,
      phases: [
        {
          name: 'Planning & Setup',
          weeks: Math.ceil(totalWeeks * 0.2),
          tasks: ['Project setup', 'Architecture design', 'Tech stack setup']
        },
        {
          name: 'Development',
          weeks: Math.ceil(totalWeeks * 0.5),
          tasks: ['Core features', 'Integration', 'Testing']
        },
        {
          name: 'Polish & Launch',
          weeks: Math.ceil(totalWeeks * 0.3),
          tasks: ['UI/UX refinement', 'Performance optimization', 'Deployment']
        }
      ]
    };
  };

  // Generate next steps based on current progress
  const generateNextSteps = (context) => {
    const steps = [];
    
    if (!context.projectType) {
      steps.push('Define project type and scope');
    }
    if (!context.features?.length) {
      steps.push('List and prioritize features');
    }
    if (!context.techStack) {
      steps.push('Select technology stack');
    }
    if (context.features?.length && !context.requirements?.length) {
      steps.push('Define technical requirements');
    }
    
    return steps.length ? steps : ['Review and refine current plan', 'Start implementation'];
  };

  // Generate markdown export
  const generateMarkdownExport = (data) => {
    const { projectSummary, conversation } = data;
    
    let markdown = `# Project Brainstorming Session\n\n`;
    markdown += `## Project Summary\n\n`;
    markdown += `- **Type:** ${projectSummary.type || 'Not specified'}\n`;
    markdown += `- **Features:** ${projectSummary.features.join(', ') || 'Not specified'}\n`;
    markdown += `- **Tech Stack:** ${projectSummary.techStack || 'Not specified'}\n\n`;
    
    markdown += `## Recommended Tools\n\n`;
    Object.entries(projectSummary.tools).forEach(([category, tools]) => {
      markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
      tools.forEach(tool => {
        markdown += `- [${tool.name}](${tool.url}) - ${tool.description}\n`;
      });
      markdown += '\n';
    });

    markdown += `## Conversation History\n\n`;
    conversation.forEach(msg => {
      markdown += `### ${msg.type === 'user' ? 'User' : 'AI'}\n\n`;
      markdown += `${msg.content}\n\n`;
      if (msg.suggestions) {
        markdown += `**Suggestions:**\n`;
        msg.suggestions.forEach(suggestion => {
          markdown += `- ${suggestion}\n`;
        });
        markdown += '\n';
      }
    });

    return markdown;
  };

  // Generate PDF content
  const generatePDFContent = (data) => {
    const { projectSummary, conversation } = data;
    
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { color: #2d3436; }
            h2 { color: #0984e3; }
            .section { margin: 20px 0; }
            .timeline { margin-left: 20px; }
          </style>
        </head>
        <body>
          <h1>Project Brainstorming Session</h1>
          
          <div class="section">
            <h2>Project Summary</h2>
            <p><strong>Type:</strong> ${projectSummary.type || 'Not specified'}</p>
            <p><strong>Features:</strong> ${projectSummary.features.join(', ') || 'Not specified'}</p>
            <p><strong>Tech Stack:</strong> ${projectSummary.techStack || 'Not specified'}</p>
          </div>

          <div class="section">
            <h2>Timeline</h2>
            <p><strong>Estimated Duration:</strong> ${projectSummary.estimatedTimeline.totalWeeks} weeks</p>
            <div class="timeline">
              ${projectSummary.estimatedTimeline.phases.map(phase => `
                <p><strong>${phase.name}:</strong> ${phase.weeks} weeks</p>
                <ul>
                  ${phase.tasks.map(task => `<li>${task}</li>`).join('')}
                </ul>
              `).join('')}
            </div>
          </div>

          <div class="section">
            <h2>Next Steps</h2>
            <ul>
              ${projectSummary.nextSteps.map(step => `<li>${step}</li>`).join('')}
            </ul>
          </div>

          <div class="section">
            <h2>Recommended Tools</h2>
            ${Object.entries(projectSummary.tools).map(([category, tools]) => `
              <h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
              <ul>
                ${tools.map(tool => `
                  <li><a href="${tool.url}">${tool.name}</a> - ${tool.description}</li>
                `).join('')}
              </ul>
            `).join('')}
          </div>

          <div class="section">
            <h2>Conversation History</h2>
            ${conversation.map(msg => `
              <p><strong>${msg.type === 'user' ? 'User' : 'AI'}:</strong></p>
              <p>${msg.content}</p>
              ${msg.suggestions ? `
                <p><em>Suggestions:</em></p>
                <ul>
                  ${msg.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                </ul>
              ` : ''}
            `).join('')}
          </div>
        </body>
      </html>
    `;
  };

  // Export Modal Component
  const ExportModal = ({ options, onClose, onExport }) => {
    return (
      <div className="export-modal">
        <div className="export-modal-content">
          <h2>Export Session</h2>
          <p>Choose your preferred export format:</p>
          <div className="export-options">
            {Object.entries(options).map(([format, option]) => (
              <button
                key={format}
                className={`export-option-btn ${format}`}
                onClick={() => onExport(option)}
              >
                <FaFileAlt className={`fa-${format}`} />
                <span>{format.toUpperCase()}</span>
              </button>
            ))}
          </div>
          <button className="close-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="brainstorming" ref={brainstormingRef}>
      <div className="container">
        <h1>AI Project Brainstorming</h1>
        
        <div className="chat-container">
          <div className="messages-container">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                <div className="message-content">
                  {message.content}
                </div>
                {message.suggestions && (
                  <div className="suggestions">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        className="suggestion-btn"
                        onClick={() => handleSubmit(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="typing-indicator">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            )}
            {correction && (
              <div className="correction-message">
                <p>Did you mean: "{correction.corrected}"?</p>
                <div className="correction-buttons">
                  <button onClick={() => handleCorrection(true)}>Yes</button>
                  <button onClick={() => handleCorrection(false)}>No</button>
                </div>
              </div>
            )}
            {detectedLanguage && (
              <div className="language-message">
                <FaLanguage /> Detected {detectedLanguage.toUpperCase()}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit(inputValue)}
            />
            <button 
              className={`voice-input ${isListening ? 'listening' : ''}`}
              onClick={startVoiceRecognition}
              aria-label="Voice input"
            >
              {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>
            <button 
              className="send-btn"
              onClick={() => handleSubmit(inputValue)}
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>

        <div className="action-buttons">
          <button className="export-btn" onClick={exportSession}>
            <FaDownload /> Export Session
          </button>
          <button 
            className={`mindmap-btn ${showMindMap ? 'active' : ''}`}
            onClick={() => setShowMindMap(!showMindMap)}
          >
            <FaLightbulb /> {showMindMap ? 'Hide Mind Map' : 'Show Mind Map'}
          </button>
        </div>

        {showMindMap && (
          <div className="mindmap-container">
            <div className="mindmap">
              <div className="mindmap-node central">
                <h3>{context.projectType || 'Project'}</h3>
              </div>
              {context.features.map((feature, index) => (
                <div key={index} className="mindmap-node feature">
                  <h4>{feature}</h4>
                </div>
              ))}
              {context.techStack && (
                <div className="mindmap-node tech">
                  <h4>{context.techStack}</h4>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showExportModal && (
        <ExportModal
          options={exportOptions}
          onClose={() => setShowExportModal(false)}
          onExport={(option) => {
            // Handle export
          }}
        />
      )}
    </div>
  );
};

export default Brainstorming;
