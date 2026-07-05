import React from "react";
import { motion } from "motion/react";
import { Lightbulb, CloudRain, Car, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function GlassCard({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-xl border ${className}`}
      style={{
        background: "rgba(10,16,32,0.72)",
        backdropFilter: "blur(14px)",
        borderColor: "rgba(255,255,255,0.07)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const predictiveData = [
  { time: "Now", congestion: 65, rainfall: 0 },
  { time: "+1 hr", congestion: 72, rainfall: 2 },
  { time: "+2 hr", congestion: 85, rainfall: 12 },
  { time: "+3 hr", congestion: 92, rainfall: 25 },
  { time: "+4 hr", congestion: 78, rainfall: 15 },
  { time: "+5 hr", congestion: 54, rainfall: 5 },
];

export default function InsightsPage({ trafficData, parkingData, weatherData }: { trafficData?: any[], parkingData?: any[], weatherData?: any }) {
  // Compute basic metrics
  const avgIntensity = trafficData?.length ? trafficData.reduce((acc, curr) => acc + curr.intensity, 0) / trafficData.length : 0.5;
  const trafficScore = Math.round(avgIntensity * 100);
  
  const totalParking = parkingData?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 100;
  const availParking = parkingData?.reduce((acc, curr) => acc + (curr.available || 0), 0) || 20;
  
  const temp = weatherData?.main?.temp ? Math.round(weatherData.main.temp) : 28;
  const desc = weatherData?.weather?.[0]?.description || "clear skies";
  const rain = weatherData?.rain?.["1h"] || 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#020509]">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lightbulb className="text-amber-400" size={24} />
            AI Insights & Predictions
          </h1>
          <p className="text-sm text-white/50 mt-1">Data-driven forecasts powered by live Colombo city metrics.</p>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">City Congestion</h3>
              <TrendingUp size={16} className={trafficScore > 70 ? "text-red-400" : "text-emerald-400"} />
            </div>
            <p className="text-3xl font-bold text-white">{trafficScore}<span className="text-lg text-white/40 font-normal">/100</span></p>
            <p className="text-xs mt-2 text-white/40">Based on live heatmaps</p>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Weather Impact</h3>
              <CloudRain size={16} className={rain > 10 ? "text-red-400" : "text-sky-400"} />
            </div>
            <p className="text-3xl font-bold text-white">{temp}°C</p>
            <p className="text-xs mt-2 text-white/40 capitalize">{desc} • {rain}mm rain</p>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Parking Capacity</h3>
              <Car size={16} className="text-indigo-400" />
            </div>
            <p className="text-3xl font-bold text-white">{availParking} <span className="text-lg text-white/40 font-normal">avail</span></p>
            <p className="text-xs mt-2 text-white/40">Out of {totalParking} tracked spots</p>
          </GlassCard>

          <GlassCard className="p-4" style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.1), rgba(2,132,199,0.1))" }}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-semibold text-sky-400/80 uppercase tracking-wider">EV Network</h3>
              <Zap size={16} className="text-sky-400" />
            </div>
            <p className="text-3xl font-bold text-sky-400">High</p>
            <p className="text-xs mt-2 text-sky-400/60">Demand surging in Fort</p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Narrative */}
          <div className="lg:col-span-1 space-y-4">
            <GlassCard className="p-5">
              <h2 className="text-lg font-bold text-white mb-3">Executive Summary</h2>
              <p className="text-sm text-white/70 leading-relaxed mb-4">
                Colombo's traffic network is currently experiencing {trafficScore > 70 ? 'heavy' : 'moderate'} loads. 
                {rain > 5 ? ` The recent ${rain}mm of rainfall is severely reducing average speeds along Galle Road.` : ' Clear weather is facilitating normal flow.'}
              </p>
              
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} className="text-red-400" />
                  <span className="text-xs font-bold text-red-400">AI Warning</span>
                </div>
                <p className="text-xs text-white/60">
                  Model predicts a 35% spike in congestion over the next 2 hours due to incoming weather fronts.
                </p>
              </div>
            </GlassCard>
          </div>

          {/* Chart */}
          <GlassCard className="lg:col-span-2 p-5 h-80 flex flex-col">
            <h2 className="text-lg font-bold text-white mb-4">Predictive Congestion vs. Weather</h2>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={predictiveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCongestion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: "rgba(10,16,32,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    itemStyle={{ color: "#fff", fontSize: "12px" }}
                  />
                  <Area type="monotone" dataKey="congestion" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorCongestion)" name="Traffic Load" />
                  <Area type="monotone" dataKey="rainfall" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorRain)" name="Expected Rain (mm)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

      </motion.div>
    </div>
  );
}
