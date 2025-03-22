import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { FaMicrophone, FaMicrophoneSlash, FaDownload } from 'react-icons/fa';
import '../styles/tools_styles/brainstorming.scss';

const Brainstorming = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const brainstormingRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const questions = [
    {
      id: 'projectType',
      question: 'What type of project are you building?',
      placeholder: 'e.g., Web Application, Mobile App, Game, etc.',
      suggestions: {
        'Web Application': [
          'Consider implementing user authentication',
          'Plan for responsive design',
          'Think about API integration'
        ],
        'Mobile App': [
          'Plan for offline functionality',
          'Consider push notifications',
          'Think about app store requirements'
        ],
        'Game': [
          'Plan for game mechanics',
          'Consider multiplayer features',
          'Think about performance optimization'
        ]
      }
    },
    {
      id: 'targetAudience',
      question: 'Who is your target audience?',
      placeholder: 'e.g., Students, Professionals, Gamers, etc.',
      suggestions: {
        'Students': [
          'Focus on educational value',
          'Consider gamification elements',
          'Plan for mobile-first design'
        ],
        'Professionals': [
          'Emphasize productivity features',
          'Consider integration with existing tools',
          'Plan for advanced functionality'
        ],
        'Gamers': [
          'Focus on engaging mechanics',
          'Consider competitive features',
          'Plan for social interactions'
        ]
      }
    },
    {
      id: 'mainFeatures',
      question: 'What are the main features you want to include?',
      placeholder: 'e.g., User Authentication, Real-time Updates, etc.',
      suggestions: {
        'User Authentication': [
          'Consider OAuth integration',
          'Plan for password recovery',
          'Think about session management'
        ],
        'Real-time Updates': [
          'Consider WebSocket implementation',
          'Plan for data synchronization',
          'Think about offline support'
        ],
        'Data Analytics': [
          'Consider data visualization',
          'Plan for reporting features',
          'Think about data privacy'
        ]
      }
    },
    {
      id: 'techStack',
      question: 'Do you have any preferences for the tech stack?',
      placeholder: 'e.g., React, Node.js, Python, etc.',
      suggestions: {
        'React': [
          'Consider Next.js for SSR',
          'Plan for state management',
          'Think about component architecture'
        ],
        'Node.js': [
          'Consider microservices architecture',
          'Plan for API design',
          'Think about deployment strategy'
        ],
        'Python': [
          'Consider Django or Flask',
          'Plan for data processing',
          'Think about ML integration'
        ]
      }
    }
  ];

  useEffect(() => {
    gsap.from(brainstormingRef.current, {
    //   opacity: 0,
      y: 30,
      duration: 1,
      ease: 'power3.out'
    });
  }, []);

  const handleAnswer = async (answer) => {
    if (!answer.trim()) return;

    setAnswers(prev => ({ ...prev, [questions[currentStep].id]: answer }));
    setIsProcessing(true);
    setInputValue('');

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate suggestions based on current answer
    const currentQuestion = questions[currentStep];
    const newSuggestions = generateSuggestions(answer, currentQuestion);
    setSuggestions(newSuggestions);

    // Move to next question or complete
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsComplete(true);
    }

    setIsProcessing(false);
  };

  const generateSuggestions = (answer, question) => {
    // Find matching suggestions based on keywords
    const keywords = answer.toLowerCase().split(' ');
    const allSuggestions = Object.values(question.suggestions).flat();
    
    // Filter suggestions based on keywords
    const matchedSuggestions = allSuggestions.filter(suggestion => 
      keywords.some(keyword => suggestion.toLowerCase().includes(keyword))
    );

    // If no matches found, return default suggestions for the current question
    if (matchedSuggestions.length === 0) {
      return Object.values(question.suggestions)[0] || [];
    }

    return matchedSuggestions.slice(0, 3);
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
        const answer = event.results[0][0].transcript;
        setInputValue(answer);
        handleAnswer(answer);
      };

      recognition.start();
    }
  };

  const exportSession = () => {
    const data = {
      answers,
      suggestions,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brainstorming-session.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="brainstorming" ref={brainstormingRef}>
      <div className="container">
        <h1>AI Project Brainstorming</h1>
        
        <div className="brainstorming-content">
          {!isComplete ? (
            <>
              <div className="question-section">
                <h2>{questions[currentStep].question}</h2>
                <div className="input-group">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={questions[currentStep].placeholder}
                    onKeyPress={(e) => e.key === 'Enter' && handleAnswer(inputValue)}
                  />
                  <button 
                    className={`voice-input ${isListening ? 'listening' : ''}`}
                    onClick={startVoiceRecognition}
                    aria-label="Voice input"
                  >
                    {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                  </button>
                </div>
              </div>

              {suggestions.length > 0 && (
                <div className="suggestions-section">
                  <h3>AI Suggestions</h3>
                  <ul>
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="progress-section">
                <div className="progress-bar">
                  <div 
                    className="progress"
                    style={{ width: `${(currentStep / questions.length) * 100}%` }}
                  />
                </div>
                <span>Step {currentStep + 1} of {questions.length}</span>
              </div>
            </>
          ) : (
            <div className="completion-section">
              <h2>Brainstorming Complete! 🎉</h2>
              <p>Here's a summary of your project plan:</p>
              <div className="summary-section">
                {Object.entries(answers).map(([key, value]) => (
                  <div key={key} className="summary-item">
                    <h3>{questions.find(q => q.id === key)?.question}</h3>
                    <p>{value}</p>
                  </div>
                ))}
              </div>
              <button className="export-btn" onClick={exportSession}>
                <FaDownload /> Export Session
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Brainstorming;
