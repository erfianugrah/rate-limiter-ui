import { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GripVertical, Trash2, Edit, History } from 'lucide-react';
import { VersionHistoryDialog } from './version-history-dialog';
import { TimeDisplay } from './time-display';

interface SortableItemProps {
  id: string;
  name: string;
  description: string;
  rateLimit: string;
  version: number | string;
  onEdit: () => void;
  onDelete: () => void;
  onRevert: (ruleId: string, targetVersion: string) => Promise<void>;
  isLoading: boolean;
}

export function SortableItem({
  id,
  name,
  description,
  rateLimit,
  version,
  onEdit,
  onDelete,
  onRevert,
  isLoading,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [versionCount, setVersionCount] = useState(0);
  
  // Fetch version count on mount
  useEffect(() => {
    const fetchVersionCount = async () => {
      try {
        const response = await fetch(`/api/config/rules/${id}/versions`);
        if (response.ok) {
          const data = await response.json();
          if (data.versions && Array.isArray(data.versions)) {
            setVersionCount(data.versions.length);
          }
        }
      } catch (error) {
        console.error("Error fetching version count:", error);
      }
    };
    
    fetchVersionCount();
  }, [id]);

  const [limit, period] = rateLimit.split('/');
  const periodSeconds = parseInt(period);

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="mb-4">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div {...listeners} className="cursor-move">
              <GripVertical className="text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{name}</h3>
              <p className="text-sm text-gray-500">{description}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary">
                  {limit} / 
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">
                          <TimeDisplay seconds={periodSeconds} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                       <p>{periodSeconds} {periodSeconds === 1 ? 'second' : 'seconds'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Badge>
                <Badge variant="outline" onClick={() => setIsHistoryOpen(true)} className="hover:bg-gray-100 cursor-pointer">
                  {isHistoryOpen ? "Loading..." : `Versions: ${versionCount || (typeof version === 'number' ? version : 0)}`}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={onEdit} disabled={isLoading}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsHistoryOpen(true)} disabled={isLoading}>
              <History className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onDelete} disabled={isLoading}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      <VersionHistoryDialog
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        ruleId={id}
        currentVersion={version}
        onRevert={onRevert}
      />
    </div>
  );
}
