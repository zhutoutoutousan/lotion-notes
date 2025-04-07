# 使用 DeepSeek API 实现新闻文章地理位置检测与地图可视化 | Implementing News Article Location Detection and Map Visualization with DeepSeek API

> 作者：Lotion Notes 团队 | Author: Lotion Notes Team  
> 发布时间：2023-04-07 | Published: 2023-04-07  
> 标签：AI, Next.js, React, DeepSeek API, 地图可视化 | Tags: AI, Next.js, React, DeepSeek API, Map Visualization

## 摘要 | Abstract

本文介绍了如何在 Next.js 应用中集成 DeepSeek API 实现新闻文章的地理位置检测功能，并将检测到的位置信息在交互式地图上可视化展示。我们还将探讨如何批量处理多篇文章的位置检测，以及如何优化 API 调用以提高性能和用户体验。

This article introduces how to integrate DeepSeek API in a Next.js application to implement location detection for news articles and visualize the detected locations on an interactive map. We will also explore how to batch process location detection for multiple articles and optimize API calls to improve performance and user experience.

## 引言 | Introduction

在信息爆炸的时代，新闻文章往往包含丰富的地理信息。通过提取这些信息，我们可以为用户提供更直观的新闻阅读体验，帮助他们更好地理解新闻事件的地理分布。本文将详细介绍如何实现这一功能。

In the era of information explosion, news articles often contain rich geographical information. By extracting this information, we can provide users with a more intuitive news reading experience, helping them better understand the geographical distribution of news events. This article will detail how to implement this functionality.

## 技术栈 | Tech Stack

- **前端框架 | Frontend Framework**: Next.js, React, TypeScript
- **UI 组件 | UI Components**: Shadcn UI, Tailwind CSS
- **地图可视化 | Map Visualization**: Leaflet.js
- **AI 服务 | AI Service**: DeepSeek API
- **状态管理 | State Management**: React Hooks

## 实现步骤 | Implementation Steps

### 1. 设置 DeepSeek API | Setting up DeepSeek API

首先，我们需要获取 DeepSeek API 密钥并设置环境变量。

First, we need to obtain a DeepSeek API key and set up environment variables.

```bash
# .env.local
DEEPSEEK_API_KEY=your_deepseek_api_key
```

### 2. 创建 API 路由 | Creating API Route

在 Next.js 中，我们创建一个 API 路由来处理 DeepSeek API 的请求。

In Next.js, we create an API route to handle DeepSeek API requests.

```typescript
// client/app/api/deepseek/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to process request with DeepSeek API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing DeepSeek API request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3. 实现位置检测服务 | Implementing Location Detection Service

接下来，我们创建一个服务函数来处理位置检测逻辑。

Next, we create a service function to handle the location detection logic.

```typescript
// client/services/news-service.ts
export interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

