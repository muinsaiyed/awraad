import React, { useState, useEffect, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { wirdSections } from '../data/wirdallatif';
import { awraadList } from '../data/awraadList';
import '../styles/WirdAlLatifReader.css';

const WirdAlLatifReader = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedAwraad, setSelectedAwraad] = useState(awraadList[0]);
  const [awraadData, setAwraadData] = useState(wirdSections);
  const [arabicFontSize, setArabicFontSize] = useState(24);
  const [englishFontSize, setEnglishFontSize] = useState(16);
  const [viewMode, setViewMode] = useState('paginated'); // 'paginated' or 'scrollable'
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef(null);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (viewMode === 'paginated' && currentSection < awraadData.length - 1) {
        nextSection();
      }
    },
    onSwipedRight: () => {
      if (viewMode === 'paginated' && currentSection > 0) {
        prevSection();
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        nextSection();
      } else if (event.key === 'ArrowLeft') {
        prevSection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const loadAwraadData = async () => {
      try {
        const module = await import(`../data/${selectedAwraad.dataFile}`);
        setAwraadData(module.default || module[Object.keys(module)[0]]);
        setCurrentSection(0);
        setSelectedWord(null);
      } catch (error) {
        console.error('Error loading awraad data:', error);
      }
    };

    loadAwraadData();
  }, [selectedAwraad]);

  const handleWordClick = (word, event) => {
    const currentWird = awraadData[currentSection];
    if (currentWird && currentWird.breakdown) {
      const breakdownWord = currentWird.breakdown.find(item => item.arabic === word);
      if (breakdownWord) {
        setSelectedWord(breakdownWord);
        const rect = event.target.getBoundingClientRect();
        const x = rect.left + window.scrollX;
        const y = rect.bottom + window.scrollY;
        setTooltipPosition({ x, y });
      } else {
        setSelectedWord(null);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setSelectedWord(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const nextSection = () => {
    setCurrentSection((prev) => {
      const next = prev + 1;
      return next < awraadData.length ? next : prev;
    });
    setSelectedWord(null);
  };

  const prevSection = () => {
    setCurrentSection((prev) => (prev > 0 ? prev - 1 : prev));
    setSelectedWord(null);
  };

  const handleAwraadChange = (event) => {
    const selectedId = event.target.value;
    const selected = awraadList.find(awraad => awraad.id === selectedId);
    setSelectedAwraad(selected);
  };

  const currentWird = awraadData[currentSection];

  if (!currentWird) {
    return <div className="error-message">No wird sections available.</div>;
  }

  const increaseArabicFontSize = () => {
    setArabicFontSize(prevSize => Math.min(prevSize + 2, 40));
  };

  const decreaseArabicFontSize = () => {
    setArabicFontSize(prevSize => Math.max(prevSize - 2, 16));
  };

  const increaseEnglishFontSize = () => {
    setEnglishFontSize(prevSize => Math.min(prevSize + 2, 32));
  };

  const decreaseEnglishFontSize = () => {
    setEnglishFontSize(prevSize => Math.max(prevSize - 2, 12));
  };

  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'paginated' ? 'scrollable' : 'paginated');
  };

  const renderWirdContent = (wird) => (
    <div className="wird-content">
      {wird.fullArabic && (
        <div className="arabic-text font-arabic" dir="rtl" style={{ fontSize: `${arabicFontSize}px` }}>
          {wird.fullArabic.split(' ').map((word, index) => (
            <span
              key={index}
              onClick={(e) => handleWordClick(word, e)}
              className="word"
            >
              {word}{' '}
            </span>
          ))}
        </div>
      )}
      {wird.transliteration && (
        <div className="transliteration" style={{ fontSize: `${englishFontSize * 0.9}px` }}>
          {wird.transliteration}
        </div>
      )}
      {wird.englishFromImage && (
        <div className="english" style={{ fontSize: `${englishFontSize}px` }}>
          {wird.englishFromImage}
        </div>
      )}
    </div>
  );

  return (
    <div className="wird-reader">
      <header className="reader-header">
        <h1 className="reader-title">Awraad Reader</h1>
        <div className="controls">
          <select 
            className="awraad-select" 
            value={selectedAwraad.id} 
            onChange={handleAwraadChange}
          >
            {awraadList.map(awraad => (
              <option key={awraad.id} value={awraad.id}>{awraad.name}</option>
            ))}
          </select>
          <div className="font-size-controls">
            <div className="font-control">
              <span>Arabic:</span>
              <button onClick={decreaseArabicFontSize}>A-</button>
              <span>{arabicFontSize}px</span>
              <button onClick={increaseArabicFontSize}>A+</button>
            </div>
            <div className="font-control">
              <span>English:</span>
              <button onClick={decreaseEnglishFontSize}>A-</button>
              <span>{englishFontSize}px</span>
              <button onClick={increaseEnglishFontSize}>A+</button>
            </div>
          </div>
          <button className="view-mode-toggle" onClick={toggleViewMode}>
            {viewMode === 'paginated' ? 'Switch to Scrollable View' : 'Switch to Paginated View'}
          </button>
        </div>
      </header>
      <main className={`reader-content ${viewMode}`} {...handlers}>
        {viewMode === 'paginated' ? (
          <>
            <div className="navigation">
              <button className="nav-button" onClick={prevSection} disabled={currentSection === 0}>
                &#8592; Previous
              </button>
              <span className="section-indicator">
                Section {currentSection + 1} of {awraadData.length}
              </span>
              <button 
                className="nav-button" 
                onClick={nextSection} 
                disabled={currentSection === awraadData.length - 1}
              >
                Next &#8594;
              </button>
            </div>
            {renderWirdContent(currentWird)}
          </>
        ) : (
          <div className="scrollable-content">
            {awraadData.map((wird, index) => (
              <div key={index} className="scrollable-section">
                <h2>Section {index + 1}</h2>
                {renderWirdContent(wird)}
              </div>
            ))}
          </div>
        )}
        {selectedWord && (
          <div 
            ref={tooltipRef}
            className="translation-tooltip" 
            style={{ 
              left: `${tooltipPosition.x}px`, 
              top: `${tooltipPosition.y}px`,
            }}
          >
            <strong className="font-arabic" style={{ fontSize: `${arabicFontSize * 0.9}px` }}>
              {selectedWord.arabic}:
            </strong> {selectedWord.english}
          </div>
        )}
      </main>
    </div>
  );
};

export default WirdAlLatifReader;