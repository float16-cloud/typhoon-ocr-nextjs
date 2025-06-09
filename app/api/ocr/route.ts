import { type NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import axios from "axios";

interface OcrRequest {
  base64Data: string;
}


export interface PageOcrResponse {
  page: number;
  natural_text: string;
}

// ฟังก์ชันแยก PDF เป็นหน้าๆ
async function splitPdfPages(base64Data: string): Promise<string[]> {
  try {
    const pdfBytes = Buffer.from(base64Data, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    const pages: string[] = [];

    for (let i = 0; i < pageCount; i++) {
      const newPdfDoc = await PDFDocument.create();
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
      newPdfDoc.addPage(copiedPage);
      
      const pdfBytesPage = await newPdfDoc.save();
      const base64Page = Buffer.from(pdfBytesPage).toString('base64');
      pages.push(base64Page);
    }

    return pages;
  } catch (error) {
    console.error("Error splitting PDF:", error);
    throw new Error("Failed to split PDF pages");
  }
}

// ฟังก์ชันยิง OCR API สำหรับหน้าเดียว
async function processPageOcr(base64Page: string, pageNumber: number, maxRetries: number = 2): Promise<PageOcrResponse> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(
        process.env.NEXT_PUBLIC_OCR_API_URL as string,
        {
          base64_pdf: base64Page,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OCR_API_KEY}`,
          },
        }
      );
   
      const raw = (response.data as string)

      function extractText(jsonString: string) {
        const start = '{"natural_text": "';
        const end = '"}';
        const cleaned = jsonString
        
        if (cleaned.startsWith(start)) {
          const lastEnd = cleaned.lastIndexOf(end);
          if (lastEnd !== -1) {
            return cleaned.substring(start.length, lastEnd);
          }
        }
        return null;
      }

      const extractedText = extractText(raw);
      
      // เช็คว่าได้ natural_text หรือไม่
      if (extractedText === null || extractedText.trim() === '') {
        throw new Error('Natural text not found or empty in OCR response');
      }

      return {
        page: pageNumber + 1, // เริ่มนับจาก 1
        natural_text: extractedText
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // ถ้ายังไม่ถึงครั้งสุดท้าย ให้ลอง retry อีกครั้ง
      if (attempt < maxRetries) {
        console.log(`OCR attempt ${attempt + 1} failed for page ${pageNumber + 1}, retrying... (${lastError.message})`);
        // รอ 1 วินาทีก่อน retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      // ถ้า retry ครบแล้วยังไม่ได้ ให้ throw error
      if (axios.isAxiosError(lastError)) {
        throw new Error(`OCR API failed for page ${pageNumber + 1} after ${maxRetries + 1} attempts: ${lastError.response?.statusText || lastError.message}`);
      }
      throw new Error(`OCR API failed for page ${pageNumber + 1} after ${maxRetries + 1} attempts: ${lastError.message}`);
    }
  }
  
  // ไม่ควรมาถึงจุดนี้ แต่เพื่อความปลอดภัย
  throw new Error(`OCR processing failed for page ${pageNumber + 1} after all attempts`);
}

export async function POST(request: NextRequest) {
  try {
    const body: OcrRequest = await request.json();
    const { base64Data } = body;

    // แยก PDF เป็นหน้าๆ
    console.log("Splitting PDF into pages...");
    const pages = await splitPdfPages(base64Data);
    console.log(`PDF split into ${pages.length} pages`);

    // วนลูปยิง OCR API ทีละหน้า (Sequential Processing)
    // จะค่อยๆcallทีละหน้า เพื่อป้องกันการcallมากเกินไป แต่ถ้าอยากได้พร้อมกันสามารถไปเปิดใช้ code ด้านล่างแบบ Parallel Processing ได้
    console.log("Processing OCR for all pages sequentially...");
    const results: PageOcrResponse[] = [];
    
    for (let i = 0; i < pages.length; i++) {
      console.log(`Processing page ${i + 1}/${pages.length}...`);
      try {
        const pageResult = await processPageOcr(pages[i], i);
        results.push(pageResult);
        console.log(`Completed page ${i + 1}`);
      } catch (error) {
        console.error(`Failed to process page ${i + 1}:`, error);
        // Continue processing other pages even if one fails
        results.push({
          page: i + 1,
          natural_text: `Error processing page ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    // Parallel Processing
    // const ocrPromises = pages.map((pageBase64, index) => 
    //   processPageOcr(pageBase64, index)
    // );
    // console.log("Processing OCR for all pages...");
    // const results = await Promise.all(ocrPromises);
    
    // เรียงผลลัพธ์ตามหน้าแล้ว return เป็น array
    const sortedResults = results.sort((a, b) => a.page - b.page);

    return NextResponse.json({
      pages: sortedResults,
      total_pages: results.length
    });

  } catch (error) {
    console.error("Error processing OCR request:", error);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
}
