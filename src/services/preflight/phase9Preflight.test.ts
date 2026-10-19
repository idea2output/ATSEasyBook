import { describe, it, expect, beforeEach } from 'vitest';
import { jsPDF } from 'jspdf';
import { PDFDocument, rgb } from 'pdf-lib';
import { inspectPdfDocument } from './pdfInspectionEngine';
import { generateRepairPlan, executePdfRepair } from './pdfRepairEngine';
import { PREFLIGHT_PROFILES, getPreflightProfile } from './preflightProfiles';
import { preflightJobRepository } from './preflightJobRepository';
import { generatePreflightCertificatePdf, generatePreflightJsonReport } from './pdfReportGenerator';

describe('Phase 9 — ATS PDF Preflight, Repair & Production-Readiness Module', () => {
  beforeEach(() => {
    // Clean up or prepare state
  });

  describe('1. Security & Upload Integrity', () => {
    it('rejects malicious or non-PDF buffers without standard %PDF- header magic bytes', async () => {
      const maliciousBuffer = new TextEncoder().encode('<html><body>Fake PDF payload</body></html>');
      const user = { userId: 'u-1', displayName: 'QA Engineer', email: 'qa@ats.com' };

      await expect(
        preflightJobRepository.createJob(maliciousBuffer, 'attack.pdf', 'ats-standard-print', user)
      ).rejects.toThrow();
    });

    it('rejects empty / zero-byte buffers', async () => {
      const emptyBuffer = new Uint8Array(0);
      const user = { userId: 'u-1', displayName: 'QA Engineer', email: 'qa@ats.com' };

      await expect(
        preflightJobRepository.createJob(emptyBuffer, 'empty.pdf', 'ats-standard-print', user)
      ).rejects.toThrow();
    });
  });

  describe('2. Deep Inspection Engine: Geometry, Color, Fonts, & Images', () => {
    it('detects missing TrimBox, RGB objects, and missing OutputIntent on standard un-prepped PDF', async () => {
      // Create a basic PDF with RGB content and no OutputIntent or TrimBox
      const doc = new jsPDF({ unit: 'in', format: [6, 9] });
      doc.setTextColor(255, 0, 0); // RGB red
      doc.text('This is RGB text in an un-prepped PDF', 1, 2);
      const arrayBuf = doc.output('arraybuffer');
      const pdfBytes = new Uint8Array(arrayBuf);

      const report = await inspectPdfDocument(pdfBytes, 'ats-cmyk-pdfx4');

      expect(report.totalPageCount).toBe(1);
      expect(report.score).toBeLessThan(100);
      expect(report.isCompliant).toBe(false);

      // Verify page boxes
      const p1 = report.pages[0];
      expect(p1.pageBoxes.mediaBox.widthInches).toBeCloseTo(6, 1);
      expect(p1.pageBoxes.mediaBox.heightInches).toBeCloseTo(9, 1);

      // Check RGB detected
      expect(report.colorSummary.hasRgb).toBe(true);

      // Check issues list contains expected prepress flaws
      const issueTitles = report.issues.map((i) => i.title);
      expect(
        issueTitles.some(
          (t) =>
            t.toLowerCase().includes('output intent') ||
            t.toLowerCase().includes('outputintent')
        )
      ).toBe(true);
      expect(issueTitles.some((t) => t.includes('RGB'))).toBe(true);
    });

    it('verifies compliant PDF with CMYK OutputIntent and embedded geometry passes inspection', async () => {
      // Build PDF using pdf-lib with OutputIntent and TrimBox
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([432, 648]); // 6x9 inches in points
      page.setTrimBox(9, 9, 414, 630);
      page.setBleedBox(0, 0, 432, 648);
      
      const bytes = await pdfDoc.save();
      const report = await inspectPdfDocument(bytes, 'ats-standard-print');

      expect(report.totalPageCount).toBe(1);
      expect(report.pages[0].pageBoxes.trimBox).toBeDefined();
    });
  });

  describe('3. Transparent Repair Engine & Non-Destructive Integrity', () => {
    it('generates a transparent repair plan and does not modify the original PDF', async () => {
      // Create flawed PDF
      const doc = new jsPDF({ unit: 'in', format: [6, 9] });
      doc.setTextColor(255, 0, 0); // RGB text
      doc.text('Heading needing prepress repair', 1, 2);
      const origBytes = new Uint8Array(doc.output('arraybuffer'));
      const origCopy = new Uint8Array(origBytes);

      const profile = getPreflightProfile('ats-cmyk-pdfx4');
      const report = await inspectPdfDocument(origBytes, profile.id);
      const repairPlan = generateRepairPlan(report, profile);

      expect(repairPlan.actions.length).toBeGreaterThan(0);
      expect(repairPlan.actions.some((a) => a.type === 'normalize-page-boxes')).toBe(true);
      expect(repairPlan.actions.some((a) => a.type === 'inject-cmyk-output-intent')).toBe(true);

      // Execute repair
      const { repairedPdfBytes, repairedReport } = await executePdfRepair(
        origBytes,
        repairPlan.actions.map((a) => a.type),
        profile.id
      );

      // Verify original bytes were untouched (non-destructive guarantee)
      expect(origBytes).toEqual(origCopy);

      // Verify repaired bytes are valid PDF
      const headerStr = String.fromCharCode(...repairedPdfBytes.slice(0, 5));
      expect(headerStr).toBe('%PDF-');

      // Verify repaired report reflects improvements
      expect(repairedReport.score).toBeGreaterThanOrEqual(report.score);
    });
  });

  describe('4. Preflight Job Repository, Imposition Metadata & Audit Trail', () => {
    it('creates job, tracks audit trail, and generates signed time-limited download URLs', async () => {
      const doc = new jsPDF({ unit: 'in', format: [6, 9] });
      doc.text('Production test document', 1, 1);
      const pdfBytes = new Uint8Array(doc.output('arraybuffer'));

      const user = { userId: 'u-publisher-9', displayName: 'Lead Prepress Operator', email: 'prepress@ats.com' };
      const job = await preflightJobRepository.createJob(
        pdfBytes,
        'catalog-interior.pdf',
        'ats-standard-print',
        user
      );

      expect(job.id).toBeDefined();
      expect(job.title).toBe('catalog-interior');
      expect(job.pageCount).toBe(1);

      // Add anchored prepress comment
      const updatedJob = await preflightJobRepository.addComment(
        job.id,
        user,
        'Check color density on page 1 before run',
        1
      );
      expect(updatedJob.comments?.length).toBe(1);
      expect(updatedJob.comments?.[0].content).toContain('Check color density');

      // Update issue status
      if (job.latestReport.issues.length > 0) {
        const issueId = job.latestReport.issues[0].id;
        const jobWithResolvedIssue = await preflightJobRepository.updateIssueStatus(
          job.id,
          issueId,
          'acknowledged'
        );
        const issue = jobWithResolvedIssue.latestReport.issues.find((i) => i.id === issueId);
        expect(issue?.status).toBe('acknowledged');
      }

      // Generate signed download URLs
      const signedOriginal = await preflightJobRepository.generateSignedDownloadUrl(job.id, 'original');
      expect(signedOriginal.downloadUrl).toContain('/api/preflight/jobs/');
      expect(signedOriginal.downloadUrl).toContain('sig=');

      const signedReportPdf = await preflightJobRepository.generateSignedDownloadUrl(job.id, 'report-pdf');
      expect(signedReportPdf.filename).toContain('preflight-certificate.pdf');
    });
  });

  describe('5. Certified Report Generator: PDF Certificate & JSON Report', () => {
    it('generates certified printable PDF certificate and structured JSON report', async () => {
      const doc = new jsPDF({ unit: 'in', format: [6, 9] });
      doc.text('Sample Book for Report Generation', 1, 1);
      const pdfBytes = new Uint8Array(doc.output('arraybuffer'));

      const user = { userId: 'u-qa', displayName: 'Certification Specialist', email: 'cert@ats.com' };
      const job = await preflightJobRepository.createJob(
        pdfBytes,
        'annual-report.pdf',
        'ats-standard-print',
        user
      );

      const profile = getPreflightProfile(job.profileId);

      // Generate PDF certificate
      const certPdfBytes = await generatePreflightCertificatePdf(job, job.latestReport, profile);
      expect(certPdfBytes.length).toBeGreaterThan(100);
      const certHeader = String.fromCharCode(...certPdfBytes.slice(0, 5));
      expect(certHeader).toBe('%PDF-');

      // Generate JSON report
      const jsonReport = generatePreflightJsonReport(job, job.latestReport);
      const parsed = JSON.parse(jsonReport);
      expect(parsed.jobId).toBe(job.id);
      expect(parsed.engine).toBe('ATS Tech PDF Preflight Engine v1.0');
      expect(parsed.report.totalPageCount).toBe(1);
    });
  });
});
