export type PaperStock = '50lb-white' | '60lb-cream' | '70lb-white' | '80lb-gloss';
export type BindingType = 'perfect-bound' | 'case-laminate-hardcover' | 'saddle-stitch' | 'coil-bound';
export type InteriorColorMode = 'black-and-white' | 'standard-color' | 'premium-color';

export interface PrintSpecification {
  id: string;
  name: string;
  trimWidthInches: number;
  trimHeightInches: number;
  paperStock: PaperStock;
  bindingType: BindingType;
  interiorColor: InteriorColorMode;
  includeBleed: boolean;
  bleedInches: number;
  minPageCount: number;
  maxPageCount: number;
  recommendedCmykProfile: string;
}

export interface ShippingAddress {
  recipientName: string;
  street1: string;
  street2?: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface PrintOrderDraft {
  id: string;
  projectId: string;
  projectTitle: string;
  provider: 'mock-ingramspark' | 'mock-lulu';
  specification: PrintSpecification;
  quantity: number;
  shippingAddress: ShippingAddress;
  pdfExportJobId?: string;
  estimatedCostUsd: number;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  status: 'draft' | 'validated' | 'simulated-submitted';
  simulationResult?: {
    orderReferenceNumber: string;
    estimatedShipDate: string;
    carrier: string;
    trackingNumber: string;
  };
  createdAt: string;
  updatedAt: string;
}
