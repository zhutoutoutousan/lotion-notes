'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NewsArticle } from '@/services/news-service';
import { Loader2, Newspaper } from 'lucide-react';

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

// Update bounds component
function UpdateBounds({ articles }: { articles: NewsArticle[] }) {
  const map = useMap();

  useEffect(() => {
    if (articles.length > 0) {
      const bounds = L.latLngBounds(
        articles.map(article => {
          if (article.location) {
            return [article.location.latitude, article.location.longitude];
          }
          return [0, 0];
        })
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // Set initial view to show the whole world
      map.setView([20, 0], 2);
    }
  }, [articles, map]);

  return null;
}

export default function NewsMap({ articles, isDetectingLocations }: { articles: NewsArticle[]; isDetectingLocations: boolean }) {
  const mapRef = useRef<L.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    setIsMapReady(true);
  }, []);

  if (!isMapReady) {
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initializing map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative z-0">
      {isDetectingLocations && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 z-20">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Detecting locations...</span>
          </div>
        </div>
      )}
      <style jsx global>{`
        .leaflet-container {
          width: 100%;
          height: 100%;
          z-index: 0;
        }
        .custom-marker {
          border-radius: 50%;
          overflow: hidden;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .marker-container {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid white;
          background: white;
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
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }
        .default-marker-icon svg {
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
        }
        .leaflet-popup-content {
          margin: 0;
          padding: 0;
        }
        .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 8px;
          overflow: hidden;
        }
        .article-popup {
          width: 300px;
        }
        .article-popup img {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }
        .article-popup-content {
          padding: 1rem;
        }
      `}</style>

      <MapContainer
        center={[20, 0]} // Initial center point
        zoom={2} // Initial zoom level to show the whole world
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {articles.map((article) => {
          if (!article.location) return null;
          
          const country = Array.isArray(article.country) 
            ? article.country.join(', ') 
            : article.country || 'Unknown';
            
          const category = Array.isArray(article.category) 
            ? article.category.join(', ') 
            : article.category || 'General';
            
          const creator = Array.isArray(article.creator) 
            ? article.creator.join(', ') 
            : article.creator || 'Unknown';

          return (
            <Marker
              key={article.article_id}
              position={[article.location.latitude, article.location.longitude]}
              icon={createCustomIcon(article.image_url)}
            >
              <Popup>
                <div className="article-popup">
                  {article.image_url && (
                    <img 
                      src={article.image_url} 
                      alt={article.title}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="article-popup-content">
                    <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{article.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>
                        <span className="font-medium">Source:</span> {article.source_name}
                      </div>
                      <div>
                        <span className="font-medium">Country:</span> {country}
                      </div>
                      <div>
                        <span className="font-medium">Category:</span> {category}
                      </div>
                      <div>
                        <span className="font-medium">Creator:</span> {creator}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Published:</span> {new Date(article.pubDate).toLocaleDateString()}
                      </div>
                    </div>
                    <a
                      href={article.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800"
                    >
                      Read more →
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        <UpdateBounds articles={articles} />
      </MapContainer>
    </div>
  );
} 