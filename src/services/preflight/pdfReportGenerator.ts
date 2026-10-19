import { jsPDF } from 'jspdf';
import { PreflightReport, PreflightJob } from '@/types/preflight';

/**
 * Generates a certified print preflight summary report PDF.
 */
export async function generatePreflightPdfReport(
  report: PreflightReport,
  job?: PreflightJob
): Promise<Uint8Array> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - (margin * 2);

  let y = margin;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 80, 'F');

  // Red accent brand bar
  doc.setFillColor(225, 29, 72); // ATS Red
  doc.rect(0, 78, pageWidth, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ATS TECH PREFLIGHT CERTIFICATE', margin, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Certified Prepress Verification & Print Production Inspection', margin, 54);

  const statusColor = report.isCompliant ? [16, 185, 129] : [225, 29, 72]; // emerald or rose
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(pageWidth - margin - 110, 24, 110, 28, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(report.isCompliant ? 'PASSED (100%)' : `SCORE: ${report.complianceScore}%`, pageWidth - margin - 55, 42, { align: 'center' });

  y = 110;

  // Job & File Info
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Inspection Overview', margin, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  const col1X = margin;
  const col2X = margin + 260;

  doc.text(`File: ${job?.originalFilename || 'Document.pdf'}`, col1X, y);
  doc.text(`Inspected Profile: ${report.profileName}`, col2X, y);
  y += 14;

  doc.text(`Pages: ${report.totalPageCount}  •  PDF Version: ${report.pdfVersion}`, col1X, y);
  doc.text(`Date: ${new Date(report.inspectedAt).toLocaleString()}`, col2X, y);
  y += 14;

  const outputIntentStr = report.outputIntent?.conditionId
    ? `${report.outputIntent.conditionId} (${report.outputIntent.isPdfx ? 'PDF/X Validated' : 'Custom'})`
    : 'None (Missing)';
  doc.text(`Output Intent: ${outputIntentStr}`, col1X, y);
  doc.text(`Color Model: ${report.colorSummary.cmykCompliant ? 'Pure CMYK / Spot' : 'Contains RGB'}`, col2X, y);
  y += 24;

  // KPI Summary Cards
  const cardW = (contentWidth - 30) / 4;
  const cardH = 50;

  const kpis = [
    { label: 'CRITICAL ERRORS', val: report.summary.errorsCount, color: report.summary.errorsCount === 0 ? [16, 185, 129] : [225, 29, 72] },
    { label: 'WARNINGS', val: report.summary.warningsCount, color: report.summary.warningsCount === 0 ? [16, 185, 129] : [217, 119, 6] },
    { label: 'FONTS EMBEDDED', val: `${report.fontSummary.embeddedCount}/${report.fontSummary.totalFonts}`, color: report.fontSummary.allEmbedded ? [16, 185, 129] : [225, 29, 72] },
    { label: 'MIN IMAGE DPI', val: `${report.imageSummary.minDpiFound} DPI`, color: report.imageSummary.minDpiFound >= 300 ? [16, 185, 129] : [217, 119, 6] },
  ];

  kpis.forEach((kpi, idx) => {
    const kX = margin + idx * (cardW + 10);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(kX, y, cardW, cardH, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(String(kpi.val), kX + (cardW / 2), y + 24, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, kX + (cardW / 2), y + 38, { align: 'center' });
  });

  y += cardH + 24;

  // Issues Section
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Preflight Issues (${report.issues.length})`, margin, y);
  y += 16;

  if (report.issues.length === 0) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, y, contentWidth, 36, 4, 4, 'FD');
    doc.setTextColor(21, 128, 61);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('✓ Zero preflight issues detected. Document passes all print production rules.', margin + 14, y + 22);
    y += 50;
  } else {
    for (const issue of report.issues.slice(0, 12)) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = margin;
      }

      const isErr = issue.severity === 'error';
      const isWarn = issue.severity === 'warning';
      const badgeBg = isErr ? [254, 242, 242] : isWarn ? [255, 251, 235] : [240, 249, 255];
      const badgeBorder = isErr ? [254, 202, 202] : isWarn ? [254, 240, 138] : [186, 230, 253];
      const badgeText = isErr ? [185, 28, 28] : isWarn ? [161, 98, 7] : [3, 105, 161];

      doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
      doc.setDrawColor(badgeBorder[0], badgeBorder[1], badgeBorder[2]);
      doc.roundedRect(margin, y, contentWidth, 34, 3, 3, 'FD');

      // Severity badge
      doc.setFillColor(badgeText[0], badgeText[1], badgeText[2]);
      doc.roundedRect(margin + 6, y + 6, 48, 14, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(issue.severity.toUpperCase(), margin + 30, y + 16, { align: 'center' });

      // Title & page
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      const pageLabel = issue.pageNumbers.length > 0 ? `[Page ${issue.pageNumbers.join(', ')}] ` : '';
      doc.text(`${pageLabel}${issue.title}`, margin + 62, y + 16);

      // Description
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const descSnippet = issue.description.length > 95 ? issue.description.substring(0, 95) + '...' : issue.description;
      doc.text(descSnippet, margin + 62, y + 27);

      y += 40;
    }
  }

  // Footer on current page
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated by ATS Tech Preflight & Production Engine • Strictly confidential', margin, pageHeight - 20);
  doc.text(`Page 1 of 1`, pageWidth - margin, pageHeight - 20, { align: 'right' });

  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}

/**
 * Returns formatted JSON preflight report string.
 */
export function generatePreflightJsonReport(reportOrJob: any, reportArg?: any): string {
  const rep = reportArg || reportOrJob?.latestReport || reportOrJob;
  return JSON.stringify(
    {
      engine: 'ATS Tech PDF Preflight Engine v1.0',
      jobId: reportOrJob?.id || rep?.jobId || '',
      generatedAt: new Date().toISOString(),
      report: rep,
    },
    null,
    2
  );
}

export async function generatePreflightCertificatePdf(
  jobOrReport: any,
  reportOrJob?: any,
  profile?: any
): Promise<Uint8Array> {
  const report = jobOrReport?.summary ? jobOrReport : reportOrJob?.summary ? reportOrJob : jobOrReport?.latestReport || reportOrJob;
  const job = jobOrReport?.title ? jobOrReport : reportOrJob?.title ? reportOrJob : undefined;
  return generatePreflightPdfReport(report, job);
}

