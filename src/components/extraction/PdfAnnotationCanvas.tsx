import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, Circle, Textbox, PencilBrush } from "fabric";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AnnotationTool } from "./AnnotationToolbar";

interface PdfAnnotationCanvasProps {
  documentId: string | null;
  pageNumber: number;
  width: number;
  height: number;
  scale: number;
  activeTool: AnnotationTool;
  color: string;
  annotationMode: boolean;
}

// Helper to get cursor style for each tool
const getCursorForTool = (tool: AnnotationTool): string => {
  switch (tool) {
    case 'pen':
    case 'highlighter':
      return 'crosshair';
    case 'rectangle':
    case 'circle':
      return 'crosshair';
    case 'text':
      return 'text';
    case 'eraser':
      return 'not-allowed';
    case 'select':
    default:
      return 'default';
  }
};

export const PdfAnnotationCanvas = ({
  documentId,
  pageNumber,
  width,
  height,
  scale,
  activeTool,
  color,
  annotationMode,
}: PdfAnnotationCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Initialize Fabric canvas with dynamic sizing
  useEffect(() => {
    if (!canvasRef.current) return;

    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: scaledWidth,
      height: scaledHeight,
      selection: annotationMode,
      backgroundColor: 'transparent',
    });

    // Initialize brush for drawing mode
    const brush = new PencilBrush(canvas);
    brush.width = 2;
    canvas.freeDrawingBrush = brush;

    fabricCanvasRef.current = canvas;

    console.log('Canvas initialized:', { width: scaledWidth, height: scaledHeight, scale });

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [width, height, scale, annotationMode]);

  // Load annotations from database
  useEffect(() => {
    if (!fabricCanvasRef.current || !documentId) return;

    const loadAnnotations = async () => {
      const { data, error } = await supabase
        .from('pdf_annotations')
        .select('*')
        .eq('document_id', documentId)
        .eq('page_number', pageNumber);

      if (error) {
        console.error('Error loading annotations:', error);
        return;
      }

      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      canvas.clear();

      data?.forEach((annotation) => {
        const fabricData = annotation.fabric_data as any;
        
        if (fabricData.type === 'rect') {
          const rect = new Rect({
            left: fabricData.left * scale,
            top: fabricData.top * scale,
            width: fabricData.width * scale,
            height: fabricData.height * scale,
            fill: fabricData.fill,
            stroke: fabricData.stroke,
            strokeWidth: fabricData.strokeWidth,
            strokeDashArray: fabricData.strokeDashArray,
            selectable: annotationMode && annotation.annotation_type !== 'ai-extraction',
          });
          canvas.add(rect);
        }
      });

      canvas.renderAll();
    };

    loadAnnotations();
  }, [documentId, pageNumber, scale, annotationMode]);

  // Handle tool changes with proper cleanup
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Store handler references for cleanup
    const handlers: Array<{ event: any; handler: any }> = [];
    
    // Cleanup function
    const cleanup = () => {
      // Remove all event listeners
      handlers.forEach(({ event, handler }) => {
        canvas.off(event as any, handler);
      });
      handlers.length = 0;
      
      // Reset drawing mode
      canvas.isDrawingMode = false;
      
      // Reset selection
      canvas.selection = annotationMode && activeTool === 'select';
    };

    // Apply new tool settings
    if (!annotationMode) {
      canvas.getObjects().forEach((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
      canvas.defaultCursor = getCursorForTool(activeTool);
      canvas.renderAll();
      return cleanup;
    }

    // Set cursor for the active tool
    canvas.defaultCursor = getCursorForTool(activeTool);

    switch (activeTool) {
      case 'pen': {
        canvas.isDrawingMode = true;
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = color;
          canvas.freeDrawingBrush.width = 2;
        }
        
        // Save path after drawing
        const onPathCreated = async (e: any) => {
          if (!documentId || !userId || !e.path) return;
          
          const path = e.path;
          const fabricData = {
            type: 'path',
            path: path.path,
            left: path.left! / scale,
            top: path.top! / scale,
            stroke: path.stroke,
            strokeWidth: path.strokeWidth,
          };

          await supabase.from('pdf_annotations').insert([{
            document_id: documentId,
            page_number: pageNumber,
            annotation_type: 'drawing',
            fabric_data: fabricData as any,
            color: color,
            user_id: userId,
          }]);
        };
        
        canvas.on('path:created' as any, onPathCreated);
        handlers.push({ event: 'path:created', handler: onPathCreated });
        break;
      }

      case 'highlighter':
      case 'rectangle': {
        let isDrawing = false;
        let rect: Rect | null = null;
        let startX = 0;
        let startY = 0;

        const onMouseDown = (e: any) => {
          if (!e.pointer) return;
          const pointer = canvas.getPointer(e.e);
          isDrawing = true;
          startX = pointer.x;
          startY = pointer.y;

          // Highlighter uses transparent fill, rectangle uses stroke only
          const isHighlighter = activeTool === 'highlighter';
          
          rect = new Rect({
            left: startX,
            top: startY,
            width: 0,
            height: 0,
            fill: isHighlighter ? color : 'transparent',
            stroke: isHighlighter ? 'transparent' : color.replace('0.4', '1'),
            strokeWidth: isHighlighter ? 0 : 2,
            selectable: false,
          });
          canvas.add(rect);
        };

        const onMouseMove = (e: any) => {
          if (!isDrawing || !rect || !e.pointer) return;
          
          const pointer = canvas.getPointer(e.e);
          const width = pointer.x - startX;
          const height = pointer.y - startY;
          
          rect.set({ width: Math.abs(width), height: Math.abs(height) });
          
          if (width < 0) rect.set({ left: startX + width });
          if (height < 0) rect.set({ top: startY + height });
          
          canvas.renderAll();
        };

        const onMouseUp = async () => {
          if (!rect || !documentId || !userId) {
            isDrawing = false;
            return;
          }

          isDrawing = false;

          // Only save if rectangle has meaningful size
          if (rect.width! > 5 && rect.height! > 5) {
            const fabricData = {
              type: 'rect',
              left: rect.left! / scale,
              top: rect.top! / scale,
              width: rect.width! / scale,
              height: rect.height! / scale,
              fill: rect.fill,
              stroke: rect.stroke,
              strokeWidth: rect.strokeWidth,
            };

            await supabase.from('pdf_annotations').insert([{
              document_id: documentId,
              page_number: pageNumber,
              annotation_type: activeTool === 'highlighter' ? 'highlight' : 'shape',
              fabric_data: fabricData as any,
              color: color,
              user_id: userId,
            }]);
          } else {
            // Remove tiny rectangles
            canvas.remove(rect);
          }

          rect = null;
        };

        canvas.on('mouse:down' as any, onMouseDown);
        canvas.on('mouse:move' as any, onMouseMove);
        canvas.on('mouse:up' as any, onMouseUp);
        
        handlers.push({ event: 'mouse:down', handler: onMouseDown });
        handlers.push({ event: 'mouse:move', handler: onMouseMove });
        handlers.push({ event: 'mouse:up', handler: onMouseUp });
        break;
      }

      case 'circle': {
        const onMouseDown = async (e: any) => {
          if (!e.pointer || !documentId || !userId) return;
          
          const pointer = canvas.getPointer(e.e);

          const circle = new Circle({
            left: pointer.x - 30,
            top: pointer.y - 30,
            radius: 30,
            fill: 'transparent',
            stroke: color.replace('0.4', '1'),
            strokeWidth: 2,
          });

          canvas.add(circle);

          const fabricData = {
            type: 'circle',
            left: circle.left! / scale,
            top: circle.top! / scale,
            radius: circle.radius! / scale,
            fill: circle.fill,
            stroke: circle.stroke,
            strokeWidth: circle.strokeWidth,
          };

          await supabase.from('pdf_annotations').insert([{
            document_id: documentId,
            page_number: pageNumber,
            annotation_type: 'shape',
            fabric_data: fabricData as any,
            color: color,
            user_id: userId,
          }]);
        };
        
        canvas.on('mouse:down' as any, onMouseDown);
        handlers.push({ event: 'mouse:down', handler: onMouseDown });
        break;
      }

      case 'text': {
        const onMouseDown = async (e: any) => {
          if (!e.pointer || !documentId || !userId) return;
          
          const pointer = canvas.getPointer(e.e);

          const text = new Textbox('Type here...', {
            left: pointer.x,
            top: pointer.y,
            width: 200,
            fontSize: 16,
            fill: color.replace('0.4', '1'),
          });

          canvas.add(text);
          canvas.setActiveObject(text);
          text.enterEditing();

          const fabricData = {
            type: 'text',
            left: text.left! / scale,
            top: text.top! / scale,
            text: text.text,
            fontSize: text.fontSize,
            fill: text.fill,
          };

          await supabase.from('pdf_annotations').insert([{
            document_id: documentId,
            page_number: pageNumber,
            annotation_type: 'text',
            fabric_data: fabricData as any,
            color: color,
            user_id: userId,
          }]);
        };
        
        canvas.on('mouse:down' as any, onMouseDown);
        handlers.push({ event: 'mouse:down', handler: onMouseDown });
        break;
      }

      case 'eraser': {
        const onMouseDown = async (e: any) => {
          const target = e.target;
          if (!target) return;

          canvas.remove(target);
          
          toast({
            title: "Annotation removed",
            description: "The annotation has been deleted.",
          });
        };
        
        canvas.on('mouse:down' as any, onMouseDown);
        handlers.push({ event: 'mouse:down', handler: onMouseDown });
        break;
      }

      case 'select':
      default: {
        canvas.selection = true;
        canvas.getObjects().forEach((obj) => {
          obj.selectable = true;
          obj.evented = true;
        });
        break;
      }
    }

    canvas.renderAll();
    
    // Return cleanup function
    return cleanup;
  }, [activeTool, color, annotationMode, documentId, pageNumber, scale, userId, toast]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0"
      style={{
        zIndex: annotationMode ? 15 : 5,
        pointerEvents: annotationMode ? 'auto' : 'none',
        cursor: annotationMode ? getCursorForTool(activeTool) : 'default',
      }}
    />
  );
};
