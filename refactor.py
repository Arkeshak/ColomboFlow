import re
import os

with open('client/src/app/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update DashboardView signature
content = re.sub(
    r'function DashboardView\(\{ onNavigate \}: \{ onNavigate\?: \(\) => void \}\) \{',
    '''function DashboardView({ 
  onNavigate, trafficData, parkingData, incidents, aiAdvice, weatherData, alerts 
}: { 
  onNavigate?: () => void;
  trafficData: any[];
  parkingData: any[];
  incidents: any[];
  aiAdvice: string;
  weatherData: any;
  alerts: any[];
}) {''',
    content
)

# 2. Extract and remove state from DashboardView
state_regex = r'(  const \[showTraffic, setShowTraffic\] = useState\(true\);\n  const \[showParking, setShowParking\] = useState\(true\);\n  const \[selectedPin, setSelectedPin\] = useState<number \| null>\(null\);\n)(.*?)(\n  // Dynamic calculations based on live backend data)'
match = re.search(state_regex, content, re.DOTALL)
if match:
    state_block = match.group(2)
    # Replace in DashboardView to just have showTraffic, showParking, showEV, selectedPin
    content = content[:match.start()] + '''  const [showTraffic, setShowTraffic] = useState(true);
  const [showParking, setShowParking] = useState(true);
  const [showEV, setShowEV] = useState(false);
  const [selectedPin, setSelectedPin] = useState<number | null>(null);
''' + match.group(3) + content[match.end():]
    
    # 3. Add extracted state to App
    app_regex = r'(export default function App\(\) \{\n  const \[view, setView\] = useState<View>\("dashboard"\);\n  const \[time, setTime\] = useState\(new Date\(\)\);\n  const \[token, setToken\] = useState<string \| null>\(localStorage.getItem\("token"\)\);\n  const \[user, setUser\] = useState<any>\(JSON.parse\(localStorage.getItem\("user"\) \|\| "null"\)\);\n)'
    content = re.sub(
        app_regex,
        r'\1\n' + state_block.replace('\n', '\n  ') + '\n',
        content
    )
else:
    print("Could not find DashboardView state block")

# 4. Update viewComponents in App
view_components_old = r'''  const viewComponents: Record<View, React.ReactNode> = \{
    dashboard: <DashboardView onNavigate=\{\(\) => setView\("navigate"\)\} />,
    parking: <ParkingView trafficData=\{trafficHeatmap\} parkingData=\{mapParkingPins\} incidents=\{\[\]\} />,
    navigate: <NavigateView trafficData=\{trafficHeatmap\} parkingData=\{mapParkingPins\} incidents=\{\[\]\} />,
    analytics: <AnalyticsView trafficData=\{trafficHeatmap\} parkingData=\{mapParkingPins\} />,
    ai: <AIView />,
  \};'''

view_components_new = '''  const viewComponents: Record<View, React.ReactNode> = {
    dashboard: <DashboardView onNavigate={() => setView("navigate")} trafficData={trafficData} parkingData={parkingData} incidents={incidents} aiAdvice={aiAdvice} weatherData={weatherData} alerts={alerts} />,
    parking: <ParkingView trafficData={trafficData} parkingData={parkingData} incidents={incidents} />,
    navigate: <NavigateView trafficData={trafficData} parkingData={parkingData} incidents={incidents} />,
    analytics: <AnalyticsView trafficData={trafficData} parkingData={parkingData} />,
    ai: <AIView />,
  };'''

content = re.sub(view_components_old, view_components_new, content)

# 5. Update Layers toggle in DashboardView
layers_old = r'''            \{\[
              \{ label: "Traffic", active: showTraffic, toggle: \(\) => setShowTraffic\(v => !v\), color: "#ef4444" \},
              \{ label: "Parking", active: showParking, toggle: \(\) => setShowParking\(v => !v\), color: "#10b981" \},
            \].map\(l => \('''

layers_new = '''            {[
              { label: "Traffic", active: showTraffic, toggle: () => setShowTraffic(v => !v), color: "#ef4444" },
              { label: "Parking", active: showParking, toggle: () => setShowParking(v => !v), color: "#10b981" },
              { label: "EV Chargers", active: showEV, toggle: () => setShowEV(v => !v), color: "#0ea5e9" },
            ].map(l => ('''
content = re.sub(layers_old, layers_new, content)

# 6. Add showEV to ColomboMap inside DashboardView
map_call_old = r'''            <ColomboMap 
              showTraffic=\{showTraffic\} 
              showParking=\{showParking\} 
              selectedPin=\{selectedPin\} 
              onPinSelect=\{setSelectedPin\} 
              trafficData=\{trafficData\} 
              parkingData=\{parkingData\} 
              incidents=\{incidents\} 
            />'''
map_call_new = '''            <ColomboMap 
              showTraffic={showTraffic} 
              showParking={showParking} 
              showEV={showEV}
              selectedPin={selectedPin} 
              onPinSelect={setSelectedPin} 
              trafficData={trafficData} 
              parkingData={parkingData} 
              incidents={incidents} 
            />'''
content = re.sub(map_call_old, map_call_new, content)

with open('client/src/app/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
