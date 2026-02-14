import { NextRequest, NextResponse } from 'next/server';
import { parseFile } from '@/lib/file-parser';
import { prisma } from '@/lib/prisma';
import { Buffer } from 'buffer';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedSections = await parseFile(buffer, file.type, file.name);

    // Persist to Database
    const document = await prisma.document.create({
      data: {
        title: file.name,
        type: file.type || 'unknown',
        sections: {
          create: parsedSections.map((s, index) => ({
            content: s.content,
            sortOrder: index,
          }))
        }
      },
      include: {
        sections: {
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
    });

    // Map DB sections to frontend format
    const sections = document.sections.map((s: any) => ({
      id: s.id,
      content: s.content,
      // title: s.title // schema doesn't have title on section yet, but interface might
    }));

    return NextResponse.json({ 
      documentId: document.id,
      sections 
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process file' },
      { status: 500 }
    );
  }
}
