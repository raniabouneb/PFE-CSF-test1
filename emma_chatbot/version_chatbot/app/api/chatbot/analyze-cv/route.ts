import { NextRequest, NextResponse } from "next/server";
import { analyzeCV } from "@/lib/chatbot/cv-analyzer";
export async function POST(req: NextRequest) {
  try {
    const pdf = require("pdf-parse");
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Convert File to Buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
    const data = await pdf(buffer);
    
    // Analyze extracted text
    const analysisResult = await analyzeCV(data.text);

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error("Error processing CV upload:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while processing the CV" },
      { status: 500 }
    );
  }
}
