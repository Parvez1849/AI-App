
import { useState, useEffect, useRef } from 'react';
import './App.css';
import axios from 'axios';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import { FaArrowUp, FaStop, FaChevronDown, FaChevronUp, FaEllipsisV, FaEdit, FaTrash, FaShareAlt, FaPen, FaSave, FaBroom } from 'react-icons/fa'; // Icons
import geminiAvatar from './assets/gemini.jpg'; // AI avatar
import userAvatar from './assets/khan.JPG'; // User avatar

function App() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [messages, setMessages] = useState([]);
  const [previousChats, setPreviousChats] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreviousChats, setShowPreviousChats] = useState(false); // Slider state
  const [showOptions, setShowOptions] = useState(null); // For 3-dot menu options
  const abortControllerRef = useRef(null);
  const utteranceRef = useRef(null);
  const chatBoxRef = useRef(null); // For auto scroll

  useEffect(() => {
    const storedMessages = JSON.parse(localStorage.getItem('chatHistory'));
    const storedPreviousChats = JSON.parse(localStorage.getItem('previousChats'));

    if (storedMessages) {
      setMessages(storedMessages);
    }

    if (storedPreviousChats) {
      setPreviousChats(storedPreviousChats);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  const submitHandler = (e) => {
    e.preventDefault();

    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      return;
    }

    if (question.trim() === '') return;

    if (messages.length === 0) {
      // Save first message as chat title
      setPreviousChats((prev) => [
        ...prev,
        { title: question, messages: [] }
      ]);
    }

    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: 'user', text: question },
    ]);

    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const conversationContext = messages
      .map((msg) => `${msg.sender}: ${msg.text}`)
      .join('\n') + `\nuser: ${question}`;

    axios
      .post(
        'https://gemini-app-pied.vercel.app/getResponse',
        { question: conversationContext },
        { signal: controller.signal }
      )
      .then((res) => {
        const aiResponse = res.data.response;
        formatResponse(aiResponse);
        setIsGenerating(false);
      })
      .catch((err) => {
        if (axios.isCancel(err)) {
          console.log('Request canceled by user');
        } else {
          console.error(err);
        }
        setIsGenerating(false);
      });

    setQuestion('');
  };

  const formatResponse = (aiResponse) => {
    const regex = /```([a-z]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;

    let match;
    while ((match = regex.exec(aiResponse)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: aiResponse.slice(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        language: match[1],
        content: match[2],
      });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < aiResponse.length) {
      parts.push({
        type: 'text',
        content: aiResponse.slice(lastIndex),
      });
    }

    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: 'ai', content: parts },
    ]);

    Prism.highlightAll();
  };

  const renderMessage = (msg) => {
    const avatarSrc = msg.sender === 'ai' ? geminiAvatar : userAvatar;

    return (
      <div className="message-content">
        <img src={avatarSrc} alt={`${msg.sender} avatar`} className="avatar" />
        <div className="message-text">
          {msg.sender === 'ai'
            ? msg.content.map((item, index) => {
                if (item.type === 'code') {
                  return (
                    <div key={index}>
                      <pre className="code-block">
                        <code className={`language-${item.language}`}>
                          {item.content}
                        </code>
                      </pre>
                      <button
                        className="copy-btn"
                        onClick={() => copyToClipboard(item.content)}
                      >
                        <FaSave /> Copy Code
                      </button>
                    </div>
                  );
                }
                return <p key={index}>{item.content}</p>;
              })
            : <p>{msg.text}</p>}
        </div>
      </div>
    );
  };

  const toggleSpeak = () => {
    if (isSpeaking || isGenerating) return; // Disable speak when generating a response

    if (response) {
      const utterance = new SpeechSynthesisUtterance(response);
      utteranceRef.current = utterance;

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const clearChat = () => {
    setPreviousChats((prev) => [
      ...prev.slice(0, prev.length - 1),
      { ...prev[prev.length - 1], messages },
    ]);
    setMessages([]);
    localStorage.removeItem('chatHistory');
  };

  const newChat = () => {
    clearChat();
  };

  const togglePreviousChats = () => {
    setShowPreviousChats((prevState) => !prevState);
  };

  const handleDeleteChat = (index) => {
    const updatedChats = previousChats.filter((_, i) => i !== index);
    setPreviousChats(updatedChats);
    localStorage.setItem('previousChats', JSON.stringify(updatedChats));
  };

  const handleRenameChat = (index) => {
    const newName = prompt('Enter a new name for this chat:');
    if (newName) {
      const updatedChats = [...previousChats];
      updatedChats[index].title = newName;
      setPreviousChats(updatedChats);
      localStorage.setItem('previousChats', JSON.stringify(updatedChats));
    }
  };

  const handleShareChat = (index) => {
    alert(`Sharing chat ${index + 1}!`);
  };

  const toggleOptions = (index) => {
    setShowOptions((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div className="App">
      <div className="chat-container">
        <button className="slider-btn" onClick={togglePreviousChats}>
          {showPreviousChats ? <FaChevronUp /> : <FaChevronDown />} Previous Chats
        </button>

        {showPreviousChats && (
          <div className="previous-chats">
            {previousChats.length > 0 ? (
              previousChats.map((chat, index) => (
                <div key={index} className="previous-chat">
                  <div className="chat-title" onClick={() => setMessages(chat.messages)}>
                    {chat.title}
                  </div>
                  <div className="chat-menu">
                    <FaEllipsisV onClick={() => toggleOptions(index)} />
                    {showOptions === index && (
                      <div className="chat-options">
                        <button onClick={() => handleRenameChat(index)}>
                          <FaPen /> Rename
                        </button>
                        <button onClick={() => handleDeleteChat(index)}>
                          <FaTrash /> Delete
                        </button>
                        <button onClick={() => handleShareChat(index)}>
                          <FaShareAlt /> Share
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>No previous chats available.</p>
            )}
          </div>
        )}

<div className="chat-box" ref={chatBoxRef}>
          {messages.length === 0 && (
            <div className="message ai">
              <div className="bubble first">
                <p>How can I help you? I am AI created by Parvez.</p>
              </div>
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="bubble">{renderMessage(msg)}</div>
            </div>
          ))}
          {isGenerating && (
            <div className="thinking-icon">🤔 AI is thinking...</div>
          )}
        </div>

        <form className="input-box" onSubmit={submitHandler}>
          <textarea
            placeholder="Type your message..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isGenerating}
          />
          <button type="submit">
            {isGenerating ? <FaStop /> : <FaArrowUp />} Submit
          </button>
        </form>

        <div className="chat-buttons">
          <button onClick={newChat}>
            <FaSave /> Save/New Chat
          </button>
          <button onClick={clearChat}>
            <FaBroom /> Clear Chat
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;





