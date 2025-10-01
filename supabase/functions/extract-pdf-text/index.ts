import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, storagePath } = await req.json();

    if (!documentId || !storagePath) {
      throw new Error('Missing documentId or storagePath');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Extracting PDF text for document:', documentId);

    // Download PDF from storage
    const { data: pdfBlob, error: downloadError } = await supabase.storage
      .from('pdf_documents')
      .download(storagePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Failed to download PDF: ${downloadError.message}`);
    }

    // Convert blob to ArrayBuffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Use pdf.js to extract text with coordinates
    const pdfjsLib = await import('https://esm.sh/pdfjs-dist@4.0.379/legacy/build/pdf.mjs');
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });
    
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    console.log(`Processing ${numPages} pages`);

    // Extract text from all pages
    const extractions = [];
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });

      // Build structured text items with coordinates
      const textItems = textContent.items.map((item: any) => {
        const transform = item.transform;
        const fontHeight = Math.sqrt(transform[2] * transform[2] + transform[3] * transform[3]);
        
        return {
          text: item.str,
          x: transform[4],
          y: viewport.height - transform[5] - fontHeight,
          width: item.width,
          height: fontHeight,
          fontName: item.fontName,
        };
      });

      const fullText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      extractions.push({
        document_id: documentId,
        page_number: pageNum,
        text_items: textItems,
        full_text: fullText,
      });

      console.log(`Extracted page ${pageNum}/${numPages}`);
    }

    // Save all extractions to database
    const { error: insertError } = await supabase
      .from('pdf_extractions')
      .upsert(extractions, {
        onConflict: 'document_id,page_number',
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Failed to save extractions: ${insertError.message}`);
    }

    // Update document with total pages
    await supabase
      .from('documents')
      .update({ total_pages: numPages })
      .eq('id', documentId);

    console.log('Extraction complete');

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        totalPages: numPages,
        message: 'PDF text extracted successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in extract-pdf-text:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
