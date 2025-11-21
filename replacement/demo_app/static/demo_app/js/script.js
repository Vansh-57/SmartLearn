/* =====================================================================
   THEMES
   ===================================================================== */
const themes = [
  {
    id: 'magic-glow',
    name: 'Magic Glow ✨',
    apply: () => {
      setVars({
        bg: '#2a1744',
        panel: 'rgba(255,255,255,0.08)',
        text: '#f8fafc',
        muted: '#e9d5ff',
        accent: '#f5d76e',
        accent2: '#f472b6',
        rinQg: 'rgba(245,215,110,0.35)'
      });
      const main = document.getElementById('main');
      if (main) {
        main.classList.add('magic-bg');
        spawnSparkles(main, 40);
      }
    },
    cleanup: () => {
      const main = document.getElementById('main');
      if (main) {
           main.classList.remove('magic-bg');
        document.querySelectorAll('#main .sparkle').forEach(e => e.remove());
      }
    }
  },
  {
    id: 'focus-blue',
    name: 'Focus Blue',
    apply: () => {
      setVars({
        bg: '#0b1220',
        panel: '#0f172a',
        text: '#e5e7eb',
        muted: '#9ca3af',
        accent: '#60a5fa',
        accent2: '#a78bfa',
        ring: 'rgba(96,165,250,0.18)'
      });
    },
    cleanup: () => {}
  }
];

function setVars({ bg, panel, text, muted, accent, accent2, ring }) {
  const r = document.documentElement;
  if (bg) r.style.setProperty('--bg', bg);
  if (panel) r.style.setProperty('--panel', panel);
  if (text) r.style.setProperty('--text', text);
  if (muted) r.style.setProperty('--muted', muted);
  if (accent) r.style.setProperty('--accent', accent);
  if (accent2) r.style.setProperty('--accent-2', accent2);
  if (ring) r.style.setProperty('--ring', ring);
  
  const app = document.getElementById('app');
  if (app) app.style.background = bg;
}

let currentThemeIdx = -1;

function applyTheme(idx) {
  try {
    if (currentThemeIdx >= 0 && themes[currentThemeIdx].cleanup) {
      themes[currentThemeIdx].cleanup();
    }
    currentThemeIdx = idx;
    themes[idx].apply();
    
    const tb = document.getElementById('themeBadge');
    if (tb) tb.textContent = themes[idx].name;
    
    const cn = document.getElementById('currentThemeName');
    if (cn) cn.textContent = `Current: ${themes[idx].name}`;
  } catch (error) {
    console.error('Theme error:', error);
  }
}

function spawnSparkles(container, count) {
  if (!container) return;
  try {
    container.querySelectorAll('.sparkle').forEach(el => el.remove());
    const rect = container.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight;

    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'sparkle';
      s.style.left = (Math.random() * width) + 'px';
      s.style.top = (Math.random() * height) + 'px';
      s.style.animationDelay = (Math.random() * 6).toFixed(2) + 's';
      s.style.opacity = (0.4 + Math.random() * 0.8).toFixed(2);
      s.style.zIndex = '1';
      s.style.pointerEvents = 'none';
      container.appendChild(s);
    }
  } catch (error) {
    console.error('Sparkle error:', error);
  }
}

/* =====================================================================
   DATA
   ===================================================================== */
const demoMCQs = [];
const extractedKeywords = [];
const flashcardsData = [];

let mcqIdx = 0;
let mcqScore = 0;
let mcqAttempts = 0;
let currentTopic = null;

/* =====================================================================
   STORAGE !!!!! LOCAL STORAGE !!!!!
   ===================================================================== */
function saveFlashcards() {
  try {
    localStorage.setItem('smartlearn_flashcards', JSON.stringify(flashcardsData));
    return true;
  } catch (e) {
    return false;
  }
}

function loadFlashcards() {
  try {
    const saved = localStorage.getItem('smartlearn_flashcards');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        flashcardsData.length = 0;
        flashcardsData.push(...parsed);
        return true;
      }
    }
  } catch (e) {}
  return false;
}

function saveMCQs() {
  try {
    localStorage.setItem('smartlearn_mcqs', JSON.stringify(demoMCQs));
  } catch (e) {}
}

function loadMCQs() {
  try {
    const saved = localStorage.getItem('smartlearn_mcqs');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        demoMCQs.length = 0;
        demoMCQs.push(...parsed);
        return true;
      }
    }
  } catch (e) {}
  return false;
}

function clearAllData(newTopic) {
  flashcardsData.length = 0;
  demoMCQs.length = 0;
  extractedKeywords.length = 0;
  mcqIdx = 0;
  mcqScore = 0;
  mcqAttempts = 0;
  currentTopic = newTopic;
  // ✨ ADD THESE LINES - Force clear localStorage
  try {
    localStorage.removeItem('smartlearn_flashcards');
    localStorage.removeItem('smartlearn_mcqs');
  } catch (e) {}
  
  saveFlashcards();
  saveMCQs();
  updateHeaderStats();
}
 

/* =====================================================================
   MCQ  section
   ===================================================================== */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// ===== PREMIUM MCQ GENERATION - FINAL VERSION =====

