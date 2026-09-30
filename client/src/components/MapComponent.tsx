import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Navigation, MapPin, Compass, Layers, AlertCircle } from 'lucide-react';

export interface MapMarker {
  position: { lat: number; lng: number };
  title?: string;
  type?: 'field' | 'tractor' | 'operator';
  color?: string;
}

export interface MapPolyline {
  path: Array<{ lat: number; lng: number }>;
  color?: string;
}

interface MapComponentProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  polylines?: MapPolyline[];
  onMarkerClick?: (marker: MapMarker) => void;
  className?: string;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  center,
  zoom = 15,
  markers = [],
  polylines = [],
  onMarkerClick,
  className = 'h-96 w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [googleMapLoaded, setGoogleMapLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setLoadError('Google Maps API key not set. Using FarmFleet Real-time Vector Radar.');
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
    });

    (loader as any)
      .load()
      .then(() => {
        if (!mapRef.current) return;
        const google = (window as any).google;
        if (!google || !google.maps) return;
        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeId: 'hybrid', // Satellite view for agriculture
          disableDefaultUI: false,
          zoomControl: true,
        });

        // Markers
        markers.forEach(m => {
          const marker = new google.maps.Marker({
            position: m.position,
            map,
            title: m.title,
            icon:
              m.type === 'tractor'
                ? {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 6,
                    fillColor: '#ea580c',
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#ffffff',
                    rotation: 45,
                  }
                : undefined,
          });

          if (onMarkerClick) {
            marker.addListener('click', () => onMarkerClick(m));
          }
        });

        // Polylines
        polylines.forEach(p => {
          new google.maps.Polyline({
            path: p.path,
            geodesic: true,
            strokeColor: p.color || '#ea580c',
            strokeOpacity: 0.9,
            strokeWeight: 4,
            map,
          });
        });

        setGoogleMapLoaded(true);
      })
      .catch((err: any) => {
        console.warn('Google Maps JS API load error, using high-contrast vector fallback:', err);
        setLoadError('Google Maps JS API restricted/offline. Running Vector Radar HUD.');
      });
  }, [apiKey, center.lat, center.lng, markers, polylines]);

  // Vector radar fallback rendering on canvas
  useEffect(() => {
    if (googleMapLoaded || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw field terrain / satellite background
    ctx.fillStyle = '#1c241b'; // Deep agricultural crop field green
    ctx.fillRect(0, 0, width, height);

    // Draw agricultural grid lines (representing agricultural field borders)
    ctx.strokeStyle = '#2d3d2a';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Mapping lat/lng to canvas space around center
    const scale = 30000;
    const toCanvasX = (lng: number) => width / 2 + (lng - center.lng) * scale;
    const toCanvasY = (lat: number) => height / 2 - (lat - center.lat) * scale;

    // Draw polylines
    polylines.forEach(poly => {
      if (poly.path.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = poly.color || '#f97316';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      poly.path.forEach((pt, idx) => {
        const x = toCanvasX(pt.lng);
        const y = toCanvasY(pt.lat);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    // Draw markers
    markers.forEach(m => {
      const x = toCanvasX(m.position.lng);
      const y = toCanvasY(m.position.lat);

      if (m.type === 'tractor') {
        // Outer pulsing radar ring
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(234, 88, 12, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner tractor pin
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = '#ea580c';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Label
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(m.title || 'Tractor (Live)', x + 15, y + 4);
      } else {
        // Field marker pin
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillStyle = '#93c5fd';
        ctx.fillText(m.title || 'Assigned Field', x + 12, y + 4);
      }
    });
  }, [googleMapLoaded, center, markers, polylines]);

  return (
    <div className={`relative ${className} bg-slate-900`}>
      {/* Real Google Maps Container */}
      <div ref={mapRef} className={`w-full h-full ${googleMapLoaded ? 'block' : 'hidden'}`} />

      {/* Interactive Vector Fallback Canvas */}
      {!googleMapLoaded && (
        <div className="relative w-full h-full flex items-center justify-center">
          <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-cover" />

          {/* Satellite Radar HUD Badge */}
          <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-200 flex items-center space-x-2 shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold tracking-wide">Live High-Contrast Vector Radar</span>
            <span className="text-slate-400">| Lat: {center.lat.toFixed(4)}, Lng: {center.lng.toFixed(4)}</span>
          </div>

          {/* Compass / Orientation */}
          <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-slate-700 text-slate-300 shadow">
            <Compass className="w-5 h-5 text-farm-400 animate-pulse" />
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 flex items-center space-x-4 shadow">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-500 border border-white inline-block"></span>
              <span>Tractor / Operator</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 border border-white inline-block"></span>
              <span>Target Field</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-4 h-1 bg-orange-500 inline-block"></span>
              <span>GPS Path</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
