# ATS Prepress-to-Imposition Job Handoff Specification (Version 1.0)

> [!IMPORTANT]
> **Zero Source Modification Principle**: This contract enables ATS EasyBook and ATS Preflight to generate standardized job packages for ATS Imposition (MyDraw) without requiring modifications to MyDraw's internal source code or native `.ats` file serialization.

---

## 1. Overview & Protocol Purpose

In commercial print production, passing raw PDFs to an imposition operator frequently leads to production stops due to ambiguous trim geometry, unknown bleed values, uncommunicated binding types, or unverified ink separations.

The **ATS Imposition Handoff Protocol** encapsulates:
1. **Physical Page Geometry**: Strict trim box, bleed insets (top, bottom, left, right), binding gutters, and orientation.
2. **Prepress Verification Summary**: Independent PDF inspection status, ISO output intent profile (`FOGRA39`, `FOGRA51`), pure 100K body black verification, and color separations.
3. **Imposition Recommendation**: Recommended binding type (`saddle-stitch` vs. `perfect-bound`), signature size (e.g. 16-up), estimated signatures count, and blank balance pages.
4. **Data Integrity & Traceability**: Source application, project/job reference IDs, and SHA-256 PDF integrity hash.

---

## 2. JSON Schema & Field Definitions

```json
{
  "schemaVersion": "1.0",
  "handoffId": "handoff-pf-job-1729420000000-abc123z",
  "sourceApp": "ATS Preflight",
  "timestamp": "2026-10-20T10:30:00.000Z",
  "preflightJobId": "job-1729420000000",
  "document": {
    "title": "Classic Novel Interior Edition",
    "pdfFileName": "classic-novel-sample.pdf",
    "pdfChecksumSha256": "4a7d1ed414474e4033ac29ccb8653d9b",
    "secureAssetUrl": "data/storage/preflight/job-1729420000000/original.pdf",
    "totalPageCount": 128,
    "trimWidthInches": 6.0,
    "trimHeightInches": 9.0,
    "trimWidthPt": 432.0,
    "trimHeightPt": 648.0,
    "bleedInches": {
      "top": 0.125,
      "bottom": 0.125,
      "left": 0.125,
      "right": 0.125
    },
    "orientation": "portrait",
    "bindingGutterInches": 0.125
  },
  "prepress": {
    "colorSpace": "CMYK",
    "outputIntentProfile": "FOGRA39",
    "preflightStatus": "passed",
    "preflightComplianceScore": 100,
    "hasSpotColors": false,
    "isPure100KBlackText": true
  },
  "impositionIntent": {
    "bindingType": "perfect-bound",
    "pagesPerSignature": 16,
    "targetSheetSize": "Super-B/A3",
    "targetSheetWidthInches": 13.0,
    "targetSheetHeightInches": 19.0,
    "creepCompensationNeeded": false,
    "estimatedSignaturesCount": 8,
    "blankPagesBalanceNeeded": 0
  },
  "context": {
    "organizationId": "org-default",
    "operatorEmail": "operator@atstech.com",
    "pressProfile": "ats-cmyk-pdfx4"
  }
}
```

---

## 3. Security & Gateway Rules

1. **No Credentials in Query Strings**: Authentication and project authorization are handled strictly at the gateway boundary. No API tokens, passwords, or session IDs are ever placed in URL query parameters.
2. **Deterministic Checksum**: The `pdfChecksumSha256` ensures that the PDF opened inside Imposition is identical to the file certified by ATS Preflight.
3. **Signatures Math & Blank Balancing**:
   $$\text{Signatures Count} = \left\lceil \frac{\text{Total Pages}}{\text{Pages per Signature}} \right\rceil$$
   $$\text{Blank Balance} = (\text{Pages per Signature} - (\text{Total Pages} \pmod{\text{Pages per Signature}})) \pmod{\text{Pages per Signature}}$$
