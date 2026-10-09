/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Minus,
  X,
  Divide,
  ArrowLeftRight,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  CornerDownLeft,
  Delete,
  Sparkles,
  ArrowUpRight,
  AlertCircle,
  Search
} from 'lucide-react';

type Operation = 'plus' | 'minus' | 'multiply' | 'divide';

interface HistoryEntry {
  id: string;
  numA: number;
  numB: number;
  operation: Operation;
  result: number | null;
  error?: string;
  timestamp: string;
  note?: string;
}

const OPERATION_META: Record<
  Operation,
  {
    label: string;
    symbol: string;
    verb: string;
    shortLabel: string;
  }
> = {
  plus: {
    label: 'Plus',
    symbol: '+',
    verb: 'Addition',
    shortLabel: 'A + B',
  },
  minus: {
    label: 'Minus',
    symbol: '−',
    verb: 'Subtraction',
    shortLabel: 'A − B',
  },
  multiply: {
    label: 'Multiply',
    symbol: '×',
    verb: 'Multiplication',
    shortLabel: 'A × B',
  },
  divide: {
    label: 'Divide',
    symbol: '÷',
    verb: 'Division',
    shortLabel: 'A ÷ B',
  },
};

const INITIAL_HISTORY: HistoryEntry[] = [
  {
    id: 'init-1',
    numA: 1250,
    numB: 450,
    operation: 'plus',
    result: 1700,
    timestamp: '10:14 AM',
    note: 'Combined total',
  },
  {
    id: 'init-2',
    numA: 840,
    numB: 12,
    operation: 'divide',
    result: 70,
    timestamp: '10:12 AM',
    note: 'Unit split',
  },
  {
    id: 'init-3',
    numA: 48.5,
    numB: 16,
    operation: 'multiply',
    result: 776,
    timestamp: '10:08 AM',
    note: 'Batch quantity',
  },
  {
    id: 'init-4',
    numA: 920,
    numB: 315.5,
    operation: 'minus',
    result: 604.5,
    timestamp: '10:02 AM',
    note: 'Net difference',
  },
];

function formatNumber(value: number | null | undefined, precision: number = 6): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (!Number.isFinite(value)) return 'Undefined';

  // Avoid floating point noise like 0.30000000000000004
  const rounded = Number(Math.round(Number(value + 'e' + precision)) + 'e-' + precision);
  return rounded.toLocaleString('en-US', {
    maximumFractionDigits: precision,
  });
}

function computeOperation(a: number, b: number, op: Operation): { result: number | null; error?: string } {
  if (Number.isNaN(a) || Number.isNaN(b)) {
    return { result: null, error: 'Enter valid numbers for both First Number and Second Number.' };
  }
  switch (op) {
    case 'plus':
      return { result: a + b };
    case 'minus':
      return { result: a - b };
    case 'multiply':
      return { result: a * b };
    case 'divide':
      if (b === 0) {
        return { result: null, error: 'Cannot divide by zero (Second Number is 0).' };
      }
      return { result: a / b };
  }
}

