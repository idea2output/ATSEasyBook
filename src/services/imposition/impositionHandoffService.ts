/**
 * Prepress-to-Imposition Job Handoff Service.
 * Constructs validated, versioned handoff packets conforming to Schema 1.0.
 */

import { BookProject, BookTemplate, PreflightSummary } from '@/types/book';
import { PreflightJob } from '@/types/preflight';
import { ImpositionHandoffPayload } from '@/types/impositionHandoff';

/**
 * Creates an Imposition handoff packet from an ATS EasyBook project.
 */
export function createHandoffFromBookProject(
  book: BookProject,
  template: BookTemplate,
  totalPagesCount: number,
  preflightSummary?: PreflightSummary
): ImpositionHandoffPayload {
  const pagesPerSig = 16;
  const sigCount = Math.ceil(totalPagesCount / pagesPerSig);
  const remainder = totalPagesCount % pagesPerSig;
  const blankBalance = remainder === 0 ? 0 : pagesPerSig - remainder;

  return {
    schemaVersion: '1.0',
    handoffId: `handoff-eb-${book.id}-${Date.now().toString(36)}`,
    sourceApp: 'ATS EasyBook',
    timestamp: new Date().toISOString(),
    sourceProjectId: book.id,
    document: {
      title: book.title || 'Untitled Manuscript',
      pdfFileName: `${(book.title || 'book').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-interior.pdf`,
      pdfChecksumSha256: 'simulated-checksum-placeholder',
      totalPageCount: totalPagesCount,
      trimWidthInches: template.pageWidthInches,
      trimHeightInches: template.pageHeightInches,
      trimWidthPt: template.pageWidthInches * 72,
      trimHeightPt: template.pageHeightInches * 72,
      bleedInches: {
        top: template.bleedInches ?? 0.125,
        bottom: template.bleedInches ?? 0.125,
        left: template.bleedInches ?? 0.125,
        right: template.bleedInches ?? 0.125,
      },
      orientation: template.pageWidthInches > template.pageHeightInches ? 'landscape' : 'portrait',
      bindingGutterInches: template.margins?.gutterInches || 0.125,
    },
    prepress: {
      colorSpace: 'CMYK',
      outputIntentProfile:
        book.colorSettings?.outputProfileId ||
        book.exportOptions?.colorManagement?.outputProfileId ||
        'FOGRA39',
      preflightStatus:
        preflightSummary && preflightSummary.errorsCount === 0
          ? preflightSummary.warningsCount === 0
            ? 'passed'
            : 'warning'
          : 'warning',
      preflightComplianceScore:
        preflightSummary && preflightSummary.errorsCount === 0 ? (preflightSummary.warningsCount === 0 ? 100 : 85) : 60,
      hasSpotColors: false,
      isPure100KBlackText:
        book.colorSettings?.blackHandling === 'standard-text' ||
        book.exportOptions?.colorManagement?.blackHandling === 'standard-text' ||
        true,
    },
    impositionIntent: {
      bindingType: totalPagesCount > 48 ? 'perfect-bound' : 'saddle-stitch',
      pagesPerSignature: pagesPerSig,
      targetSheetSize: 'Super-B/A3',
      targetSheetWidthInches: 13,
      targetSheetHeightInches: 19,
      creepCompensationNeeded: totalPagesCount <= 48,
      estimatedSignaturesCount: Math.max(1, sigCount),
      blankPagesBalanceNeeded: blankBalance,
    },
    context: {
      organizationId: book.organizationId,
      organizationName: 'ATS Publishing Studio',
    },
  };
}

/**
 * Creates an Imposition handoff packet from an ATS Preflight Job.
 */
export function createHandoffFromPreflightJob(job: PreflightJob): ImpositionHandoffPayload {
  const report = job.latestReport || job.repairedReport;
  const firstPage = report?.pages[0];
  const media = firstPage?.pageBoxes.mediaBox;
  const trim = firstPage?.pageBoxes.trimBox || media;
  const bleed = firstPage?.pageBoxes.bleedAmountInches || { top: 0.125, bottom: 0.125, left: 0.125, right: 0.125 };

  const totalPages = report?.totalPageCount || job.pageCount || 1;
  const pagesPerSig = 16;
  const sigCount = Math.ceil(totalPages / pagesPerSig);
  const remainder = totalPages % pagesPerSig;
  const blankBalance = remainder === 0 ? 0 : pagesPerSig - remainder;

  const fileName = job.originalFilename || (job as any).fileName || 'preflight-document.pdf';

  return {
    schemaVersion: '1.0',
    handoffId: `handoff-pf-${job.id}-${Date.now().toString(36)}`,
    sourceApp: 'ATS Preflight',
    timestamp: new Date().toISOString(),
    preflightJobId: job.id,
    document: {
      title: job.title || fileName.replace(/\.pdf$/i, ''),
      pdfFileName: fileName,
      pdfChecksumSha256: (job as any).fileChecksumSha256 || 'simulated-checksum-placeholder',
      secureAssetUrl: job.originalAssetKey || (job as any).sourceFileStoragePath,
      totalPageCount: totalPages,
      trimWidthInches: trim?.widthInches || 6,
      trimHeightInches: trim?.heightInches || 9,
      trimWidthPt: trim?.width || 432,
      trimHeightPt: trim?.height || 648,
      bleedInches: {
        top: bleed.top || 0.125,
        bottom: bleed.bottom || 0.125,
        left: bleed.left || 0.125,
        right: bleed.right || 0.125,
      },
      orientation: firstPage?.pageBoxes.orientation || 'portrait',
      bindingGutterInches: 0.125,
    },
    prepress: {
      colorSpace: (
        report?.colorSummary?.colorSpaces?.includes('DeviceCMYK') ||
        (report as any)?.hasCmyk ||
        (report as any)?.colorSpacesFound?.includes('DeviceCMYK') ||
        (report?.pages?.[0]?.hasCmyk) ||
        (report?.pages?.[0]?.colorSpacesFound?.includes('DeviceCMYK'))
      ) ? 'CMYK' : 'Monochrome',
      outputIntentProfile: report?.outputIntent?.conditionId || 'FOGRA39',
      preflightStatus: report?.isCompliant ? (job.repairedReport ? 'repaired' : 'passed') : 'warning',
      preflightComplianceScore: report?.complianceScore ?? 100,
      hasSpotColors: (report?.colorSummary?.spotColors?.length ?? 0) > 0,
      spotColorNames: report?.colorSummary?.spotColors,
      isPure100KBlackText: report?.colorSummary?.pure100kBlackEnforced ?? true,
    },
    impositionIntent: {
      bindingType: totalPages > 48 ? 'perfect-bound' : 'saddle-stitch',
      pagesPerSignature: pagesPerSig,
      targetSheetSize: 'Super-B/A3',
      targetSheetWidthInches: 13,
      targetSheetHeightInches: 19,
      creepCompensationNeeded: totalPages <= 48,
      estimatedSignaturesCount: Math.max(1, sigCount),
      blankPagesBalanceNeeded: blankBalance,
    },
    context: {
      organizationId: job.organizationId,
      operatorEmail: job.uploadedBy?.email || (job as any).uploadedByEmail,
      pressProfile: job.profileId,
    },
  };
}

/**
 * Downloads the handoff payload as a structured JSON file.
 */
export function downloadHandoffPacket(payload: ImpositionHandoffPayload): void {
  if (typeof window === 'undefined') return;
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${payload.handoffId}.ats-job.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
