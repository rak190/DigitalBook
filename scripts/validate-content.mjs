#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Helper to check if file exists in public/ or repo root
function resolveAssetPath(assetUrl) {
  if (!assetUrl) return null;
  // Remove query/hash
  let clean = assetUrl.split('?')[0].split('#')[0];
  // Remove base prefixes
  clean = clean.replace(/^\/DigitalBook\//, '/');
  clean = clean.replace(/^\/+/, '');

  const candidates = [
    path.join(ROOT_DIR, 'public', clean),
    path.join(ROOT_DIR, clean),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function validateContent() {
  console.log('\n======================================================');
  console.log('   DigitalBook Platform Content & Manifest Validator  ');
  console.log('======================================================\n');

  const server = await createServer({
    root: ROOT_DIR,
    server: { middlewareMode: true },
  });

  let booksModule;
  try {
    booksModule = await server.ssrLoadModule('./src/data/books/index.ts');
  } catch (err) {
    console.error('FATAL: Failed to load books manifests module:', err);
    await server.close();
    process.exit(1);
  } finally {
    await server.close();
  }

  const { INITIAL_BOOKS } = booksModule;
  if (!INITIAL_BOOKS || !Array.isArray(INITIAL_BOOKS)) {
    console.error('FATAL: INITIAL_BOOKS array not exported from src/data/books/index.ts');
    process.exit(1);
  }

  let totalErrors = 0;
  let totalWarnings = 0;
  const bookSummaries = [];

  for (const book of INITIAL_BOOKS) {
    console.log(`\n------------------------------------------------------`);
    console.log(`Validating: [${book.id}] - "${book.title}"`);
    console.log(`------------------------------------------------------`);

    const bookErrors = [];
    const bookWarnings = [];

    // 1. Basic Metadata
    if (!book.title) bookErrors.push('Missing book title');
    if (!book.category) bookErrors.push('Missing book category');
    if (!book.coverImage) {
      bookErrors.push('Missing coverImage');
    } else {
      const resolvedCover = resolveAssetPath(book.coverImage);
      if (!resolvedCover) {
        bookErrors.push(`Cover image not found on disk: "${book.coverImage}"`);
      }
    }

    if (typeof book.totalPages !== 'number' || book.totalPages <= 0) {
      bookErrors.push(`Invalid totalPages: ${book.totalPages}`);
    }

    // 2. Navigation TOC
    if (!Array.isArray(book.navigation) || book.navigation.length === 0) {
      bookWarnings.push('Manifest has empty or missing navigation sections');
    } else {
      for (const section of book.navigation) {
        if (!section.title) bookErrors.push(`TOC Section ${section.id} missing title`);
        if (typeof section.startPage !== 'number' || section.startPage <= 0) {
          bookErrors.push(`TOC Section ${section.id} has invalid startPage: ${section.startPage}`);
        }
        if (Array.isArray(section.lessons)) {
          for (const lesson of section.lessons) {
            if (typeof lesson.pageNumber !== 'number' || lesson.pageNumber <= 0) {
              bookErrors.push(`TOC Lesson ${lesson.id} has invalid pageNumber: ${lesson.pageNumber}`);
            }
          }
        }
      }
    }

    // 3. Pages validation
    const pageKeys = Object.keys(book.pages || {});
    if (pageKeys.length === 0) {
      bookErrors.push('Manifest contains no pages');
    }

    if (book.totalPages < pageKeys.length) {
      bookErrors.push(`Declared totalPages (${book.totalPages}) is less than defined pages (${pageKeys.length})`);
    } else if (book.totalPages > pageKeys.length) {
      bookWarnings.push(`Declared totalPages (${book.totalPages}) exceeds digitized page count (${pageKeys.length}); running in sample/core curriculum mode.`);
    }

    let totalHotspots = 0;
    let totalExercises = 0;
    let totalImageRegions = 0;
    let totalAudioTracks = 0;

    for (const key of pageKeys) {
      const pageNum = parseInt(key, 10);
      const page = book.pages[key];

      // Page image
      const pageImg = page.image || page.imageSrc;
      if (!pageImg) {
        bookErrors.push(`Page ${pageNum}: Missing image path`);
      } else {
        const resolvedImg = resolveAssetPath(pageImg);
        if (!resolvedImg) {
          bookErrors.push(`Page ${pageNum}: Image not found on disk: "${pageImg}"`);
        }
      }

      // Collect audio tracks on page
      const pageTracks = new Map();
      if (Array.isArray(page.audioTracks)) {
        for (const track of page.audioTracks) {
          totalAudioTracks++;
          pageTracks.set(track.id, track);
          if (!track.title) bookWarnings.push(`Page ${pageNum}: Audio track ${track.id} has no title`);
          if (track.source) {
            const resolvedAudio = resolveAssetPath(track.source);
            if (!resolvedAudio) {
              bookWarnings.push(`Page ${pageNum}: Course audio file for track ${track.id} not on disk (will use honest speech fallback): "${track.source}"`);
            }
          }
        }
      }

      // Collect exercises on page
      const pageExercises = new Map();
      if (Array.isArray(page.exercises)) {
        for (const ex of page.exercises) {
          totalExercises++;
          pageExercises.set(ex.id, ex);
          if (!ex.title) bookErrors.push(`Page ${pageNum}: Exercise ${ex.id} missing title`);
          if (!ex.type) bookErrors.push(`Page ${pageNum}: Exercise ${ex.id} missing type`);
          if (!Array.isArray(ex.questions) || ex.questions.length === 0) {
            bookErrors.push(`Page ${pageNum}: Exercise ${ex.id} has no questions`);
          } else {
            ex.questions.forEach((q, idx) => {
              if (!q.id) bookErrors.push(`Page ${pageNum}: Exercise ${ex.id} question #${idx + 1} missing id`);
              if (!q.prompt && !q.instruction) {
                bookWarnings.push(`Page ${pageNum}: Exercise ${ex.id} question #${q.id || idx + 1} has empty prompt`);
              }
              // Answer key check
              const hasAnswer = (q.correctAnswer !== undefined && q.correctAnswer !== '') ||
                                (Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0) ||
                                (Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length > 0);
              if (
                ex.type !== 'open-response' &&
                ex.type !== 'speaking' &&
                ex.type !== 'self-check' &&
                ex.type !== 'teacher-led' &&
                !hasAnswer
              ) {
                bookErrors.push(`Page ${pageNum}: Exercise ${ex.id} question ${q.id} missing answer key`);
              }
              // Multiple choice check
              if (ex.type === 'multiple-choice') {
                if (!Array.isArray(q.options) || q.options.length < 2) {
                  bookErrors.push(`Page ${pageNum}: Multiple choice exercise ${ex.id} question ${q.id} has fewer than 2 options`);
                }
              }
            });
          }
        }
      }

      // Collect image regions
      const pageImageRegions = new Map();
      if (Array.isArray(page.imageRegions)) {
        for (const reg of page.imageRegions) {
          totalImageRegions++;
          pageImageRegions.set(reg.id, reg);
          if (!reg.title) bookWarnings.push(`Page ${pageNum}: Image region ${reg.id} missing title`);
          const regImg = reg.imageSource || reg.imageSrc;
          if (!regImg) {
            bookErrors.push(`Page ${pageNum}: Image region ${reg.id} missing imageSource`);
          } else {
            const resolvedReg = resolveAssetPath(regImg);
            if (!resolvedReg) {
              bookErrors.push(`Page ${pageNum}: Image region asset not found on disk: "${regImg}"`);
            }
          }
          // Coordinate bounds
          if (reg.x < 0 || reg.x > 100 || reg.y < 0 || reg.y > 100 ||
              reg.width <= 0 || reg.width > 100 || reg.height <= 0 || reg.height > 100 ||
              (reg.x + reg.width) > 100.01 || (reg.y + reg.height) > 100.01) {
            bookErrors.push(`Page ${pageNum}: Image region ${reg.id} has invalid bounding box coordinates: [x=${reg.x}, y=${reg.y}, w=${reg.width}, h=${reg.height}]`);
          }
        }
      }

      // Hotspots validation
      if (Array.isArray(page.hotspots)) {
        for (const h of page.hotspots) {
          totalHotspots++;
          if (h.xPercent < 0 || h.xPercent > 100 || h.yPercent < 0 || h.yPercent > 100) {
            bookErrors.push(`Page ${pageNum}: Hotspot ${h.id} has coordinates out of [0, 100] bounds: (${h.xPercent}%, ${h.yPercent}%)`);
          }
          if (h.type === 'exercise') {
            const exId = h.targetId || h.exerciseId;
            if (!exId) {
              bookErrors.push(`Page ${pageNum}: Exercise hotspot ${h.id} missing targetId / exerciseId`);
            } else if (!pageExercises.has(exId)) {
              bookErrors.push(`Page ${pageNum}: Hotspot ${h.id} references non-existent exercise "${exId}"`);
            }
          } else if (h.type === 'image') {
            const imgId = h.targetId || h.imageRegionId;
            if (!imgId) {
              bookErrors.push(`Page ${pageNum}: Image hotspot ${h.id} missing targetId / imageRegionId`);
            } else if (!pageImageRegions.has(imgId)) {
              bookErrors.push(`Page ${pageNum}: Hotspot ${h.id} references non-existent image region "${imgId}"`);
            }
          } else if (h.type === 'audio') {
            const trackId = h.targetId || h.audioTrack;
            if (!trackId) {
              bookErrors.push(`Page ${pageNum}: Audio hotspot ${h.id} missing targetId / audioTrack`);
            }
          }
        }
      }
    }

    // Book summary
    bookSummaries.push({
      id: book.id,
      title: book.title,
      pages: pageKeys.length,
      hotspots: totalHotspots,
      exercises: totalExercises,
      audioTracks: totalAudioTracks,
      imageRegions: totalImageRegions,
      errors: bookErrors.length,
      warnings: bookWarnings.length,
    });

    if (bookErrors.length > 0) {
      console.log(`❌ ERRORS (${bookErrors.length}):`);
      bookErrors.forEach(e => console.log(`   • ${e}`));
      totalErrors += bookErrors.length;
    } else {
      console.log(`✅ Zero errors in manifest!`);
    }

    if (bookWarnings.length > 0) {
      console.log(`⚠️  WARNINGS (${bookWarnings.length}):`);
      bookWarnings.forEach(w => console.log(`   • ${w}`));
      totalWarnings += bookWarnings.length;
    }
  }

  console.log('\n======================================================');
  console.log('                 VALIDATION SUMMARY                   ');
  console.log('======================================================\n');
  console.table(bookSummaries);

  if (totalErrors === 0) {
    console.log(`\n🎉 ALL BOOK MANIFESTS & CONTENT VALIDATED SUCCESSFULLY!`);
    console.log(`   Total Books: ${INITIAL_BOOKS.length}`);
    console.log(`   Total Warnings: ${totalWarnings} (e.g. course audio speech fallback notifications)`);
    console.log(`   Exit Code: 0 (PASS)\n`);
    process.exit(0);
  } else {
    console.error(`\n💥 VALIDATION FAILED with ${totalErrors} fatal errors.`);
    console.error(`   Exit Code: 1 (FAIL)\n`);
    process.exit(1);
  }
}

validateContent();
