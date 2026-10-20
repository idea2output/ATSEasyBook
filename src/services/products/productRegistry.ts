/**
 * ATS Tech Central Product Registry
 * Single source of truth for all modules in the ATS Tech publishing platform.
 */

import React from 'react';
import { UserProfile, UserRole } from '@/types/auth';

export type ProductStatus = 'available' | 'beta' | 'coming-soon' | 'archived';
export type ProductCategory = 'Publishing' | 'Prepress' | 'Workflow' | 'Automation';

export interface ProductRegistryItem {
  id: string;
  name: string;
  shortName: string;
  category: ProductCategory;
  status: ProductStatus;
  version: string;
  tagline: string;
  description: string;
  scopeHighlight: string;
  publicUrl: string;
  authenticatedUrl: string;
  iconName: string;
  badgeText?: string;
  allowedRoles: string[];
  keyFeatures: string[];
}

export const ATS_PRODUCTS: ProductRegistryItem[] = [
  // -------------------------------------------------------------
  // AVAILABLE CORE PLATFORM MODULES (Phases 1 - 11)
  // -------------------------------------------------------------
  {
    id: 'easybook',
    name: 'ATS EasyBook',
    shortName: 'EasyBook',
    category: 'Publishing',
    status: 'available',
    version: 'v8.0.0',
    tagline: 'Precision Book Layout & CMYK PDF Export',
    description: 'Cloud & local-first professional book layout platform with DOM-measured pagination, multi-column flow, Hindi & RTL typography, and certified CMYK PDF/X prepress export.',
    scopeHighlight: 'DOM-measured vertical text flow, RTL shaping, and PDF/X-4 CMYK export.',
    publicUrl: '/#products',
    authenticatedUrl: '/easybook',
    iconName: 'BookOpen',
    badgeText: 'Available Now',
    allowedRoles: ['Owner', 'Administrator', 'Editor', 'Reviewer', 'Viewer'],
    keyFeatures: [
      'Accurate DOM text-flow pagination without premature blank space',
      'Certified CMYK FOGRA39 output with pure 100K black & overprint',
      'Arabic & Urdu RTL layout with bidirectional punctuation & numerals',
      'Custom Page templates with fixed background layers & editable zones',
      'Multi-user collaboration with RBAC permissions & version history',
    ],
  },
  {
    id: 'preflight',
    name: 'ATS Preflight',
    shortName: 'Preflight',
    category: 'Prepress',
    status: 'available',
    version: 'v1.0.0',
    tagline: 'Deep PDF/X & ISO 12647-2 Inspection & Repair',
    description: 'Dedicated prepress validation and repair engine parsing low-level PDF object graphs. Audits CMYK separations, pure 100K black text, page box geometries, font embedding, and image DPI with transparent, non-destructive repair.',
    scopeHighlight: 'Deep object stream parsing, 7 prepress profiles, and non-destructive ISO repair.',
    publicUrl: '/products/preflight',
    authenticatedUrl: '/preflight',
    iconName: 'ShieldCheck',
    badgeText: 'Available Now',
    allowedRoles: ['Owner', 'Administrator', 'Editor', 'Reviewer'],
    keyFeatures: [
      'Low-level PDF syntax & object stream parsing',
      '7 industry profiles: PDF/X-4, PDF/X-1a, Monochrome, High-Speed Digital',
      'Page box geometry auditing (MediaBox, TrimBox, BleedBox, CropBox)',
      'Rich black body text detection & knockout risk warnings',
      'Line-item non-destructive repair plans & side-by-side comparison',
    ],
  },
  {
    id: 'impose',
    name: 'ATS Impose',
    shortName: 'Impose',
    category: 'Prepress',
    status: 'available',
    version: 'v0.2.0',
    tagline: 'Commercial Press Sheet & Signature Imposition (MyDraw)',
    description: 'High-speed vector prepress imposition workspace. Automates multi-page signature layouts (8-up, 16-up), binding creep calculation, dynamic printer fold/crop marks, and custom press sheet layouts.',
    scopeHighlight: 'Independent MyDraw vector engine, saddle & perfect-bound signatures, and creep math.',
    publicUrl: '/#products',
    authenticatedUrl: '/Impose/',
    iconName: 'Layers',
    badgeText: 'Submodule v0.2.0',
    allowedRoles: ['Owner', 'Administrator', 'Editor', 'Reviewer', 'Viewer'],
    keyFeatures: [
      'Automated 8-page & 16-page press signatures',
      'Binding creep compensation & progressive gutter scaling',
      'Head-to-head & foot-to-foot commercial imposition schemes',
      'Custom press sheet sizes, gripper margins & fold marks',
      'Secure server-side one-time handoff from EasyBook & Preflight',
    ],
  },

  // -------------------------------------------------------------
  // COMING SOON ROADMAP MODULES (Dynamic Presentation)
  // -------------------------------------------------------------
  {
    id: 'multilingual-suite',
    name: 'ATS Multilingual Publishing Suite',
    shortName: 'Multilingual Suite',
    category: 'Publishing',
    status: 'coming-soon',
    version: 'Planned',
    tagline: 'Parallel Multi-Direction Edition Sync',
    description: 'Enterprise translation memory and multi-direction publishing pipeline for parallel English, Arabic, Urdu, Hindi, and CJK edition synchronisation.',
    scopeHighlight: 'Side-by-Side RTL/LTR Alignment & Translation Sync',
    publicUrl: '/#coming-soon',
    authenticatedUrl: '/coming-soon?module=multilingual-suite',
    iconName: 'Languages',
    allowedRoles: ['Owner', 'Administrator', 'Editor'],
    keyFeatures: ['Parallel translation memory', 'RTL/LTR dual-page spreads', 'Glossary enforcement'],
  },
  {
    id: 'variable-data',
    name: 'ATS Variable Data Printing',
    shortName: 'Variable Data',
    category: 'Publishing',
    status: 'coming-soon',
    version: 'Planned',
    tagline: 'High-Speed Multi-Record PDF Composition',
    description: 'Dynamic template population from structured CSV/JSON data: high-speed multi-record PDF composition with batch-level preflight validation.',
    scopeHighlight: 'High-Throughput VDP Engine with Dynamic Text Fitting',
    publicUrl: '/#coming-soon',
    authenticatedUrl: '/coming-soon?module=variable-data',
    iconName: 'Database',
    allowedRoles: ['Owner', 'Administrator', 'Editor'],
    keyFeatures: ['CSV/JSON batch data ingestion', 'Dynamic font size auto-fitting', 'Barcode & QR dynamic injection'],
  },
  {
    id: 'label-packaging',
    name: 'ATS Label, Barcode & Packaging Studio',
    shortName: 'Label & Packaging',
    category: 'Publishing',
    status: 'coming-soon',
    version: 'Planned',
    tagline: 'Vector Barcode & Dieline Separation',
    description: 'Vector barcode generator (EAN-13, ISBN-13, QR, DataMatrix), dieline layout, and packaging compliance tools for box and label production.',
    scopeHighlight: 'ISO/IEC Compliant Barcodes with Dieline Separation',
    publicUrl: '/#coming-soon',
    authenticatedUrl: '/coming-soon?module=label-packaging',
    iconName: 'Barcode',
    allowedRoles: ['Owner', 'Administrator', 'Editor'],
    keyFeatures: ['Vector ISBN-13 / EAN-13 generation', 'Spot color dieline cuts & creases', 'Trapping compliance'],
  },
  {
    id: 'color-ink-coverage',
    name: 'ATS Color & Ink Coverage Analyzer',
    shortName: 'Ink Coverage',
    category: 'Prepress',
    status: 'coming-soon',
    version: 'Planned',
    tagline: 'Total Area Coverage & Ink Estimation',
    description: 'Pixel-level Total Area Coverage (TAC) auditing, ink consumption calculation per separation (CMYK + spot), and high-TAC warnings.',
    scopeHighlight: 'Per-Plate Ink Volume Estimation & TAC Limit Audits',
    publicUrl: '/#coming-soon',
    authenticatedUrl: '/coming-soon?module=color-ink-coverage',
    iconName: 'Droplet',
    allowedRoles: ['Owner', 'Administrator', 'Editor'],
    keyFeatures: ['TAC 300% & 340% zone heatmap', 'CMYK ink weight estimation in grams', 'Spot plate volume analysis'],
  },
  {
    id: 'imposition-bridge',
    name: 'ATS Imposition + CTP Workflow Bridge',
    shortName: 'CTP Workflow Bridge',
    category: 'Prepress',
    status: 'coming-soon',
    version: 'Planned',
    tagline: 'Commercial RIP JDF/JMF Export',
    description: 'Direct JDF/JMF imposition ticket export for commercial CTP RIP engines (Harlequin, Apogee, Prinergy) with press registration crosshairs.',
    scopeHighlight: 'JDF/JMF Commercial RIP Export & Offset Plate Binding',
    publicUrl: '/#coming-soon',
    authenticatedUrl: '/coming-soon?module=imposition-bridge',
    iconName: 'Cpu',
    allowedRoles: ['Owner', 'Administrator'],
    keyFeatures: ['CIP4 JDF 1.6 compliant imposition tickets', 'Prinergy / Apogee connector presets', 'Direct plate RIP queueing'],
  },
  {
    id: 'job-portal',
    name: 'ATS Print Job Portal',
    shortName: 'Job Portal',
    category: 'Workflow',
    status: 'coming-soon',
    version: 'Planned',
    tagline: 'Customer-Facing Upload & Quoting',
    description: 'White-label customer-facing file upload and ordering portal with automated flight checks, live pre-pricing, and instantaneous order routing.',
    scopeHighlight: 'Self-Serve File Submission & Automated Preflight',
    publicUrl: '/#coming-soon',
    authenticatedUrl: '/coming-soon?module=job-portal',
    iconName: 'Globe',
    allowedRoles: ['Owner', 'Administrator'],
    keyFeatures: ['Client self-service file upload', 'Automated instant preflight scoring', 'Instant quote generation'],
  },
  {
    id: 'production-board',
    name: 'ATS Production Board / Print MIS Lite',
    shortName: 'Production Board',
    category: 'Workflow',
    status: 'coming-soon',
    version: 'Planned',
    tagline: 'Shop-Floor Kanban & Press Scheduling',
    description: 'Shop-floor kanban board tracking jobs through prepress, press, bindery, finishing, and dispatch with machine-hour scheduling.',
    scopeHighlight: 'Real-Time Floor Tracking & Stage Gating',
    publicUrl: '/#coming-soon',
    authenticatedUrl: '/coming-soon?module=production-board',
    iconName: 'Kanban',
    allowedRoles: ['Owner', 'Administrator', 'Editor'],
    keyFeatures: ['Shop floor kanban stages', 'Press downtime tracking', 'Finishing & bindery dispatch queue'],
  },
  {
    id: 'client-proofing',
    name: 'ATS Proofing & Client Approval',
    shortName: 'Client Proofing',
    category: 'Workflow',
    status: 'coming-soon',
    version: 'Planned',
    tagline: 'Digital Soft Proofing & Sign-Off',
    description: 'Digital soft proofing system with page-by-page annotations, CMYK simulation, legal e-signatures, and revision tracking for clients.',
    scopeHighlight: 'Legally Binding Client Sign-Off & Annotation Threads',
    publicUrl: '/#coming-soon',
    authenticatedUrl: '/coming-soon?module=client-proofing',
    iconName: 'CheckSquare',
    allowedRoles: ['Owner', 'Administrator', 'Editor', 'Reviewer'],
    keyFeatures: ['Browser-based CMYK soft proofing', 'Anchored review pins with reply threads', 'Legal timestamped sign-off certificate'],
  },
  {
    id: 'print-costing',
    name: 'ATS Print Estimator & Costing Engine',
    shortName: 'Print Estimator',
    category: 'Workflow',
    status: 'coming-soon',
    version: 'Planned',
    tagline: 'Paper Yield & Machine-Hour Costing',
    description: 'Paper yield optimization, press run-time estimators, plate counts, and ink cost models for commercial print house quotes.',
    scopeHighlight: 'Paper Sheet Optimization & Press Run Calculations',
    publicUrl: '/#coming-soon',
    authenticatedUrl: '/coming-soon?module=print-costing',
    iconName: 'Calculator',
    allowedRoles: ['Owner', 'Administrator'],
    keyFeatures: ['Parent sheet grain & yield calculator', 'Click charge & offset make-ready models', 'BOM generation for bindery operations'],
  },
  {
    id: 'gang-run-optimizer',
    name: 'ATS Gang-Run Optimizer',
    shortName: 'Gang-Run Optimizer',
    category: 'Automation',
    status: 'coming-soon',
    version: 'Planned',
    tagline: 'Multi-Customer Sheet Nesting',
    description: 'Algorithmic 2D bin-packing of diverse client orders (flyers, business cards, covers) onto shared press sheets with minimal waste.',
    scopeHighlight: 'Automated 2D Bin Packing for Sheet Yield Maximization',
    publicUrl: '/#coming-soon',
    authenticatedUrl: '/coming-soon?module=gang-run-optimizer',
    iconName: 'Scissors',
    allowedRoles: ['Owner', 'Administrator'],
    keyFeatures: ['Guillotine cut constraint solver', 'Mixed quantity balancing', 'Waste margin reduction below 4%'],
  },
  {
    id: 'large-format-tiling',
    name: 'ATS Large Format & Banner Tiling Studio',
    shortName: 'Large Format Studio',
    category: 'Automation',
    status: 'coming-soon',
    version: 'Planned',
    tagline: 'Multi-Panel Split & Grommet Marks',
    description: 'Automated wall mural and billboard tiling with configurable seam overlaps, pole pocket allowances, and grommet eyelet placement.',
    scopeHighlight: 'Seam Overlap Management & Grommet Marking Automation',
    publicUrl: '/#coming-soon',
    authenticatedUrl: '/coming-soon?module=large-format-tiling',
    iconName: 'Maximize',
    allowedRoles: ['Owner', 'Administrator'],
    keyFeatures: ['Multi-panel tile slicing with overlap', 'Pole pocket and hem margins', 'Automated grommet spacing calculations'],
  },
  {
    id: 'auto-hotfolders',
    name: 'ATS Automated Hotfolders & REST API',
    shortName: 'Hotfolders & API',
    category: 'Automation',
    status: 'coming-soon',
    version: 'Planned',
    tagline: 'Headless Prepress Processing',
    description: 'Server-side watch folders and webhook-driven REST API for hands-off PDF preflighting, auto-repair, imposition, and JDF dispatch.',
    scopeHighlight: 'Headless Preflight & Automated Imposition Pipelines',
    publicUrl: '/#coming-soon',
    authenticatedUrl: '/coming-soon?module=auto-hotfolders',
    iconName: 'Clock',
    allowedRoles: ['Owner', 'Administrator'],
    keyFeatures: ['Cloud SFTP & S3 bucket hotfolders', 'Webhook notifications on job completion', 'REST API with API key authentication'],
  },
];

