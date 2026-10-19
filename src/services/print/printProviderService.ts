import crypto from 'crypto';
import { db } from '../cloud/database';
import {
  PrintSpecification,
  PrintOrderDraft,
  ShippingAddress,
  PaperStock,
  BindingType,
  InteriorColorMode,
} from '@/types/print';
import { BookProject } from '@/types/book';
import { ProjectAccessContext, cloudProjectService } from '../cloud/cloudProjectService';
import { authService } from '../cloud/authService';

export const STANDARD_PRINT_SPECS: PrintSpecification[] = [
  {
    id: 'spec-trade-pb-6x9',
    name: 'Standard Trade Paperback, 6 × 9 in',
    trimWidthInches: 6.0,
    trimHeightInches: 9.0,
    paperStock: '50lb-white',
    bindingType: 'perfect-bound',
    interiorColor: 'black-and-white',
    includeBleed: true,
    bleedInches: 0.125,
    minPageCount: 24,
    maxPageCount: 800,
    recommendedCmykProfile: 'FOGRA39',
  },
  {
    id: 'spec-digest-cream-5.5x8.5',
    name: 'Digest Fiction, 5.5 × 8.5 in, Cream Paper',
    trimWidthInches: 5.5,
    trimHeightInches: 8.5,
    paperStock: '60lb-cream',
    bindingType: 'perfect-bound',
    interiorColor: 'black-and-white',
    includeBleed: true,
    bleedInches: 0.125,
    minPageCount: 24,
    maxPageCount: 700,
    recommendedCmykProfile: 'FOGRA39',
  },
  {
    id: 'spec-illustrated-color-8x10',
    name: 'Illustrated Book, 8 × 10 in, Premium Color',
    trimWidthInches: 8.0,
    trimHeightInches: 10.0,
    paperStock: '80lb-gloss',
    bindingType: 'case-laminate-hardcover',
    interiorColor: 'premium-color',
    includeBleed: true,
    bleedInches: 0.125,
    minPageCount: 32,
    maxPageCount: 500,
    recommendedCmykProfile: 'FOGRA39',
  },
  {
    id: 'spec-report-magazine-a4',
    name: 'Corporate Report / Magazine, A4 Saddle Stitch',
    trimWidthInches: 8.27,
    trimHeightInches: 11.69,
    paperStock: '70lb-white',
    bindingType: 'saddle-stitch',
    interiorColor: 'standard-color',
    includeBleed: true,
    bleedInches: 0.125,
    minPageCount: 8,
    maxPageCount: 48,
    recommendedCmykProfile: 'FOGRA39',
  },
];

