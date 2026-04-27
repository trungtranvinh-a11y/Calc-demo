/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useEffect, ReactNode } from "react";
import { 
  evaluate, 
  parse, 
} from "mathjs";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { 
  Calculator, 
  TrendingUp, 
  Delete, 
  RotateCcw, 
  Menu,
  History,
  Settings2,
  Trash2,
  ChevronRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

interface Theme {
  id: string;
  name: string;
  primary: string;
  dark: string;
}

const THEMES: Theme[] = [
  { id: "azure", name: "Azure", primary: "#4b7bec", dark: "#3867d6" },
  { id: "emerald", name: "Emerald", primary: "#26de81", dark: "#20bf6b" },
  { id: "rose", name: "Rose", primary: "#ff4757", dark: "#e84118" },
  { id: "amber", name: "Amber", primary: "#f7b731", dark: "#fa8231" },
];

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

interface ThreeDButtonProps {
  label: string | ReactNode;
  onClick: () => void;
  className?: string;
  variant?: "default" | "accent" | "operator";
}

const ThreeDButton: React.FC<ThreeDButtonProps> = ({ label, onClick, className, variant = "default" }) => {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "btn-3d w-full h-12 rounded-xl text-sm transition-all flex items-center justify-center",
        variant === "accent" && "btn-3d-accent",
        variant === "operator" && "btn-3d-operator",
        className
      )}
    >
      {label}
    </button>
  );
};

