'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NewsArticle, Location } from '@/services/news-service';
import { MapPin } from 'lucide-react';

interface NewsMapProps {
  articles: NewsArticle[];
  selectedArticle: NewsArticle | null;
  onArticleSelect: (article: NewsArticle) => void;
}

export default function NewsMap({ articles, selectedArticle, onArticleSelect }: NewsMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Load Leaflet dynamically to avoid SSR issues
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined') {
        // Import Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);

        // Import Leaflet JS
        const L = await import('leaflet');
        
        // Fix Leaflet icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        setMapLoaded(true);
      }
    };

    loadLeaflet();
  }, []);

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (mapLoaded && mapContainerRef.current && !mapInstanceRef.current) {
      const L = require('leaflet');
      
      // Create map instance
      const mapInstance = L.map(mapContainerRef.current).setView([0, 0], 2);
      
      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance);
      
      mapInstanceRef.current = mapInstance;
      setMap(mapInstance);
    }
    
    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded]);

  // Update markers when articles change
  useEffect(() => {
    if (!map) return;
    
    const L = require('leaflet');
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Create new markers
    const newMarkers = articles.map(article => {
      if (!article.location) return null;
      
      // Use latitude/longitude from the location
      const { latitude, longitude, name } = article.location;
      
      // Create marker
      const marker = L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">${article.title}</h3>
            <p class="text-sm">${article.source} • ${article.publishedAt}</p>
          </div>
        `);
      
      // Add click event
      marker.on('click', () => {
        onArticleSelect(article);
      });
      
      return marker;
    }).filter(Boolean);
    
    // Store markers in ref
    markersRef.current = newMarkers;
    
    // Update markers state
    setMarkers(newMarkers);
  }, [articles, map, onArticleSelect]);
  
  // Update selected article marker
  useEffect(() => {
    if (!map || !selectedArticle || !selectedArticle.location) return;
    
    // Find and highlight the selected article's marker
    const selectedMarker = markersRef.current.find(marker => {
      const { latitude, longitude } = selectedArticle.location!;
      const markerLatLng = marker.getLatLng();
      return markerLatLng.lat === latitude && markerLatLng.lng === longitude;
    });
    
    if (selectedMarker) {
      // Center map on selected marker
      map.setView(selectedMarker.getLatLng(), 5);
      
      // Open popup
      selectedMarker.openPopup();
    }
  }, [selectedArticle, map]);
  
  return (
    <Card className="w-full h-[400px] overflow-hidden">
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5" />
          News Locations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-4rem)]">
        {!mapLoaded ? (
          <div className="flex items-center justify-center h-full">
            <p>Loading map...</p>
          </div>
        ) : (
          <div ref={mapContainerRef} className="w-full h-full" />
        )}
      </CardContent>
    </Card>
  );
} 