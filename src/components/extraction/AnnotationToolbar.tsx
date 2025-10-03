import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Highlighter, 
  Pen, 
  Square, 
  Circle, 
  Type, 
  Eraser, 
  MousePointer, 
  Trash2, 
  Save 
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type AnnotationTool = 
  | 'select' 
  | 'highlighter' 
  | 'pen' 
  | 'rectangle' 
  | 'circle' 
  | 'text' 
  | 'eraser';

interface AnnotationToolbarProps {
  activeTool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  onClearAll: () => void;
  onSave: () => void;
  color: string;
  onColorChange: (color: string) => void;
}

const COLORS = [
  { name: 'Yellow', value: 'rgba(255, 235, 59, 0.4)' },
  { name: 'Green', value: 'rgba(76, 175, 80, 0.4)' },
  { name: 'Blue', value: 'rgba(33, 150, 243, 0.4)' },
  { name: 'Pink', value: 'rgba(233, 30, 99, 0.4)' },
  { name: 'Red', value: 'rgba(244, 67, 54, 0.4)' },
];

export const AnnotationToolbar = ({
  activeTool,
  onToolChange,
  onClearAll,
  onSave,
  color,
  onColorChange,
}: AnnotationToolbarProps) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-background/95 border rounded-lg shadow-sm">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeTool === 'select' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => onToolChange('select')}
            >
              <MousePointer className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Select & Move</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-8" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeTool === 'highlighter' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => onToolChange('highlighter')}
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Highlighter</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeTool === 'pen' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => onToolChange('pen')}
            >
              <Pen className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Pen</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeTool === 'rectangle' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => onToolChange('rectangle')}
            >
              <Square className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Rectangle</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeTool === 'circle' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => onToolChange('circle')}
            >
              <Circle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Circle</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeTool === 'text' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => onToolChange('text')}
            >
              <Type className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Text</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeTool === 'eraser' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => onToolChange('eraser')}
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Eraser</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-8" />

        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c.value}
              className={`w-6 h-6 rounded border-2 ${
                color === c.value ? 'border-primary' : 'border-border'
              }`}
              style={{ backgroundColor: c.value }}
              onClick={() => onColorChange(c.value)}
              title={c.name}
            />
          ))}
        </div>

        <Separator orientation="vertical" className="h-8" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearAll}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear All</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSave}
            >
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save Annotations</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
