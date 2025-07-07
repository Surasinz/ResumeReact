import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Profile from './components/Profile';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Projects from './components/Projects';
import GitHub from './components/Github';
import Education from './components/Education';

function App() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="App">
      <Header theme={theme} toggleTheme={toggleTheme} />
            <div className="grid-container">
      <Profile />
      <Skills />
      <Experience />
      <Projects />
      <Education />
      <GitHub />
        </div>  
    </div>
  );
}

export default App;
