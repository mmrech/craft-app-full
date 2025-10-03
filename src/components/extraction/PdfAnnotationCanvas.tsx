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

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: width * scale,
      height: height * scale,
      selection: annotationMode,
      backgroundColor: 'transparent',
    });

    fabricCanvasRef.current = canvas;

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [width, height, scale]);

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

  // Handle tool changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    canvas.selection = annotationMode;

    if (!annotationMode) {
      canvas.getObjects().forEach((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
      canvas.renderAll();
      return;
    }

    switch (activeTool) {
      case 'pen':
        canvas.isDrawingMode = true;
        const brush = new PencilBrush(canvas);
        brush.color = color;
        brush.width = 2;
        canvas.freeDrawingBrush = brush;
        break;

      case 'highlighter':
      case 'rectangle':
        let isDrawing = false;
        let rect: Rect | null = null;
        let startX = 0;
        let startY = 0;

        const onMouseDown = (e: any) => {
          if (!e.pointer) return;
          isDrawing = true;
          startX = e.pointer.x;
          startY = e.pointer.y;

          rect = new Rect({
            left: startX,
            top: startY,
            width: 0,
            height: 0,
            fill: color,
            stroke: color.replace('0.4', '1'),
            strokeWidth: 2,
          });
          canvas.add(rect);
        };

        const onMouseMove = (e: any) => {
          if (!isDrawing || !rect || !e.pointer) return;
          
          const width = e.pointer.x - startX;
          const height = e.pointer.y - startY;
          
          rect.set({ width, height });
          canvas.renderAll();
        };

        const onMouseUp = async () => {
          if (!rect || !documentId || !userId) {
            isDrawing = false;
            return;
          }

          isDrawing = false;

          // Save to database
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

          rect = null;
        };

        canvas.on('mouse:down', onMouseDown);
        canvas.on('mouse:move', onMouseMove);
        canvas.on('mouse:up', onMouseUp);
        break;

      case 'circle':
        canvas.on('mouse:down', async (e: any) => {
          if (!e.pointer || !documentId || !userId) return;

          const circle = new Circle({
            left: e.pointer.x,
            top: e.pointer.y,
            radius: 30,
            fill: color,
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
        });
        break;

      case 'text':
        canvas.on('mouse:down', async (e: any) => {
          if (!e.pointer || !documentId || !userId) return;

          const text = new Textbox('Type here...', {
            left: e.pointer.x,
            top: e.pointer.y,
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
        });
        break;

      case 'eraser':
        canvas.on('mouse:down', async (e: any) => {
          const target = e.target;
          if (!target) return;

          canvas.remove(target);
          
          // Delete from database (would need to track annotation IDs)
          toast({
            title: "Annotation removed",
            description: "The annotation has been deleted.",
          });
        });
        break;

      case 'select':
      default:
        canvas.getObjects().forEach((obj) => {
          obj.selectable = true;
          obj.evented = true;
        });
        break;
    }

    canvas.renderAll();
  }, [activeTool, color, annotationMode, documentId, pageNumber, scale, userId, toast]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 pointer-events-auto"
      style={{
        zIndex: annotationMode ? 15 : 5,
        pointerEvents: annotationMode ? 'auto' : 'none',
      }}
    />
  );
};
