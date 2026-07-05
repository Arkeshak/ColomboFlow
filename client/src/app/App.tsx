import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { GoogleMap, useJsApiLoader, Marker, Circle, DirectionsRenderer, TrafficLayer, InfoWindow } from '@react-google-maps/api';
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import {
  Navigation2, ParkingCircle, BarChart3, Bot,
  Search, Bell, Settings, Zap, Cloud,
  Car, Clock, Star, Send,
  AlertTriangle, CheckCircle,
  LayoutDashboard, Route,
  Droplets, Wind, Eye,
  Layers, ChevronRight,
  ArrowUp, ArrowDown,
  Radio, Crosshair, MapPin, CloudRain, Sun, Lightbulb
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import InsightsPage from "./components/InsightsPage";

// ── Types ────────────────────────────────────────────────────────────────────

type View = "dashboard" | "parking" | "navigate" | "analytics" | "ai" | "ev" | "weather" | "insights";
type AlertKind = "warning" | "info" | "success";
type LucideIcon = React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;

// ── Data ─────────────────────────────────────────────────────────────────────

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:3001";
const socket = io(API_BASE_URL);

const trafficChartData = [
  { time: "6am", density: 22, predicted: 24 },
  { time: "7am", density: 45, predicted: 48 },
  { time: "8am", density: 82, predicted: 78 },
  { time: "9am", density: 91, predicted: 88 },
  { time: "10am", density: 67, predicted: 70 },
  { time: "11am", density: 55, predicted: 58 },
  { time: "12pm", density: 72, predicted: 68 },
  { time: "1pm", density: 68, predicted: 71 },
  { time: "2pm", density: 58, predicted: 60 },
  { time: "3pm", density: 62, predicted: 65 },
  { time: "4pm", density: 79, predicted: 82 },
  { time: "5pm", density: 95, predicted: 93 },
  { time: "6pm", density: 88, predicted: 85 },
  { time: "7pm", density: 71, predicted: 73 },
  { time: "8pm", density: 54, predicted: 52 },
];

const parkingChartData = [
  { hour: "6am", utilized: 20 },
  { hour: "8am", utilized: 68 },
  { hour: "10am", utilized: 82 },
  { hour: "12pm", utilized: 91 },
  { hour: "2pm", utilized: 76 },
  { hour: "4pm", utilized: 85 },
  { hour: "6pm", utilized: 94 },
  { hour: "8pm", utilized: 71 },
  { hour: "10pm", utilized: 42 },
];

const zoneData = [
  { zone: "Fort", congestion: 87, parking: 78 },
  { zone: "Pettah", congestion: 72, parking: 92 },
  { zone: "Kollupitiya", congestion: 65, parking: 55 },
  { zone: "Bambalapitiya", congestion: 79, parking: 61 },
  { zone: "Narahenpita", congestion: 54, parking: 44 },
  { zone: "Rajagiriya", congestion: 48, parking: 38 },
];

const nearbyParkingData = [
  { id: 1, name: "Fort City Parking", distance: "0.3 km", available: 24, total: 80, price: 80, rating: 4.8, type: "Covered" },
  { id: 2, name: "World Trade Centre", distance: "0.6 km", available: 8, total: 120, price: 120, rating: 4.6, type: "Multi-level" },
  { id: 3, name: "Pettah Central", distance: "0.9 km", available: 45, total: 60, price: 50, rating: 4.3, type: "Open" },
  { id: 4, name: "Galle Face Hotel", distance: "1.2 km", available: 3, total: 40, price: 200, rating: 4.9, type: "Valet" },
  { id: 5, name: "Liberty Plaza", distance: "1.5 km", available: 31, total: 90, price: 60, rating: 4.4, type: "Covered" },
];

const quickSuggestions = [
  "Best time to drive to Fort?",
  "Cheapest parking near WTC?",
  "Will traffic be heavy tonight?",
  "Find EV charging stations",
];

const mapParkingPins = [
  { id: 1, lat: 6.931, lng: 79.845, available: 24, total: 80, name: "Fort City Parking", has_ev: true, ev_total: 4, ev_available: 2 },
  { id: 2, lat: 6.933, lng: 79.848, available: 8, total: 120, name: "WTC Parking", has_ev: true, ev_total: 6, ev_available: 1 },
  { id: 3, lat: 6.936, lng: 79.852, available: 45, total: 60, name: "Pettah Central" },
  { id: 4, lat: 6.925, lng: 79.847, available: 3, total: 40, name: "Galle Face Hotel", has_ev: true, ev_total: 2, ev_available: 0 },
  { id: 5, lat: 6.918, lng: 79.853, available: 31, total: 90, name: "Liberty Plaza" },
  { id: 6, lat: 6.895, lng: 79.855, available: 18, total: 50, name: "Bambalapitiya Pk", has_ev: true, ev_total: 4, ev_available: 4 },
  { id: 7, lat: 6.885, lng: 79.870, available: 52, total: 100, name: "Narahenpita Pk" },
  { id: 8, lat: 6.915, lng: 79.860, available: 7, total: 70, name: "Slave Island" },
];

const trafficHeatmap = [
  { lat: 6.927, lng: 79.861, r: 70, intensity: 0.85 },
  { lat: 6.930, lng: 79.855, r: 55, intensity: 0.72 },
  { lat: 6.920, lng: 79.870, r: 50, intensity: 0.88 },
  { lat: 6.935, lng: 79.865, r: 60, intensity: 0.64 },
  { lat: 6.915, lng: 79.860, r: 45, intensity: 0.52 },
  { lat: 6.925, lng: 79.875, r: 40, intensity: 0.41 },
];

const navItems: { id: View; label: string; Icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "parking", label: "Parking", Icon: ParkingCircle },
  { id: "navigate", label: "Navigate", Icon: Route },
  { id: "analytics", label: "Analytics", Icon: BarChart3 },
  { id: "ai", label: "AI", Icon: Bot },
  { id: "insights", label: "AI Insights", Icon: Lightbulb },
  { id: "ev", label: "EV Chargers", Icon: Zap },
  { id: "weather", label: "Weather Center", Icon: CloudRain },
];

// ── Utils ─────────────────────────────────────────────────────────────────────

function getPinColor(available: number, total: number) {
  const r = available / total;
  if (r > 0.3) return "#10b981";
  if (r > 0.1) return "#f59e0b";
  return "#ef4444";
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function GlassCard({ children, className = "", style, onClick }: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      onClick={onClick}
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

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(8,14,28,0.97)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
      <p className="text-white/50 mb-1.5 font-mono">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="text-white font-semibold">{p.value}</span></p>
      ))}
    </div>
  );
}

// ── Colombo Map ───────────────────────────────────────────────────────────────

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#020509" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
];

