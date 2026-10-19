'use client';

import React, { useState } from 'react';
import {
  PrintSpecification,
  PrintOrderDraft,
  ShippingAddress,
  PaperStock,
  BindingType,
  InteriorColorMode,
} from '@/types/print';
import { printProviderService, STANDARD_PRINT_SPECS } from '@/services/print/printProviderService';
import { BookProject } from '@/types/book';
import { bookRepository } from '@/services/storage/bookRepository';
import {
  X,
  Printer,
  CheckCircle2,
  AlertCircle,
  Package,
  Truck,
  DollarSign,
  Layers,
  MapPin,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface PrintOrderModalProps {
  isOpen: boolean;
  project: BookProject;
  pageCount: number;
  onClose: () => void;
}

export const PrintOrderModal: React.FC<PrintOrderModalProps> = ({
  isOpen,
  project,
  pageCount,
  onClose,
}) => {
  const [selectedSpec, setSelectedSpec] = useState<PrintSpecification>(STANDARD_PRINT_SPECS[0]);
  const [quantity, setQuantity] = useState<number>(25);
  const [provider, setProvider] = useState<'mock-ingramspark' | 'mock-lulu'>('mock-ingramspark');

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    recipientName: project.author || 'Author',
    street1: '123 Publishing Way',
    city: 'Boston',
    stateOrProvince: 'MA',
    postalCode: '02108',
    country: 'United States',
  });

  const [orderDraft, setOrderDraft] = useState<PrintOrderDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validation = printProviderService.validateForPrint(project, pageCount, selectedSpec);
  const estimatedCost = printProviderService.estimateCost(pageCount, quantity, selectedSpec);

  const handleCreateDraftAndSimulate = async () => {
    const activeUser = bookRepository.getActiveUser();
    if (!activeUser) {
      setError('You must be signed in to configure a print order.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Create draft
      const draft = await printProviderService.createPrintOrderDraft(
        project.id,
        selectedSpec,
        quantity,
        shippingAddress,
        pageCount,
        provider,
        activeUser
      );

      // 2. Simulate submission to mock adapter
      const simulated = await printProviderService.simulateSubmitOrder(draft.id, activeUser);
      setOrderDraft(simulated);
    } catch (err: any) {
      setError(err.message || 'Error processing print order simulation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-modal-title"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 id="print-modal-title" className="text-base font-bold text-slate-900">
                Print-Provider Order Integration (Simulation)
              </h2>
              <p className="text-xs text-slate-500">
                Configure physical press run specifications & validate print readiness
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-print-modal-btn"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-800 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {orderDraft?.simulationResult ? (
            /* Simulation Success Banner */
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Simulated Press Order Dispatched Successfully</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                The order contract was validated and sent to the <strong>{orderDraft.provider === 'mock-ingramspark' ? 'IngramSpark' : 'Lulu Direct'}</strong> mock provider adapter. No real credit card was billed.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] font-mono bg-white p-3 rounded-lg border border-emerald-100">
                <div>
                  <span className="text-slate-400 block font-sans">Simulated Order Ref:</span>
                  <span className="font-bold text-slate-900">{orderDraft.simulationResult.orderReferenceNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Est. Ship Date:</span>
                  <span className="font-bold text-slate-900">{orderDraft.simulationResult.estimatedShipDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Carrier:</span>
                  <span className="font-bold text-slate-900">{orderDraft.simulationResult.carrier}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Tracking:</span>
                  <span className="font-bold text-slate-900">{orderDraft.simulationResult.trackingNumber}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setOrderDraft(null)}
                  className="px-4 py-1.5 bg-emerald-700 text-white rounded-lg font-bold hover:bg-emerald-800"
                >
                  Configure Another Order
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Specification Presets */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">
                  Select Print Specification Profile
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STANDARD_PRINT_SPECS.map((spec) => {
                    const isSelected = selectedSpec.id === spec.id;
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => setSelectedSpec(spec)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="font-bold text-slate-900 text-xs">{spec.name}</div>
                        <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                          <div>Binding: {spec.bindingType}</div>
                          <div>Paper: {spec.paperStock} • Color: {spec.interiorColor}</div>
                          <div>Min Pages: {spec.minPageCount} (Current: {pageCount})</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order Parameters */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Print Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="mock-ingramspark">Mock IngramSpark</option>
                    <option value="mock-lulu">Mock Lulu Direct</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Print Quantity (Units)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Estimated Production Cost
                  </label>
                  <div className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg font-bold text-indigo-700 text-sm">
                    ${estimatedCost.toFixed(2)} USD
                  </div>
                </div>
              </div>

              {/* Validation Feedback */}
              <div className="space-y-1.5 pt-1">
                {validation.errors.map((err, idx) => (
                  <div key={idx} className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{err}</span>
                  </div>
                ))}

                {validation.warnings.map((warn, idx) => (
                  <div key={idx} className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start space-x-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>

              {/* Destination Form */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Delivery / Shipping Address (Mock)</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id="shipping-name-input"
                    type="text"
                    value={shippingAddress.recipientName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, recipientName: e.target.value })}
                    placeholder="Recipient Name"
                    className="px-2.5 py-1 border border-slate-200 rounded bg-white"
                  />
                  <input
                    id="shipping-street-input"
                    type="text"
                    value={shippingAddress.street1}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street1: e.target.value })}
                    placeholder="Street Address"
                    className="px-2.5 py-1 border border-slate-200 rounded bg-white"
                  />
                  <input
                    id="shipping-city-input"
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    placeholder="City"
                    className="px-2.5 py-1 border border-slate-200 rounded bg-white"
                  />
                  <input
                    id="shipping-zip-input"
                    type="text"
                    value={shippingAddress.postalCode}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                    placeholder="Postal Code"
                    className="px-2.5 py-1 border border-slate-200 rounded bg-white"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!orderDraft?.simulationResult && (
          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <p className="text-[11px] text-slate-400">
              Provider mock adapter: No real orders placed or external APIs charged.
            </p>

            <button
              id="submit-print-order-btn"
              type="button"
              onClick={handleCreateDraftAndSimulate}
              disabled={isSubmitting || !validation.valid}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Simulation...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Simulate Order Submission (${estimatedCost.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
