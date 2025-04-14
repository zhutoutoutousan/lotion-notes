'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { NewsArticle } from '@/services/news-service';
import { Loader2, Newspaper } from 'lucide-react';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Import MarkerCluster CSS directly in the component
const markerClusterStyles = `
  .leaflet-container {
    width: 100%;
    height: 100%;
    z-index: 1;
    position: relative;
  }
  .leaflet-pane {
    z-index: 1;
  }
  .leaflet-tile-pane {
    z-index: 1;
  }
  .leaflet-overlay-pane {
    z-index: 2;
  }
  .leaflet-marker-pane {
    z-index: 3;
  }
  .leaflet-tooltip-pane {
    z-index: 4;
  }
  .leaflet-popup-pane {
    z-index: 5;
  }
  .leaflet-control {
    z-index: 6;
  }
  .marker-cluster-small {
    background-color: rgba(59, 130, 246, 0.6);
  }
  .marker-cluster-small div {
    background-color: rgba(59, 130, 246, 0.8);
  }
  .marker-cluster-medium {
    background-color: rgba(59, 130, 246, 0.6);
  }
  .marker-cluster-medium div {
    background-color: rgba(59, 130, 246, 0.8);
  }
  .marker-cluster-large {
    background-color: rgba(59, 130, 246, 0.6);
  }
  .marker-cluster-large div {
    background-color: rgba(59, 130, 246, 0.8);
  }
  .news-marker {
    background: transparent;
    border: none;
  }
  .leaflet-marker-icon {
    background: transparent;
    border: none;
  }
  .marker-container {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  .marker-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .default-marker-icon {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #3b82f6;
    color: white;
  }
  .leaflet-tile {
    filter: none !important;
  }
  .leaflet-tile-pane {
    opacity: 1 !important;
  }
`;

// Custom marker icon function
const createCustomIcon = (imageUrl: string | null) => {
  if (imageUrl) {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="marker-container">
          <img src="${imageUrl}" alt="Article" class="marker-image" />
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
  } else {
    return L.divIcon({
      className: 'custom-marker default-marker',
      html: `
        <div class="marker-container">
          <div class="default-marker-icon">
            <Newspaper className="h-6 w-6" />
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
  }
};

interface NewsMapProps {
  articles: NewsArticle[];
  isDetectingLocations: boolean;
}

// Add type declaration for marker cluster
declare module 'leaflet' {
  namespace MarkerClusterGroup {
    interface Options {
      maxClusterRadius?: number;
      spiderfyOnMaxZoom?: boolean;
      showCoverageOnHover?: boolean;
      zoomToBoundsOnClick?: boolean;
    }
  }
  function markerClusterGroup(options?: MarkerClusterGroup.Options): any;
}

export default function NewsMap({ articles, isDetectingLocations }: NewsMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<any>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Handle component mounting
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Initialize map after component is mounted
  useEffect(() => {
    if (!isMounted || !mapContainerRef.current || mapRef.current) return;

    console.log('Initializing map with container:', mapContainerRef.current);

    try {
      // Initialize map
      const map = L.map(mapContainerRef.current).setView([20, 0], 2);
      console.log('Map instance created');
      
      // Add tile layer with error handling
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        errorTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      }).addTo(map);
      console.log('Tile layer added');

      // Initialize marker cluster group
      const markerCluster = L.markerClusterGroup({
        maxClusterRadius: 40,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
      });
      map.addLayer(markerCluster);
      console.log('Marker cluster added');

      mapRef.current = map;
      markersRef.current = markerCluster;
      setMapInitialized(true);
      console.log('Map initialization completed');
    } catch (error) {
      console.error('Error during map initialization:', error);
    }

    return () => {
      console.log('Cleanup function triggered');
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        console.log('Map removed');
      }
    };
  }, [isMounted]);

  // Update markers when articles change
  useEffect(() => {
    if (!mapInitialized || !markersRef.current) {
      console.log('Map not ready for markers');
      return;
    }

    try {
      // Clear existing markers
      markersRef.current.clearLayers();
      console.log('Existing markers cleared');

      // Add markers for articles with locations
      articles.forEach(article => {
        if (article.location?.latitude && article.location?.longitude) {
          const marker = L.marker(
            [article.location.latitude, article.location.longitude],
            { icon: createCustomIcon(article.image_url) }
          );

          // Create popup content
          const country = Array.isArray(article.country) 
            ? article.country.join(', ') 
            : article.country || 'Unknown';
            
          const category = Array.isArray(article.category) 
            ? article.category.join(', ') 
            : article.category || 'General';
            
          const creator = Array.isArray(article.creator) 
            ? article.creator.join(', ') 
            : article.creator || 'Unknown';

          const popupContent = `
            <div class="article-popup">
              ${article.image_url ? `
                <img 
                  src="${article.image_url}" 
                  alt="${article.title}"
                  class="w-full h-32 object-cover"
                />
              ` : ''}
              <div class="article-popup-content">
                <h3 class="text-lg font-semibold mb-2">${article.title}</h3>
                <p class="text-sm text-gray-600 mb-2">${article.description}</p>
                <div class="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>
                    <span class="font-medium">Source:</span> ${article.source_name}
                  </div>
                  <div>
                    <span class="font-medium">Country:</span> ${country}
                  </div>
                  <div>
                    <span class="font-medium">Category:</span> ${category}
                  </div>
                  <div>
                    <span class="font-medium">Creator:</span> ${creator}
                  </div>
                  <div class="col-span-2">
                    <span class="font-medium">Published:</span> ${new Date(article.pubDate).toLocaleDateString()}
                  </div>
                </div>
                <a
                  href="${article.source_url}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800"
                >
                  Read more →
                </a>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);
          markersRef.current?.addLayer(marker);
        }
      });
      console.log('Markers added');

      // Fit bounds to show all markers
      if (markersRef.current.getLayers().length > 0) {
        const bounds = markersRef.current.getBounds();
        mapRef.current?.fitBounds(bounds, { padding: [50, 50] });
        console.log('Bounds fitted');
      }
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }, [articles, mapInitialized]);

  if (!isMounted) {
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      <style jsx global>{markerClusterStyles}</style>
      {isDetectingLocations && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 z-20">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Detecting locations...</span>
          </div>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-screen" />
    </div>
  );
} 