function ColomboMap({ showTraffic, showParking, showEV, selectedPin, onPinSelect, trafficData = trafficHeatmap, parkingData = mapParkingPins, routeGeometry, directionsResponse, incidents = [] }: {
  showTraffic: boolean;
  showParking: boolean;
  showEV?: boolean;
  selectedPin: number | null;
  onPinSelect: (id: number | null) => void;
  trafficData?: any[];
  parkingData?: any[];
  routeGeometry?: [number, number][];
  directionsResponse?: any;
  incidents?: any[];
}) {
  const defaultCenter = { lat: 6.9271, lng: 79.8612 };
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [reportModal, setReportModal] = useState<{ lat: number, lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locateUser = () => {
    if (navigator.geolocation) {
      toast("Locating you...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          setMapCenter(loc);
          toast.success("Location found");
        },
        () => toast.error("Could not fetch location. Please enable location services."),
        { enableHighAccuracy: true }
      );
    } else {
      toast.error("Geolocation not supported by this browser.");
    }
  };

  const handleMapClick = (e: any) => {
    if (isReporting && e.latLng) {
      setReportModal({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      setIsReporting(false);
    }
  };

  const submitIncident = async (type: string) => {
    if (!reportModal) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send both lon and lng for compatibility
        body: JSON.stringify({ type, lat: reportModal.lat, lon: reportModal.lng, lng: reportModal.lng })
      });
      if (!res.ok) throw new Error("Server error");
      toast.success("Incident reported successfully! Broadcasted to all drivers.");
    } catch (err) {
      toast.error("Failed to report incident");
    } finally {
      setIsSubmitting(false);
      setReportModal(null);
    }
  };

  const libraries = React.useMemo(() => ['visualization'], []);
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries as any
  });

  if (!isLoaded) return <div className="w-full h-full flex items-center justify-center bg-[#020509]"><p className="text-white/30 text-sm">Loading Google Maps...</p></div>;


  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl z-0" style={{ background: "#020509" }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%', background: '#020509' }}
        center={mapCenter}
        zoom={14}
        options={{
          styles: darkMapStyle,
          disableDefaultUI: true,
          zoomControl: true,
          draggableCursor: isReporting ? "crosshair" : undefined,
        }}
        onClick={handleMapClick}
      >
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: 'white',
              scale: 8
            }}
            zIndex={999}
          />
        )}
        {showTraffic && <TrafficLayer />}
        {/* Traffic density circles — replaces deprecated HeatmapLayer */}
        {showTraffic && trafficData.filter((pt: any) => pt.lat && pt.lng).map((pt: any, i: number) => {
          const intensity = Math.min(1, Math.max(0, pt.intensity || 0.5));
          // Color: low intensity = blue/cyan, high = red
          const r = Math.round(intensity * 255);
          const b = Math.round((1 - intensity) * 200);
          const color = `rgb(${r}, 30, ${b})`;
          return (
            <Circle
              key={`heatmap-${i}`}
              center={{ lat: pt.lat, lng: pt.lng }}
              radius={(pt.r || 300) * 3}
              options={{
                fillColor: color,
                fillOpacity: 0.28 * intensity,
                strokeColor: color,
                strokeOpacity: 0.15,
                strokeWeight: 0,
                clickable: false,
              }}
            />
          );
        })}

        {(showParking || showEV) && parkingData.filter(p => {
          if (!showParking && showEV) return p.has_ev;
          if (showParking && !showEV) return !p.has_ev; // if they explicitly only want regular parking
          return true; // if both are on, show all
        }).map((pin: any) => {
          if (!pin.lat || !pin.lng) return null;
          const isSelected = selectedPin === pin.id;
          const isEVMarker = pin.has_ev;
          const color = isEVMarker ? "#0ea5e9" : getPinColor(pin.available, pin.total);
          return (
            <React.Fragment key={`parking-${pin.id}`}>
              <Marker
                position={{ lat: pin.lat, lng: pin.lng }}
                onClick={() => onPinSelect(pin.id)}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: color,
                  fillOpacity: 1,
                  strokeWeight: isSelected ? 3 : 1,
                  strokeColor: 'white',
                  scale: isSelected ? 12 : (isEVMarker ? 10 : 8)
                }}
                label={isEVMarker ? { text: "⚡", fontSize: "10px" } : undefined}
              />
              {isSelected && (
                <InfoWindow
                  position={{ lat: pin.lat, lng: pin.lng }}
                  onCloseClick={() => onPinSelect(null)}
                >
                  <div className="p-1 min-w-[140px] text-black">
                    <h3 className="font-bold text-sm mb-1">{pin.name}</h3>
                    {isEVMarker ? (
                      <>
                        <p className="text-xs text-emerald-600 font-semibold mb-1">
                          ⚡ {pin.ev_available} / {pin.ev_total} EV Plugs Free
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs">{pin.available} / {pin.total} slots available</p>
                      </>
                    )}
                    {!pin.has_ev && <div className="mb-2" />}
                    <button

                      className="w-full bg-[#3b82f6] text-white text-xs font-semibold py-1 rounded"
                      onClick={() => alert(`Reserve spot at ${pin.name}`)}
                    >
                      Reserve Spot
                    </button>
                  </div>
                </InfoWindow>
              )}
            </React.Fragment>
          );
        })}

        {incidents.map((inc: any) => (
          <Marker
            key={`inc-${inc.id}`}
            position={{ lat: inc.lat, lng: inc.lon || inc.lng }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: 'white',
              scale: 8
            }}
            label={{ text: "!", color: "white", fontWeight: "bold" }}
          />
        ))}

        {directionsResponse && (
          <DirectionsRenderer
            directions={directionsResponse}
            options={{
              suppressMarkers: false,
              polylineOptions: { strokeColor: '#0ea5e9', strokeWeight: 5, strokeOpacity: 0.8 }
            }}
          />
        )}
      </GoogleMap>

      {/* Floating Map Controls */}
      <div className="absolute top-3 right-12 flex flex-col gap-1.5">
        <button
          onClick={locateUser}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-md shadow-lg border transition-all bg-[#0a1020]/90 border-white/10 text-white/70 active:scale-95"
        >
          <Crosshair size={13} />
          <span className="text-[11px] font-medium hidden sm:inline">Locate Me</span>
        </button>
        <button
          onClick={() => {
            setIsReporting(!isReporting);
            if (!isReporting) toast("Tap anywhere on the map to drop an incident pin");
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-md shadow-lg border transition-all active:scale-95 ${isReporting ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-[#0a1020]/90 border-white/10 text-white/70'}`}
        >
          <AlertTriangle size={13} className={isReporting ? 'fill-red-500/50' : ''} />
          <span className="text-[11px] font-medium hidden sm:inline">{isReporting ? "Cancel" : "Report"}</span>
        </button>
      </div>

      {/* Incident Report Modal */}
      {reportModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0a1020] border border-white/10 p-5 rounded-xl max-w-sm w-full"
          >
            <h3 className="font-bold text-white mb-1">Report Traffic Incident</h3>
            <p className="text-xs text-white/50 mb-4">Your report will be instantly broadcasted to all drivers.</p>

            <div className="grid grid-cols-1 gap-2 mb-4">
              {['Accident', 'Protest', 'Flooded Street'].map(type => (
                <button
                  key={type}
                  onClick={() => submitIncident(type.toLowerCase())}
                  disabled={isSubmitting}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  {type}
                </button>
              ))}
            </div>

            <button
              onClick={() => setReportModal(null)}
              className="w-full py-2 text-white/50 text-sm hover:text-white transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, Icon, color, trend }: {
  label: string; value: string; sub: string;
  Icon: LucideIcon; color: string; trend?: "up" | "down";
}) {
  return (
    <div
      className="rounded-xl p-3 lg:p-4 flex flex-col gap-2"
      style={{ background: "rgba(10,16,32,0.72)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/45 font-medium tracking-widest uppercase leading-tight">{label}</span>
        <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}1a` }}>
          <Icon size={12} style={{ color }} />
        </div>
      </div>
      <div className="flex items-end gap-1.5">
        <span className="text-xl lg:text-2xl font-bold text-white tracking-tight">{value}</span>
        <span className={`text-[10px] pb-0.5 flex items-center gap-0.5 leading-tight ${trend === "up" ? "text-emerald-400" : trend === "down" ? "text-sky-400" : "text-white/35"}`}>
          {trend === "up" && <ArrowUp size={9} />}
          {trend === "down" && <ArrowDown size={9} />}
          <span className="hidden sm:inline">{sub}</span>
        </span>
      </div>
      <div className="h-0.5 rounded-full" style={{ background: `${color}20` }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: "0%" }}
          animate={{ width: "72%" }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
        />
      </div>
    </div>
  );
}

// ── Alert Item ────────────────────────────────────────────────────────────────

function AlertItem({ type, title, desc, time }: { type: AlertKind; title: string; desc: string; time: string }) {
  const config: Record<AlertKind, { color: string; Icon: LucideIcon }> = {
    warning: { color: "#f59e0b", Icon: AlertTriangle },
    info: { color: "#0ea5e9", Icon: Radio },
    success: { color: "#10b981", Icon: CheckCircle },
  };
  const { color, Icon } = config[type];
  return (
    <div className="flex gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="mt-0.5 w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full" style={{ background: `${color}1e` }}>
        <Icon size={11} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white/90 leading-tight">{title}</p>
        <p className="text-[11px] text-white/40 mt-0.5 leading-snug">{desc}</p>
      </div>
      <span className="text-[10px] text-white/25 flex-shrink-0 font-mono">{time}</span>
    </div>
  );
}

// ── Dashboard View ─────────────────────────────────────────────────────────────

function DashboardView({
  onNavigate, trafficData, parkingData, incidents, aiAdvice, weatherData, alerts
}: {
  onNavigate?: () => void;
  trafficData: any[];
  parkingData: any[];
  incidents: any[];
  aiAdvice: string;
  weatherData: any;
  alerts: any[];
}) {
  const [showTraffic, setShowTraffic] = useState(true);
  const [showParking, setShowParking] = useState(true);
  const [selectedPin, setSelectedPin] = useState<number | null>(null);

  // Dynamic calculations based on live backend data
  const totalAvailableParking = parkingData.reduce((acc, p) => acc + p.available, 0);
  const totalParkingSlots = parkingData.reduce((acc, p) => acc + p.total, 0);
  const parkingAvailabilityPct = totalParkingSlots > 0 ? Math.round((totalAvailableParking / totalParkingSlots) * 100) : 0;

  const avgSpeed = trafficData.length > 0 ? trafficData.reduce((acc, t) => acc + (t.speed || 40), 0) / trafficData.length : 40;
  const avgCongestion = trafficData.length > 0 ? trafficData.reduce((acc, t) => acc + (t.congestion || 1), 0) / trafficData.length : 1;

  // Estimate travel time for a typical 10km cross-city journey based on real average speeds
  const avgTravelTime = Math.round((10 / avgSpeed) * 60);

  // Estimate active vehicles using congestion multipliers
  const estimatedActiveVehicles = Math.round(40000 + (avgCongestion * 2500));

  return (
    <div className="h-full flex flex-col gap-2 lg:gap-4 p-3 lg:p-6 overflow-hidden">
      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 flex-shrink-0">
        <StatCard label="Active Vehicles" value={estimatedActiveVehicles.toLocaleString()} sub="+Live Data" Icon={Car} color="#3b82f6" trend="up" />
        <StatCard label="Parking Free" value={totalAvailableParking.toLocaleString()} sub={`${parkingAvailabilityPct}%`} Icon={ParkingCircle} color="#10b981" />
        <StatCard label="Travel Time" value={`${avgTravelTime}m`} sub="live speeds" Icon={Clock} color="#06b6d4" trend="down" />
        <StatCard label="AI Accuracy" value="92.5%" sub="precision" Icon={Zap} color="#f59e0b" />
      </div>

      {/* Map + side panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-4 min-h-0">
        {/* Map */}
        <div className="lg:col-span-2 flex flex-col gap-2 min-h-[200px] lg:min-h-[260px]">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[11px] text-white/35 font-medium mr-1">Layers</span>
            {[
              { label: "Traffic", active: showTraffic, toggle: () => setShowTraffic(v => !v), color: "#ef4444" },
              { label: "Parking", active: showParking, toggle: () => setShowParking(v => !v), color: "#10b981" },
            ].map(l => (
              <button key={l.label} onClick={l.toggle}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                style={{
                  background: l.active ? `${l.color}18` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${l.active ? l.color + "40" : "rgba(255,255,255,0.07)"}`,
                  color: l.active ? l.color : "rgba(255,255,255,0.38)",
                }}>
                <Layers size={10} />{l.label}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <ColomboMap showTraffic={showTraffic} showParking={showParking} selectedPin={selectedPin} onPinSelect={setSelectedPin} trafficData={trafficData} parkingData={parkingData} incidents={incidents} />
            <div className="absolute bottom-6 right-14 p-3 rounded-lg flex flex-col gap-2 pointer-events-none" style={{ background: "rgba(2,5,9,0.85)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(4px)" }}>
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Map Legend</span>
              {showTraffic && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-white/40">Traffic (Circles)</span>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-60"></div><span className="text-[10px] text-white/80">Heavy</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-60"></div><span className="text-[10px] text-white/80">Moderate</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 opacity-60"></div><span className="text-[10px] text-white/80">Light</span></div>
                </div>
              )}
              {showParking && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-[10px] text-white/40">Parking (Pins)</span>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full border border-white" style={{ background: "#10b981" }}></div><span className="text-[10px] text-white/80">&gt; 30% Free</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full border border-white" style={{ background: "#f59e0b" }}></div><span className="text-[10px] text-white/80">10-30% Free</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full border border-white" style={{ background: "#ef4444" }}></div><span className="text-[10px] text-white/80">Full / Near Full</span></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-3 overflow-y-auto">
          {/* Weather */}
          <GlassCard className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[11px] text-white/40 mb-0.5">Colombo, LK</p>
                <div className="flex items-end gap-1.5">
                  <span className="text-3xl font-bold text-white">
                    {weatherData ? `${Math.round(weatherData.main.temp)}°` : '...'}
                  </span>
                  <span className="text-sm text-white/45 pb-1 capitalize">
                    {weatherData ? weatherData.weather[0].description : 'Loading...'}
                  </span>
                </div>
              </div>
              <Cloud size={30} className="text-sky-400 opacity-60" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { Icon: Wind, label: weatherData?.wind?.speed ? `${weatherData.wind.speed} km/h` : "--", sub: "Wind" },
                { Icon: Droplets, label: weatherData?.main?.humidity ? `${weatherData.main.humidity}%` : "--", sub: "Humidity" },
                { Icon: Eye, label: weatherData?.visibility ? `${weatherData.visibility / 1000} km` : "--", sub: "Visibility" },
              ].map(({ Icon, label, sub }) => (
                <div key={sub} className="flex flex-col items-center gap-1 rounded-lg py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <Icon size={12} className="text-sky-400/65" />
                  <span className="text-xs font-semibold text-white/80">{label}</span>
                  <span className="text-[10px] text-white/30">{sub}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Alerts */}
          <GlassCard className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">Live Alerts</span>
              <span className="text-[10px] text-blue-400 font-mono">{alerts.length} active</span>
            </div>
            <AnimatePresence mode="popLayout">
              {alerts.map(a => (
                <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                  <AlertItem type={a.type} title={a.title} desc={a.desc} time={a.time} />
                </motion.div>
              ))}
            </AnimatePresence>
          </GlassCard>

          {/* AI recommendation */}
          <GlassCard className="p-4" style={{ background: "rgba(14,165,233,0.07)", borderColor: "rgba(14,165,233,0.15)" }}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(59,130,246,0.2)" }}>
                <Zap size={12} className="text-blue-400" />
              </div>
              <span className="text-[11px] font-semibold text-blue-400 tracking-wide">AI Recommendation</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              {aiAdvice}
            </p>
            <motion.button
              className="mt-3 w-full py-1.5 rounded-lg text-xs font-semibold text-blue-400 flex items-center justify-center gap-1.5"
              style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}
              whileHover={{ background: "rgba(59,130,246,0.18)" }}
              onClick={() => { toast.success("Route synchronized with your mobile device!"); onNavigate?.(); }}
            >
              Navigate Now <ChevronRight size={11} />
            </motion.button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

// ── Parking View ──────────────────────────────────────────────────────────────

function ParkingView({ trafficData, parkingData, incidents, token, preferCovered, setPreferCovered }: { trafficData: any[], parkingData: any[], incidents: any[], token: string | null, preferCovered: boolean, setPreferCovered: (val: boolean) => void }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [step, setStep] = useState<"list" | "confirm" | "success">("list");
  const [selectedPin, setSelectedPin] = useState<number | null>(null);
  const [bookingQr, setBookingQr] = useState<string | null>(null);
  const [duration, setDuration] = useState<1 | 2 | 4>(2);
  const [bookingInfo, setBookingInfo] = useState<{ slotNumber: number; lotName: string } | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const filtered = parkingData.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (step === "success") {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-5 p-6">
        <motion.div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "rgba(16,185,129,0.15)" }}
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <CheckCircle size={36} className="text-emerald-400" />
        </motion.div>
        <motion.div className="text-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-xl font-bold text-white mb-1">Booking Confirmed!</h2>
          <p className="text-sm text-white/45">
            {bookingInfo ? `Slot ${bookingInfo.slotNumber} at ${bookingInfo.lotName} · ${duration} hour${duration > 1 ? 's' : ''} reserved` : 'Spot reserved successfully'}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <GlassCard className="p-5 flex flex-col items-center gap-3 w-56">
            <div className="w-32 h-32 rounded-xl flex items-center justify-center bg-white">
              {bookingQr ? (
                <img src={bookingQr} alt="QR Code" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="grid grid-cols-6 gap-0.5 w-full h-full p-2" style={{ background: "rgba(0,0,0,0.8)" }}>
                  {Array.from({ length: 36 }, (_, i) => (
                    <div key={i} className={`w-full h-full rounded-[1px] ${[0, 3, 5, 8, 11, 13, 16, 19, 22, 25, 29, 31, 34].includes(i) ? "bg-white/90" : "bg-transparent"}`} />
                  ))}
                </div>
              )}
            </div>
            <p className="text-[9px] font-mono text-white/50 tracking-wider">SCAN AT ENTRY GATE</p>
          </GlassCard>
        </motion.div>
        <motion.button
          className="px-7 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #0ea5e9, #06b6d4)" }}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          onClick={() => { setStep("list"); setSelected(null); setBookingQr(null); setBookingInfo(null); }}
        >
          Back to Parking
        </motion.button>
      </div>
    );
  }

  if (step === "confirm" && selected !== null) {
    const spot = parkingData.find((p: any) => p.id === selected);
    if (!spot) return null;
    const totalCost = (spot.price || spot.price_per_hour || 80) * duration;

    const handleConfirmBooking = async () => {
      if (!token) {
        toast.error("Please log in to book a parking spot.");
        return;
      }
      setBookingLoading(true);
      setBookingError(null);
      try {
        const startTime = new Date().toISOString();
        const endTime = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString();

        const bookRes = await fetch(`${API_BASE_URL}/parking/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ lotId: spot.id, startTime, endTime })
        });
        const bookData = await bookRes.json();
        if (!bookRes.ok) throw new Error(bookData.error || 'Booking failed');

        // Now confirm payment (demo mode — no real Stripe)
        const confirmRes = await fetch(`${API_BASE_URL}/parking/confirm-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ bookingId: bookData.bookingId })
        });
        const confirmData = await confirmRes.json();
        if (!confirmRes.ok) throw new Error(confirmData.error || 'Payment confirmation failed');

        // Store booking details for success screen
        if (confirmData.qrCodeUrl) setBookingQr(confirmData.qrCodeUrl);
        else if (bookData.qrCodeUrl) setBookingQr(bookData.qrCodeUrl);

        setBookingInfo({
          slotNumber: confirmData.slotNumber || bookData.slotNumber || Math.floor(Math.random() * 100) + 1,
          lotName: confirmData.lotName || bookData.lotName || spot.name
        });

        toast.success('Parking booked and confirmed!');
        setStep("success");
      } catch (err: any) {
        console.error('Booking error:', err);
        setBookingError(err.message || 'Failed to complete booking');
        toast.error(err.message || 'Booking failed. Please try again.');
      } finally {
        setBookingLoading(false);
      }
    };

    return (
      <div className="h-full flex flex-col gap-4 p-4 lg:p-6 max-w-md mx-auto">
        <button className="flex items-center gap-1.5 text-sm text-white/45 hover:text-white transition-colors w-fit"
          onClick={() => setStep("list")}>
          ← Back
        </button>
        <h2 className="text-lg font-bold text-white">{spot.name}</h2>

        {bookingError && (
          <div className="p-3 rounded-xl text-xs text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {bookingError}
          </div>
        )}

        {!token && (
          <div className="p-3 rounded-xl text-xs text-amber-400" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
            ⚠️ You must be logged in to book a spot.
          </div>
        )}

        <GlassCard className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/55">Duration</span>
            <div className="flex gap-2">
              {([1, 2, 4] as const).map(d => (
                <button key={d}
                  onClick={() => setDuration(d)}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: duration === d ? "rgba(14,165,233,0.18)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${duration === d ? "rgba(14,165,233,0.35)" : "transparent"}`,
                    color: duration === d ? "#0ea5e9" : "rgba(255,255,255,0.75)",
                  }}>
                  {d} hr{d > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/55">Available Spots</span>
            <span className="text-sm font-semibold text-white">{spot.available ?? '—'} free</span>
          </div>
          <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/55">Total</span>
            <span className="text-xl font-bold text-white">LKR {totalCost}</span>
          </div>
          <p className="text-[10px] text-white/30">LKR {spot.price || spot.price_per_hour || 80}/hr × {duration} hr{duration > 1 ? 's' : ''}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-[11px] text-white/35 mb-2 uppercase tracking-wider">Payment</p>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="w-8 h-5 rounded bg-blue-700 flex items-center justify-center">
              <span className="text-[8px] text-white font-bold tracking-tight">VISA</span>
            </div>
            <span className="text-sm text-white/60">•••• •••• •••• 4821</span>
            <CheckCircle size={13} className="text-emerald-400 ml-auto" />
          </div>
          <p className="text-[10px] text-white/25 mt-2">Demo mode — no real charge will be made</p>
        </GlassCard>
        <motion.button
          className="mt-auto py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
          style={{ background: bookingLoading ? "rgba(14,165,233,0.4)" : "linear-gradient(135deg, #0ea5e9, #10b981)", opacity: (!token || bookingLoading) ? 0.7 : 1 }}
          whileHover={!bookingLoading && token ? { scale: 1.02 } : {}}
          whileTap={!bookingLoading && token ? { scale: 0.98 } : {}}
          onClick={handleConfirmBooking}
          disabled={bookingLoading || !token}
        >
          {bookingLoading ? (
            <><motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} />Confirming...</>
          ) : (
            `Confirm Booking — LKR ${totalCost}`
          )}
        </motion.button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3 p-3 lg:p-6">
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl flex-1"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <Search size={14} className="text-white/35" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search parking locations..."
            className="w-full bg-transparent text-sm text-white placeholder-white/22 outline-none"
          />
        </div>
        <button
          onClick={() => setPreferCovered(!preferCovered)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap`}
          style={{
            background: preferCovered ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${preferCovered ? "rgba(14,165,233,0.3)" : "rgba(255,255,255,0.07)"}`,
            color: preferCovered ? "#0ea5e9" : "rgba(255,255,255,0.5)"
          }}
        >
          {preferCovered ? '☂️ Covered Only' : '☂️ Any Type'}
        </button>
      </div>

      {/* Mobile: stacked layout — map on top, list below */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 gap-3 min-h-0">
        {/* Map */}
        <div className="h-[40dvh] lg:h-auto flex-shrink-0 lg:flex-shrink">
          <ColomboMap showTraffic={false} showParking={true} selectedPin={selectedPin} onPinSelect={id => {
            setSelectedPin(id);
            if (id) setSelected(id);
          }} trafficData={trafficData} parkingData={parkingData} incidents={incidents} />
        </div>

        {/* List */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0 overscroll-contain">
          {filtered.map((spot, i) => {
            const ratio = spot.available / spot.total;
            const color = ratio > 0.3 ? "#10b981" : ratio > 0.1 ? "#f59e0b" : "#ef4444";
            const isSelected = selected === spot.id;
            return (
              <div
                key={spot.id}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all active:scale-[0.99]"
                style={{
                  background: isSelected ? "rgba(14,165,233,0.09)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isSelected ? "rgba(14,165,233,0.22)" : "rgba(255,255,255,0.05)"}`,
                }}
                onClick={() => setSelected(isSelected ? null : spot.id)}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ background: `${color}15`, color }}>P</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/90 truncate">{spot.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-white/35">{spot.distance}</span>
                    <span className="text-[11px] font-medium" style={{ color }}>{spot.available} free</span>
                    <span className="text-[11px] text-white/25 hidden sm:inline">{spot.type}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-bold text-white">LKR {spot.price}<span className="text-[10px] text-white/35 font-normal">/hr</span></span>
                  <div className="flex items-center gap-0.5">
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                    <span className="text-[11px] text-white/50">{spot.rating}</span>
                  </div>
                </div>
              </div>
            );
          })}

          <AnimatePresence>
            {selected !== null && (
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="py-3 rounded-xl text-sm font-semibold text-white mt-1 flex-shrink-0 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #0ea5e9, #06b6d4)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep("confirm")}
              >
                Reserve Spot →
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Navigate View ─────────────────────────────────────────────────────────────

const navigateLocations: Record<string, { lat: number, lng: number }> = {
  "Fort Railway Station": { lat: 6.9333, lng: 79.8433 },
  "Nugegoda Junction": { lat: 6.8711, lng: 79.8890 },
  "Kollupitiya": { lat: 6.9067, lng: 79.8517 },
  "Bambalapitiya": { lat: 6.8850, lng: 79.8550 }
};

function NavigateView({ trafficData, parkingData, incidents, initialDest }: { trafficData: any[], parkingData: any[], incidents: any[], initialDest?: string }) {
  const allLocations = { ...navigateLocations };
  if (parkingData) {
    parkingData.forEach(p => {
      if (p.name && p.lat && p.lng) {
        allLocations[p.name] = { lat: p.lat, lng: p.lng };
      }
    });
  }

  const [origin, setOrigin] = useState("Nugegoda Junction");
  const [dest, setDest] = useState((initialDest && allLocations[initialDest]) ? initialDest : "Fort Railway Station");
  const [activeRoute, setActiveRoute] = useState(0);
  const [aiAdvice, setAiAdvice] = useState<string>("Loading AI prediction...");
  const [mlScore, setMlScore] = useState<number | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Sync destination when navigated here from another view (e.g. EV charger)
  useEffect(() => {
    if (initialDest && allLocations[initialDest]) {
      setDest(initialDest);
    }
  }, [initialDest]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/route/departure-time?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.aiAdvice) setAiAdvice(data.aiAdvice);
          if (data.mlPrediction && data.mlPrediction.congestion_score) {
            setMlScore(data.mlPrediction.congestion_score);
          }
        }
      })
      .catch(err => {
        setAiAdvice("Unable to fetch AI prediction at this time.");
      });
  }, [origin, dest]);

  const startNavigation = async () => {
    setIsNavigating(true);
    toast.success("Calculating optimal route with Google Maps...");

    if (window.google && window.google.maps) {
      const directionsService = new window.google.maps.DirectionsService();
      const start = allLocations[origin] || allLocations["Nugegoda Junction"];
      const end = allLocations[dest] || allLocations["Fort Railway Station"];

      try {
        const results = await directionsService.route({
          origin: start,
          destination: end,
          travelMode: window.google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true
        });

        setDirectionsResponse(results);
        toast.success("Navigation started! Route displayed on map.");
      } catch (err: any) {
        console.error("Google Maps Directions request failed:", err);
        const errorMsg = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
        toast.error(`Routing engine failed: ${errorMsg}`);
      }
    } else {
      toast.error("Google Maps API has not loaded yet.");
    }

    setIsNavigating(false);
  };

  const routes = [
    { label: "Fastest", time: "22 min", distance: "8.4 km", traffic: "Moderate", color: "#0ea5e9" },
    { label: "No Toll", time: "31 min", distance: "9.1 km", traffic: "Light", color: "#10b981" },
    { label: "Eco Route", time: "28 min", distance: "7.9 km", traffic: "Light", color: "#06b6d4" },
  ];

  return (
    <div className="h-full flex flex-col gap-3 p-3 lg:p-5">
      {/* Mobile: map on top, controls below. Desktop: map right, controls left. */}
      <div className="flex-1 flex flex-col-reverse lg:grid lg:grid-cols-3 gap-3 min-h-0">
        {/* Controls column */}
        <div className="flex flex-col gap-2 overflow-y-auto overscroll-contain lg:overflow-y-auto">
          {/* Origin / Dest */}
          <GlassCard className="p-3 lg:p-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <div className="w-0.5 h-5" style={{ background: "rgba(255,255,255,0.1)" }} />
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <select value={origin} onChange={e => setOrigin(e.target.value)}
                  className="rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors w-full"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {Object.keys(allLocations).map(k => <option key={k} value={k} style={{ background: '#020509' }}>{k}</option>)}
                </select>
                <select value={dest} onChange={e => setDest(e.target.value)}
                  className="rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors w-full"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {Object.keys(allLocations).map(k => <option key={k} value={k} style={{ background: '#020509' }}>{k}</option>)}
                </select>
              </div>
            </div>
          </GlassCard>

          {/* AI departure */}
          <GlassCard className="p-3 lg:p-4" style={{ borderColor: "rgba(16,185,129,0.18)" }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Zap size={13} className="text-emerald-400" />
                <span className="text-[11px] font-semibold text-emerald-400 tracking-wide">AI Departure Window</span>
              </div>
              {mlScore !== null && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.12)" }}>
                  <span className="text-[9px] font-bold text-emerald-400">ML: {mlScore.toFixed(1)}/5</span>
                </div>
              )}
            </div>
            <p className="text-xs text-white/65 leading-relaxed">
              {aiAdvice}
            </p>
          </GlassCard>

          {/* Route options — horizontal scroll on mobile */}
          <p className="text-[11px] text-white/35 uppercase tracking-widest font-medium flex-shrink-0">Route Options</p>
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 flex-shrink-0">
            {routes.map((route, i) => (
              <button
                key={i}
                className="flex flex-col lg:flex-row items-start lg:items-center gap-2 p-3 rounded-xl text-left transition-all flex-shrink-0 lg:flex-shrink active:scale-[0.98]"
                style={{
                  minWidth: '140px',
                  background: activeRoute === i ? `${route.color}10` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${activeRoute === i ? route.color + "28" : "rgba(255,255,255,0.05)"}`,
                }}
                onClick={() => setActiveRoute(i)}
              >
                <div className="w-1 h-6 lg:h-8 rounded-full flex-shrink-0" style={{ background: route.color }} />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white">{route.label}</span>
                    {i === 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: "rgba(59,130,246,0.18)", color: "#60a5fa" }}>
                        AI Pick
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-white/38">{route.distance} · {route.traffic}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: route.color }}>{route.time}</span>
              </button>
            ))}
          </div>

          <motion.button
            className="py-3 rounded-xl text-sm font-semibold text-white flex-shrink-0 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #06b6d4)", opacity: isNavigating ? 0.7 : 1 }}
            whileTap={{ scale: 0.97 }}
            onClick={startNavigation}
            disabled={isNavigating}
          >
            {isNavigating ? "Navigating..." : "Start Navigation"}
          </motion.button>
        </div>

        {/* Map */}
        <div className="lg:col-span-2 h-[40dvh] lg:h-auto flex-shrink-0 lg:flex-shrink">
          <ColomboMap showTraffic={true} showParking={false} selectedPin={null} onPinSelect={() => { }} directionsResponse={directionsResponse} trafficData={trafficData} parkingData={parkingData} incidents={incidents} />
        </div>
      </div>
    </div>
  );
}

// ── Analytics View ────────────────────────────────────────────────────────────

function AnalyticsView({ trafficData, parkingData }: { trafficData: any[], parkingData: any[] }) {
  const [trafficHistory, setTrafficHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/traffic/history?hours=15`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length) {
          setTrafficHistory(data);
        }
      })
      .catch(err => console.error("Traffic history fetch error:", err));
  }, []);

  // Compute live KPIs
  const totalVehicles = trafficData.reduce((acc, t) => acc + (t.intensity * 24142), 0);
  const avgCongestion = trafficData.length > 0 ? Math.round((trafficData.reduce((acc, t) => acc + t.intensity, 0) / trafficData.length) * 100) : 0;
  const trafficIncidents = trafficData.filter(t => t.intensity > 0.8).length;

  const totalSlots = parkingData.reduce((acc, p) => acc + p.total, 0);
  const availableSlots = parkingData.reduce((acc, p) => acc + p.available, 0);
  const occupiedSlots = totalSlots - availableSlots;
  const parkingTransactions = occupiedSlots * 3; // Estimated daily turnover

  const kpis = [
    { label: "Vehicles Today", value: totalVehicles.toLocaleString(undefined, { maximumFractionDigits: 0 }), change: "+8.2%", up: true },
    { label: "Parking Transactions", value: parkingTransactions.toLocaleString(undefined, { maximumFractionDigits: 0 }), change: "+14.1%", up: true },
    { label: "Avg Congestion", value: `${avgCongestion}%`, change: "+3%", up: false },
    { label: "Traffic Incidents", value: trafficIncidents.toString(), change: "-3 vs avg", up: true },
  ];

  // Compute live Zone chart data
  const liveZoneData = (parkingData || []).slice(0, 6).map(p => {
    let nearestCongestion = 0;
    if (trafficData && trafficData.length > 0) {
      let minDist = Infinity;
      trafficData.forEach(t => {
        const dist = Math.sqrt(Math.pow(t.lat - p.lat, 2) + Math.pow(t.lng - p.lng, 2));
        if (dist < minDist) {
          minDist = dist;
          nearestCongestion = t.intensity * 100;
        }
      });
    }

    return {
      zone: p.name.split(' ')[0],
      congestion: Math.round(nearestCongestion),
      parking: Math.round(((p.total - p.available) / p.total) * 100)
    };
  });

  return (
    <div className="h-full flex flex-col gap-4 p-4 lg:p-6 overflow-y-auto">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
        {kpis.map((kpi, i) => (
          <GlassCard key={i} className="p-4">
            <p className="text-[10px] text-white/35 uppercase tracking-widest mb-2 font-medium">{kpi.label}</p>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className={`text-[11px] mt-1 font-mono flex items-center gap-0.5 ${kpi.up ? "text-emerald-400" : "text-amber-400"}`}>
              {kpi.up ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
              {kpi.change}
            </p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Traffic density chart */}
        <GlassCard className="p-5">
          <p className="text-[11px] font-semibold text-white/45 uppercase tracking-widest mb-4">Traffic Density — Today</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trafficHistory} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="gDensity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#ffffff07" strokeDasharray="3 4" />
              <XAxis dataKey="time" tick={{ fill: "#ffffff28", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#ffffff28", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="density" name="Actual" stroke="#ef4444" strokeWidth={1.5} fill="url(#gDensity)" dot={false} />
              <Area type="monotone" dataKey="predicted" name="Predicted" stroke="#3b82f6" strokeWidth={1.5} fill="url(#gPredicted)" strokeDasharray="4 2" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-red-500 rounded" /><span className="text-[10px] text-white/35">Actual</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-blue-500 rounded" style={{ background: "repeating-linear-gradient(90deg, #3b82f6 0, #3b82f6 4px, transparent 4px, transparent 6px)" }} /><span className="text-[10px] text-white/35">AI Predicted</span></div>
          </div>
        </GlassCard>

        {/* Parking utilization */}
        <GlassCard className="p-5">
          <p className="text-[11px] font-semibold text-white/45 uppercase tracking-widest mb-4">Parking Utilization — Today</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={parkingChartData} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="gPark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.88} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.28} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#ffffff07" strokeDasharray="3 4" />
              <XAxis dataKey="hour" tick={{ fill: "#ffffff28", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#ffffff28", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="utilized" name="Utilized %" fill="url(#gPark)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Zone breakdown */}
        <GlassCard className="p-5 lg:col-span-2">
          <p className="text-[11px] font-semibold text-white/45 uppercase tracking-widest mb-4">Zone-level Congestion vs Parking Utilization</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={liveZoneData} margin={{ top: 0, right: 0, left: -22, bottom: 0 }} barGap={3}>
              <CartesianGrid stroke="#ffffff07" strokeDasharray="3 4" />
              <XAxis dataKey="zone" tick={{ fill: "#ffffff38", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#ffffff28", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="congestion" name="Congestion %" fill="rgba(239,68,68,0.55)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="parking" name="Parking %" fill="rgba(16,185,129,0.55)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-[2px]" style={{ background: "rgba(239,68,68,0.55)" }} /><span className="text-[10px] text-white/35">Congestion</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-[2px]" style={{ background: "rgba(16,185,129,0.55)" }} /><span className="text-[10px] text-white/35">Parking</span></div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}


// ── EV View ───────────────────────────────────────────────────────────────────
function EVView({ parkingData, onNavigate, trafficData, incidents }: any) {
  const [search, setSearch] = useState("");
  const [selectedPin, setSelectedPin] = useState<number | null>(null);

  const filtered = parkingData.filter((p: any) => p.has_ev).filter((p: any) => {
    if (!search) return true;
    return p.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="size-full flex flex-col lg:flex-row relative bg-[#020509]">
      {/* Side/Top panel */}
      <div className="w-full lg:w-[380px] flex flex-col bg-[#060a14] border-b lg:border-b-0 lg:border-r border-white/10 z-10 relative" style={{ maxHeight: '55dvh', minHeight: '55dvh' }}>
        <div className="flex flex-col lg:hidden" style={{ maxHeight: '55dvh' }}>
          <div className="p-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)" }}>
                <Zap size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">EV Chargers</h2>
                <p className="text-xs font-medium text-white/50">Find available charging ports</p>
              </div>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search EV stations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-sky-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 overscroll-contain">
            {filtered.map((loc: any) => (
              <GlassCard
                key={loc.id}
                className={`p-3 flex flex-col gap-2 transition-colors cursor-pointer ${selectedPin === loc.id ? 'border-sky-500/50 bg-white/[0.03]' : ''}`}
                onClick={() => setSelectedPin(loc.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-sm">{loc.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin size={10} className="text-sky-400" />
                      <span className="text-[10px] text-white/50">{loc.distance ? `${(loc.distance / 1000).toFixed(1)} km away` : 'Nearby'}</span>
                    </div>
                  </div>
                  {loc.ev_available > 0 ? (
                    <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md uppercase">Available</div>
                  ) : (
                    <div className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-md uppercase">Full</div>
                  )}
                </div>
                <div className="flex items-center gap-4 bg-black/20 p-2 rounded-lg border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Available</span>
                    <span className="text-lg font-bold text-emerald-400">{loc.ev_available || 0}</span>
                  </div>
                  <div className="w-[1px] h-7 bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Total Ports</span>
                    <span className="text-lg font-bold text-white/80">{loc.ev_total || 2}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate(loc.name); }}
                  className="w-full py-2 rounded-lg text-xs font-semibold text-white transition-all active:scale-[0.98]"
                  style={{ background: loc.ev_available > 0 ? "linear-gradient(135deg, #0ea5e9, #0284c7)" : "rgba(255,255,255,0.05)", opacity: loc.ev_available > 0 ? 1 : 0.5 }}>
                  {loc.ev_available > 0 ? "Navigate Here" : "Currently Full"}
                </button>
              </GlassCard>
            ))}
            {filtered.length === 0 && (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <Zap size={20} className="text-white/10 mb-2" />
                <p className="text-xs text-white/40">No EV charging stations found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop side panel */}
        <div className="hidden lg:flex flex-col h-full">
          <div className="p-5 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)" }}>
                <Zap size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">EV Chargers</h2>
                <p className="text-xs font-medium text-white/50">Find available charging ports</p>
              </div>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search EV stations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-sky-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
            {filtered.map((loc: any) => (
              <GlassCard
                key={loc.id}
                className={`p-4 flex flex-col gap-3 transition-colors cursor-pointer ${selectedPin === loc.id ? 'border-sky-500/50 bg-white/[0.03]' : ''}`}
                onClick={() => setSelectedPin(loc.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-sm">{loc.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin size={11} className="text-sky-400" />
                      <span className="text-[11px] text-white/50">{loc.distance ? `${(loc.distance / 1000).toFixed(1)} km away` : 'Nearby'}</span>
                    </div>
                  </div>
                  {loc.ev_available > 0 ? (
                    <div className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md uppercase">Available</div>
                  ) : (
                    <div className="px-2 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-md uppercase">Full</div>
                  )}
                </div>
                <div className="flex items-center gap-4 bg-black/20 p-2.5 rounded-lg border border-white/5 mt-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Available</span>
                    <span className="text-xl font-bold text-emerald-400">{loc.ev_available || 0}</span>
                  </div>
                  <div className="w-[1px] h-8 bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Total Ports</span>
                    <span className="text-xl font-bold text-white/80">{loc.ev_total || 2}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate(loc.name); }}
                  className="w-full mt-2 py-2 rounded-lg text-xs font-semibold text-white transition-all"
                  style={{ background: loc.ev_available > 0 ? "linear-gradient(135deg, #0ea5e9, #0284c7)" : "rgba(255,255,255,0.05)", opacity: loc.ev_available > 0 ? 1 : 0.5 }}>
                  {loc.ev_available > 0 ? "Navigate Here" : "Currently Full"}
                </button>
              </GlassCard>
            ))}
            {filtered.length === 0 && (
              <div className="py-10 flex flex-col items-center justify-center text-center">
                <Zap size={24} className="text-white/10 mb-3" />
                <p className="text-xs text-white/40">No EV charging stations found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main map area */}
      <div className="flex-1 h-full relative" style={{ minHeight: '45dvh' }}>
        <ColomboMap
          showTraffic={false}
          showParking={false}
          showEV={true}
          selectedPin={selectedPin}
          onPinSelect={setSelectedPin}
          trafficData={trafficData}
          parkingData={parkingData}
          incidents={incidents}
        />
      </div>
    </div>
  );
}

// ── AI View ───────────────────────────────────────────────────────────────────


const aiResponses = [
  "Based on historical traffic data and current sensor readings, I recommend departing within the next 15 minutes via Baseline Road. The A4 corridor shows 78% density — it will peak at 94% around 5:45 PM. Expected travel time: 22 min now vs 38 min at peak.",
  "Fort City Parking currently has 24 free spaces and is the closest option at 0.3 km. Based on current booking patterns, I estimate 87% fill probability within the next 40 minutes. I recommend reserving now at LKR 80/hr.",
  "Tonight between 8–10 PM, traffic is expected to be lighter than usual. Historical data for Saturday evenings shows a 30% reduction in Galle Road density. Ideal departure window is 8:15–8:45 PM.",
  "I found 3 EV charging stations within 2 km: LAUGFS EV at WTC (Level 2, available), Lak Sathosa charging point at Liberty Plaza (available), and Ceylon Electricity Board station at Galle Face (occupied, estimated wait 25 min).",
];

function AIView() {
  const [messages, setMessages] = useState<{ id: number, role: "ai" | "user", text: string }[]>([
    { id: 1, role: "ai", text: "Hello! I am ColomboFlow AI — your intelligent city co-pilot. I can predict traffic, recommend parking, plan optimal routes, and monitor live city conditions across Colombo. How can I help you?" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const newMessages = [...messages, { id: Date.now(), role: "user" as const, text }];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.text })) })
      });
      const data = await response.json();
      setMessages([...newMessages, { id: Date.now() + 1, role: "ai", text: data.reply || "No response received." }]);
    } catch (err) {
      setMessages([...newMessages, { id: Date.now() + 1, role: "ai", text: "Error connecting to AI service." }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const handleTrafficUpdate = (data: any[]) => {
      const severe = data.find((d: any) => d.congestion_level >= 5);
      if (severe) {
        setMessages(prev => {
          // Avoid spamming the same warning repeatedly
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.text.includes("Severe congestion detected")) return prev;

          return [...prev, {
            id: Date.now(),
            role: "ai",
            text: `⚠️ Live Alert: Severe congestion detected at zone ${severe.road_segment_id.substring(0, 4)}. Re-routing is highly recommended.`
          }];
        });
      }
    };
    socket.on('traffic_update', handleTrafficUpdate);
    return () => {
      socket.off('traffic_update', handleTrafficUpdate);
    };
  }, []);

  return (
    <div className="h-full flex flex-col gap-3 p-3 lg:p-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0ea5e9, #06b6d4)" }}>
          <Bot size={17} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">ColomboFlow AI</h3>
          <div className="flex items-center gap-1.5">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
            <span className="text-[11px] text-white/35">Online · real-time city data</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-0">
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {msg.role === "ai" && (
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                style={{ background: "linear-gradient(135deg, #0ea5e9, #06b6d4)" }}>
                <Bot size={12} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
              style={{
                background: msg.role === "user"
                  ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
                  : "rgba(255,255,255,0.05)",
                border: msg.role === "ai" ? "1px solid rgba(255,255,255,0.07)" : "none",
                color: msg.role === "user" ? "#ffffff" : "rgba(240,244,255,0.82)",
              }}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #06b6d4)" }}>
              <Bot size={12} className="text-white" />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-4 py-3"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.13 }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0 scrollbar-none">
        {quickSuggestions.map(s => (
          <button key={s} onClick={() => sendMessage(s)}
            className="px-2.5 py-1.5 rounded-full text-[11px] transition-colors flex-shrink-0 active:scale-95"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage(input)}
          placeholder="Ask about traffic, parking, routes..."
          className="flex-1 bg-transparent text-sm text-white outline-none"
          style={{ "::placeholder": { color: "rgba(255,255,255,0.22)" } } as React.CSSProperties}
        />
        <motion.button
          onClick={() => sendMessage(input)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-all"
          style={{ background: input.trim() ? "linear-gradient(135deg, #0ea5e9, #06b6d4)" : "rgba(255,255,255,0.07)" }}
          whileHover={input.trim() ? { scale: 1.08 } : {}}
        >
          <Send size={13} />
        </motion.button>
      </div>
    </div>
  );
}

// ── Weather View ──────────────────────────────────────────────────────────────

function WeatherView({ weatherData, newsData = [] }: { weatherData: any, newsData?: any[] }) {
  const rainfall = weatherData?.rain ? weatherData.rain['1h'] || 0 : 0;
  const temp = weatherData?.main?.temp ? Math.round(weatherData.main.temp) : '--';
  const desc = weatherData?.weather?.[0]?.description || 'Unknown';
  const humidity = weatherData?.main?.humidity ? `${weatherData.main.humidity}%` : '--';
  const windSpeed = weatherData?.wind?.speed ? `${weatherData.wind.speed} km/h` : '--';
  const visibility = weatherData?.visibility ? `${(weatherData.visibility / 1000).toFixed(1)} km` : '--';

  const warnings = [];
  if (rainfall > 10) {
    warnings.push("Heavy rain detected. Low-lying areas (e.g., Armour Street, Thummulla) may be waterlogged. Proceed with caution.");
  }

  return (
    <div className="h-full p-4 lg:p-8 flex flex-col gap-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-white">Weather Center</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <GlassCard className="p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-400">
            <CloudRain size={20} />
            <span className="font-semibold text-sm">Conditions</span>
          </div>
          <span className="text-3xl font-bold text-white capitalize">{desc}</span>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-orange-400">
            <Sun size={20} />
            <span className="font-semibold text-sm">Temperature</span>
          </div>
          <span className="text-3xl font-bold text-white">{temp}°C</span>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-cyan-400">
            <Droplets size={20} />
            <span className="font-semibold text-sm">Rainfall (1h)</span>
          </div>
          <span className="text-3xl font-bold text-white">{rainfall} mm</span>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-teal-400">
            <Droplets size={20} />
            <span className="font-semibold text-sm">Humidity</span>
          </div>
          <span className="text-3xl font-bold text-white">{humidity}</span>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-indigo-400">
            <Wind size={20} />
            <span className="font-semibold text-sm">Wind Speed</span>
          </div>
          <span className="text-3xl font-bold text-white">{windSpeed}</span>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-purple-400">
            <Eye size={20} />
            <span className="font-semibold text-sm">Visibility</span>
          </div>
          <span className="text-3xl font-bold text-white">{visibility}</span>
        </GlassCard>
      </div>

      {warnings.length > 0 ? (
        <div className="flex flex-col gap-3 p-5 rounded-2xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle size={20} />
            <span className="text-lg font-bold uppercase tracking-wide">Active Weather & Flood Warnings</span>
          </div>
          <ul className="text-sm text-red-300/90 list-disc pl-5 space-y-1">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      ) : (
        <div className="flex items-center justify-center p-8 rounded-2xl border border-white/5 bg-white/5">
          <span className="text-white/50 text-sm">No active weather warnings.</span>
        </div>
      )}

      {/* Latest Weather News Section */}
      <div className="flex flex-col gap-4 mt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          📰 Live Weather News
        </h2>
        {newsData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {newsData.map((item, idx) => (
              <a key={idx} href={item.link} target="_blank" rel="noreferrer"
                className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <h3 className="text-sm font-semibold text-blue-100 line-clamp-2">{item.title}</h3>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[10px] text-white/50 bg-white/10 px-2 py-0.5 rounded">{item.source}</span>
                  <span className="text-[10px] text-white/40">{new Date(item.pubDate).toLocaleDateString()}</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
            <span className="text-sm text-white/40">Fetching latest headlines...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Auth Modal ────────────────────────────────────────────────────────────────

function AuthModal({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let endpoint = isLogin ? "/auth/login" : "/auth/register";
      let body: any = isLogin ? { email, password } : { name, email, password, phone };

      if (!isLogin && otpStep) {
        endpoint = "/auth/verify-registration";
        body = { ...body, code: otpCode };
      }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      if (!isLogin && !otpStep) {
        // OTP was sent successfully
        setOtpStep(true);
        toast.success("OTP sent to your phone!");
      } else {
        // Successfully logged in or verified
        onLogin(data.token, data.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(2,5,9,0.85)", backdropFilter: "blur(12px)" }}>
      <GlassCard className="w-full max-w-sm p-6 flex flex-col gap-5" style={{ background: "rgba(10,16,32,0.95)" }}>
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            {isLogin ? "Welcome Back" : (otpStep ? "Verify Phone" : "Create Account")}
          </h2>
          <p className="text-xs text-white/50">
            {isLogin ? "Sign in to access your dashboard" : (otpStep ? "Enter the 6-digit code sent via SMS" : "Join ColomboFlow")}
          </p>
        </div>

        {error && <div className="p-2.5 rounded-lg text-xs text-red-400" style={{ background: "rgba(239,68,68,0.1)" }}>{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {!isLogin && !otpStep && (
            <>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="Full Name"
                className="rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/40 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }} />
              <input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="Phone Number (+94...)"
                className="rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/40 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }} />
            </>
          )}
          {!isLogin && otpStep && (
            <input value={otpCode} onChange={e => setOtpCode(e.target.value)} required placeholder="6-digit OTP Code"
              className="rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/40 transition-colors text-center tracking-[0.5em] font-mono"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }} />
          )}
          {(!otpStep || isLogin) && (
            <>
              <input value={email} onChange={e => setEmail(e.target.value)} required type="email" placeholder="Email Address"
                className="rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/40 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }} />
              <input value={password} onChange={e => setPassword(e.target.value)} required type="password" placeholder="Password"
                className="rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/40 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }} />
            </>
          )}

          <motion.button type="submit" disabled={loading}
            className="mt-2 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #06b6d4)", opacity: loading ? 0.7 : 1 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {loading ? "Please wait..." : (isLogin ? "Sign In" : (otpStep ? "Verify & Register" : "Sign Up"))}
          </motion.button>
        </form>

        <p className="text-center text-xs text-white/50">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-blue-400 font-medium hover:underline">
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </GlassCard>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [navigateTarget, setNavigateTarget] = useState<string | undefined>();
  const [time, setTime] = useState(new Date());
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem("user") || "null"));


  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [parkingData, setParkingData] = useState<any[]>(mapParkingPins);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string>("Loading AI prediction...");
  const [weatherData, setWeatherData] = useState<any>(null);
  const [newsData, setNewsData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([
    { id: 1, type: "info", title: "System Online", desc: "Live monitoring active for Colombo City", time: "just now" }
  ]);
  const [preferCovered, setPreferCovered] = useState(false);

  // Helper to re-fetch parking (called on load + every 30s)
  const fetchParking = React.useCallback(async () => {
    try {
      const parkingRes = await fetch(`${API_BASE_URL}/parking/nearby?lat=6.9271&lon=79.8612&radius=5000&preferCovered=${preferCovered}`);
      if (parkingRes.ok) {
        const data = await parkingRes.json();
        if (data && data.length) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            lat: d.lat || 6.9271 + (Math.random() - 0.5) * 0.04,
            lng: d.lon || 79.8612 + (Math.random() - 0.5) * 0.04,
            available: d.available_slots !== undefined ? d.available_slots : d.available,
            total: d.total_slots || d.total,
            name: d.name,
            has_ev: d.has_ev,
            ev_total: d.ev_total,
            ev_available: d.ev_available,
            price: d.price_per_hour,
            price_per_hour: d.price_per_hour,
            distance: d.distance,
            type: d.is_covered ? 'Covered' : 'Open',
            rating: 4.5 // fallback rating
          }));
          setParkingData(mapped);
        }
      }
    } catch (e) {
      // Silently keep current data
    }
  }, [preferCovered]);

  useEffect(() => {
    fetchParking();
    const parkingRefreshInterval = setInterval(fetchParking, 30_000);
    return () => clearInterval(parkingRefreshInterval);
  }, [fetchParking]);

  useEffect(() => {
    const parseTrafficData = (data: any[]) => {
      return data.map((d: any) => {
        let lat = 6.9271 + (Math.random() - 0.5) * 0.05;
        let lng = 79.8612 + (Math.random() - 0.5) * 0.05;
        if (d.geom) {
          const match = d.geom.match(/LINESTRING\(([^ ]+) ([^ ,]+)/);
          if (match) {
            lng = parseFloat(match[1]);
            lat = parseFloat(match[2]);
          }
        }
        return {
          lat,
          lng,
          r: d.speed_kmh < 20 ? 45 : (d.speed_kmh < 40 ? 30 : 20),
          intensity: d.congestion_level / 5
        };
      });
    };

    // Socket: live traffic updates
    socket.on('traffic_update', (data: any[]) => {
      if (Array.isArray(data) && data.length) {
        setTrafficData(parseTrafficData(data));
        const severe = data.find((d: any) => d.congestion_level >= 5);
        if (severe) {
          setAlerts(prev => {
            const newAlert = {
              id: Date.now(),
              type: "warning" as const,
              title: "Severe Congestion Detected",
              desc: `Traffic standstill near ${severe.road_segment_id.substring(0, 8)}`,
              time: "now"
            };
            return [newAlert, ...prev].slice(0, 3);
          });
        }
      }
    });

    // Socket: real-time incident broadcasts
    socket.on('new_incident', (incident: any) => {
      setIncidents(prev => {
        // Avoid duplicate incidents
        if (prev.find(i => i.id === incident.id)) return prev;
        return [incident, ...prev];
      });
      setAlerts(prev => {
        const typeLabel = incident.type.charAt(0).toUpperCase() + incident.type.slice(1);
        return [{
          id: Date.now(),
          type: "warning" as const,
          title: `${typeLabel} Reported`,
          desc: `New incident at (${incident.lat?.toFixed(3)}, ${incident.lon?.toFixed(3)})`,
          time: "just now"
        }, ...prev].slice(0, 5);
      });
      toast.error(`⚠️ Incident: ${incident.type} reported nearby!`, { duration: 4000 });
    });

    // Fetch all initial data
    const fetchInitialData = async () => {
      try {
        // Initial Traffic
        const trafficRes = await fetch(`${API_BASE_URL}/traffic/live`);
        if (trafficRes.ok) {
          const data = await trafficRes.json();
          if (Array.isArray(data) && data.length) {
            setTrafficData(parseTrafficData(data));
          }
        }

        // Weather
        const weatherRes = await fetch(`${API_BASE_URL}/weather/colombo`);
        if (weatherRes.ok) {
          const data = await weatherRes.json();
          setWeatherData(data);
        }

        // Weather News
        const newsRes = await fetch(`${API_BASE_URL}/weather/news`);
        if (newsRes.ok) {
          const data = await newsRes.json();
          setNewsData(data);
        }

        // Active incidents
        const incidentRes = await fetch(`${API_BASE_URL}/incidents`);
        if (incidentRes.ok) {
          const data = await incidentRes.json();
          if (Array.isArray(data) && data.length) {
            setIncidents(data);
            if (data.length > 0) {
              setAlerts(prev => [
                { id: Date.now(), type: "warning" as const, title: `${data.length} Active Incident${data.length > 1 ? 's' : ''}`, desc: `${data[0].type} reported in Colombo`, time: new Date(data[0].created_at).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' }) },
                ...prev
              ].slice(0, 5));
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch initial data', e);
      }
    };
    fetchInitialData();

    // Fetch AI departure advice
    fetch(`${API_BASE_URL}/route/departure-time?origin=Fort&destination=Kollupitiya`)
      .then(res => res.json())
      .then(data => {
        if (data && data.aiAdvice) {
          setAiAdvice(data.aiAdvice);
        }
      })
      .catch(err => {
        console.error("AI Advice error:", err);
        setAiAdvice("Unable to fetch AI prediction at this time.");
      });

    return () => {
      socket.off('traffic_update');
      socket.off('new_incident');
    };
  }, []);


  const handleLogin = (t: string, u: any) => {
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const viewLabels: Record<View, string> = {
    dashboard: "City Dashboard",
    parking: "Smart Parking",
    navigate: "Navigate",
    analytics: "Analytics",
    ai: "AI Assistant",
    ev: "EV Chargers",
    weather: "Weather Center",
    insights: "AI Insights"
  };

  const viewComponents = React.useMemo<Record<View, React.ReactNode>>(() => ({
    dashboard: <DashboardView onNavigate={() => setView("navigate")} trafficData={trafficData} parkingData={parkingData} incidents={incidents} aiAdvice={aiAdvice} weatherData={weatherData} alerts={alerts} />,
    parking: <ParkingView trafficData={trafficData} parkingData={parkingData} incidents={incidents} token={token} preferCovered={preferCovered} setPreferCovered={setPreferCovered} />,
    navigate: <NavigateView trafficData={trafficData} parkingData={parkingData} incidents={incidents} initialDest={navigateTarget} />,
    analytics: <AnalyticsView trafficData={trafficData} parkingData={parkingData} />,
    ai: <AIView />,
    ev: <EVView parkingData={parkingData} onNavigate={(name?: string) => { setNavigateTarget(name); setView("navigate"); }} trafficData={trafficData} incidents={incidents} />,
    weather: <WeatherView weatherData={weatherData} newsData={newsData} />,
    insights: <InsightsPage trafficData={trafficData} parkingData={parkingData} weatherData={weatherData} />,
  }), [trafficData, parkingData, incidents, aiAdvice, weatherData, alerts, token, navigateTarget, preferCovered, newsData]);

  return (
    <div className="h-[100dvh] flex" style={{ background: "#05070f", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f0f4ff" }}>
      <Toaster theme="dark" position="bottom-right" />
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0"
        style={{ background: "rgba(6,10,20,0.97)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #06b6d4)" }}>
              <Navigation2 size={15} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-wide">ColomboFlow</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5">
          {navItems.map(({ id, label, Icon }) => {
            const active = view === id;
            return (
              <motion.button
                key={id}
                onClick={() => setView(id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-colors relative"
                style={{
                  background: active ? "rgba(14,165,233,0.11)" : "transparent",
                  color: active ? "#0ea5e9" : "rgba(255,255,255,0.42)",
                  border: `1px solid ${active ? "rgba(14,165,233,0.18)" : "transparent"}`,
                }}
                whileHover={!active ? { x: 2 } : {}}
              >
                <Icon size={15} />
                {label}
                {active && (
                  <motion.div
                    className="absolute right-2.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: "#0ea5e9" }}
                    layoutId="sidebarIndicator"
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5 mb-3 cursor-pointer group" onClick={handleLogout}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white transition-colors group-hover:bg-red-500/20"
              style={{ background: "linear-gradient(135deg, #374151, #1f2937)" }}>
              {user ? user.name[0].toUpperCase() : "U"}
            </div>
            <div>
              <p className="text-xs font-semibold text-white/80 group-hover:text-red-400 transition-colors">{user ? user.name : "User"}</p>
              <p className="text-[10px] text-white/30 group-hover:text-red-400/70 transition-colors">Logout</p>
            </div>
          </div>
          <p className="text-[10px] font-mono" style={{ color: "rgba(240,244,255,0.2)" }}>
            {time.toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {!token && <AuthModal onLogin={handleLogin} />}
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-3 flex-shrink-0"
          style={{ background: "rgba(6,10,20,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold text-white/90">{viewLabels[view]}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold"
              style={{ background: "rgba(16,185,129,0.12)", color: "#34d399" }}>
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              onClick={() => toast("Global search is currently offline.")}>
              <Search size={12} className="text-white/35" />
              <span className="text-xs text-white/30">Search city...</span>
              <span className="text-[10px] px-1 py-0.5 rounded font-mono text-white/20"
                style={{ background: "rgba(255,255,255,0.08)" }}>⌘K</span>
            </div>

          </div>
        </header>

        {/* View */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {viewComponents[view]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden flex flex-shrink-0"
          style={{
            background: "rgba(6,10,20,0.99)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)"
          }}>
          {navItems.map(({ id, label, Icon }) => {
            const active = view === id;
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 relative transition-colors"
                style={{
                  color: active ? "#0ea5e9" : "rgba(255,255,255,0.32)",
                  minHeight: '56px'
                }}
              >
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full" style={{ background: "#0ea5e9" }} />
                )}
                <Icon size={20} />
                <span className="text-[9px] font-semibold tracking-wide">{label}</span>
              </button>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
