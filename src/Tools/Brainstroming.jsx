import React, { useState, useEffect, useRef } from 'react';
import ml5 from 'ml5';
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
  const [model, setModel] = useState(null);

  const questions = [
    {
      id: 'projectType',
      question: 'What type of project are you building?',
      placeholder: 'e.g., Web Application, Mobile App, Game, etc.'
    },
    {
      id: 'targetAudience',
      question: 'Who is your target audience?',
      placeholder: 'e.g., Students, Professionals, Gamers, etc.'
    },
    {
      id: 'mainFeatures',
      question: 'What are the main features you want to include?',
      placeholder: 'e.g., User Authentication, Real-time Updates, etc.'
    },
    {
      id: 'techStack',
      question: 'Do you have any preferences for the tech stack?',
      placeholder: 'e.g., React, Node.js, Python, etc.'
    }
  ];


useEffect(() => {
  const loadModel = async () => {
    try {
      const word2vec = ml5.word2vec('https://raw.githubusercontent.com/ml5js/ml5-data-and-models/master/models/word2vec/word2vec.json', () => {
        console.log('Model loaded successfully!');
        setModel(word2vec);
      });
    } catch (error) {
      console.error('Error loading model:', error);
      setModel(null);
    }
  };

  loadModel();
}, []);

  

  const handleAnswer = async (answer) => {
    setAnswers(prev => ({ ...prev, [questions[currentStep].id]: answer }));
    setIsProcessing(true);

    try {
      // Generate suggestions based on current answer
      const newSuggestions = await generateSuggestions(answer, questions[currentStep].id);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Fallback to mock suggestions if there's an error
      setSuggestions(getMockSuggestions(questions[currentStep].id));
    }

    // Move to next question
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    }

    setIsProcessing(false);
  };

  const generateSuggestions = async (answer, questionId) => {
    if (!model) {
      return getMockSuggestions(questionId);
    }

    try {
      // Using the correct syntax for ML5.js v1.2.1
      const nearest = await new Promise((resolve, reject) => {
        model.nearest(answer, 3, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      // Generate suggestions based on the nearest words
      return nearest.map(word => {
        const suggestion = word.word.charAt(0).toUpperCase() + word.word.slice(1);
        return `Consider incorporating ${suggestion} into your project`;
      });
    } catch (error) {
      console.error('Error in generateSuggestions:', error);
      return getMockSuggestions(questionId);
    }
  };

  const getMockSuggestions = (questionId) => {
    const mockSuggestions = {
      projectType: [
        'Consider adding user authentication',
        'Think about data persistence',
        'Plan for scalability'
      ],
      targetAudience: [
        'Design for accessibility',
        'Consider mobile responsiveness',
        'Plan for user onboarding'
      ],
      mainFeatures: [
        'Consider API integration',
        'Plan for error handling',
        'Think about user feedback'
      ],
      techStack: [
        'Consider testing frameworks',
        'Plan for deployment strategy',
        'Think about monitoring'
      ]
    };

    return mockSuggestions[questionId] || [];
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
          <div className="question-section">
            <h2>{questions[currentStep].question}</h2>
            <div className="input-group">
              <input
                type="text"
                placeholder={questions[currentStep].placeholder}
                onKeyPress={(e) => e.key === 'Enter' && handleAnswer(e.target.value)}
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
        </div>

        <button className="export-btn" onClick={exportSession}>
          <FaDownload /> Export Session
        </button>
      </div>
    </div>
  );
};

export default Brainstorming;