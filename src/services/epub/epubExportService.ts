import JSZip from 'jszip';
import {
  BookProject,
  BookTemplate,
  EpubExportOptions,
  ManuscriptBlock,
  BookImage,
} from '@/types/book';
import { getEffectiveTypography } from '@/services/templates/templateRegistry';

export interface EpubValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function sanitizeEpubFilename(title: string): string {
  const trimmed = (title || '').trim();
  if (!trimmed) return 'book.epub';
  const clean = trimmed
    .replace(/[\\/:*?"<>|\r\n\t]+/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `${clean || 'book'}.epub`;
}

/**
 * Validates accessibility and metadata requirements before EPUB 3 generation.
 */
export function validateForEpub(
  project: BookProject,
  images: BookImage[]
): EpubValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Metadata checks
  if (!project.title || !project.title.trim()) {
    errors.push('Missing book title: EPUB 3 requires a non-empty Dublin Core title.');
  }

  // Accessibility Check: All images must have non-empty alt text
  const usedImages = images || project.images || [];
  for (const img of usedImages) {
    if (!img.altText || !img.altText.trim()) {
      errors.push(
        `Accessibility Violation: Image "${img.filename}" lacks alternative text. Accessible EPUB 3 requires descriptive alt text for all illustrations.`
      );
    }
  }

  if (!project.author || !project.author.trim()) {
    warnings.push('Author name is empty. It is strongly recommended for EPUB metadata.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Escapes special XML characters for XHTML output.
 */
function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates an accessible, reflowable EPUB 3 archive from the structured book project.
 */
export async function generateEpub(
  project: BookProject,
  template: BookTemplate,
  options?: Partial<EpubExportOptions>,
  onProgress?: (progressPercent: number, statusText: string) => void
): Promise<{ blob: Blob; filename: string; arrayBuffer: ArrayBuffer }> {
  const images = project.images || [];
  const validation = validateForEpub(project, images);
  if (!validation.valid) {
    throw new Error(`Cannot export EPUB due to accessibility/metadata errors:\n${validation.errors.join('\n')}`);
  }

  if (onProgress) onProgress(10, 'Initializing EPUB 3 container...');

  const zip = new JSZip();

  // 1. mimetype (Must be first entry, uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.folder('META-INF')!.file('container.xml', containerXml);

  const oebps = zip.folder('OEBPS')!;

  const lang = options?.language || project.languageSettings?.language || 'en';
  const dir = options?.direction || project.languageSettings?.direction || 'ltr';
  const isRtl = dir === 'rtl';
  const effectiveTypo = getEffectiveTypography(template, project.typography, project.author);

  const title = project.title || 'Untitled Book';
  const author = project.author || effectiveTypo.authorName || 'Unknown Author';
  const bookId = `urn:uuid:${project.id}`;
  const modifiedDate = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

  // 3. OEBPS/style.css
  const lineHeight = isRtl ? (lang === 'ur' ? 1.95 : 1.7) : effectiveTypo.bodyLineHeight;
  const textAlign = isRtl ? 'right' : effectiveTypo.textAlign === 'justify' ? 'justify' : 'left';
  const indent = effectiveTypo.paragraphIndentInches > 0 ? `${effectiveTypo.paragraphIndentInches}in` : '0';

  const styleCss = `/* ATS EasyBook Reflowable EPUB 3 Stylesheet */
@namespace epub "http://www.idpf.org/2007/ops";

html, body {
  margin: 0;
  padding: 0;
  direction: ${dir};
  text-align: ${textAlign};
  font-size: 1.05em;
  line-height: ${lineHeight};
  color: #111111;
  background-color: #ffffff;
}

body {
  padding: 1.5em;
}

h1.chapter-title {
  font-size: 1.85em;
  line-height: 1.25;
  margin-top: 2.5em;
  margin-bottom: 1.2em;
  text-align: center;
  page-break-before: always;
}

p {
  margin-top: 0;
  margin-bottom: 0.6em;
  text-indent: ${indent};
}

p.no-indent {
  text-indent: 0;
}

blockquote {
  margin: 1.5em 2em;
  font-style: italic;
  border-${isRtl ? 'right' : 'left'}: 4px solid #cbd5e1;
  padding-${isRtl ? 'right' : 'left'}: 1em;
}

figure {
  margin: 2em 0;
  text-align: center;
  page-break-inside: avoid;
}

figure img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}

figcaption {
  font-size: 0.9em;
  color: #555555;
  font-style: italic;
  margin-top: 0.5em;
}

.page-break {
  page-break-after: always;
  height: 0;
  margin: 0;
  padding: 0;
}
`;
  oebps.file('style.css', styleCss);

  if (onProgress) onProgress(30, 'Formatting semantic XHTML chapters...');

  // 4. Split manuscript blocks into chapters
  const blocks = project.formattedBlocks || [];
  interface ChapterData {
    id: string;
    filename: string;
    title: string;
    blocks: ManuscriptBlock[];
  }

  const chapters: ChapterData[] = [];
  let currentChapter: ChapterData = {
    id: 'intro',
    filename: 'chapter-1.xhtml',
    title: title,
    blocks: [],
  };

  for (const block of blocks) {
    if (block.type === 'chapter-heading') {
      if (currentChapter.blocks.length > 0) {
        chapters.push(currentChapter);
      }
      const chIdx = chapters.length + 1;
      currentChapter = {
        id: `ch-${chIdx}`,
        filename: `chapter-${chIdx}.xhtml`,
        title: block.text || `Chapter ${chIdx}`,
        blocks: [block],
      };
    } else {
      currentChapter.blocks.push(block);
    }
  }
  if (currentChapter.blocks.length > 0) {
    chapters.push(currentChapter);
  }
  if (chapters.length === 0) {
    chapters.push({
      id: 'ch-1',
      filename: 'chapter-1.xhtml',
      title: title,
      blocks: [{ id: 'b-0', type: 'paragraph', text: project.rawManuscript || '' }],
    });
  }

  // Map image assets and add to zip
  const imageFolder = oebps.folder('images')!;
  const manifestImages: { id: string; filename: string; mimeType: string }[] = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const ext = img.mimeType.includes('png') ? 'png' : img.mimeType.includes('webp') ? 'webp' : 'jpg';
    const imgFileName = `img-${i + 1}.${ext}`;
    const cleanBase64 = (img.dataUrl.split(',')[1] || img.dataUrl).replace(/\s+/g, '');
    imageFolder.file(imgFileName, cleanBase64, { base64: true });
    manifestImages.push({
      id: `img-${i + 1}`,
      filename: `images/${imgFileName}`,
      mimeType: img.mimeType || 'image/jpeg',
    });
  }

  // Write XHTML chapter files
  for (let cIdx = 0; cIdx < chapters.length; cIdx++) {
    const ch = chapters[cIdx];
    let contentHtml = '';

    for (const b of ch.blocks) {
      const blockDir = b.direction || dir;
      const dirAttr = blockDir !== dir ? ` dir="${blockDir}"` : '';

      if (b.type === 'chapter-heading') {
        contentHtml += `  <h1 class="chapter-title"${dirAttr}>${escapeXml(b.text)}</h1>\n`;
      } else if (b.type === 'quote') {
        contentHtml += `  <blockquote${dirAttr}><p>${escapeXml(b.text)}</p></blockquote>\n`;
      } else if (b.type === 'page-break') {
        contentHtml += `  <div class="page-break"></div>\n`;
      } else {
        // Standard paragraph
        contentHtml += `  <p${dirAttr}>${escapeXml(b.text)}</p>\n`;
      }

      // Check if any images are anchored to this block
      const anchoredPlacements = (project.placements || []).filter((p) => p.blockId === b.id);
      for (const p of anchoredPlacements) {
        const imgObj = images.find((im) => im.id === p.imageId);
        const imgIdx = images.findIndex((im) => im.id === p.imageId);
        if (imgObj && imgIdx >= 0) {
          const mImg = manifestImages[imgIdx];
          const alt = escapeXml(p.altText || imgObj.altText || 'Illustration');
          const cap = p.caption || imgObj.caption;
          contentHtml += `  <figure>\n`;
          contentHtml += `    <img src="${mImg.filename}" alt="${alt}"/>\n`;
          if (cap) {
            contentHtml += `    <figcaption>${escapeXml(cap)}</figcaption>\n`;
          }
          contentHtml += `  </figure>\n`;
        }
      }
    }

    const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeXml(ch.title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <section epub:type="chapter" role="doc-chapter">
${contentHtml}
  </section>
</body>
</html>`;

    oebps.file(ch.filename, chapterXhtml);
  }

  if (onProgress) onProgress(60, 'Generating navigation document and table of contents...');

  // 5. OEBPS/nav.xhtml (EPUB 3 Navigation Document)
  const navListHtml = chapters
    .map(
      (ch) =>
        `      <li><a href="${ch.filename}">${escapeXml(ch.title)}</a></li>`
    )
    .join('\n');

  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8"/>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc" role="doc-toc">
    <h1>Table of Contents</h1>
    <ol>
${navListHtml}
    </ol>
  </nav>
</body>
</html>`;
  oebps.file('nav.xhtml', navXhtml);

  // 6. OEBPS/toc.ncx (EPUB 2 backward compatibility)
  const navPointsHtml = chapters
    .map(
      (ch, idx) => `  <navPoint id="navPoint-${idx + 1}" playOrder="${idx + 1}">
    <navLabel><text>${escapeXml(ch.title)}</text></navLabel>
    <content src="${ch.filename}"/>
  </navPoint>`
    )
    .join('\n');

  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="${lang}" dir="${dir}">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <docAuthor><text>${escapeXml(author)}</text></docAuthor>
  <navMap>
${navPointsHtml}
  </navMap>
</ncx>`;
  oebps.file('toc.ncx', tocNcx);

  if (onProgress) onProgress(80, 'Compiling package manifest and spine...');

  // 7. OEBPS/content.opf (Package Document)
  const manifestItems = [
    `    <item id="style" href="style.css" media-type="text/css"/>`,
    `    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    ...chapters.map(
      (ch) => `    <item id="${ch.id}" href="${ch.filename}" media-type="application/xhtml+xml"/>`
    ),
    ...manifestImages.map(
      (img) => `    <item id="${img.id}" href="${img.filename}" media-type="${img.mimeType}"/>`
    ),
  ].join('\n');

  const spineItems = chapters.map((ch) => `    <itemref idref="${ch.id}"/>`).join('\n');

  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id" xml:lang="${lang}" dir="${dir}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">${bookId}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>${lang}</dc:language>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
    <meta property="dcterms:modified">${modifiedDate}</meta>
    <meta name="generator" content="ATS EasyBook EPUB 3 Engine (Phase 5)"/>
  </metadata>
  <manifest>
${manifestItems}
  </manifest>
  <spine page-progression-direction="${dir}" toc="ncx">
${spineItems}
  </spine>
</package>`;

  oebps.file('content.opf', contentOpf);

  if (onProgress) onProgress(90, 'Packaging EPUB 3 zip archive...');

  const arrayBuffer = await zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const blob = new Blob([arrayBuffer], { type: 'application/epub+zip' });
  const filename = sanitizeEpubFilename(title);

  if (onProgress) onProgress(100, 'EPUB 3 generation complete!');

  return {
    blob,
    filename,
    arrayBuffer,
  };
}

/**
 * Triggers browser download for an EPUB blob.
 */
export function downloadEpubBlob(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