function generateMCQs(query, aiResponse) {
  try {
    // Step 1: Clean the response
    const cleanText = aiResponse
      .replace(/[#*`>\[\]\(\)]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Step 2: Extract sentences with lenient filtering (KEY FIX!)
    const allSentences = cleanText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10); // CHANGED: More lenient!

    console.log('🔍 MCQ - Sentences found:', allSentences.length);

    if (allSentences.length < 3) {
      console.warn('⚠️ Not enough content for MCQs');
      return;
    }

    const mcqs = [];

    // MCQ 1: Core Definition
    if (allSentences.length > 0) {
      const correctAnswer = allSentences[0].substring(0, 150);
      const wrongAnswers = [
        `An outdated technology replaced by modern alternatives`,
        `A hardware-based solution for system management`,
        `A proprietary tool restricted to enterprise use`
      ];
      const allOptions = shuffleArray([correctAnswer, ...wrongAnswers]);
      mcqs.push({
        q: `What is the primary definition of ${query}?`,
        opts: allOptions,
        ans: allOptions.indexOf(correctAnswer),
        topic: query,
        explanation: correctAnswer
      });
    }

    // MCQ 2: Key Characteristics
    if (allSentences.length > 1) {
      const correctAnswer = allSentences[1].substring(0, 150);
      const wrongAnswers = [
        `It operates independently without any dependencies`,
        `It requires complete system replacement to implement`,
        `It works exclusively in isolated environments`
      ];
      const allOptions = shuffleArray([correctAnswer, ...wrongAnswers]);
      mcqs.push({
        q: `What is a defining characteristic of ${query}?`,
        opts: allOptions,
        ans: allOptions.indexOf(correctAnswer),
        topic: query,
        explanation: correctAnswer
      });
    }

    // MCQ 3: Functionality
    if (allSentences.length > 2) {
      const correctAnswer = allSentences[2].substring(0, 150);
      const wrongAnswers = [
        `By converting all data into binary-only formats`,
        `Through a centralized single-point-of-failure system`,
        `Using only legacy protocols from previous decades`
      ];
      const allOptions = shuffleArray([correctAnswer, ...wrongAnswers]);
      mcqs.push({
        q: `How does ${query} primarily function?`,
        opts: allOptions,
        ans: allOptions.indexOf(correctAnswer),
        topic: query,
        explanation: correctAnswer
      });
    }

    // MCQ 4: Advantages & Benefits
    if (allSentences.length > 3) {
      const correctAnswer = allSentences[3].substring(0, 150);
      const wrongAnswers = [
        `It significantly increases operational overhead and costs`,
        `It reduces system performance and efficiency`,
        `It eliminates user flexibility and control`
      ];
      const allOptions = shuffleArray([correctAnswer, ...wrongAnswers]);
      mcqs.push({
        q: `What is a major benefit of ${query}?`,
        opts: allOptions,
        ans: allOptions.indexOf(correctAnswer),
        topic: query,
        explanation: correctAnswer
      });
    }

    // MCQ 5: Real-World Applications
    if (allSentences.length > 4) {
      const correctAnswer = allSentences[4].substring(0, 150);
      const wrongAnswers = [
        `It is primarily used for entertainment and gaming purposes`,
        `It has minimal practical application in modern industries`,
        `It serves only academic and theoretical purposes`
      ];
      const allOptions = shuffleArray([correctAnswer, ...wrongAnswers]);
      mcqs.push({
        q: `In which real-world scenario would ${query} be most applicable?`,
        opts: allOptions,
        ans: allOptions.indexOf(correctAnswer),
        topic: query,
        explanation: correctAnswer
      });
    }

    // MCQ 6: Best Practices
    if (allSentences.length > 5) {
      const correctAnswer = allSentences[5].substring(0, 150);
      const wrongAnswers = [
        `Avoid using ${query} in production environments`,
        `Implement ${query} without any planning or preparation`,
        `Disable all security features when using ${query}`
      ];
      const allOptions = shuffleArray([correctAnswer, ...wrongAnswers]);
      mcqs.push({
        q: `What is a best practice when working with ${query}?`,
        opts: allOptions,
        ans: allOptions.indexOf(correctAnswer),
        topic: query,
        explanation: correctAnswer
      });
    }

    // MCQ 7: Comparison/Differentiation
    if (allSentences.length > 6) {
      const correctAnswer = allSentences[6].substring(0, 150);
      const wrongAnswers = [
        `It is identical to all competing solutions available`,
        `It completely replaces the need for alternative approaches`,
        `It has no distinguishing features from similar technologies`
      ];
      const allOptions = shuffleArray([correctAnswer, ...wrongAnswers]);
      mcqs.push({
        q: `What distinguishes ${query} from similar solutions?`,
        opts: allOptions,
        ans: allOptions.indexOf(correctAnswer),
        topic: query,
        explanation: correctAnswer
      });
    }

    console.log('📊 MCQs created:', mcqs.length);

    // Validate and add MCQs
    let validCount = 0;
    mcqs.forEach((mcq, idx) => {
      if (!mcq || !mcq.opts || !mcq.q || mcq.opts.length !== 4) return;
      if (typeof mcq.ans !== 'number' || mcq.ans < 0 || mcq.ans >= 4) return;
      if (!mcq.opts.every(o => typeof o === 'string' && o.length > 5)) return;

      demoMCQs.push(mcq);
      validCount++;
      console.log(`✅ MCQ ${validCount}: "${mcq.q.substring(0, 40)}..."`);
    });

    console.log(`✅ FINAL: ${validCount} MCQs added to array (Total: ${demoMCQs.length})`);

    if (validCount > 0) {
      saveMCQs();
      renderMCQ();
      updateHeaderStats();
    }

  } catch (error) {
    console.error('❌ MCQ generation error:', error);
  }
}

// ===== PREMIUM FLASHCARD GENERATION - FINAL VERSION =====

function generateMultipleFlashcards(query, aiResponse) {
  try {
    let cleanText = aiResponse
      .replace(/[#*`>\[\]\(\)]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // CHANGED: More lenient filtering for sentences
    const sentences = cleanText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 15);

    console.log('📚 Flashcard - Sentences found:', sentences.length);

    if (sentences.length < 3) {
      console.warn('⚠️ Not enough content for flashcards');
      return;
    }

    const flashcards = [];

    // Card 1: Core Definition (Comprehensive)
    if (sentences.length > 0) {
      const answer = sentences.slice(0, 2).join(' ').trim().substring(0, 400);
      flashcards.push({
        q: `What is ${query}?`,
        a: answer,
        type: 'definition'
      });
    }

    // Card 2: Key Characteristics & Features
    if (sentences.length > 2) {
      const answer = sentences.slice(2, 4).join(' ').trim().substring(0, 400);
      flashcards.push({
        q: `What are the key characteristics of ${query}?`,
        a: answer,
        type: 'keypoints'
      });
    }

    // Card 3: How It Works / Mechanism
    if (sentences.length > 4) {
      const answer = sentences.slice(4, 6).join(' ').trim().substring(0, 400);
      flashcards.push({
        q: `How does ${query} work?`,
        a: answer,
        type: 'process'
      });
    }

    // Card 4: Advantages & Benefits
    if (sentences.length > 6) {
      const answer = sentences.slice(6, 8).join(' ').trim().substring(0, 400);
      flashcards.push({
        q: `What are the main advantages of ${query}?`,
        a: answer,
        type: 'keypoints'
      });
    }

    // Card 5: Use Cases & Applications
    if (sentences.length > 8) {
      const answer = sentences.slice(8, 10).join(' ').trim().substring(0, 400);
      flashcards.push({
        q: `What are practical use cases for ${query}?`,
        a: answer,
        type: 'process'
      });
    }

    // Card 6: Important Considerations
    if (sentences.length > 10) {
      const answer = sentences.slice(10, 12).join(' ').trim().substring(0, 400);
      flashcards.push({
        q: `What important considerations should you know about ${query}?`,
        a: answer,
        type: 'keypoints'
      });
    }

    // Card 7: Best Practices
    if (sentences.length > 12) {
      const answer = sentences.slice(12, 14).join(' ').trim().substring(0, 400);
      flashcards.push({
        q: `What are best practices for using ${query}?`,
        a: answer,
        type: 'definition'
      });
    }

    // Card 8: Advanced Insights
    if (sentences.length > 14) {
      const answer = sentences.slice(14, 16).join(' ').trim().substring(0, 400);
      flashcards.push({
        q: `What are advanced insights about ${query}?`,
        a: answer,
        type: 'process'
      });
    }

    console.log('📊 Flashcards created:', flashcards.length);

    // Validate and add flashcards
    let validCount = 0;
    flashcards.forEach((card, idx) => {
      if (card.q && card.q.length > 5 && card.a && card.a.length > 20) {
        flashcardsData.push({
          q: card.q,
          a: card.a,
          type: card.type,
          topic: query,
          timestamp: Date.now()
        });
        validCount++;
        console.log(`✅ Card ${validCount}: "${card.q.substring(0, 40)}..."`);
      }
    });

    console.log(`✅ FINAL: ${validCount} flashcards added to array (Total: ${flashcardsData.length})`);

    if (validCount > 0) {
      saveFlashcards();
      renderFlashcards();
      updateHeaderStats();
    }

  } catch (error) {
    console.error('❌ Flashcard generation error:', error);
  }
}


function extractKeywords(query, aiResponse) {
  try {
    
    let cleanText = aiResponse
      .replace(/#+\s*/g, '')          
      .replace(/\*\*|\*|__|\//g, '')   
      .replace(/`+/g, '')              
      .replace(/\[|\]|{|}|<|>/g, '')  
      .replace(/---+|-{3,}/g, '')      
      .replace(/\n\s*[\-*•]\s*/g, '\n')
      .replace(/\n{3,}/g, '\n\n')      
      .trim();

    // Step 2: Extract sentences properly
    const sentences = cleanText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && !s.startsWith('---'));

    if (sentences.length === 0) {
      console.warn('⚠️ No sentences found for keywords');
      return;
    }

    // Step 3: Clear existing keywords
    extractedKeywords.length = 0;

    // Step 4: Add main topic as first keyword
    const mainDescription = sentences[0].substring(0, 120);
    extractedKeywords.push({
      k: query.charAt(0).toUpperCase() + query.slice(1),
      d: mainDescription
    });

    // Step 5: Extract key terms intelligently
    const acronymPattern = /\b[A-Z]{2,}\b/g;
    const titleCasePattern = /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2}\b/g;
    
    const acronyms = cleanText.match(acronymPattern) || [];
    const titleCases = cleanText.match(titleCasePattern) || [];

    let allTerms = [...new Set([...acronyms, ...titleCases])];

    // Step 6: Filter out irrelevant terms
    const stopWords = [
      'What', 'This', 'That', 'From', 'With', 'Where', 'When', 'Which', 'How', 'Why',
      'Is', 'Are', 'Was', 'Were', 'Be', 'Being', 'Been', 'The', 'And', 'Or', 'But',
      'By', 'On', 'In', 'At', 'To', 'For', 'Of', 'As', 'It', 'Its', 'If', 'Not',
      'Can', 'Could', 'Should', 'Would', 'May', 'Might', 'Must', 'Have', 'Has', 'Had',
      'Do', 'Does', 'Did', 'Will', 'Shall', 'Let', 'Us', 'Me', 'You', 'He', 'She',
      'We', 'They', 'A', 'An', 'About', 'Also', 'Some', 'Any', 'All', 'Most', 'More',
      'Such', 'Just', 'Than', 'Only', 'Very', 'So', 'Too', 'Because', 'Their', 'Other'
    ];

    allTerms = allTerms
      .filter(term => {
        if (term.toLowerCase() === query.toLowerCase()) return false;
        if (stopWords.includes(term)) return false;
        if (term.length < 3) return false;
        return true;
      })
      .slice(0, 5);

    // Step 7: Add keywords with context from sentences
    allTerms.forEach(term => {
      if (extractedKeywords.length < 6) {
        let bestSentence = '';
        
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes(term.toLowerCase()) && sentence.length > 25) {
            bestSentence = sentence;
            break;
          }
        }

        const description = bestSentence 
          ? bestSentence.substring(0, 120).trim()
          : `Key aspect of ${query}`;

        extractedKeywords.push({
          k: term,
          d: description
        });
      }
    });

    console.log(`✅ Keywords extracted: ${extractedKeywords.length}`);

    if (extractedKeywords.length > 0) {
      renderKeywords();
    }

  } catch (error) {
    console.error('❌ Keyword error:', error);
  }
}
/* =====================================================================
    Flash cards rendering 
   ===================================================================== */
function renderFlashcards() {
  const flashcardGrid = document.getElementById('flashcardGrid');
  if (!flashcardGrid) return;
  
  flashcardGrid.innerHTML = '';

  if (flashcardsData.length === 0) {
    flashcardGrid.innerHTML = `
      <div class="col-span-3 text-center text-[var(--muted)] p-8">
        <div class="text-4xl mb-4">📚</div>
        <div class="text-lg font-medium mb-2">No flashcards yet</div>
        <div class="text-sm">Search for a topic to generate flashcards!</div>
      </div>`;
    return;
  }

  const headerDiv = document.createElement('div');
  headerDiv.className = 'col-span-3 mb-4';
  headerDiv.innerHTML = `
    <span class="inline-block px-4 py-2 rounded-full border border-[var(--accent)] bg-[var(--accent)]/10 text-sm">
      📚 ${flashcardsData.length} Flashcard${flashcardsData.length !== 1 ? 's' : ''}
    </span>
  `;
  flashcardGrid.appendChild(headerDiv);

  const cardsToShow = [...flashcardsData].reverse();
  const typeColors = {
    'definition': '🔵',
    'keypoints': '🟢',
    'process': '🟣'
  };

  cardsToShow.forEach(fc => {
    const div = document.createElement('div');
    div.className = 'flashcard-wrapper relative';
    
    let displayAnswer = String(fc.a || 'No answer')
      .replace(/<[^>]*>/g, '')
      .replace(/\*\*/g, '')
      .trim();
    
    if (displayAnswer.length > 250) {
      displayAnswer = displayAnswer.substring(0, 250) + '...';
    }
    
    const typeBadge = typeColors[fc.type] || '📌';
    const typeLabel = fc.type ? fc.type.charAt(0).toUpperCase() + fc.type.slice(1) : 'Info';
    
    div.innerHTML = `
      <div class="flashcard flip card rounded-2xl p-3">
        <div class="flip-inner">
          <div class="face front flex flex-col justify-center items-center">
            <div class="absolute top-2 right-2 text-xs opacity-70">${typeBadge}</div>
            <div class="text-xs text-[var(--muted)] mb-2">Question</div>
            <div class="text-center font-medium px-4">${escapeHtml(fc.q)}</div>
          </div>
          <div class="face back flex flex-col justify-start items-center overflow-y-auto p-3">
            <div class="text-xs text-[var(--accent)] mb-1 font-medium">${typeLabel}</div>
            <div class="text-xs text-[var(--muted)] mb-2">Answer</div>
            <div class="text-center text-sm leading-relaxed px-2">${escapeHtml(displayAnswer)}</div>
          </div>
        </div>
      </div>
    `;
    
    const flashcard = div.querySelector('.flashcard');
    flashcard.addEventListener('mouseenter', function() {
      this.classList.add('flipped');
    });
    flashcard.addEventListener('mouseleave', function() {
      this.classList.remove('flipped');
    });
    
    flashcardGrid.appendChild(div);
  });
}

function renderMCQ() {
  const c = document.getElementById('mcqContainer');
  if (!c) return;
  
  c.innerHTML = '';
  
  if (demoMCQs.length === 0) {
    c.innerHTML = `
      <div class="text-center p-8 rounded-xl border border-white/10 bg-black/10">
        <div class="text-4xl mb-4">🎯</div>
        <div class="text-lg font-medium mb-2">No MCQs Yet</div>
        <div class="text-sm text-[var(--muted)]">Search for a topic to generate questions!</div>
      </div>`;
    return;
  }

  const item = demoMCQs[mcqIdx % demoMCQs.length];
  
  // QUESTION
  const q = document.createElement('div');
  q.className = 'text-lg font-medium mb-4 p-4 rounded-xl bg-white/5';
  q.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs text-[var(--muted)]">Question ${(mcqIdx % demoMCQs.length) + 1} of ${demoMCQs.length}</span>
    </div>
    <div>${escapeHtml(item.q)}</div>
  `;
  c.appendChild(q);

  // OPTIONS
  const list = document.createElement('div');
  list.className = 'grid md:grid-cols-2 gap-3';

  item.opts.forEach((opt, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-left bg-transparent mcq-option transition-all';
    b.innerHTML = `
      <div class="flex items-start gap-3">
        <span class="flex-shrink-0 w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-xs">
          ${String.fromCharCode(65 + i)}
        </span>
        <span class="flex-1">${escapeHtml(opt)}</span>
      </div>
    `;
    b.setAttribute('data-index', String(i));
    b.setAttribute('data-correct', String(item.ans));
    
    b.addEventListener('click', function() {
      const alreadyAnswered = list.querySelector('.mcq-option.correct, .mcq-option.wrong');
      if (alreadyAnswered) return;
      
      const selectedIdx = parseInt(this.dataset.index);
      const correctIdx = parseInt(this.dataset.correct);
      
      list.querySelectorAll('.mcq-option').forEach((btn, idx) => {
        btn.style.pointerEvents = 'none';
        if (idx === correctIdx) {
          btn.classList.add('correct');
          btn.style.background = 'rgba(34, 197, 94, 0.2)';
          btn.style.borderColor = 'rgb(34, 197, 94)';
        }
      });
      
      if (selectedIdx === correctIdx) {
        this.classList.add('correct');
        mcqScore++;
        showNotification('✅ Correct!', 1500);
      } else {
        this.classList.add('wrong');
        this.style.background = 'rgba(239, 68, 68, 0.2)';
        this.style.borderColor = 'rgb(239, 68, 68)';
        showNotification('❌ Incorrect', 2000);
      }
      
      mcqAttempts++;
      updateMCQScore();
      
      // Update progress bar immediately after answering
      const progressBar = c.querySelector('.h-full.bg-gradient-to-r');
      if (progressBar) {
        const answeredCount = mcqIdx + 1;
        const progressPercent = (answeredCount / demoMCQs.length) * 100;
        progressBar.style.width = progressPercent + '%';
        
        // Update progress text
        const progressText = c.querySelector('.flex.justify-between span:last-child');
        if (progressText) {
          progressText.textContent = `${answeredCount} / ${demoMCQs.length}`;
        }
      }
      
      if (item.explanation) {
        const explanationDiv = document.createElement('div');
        explanationDiv.className = 'mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-sm';
        explanationDiv.innerHTML = `
          <div class="font-medium text-blue-400 mb-1">💡 Explanation:</div>
          <div class="text-[var(--text)]">${escapeHtml(item.explanation)}</div>
        `;
        list.parentNode.insertBefore(explanationDiv, list.nextSibling);
      }
      
      setTimeout(() => {
        const nextBtn = document.getElementById('nextMcq');
        if (nextBtn) {
          nextBtn.classList.add('pulse-animation');
          nextBtn.textContent = mcqIdx + 1 < demoMCQs.length ? 'Next Question →' : '↻ Restart Quiz';
        }
      }, 1000);
    });
    
    list.appendChild(b);
  });

  c.appendChild(list);

  // PROGRESS - Fills as you answer questions
  const progress = document.createElement('div');
  progress.className = 'mt-4 p-3 rounded-xl bg-black/20';
  const answeredCount = mcqAttempts;
  const progressPercent = (answeredCount / demoMCQs.length) * 100;
  progress.innerHTML = `
    <div class="flex justify-between items-center mb-2 text-xs text-[var(--muted)]">
      <span>Progress</span>
      <span>${answeredCount} / ${demoMCQs.length}</span>
    </div>
    <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
      <div class="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] rounded-full transition-all duration-500" 
           style="width: ${progressPercent}%"></div>
    </div>
  `;
  c.appendChild(progress);
}

function updateMCQScore() {
  const scoreEl = document.getElementById('mcqScore');
  if (scoreEl && mcqAttempts > 0) {
    const percentage = Math.round((mcqScore / mcqAttempts) * 100);
    scoreEl.innerHTML = `
      <div class="text-sm">
        <span class="font-medium">Score:</span> 
        <span class="text-[var(--accent)] font-bold">${mcqScore}/${mcqAttempts}</span>
        <span class="text-[var(--muted)] ml-2">(${percentage}%)</span>
      </div>
    `;
  }
}

function renderKeywords() {
  const list = document.getElementById('kwList');
  if (!list) return;
  
  list.innerHTML = '';
  
  if (extractedKeywords.length === 0) {
    list.innerHTML = `
      <div class="col-span-2 text-center p-8 rounded-xl border border-white/10 bg-black/10">
        <div class="text-4xl mb-4">🔑</div>
        <div class="text-lg font-medium mb-2">No Keywords Yet</div>
        <div class="text-sm text-[var(--muted)]">Search for a topic to extract keywords!</div>
      </div>`;
    return;
  }
  
  const header = document.createElement('div');
  header.className = 'col-span-2 mb-4';
  header.innerHTML = `
    <div class="flex items-center justify-between">
      <span class="text-lg font-semibold">🔑 Key Terms</span>
      <span class="text-xs text-[var(--muted)]">${extractedKeywords.length} keywords</span>
    </div>
  `;
  list.appendChild(header);
  
  extractedKeywords.forEach(({ k, d }) => {
    const card = document.createElement('div');
    card.className = 'rounded-xl border border-white/10 p-4 bg-black/10 hover:bg-white/5 transition-all';
    card.innerHTML = `
      <div class="font-medium mb-2 text-[var(--accent)]">${escapeHtml(k)}</div>
      <div class="text-sm text-[var(--text)] leading-relaxed">${escapeHtml(d)}</div>`;
    list.appendChild(card);
  });
}

function renderTest() {
  const area = document.getElementById('testArea');
  if (!area) return;
  
  area.innerHTML = '';
  
  if (demoMCQs.length === 0) {
    area.innerHTML = `
      <div class="text-center p-8 rounded-xl border border-white/10 bg-black/10">
        <div class="text-4xl mb-4">📝</div>
        <div class="text-lg font-medium mb-2">No Test Available</div>
        <div class="text-sm text-[var(--muted)]">Generate MCQs first!</div>
      </div>`;
    return;
  }
  
  demoMCQs.forEach((it, idx) => {
    const sec = document.createElement('div');
    sec.className = 'rounded-xl border border-white/10 p-4 bg-black/10 mb-4 test-question';
    sec.dataset.questionIndex = idx;
    sec.dataset.correctAnswer = it.ans;

    const q = document.createElement('div');
    q.className = 'font-medium mb-3 text-base';
    q.textContent = (idx + 1) + '. ' + it.q;
    sec.appendChild(q);

    const list = document.createElement('div');
    list.className = 'grid md:grid-cols-2 gap-2';

    it.opts.forEach((opt, i) => {
      const label = document.createElement('label');
      label.className = 'flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer transition-all test-option';
      label.dataset.optionIndex = i;
      
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'q' + idx;
      input.value = String(i);
      input.className = 'accent-[var(--accent)]';
      
      const span = document.createElement('span');
      span.className = 'text-sm';
      span.textContent = opt;
      
      label.appendChild(input);
      label.appendChild(span);
      list.appendChild(label);
    });

    sec.appendChild(list);
    area.appendChild(sec);
  });
}

/* =====================================================================
   Duration
   ===================================================================== */
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  const map = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
  return str.replace(/[&<>"']/g, m => map[m]);
}

function showNotification(message, duration = 3000) {
  try {
    document.querySelectorAll('.smartlearn-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'smartlearn-notification fixed top-20 right-4 bg-[var(--panel)] border-2 border-[var(--accent)] text-[var(--text)] px-5 py-3 rounded-xl shadow-2xl z-[10004]';
    notification.style.animation = 'slideIn 0.3s ease-out';
    notification.style.maxWidth = '350px';
    notification.style.fontWeight = '500';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      notification.style.transition = 'all 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  } catch (error) {}
}

function updateHeaderStats() {
  const header = document.getElementById('pageHeader');
  if (!header) return;
  
  try {
    const existingBadges = header.querySelector('.stats-badges');
    if (existingBadges) existingBadges.remove();
    
    const badgesContainer = document.createElement('div');
    badgesContainer.className = 'stats-badges flex items-center gap-2 mr-2';
    badgesContainer.innerHTML = `
      <div class="px-3 py-1 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-xs flex items-center gap-1">
        <span>📚</span>
        <span class="font-medium">${flashcardsData.length}</span>
        <span class="text-[var(--muted)]">cards</span>
      </div>
      <div class="px-3 py-1 rounded-full border border-[var(--accent-2)]/30 bg-[var(--accent-2)]/10 text-xs flex items-center gap-1">
        <span>🎯</span>
        <span class="font-medium">${demoMCQs.length}</span>
        <span class="text-[var(--muted)]">MCQs</span>
      </div>
    `;
    
    const themeBadge = header.querySelector('#themeBadge');
    if (themeBadge && themeBadge.parentNode) {
      themeBadge.parentNode.insertBefore(badgesContainer, themeBadge);
    }
  } catch (error) {}
}

/* =====================================================================
   pop ups 
   ===================================================================== */
function showFlashcardPopup() {
  const popup = document.createElement('div');
  popup.className = `fixed right-4 top-20 bg-[var(--panel)] border-2 border-[var(--accent)] 
    rounded-2xl p-6 shadow-2xl z-[9999] animate-slideIn`;
  popup.style.minWidth = '300px';
  popup.innerHTML = `
    <div class="text-center">
      <div class="text-4xl mb-3">📚</div>
      <div class="font-bold text-lg mb-1">Flashcards Generated!</div>
      <div class="text-sm text-[var(--muted)]">✓ 6 study cards created</div>
    </div>
  `;
  document.body.appendChild(popup);
  
  setTimeout(() => {
    popup.style.opacity = '0';
    popup.style.transform = 'translateX(400px)';
    popup.style.transition = 'all 0.3s ease-out';
    setTimeout(() => popup.remove(), 300);
  }, 2000);
}

function showMCQPopup() {
  const popup = document.createElement('div');
  popup.className = `fixed right-4 top-20 bg-[var(--panel)] border-2 border-[var(--accent-2)] 
    rounded-2xl p-6 shadow-2xl z-[9999] animate-slideIn`;
  popup.style.minWidth = '300px';
  popup.innerHTML = `
    <div class="text-center">
      <div class="text-4xl mb-3">🎯</div>
      <div class="font-bold text-lg mb-1">MCQs Generated!</div>
      <div class="text-sm text-[var(--muted)]">✓ Quiz questions ready</div>
    </div>
  `;
  document.body.appendChild(popup);
  
  setTimeout(() => {
    popup.style.opacity = '0';
    popup.style.transform = 'translateX(400px)';
    popup.style.transition = 'all 0.3s ease-out';
    setTimeout(() => popup.remove(), 300);
  }, 2000);
}

function showKeywordsPopup() {
  const popup = document.createElement('div');
  popup.className = `fixed right-4 top-20 bg-[var(--panel)] border-2 border-[var(--accent)] 
    rounded-2xl p-6 shadow-2xl z-[9999] animate-slideIn`;
  popup.style.minWidth = '300px';
  popup.innerHTML = `
    <div class="text-center">
      <div class="text-4xl mb-3">🔑</div>
      <div class="font-bold text-lg mb-1">Keywords Extracted!</div>
      <div class="text-sm text-[var(--muted)]">✓ Key terms identified</div>
    </div>
  `;
  document.body.appendChild(popup);
  
  setTimeout(() => {
    popup.style.opacity = '0';
    popup.style.transform = 'translateX(400px)';
    popup.style.transition = 'all 0.3s ease-out';
    setTimeout(() => popup.remove(), 300);
  }, 2000);
}

/* =====================================================================
   function calls yaha hai 
   ===================================================================== */
function initializeApp() {
  loadFlashcards();
  loadMCQs();
  
  applyTheme(0);
  renderFlashcards();
  renderMCQ();
  renderKeywords();
  renderTest();
  updateHeaderStats();
  
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  const searchWrapper = document.getElementById('searchWrapper');
  const searchHeading = document.getElementById('searchHeading');
  const searchResult = document.getElementById('searchResult');

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('mousedown', (ev) => ev.preventDefault());



// =====  Search ka ye hai Notificatio waala  =====

searchBtn.addEventListener('click', async () => {
  setTimeout(() => {
    try {
      searchInput.focus();
      const len = searchInput.value.length;
      if (typeof searchInput.setSelectionRange === 'function') {
        searchInput.setSelectionRange(len, len);
      }
    } catch (e) {}
  }, 0);

  const query = searchInput.value.trim();
  
  if (!query) {
    searchResult.innerHTML = `<div class="rounded-xl border border-white/10 p-3 bg-black/10 text-[var(--text)]">Please type a concept to search.</div>`;
    if (searchWrapper) searchWrapper.classList.add('expanded');
    if (searchHeading) searchHeading.classList.add('expanded');
    if (searchResult) {
      searchResult.classList.add('expanded');
      searchResult.classList.remove('opacity-0', 'pointer-events-none');
    }
    return;
  }

  // ✨ SHOW NOTIFICATION INSTANTLY (before fetching!)
  showNotification(`✨ Generating content for "${query}"!`, 2000);

  clearAllData(query);

  if (searchWrapper) searchWrapper.classList.add('expanded');
  if (searchHeading) searchHeading.classList.add('expanded');
  if (searchResult) {
    searchResult.classList.add('expanded');
    searchResult.classList.remove('opacity-0', 'pointer-events-none');
  }

  searchResult.innerHTML = `<div class="rounded-xl border border-white/10 p-3 bg-black/10 text-[var(--text)]">🔍 Generating fresh content for "${escapeHtml(query)}"...</div>`;

  try {
    const url = `/ai/?prompt=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    
    if (!res.ok) throw new Error('Network error');
    
    const data = await res.json();
    const aiResponse = (data.response || '').trim() || 'Answer coming soon...';

    let html = aiResponse;
    if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
      html = marked.parse(aiResponse);
    } else {
      html = escapeHtml(aiResponse).replace(/\n/g, '<br>');
    }
    
    searchResult.innerHTML = '';
    const inner = document.createElement('div');
    inner.id = 'searchResultInner';
    inner.className = 'p-4 overflow-auto max-h-72 text-left space-y-4';
    inner.innerHTML = html;
    searchResult.appendChild(inner);
    searchResult.scrollTop = 0;

    // ✨ POPUP 1 (at 0ms): Flashcards Generated
    generateMultipleFlashcards(query, aiResponse);
    showFlashcardPopup();

    // ✨ POPUP 2 (at 2.5 seconds): MCQs Generated
    await new Promise(resolve => setTimeout(resolve, 2500));
    generateMCQs(query, aiResponse);
    showMCQPopup();

    // ✨ POPUP 3 (at 5 seconds): Keywords Extracted
    await new Promise(resolve => setTimeout(resolve, 2500));
    extractKeywords(query, aiResponse);
    showKeywordsPopup();
    
  } catch (err) {
    console.error('Search error:', err);
    searchResult.innerHTML = `<div class="rounded-xl border border-white/10 p-3 bg-black/10 text-[var(--text)]">❌ Error. Please try again.</div>`;
  }
});

// Enter key support
searchInput.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') {
    ev.preventDefault();
    searchBtn.click();
  }
});
  }
 // ✨ STORY GENERATION - Concept to Story
  const genStoryBtn = document.getElementById('genStory');
  const conceptInput = document.getElementById('conceptInput');
  const toneSelect = document.getElementById('toneSelect');
  const storyOutput = document.getElementById('storyOutput');
if (genStoryBtn && conceptInput && storyOutput) {
  genStoryBtn.addEventListener('click', async () => {
    const concept = conceptInput.value.trim();
    const tone = toneSelect.value;
    
    if (!concept) {
      showNotification('Please enter a concept first!');
      return;
    }
    
    storyOutput.innerHTML = '<div class="text-[var(--muted)]">✨ Generating story...</div>';
    
    try {
      const prompt = `Create a ${tone} story about: ${concept}`;
      const url = `/ai/?prompt=${encodeURIComponent(prompt)}`;
      const res = await fetch(url);
      
      if (!res.ok) throw new Error('Network error');
      
      const data = await res.json();
      let html = marked.parse(data.response || 'Story generation failed');
      
      storyOutput.innerHTML = html;
      showNotification('📖 Story generated!', 2000);
    } catch (err) {
      console.error('Story error:', err);
      storyOutput.innerHTML = '<div class="text-red-400">❌ Error generating story. Try again.</div>';
    }
  });
}

  const navBtns = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('main > section');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active-nav'));
      sections.forEach(s => s.classList.add('hidden'));
      
      const target = btn.dataset.section;
      const active = document.getElementById('section-' + target);
      
      if (active) {
        active.classList.remove('hidden');
        if (target === 'search') {
          // Search section
          const searchWrapper = document.getElementById('searchWrapper');
          if (searchWrapper) searchWrapper.classList.add('expanded');
        }
        if (target === 'story') {
          // Concept to Story section
          renderConceptStory();
        }
        if (target === 'flashcards') renderFlashcards();
        if (target === 'mcqs') renderMCQ();
        if (target === 'test') renderTest();
        if (target === 'keywords') renderKeywords();
      }
      
      btn.classList.add('active-nav');
      
      if (document.body.classList.contains('sidebar-open')) {
        document.body.classList.remove('sidebar-open');
        const sidebarBackdrop = document.getElementById('sidebarBackdrop');
        if (sidebarBackdrop) sidebarBackdrop.classList.add('hidden');
      }
    });
  });

    // 📱 SIDEBAR TOGGLE - Open/Close Sidebar
  const sidebar = document.getElementById('sidebar');
  const toggleSidebarBtn = document.getElementById('toggleSidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');

  if (toggleSidebarBtn && sidebar) {
    toggleSidebarBtn.addEventListener('click', () => {
      const isCollapsed = sidebar.classList.contains('sidebar-collapsed');
      
      if (isCollapsed) {
        sidebar.classList.remove('sidebar-collapsed');
        sidebar.classList.add('sidebar-expanded');
        toggleSidebarBtn.setAttribute('aria-expanded', 'true');
      } else {
        sidebar.classList.remove('sidebar-expanded');
        sidebar.classList.add('sidebar-collapsed');
        toggleSidebarBtn.setAttribute('aria-expanded', 'false');
      }
      
      if (window.innerWidth <= 768) {
        const isOpen = document.body.classList.toggle('sidebar-open');
        if (sidebarBackdrop) {
          if (isOpen) sidebarBackdrop.classList.remove('hidden');
          else sidebarBackdrop.classList.add('hidden');
        }
      }
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => {
      document.body.classList.remove('sidebar-open');
      sidebarBackdrop.classList.add('hidden');
    });
  }

  const changeThemeBtn = document.getElementById('changeTheme');
  const changeThemeIcon = document.getElementById('changeThemeIcon');

  if (changeThemeBtn) {
    changeThemeBtn.addEventListener('click', () => {
      applyTheme((currentThemeIdx + 1) % themes.length);
    });
  }
  
  if (changeThemeIcon) {
    changeThemeIcon.addEventListener('click', () => {
      applyTheme((currentThemeIdx + 1) % themes.length);
    });
  }

  const nextMcqBtn = document.getElementById('nextMcq');
  if (nextMcqBtn) {
    nextMcqBtn.addEventListener('click', () => {
      mcqIdx++;
      
      if (mcqIdx >= demoMCQs.length) {
        if (confirm(`Quiz completed! Score: ${mcqScore}/${mcqAttempts} (${Math.round(mcqScore/mcqAttempts*100)}%)\n\nRestart?`)) {
          mcqIdx = 0;
          mcqScore = 0;
          mcqAttempts = 0;
          updateMCQScore();
        } else {
          mcqIdx = demoMCQs.length - 1;
        }
      }
      
      nextMcqBtn.classList.remove('pulse-animation');
      nextMcqBtn.textContent = 'Next Question';
      renderMCQ();
    });
  }

  const submitTestBtn = document.getElementById('submitTest');
  if (submitTestBtn) {
    submitTestBtn.addEventListener('click', () => {
      const testQuestions = document.querySelectorAll('.test-question');
      let correct = 0;
      const total = testQuestions.length;
      
      testQuestions.forEach((questionDiv) => {
        const correctAnswer = parseInt(questionDiv.dataset.correctAnswer);
        const selectedInput = questionDiv.querySelector('input[type="radio"]:checked');
        const allOptions = questionDiv.querySelectorAll('.test-option');
        
        allOptions.forEach((option, idx) => {
          const optionIndex = parseInt(option.dataset.optionIndex);
          
          // Highlight correct answer in green
          if (optionIndex === correctAnswer) {
            option.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
            option.style.borderColor = 'rgb(34, 197, 94)';
            option.style.fontWeight = '600';
          }
          
          // If user selected this option
          if (selectedInput && parseInt(selectedInput.value) === optionIndex) {
            if (optionIndex === correctAnswer) {
              // Correct answer - already green
              correct++;
            } else {
              // Wrong answer - mark in red
              option.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
              option.style.borderColor = 'rgb(239, 68, 68)';
              option.style.fontWeight = '600';
            }
          }
          
          // Disable further selection
          const input = option.querySelector('input');
          if (input) input.disabled = true;
          option.style.cursor = 'not-allowed';
        });
      });
      
      const pct = Math.round((correct / total) * 100);
      const tr = document.getElementById('testResult');
      
      if (tr) {
        tr.innerHTML = `
          <div class="text-center p-4 rounded-xl border-2 ${pct >= 60 ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}">
            <div class="text-2xl font-bold mb-2">${correct}/${total}</div>
            <div class="text-lg">${pct}% Score</div>
            <div class="text-sm mt-2 text-[var(--muted)]">${pct >= 60 ? '✅ Great job!' : '❌ Keep practicing!'}</div>
          </div>
        `;
      }
      
      showNotification(`📊 Test completed! Score: ${correct}/${total} (${pct}%)`);
      submitTestBtn.disabled = true;
      submitTestBtn.style.opacity = '0.5';
      submitTestBtn.style.cursor = 'not-allowed';
    });
  }

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      if (searchResult && searchResult.classList.contains('expanded')) {
        searchResult.classList.remove('expanded');
        if (searchWrapper) searchWrapper.classList.remove('expanded');
        if (searchHeading) searchHeading.classList.remove('expanded');
      }
    }
  });

  console.log('✅ SmartLearn initialized!');
}

function injectCustomStyles() {
  const style = document.createElement('style');
  style.id = 'smartlearn-custom-styles';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    .pulse-animation {
      animation: pulse 1s ease-in-out 3;
    }
    
    .mcq-option.selected, .tab-active, .nav-btn.active-nav {
      background: rgba(245,215,110,0.2) !important;
      border-color: var(--accent) !important;
    }
    
    .flashcard-wrapper {
      position: relative;
      z-index: 10;
    }
    
    .flashcard {
      position: relative;
      z-index: 5;
      cursor: default;
    }
    
    .flashcard:hover .flip-inner {
      transform: rotateY(180deg);
    }
    
    .flip-inner {
      transition: transform 0.6s;
      transform-style: preserve-3d;
    }
    
    .flashcard.flipped .flip-inner {
      transform: rotateY(180deg);
    }
    
    #section-mcqs {
      overflow-y: auto !important;
      max-height: calc(100vh - 100px);
    }
    
    #mcqContainer {
      max-height: none !important;
      overflow: visible !important;
    }
    
    #section-test {
      overflow-y: auto !important;
      max-height: calc(100vh - 120px);
      padding-bottom: 2rem;
      padding-right: 1rem;
    }
    
    #testArea {
      overflow: visible !important;
      max-height: none !important;
    }
    
    #section-test::-webkit-scrollbar {
      width: 10px;
    }
    
    #section-test::-webkit-scrollbar-track {
      background: var(--panel);
      border-radius: 10px;
    }
    
    #section-test::-webkit-scrollbar-thumb {
      background-color: var(--accent);
      border-radius: 10px;
      border: 2px solid var(--panel);
    }
    
    #section-test::-webkit-scrollbar-thumb:hover {
      background-color: var(--accent-2);
    }
    
    #section-keywords {
      overflow-y: auto !important;
      max-height: calc(100vh - 100px);
    }
    
    /* SIDEBAR FIX - Show only dots when collapsed */
    .sidebar-collapsed .nav-btn {
      justify-content: center !important;
      padding-left: 1rem !important;
      padding-right: 1rem !important;
      position: relative;
    }
    
    /* Hide icon and text, show dot indicator */
    .sidebar-collapsed .nav-btn svg {
      display: none !important;
    }
    
    .sidebar-collapsed .nav-btn span:not(.sr-only) {
      display: none !important;
    }
    
    /* Create dot indicator when collapsed */
    .sidebar-collapsed .nav-btn::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--muted);
      display: block;
      transition: all 0.3s ease;
    }
    
    .sidebar-collapsed .nav-btn.active-nav::before {
      background: var(--accent);
      width: 10px;
      height: 10px;
      box-shadow: 0 0 12px var(--accent);
    }
    
    .sidebar-collapsed .nav-btn:hover::before {
      background: var(--accent);
      transform: scale(1.2);
    }
    
    /* Ensure sidebar width when collapsed */
    #sidebar.sidebar-collapsed {
      width: 64px !important;
    }
    
    #sidebar.sidebar-collapsed .nav-btn {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 100% !important;
    }
  `;
  
  const existing = document.getElementById('smartlearn-custom-styles');
  if (existing) existing.remove();
  
  document.head.appendChild(style);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectCustomStyles();
    initializeApp();
  });
} else {
  injectCustomStyles();
  initializeApp();
}

window.SmartLearn = {
  version: '3.4.0',
  flashcardsData: flashcardsData,
  mcqsData: demoMCQs,
  currentTopic: () => currentTopic,
  clearAll: () => clearAllData(null)
};