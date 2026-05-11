/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  Search, 
  CheckCircle2, 
  Circle, 
  Leaf,
  Info,
  ChevronDown,
  X
} from 'lucide-react';

// --- Types ---

interface PlantItem {
  id: string;
  name: string;
  pointValue: number; // 1.0 or 0.5
  isChecked: boolean;
  createdAt: number;
}

// --- Data ---

const plantDictionary: Record<string, number> = {
  // --- VEGETABLES (1.0 Point) ---
  "Aubergine": 1.0, "Asparagus": 1.0, "Artichoke": 1.0, "Beetroot": 1.0, "Broccoli": 1.0,
  "Brussels Sprouts": 1.0, "Broad Beans": 1.0, "Cabbage (Green)": 1.0, "Cabbage (Red)": 1.0, "Carrot (Orange)": 1.0,
  "Carrot (Purple)": 1.0, "Cauliflower": 1.0, "Celery": 1.0, "Chard": 1.0, "Courgette": 1.0,
  "Cucumber": 1.0, "Fennel": 1.0, "Garlic": 1.0, "Green Beans (flat)": 1.0, "Green Beans (round)": 1.0, 
  "Kale": 1.0, "Leek": 1.0, "Mushroom (Button)": 1.0,
  "Mushroom (Shiitake)": 1.0, "Onion (Red)": 1.0, "Onion (White)": 1.0, "Onion (Purple)": 1.0,
   "Pak Choi": 1.0,"Parsnip": 1.0, "Peas": 1.0, 
  "Radish": 1.0, "Spinach": 1.0, "Spring Onions": 1.0, "Sweet Potato": 1.0, 
  "Shallots": 1.0, "Tomato (Red)": 1.0, "Tomato (Yellow)": 1.0, "Tomato (Black)": 1.0, "Watercress": 1.0, 

  // --- FRUITS (1.0 Point) ---
  "Apple (Green)": 1.0, "Apple (Red)": 1.0, "Apricot": 1.0,  "Avocado": 1.0, "Banana": 1.0, "Blueberries": 1.0,
  "Blackberries": 1.0, "Cherries": 1.0, "Chirimoya": 1.0, 
  "Grapefruit": 1.0, "Grapes (Green)": 1.0, "Grapes (Red)": 1.0,
  "Kiwi": 1.0, "Lemon": 1.0, "Lime": 1.0, "Loquat": 1.0,"Mango": 1.0, "Orange": 1.0, "Pear": 1.0, "Peach": 1.0,
  "Pineapple": 1.0, "Plum": 1.0, "Raspberries": 1.0, "Strawberries": 1.0,

  // --- GRAINS, LEGUMES & FERMENTED (1.0 Point) ---
  "Barley": 1.0, "Black Beans": 1.0, "Brown Rice": 1.0, "Chickpeas": 1.0, "Edamame": 1.0,
  "Kimchi": 1.0, "Lentils (Red)": 1.0, "Lentils (Green)": 1.0, "Miso": 1.0, "Oats": 1.0,
  "Quinoa (White)": 1.0, "Quinoa (Red)": 1.0, "Sauerkraut": 1.0, "Tempeh": 1.0, "Tofu": 1.0,
  "Kefir": 1.0, "Cheese": 1.0,"Extra Virgin Olive Oil": 1,

  // --- NUTS, SEEDS, SPICES & HERBS (0.5 Points) ---
  "Almonds": 0.5, "Basil": 0.5, "Brazil Nuts": 0.5, "Cashews": 0.5, "Chia Seeds": 0.5,
  "Chives": 0.5, "Cinnamon": 0.5, "Coriander": 0.5, "Cumin": 0.5, "Dill": 0.5, "Flaxseeds": 0.5,
  "Ginger": 0.5, "Hazelnuts": 0.5, "Hemp Seeds": 0.5, "Mint": 0.5, "Nutmeg": 0.5, "Oregano": 0.5,
  "Paprika": 0.5, "Parsley": 0.5, "Pecans": 0.5, "Pine Nuts": 0.5, "Pistachios": 0.5,
  "Pumpkin Seeds": 0.5, "Rosemary": 0.5, "Sesame Seeds": 0.5, "Sunflower Seeds": 0.5,
  "Turmeric": 0.5, "Walnuts": 0.5, 
};

const STORAGE_KEY = 'flora_30_plants_v2';

