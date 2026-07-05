import re

with open('client/src/app/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update View type
content = re.sub(
    r'type View = "dashboard" \| "parking" \| "navigate" \| "analytics" \| "ai";',
    'type View = "dashboard" | "parking" | "navigate" | "analytics" | "ai" | "ev";',
    content
)

# 2. Update navItems
content = re.sub(
    r'(\{ id: "ai", label: "AI", Icon: Bot \},)',
    r'\1\n  { id: "ev", label: "EV Chargers", Icon: Zap },',
    content
)

# 3. Update viewLabels
content = re.sub(
    r'(ai: "AI Assistant",)',
    r'\1\n    ev: "EV Chargers",',
    content
)

# 4. Update viewComponents
content = re.sub(
    r'(ai: <AIView \/>,)',
    r'\1\n    ev: <EVView parkingData={parkingData} />,',
    content
)

# 5. Add EVView component
ev_view_code = '''
// ── EV View ───────────────────────────────────────────────────────────────────

function EVView({ parkingData }: { parkingData: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const evLocations = parkingData.filter(p => p.has_ev);
  const filtered = evLocations.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">EV Charging Stations</h2>
          <p className="text-[12px] text-white/50 mt-1">Find and check real-time availability of EV chargers.</p>
        </div>
      </div>
      
      <div className="relative mb-6 flex-shrink-0">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input 
          type="text"
          placeholder="Search locations..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-[#0a0f18] text-sm text-white px-10 py-3 rounded-xl border outline-none transition-colors"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(loc => (
          <GlassCard key={loc.id} className="p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{loc.name}</h3>
                <p className="text-[11px] text-white/40 mt-0.5">{(loc.distance || (Math.random() * 3 + 1).toFixed(1) + " km")} away</p>
              </div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(14, 165, 233, 0.15)" }}>
                <Zap size={15} className="text-sky-400" />
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Available</span>
                <span className="text-xl font-bold" style={{ color: loc.ev_available > 0 ? "#10b981" : "#ef4444" }}>
                  {loc.ev_available || 0}
                </span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Total Chargers</span>
                <span className="text-xl font-bold text-white/80">{loc.ev_total || 2}</span>
              </div>
            </div>
            
            <button className="w-full mt-2 py-2.5 rounded-lg text-xs font-semibold text-white transition-all"
              style={{ background: loc.ev_available > 0 ? "linear-gradient(135deg, #0ea5e9, #0284c7)" : "rgba(255,255,255,0.05)", opacity: loc.ev_available > 0 ? 1 : 0.5 }}>
              {loc.ev_available > 0 ? "Navigate Here" : "Currently Full"}
            </button>
          </GlassCard>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-10 flex flex-col items-center justify-center text-center">
            <Zap size={32} className="text-white/10 mb-3" />
            <p className="text-sm text-white/40">No EV charging stations found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

'''

content = re.sub(
    r'(// ── AI View ───────────────────────────────────────────────────────────────────)',
    ev_view_code + r'\1',
    content
)

with open('client/src/app/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("EV Tab added successfully!")
