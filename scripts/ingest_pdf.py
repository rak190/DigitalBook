#!/usr/bin/env python3
"""
PDF Content Ingestion Utility for DigitalBook Platform.
Extracts pages from a legally-owned textbook PDF into optimized WebP/JPEG images,
generates thumbnails, and outputs a starter BookManifest JSON file.

Usage:
    python scripts/ingest_pdf.py --pdf "path/to/book.pdf" --out "public/books/my-book/pages" --id "my-book" --title "My Textbook"
"""

import os
import sys
import json
import argparse
from pathlib import Path

try:
    import pypdfium2 as pdfium
    from PIL import Image
except ImportError:
    print("Error: Required packages missing. Please run: pip install pypdfium2 pillow")
    sys.exit(1)


def ingest_pdf(
    pdf_path: str,
    output_dir: str,
    book_id: str,
    book_title: str,
    start_page: int = 1,
    end_page: int = None,
    dpi: int = 150,
    quality: int = 85,
    img_format: str = "jpg",
    thumb_dir: str = None,
    manifest_out: str = None,
):
    pdf_path = os.path.abspath(pdf_path)
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file not found: {pdf_path}")
        return False

    os.makedirs(output_dir, exist_ok=True)
    if thumb_dir:
        os.makedirs(thumb_dir, exist_ok=True)

    print(f"Opening PDF: {pdf_path}")
    doc = pdfium.PdfDocument(pdf_path)
    total_doc_pages = len(doc)
    print(f"Total pages in document: {total_doc_pages}")

    start_idx = max(0, start_page - 1)
    end_idx = min(total_doc_pages, end_page) if end_page else total_doc_pages

    print(f"Rendering pages {start_idx + 1} to {end_idx} at {dpi} DPI (Quality: {quality}%)...")

    scale = dpi / 72.0
    pages_manifest = {}

    for idx in range(start_idx, end_idx):
        page_num = idx + 1
        page = doc[idx]
        
        # Render page bitmap
        bitmap = page.render(scale=scale)
        pil_image = bitmap.to_pil()

        # Filename
        ext = "webp" if img_format.lower() == "webp" else "jpg"
        filename = f"page_{page_num}.{ext}"
        filepath = os.path.join(output_dir, filename)

        # Save main page image
        if ext == "webp":
            pil_image.save(filepath, "WEBP", quality=quality, method=4)
        else:
            pil_image.save(filepath, "JPEG", quality=quality, optimize=True)

        # Save thumbnail if requested
        thumb_filename = f"thumb_{page_num}.jpg"
        if thumb_dir:
            thumb_path = os.path.join(thumb_dir, thumb_filename)
            thumb_img = pil_image.copy()
            thumb_img.thumbnail((300, 420), Image.Resampling.LANCZOS)
            thumb_img.save(thumb_path, "JPEG", quality=75, optimize=True)

        pages_manifest[page_num] = {
            "internalPageId": page_num,
            "pdfPageNumber": page_num,
            "printedPageNumber": page_num,
            "image": f"/book_pages/{filename}",
            "title": f"Page {page_num}",
            "pageType": "lesson" if page_num > 6 else ("cover" if page_num == 1 else "syllabus"),
            "hotspots": [],
            "exercises": [],
            "audioTracks": [],
            "imageRegions": [],
        }

        if page_num % 10 == 0 or page_num == end_idx:
            print(f"  ✓ Rendered page {page_num}/{end_idx} -> {filename}")

    # Generate draft manifest
    draft_manifest = {
        "id": book_id,
        "title": book_title,
        "subtitle": "Student's Book",
        "author": "Department of Curriculum Development",
        "publisher": "Educational Publishing House",
        "category": "cambodia-secondary",
        "grade": "Secondary",
        "gradeLabel": "Grade",
        "coverImage": f"/book_pages/page_1.{ext}",
        "totalPages": total_doc_pages,
        "physicalTotalPages": total_doc_pages,
        "language": "en",
        "description": f"Digitized interactive digital textbook for {book_title}.",
        "version": "1.0.0",
        "contentBasePath": "/books/",
        "pageImagePattern": f"book_pages/page_{{page}}.{ext}",
        "initialPage": 1,
        "aliases": [book_id],
        "features": {
            "audio": True,
            "exercises": True,
            "imageRegions": True,
            "presentationMode": True,
        },
        "navigation": [
            {
                "id": "ch1",
                "title": "Chapter 1",
                "startPage": 1,
                "endPage": min(20, total_doc_pages),
                "lessons": [
                    {"id": "ch1_l1", "title": "Lesson 1", "pageNumber": 1, "badge": "p.1"}
                ]
            }
        ],
        "pages": pages_manifest,
    }

    if manifest_out:
        os.makedirs(os.path.dirname(os.path.abspath(manifest_out)), exist_ok=True)
        with open(manifest_out, "w", encoding="utf-8") as f:
            json.dump(draft_manifest, f, indent=2)
        print(f"\n🎉 Draft BookManifest saved to: {manifest_out}")

    print(f"✨ Ingestion complete: {end_idx - start_idx} pages extracted to {output_dir}")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest textbook PDF into web page images.")
    parser.add_argument("--pdf", required=True, help="Path to textbook PDF file")
    parser.add_argument("--out", required=True, help="Directory to save rendered page images")
    parser.add_argument("--id", default="textbook-book", help="Book identifier")
    parser.add_argument("--title", default="Textbook", help="Book Title")
    parser.add_argument("--start", type=int, default=1, help="Start page (1-indexed)")
    parser.add_argument("--end", type=int, default=None, help="End page (1-indexed)")
    parser.add_argument("--dpi", type=int, default=150, help="Rendering DPI (default: 150)")
    parser.add_argument("--quality", type=int, default=85, help="Image quality percentage (default: 85)")
    parser.add_argument("--format", default="jpg", choices=["jpg", "webp"], help="Image format (jpg or webp)")
    parser.add_argument("--thumb-dir", default=None, help="Optional thumbnail directory")
    parser.add_argument("--manifest-out", default=None, help="Optional path to output manifest JSON")

    args = parser.parse_args()

    ingest_pdf(
        pdf_path=args.pdf,
        output_dir=args.out,
        book_id=args.id,
        book_title=args.title,
        start_page=args.start,
        end_page=args.end,
        dpi=args.dpi,
        quality=args.quality,
        img_format=args.format,
        thumb_dir=args.thumb_dir,
        manifest_out=args.manifest_out,
    )