export default function App() {
  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [pointMode, setPointMode] = useState<number>(1.0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persistence (LocalStorage)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPlants(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load plants", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
  }, [plants]);

  // Scoring Logic: Sum of pointValue for checked items
  const totalPoints = useMemo(() => {
    return plants
      .filter(p => p.isChecked)
      .reduce((sum, p) => sum + p.pointValue, 0);
  }, [plants]);

  // Core Actions
  const addPlant = (name: string, value: number) => {
    const cleanName = name.trim();
    if (!cleanName) return;

    // Duplicate search: existingList.any((p) => p.name.toLowerCase() == newName.toLowerCase())
    const isDuplicate = plants.some(
      (p) => p.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (isDuplicate) {
      setInputValue('');
      setShowSuggestions(false);
      return;
    }

    const newItem: PlantItem = {
      id: crypto.randomUUID(),
      name: cleanName,
      pointValue: value,
      isChecked: true,
      createdAt: Date.now(),
    };

    setPlants([newItem, ...plants]);
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const togglePlant = (id: string) => {
    setPlants(current => current.map(p => 
      p.id === id ? { ...p, isChecked: !p.isChecked } : p
    ));
  };

  const deletePlant = (id: string) => {
    setPlants(current => current.filter(p => p.id !== id));
  };

  const resetWeek = () => {
    setPlants([]);
    setShowResetConfirm(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Autocomplete Logic
  const filteredSuggestions = useMemo(() => {
    if (!inputValue) return [];
    const search = inputValue.toLowerCase();
    return Object.keys(plantDictionary)
      .filter(name => 
        name.toLowerCase().includes(search) && 
        !plants.some(p => p.name.toLowerCase() === name.toLowerCase())
      )
      .sort((a, b) => a.length - b.length)
      .slice(0, 5);
  }, [inputValue, plants]);

  // Circular Progress Props
  const radius = 42;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progressPercent = Math.min(totalPoints / 30, 1);
  const strokeDashoffset = circumference - progressPercent * circumference;

  return (
    <div className="min-h-screen bg-zoe-bg selection:bg-zoe-green/10">
      <div className="max-w-[600px] mx-auto min-h-screen flex flex-col pt-8 pb-20 px-4 md:px-6 relative">
        
        {/* Sticky Header */}
        <header className="sticky top-4 z-40 bg-zoe-bg/80 backdrop-blur-xl rounded-[40px] px-6 py-6 border border-zoe-cream shadow-sm mb-8 flex flex-col items-center gap-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zoe-green rounded-2xl flex items-center justify-center shadow-lg shadow-zoe-green/20">
                <Leaf className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-zoe-green tracking-tight leading-none">Flora</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zoe-green/40 mt-1">Gut Health Tracker</p>
              </div>
            </div>
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="p-3 bg-white hover:bg-red-50 text-zoe-charcoal/30 hover:text-red-500 rounded-2xl border border-zoe-cream transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
              <circle
                stroke="rgba(46,77,68,0.05)"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <motion.circle
                stroke="#2E4D44"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
              <motion.span 
                key={totalPoints}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-display font-black text-zoe-green leading-none"
              >
                {totalPoints}
              </motion.span>
              <span className="text-[10px] font-black text-zoe-green/30 uppercase tracking-widest mt-1">Goal 30</span>
            </div>
          </div>
        </header>

        {/* Smart Input Section */}
        <section className="relative z-30 mb-8">
          <div className="bg-white p-2 rounded-[32px] shadow-xl shadow-zoe-green/5 border border-zoe-cream flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zoe-green/30">
                <Search className="w-5 h-5" />
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search or add plant..."
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addPlant(inputValue, pointMode);
                  }
                }}
                className="w-full bg-zoe-bg border-none focus:ring-0 rounded-2xl py-4 pl-12 pr-4 font-semibold text-zoe-charcoal placeholder:text-zoe-charcoal/20 outline-none transition-all"
              />
              
              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {showSuggestions && inputValue && (
                  <>
                    <div className="fixed inset-0" onClick={() => setShowSuggestions(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[32px] shadow-2xl border border-zoe-cream overflow-hidden z-50 p-2"
                    >
                      {filteredSuggestions.map((name) => (
                        <button
                          key={name}
                          onClick={() => {
                            const val = plantDictionary[name] || pointMode;
                            addPlant(name, val);
                          }}
                          className="w-full flex items-center justify-between px-5 py-4 hover:bg-zoe-bg rounded-2xl transition-colors group"
                        >
                          <span className="font-bold text-zoe-charcoal group-hover:text-zoe-green">{name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-zoe-green opacity-40">{(plantDictionary[name] || pointMode).toFixed(1)} PTS</span>
                            <Plus className="w-4 h-4 text-zoe-green/40 group-hover:text-zoe-green" />
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() => addPlant(inputValue, pointMode)}
                        className="w-full flex items-center gap-3 px-5 py-4 bg-zoe-green/5 hover:bg-zoe-green text-zoe-green hover:text-white rounded-2xl transition-all group"
                      >
                        <Plus className="w-5 h-5" />
                        <span className="font-bold">Add "{inputValue}"</span>
                        <div className="ml-auto flex items-center gap-2">
                          <span className="text-[10px] font-black opacity-60 uppercase">{pointMode.toFixed(1)} PTS</span>
                        </div>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-zoe-bg p-1 rounded-2xl flex gap-1 border border-zoe-cream sticky right-2 shrink-0">
              <button
                onClick={() => setPointMode(1.0)}
                className={`px-4 py-3 rounded-xl font-black text-[11px] uppercase transition-all ${
                  pointMode === 1.0 ? 'bg-white text-zoe-green shadow-md shadow-zoe-green/10' : 'text-zoe-charcoal/20'
                }`}
              >
                1.0
              </button>
              <button
                onClick={() => setPointMode(0.5)}
                className={`px-4 py-3 rounded-xl font-black text-[11px] uppercase transition-all ${
                  pointMode === 0.5 ? 'bg-white text-zoe-green shadow-md shadow-zoe-green/10' : 'text-zoe-charcoal/20'
                }`}
              >
                0.5
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 px-2">
            <Info className="w-3.5 h-3.5 text-zoe-green/30" />
            <p className="text-[10px] font-black uppercase tracking-wider text-zoe-green/30">
              Whole plants = 1.0 • Seeds, spices & herbs = 0.5
            </p>
          </div>
        </section>

        {/* List of Plants */}
        <section className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {plants.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 flex flex-col items-center text-center opacity-20"
              >
                <Leaf className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-bold">Your garden is empty</h3>
                <p className="font-medium mt-1">Start adding plants to track your weekly goal</p>
              </motion.div>
            ) : (
              plants.map((plant) => (
                <motion.div
                  key={plant.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  className={`group relative overflow-hidden bg-white border border-zoe-cream p-5 md:p-6 rounded-[32px] flex items-center gap-5 transition-all hover:shadow-xl hover:shadow-zoe-green/5 ${
                    !plant.isChecked && 'grayscale opacity-60 bg-zoe-bg'
                  }`}
                >
                  <button 
                    onClick={() => togglePlant(plant.id)}
                    className="shrink-0 relative w-10 h-10 flex items-center justify-center transition-transform active:scale-90"
                  >
                    {plant.isChecked ? (
                      <div className="bg-zoe-green w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-zoe-green/20">
                        <CheckCircle2 className="text-white w-6 h-6" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 border-2 border-zoe-green/10 rounded-2xl flex items-center justify-center" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xl font-bold leading-none truncate ${
                      plant.isChecked ? 'text-zoe-charcoal' : 'text-zoe-charcoal/40 line-through decoration-2'
                    }`}>
                      {plant.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                       <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                         plant.isChecked ? 'bg-zoe-green/10 text-zoe-green' : 'bg-zoe-charcoal/5 text-zoe-charcoal/30'
                       }`}>
                         {plant.pointValue.toFixed(1)} PTS
                       </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deletePlant(plant.id)}
                    className="p-3 text-zoe-charcoal/10 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </section>

        <footer className="mt-12 text-center pb-12">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zoe-green/30 px-10 leading-relaxed">
            Diversify your fiber intake with 30 unique plants a week for optimal gut microbiome health.
          </p>
        </footer>
      </div>

      {/* Reset Confirmation */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              className="absolute inset-0 bg-zoe-charcoal/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-[440px] rounded-[48px] p-10 border border-zoe-cream shadow-2xl flex flex-col items-center text-center gap-8"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center shadow-inner">
                <RotateCcw className="w-10 h-10" />
              </div>
              <div className="flex flex-col gap-3">
                <h2 className="font-display text-3xl font-black text-zoe-charcoal leading-tight">Reset your week?</h2>
                <p className="text-zoe-charcoal/40 font-medium leading-relaxed">
                  This will remove all {plants.length} plants from your list. This action cannot be undone.
                </p>
              </div>
              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={resetWeek}
                  className="w-full py-5 bg-red-500 text-white font-black uppercase tracking-widest rounded-[24px] hover:bg-red-600 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-red-500/20"
                >
                  Yes, Reset Week
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full py-5 bg-zoe-bg text-zoe-charcoal/40 font-black uppercase tracking-widest rounded-[24px] hover:bg-zoe-cream transition-colors transition-all hover:scale-[1.02] active:scale-95"
                >
                  Go Back
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