export default function App() {
  const [inputA, setInputA] = useState<string>('144');
  const [inputB, setInputB] = useState<string>('12');
  const [operation, setOperation] = useState<Operation>('plus');
  const [activeField, setActiveField] = useState<'A' | 'B'>('A');
  const [precision, setPrecision] = useState<number>(4);
  const [history, setHistory] = useState<HistoryEntry[]>(INITIAL_HISTORY);
  const [historyFilter, setHistoryFilter] = useState<'all' | Operation>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const inputARef = useRef<HTMLInputElement>(null);
  const inputBRef = useRef<HTMLInputElement>(null);

  const parsedA = useMemo(() => {
    if (inputA.trim() === '' || inputA === '-') return 0;
    return Number(inputA);
  }, [inputA]);

  const parsedB = useMemo(() => {
    if (inputB.trim() === '' || inputB === '-') return 0;
    return Number(inputB);
  }, [inputB]);

  const currentEvaluation = useMemo(
    () => computeOperation(parsedA, parsedB, operation),
    [parsedA, parsedB, operation]
  );

  // All 4 operations preview for the current two numbers
  const allFourResults = useMemo(() => {
    return (['plus', 'minus', 'multiply', 'divide'] as Operation[]).map((op) => ({
      op,
      meta: OPERATION_META[op],
      ...computeOperation(parsedA, parsedB, op),
    }));
  }, [parsedA, parsedB]);

  // Division integer remainder details when applicable
  const divisionBreakdown = useMemo(() => {
    if (parsedB === 0 || Number.isNaN(parsedA) || Number.isNaN(parsedB)) return null;
    const quotient = Math.trunc(parsedA / parsedB);
    const remainder = parsedA % parsedB;
    return { quotient, remainder };
  }, [parsedA, parsedB]);

  const handleRecordToHistory = (customOp?: Operation) => {
    const targetOp = customOp ?? operation;
    if (customOp) {
      setOperation(customOp);
    }
    const evaluation = computeOperation(parsedA, parsedB, targetOp);
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newEntry: HistoryEntry = {
      id: `calc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      numA: parsedA,
      numB: parsedB,
      operation: targetOp,
      result: evaluation.result,
      error: evaluation.error,
      timestamp: timeString,
    };

    setHistory((prev) => [newEntry, ...prev.slice(0, 49)]);
  };

  const handleResetWorkspace = () => {
    setInputA('0');
    setInputB('0');
    setOperation('plus');
    setActiveField('A');
  };

  const handleSwapNumbers = () => {
    setInputA(inputB);
    setInputB(inputA);
  };

  const handleUseResultAsA = () => {
    if (currentEvaluation.result !== null) {
      const cleanResult = Number(
        Math.round(Number(currentEvaluation.result + 'e' + precision)) + 'e-' + precision
      );
      setInputA(String(cleanResult));
      setActiveField('B');
    }
  };

  const handleKeypadDigit = (digit: string) => {
    const setter = activeField === 'A' ? setInputA : setInputB;
    setter((prev) => {
      if (digit === '.') {
        if (prev.includes('.')) return prev;
        return prev === '' || prev === '-' ? `${prev || '0'}.` : `${prev}.`;
      }
      if (prev === '0') return digit;
      if (prev === '-0') return `-${digit}`;
      if (prev.length >= 15) return prev;
      return `${prev}${digit}`;
    });
  };

  const handleToggleSign = () => {
    const setter = activeField === 'A' ? setInputA : setInputB;
    setter((prev) => {
      if (prev.startsWith('-')) return prev.slice(1);
      if (prev === '0' || prev === '') return '-';
      return `-${prev}`;
    });
  };

  const handleBackspace = () => {
    const setter = activeField === 'A' ? setInputA : setInputB;
    setter((prev) => {
      if (prev.length <= 1 || (prev.length === 2 && prev.startsWith('-'))) {
        return '0';
      }
      return prev.slice(0, -1);
    });
  };

  const handleClearActiveField = () => {
    const setter = activeField === 'A' ? setInputA : setInputB;
    setter('0');
  };

  const handleSelectOperationFromKeypad = (op: Operation) => {
    setOperation(op);
    if (activeField === 'A') {
      setActiveField('B');
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 1600);
  };

  // Keyboard support when not focused directly inside a text input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleRecordToHistory();
        }
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeypadDigit(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        handleKeypadDigit('.');
      } else if (e.key === '+') {
        e.preventDefault();
        handleSelectOperationFromKeypad('plus');
      } else if (e.key === '-') {
        e.preventDefault();
        handleSelectOperationFromKeypad('minus');
      } else if (e.key === '*') {
        e.preventDefault();
        handleSelectOperationFromKeypad('multiply');
      } else if (e.key === '/') {
        e.preventDefault();
        handleSelectOperationFromKeypad('divide');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleRecordToHistory();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleResetWorkspace();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setActiveField((prev) => (prev === 'A' ? 'B' : 'A'));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesOp = historyFilter === 'all' || item.operation === historyFilter;
      if (!matchesOp) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const expr = `${item.numA} ${OPERATION_META[item.operation].symbol} ${item.numB} = ${item.result ?? 'error'}`.toLowerCase();
      const verb = OPERATION_META[item.operation].verb.toLowerCase();
      return expr.includes(q) || verb.includes(q) || (item.note?.toLowerCase().includes(q) ?? false);
    });
  }, [history, historyFilter, searchQuery]);

  const sanitizeNumericInput = (raw: string): string => {
    // Allow optional leading minus, digits, and a single decimal point
    const cleaned = raw.replace(/[^0-9.-]/g, '');
    const parts = cleaned.split('.');
    let formatted = parts[0];
    if (parts.length > 1) {
      formatted += '.' + parts.slice(1).join('');
    }
    // Only allow minus at the start
    const isNegative = formatted.startsWith('-');
    formatted = formatted.replace(/-/g, '');
    return isNegative ? `-${formatted}` : formatted;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9FB] text-[#2A121D] selection:bg-pink-200 selection:text-pink-950">
      {/* Top Bar Contract: 3 Zones separated by gap-8 */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-pink-200/80 px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            className="text-xl font-bold tracking-tight text-[#2A121D] hover:text-pink-600 transition-colors whitespace-nowrap shrink-0"
          >
            calculator
          </a>

          {/* Zone 2: 4 concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#7A5266]">
            <a
              href="#dual-input"
              className="hover:text-pink-600 transition-colors whitespace-nowrap shrink-0"
            >
              Two-Number Input
            </a>
            <a
              href="#keypad-section"
              className="hover:text-pink-600 transition-colors whitespace-nowrap shrink-0"
            >
              Tactile Keypad
            </a>
            <a
              href="#all-operations"
              className="hover:text-pink-600 transition-colors whitespace-nowrap shrink-0"
            >
              Four-Operation Matrix
            </a>
            <a
              href="#history-tape"
              className="hover:text-pink-600 transition-colors whitespace-nowrap shrink-0"
            >
              Calculation Tape
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleResetWorkspace}
              className="px-4 py-2 text-xs font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 active:scale-[0.99] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Reset Calculator
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main id="top" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Intro Header & Precision Control Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-8 border-b border-pink-200/70">
          <div>
            <p className="text-xs font-semibold text-pink-600 mb-1">
              Two-Number Arithmetic Instrument · Plus · Minus · Multiply · Divide
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2A121D]">
              White &amp; Pink Two-Number Calculator
            </h1>
          </div>

          {/* Interactive Precision & Preset Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-pink-50/90 border border-pink-200/80 rounded-lg">
              <span className="px-2.5 text-xs font-medium text-[#7A5266] whitespace-nowrap shrink-0">
                Decimals
              </span>
              {[2, 4, 6].map((dec) => (
                <button
                  key={dec}
                  type="button"
                  onClick={() => setPrecision(dec)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer font-mono-tabular ${
                    precision === dec
                      ? 'bg-white text-pink-700 shadow-xs border border-pink-200/60'
                      : 'text-[#7A5266] hover:text-[#2A121D]'
                  }`}
                >
                  {dec}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Primary 12-Column Desktop Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Two-Number Calculator & Tactile Keypad */}
          <div className="lg:col-span-7 space-y-8">
            {/* Primary Calculator Surface */}
            <section
              id="dual-input"
              aria-label="Two-number calculator"
              className="bg-white border border-pink-200 rounded-2xl p-6 sm:p-8 shadow-xs"
            >
              {/* Live Result Display Screen */}
              <div className="bg-[#FFF5F8] border border-pink-200/90 rounded-xl p-5 sm:p-6 mb-6">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#7A5266]">
                    <span>{OPERATION_META[operation].verb}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">
                      {formatNumber(parsedA, precision)} {OPERATION_META[operation].symbol}{' '}
                      {formatNumber(parsedB, precision)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentEvaluation.result !== null && (
                      <button
                        type="button"
                        onClick={handleUseResultAsA}
                        title="Use this result as First Number (A)"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-pink-700 bg-white hover:bg-pink-100/70 border border-pink-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>Use as Number 1</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {currentEvaluation.result !== null && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            formatNumber(currentEvaluation.result, precision),
                            'main-result'
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-pink-700 bg-white hover:bg-pink-100/70 border border-pink-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {copiedId === 'main-result' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-pink-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Numeric Result or Division-by-Zero Alert */}
                {currentEvaluation.error ? (
                  <div className="flex items-center gap-3 py-2 text-rose-700">
                    <AlertCircle className="w-6 h-6 shrink-0 text-pink-600" />
                    <span className="text-base sm:text-lg font-semibold">
                      {currentEvaluation.error}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline justify-between gap-4 overflow-x-auto py-1">
                    <span className="text-sm font-medium text-pink-600 shrink-0">Result =</span>
                    <output
                      aria-live="polite"
                      className="text-3xl sm:text-5xl font-bold tracking-tight text-[#2A121D] font-mono-tabular text-right break-all"
                    >
                      {formatNumber(currentEvaluation.result, precision)}
                    </output>
                  </div>
                )}

                {/* Secondary Helpful Arithmetic Details */}
                <div className="mt-3 pt-3 border-t border-pink-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-[#7A5266]">
                  <div className="flex items-center gap-2 font-mono-tabular">
                    <span>A = {formatNumber(parsedA, precision)}</span>
                    <span aria-hidden="true">·</span>
                    <span>B = {formatNumber(parsedB, precision)}</span>
                  </div>
                  {operation === 'divide' && divisionBreakdown && (
                    <div className="font-mono-tabular text-pink-700 font-medium">
                      Integer Quotient: {divisionBreakdown.quotient} · Remainder:{' '}
                      {formatNumber(divisionBreakdown.remainder, precision)}
                    </div>
                  )}
                </div>
              </div>

              {/* Two Number Inputs: First Number (A) and Second Number (B) */}
              <div className="grid grid-cols-1 sm:grid-cols-11 gap-4 items-center mb-6">
                {/* First Number (A) */}
                <div className="sm:col-span-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="number-a-input"
                      className="text-xs font-semibold text-[#2A121D]"
                    >
                      First Number (A)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveField('A');
                        inputARef.current?.focus();
                      }}
                      className={`text-xs font-medium cursor-pointer ${
                        activeField === 'A' ? 'text-pink-600 underline' : 'text-[#7A5266]'
                      }`}
                    >
                      {activeField === 'A' ? 'Active on keypad' : 'Select for keypad'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      ref={inputARef}
                      id="number-a-input"
                      type="text"
                      inputMode="decimal"
                      value={inputA}
                      onFocus={() => setActiveField('A')}
                      onChange={(e) => setInputA(sanitizeNumericInput(e.target.value))}
                      placeholder="0"
                      className={`w-full px-4 py-3 text-lg font-semibold font-mono-tabular rounded-xl bg-white transition-all focus:outline-none ${
                        activeField === 'A'
                          ? 'border-2 border-pink-600 ring-4 ring-pink-100 text-[#2A121D]'
                          : 'border border-pink-200 hover:border-pink-300 text-[#2A121D]'
                      }`}
                    />
                    {inputA !== '0' && inputA !== '' && (
                      <button
                        type="button"
                        onClick={() => setInputA('0')}
                        aria-label="Clear First Number"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#7A5266] hover:text-pink-600 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Center Swap Button */}
                <div className="sm:col-span-1 flex justify-center sm:pt-5">
                  <button
                    type="button"
                    onClick={handleSwapNumbers}
                    title="Swap First Number and Second Number"
                    aria-label="Swap First Number and Second Number"
                    className="p-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 transition-colors cursor-pointer"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Second Number (B) */}
                <div className="sm:col-span-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="number-b-input"
                      className="text-xs font-semibold text-[#2A121D]"
                    >
                      Second Number (B)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveField('B');
                        inputBRef.current?.focus();
                      }}
                      className={`text-xs font-medium cursor-pointer ${
                        activeField === 'B' ? 'text-pink-600 underline' : 'text-[#7A5266]'
                      }`}
                    >
                      {activeField === 'B' ? 'Active on keypad' : 'Select for keypad'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      ref={inputBRef}
                      id="number-b-input"
                      type="text"
                      inputMode="decimal"
                      value={inputB}
                      onFocus={() => setActiveField('B')}
                      onChange={(e) => setInputB(sanitizeNumericInput(e.target.value))}
                      placeholder="0"
                      className={`w-full px-4 py-3 text-lg font-semibold font-mono-tabular rounded-xl bg-white transition-all focus:outline-none ${
                        activeField === 'B'
                          ? 'border-2 border-pink-600 ring-4 ring-pink-100 text-[#2A121D]'
                          : 'border border-pink-200 hover:border-pink-300 text-[#2A121D]'
                      }`}
                    />
                    {inputB !== '0' && inputB !== '' && (
                      <button
                        type="button"
                        onClick={() => setInputB('0')}
                        aria-label="Clear Second Number"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#7A5266] hover:text-pink-600 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Four Operation Selector Buttons: Plus, Minus, Multiply, Divide */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#2A121D]">
                    Select Operation (Plus, Minus, Multiply, Divide)
                  </span>
                  <span className="text-xs text-[#7A5266]">
                    Click an operation to calculate immediately
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(
                    [
                      { op: 'plus' as Operation, icon: Plus },
                      { op: 'minus' as Operation, icon: Minus },
                      { op: 'multiply' as Operation, icon: X },
                      { op: 'divide' as Operation, icon: Divide },
                    ] as const
                  ).map(({ op, icon: Icon }) => {
                    const isSelected = operation === op;
                    const meta = OPERATION_META[op];
                    return (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setOperation(op)}
                        className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                          isSelected
                            ? 'bg-pink-600 text-white shadow-xs ring-2 ring-pink-600 ring-offset-2'
                            : 'bg-pink-50/70 hover:bg-pink-100/80 text-[#2A121D] border border-pink-200'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-pink-600'}`} />
                        <span>{meta.label}</span>
                        <span
                          className={`font-mono-tabular text-xs ${
                            isSelected ? 'text-pink-100' : 'text-[#7A5266]'
                          }`}
                        >
                          ({meta.symbol})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tactile White & Pink Keypad Section */}
              <div id="keypad-section" className="pt-6 border-t border-pink-200/70">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#2A121D]">
                      Tactile Number Keypad
                    </span>
                    <span aria-hidden="true" className="text-xs text-[#7A5266]">
                      ·
                    </span>
                    <span className="text-xs text-pink-700 font-medium">
                      Typing into {activeField === 'A' ? 'First Number (A)' : 'Second Number (B)'}
                    </span>
                  </div>

                  {/* Quick Field Switcher */}
                  <div className="flex items-center gap-1 p-1 bg-pink-50 border border-pink-200/80 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setActiveField('A')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        activeField === 'A'
                          ? 'bg-pink-600 text-white'
                          : 'text-[#7A5266] hover:text-[#2A121D]'
                      }`}
                    >
                      Edit Number A
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveField('B')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        activeField === 'B'
                          ? 'bg-pink-600 text-white'
                          : 'text-[#7A5266] hover:text-[#2A121D]'
                      }`}
                    >
                      Edit Number B
                    </button>
                  </div>
                </div>

                {/* 4x5 Calculator Keypad Grid */}
                <div className="grid grid-cols-4 gap-2.5">
                  {/* Row 1 */}
                  <button
                    type="button"
                    onClick={handleClearActiveField}
                    className="py-3 px-4 rounded-xl text-sm font-semibold bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    CE ({activeField})
                  </button>
                  <button
                    type="button"
                    onClick={handleResetWorkspace}
                    className="py-3 px-4 rounded-xl text-sm font-semibold bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    AC
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    aria-label="Backspace"
                    className="py-3 px-4 rounded-xl text-sm font-semibold bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectOperationFromKeypad('divide')}
                    className={`py-3 px-4 rounded-xl text-base font-bold font-mono-tabular transition-colors cursor-pointer ${
                      operation === 'divide'
                        ? 'bg-pink-600 text-white'
                        : 'bg-pink-100/90 hover:bg-pink-200/80 text-pink-800 border border-pink-200'
                    }`}
                  >
                    ÷
                  </button>

                  {/* Row 2 */}
                  {['7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeypadDigit(digit)}
                      className="py-3.5 px-4 rounded-xl text-lg font-semibold font-mono-tabular bg-white hover:bg-pink-50/70 active:bg-pink-100/60 text-[#2A121D] border border-pink-200/90 transition-colors cursor-pointer"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSelectOperationFromKeypad('multiply')}
                    className={`py-3.5 px-4 rounded-xl text-base font-bold font-mono-tabular transition-colors cursor-pointer ${
                      operation === 'multiply'
                        ? 'bg-pink-600 text-white'
                        : 'bg-pink-100/90 hover:bg-pink-200/80 text-pink-800 border border-pink-200'
                    }`}
                  >
                    ×
                  </button>

                  {/* Row 3 */}
                  {['4', '5', '6'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeypadDigit(digit)}
                      className="py-3.5 px-4 rounded-xl text-lg font-semibold font-mono-tabular bg-white hover:bg-pink-50/70 active:bg-pink-100/60 text-[#2A121D] border border-pink-200/90 transition-colors cursor-pointer"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSelectOperationFromKeypad('minus')}
                    className={`py-3.5 px-4 rounded-xl text-base font-bold font-mono-tabular transition-colors cursor-pointer ${
                      operation === 'minus'
                        ? 'bg-pink-600 text-white'
                        : 'bg-pink-100/90 hover:bg-pink-200/80 text-pink-800 border border-pink-200'
                    }`}
                  >
                    −
                  </button>

                  {/* Row 4 */}
                  {['1', '2', '3'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeypadDigit(digit)}
                      className="py-3.5 px-4 rounded-xl text-lg font-semibold font-mono-tabular bg-white hover:bg-pink-50/70 active:bg-pink-100/60 text-[#2A121D] border border-pink-200/90 transition-colors cursor-pointer"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSelectOperationFromKeypad('plus')}
                    className={`py-3.5 px-4 rounded-xl text-base font-bold font-mono-tabular transition-colors cursor-pointer ${
                      operation === 'plus'
                        ? 'bg-pink-600 text-white'
                        : 'bg-pink-100/90 hover:bg-pink-200/80 text-pink-800 border border-pink-200'
                    }`}
                  >
                    +
                  </button>

                  {/* Row 5 */}
                  <button
                    type="button"
                    onClick={handleToggleSign}
                    className="py-3.5 px-4 rounded-xl text-sm font-semibold font-mono-tabular bg-white hover:bg-pink-50/70 text-[#2A121D] border border-pink-200/90 transition-colors cursor-pointer"
                  >
                    +/−
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadDigit('0')}
                    className="py-3.5 px-4 rounded-xl text-lg font-semibold font-mono-tabular bg-white hover:bg-pink-50/70 active:bg-pink-100/60 text-[#2A121D] border border-pink-200/90 transition-colors cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadDigit('.')}
                    className="py-3.5 px-4 rounded-xl text-lg font-bold font-mono-tabular bg-white hover:bg-pink-50/70 text-[#2A121D] border border-pink-200/90 transition-colors cursor-pointer"
                  >
                    .
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRecordToHistory()}
                    className="py-3.5 px-4 rounded-xl text-sm font-bold bg-pink-600 hover:bg-pink-700 active:scale-[0.99] text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>= Save</span>
                    <CornerDownLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </section>

            {/* Simultaneous Four-Operation Comparison Matrix */}
            <section
              id="all-operations"
              aria-label="Simultaneous Four-Operation Matrix"
              className="bg-white border border-pink-200 rounded-2xl p-6 sm:p-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-pink-200/70">
                <div>
                  <h2 className="text-lg font-bold text-[#2A121D]">
                    All Four Operations for Current Pair
                  </h2>
                  <p className="text-xs text-[#7A5266]">
                    Instant comparison of Plus, Minus, Multiply, and Divide for A ={' '}
                    <span className="font-mono-tabular font-medium text-[#2A121D]">
                      {formatNumber(parsedA, precision)}
                    </span>{' '}
                    and B ={' '}
                    <span className="font-mono-tabular font-medium text-[#2A121D]">
                      {formatNumber(parsedB, precision)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allFourResults.map(({ op, meta, result, error }) => {
                  const isActive = operation === op;
                  return (
                    <div
                      key={op}
                      onClick={() => setOperation(op)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setOperation(op);
                        }
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#FFF5F8] border-pink-500 ring-1 ring-pink-500'
                          : 'bg-white hover:bg-pink-50/40 border-pink-200/90'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-[#7A5266]">
                          <span className="font-semibold text-[#2A121D]">{meta.label}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular">{meta.shortLabel}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRecordToHistory(op);
                          }}
                          className="text-xs font-semibold text-pink-600 hover:text-pink-800 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Log to Tape
                        </button>
                      </div>

                      <div className="font-mono-tabular text-xs text-[#7A5266] mb-1">
                        {formatNumber(parsedA, precision)} {meta.symbol}{' '}
                        {formatNumber(parsedB, precision)} =
                      </div>

                      {error ? (
                        <div className="text-sm font-semibold text-rose-600">Cannot divide by 0</div>
                      ) : (
                        <div className="text-xl font-bold text-[#2A121D] font-mono-tabular break-all">
                          {formatNumber(result, precision)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Column (5 cols): Calculation Tape & Quick Number Pairs */}
          <div className="lg:col-span-5 space-y-8">
            <section
              id="history-tape"
              aria-label="Calculation History Tape"
              className="bg-white border border-pink-200 rounded-2xl p-6 sm:p-8"
            >
              <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-pink-200/70">
                <div>
                  <h2 className="text-lg font-bold text-[#2A121D]">Calculation Tape</h2>
                  <p className="text-xs text-[#7A5266]">
                    Click any saved calculation to reload its two numbers
                  </p>
                </div>

                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#7A5266] hover:text-rose-700 hover:bg-pink-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Tape</span>
                  </button>
                )}
              </div>

              {/* Interactive Filter Controls (Buttons/Tabs Allowed per Design Constitution) */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-1 p-1 bg-pink-50/90 border border-pink-200/70 rounded-lg overflow-x-auto">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'plus', label: 'Plus (+)' },
                      { id: 'minus', label: 'Minus (−)' },
                      { id: 'multiply', label: 'Multiply (×)' },
                      { id: 'divide', label: 'Divide (÷)' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setHistoryFilter(tab.id)}
                      className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        historyFilter === tab.id
                          ? 'bg-white text-pink-700 shadow-xs border border-pink-200/60'
                          : 'text-[#7A5266] hover:text-[#2A121D]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#7A5266] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter calculations by number or operation..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-[#FFF9FB] border border-pink-200 rounded-lg text-[#2A121D] placeholder:text-[#7A5266]/70 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Tape Entries List */}
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-pink-200 rounded-xl bg-[#FFF9FB]">
                  <p className="text-sm font-semibold text-[#2A121D] mb-1">
                    No calculations in tape
                  </p>
                  <p className="text-xs text-[#7A5266] mb-4">
                    Press &ldquo;= Save&rdquo; on the keypad or &ldquo;Log to Tape&rdquo; to record
                    two-number calculations here.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRecordToHistory()}
                    className="px-4 py-2 text-xs font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Log Current Calculation
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-pink-100 max-h-[460px] overflow-y-auto pr-1">
                  {filteredHistory.map((item) => {
                    const meta = OPERATION_META[item.operation];
                    return (
                      <div
                        key={item.id}
                        className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4 group"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setInputA(String(item.numA));
                            setInputB(String(item.numB));
                            setOperation(item.operation);
                          }}
                          className="text-left flex-1 min-w-0 cursor-pointer"
                        >
                          {/* Clean unboxed metadata with typographic separators (Zero-Pill Discipline) */}
                          <div className="flex items-center gap-1.5 text-xs text-[#7A5266] mb-1">
                            <span className="font-medium text-pink-700">{meta.verb}</span>
                            <span aria-hidden="true">·</span>
                            <span>{item.timestamp}</span>
                            {item.note && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="truncate">{item.note}</span>
                              </>
                            )}
                          </div>

                          <div className="font-mono-tabular text-sm font-semibold text-[#2A121D] truncate">
                            {formatNumber(item.numA, precision)} {meta.symbol}{' '}
                            {formatNumber(item.numB, precision)} ={' '}
                            <span className="text-pink-700 font-bold">
                              {item.error ? 'Error' : formatNumber(item.result, precision)}
                            </span>
                          </div>
                        </button>

                        {item.result !== null && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(formatNumber(item.result, precision), item.id)
                            }
                            aria-label="Copy calculation result"
                            className="px-2.5 py-1.5 text-xs font-medium text-[#7A5266] hover:text-pink-700 hover:bg-pink-50 rounded-md border border-transparent hover:border-pink-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {copiedId === item.id ? 'Copied' : 'Copy'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Quick Example Number Pairs & Keyboard Reference */}
            <section
              aria-label="Quick Number Pairs and Shortcuts"
              className="bg-white border border-pink-200 rounded-2xl p-6"
            >
              <h3 className="text-sm font-bold text-[#2A121D] mb-1">
                Quick Two-Number Presets
              </h3>
              <p className="text-xs text-[#7A5266] mb-4">
                Load sample number pairs to test addition, subtraction, multiplication, or division.
              </p>

              <div className="grid grid-cols-2 gap-2.5 mb-6">
                {[
                  { label: '250 + 750', a: '250', b: '750', op: 'plus' as Operation },
                  { label: '1,000 − 365', a: '1000', b: '365', op: 'minus' as Operation },
                  { label: '24 × 15', a: '24', b: '15', op: 'multiply' as Operation },
                  { label: '360 ÷ 8', a: '360', b: '8', op: 'divide' as Operation },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setInputA(preset.a);
                      setInputB(preset.b);
                      setOperation(preset.op);
                    }}
                    className="px-3 py-2.5 text-xs font-semibold font-mono-tabular text-left text-[#2A121D] bg-[#FFF9FB] hover:bg-pink-50 border border-pink-200 rounded-xl transition-colors flex items-center justify-between cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>{preset.label}</span>
                    <span className="text-pink-600">Load</span>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-pink-200/70">
                <h4 className="text-xs font-semibold text-[#2A121D] mb-2">
                  Keyboard Controls
                </h4>
                <div className="grid grid-cols-2 gap-y-1.5 text-xs text-[#7A5266]">
                  <div>
                    <span className="font-mono-tabular font-semibold text-pink-700">+ − * /</span> ·
                    Choose operation
                  </div>
                  <div>
                    <span className="font-mono-tabular font-semibold text-pink-700">Tab</span> ·
                    Switch A / B
                  </div>
                  <div>
                    <span className="font-mono-tabular font-semibold text-pink-700">Enter</span> ·
                    Save to tape
                  </div>
                  <div>
                    <span className="font-mono-tabular font-semibold text-pink-700">Esc</span> ·
                    Reset numbers
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-pink-200/70 bg-white px-6 py-4 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#7A5266]">
          <span>calculator · White &amp; Pink Two-Number Arithmetic Workspace</span>
          <span className="font-mono-tabular">Plus (+) · Minus (−) · Multiply (×) · Divide (÷)</span>
        </div>
      </footer>
    </div>
  );
}