export class PrintProviderService {
  /**
   * Validates a book project and its page count against a chosen print specification.
   */
  public validateForPrint(
    project: BookProject,
    pageCount: number,
    spec: PrintSpecification
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Page count checks
    if (pageCount < spec.minPageCount) {
      errors.push(
        `Page count violation: The book currently has ${pageCount} pages, but ${spec.bindingType} binding requires at least ${spec.minPageCount} pages.`
      );
    }

    if (pageCount > spec.maxPageCount) {
      errors.push(
        `Page count violation: The book has ${pageCount} pages, exceeding the maximum limit of ${spec.maxPageCount} pages for this paper and binding specification.`
      );
    }

    if (spec.bindingType === 'saddle-stitch' && pageCount % 4 !== 0) {
      errors.push(
        `Saddle stitch violation: Total page count (${pageCount}) must be a multiple of 4 for folded signatures.`
      );
    }

    // 2. Bleed check
    if (spec.includeBleed && !project.exportOptions?.includeBleed) {
      warnings.push(
        'Print specification recommends bleed (0.125 in) for full edge-to-edge trimming. Ensure bleed is enabled in export options.'
      );
    }

    // 3. CMYK check
    if (project.colorSettings?.outputProfileId !== spec.recommendedCmykProfile) {
      warnings.push(
        `Output profile mismatch: Project is configured for ${project.colorSettings?.outputProfileId || 'None'}, whereas the print provider recommends ${spec.recommendedCmykProfile}.`
      );
    }

    // 4. Image resolution check
    const lowResImages = (project.images || []).filter((img) => img.width < 1200 && img.height < 1200);
    if (lowResImages.length > 0) {
      warnings.push(
        `${lowResImages.length} image(s) may fall below 300 DPI at full column width. Verify high-resolution source images before order submission.`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Calculates estimated manufacturing cost based on quantity, pages, paper, and color.
   */
  public estimateCost(
    pageCount: number,
    quantity: number,
    spec: PrintSpecification
  ): number {
    let baseBindingCost = 2.50; // base binding setup per unit
    if (spec.bindingType === 'case-laminate-hardcover') baseBindingCost = 6.80;
    if (spec.bindingType === 'saddle-stitch') baseBindingCost = 1.20;

    let perPageCost = 0.015; // B&W
    if (spec.interiorColor === 'standard-color') perPageCost = 0.038;
    if (spec.interiorColor === 'premium-color') perPageCost = 0.065;

    const unitCost = baseBindingCost + pageCount * perPageCost;
    const total = unitCost * quantity;
    return Math.round(total * 100) / 100;
  }

  /**
   * Creates a draft print order.
   */
  public async createPrintOrderDraft(
    projectId: string,
    spec: PrintSpecification,
    quantity: number,
    shippingAddress: ShippingAddress,
    pageCount: number,
    provider: 'mock-ingramspark' | 'mock-lulu' = 'mock-ingramspark',
    user: ProjectAccessContext
  ): Promise<PrintOrderDraft> {
    cloudProjectService.assertPermission(projectId, user, 'PRINT_ORDER_CONFIGURE');

    const project = await cloudProjectService.getProjectById(projectId, user);
    if (!project) throw new Error('Project not found');

    const validation = this.validateForPrint(project, pageCount, spec);
    const estimatedCostUsd = this.estimateCost(pageCount, quantity, spec);

    const orderId = `order-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    const order: PrintOrderDraft = {
      id: orderId,
      projectId,
      projectTitle: project.title,
      provider,
      specification: spec,
      quantity,
      shippingAddress,
      estimatedCostUsd,
      validation,
      status: validation.valid ? 'validated' : 'draft',
      createdAt: now,
      updatedAt: now,
    };

    db.insert('print_orders', order);

    authService.logAudit('print.draft_created', user.userId, user.userEmail, {
      orderId,
      projectId,
      provider,
      quantity,
      estimatedCostUsd,
    }, projectId);

    return order;
  }

  /**
   * Simulates order submission to the mock print provider.
   * NOTE: Never connects to external live APIs without explicit authorization.
   */
  public async simulateSubmitOrder(
    orderId: string,
    user: ProjectAccessContext
  ): Promise<PrintOrderDraft> {
    const order = db.findById<PrintOrderDraft>('print_orders', orderId);
    if (!order) throw new Error('Order not found');

    cloudProjectService.assertPermission(order.projectId, user, 'PRINT_ORDER_CONFIGURE');

    if (!order.validation.valid) {
      throw new Error(`Cannot submit order: Specification validation failed (${order.validation.errors.join(', ')}).`);
    }

    const providerPrefix = order.provider === 'mock-ingramspark' ? 'ING' : 'LULU';
    const referenceNumber = `${providerPrefix}-SIM-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const estimatedShipDate = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const simulationResult = {
      orderReferenceNumber: referenceNumber,
      estimatedShipDate,
      carrier: 'FedEx Ground Delivery',
      trackingNumber: `TRK-SIM-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    };

    const updated = db.update<PrintOrderDraft>('print_orders', orderId, {
      status: 'simulated-submitted',
      simulationResult,
      updatedAt: new Date().toISOString(),
    });

    authService.logAudit('print.order_simulated', user.userId, user.userEmail, {
      orderId,
      projectId: order.projectId,
      referenceNumber,
    }, order.projectId);

    return updated!;
  }

  /**
   * Lists print orders for a project.
   */
  public async listOrdersForProject(projectId: string, user: ProjectAccessContext): Promise<PrintOrderDraft[]> {
    cloudProjectService.assertPermission(projectId, user, 'PRINT_ORDER_VIEW');
    return db.find<PrintOrderDraft>('print_orders', (o) => o.projectId === projectId);
  }
}

export const printProviderService = new PrintProviderService();
