
import React, { useState, useEffect, useCallback } from 'react';
import { Operation, CalculationHistory, AIExplanation } from './types';
import Button from './components/Button';
import { getMathExplanation } from './services/geminiService';

const App: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<Operation>(Operation.NONE);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [explanation, setExplanation] = useState<AIExplanation | null>(null);

  const formatNumber = (num: string) => {
    if (num === 'Error') return num;
    const parts = num.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
  };

  const handleNumber = useCallback((num: string) => {
    if (display === '0' || shouldResetDisplay) {
      setDisplay(num);
      setShouldResetDisplay(false);
    } else {
      if (display.length < 12) {
        setDisplay(display + num);
      }
    }
  }, [display, shouldResetDisplay]);

  const handleOperation = useCallback((op: Operation) => {
    if (operation !== Operation.NONE) {
      calculate();
    }
    setPreviousValue(display);
    setOperation(op);
    setShouldResetDisplay(true);
  }, [display, operation]);

  const calculate = useCallback(() => {
    if (operation === Operation.NONE || previousValue === null) return;

    const prev = parseFloat(previousValue);
    const current = parseFloat(display);
    let result = 0;

    switch (operation) {
      case Operation.ADD: result = prev + current; break;
      case Operation.SUBTRACT: result = prev - current; break;
      case Operation.MULTIPLY: result = prev * current; break;
      case Operation.DIVIDE: 
        if (current === 0) {
          setDisplay('Error');
          return;
        }
        result = prev / current; 
        break;
    }

    const resultStr = result.toString().length > 12 ? result.toPrecision(8).toString() : result.toString();
    const newEntry: CalculationHistory = {
      expression: `${previousValue} ${operation} ${display}`,
      result: resultStr,
      timestamp: Date.now()
    };

    setHistory(prevHistory => [newEntry, ...prevHistory].slice(0, 10));
    setDisplay(resultStr);
    setOperation(Operation.NONE);
    setPreviousValue(null);
    setShouldResetDisplay(true);
  }, [display, operation, previousValue]);

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(Operation.NONE);
    setExplanation(null);
  };

  const handlePercentage = () => {
    const current = parseFloat(display);
    setDisplay((current / 100).toString());
  };

  const toggleSign = () => {
    setDisplay((parseFloat(display) * -1).toString());
  };

  const askAI = async () => {
    if (history.length === 0) return;
    setAiLoading(true);
    setExplanation(null);
    const last = history[0];
    const result = await getMathExplanation(last.expression);
    setExplanation(result);
    setAiLoading(false);
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/[0-9]/.test(e.key)) handleNumber(e.key);
      if (e.key === '+') handleOperation(Operation.ADD);
      if (e.key === '-') handleOperation(Operation.SUBTRACT);
      if (e.key === '*') handleOperation(Operation.MULTIPLY);
      if (e.key === '/') handleOperation(Operation.DIVIDE);
      if (e.key === 'Enter' || e.key === '=') calculate();
      if (e.key === 'Escape') clear();
      if (e.key === '.') handleNumber('.');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumber, handleOperation, calculate]);

  return (
    <div className="min-h-screen text-slate-200 flex items-center justify-center p-4 md:p-8">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: History & AI Insight */}
        <div className="hidden lg:block lg:col-span-4 space-y-6 h-full">
          <div className="glass rounded-3xl p-6 h-[300px] overflow-y-auto custom-scrollbar">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <i className="fa-solid fa-clock-rotate-left"></i> History
            </h3>
            {history.length === 0 ? (
              <div className="text-slate-500 text-sm italic">No recent calculations</div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.timestamp} className="border-b border-white/5 pb-3">
                    <div className="text-xs text-slate-500 mono">{item.expression}</div>
                    <div className="text-lg text-white mono font-medium">= {formatNumber(item.result)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-3xl p-6 min-h-[200px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-wand-magic-sparkles"></i> AI Explainer
              </h3>
              <button 
                onClick={askAI}
                disabled={aiLoading || history.length === 0}
                className="text-xs bg-indigo-600/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/30 hover:bg-indigo-600/30 disabled:opacity-50 transition-colors"
              >
                {aiLoading ? 'Thinking...' : 'Explain Last'}
              </button>
            </div>
            
            {aiLoading && (
              <div className="flex flex-col items-center justify-center h-32 space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400">Gemini can analyze this math...</p>
              </div>
            )}

            {explanation && !aiLoading && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Concept</div>
                  <div className="text-sm text-indigo-200">{explanation.concept}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Steps</div>
                  {explanation.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-3 text-sm text-slate-300">
                      <span className="text-indigo-500 font-bold">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!explanation && !aiLoading && (
              <div className="text-slate-500 text-sm text-center py-8">
                Perform a calculation and click "Explain Last" to see step-by-step logic.
              </div>
            )}
          </div>
        </div>

        {/* Center: Main Calculator */}
        <div className="lg:col-span-4 flex justify-center">
          <div className="glass rounded-[40px] p-8 w-full max-w-[400px] shadow-2xl relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-600/10 blur-[60px] rounded-full"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-rose-600/10 blur-[60px] rounded-full"></div>

            {/* Display Area */}
            <div className="mb-8 text-right overflow-hidden">
              <div className="h-6 text-indigo-400/60 mono text-sm mb-1 truncate">
                {previousValue} {operation}
              </div>
              <div className="text-5xl font-light text-white mono truncate tracking-tighter">
                {formatNumber(display)}
              </div>
            </div>

            {/* Buttons Grid */}
            <div className="calculator-grid">
              <Button label="AC" variant="action" onClick={clear} />
              <Button label="+/-" variant="action" onClick={toggleSign} />
              <Button label="%" variant="action" onClick={handlePercentage} />
              <Button label="÷" variant="operator" onClick={() => handleOperation(Operation.DIVIDE)} />

              <Button label="7" onClick={() => handleNumber('7')} />
              <Button label="8" onClick={() => handleNumber('8')} />
              <Button label="9" onClick={() => handleNumber('9')} />
              <Button label="×" variant="operator" onClick={() => handleOperation(Operation.MULTIPLY)} />

              <Button label="4" onClick={() => handleNumber('4')} />
              <Button label="5" onClick={() => handleNumber('5')} />
              <Button label="6" onClick={() => handleNumber('6')} />
              <Button label="-" variant="operator" onClick={() => handleOperation(Operation.SUBTRACT)} />

              <Button label="1" onClick={() => handleNumber('1')} />
              <Button label="2" onClick={() => handleNumber('2')} />
              <Button label="3" onClick={() => handleNumber('3')} />
              <Button label="+" variant="operator" onClick={() => handleOperation(Operation.ADD)} />

              <Button label="0" onClick={() => handleNumber('0')} className="col-span-2" />
              <Button label="." onClick={() => handleNumber('.')} />
              <Button label="=" variant="equal" onClick={calculate} />
            </div>
          </div>
        </div>

        {/* Right Side: Features/Instruction (Mobile Visible) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass rounded-3xl p-6">
            <h2 className="text-xl font-semibold text-white mb-2">AuraCalc AI</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              यह एक एडवांस कैलकुलेटर है जो न केवल आपकी गणना करता है बल्कि आपको उन्हें समझने में भी मदद करता है।
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <i className="fa-solid fa-microchip"></i>
                </div>
                Gemini 3 Flash-Powered Insights
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <i className="fa-solid fa-keyboard"></i>
                </div>
                Full Keyboard Support
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <i className="fa-solid fa-palette"></i>
                </div>
                Premium Glassmorphic UI
              </li>
            </ul>
          </div>

          <div className="lg:hidden glass rounded-3xl p-6">
             <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-wand-magic-sparkles"></i> AI Explainer
              </h3>
              <button 
                onClick={askAI}
                disabled={aiLoading || history.length === 0}
                className="text-xs bg-indigo-600/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/30 hover:bg-indigo-600/30 disabled:opacity-50 transition-colors"
              >
                {aiLoading ? 'Thinking...' : 'Explain Last'}
              </button>
            </div>
            {explanation && !aiLoading && (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Concept</div>
                  <div className="text-sm text-indigo-200">{explanation.concept}</div>
                </div>
                <div className="space-y-2">
                  {explanation.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-3 text-sm text-slate-300">
                      <span className="text-indigo-500 font-bold">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <footer className="fixed bottom-4 left-0 right-0 text-center pointer-events-none">
        <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">
          Powered by Gemini 3 Flash Preview & React 18
        </span>
      </footer>
    </div>
  );
};

export default App;
