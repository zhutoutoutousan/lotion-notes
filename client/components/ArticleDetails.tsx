import { NewsArticle } from '@/services/news-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import Image from 'next/image';

interface ArticleDetailsProps {
  article: NewsArticle;
  onClose: () => void;
}

export function ArticleDetails({ article, onClose }: ArticleDetailsProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Article Details</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Article Image */}
          {article.image_url && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden">
              <Image
                src={article.image_url}
                alt={article.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{article.title}</h2>
            
            {/* Source Info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {article.source_icon && (
                <Image
                  src={article.source_icon}
                  alt={article.source_name || 'Source icon'}
                  width={16}
                  height={16}
                  className="rounded-sm"
                />
              )}
              <span>{article.source_name}</span>
              {article.pubDate && (
                <span>• {new Date(article.pubDate).toLocaleDateString()}</span>
              )}
            </div>

            {/* Description */}
            <p className="text-lg">{article.description}</p>

            {/* Full Content */}
            <div className="prose max-w-none">
              {article.content}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {article.country && (
                <div>
                  <div className="font-medium">Country</div>
                  <div className="text-muted-foreground">
                    {Array.isArray(article.country) 
                      ? article.country.join(', ') 
                      : article.country}
                  </div>
                </div>
              )}
              {article.category && (
                <div>
                  <div className="font-medium">Category</div>
                  <div className="text-muted-foreground">
                    {Array.isArray(article.category) 
                      ? article.category.join(', ') 
                      : article.category}
                  </div>
                </div>
              )}
              {article.creator && (
                <div>
                  <div className="font-medium">Author</div>
                  <div className="text-muted-foreground">
                    {Array.isArray(article.creator) 
                      ? article.creator.join(', ') 
                      : article.creator}
                  </div>
                </div>
              )}
              {article.source_url && (
                <div>
                  <div className="font-medium">Source URL</div>
                  <a 
                    href={article.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Visit Source
                  </a>
                </div>
              )}
            </div>

            {/* Location Info */}
            {article.location && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Location</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Name</div>
                    <div>{article.location.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Coordinates</div>
                    <div>
                      {article.location.latitude}, {article.location.longitude}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 