/**
 * Returns all active products available for production use.
 */
export function getAvailableProducts(): ProductRegistryItem[] {
  return ATS_PRODUCTS.filter((p) => p.status === 'available' || p.status === 'beta');
}

/**
 * Returns future roadmap products that should appear in the Coming Soon catalog.
 * Note: When a product's status is changed to 'available' or 'beta', it is automatically
 * removed from this list, fulfilling Section 6 requirements.
 */
export function getComingSoonProducts(): ProductRegistryItem[] {
  return ATS_PRODUCTS.filter((p) => p.status === 'coming-soon');
}

/**
 * Look up a product by its identifier.
 */
export function getProductById(id: string): ProductRegistryItem | undefined {
  return ATS_PRODUCTS.find((p) => p.id.toLowerCase() === id.toLowerCase());
}

/**
 * Validates whether the given user has role-based entitlement to access a product.
 */
export function canUserAccessProduct(user: UserProfile | null, productId: string): {
  allowed: boolean;
  reason?: string;
} {
  const product = getProductById(productId);
  if (!product) {
    return { allowed: false, reason: `Product '${productId}' not found in registry.` };
  }

  // If product is coming soon
  if (product.status === 'coming-soon') {
    return {
      allowed: false,
      reason: `${product.name} is currently in development (Coming Soon). Join the early preview waitlist.`,
    };
  }

  // If public / not logged in
  if (!user) {
    return { allowed: false, reason: 'Authentication required to access this ATS product.' };
  }

  // Check role permissions
  const userRoleLower = (user.role || '').toLowerCase();
  const hasRole = product.allowedRoles.some((r) => r.toLowerCase() === userRoleLower);
  if (!hasRole) {
    return {
      allowed: false,
      reason: `Your current role (${user.role}) does not have permission to access ${product.name}. Required roles: ${product.allowedRoles.join(', ')}.`,
    };
  }

  return { allowed: true };
}