export default function App() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<any[]>([]);
  const [showGraph, setShowGraph] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showScientific, setShowScientific] = useState(false);
  const [activeTheme, setActiveTheme] = useState<Theme>(THEMES[0]);
  const [showSettings, setShowSettings] = useState(false);

  // Apply theme to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--color-accent", activeTheme.primary);
    root.style.setProperty("--color-accent-dark", activeTheme.dark);
  }, [activeTheme]);

  // Key configurations
  const mainKeys = [
    { label: "AC", action: "clear", variant: "operator" as const, className: "text-red-500 font-bold" },
    { label: "(", action: "append", value: "(", variant: "operator" as const },
    { label: ")", action: "append", value: ")", variant: "operator" as const },
    { label: "÷", action: "append", value: "/", variant: "operator" as const },
    
    { label: "7", action: "append", value: "7" },
    { label: "8", action: "append", value: "8" },
    { label: "9", action: "append", value: "9" },
    { label: "×", action: "append", value: "*", variant: "operator" as const },
    
    { label: "4", action: "append", value: "4" },
    { label: "5", action: "append", value: "5" },
    { label: "6", action: "append", value: "6" },
    { label: "−", action: "append", value: "-", variant: "operator" as const },
    
    { label: "1", action: "append", value: "1" },
    { label: "2", action: "append", value: "2" },
    { label: "3", action: "append", value: "3" },
    { label: "+", action: "append", value: "+", variant: "operator" as const },
    
    { label: "0", action: "append", value: "0" },
    { label: ".", action: "append", value: "." },
    { label: "x", action: "append", value: "x", variant: "operator" as const },
    { label: "=", action: "calculate", variant: "accent" as const },
  ];

  const scientificKeys = [
    { label: "sin", value: "sin(" },
    { label: "cos", value: "cos(" },
    { label: "tan", value: "tan(" },
    { label: "log", value: "log10(" },
    { label: "ln", value: "log(" },
    { label: "^", value: "^" },
    { label: "√", value: "sqrt(" },
    { label: "π", value: "pi" },
    { label: "e", value: "e" },
    { label: "abs", value: "abs(" },
  ];

  const handleKeyClick = (key: any) => {
    setError(null);
    if (key.action === "append" || !key.action) {
      setExpression(prev => prev + (key.value || key.label));
    } else if (key.action === "clear") {
      setExpression("");
      setResult(null);
      setGraphData([]);
    } else if (key.action === "calculate") {
      performCalculation();
    }
  };

  const performCalculation = useCallback(() => {
    try {
      if (!expression.trim()) return;

      if (expression.includes("x")) {
        generateGraph(expression);
        setResult("Đồ thị đã sẵn sàng");
        setShowGraph(true);
      } else {
        const resValue = evaluate(expression);
        const resString = String(resValue);
        setResult(resString);
        
        // Add to history
        setHistory(prev => [{
          id: Math.random().toString(36).substr(2, 9),
          expression,
          result: resString,
          timestamp: Date.now()
        }, ...prev].slice(0, 50));
      }
    } catch (err: any) {
      setError("Lỗi cú pháp");
    }
  }, [expression]);

  const generateGraph = (expr: string) => {
    try {
      const node = parse(expr);
      const simplified = node.compile();
      const points = [];
      
      for (let x = -10; x <= 10; x += 0.5) {
        try {
          const y = simplified.evaluate({ x });
          if (typeof y === "number" && isFinite(y)) {
            points.push({ x: Number(x.toFixed(1)), y: Number(y.toFixed(2)) });
          }
        } catch (e) {}
      }
      setGraphData(points);
    } catch (err) {
      setError("Không thể vẽ đồ thị");
    }
  };

  const clearHistory = () => setHistory([]);
  
  const recallHistory = (item: HistoryItem) => {
    setExpression(item.expression);
    setResult(item.result);
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center gap-8 font-sans bg-[#E0E5EC]">
      <main className="w-full max-w-[1100px] bg-[#E0E5EC] rounded-[40px] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] p-6 md:p-10 flex flex-col lg:flex-row gap-10 relative overflow-hidden">
        
        {/* Settings Overlay */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              className="absolute inset-0 z-50 bg-black/5 flex items-center justify-center p-6"
              onClick={() => setShowSettings(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-sm neumorphic-flat p-8 flex flex-col gap-6"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg">Cài Đặt Chủ Đề</h3>
                  <button onClick={() => setShowSettings(false)}><Menu size={20} /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => setActiveTheme(theme)}
                      className={cn(
                        "p-4 rounded-2xl flex flex-col gap-2 transition-all border-2",
                        activeTheme.id === theme.id ? "border-[var(--color-accent)] bg-white/40" : "border-transparent bg-white/20"
                      )}
                    >
                      <div className="w-full h-8 rounded-lg shadow-sm" style={{ backgroundColor: theme.primary }} />
                      <span className="text-xs font-bold">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="absolute inset-y-0 left-0 z-40 w-full md:w-80 bg-[#E0E5EC] shadow-[10px_0_30px_rgba(0,0,0,0.05)] p-8 flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-display font-bold">
                  <History size={18} className="text-[var(--color-accent)]" />
                  Lịch Sử
                </div>
                <button onClick={() => setShowHistory(false)}><ChevronRight size={20} /></button>
              </div>

              <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                {history.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm italic">Trống</div>
                ) : (
                  history.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => recallHistory(item)}
                      className="w-full text-right p-4 neumorphic-flat shadow-sm hover:shadow-md transition-all active:scale-[0.98] group relative overflow-hidden"
                    >
                      <div className="text-xs text-gray-400 mb-1">{item.expression}</div>
                      <div className="text-lg font-display font-bold text-[var(--color-accent)]">={item.result}</div>
                    </button>
                  ))
                )}
              </div>

              <button 
                onClick={clearHistory}
                className="w-full p-3 neumorphic-flat flex items-center justify-center gap-2 text-red-500 font-bold text-xs hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} /> Xóa Tất Cả
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left: Calculator Control */}
        <div className="w-full lg:w-[420px] flex flex-col space-y-6 text-[#31344b]">
          <div className="flex items-center justify-between px-2">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Calculator size={14} className="text-[var(--color-accent)]" />
              Smart Calc Pro v2.1
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowHistory(true)}
                className="p-2 rounded-lg neumorphic-flat shadow-sm text-gray-500 hover:text-[var(--color-accent)]"
              >
                <History size={16} />
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg neumorphic-flat shadow-sm text-gray-500 hover:text-[var(--color-accent)]"
              >
                <Settings2 size={16} />
              </button>
            </div>
          </div>
          
          {/* Display */}
          <div className="neumorphic-inset h-[100px] p-6 flex flex-col justify-center items-end relative group">
            <AnimatePresence mode="wait">
              <motion.div 
                key={expression}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-400 font-mono absolute top-2 right-6"
              >
                {expression || " "}
              </motion.div>
            </AnimatePresence>
            
            <AnimatePresence mode="wait">
              {error ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 font-display font-semibold text-lg"
                >
                  {error}
                </motion.div>
              ) : (
                <motion.div 
                  key={result}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-3xl font-display font-semibold"
                >
                  {result || "0"}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Scientific Toggle */}
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-bold text-gray-400 tracking-tighter">SCIENTIFIC MODE</span>
            <button 
              onClick={() => setShowScientific(!showScientific)}
              className={cn(
                "w-10 h-5 rounded-full transition-all relative border border-white/40 shadow-inner",
                showScientific ? "bg-[var(--color-accent)] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]" : "bg-gray-200"
              )}
            >
              <motion.div 
                animate={{ x: showScientific ? 20 : 2 }}
                className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>

          <AnimatePresence>
            {showScientific && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-5 gap-3 mb-6 bg-white/20 p-4 rounded-2xl">
                  {scientificKeys.map((key, i) => (
                    <ThreeDButton 
                      key={i}
                      label={key.label}
                      variant="default"
                      onClick={() => handleKeyClick(key)}
                      className="h-10 text-[10px] !rounded-lg"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Keypad */}
          <div className="grid grid-cols-4 gap-4 flex-grow">
            {mainKeys.map((key, i) => (
              <ThreeDButton 
                key={i}
                label={key.label}
                variant={key.variant}
                onClick={() => handleKeyClick(key)}
                className={key.className}
              />
            ))}
          </div>

          <div className="p-4 rounded-xl bg-white/30 text-[10px] text-gray-500 leading-relaxed shadow-inner border border-white/40">
            <strong>TIP:</strong> Click <History size={10} className="inline mx-0.5" /> to reuse calculations or <Settings2 size={10} className="inline mx-0.5" /> to change accent colors.
          </div>
        </div>

        {/* Right: Graphing Visualizer */}
        <div className="flex-grow flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-[#31344b] uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={16} className="text-[var(--color-accent)]" /> 
              Đồ Thị Tương Tác
            </h2>
            <div className="flex gap-3">
              <div className="px-3 py-1 neumorphic-flat text-[10px] font-bold text-gray-400 shadow-sm border border-white/50">GRID: ON</div>
              <div className="px-3 py-1 rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-white shadow-lg transition-colors">ZOOM: 1.0x</div>
            </div>
          </div>
          
          <div className="flex-grow relative bg-[#f8f9fa] rounded-3xl overflow-hidden shadow-[inset_4px_4px_10px_rgba(0,0,0,0.05)] p-6">
            {graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="x" 
                    stroke="#a0a0a0" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={true}
                    ticks={[-10, -5, 0, 5, 10]}
                  />
                  <YAxis 
                    stroke="#a0a0a0" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={true} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                      backgroundColor: '#fff'
                    }} 
                  />
                  <ReferenceLine x={0} stroke="#a0a0a0" strokeWidth={2} />
                  <ReferenceLine y={0} stroke="#a0a0a0" strokeWidth={2} />
                  <Line 
                    type="monotone" 
                    dataKey="y" 
                    stroke="var(--color-accent)" 
                    strokeWidth={4} 
                    dot={false}
                    animationDuration={1000}
                    strokeLinecap="round"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-8 grayscale opacity-20">
                <TrendingUp size={64} className="text-[var(--color-accent)]" />
                <p className="font-medium text-gray-500">Nhập biểu thức có chứa biến x để xem đồ thị.</p>
              </div>
            )}
            
            <div className="absolute bottom-4 left-4 text-[10px] text-gray-400 font-mono">
              Range: [-10, 10] | Step: 0.5
            </div>
          </div>
          
          {/* Bottom Actions */}
          <div className="mt-8 grid grid-cols-3 gap-6">
            <button 
               onClick={() => { setGraphData([]); setShowGraph(false); }}
               className="btn-3d h-12 rounded-xl text-xs flex items-center justify-center gap-2 group"
            >
              <Trash2 size={14} className="group-hover:text-red-500 transition-colors" /> Reset Vùng Vẽ
            </button>
            <button 
               onClick={() => { setExpression(""); setResult(null); setGraphData([]); }}
               className="btn-3d h-12 rounded-xl text-xs flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} /> Clear All
            </button>
            <button className="btn-3d h-12 rounded-xl text-xs flex items-center justify-center gap-2">
              <Menu size={14} /> Advanced
            </button>
          </div>
        </div>
      </main>

      <footer className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] py-4">
        Neumorphic Design System • Version 2.1
      </footer>
    </div>
  );
}
