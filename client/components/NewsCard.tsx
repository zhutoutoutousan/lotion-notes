import { NewsArticle } from '@/services/news-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe, Calendar, Tag, User, Newspaper, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface NewsCardProps {
  article: NewsArticle;
  onSelect: (article: NewsArticle) => void;
}

export default function NewsCard({ article, onSelect }: NewsCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card 
        className="cursor-pointer overflow-hidden bg-gradient-to-br from-background to-muted/50 backdrop-blur-sm"
        onClick={() => onSelect(article)}
      >
        <div className="relative">
          {article.image_url && (
            <div className="relative h-48 w-full overflow-hidden">
              <Image
                src={article.image_url}
                alt={article.title}
                fill
                className={`object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          )}
          
          <div className="absolute top-4 right-4 flex gap-2">
            {article.category?.map((cat, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm"
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        <CardHeader className="p-4">
          <div className="space-y-2">
            <CardTitle className="text-lg line-clamp-2">
              {article.title}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Newspaper className="h-4 w-4" />
                <span>{article.source_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(article.pubDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {article.description}
            </p>

            <div className="flex flex-wrap gap-2">
              {article.keywords?.map((keyword, index) => (
                <Badge 
                  key={index} 
                  variant="outline"
                  className="bg-background/50 backdrop-blur-sm"
                >
                  {keyword}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Country:</span>
                  <span>{Array.isArray(article.country) ? article.country.join(', ') : article.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Creator:</span>
                  <span>{Array.isArray(article.creator) ? article.creator.join(', ') : article.creator || 'Unknown'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Source:</span>
                  <Link 
                    href={article.source_url} 
                    target="_blank"
                    className="text-blue-500 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {article.source_name}
                  </Link>
                </div>
                {article.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Location:</span>
                    <span>{article.location.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 