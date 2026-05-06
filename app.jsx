const { useState, useEffect, useMemo, useRef } = React;
const { motion, AnimatePresence } = window.Motion;

// --- Icons ---
const SearchIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const MoonIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const SunIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const CopyIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const CheckIcon = () => <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const CloseIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [visibleCount, setVisibleCount] = useState(30);
  const [copied, setCopied] = useState(false);

  const listRef = useRef(null);
  const observerRef = useRef(null);

  // Initialize data
  const data = useMemo(() => {
    if (typeof materialsData === 'undefined') return [];
    // Sort alphabetically by term
    return [...materialsData].sort((a, b) => a.term.localeCompare(b.term));
  }, []);

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  // Paginated/Visible data
  const visibleData = useMemo(() => {
    return filteredData.slice(0, visibleCount);
  }, [filteredData, visibleCount]);

  // Infinite Scroll Observer
  useEffect(() => {
    const options = {
      root: listRef.current,
      rootMargin: '100px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting) {
        setVisibleCount(prev => Math.min(prev + 20, filteredData.length));
      }
    }, options);

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [filteredData.length]);

  // Dark Mode Toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Copy to clipboard
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // A-Z Navigation
  const handleAlphaJump = (letter) => {
    const targetIdx = filteredData.findIndex(item => item.term.charAt(0).toUpperCase() === letter);
    if (targetIdx !== -1) {
      // Find element by id and scroll into view
      const el = document.getElementById(`term-${filteredData[targetIdx].term}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Navbar */}
      <nav className="flex-none px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-xl">M</div>
          <h1 className="text-2xl font-serif font-bold text-slate-800 dark:text-white tracking-tight">MatDex</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative w-72 md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search terms, definitions..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setVisibleCount(30); // reset pagination on search
              }}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-full leading-5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-all duration-200"
            />
          </div>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* A-Z Index Bar (Leftmost) */}
        <div className="hidden md:flex flex-col items-center py-6 px-2 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 overflow-y-auto hide-scrollbar z-10 w-12">
          {alphabet.map(letter => (
            <button
              key={letter}
              onClick={() => handleAlphaJump(letter)}
              className="text-xs font-semibold py-1 px-2 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Sidebar - Term List */}
        <div 
          className="w-full md:w-1/3 lg:w-1/4 h-full border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto custom-scrollbar relative"
          ref={listRef}
        >
          <div className="p-4 flex flex-col gap-3">
            {filteredData.length === 0 ? (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                <p>No results found for "{searchTerm}"</p>
              </div>
            ) : (
              visibleData.map(item => (
                <motion.div
                  layoutId={`term-card-${item.term}`}
                  key={item.term}
                  id={`term-${item.term}`}
                  onClick={() => setSelectedTerm(item)}
                  className={`
                    p-4 rounded-xl cursor-pointer border transition-all duration-200
                    ${selectedTerm?.term === item.term 
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-md ring-1 ring-brand-500 z-10' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-sm bg-white dark:bg-slate-800'}
                  `}
                  whileHover={{ scale: selectedTerm?.term === item.term ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.h3 layoutId={`term-title-${item.term}`} className="font-bold text-slate-800 dark:text-slate-100 mb-1 capitalize">
                    {item.term}
                  </motion.h3>
                  <motion.p layoutId={`term-desc-${item.term}`} className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                    {item.definition}
                  </motion.p>
                </motion.div>
              ))
            )}
            
            {/* Observer element for infinite scrolling */}
            {visibleCount < filteredData.length && (
              <div ref={observerRef} className="h-10 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-500"></div>
              </div>
            )}
          </div>
        </div>

        {/* Main Definition Area */}
        <div className="hidden md:flex flex-1 bg-slate-50 dark:bg-slate-900 relative overflow-hidden items-center justify-center p-8">
          
          <AnimatePresence mode="wait">
            {selectedTerm ? (
              <motion.div
                key="selected-card"
                layoutId={`term-card-${selectedTerm.term}`}
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-10 w-full max-w-3xl overflow-y-auto max-h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex justify-between items-start mb-6">
                  <motion.h2 layoutId={`term-title-${selectedTerm.term}`} className="text-4xl font-serif font-bold text-slate-900 dark:text-white capitalize">
                    {selectedTerm.term}
                  </motion.h2>
                  <button 
                    onClick={() => setSelectedTerm(null)}
                    className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                  >
                    <CloseIcon />
                  </button>
                </div>
                
                <div className="space-y-8">
                  <div>
                    <h4 className="text-sm font-semibold tracking-wider text-brand-600 dark:text-brand-400 uppercase mb-3">Definition</h4>
                    <motion.div layoutId={`term-desc-${selectedTerm.term}`} className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 relative group">
                      {selectedTerm.definition}
                      
                      <button 
                        onClick={() => handleCopy(selectedTerm.definition)}
                        className="absolute top-4 right-4 p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400"
                        title="Copy to clipboard"
                      >
                        {copied ? <CheckIcon /> : <CopyIcon />}
                        {copied ? 'Copied!' : ''}
                      </button>
                    </motion.div>
                  </div>
                  
                  {selectedTerm.applications && selectedTerm.applications.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <h4 className="text-sm font-semibold tracking-wider text-brand-600 dark:text-brand-400 uppercase mb-3">Applications</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTerm.applications.map((app, idx) => (
                          <span key={idx} className="px-4 py-1.5 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full text-sm font-medium border border-brand-100 dark:border-brand-800">
                            {app}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {selectedTerm.related_terms && selectedTerm.related_terms.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                      <h4 className="text-sm font-semibold tracking-wider text-brand-600 dark:text-brand-400 uppercase mb-3">Related Terms</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTerm.related_terms.map((rel, idx) => (
                          <span 
                            key={idx} 
                            onClick={() => {
                              const targetTerm = data.find(t => t.term.toLowerCase() === rel.toLowerCase());
                              if (targetTerm) setSelectedTerm(targetTerm);
                            }}
                            className="px-4 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm font-medium cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
                          >
                            {rel}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-slate-400 dark:text-slate-500 max-w-sm"
              >
                <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-slate-600 dark:text-slate-300 mb-2">Select a Term</h3>
                <p>Browse the alphabet or use the search bar to find material science definitions.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile View - Overlay Definition */}
        <AnimatePresence>
          {selectedTerm && (
            <motion.div 
              className="md:hidden fixed inset-0 z-50 bg-white dark:bg-slate-900 overflow-y-auto"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            >
              <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center z-10">
                <button 
                  onClick={() => setSelectedTerm(null)}
                  className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Back
                </button>
                <div className="font-serif font-bold text-slate-800 dark:text-white truncate max-w-[200px] capitalize">
                  {selectedTerm.term}
                </div>
              </div>

              <div className="p-6 pb-20">
                <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white capitalize mb-8">
                  {selectedTerm.term}
                </h2>
                
                <div className="space-y-8">
                  <div>
                    <h4 className="text-sm font-semibold tracking-wider text-brand-600 dark:text-brand-400 uppercase mb-3">Definition</h4>
                    <div className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700">
                      {selectedTerm.definition}
                      
                      <button 
                        onClick={() => handleCopy(selectedTerm.definition)}
                        className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-brand-600 border border-slate-200 dark:border-slate-600"
                      >
                        {copied ? <CheckIcon /> : <CopyIcon />}
                        {copied ? 'Copied!' : 'Copy Definition'}
                      </button>
                    </div>
                  </div>

                  {selectedTerm.applications && selectedTerm.applications.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold tracking-wider text-brand-600 dark:text-brand-400 uppercase mb-3">Applications</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTerm.applications.map((app, idx) => (
                          <span key={idx} className="px-4 py-1.5 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full text-sm font-medium border border-brand-100 dark:border-brand-800">
                            {app}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTerm.related_terms && selectedTerm.related_terms.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold tracking-wider text-brand-600 dark:text-brand-400 uppercase mb-3">Related Terms</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTerm.related_terms.map((rel, idx) => (
                          <span 
                            key={idx} 
                            onClick={() => {
                              const targetTerm = data.find(t => t.term.toLowerCase() === rel.toLowerCase());
                              if (targetTerm) {
                                window.scrollTo(0, 0);
                                setSelectedTerm(targetTerm);
                              }
                            }}
                            className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm font-medium border border-slate-200 dark:border-slate-700"
                          >
                            {rel}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