export async function detectLocationWithDeepSeek(
  title: string,
  description: string,
  content?: string
): Promise<Location | null> {
  try {
    // 组合文本进行分析 | Combine the text for analysis
    const textToAnalyze = `${title}. ${description}${content ? `. ${content}` : ''}`;
    
    // 创建 DeepSeek API 的提示 | Create a prompt for the DeepSeek API
    const prompt = `
      Analyze the following news article text and extract the primary geographic location mentioned.
      If multiple locations are mentioned, choose the most relevant one.
      If no specific location is mentioned, return null.
      
      Text: "${textToAnalyze}"
      
      Return a JSON object with the following structure:
      {
        "name": "Location Name",
        "latitude": latitude as number,
        "longitude": longitude as number
      }
      
      If no location is found, return null.
    `;
    
    // 调用 DeepSeek API | Call the DeepSeek API
    const response = await fetch('/api/deepseek', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // 解析响应 | Parse the response
    try {
      // 从 DeepSeek API 响应中提取内容 | Extract the content from the DeepSeek API response
      const content = data.choices[0].message.content;
      
      // 从内容中提取 JSON 字符串（它被 ```json 和 ``` 包裹）| Extract the JSON string from the content (it's wrapped in ```json and ```)
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      
      if (jsonMatch && jsonMatch[1]) {
        const locationData = JSON.parse(jsonMatch[1]);
        
        // 验证位置数据 | Validate the location data
        if (
          locationData &&
          typeof locationData.name === 'string' &&
          typeof locationData.latitude === 'number' &&
          typeof locationData.longitude === 'number'
        ) {
          return {
            name: locationData.name,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          };
        }
      }
    } catch (parseError) {
      console.error('Failed to parse location data:', parseError);
    }
    
    return null;
  } catch (error) {
    console.error('Error detecting location:', error);
    return null;
  }
}
```

### 4. 创建地图组件 | Creating Map Component

我们使用 Leaflet.js 创建一个交互式地图组件来显示文章位置。

We use Leaflet.js to create an interactive map component to display article locations.

```typescript
// client/components/NewsMap.tsx
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

  // 动态加载 Leaflet 以避免 SSR 问题 | Load Leaflet dynamically to avoid SSR issues
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined') {
        // 导入 Leaflet CSS | Import Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);

        // 导入 Leaflet JS | Import Leaflet JS
        const L = await import('leaflet');
        
        // 修复 Leaflet 图标问题 | Fix Leaflet icon issue
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

  // 当 Leaflet 加载完成时初始化地图 | Initialize map when Leaflet is loaded
  useEffect(() => {
    if (mapLoaded && mapContainerRef.current && !mapInstanceRef.current) {
      const L = require('leaflet');
      
      // 创建地图实例 | Create map instance
      const mapInstance = L.map(mapContainerRef.current).setView([0, 0], 2);
      
      // 添加图层（OpenStreetMap）| Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance);
      
      mapInstanceRef.current = mapInstance;
      setMap(mapInstance);
    }
    
    // 清理函数 | Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded]);

  // 当文章变化时更新标记 | Update markers when articles change
  useEffect(() => {
    if (!map) return;
    
    const L = require('leaflet');
    
    // 清除现有标记 | Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // 创建新标记 | Create new markers
    const newMarkers = articles.map(article => {
      if (!article.location) return null;
      
      // 使用位置中的纬度/经度 | Use latitude/longitude from the location
      const { latitude, longitude, name } = article.location;
      
      // 创建标记 | Create marker
      const marker = L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">${article.title}</h3>
            <p class="text-sm">${article.source} • ${article.publishedAt}</p>
          </div>
        `);
      
      // 添加点击事件 | Add click event
      marker.on('click', () => {
        onArticleSelect(article);
      });
      
      return marker;
    }).filter(Boolean);
    
    // 在 ref 中存储标记 | Store markers in ref
    markersRef.current = newMarkers;
    
    // 更新标记状态 | Update markers state
    setMarkers(newMarkers);
  }, [articles, map, onArticleSelect]);
  
  // 更新选中的文章标记 | Update selected article marker
  useEffect(() => {
    if (!map || !selectedArticle || !selectedArticle.location) return;
    
    // 查找并高亮选中的文章标记 | Find and highlight the selected article's marker
    const selectedMarker = markersRef.current.find(marker => {
      const { latitude, longitude } = selectedArticle.location!;
      const markerLatLng = marker.getLatLng();
      return markerLatLng.lat === latitude && markerLatLng.lng === longitude;
    });
    
    if (selectedMarker) {
      // 将地图中心设置为选中的标记 | Center map on selected marker
      map.setView(selectedMarker.getLatLng(), 5);
      
      // 打开弹出窗口 | Open popup
      selectedMarker.openPopup();
    }
  }, [selectedArticle, map]);
  
  return (
    <Card className="w-full h-[400px] overflow-hidden">
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5" />
          新闻位置 | News Locations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-4rem)]">
        {!mapLoaded ? (
          <div className="flex items-center justify-center h-full">
            <p>加载地图中... | Loading map...</p>
          </div>
        ) : (
          <div ref={mapContainerRef} className="w-full h-full" />
        )}
      </CardContent>
    </Card>
  );
}
```

### 5. 实现批量位置检测 | Implementing Batch Location Detection

为了处理多篇文章，我们实现了批量位置检测功能。

To process multiple articles, we implemented a batch location detection feature.

```typescript
// 处理所有文章的位置检测 | Handle detecting locations for all articles
const handleDetectAllLocations = async () => {
  if (articles.length === 0) return;
  
  setDetectingAllLocations(true);
  setAllLocationsProgress(0);
  setLocationError(null);
  
  // 创建文章数组的副本 | Create a copy of the articles array
  const updatedArticles = [...articles];
  let progress = 0;
  
  try {
    // 分批处理文章以避免 API 过载 | Process articles in batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, Math.min(i + batchSize, articles.length));
      
      // 处理批次中的每篇文章 | Process each article in the batch
      await Promise.all(batch.map(async (article) => {
        try {
          // 如果文章已有位置数据则跳过 | Skip if article already has location data
          if (article.location) {
            progress++;
            setAllLocationsProgress(Math.round((progress / articles.length) * 100));
            return;
          }
          
          const location = await detectLocationWithDeepSeek(
            article.title,
            article.description,
            article.content
          );
          
          if (location) {
            // 使用位置数据更新文章 | Update the article with location data
            const updatedArticle = {
              ...article,
              location
            };
            
            // 更新数组中的文章 | Update the article in the array
            const index = updatedArticles.findIndex(a => a.id === article.id);
            if (index !== -1) {
              updatedArticles[index] = updatedArticle;
            }
            
            // 如果是同一篇文章则更新选中的文章 | Update the selected article if it's the same one
            if (selectedArticle && selectedArticle.id === article.id) {
              setSelectedArticle(updatedArticle);
            }
          }
        } catch (err) {
          console.error(`Failed to detect location for article: ${article.title}`, err);
        } finally {
          progress++;
          setAllLocationsProgress(Math.round((progress / articles.length) * 100));
        }
      }));
      
      // 每批次后更新文章状态 | Update the articles state after each batch
      setArticles(updatedArticles);
      
      // 批次之间添加小延迟以避免速率限制 | Add a small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (err) {
    setLocationError("Failed to detect locations for some articles. Please try again later.");
    console.error(err);
  } finally {
    setDetectingAllLocations(false);
    setAllLocationsProgress(0);
  }
};
```

### 6. 添加 UI 元素 | Adding UI Elements

最后，我们在 UI 中添加了检测位置按钮和进度指示器。

Finally, we added the detect location button and progress indicator to the UI.

```tsx
<Button
  variant="outline"
  onClick={handleDetectAllLocations}
  disabled={detectingAllLocations || articles.length === 0}
  className="whitespace-nowrap"
>
  {detectingAllLocations ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {allLocationsProgress}% 完成 | Complete
    </>
  ) : (
    <>
      <MapPin className="mr-2 h-4 w-4" />
      检测所有位置 | Detect All Locations
    </>
  )}
</Button>

{locationError && (
  <Alert variant="destructive" className="mb-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>位置检测错误 | Location Detection Error</AlertTitle>
    <AlertDescription>{locationError}</AlertDescription>
  </Alert>
)}
```

## 性能优化 | Performance Optimization

为了提高性能和用户体验，我们实施了以下优化措施：

To improve performance and user experience, we implemented the following optimizations:

1. **批量处理 | Batch Processing**: 将文章分批处理，避免一次性发送过多请求。
   Process articles in batches to avoid sending too many requests at once.

2. **延迟加载 | Lazy Loading**: 动态加载 Leaflet 库，避免 SSR 问题。
   Dynamically load the Leaflet library to avoid SSR issues.

3. **缓存标记 | Caching Markers**: 使用 ref 缓存标记，避免不必要的重新渲染。
   Use refs to cache markers to avoid unnecessary re-renders.

4. **错误处理 | Error Handling**: 完善的错误处理机制，确保用户体验不受影响。
   Comprehensive error handling to ensure user experience is not affected.

5. **进度指示 | Progress Indication**: 显示批量处理的进度，提供更好的用户反馈。
   Display batch processing progress for better user feedback.

## 结论 | Conclusion

通过集成 DeepSeek API 和 Leaflet.js，我们成功实现了新闻文章的地理位置检测和地图可视化功能。这一功能不仅提升了用户体验，还为用户提供了更直观的新闻阅读方式。批量处理功能进一步增强了应用的实用性，使用户能够一次性处理多篇文章。

By integrating DeepSeek API and Leaflet.js, we successfully implemented location detection and map visualization for news articles. This feature not only enhances user experience but also provides users with a more intuitive way to read news. The batch processing feature further enhances the application's utility, allowing users to process multiple articles at once.

## 未来改进 | Future Improvements

1. **聚类标记 | Clustered Markers**: 当标记过多时，实现标记聚类以提高性能。
   Implement marker clustering when there are too many markers to improve performance.

2. **自定义标记样式 | Custom Marker Styles**: 根据文章类别或重要性自定义标记样式。
   Customize marker styles based on article category or importance.

3. **时间线视图 | Timeline View**: 添加时间线视图，按时间顺序展示新闻事件。
   Add a timeline view to display news events chronologically.

4. **离线支持 | Offline Support**: 实现离线缓存，减少 API 调用。
   Implement offline caching to reduce API calls.

## 参考资料 | References

- [DeepSeek API 文档 | DeepSeek API Documentation](https://deepseek.com/docs)
- [Leaflet.js 文档 | Leaflet.js Documentation](https://leafletjs.com/reference.html)
- [Next.js API 路由 | Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [React Hooks | React Hooks](https://reactjs.org/docs/hooks-intro.html)

---

> 如果您喜欢这篇文章，请点赞并关注我们以获取更多技术内容！
> If you like this article, please like and follow us for more technical content! 