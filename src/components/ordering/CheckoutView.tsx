import React, { useState, useEffect } from 'react';
import { CartItem, Order, OrderType, Outlet, PaymentMethod } from '../../types';
import { uploadImageToStorage } from '../../lib/supabase';
import { INITIAL_OUTLETS } from '../../data/initialData';

interface CheckoutViewProps {
  currentOutlet?: Outlet;
  outlet?: Outlet;
  cartItems?: CartItem[];
  items?: CartItem[];
  cartSubtotal?: number;
  subtotal?: number;
  cartPb1Tax?: number;
  pb1Tax?: number;
  ecoDiscount?: number;
  cartTotal?: number;
  total?: number;
  initialMode?: OrderType;
  orderType?: OrderType;
  onBackToMenu?: () => void;
  onBack?: () => void;
  onOrderPlaced: (order: Order) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  currentOutlet,
  outlet,
  cartItems,
  items,
  cartSubtotal,
  subtotal,
  cartPb1Tax,
  pb1Tax,
  ecoDiscount,
  cartTotal,
  total,
  initialMode,
  orderType,
  onBackToMenu,
  onBack,
  onOrderPlaced
}) => {
  const activeOutlet: Outlet = currentOutlet || outlet || INITIAL_OUTLETS[0];
  const effectiveCartItems = cartItems || items || [];
  const effectiveSubtotal = cartSubtotal ?? subtotal ?? 0;
  const effectivePb1Tax = cartPb1Tax ?? pb1Tax ?? 0;
  const effectiveTotal = cartTotal ?? total ?? 0;
  const effectiveInitialMode = initialMode || orderType || 'DINE IN';
  const handleBack = onBackToMenu || onBack || (() => {});

  const [fulfillmentMode, setFulfillmentMode] = useState<OrderType>(effectiveInitialMode);
  const [customerName, setCustomerName] = useState<string>('Aldi Pratama');
  const [customerPhone, setCustomerPhone] = useState<string>('+62 812-9842-1102');
  const [tableNumber, setTableNumber] = useState<string>('Table A12 — Sunlit Terrace');
  const [customerNote, setCustomerNote] = useState<string>(
    'Please separate ice for takeaway cup if possible, thank you!'
  );
  const [paymentMethod] = useState<PaymentMethod>('QRIS');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string>('');
  const [paymentProofFileName, setPaymentProofFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 15-Minute Countdown
  const [timeLeft, setTimeLeft] = useState<number>(14 * 60 + 48);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle Receipt Upload
  const handleReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Ukuran file maksimal 5MB');
        return;
      }
      setErrorMessage('');
      setPaymentProofFile(file);
      setPaymentProofFileName(file.name);
      const { url } = await uploadImageToStorage('receipts', file);
      setPaymentProofPreview(url);
    }
  };

  const handlePlaceOrder = async () => {
    setErrorMessage('');

    // Validations
    if (!customerName.trim()) {
      setErrorMessage('Silakan isi Nama Lengkap');
      return;
    }

    if (fulfillmentMode === 'DINE IN' && !tableNumber.trim()) {
      setErrorMessage('Silakan tentukan Nomor Meja untuk Dine In');
      return;
    }

    if (fulfillmentMode === 'TAKE AWAY' && !customerPhone.trim()) {
      setErrorMessage('Nomor WhatsApp wajib diisi untuk Take Away');
      return;
    }

    if (paymentMethod === 'QRIS' && !paymentProofPreview) {
      setErrorMessage('Silakan upload bukti pembayaran QRIS sebelum submit order');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderDate = new Date();
      const randomStan = Math.floor(100 + Math.random() * 900);
      const orderNumber = `LTN-${orderDate.getFullYear()}${(orderDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}${orderDate.getDate().toString().padStart(2, '0')}-${randomStan}`;

      let proofUrl = paymentProofPreview;
      if (paymentProofFile) {
        const uploaded = await uploadImageToStorage('receipts', paymentProofFile);
        proofUrl = uploaded.url;
      }

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        order_number: orderNumber,
        outlet_id: activeOutlet?.id || 'outlet-sudirman',
        outlet_name: activeOutlet?.name || 'Leton Coffee — Sudirman',
        customer_name: customerName,
        customer_phone: customerPhone,
        order_type: fulfillmentMode,
        table_number: fulfillmentMode === 'DINE IN' ? tableNumber : undefined,
        subtotal: effectiveSubtotal,
        pb1_tax: effectivePb1Tax,
        discount: ecoDiscount || 0,
        total: effectiveTotal,
        payment_method: 'QRIS',
        payment_status: 'WAITING VERIFICATION',
        order_status: 'NEW',
        customer_note: customerNote,
        payment_proof_url: proofUrl,
        payment_proof_filename: paymentProofFileName,
        created_at: orderDate.toISOString(),
        updated_at: orderDate.toISOString(),
        items: effectiveCartItems.map((item) => ({
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          order_id: '',
          product_id: item.product?.id || 'prod',
          product_name: item.product?.name || 'Drink',
          product_image: item.product?.image_url || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          options_summary: [
            item.options?.size ? `Size: ${item.options.size}${item.options.size === 'Large' ? ' (+Rp 5.000)' : ''}` : 'Size: Reguler',
            item.options?.temperature,
            item.options?.sweetness,
            ...(item.options?.toppings || []).filter((t) => t.price > 0).map((t) => `+${t.name}`),
            ...(item.options?.syrups || []).filter((s) => s.price > 0).map((s) => `+${s.name}`)
          ]
            .filter(Boolean)
            .join(' • '),
          options_detail: item.options
        }))
      };

      // Slight simulated server delay
      setTimeout(() => {
        setIsSubmitting(false);
        onOrderPlaced(newOrder);
      }, 800);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setErrorMessage('Terjadi kesalahan saat memproses order. Silakan coba lagi.');
    }
  };

  return (
    <div className="w-full bg-surface min-h-screen py-space-lg lg:py-space-xl">
      <div className="max-w-7xl mx-auto w-full px-margin-sm lg:px-margin-lg">
        {/* Progress Stepper Bar (Stitch exact layout) */}
        <div className="mb-space-xl">
          <div className="bg-surface-container-lowest shadow-[0_4px_24px_-4px_rgba(14,165,233,0.08)] rounded-full px-space-md py-space-sm sm:px-space-lg sm:py-space-md border border-surface-container">
            <div className="flex items-center justify-between max-w-4xl mx-auto text-center">
              {/* Step 1: Cart (Completed) */}
              <button
                onClick={onBackToMenu}
                className="flex items-center gap-space-xs sm:gap-space-sm cursor-pointer"
              >
                <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-fixed text-primary font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px]">
                    check
                  </span>
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant hidden sm:inline-block">
                  1. Your Cart
                </span>
              </button>
              <div className="flex-1 mx-2 sm:mx-4 h-0.5 bg-primary-fixed"></div>

              {/* Step 2: Details & Table (Active) */}
              <div className="flex items-center gap-space-xs sm:gap-space-sm">
                <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-container text-on-primary font-label-md text-label-md shadow-[0_0_14px_rgba(14,165,233,0.4)]">
                  2
                </span>
                <span className="font-label-lg text-label-lg text-on-surface font-semibold hidden sm:inline-block">
                  2. Details & Table
                </span>
              </div>
              <div className="flex-1 mx-2 sm:mx-4 h-0.5 bg-primary-container"></div>

              {/* Step 3: QRIS Payment */}
              <div className="flex items-center gap-space-xs sm:gap-space-sm">
                <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-container text-on-primary font-label-md text-label-md ring-4 ring-primary-fixed/60 animate-pulse">
                  <span className="material-symbols-outlined text-[16px]">
                    qr_code_scanner
                  </span>
                </span>
                <span className="font-label-lg text-label-lg text-primary font-bold">
                  3. QRIS Instant
                </span>
              </div>
              <div className="flex-1 mx-2 sm:mx-4 h-0.5 bg-surface-container"></div>

              {/* Step 4: Ready to Sip */}
              <div className="flex items-center gap-space-xs sm:gap-space-sm">
                <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-container text-outline font-label-md text-label-md">
                  4
                </span>
                <span className="font-label-md text-label-md text-outline hidden md:inline-block">
                  4. Ready to Sip
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm mb-space-xl">
          <div>
            <div className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm uppercase tracking-wider mb-space-xs">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              Direct Barista Flow • Instant Verification
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
              Checkout & QRIS Payment
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-space-xs mt-1">
              <span className="material-symbols-outlined text-[18px] text-primary-container">
                storefront
              </span>
              <span className="font-semibold text-on-surface">
                {activeOutlet?.name || 'Leton Coffee'}
              </span>
              <span>•</span>
              <span>Table Service & Quick Pick-up Synchronized</span>
            </p>
          </div>

          {/* Quick Session Badge */}
          <div className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-2 rounded-full shadow-xs border border-surface-container">
            <span className="material-symbols-outlined text-primary text-[20px]">
              timer
            </span>
            <div className="text-left font-label-sm text-label-sm">
              <span className="text-on-surface-variant block">Session expires in</span>
              <span className="font-bold text-primary font-headline-sm text-headline-sm leading-none">
                {formatCountdown(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Error notification if validation fails */}
        {errorMessage && (
          <div className="mb-space-lg p-space-md rounded-lg bg-error-container text-on-error-container flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span className="font-label-md font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Two-Column Master Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">
          {/* LEFT COLUMN: Customer info, fulfillment, payment selection & QRIS (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-space-lg">
            {/* 1. Customer Information Card */}
            <div className="bg-surface-container-lowest rounded-lg p-space-lg sm:p-space-xl shadow-[0_8px_30px_rgba(14,165,233,0.06)] relative overflow-hidden border border-surface-container">
              <div className="flex items-center justify-between mb-space-lg">
                <div className="flex items-center gap-space-sm">
                  <span className="w-8 h-8 rounded-full bg-surface-container-low text-primary flex items-center justify-center font-label-md text-label-md font-bold">
                    1
                  </span>
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    Customer Details
                  </h2>
                </div>
                <span className="text-primary font-label-sm text-label-sm bg-surface-container-low px-space-sm py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">bolt</span> Autofilled
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                {/* Full Name */}
                <div className="space-y-space-xs">
                  <label className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between">
                    <span>Full Name</span>
                    <span className="text-primary text-[11px]">Required</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-surface-container-low rounded-full px-space-lg py-2.5 font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all border border-surface-container"
                    />
                    <span className="material-symbols-outlined absolute right-space-md top-1/2 -translate-y-1/2 text-primary-container text-[18px]">
                      badge
                    </span>
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div className="space-y-space-xs">
                  <label className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between">
                    <span>WhatsApp Notification</span>
                    <span className="text-primary text-[11px]">Active</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-surface-container-low rounded-full px-space-lg py-2.5 font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all border border-surface-container"
                    />
                    <span className="material-symbols-outlined absolute right-space-md top-1/2 -translate-y-1/2 text-primary-container text-[18px]">
                      chat
                    </span>
                  </div>
                </div>

                {/* Notes For Barista */}
                <div className="sm:col-span-2 space-y-space-xs pt-space-xs">
                  <label className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between">
                    <span>Barista Tasting Notes / Delivery Request</span>
                    <span className="text-on-surface-variant font-normal text-[11px]">
                      Optional
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      className="w-full bg-surface-container-low rounded-full px-space-lg py-2.5 font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all border border-surface-container"
                    />
                    <span className="material-symbols-outlined absolute right-space-md top-1/2 -translate-y-1/2 text-outline text-[18px]">
                      coffee
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant pl-space-md">
                    Order progression and brewing timestamps sent live to WhatsApp.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Order Fulfillment Mode */}
            <div className="bg-surface-container-lowest rounded-lg p-space-lg sm:p-space-xl shadow-[0_8px_30px_rgba(14,165,233,0.06)] border border-surface-container">
              <div className="flex items-center justify-between mb-space-md">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Order Fulfillment
                </h3>
                <span className="font-label-sm text-label-sm text-primary font-semibold">
                  Flagship Experience
                </span>
              </div>

              {/* Segmented Toggle */}
              <div className="grid grid-cols-2 p-1.5 bg-surface-container-low rounded-full gap-1 mb-space-md border border-surface-container">
                <button
                  type="button"
                  onClick={() => setFulfillmentMode('DINE IN')}
                  className={`py-2.5 rounded-full font-label-lg text-label-lg font-bold flex items-center justify-center gap-space-xs transition-all cursor-pointer ${
                    fulfillmentMode === 'DINE IN'
                      ? 'bg-surface-container-lowest text-primary shadow-[0_2px_12px_rgba(14,165,233,0.14)]'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    table_restaurant
                  </span>
                  <span>DINE IN (Table Service)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentMode('TAKE AWAY')}
                  className={`py-2.5 rounded-full font-label-lg text-label-lg font-bold flex items-center justify-center gap-space-xs transition-all cursor-pointer ${
                    fulfillmentMode === 'TAKE AWAY'
                      ? 'bg-surface-container-lowest text-primary shadow-[0_2px_12px_rgba(14,165,233,0.14)]'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    local_cafe
                  </span>
                  <span>TAKE AWAY (Grab & Go)</span>
                </button>
              </div>

              {/* Table Details Container */}
              {fulfillmentMode === 'DINE IN' ? (
                <div className="bg-surface-container-low/60 rounded-lg p-space-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md border border-surface-container">
                  <div className="flex items-center gap-space-md">
                    <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined text-[24px]">chair</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-space-xs">
                        <input
                          type="text"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          className="font-label-lg text-label-lg text-on-surface font-bold bg-transparent border-b border-primary/30 focus:outline-none focus:border-primary"
                        />
                        <span className="bg-primary-container text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Outdoor
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Our team brings crafted pour-overs and bites right to your seat.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newTable = prompt('Masukkan Nomor Meja Anda:', tableNumber);
                      if (newTable) setTableNumber(newTable);
                    }}
                    className="px-space-md py-1.5 rounded-full bg-surface-container-lowest text-primary font-label-sm text-label-sm font-semibold shadow-xs hover:bg-primary-fixed transition-colors whitespace-nowrap cursor-pointer border border-surface-container"
                    type="button"
                  >
                    Change Table
                  </button>
                </div>
              ) : (
                <div className="bg-surface-container-low/60 rounded-lg p-space-md flex items-center gap-space-md border border-surface-container">
                  <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px]">
                      shopping_bag
                    </span>
                  </div>
                  <div>
                    <h4 className="font-label-lg font-bold text-on-surface">
                      Take Away Order (Pickup Bar)
                    </h4>
                    <p className="font-body-sm text-on-surface-variant">
                      Siap diambil di counter bar dalam 10-15 menit. Barista akan memanggil nama Anda ({customerName}).
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Payment Method Tabs & Active Selection */}
            <div className="bg-surface-container-lowest rounded-lg p-space-lg sm:p-space-xl shadow-[0_8px_30px_rgba(14,165,233,0.06)] space-y-space-md border border-surface-container">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <span className="w-8 h-8 rounded-full bg-surface-container-low text-primary flex items-center justify-center font-label-md text-label-md font-bold">
                    2
                  </span>
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    Payment Method
                  </h2>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Instant Zero-Fee
                </span>
              </div>

              {/* Payment Method Banner: QRIS Only */}
              <div className="rounded-lg p-space-md sm:p-space-lg bg-surface-container-low/80 shadow-[0_4px_20px_-4px_rgba(14,165,233,0.15)] border border-primary-container">
                <div className="flex items-start justify-between gap-space-sm">
                  <div className="flex items-center gap-space-md">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-xs bg-primary-container text-on-primary">
                      <span className="material-symbols-outlined text-[18px]">
                        check_circle
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-space-xs flex-wrap">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                          QRIS (Quick Response Code Indonesian Standard)
                        </span>
                        <span className="px-space-xs py-0.5 rounded bg-primary-fixed text-primary font-label-sm text-[10px] font-bold">
                          ONLINE ORDER EXCLUSIVE
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        Scan QRIS dengan aplikasi m-Banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, OVO, ShopeePay, Dana, LinkAja).
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-primary bg-surface-container-lowest px-2.5 py-1 rounded-full border border-surface-container whitespace-nowrap">
                    Wajib Bukti Transfer
                  </span>
                </div>
              </div>

              {/* Interactive QRIS Presentation Canvas */}
              <div className="bg-gradient-to-b from-surface-container-lowest to-surface-container-low rounded-lg p-space-lg sm:p-space-xl shadow-[0_16px_40px_-6px_rgba(14,165,233,0.12)] border border-surface-container">
                  {/* QRIS Brand Bar */}
                  <div className="flex items-center justify-between pb-space-md border-b border-surface-container/60">
                    <div className="flex items-center gap-space-sm">
                      <div className="px-2.5 py-1 bg-surface-container-lowest rounded-md shadow-xs flex items-center gap-1.5 border border-surface-container">
                        <span className="font-headline-sm text-headline-sm font-bold tracking-tighter text-on-surface">
                          QRIS
                        </span>
                        <span className="text-[9px] font-bold tracking-widest text-primary-container bg-surface-container-low px-1 rounded">
                          NATIONAL
                        </span>
                      </div>
                      <div>
                        <p className="font-label-sm text-label-sm text-on-surface font-bold uppercase">
                          {activeOutlet?.name || 'Leton Coffee'}
                        </p>
                        <p className="font-body-sm text-[11px] text-on-surface-variant leading-none">
                          NMID: ID1020049281902 • A01
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">
                        Total to Pay
                      </span>
                      <span className="font-headline-lg text-headline-lg font-bold text-primary">
                        Rp {effectiveTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic QR Code Display Frame */}
                  <div className="flex flex-col sm:flex-row items-center gap-space-xl pt-space-md">
                    {/* QR Code Graphic Card */}
                    <div className="relative bg-surface-container-lowest p-space-md rounded-lg shadow-[0_8px_32px_rgba(14,165,233,0.12)] flex flex-col items-center justify-center border border-surface-container">
                      <div className="w-48 h-48 bg-surface-container-lowest flex items-center justify-center relative p-1">
                        <svg
                          className="w-full h-full text-on-surface fill-current"
                          viewBox="0 0 160 160"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect fill="#011D35" height="40" rx="6" width="40" x="10" y="10" />
                          <rect fill="#FFFFFF" height="24" rx="2" width="24" x="18" y="18" />
                          <rect fill="#0EA5E9" height="12" rx="2" width="12" x="24" y="24" />
                          <rect fill="#011D35" height="40" rx="6" width="40" x="110" y="10" />
                          <rect fill="#FFFFFF" height="24" rx="2" width="24" x="118" y="18" />
                          <rect fill="#0EA5E9" height="12" rx="2" width="12" x="124" y="24" />
                          <rect fill="#011D35" height="40" rx="6" width="40" x="10" y="110" />
                          <rect fill="#FFFFFF" height="24" rx="2" width="24" x="18" y="118" />
                          <rect fill="#0EA5E9" height="12" rx="2" width="12" x="24" y="124" />
                          <rect fill="#011D35" height="24" rx="4" width="24" x="118" y="118" />
                          <rect fill="#FFFFFF" height="12" rx="2" width="12" x="124" y="124" />
                          <rect fill="#0EA5E9" height="4" width="4" x="128" y="128" />
                          <rect fill="#011D35" height="6" width="6" x="56" y="14" />
                          <rect fill="#011D35" height="6" width="6" x="66" y="14" />
                          <rect fill="#011D35" height="6" width="6" x="76" y="14" />
                          <rect fill="#011D35" height="6" width="6" x="86" y="14" />
                          <rect fill="#011D35" height="6" width="6" x="96" y="14" />
                          <rect fill="#011D35" height="6" width="6" x="56" y="24" />
                          <rect fill="#011D35" height="6" width="6" x="76" y="24" />
                          <rect fill="#011D35" height="6" width="6" x="96" y="24" />
                          <rect fill="#011D35" height="6" width="6" x="56" y="34" />
                          <rect fill="#011D35" height="6" width="6" x="66" y="34" />
                          <rect fill="#011D35" height="6" width="6" x="86" y="34" />
                          <rect fill="#011D35" height="6" width="6" x="14" y="56" />
                          <rect fill="#011D35" height="6" width="6" x="24" y="56" />
                          <rect fill="#011D35" height="6" width="6" x="34" y="56" />
                          <rect fill="#011D35" height="6" width="6" x="44" y="56" />
                          <rect fill="#011D35" height="6" width="6" x="64" y="56" />
                          <rect fill="#011D35" height="6" width="6" x="84" y="56" />
                          <rect fill="#011D35" height="6" width="6" x="104" y="56" />
                          <rect fill="#011D35" height="6" width="6" x="124" y="56" />
                          <rect fill="#011D35" height="6" width="6" x="144" y="56" />
                          <rect fill="#011D35" height="6" width="6" x="14" y="66" />
                          <rect fill="#011D35" height="6" width="6" x="34" y="66" />
                          <rect fill="#011D35" height="6" width="6" x="54" y="66" />
                          <rect fill="#011D35" height="6" width="6" x="114" y="66" />
                          <rect fill="#011D35" height="6" width="6" x="134" y="66" />
                        </svg>
                        <div className="absolute inset-0 m-auto w-10 h-10 bg-surface-container-lowest rounded-full p-1 shadow-md flex items-center justify-center">
                          <div className="w-full h-full rounded-full bg-primary-container flex items-center justify-center text-on-primary">
                            <span className="material-symbols-outlined text-[18px]">
                              local_cafe
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-space-sm bg-surface-container-low px-space-md py-1 rounded-full flex items-center gap-1.5 text-primary font-label-sm text-label-sm border border-surface-container">
                        <span className="w-2 h-2 rounded-full bg-primary-container animate-ping"></span>
                        <span>Pay within {formatCountdown(timeLeft)} min</span>
                      </div>
                    </div>

                    {/* Scanning Steps & Quick Helper Buttons */}
                    <div className="flex-1 space-y-space-md">
                      <div className="space-y-space-sm">
                        <div className="flex items-start gap-space-sm">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-on-primary font-label-sm text-[10px] mt-0.5">
                            1
                          </span>
                          <p className="font-body-sm text-body-sm text-on-surface">
                            <span className="font-semibold text-on-surface">
                              Buka aplikasi m-Banking atau E-Wallet
                            </span>{' '}
                            (BCA, GoPay, OVO, Dana, ShopeePay, Mandiri, dll).
                          </p>
                        </div>
                        <div className="flex items-start gap-space-sm">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-on-primary font-label-sm text-[10px] mt-0.5">
                            2
                          </span>
                          <p className="font-body-sm text-body-sm text-on-surface">
                            Pilih menu{' '}
                            <span className="font-semibold text-primary">"Scan QRIS"</span> dan
                            arahkan kamera ke kode QR.
                          </p>
                        </div>
                        <div className="flex items-start gap-space-sm">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-on-primary font-label-sm text-[10px] mt-0.5">
                            3
                          </span>
                          <p className="font-body-sm text-body-sm text-on-surface">
                            Konfirmasi penerima{' '}
                            <span className="font-semibold text-on-surface">
                              {activeOutlet?.name || 'Leton Coffee'}
                            </span>{' '}
                            sebesar{' '}
                            <span className="font-semibold text-primary">
                              Rp {effectiveTotal.toLocaleString('id-ID')}
                            </span>
                            .
                          </p>
                        </div>
                      </div>

                      {/* Action Shortcuts */}
                      <div className="flex flex-wrap gap-space-sm pt-space-xs">
                        <button
                          type="button"
                          onClick={() => {
                            alert('Kode QRIS telah disiapkan untuk di-scan.');
                          }}
                          className="inline-flex items-center gap-space-xs px-space-md py-2 rounded-full bg-surface-container-lowest text-on-surface hover:text-primary font-label-sm text-label-sm font-semibold shadow-xs transition-all border border-surface-container cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            download
                          </span>
                          <span>Download QR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(cartTotal.toString());
                            alert(`Nominal Rp ${cartTotal.toLocaleString('id-ID')} disalin.`);
                          }}
                          className="inline-flex items-center gap-space-xs px-space-md py-2 rounded-full bg-surface-container-lowest text-on-surface hover:text-primary font-label-sm text-label-sm font-semibold shadow-xs transition-all border border-surface-container cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            content_copy
                          </span>
                          <span>Copy Rp {cartTotal.toLocaleString('id-ID')}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Upload Receipt Proof (Mandatory for QRIS as specified in Section 12) */}
                  <div className="mt-space-lg pt-space-md border-t border-surface-container/60">
                    <div className="flex items-center justify-between mb-space-sm">
                      <h4 className="font-label-lg text-label-lg text-on-surface font-semibold flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-primary-container text-[18px]">
                          verified
                        </span>
                        <span>Upload Bukti Pembayaran QRIS</span>
                        <span className="text-on-surface-variant text-[11px] font-normal">
                          (Wajib untuk verifikasi order)
                        </span>
                      </h4>
                      <span className="font-label-sm text-label-sm text-error font-bold">
                        Wajib
                      </span>
                    </div>

                    {/* Upload Drop Area */}
                    <label className="block bg-surface-container-lowest/80 rounded-lg p-space-md text-center hover:bg-surface-container-lowest transition-all cursor-pointer border-2 border-dashed border-primary-container/30 hover:border-primary-container">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleReceiptChange}
                        className="hidden"
                      />
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-space-md">
                        <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[22px]">
                            cloud_upload
                          </span>
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="font-label-md text-label-md text-on-surface font-semibold">
                            Klik untuk upload screenshot transfer m-Banking / E-wallet
                          </p>
                          <p className="font-body-sm text-[11px] text-on-surface-variant">
                            Mendukung JPG, PNG hingga 5MB (disimpan di Supabase Storage)
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Attached Preview Chip */}
                    {paymentProofFileName && (
                      <div className="mt-space-md inline-flex items-center gap-space-sm bg-surface-container-low px-space-md py-1.5 rounded-full text-left border border-surface-container">
                        <span className="material-symbols-outlined text-primary-container text-[18px]">
                          image
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface font-semibold truncate max-w-[200px]">
                          {paymentProofFileName}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">Ready</span>
                        <span className="bg-primary-container text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">
                            check
                          </span>{' '}
                          Terlampir
                        </span>
                      </div>
                    )}
                  </div>
                </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Order Summary & Direct Verification CTA (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-space-md sticky top-24">
            {/* Cart & Breakdown Card */}
            <div className="bg-surface-container-lowest rounded-lg p-space-lg sm:p-space-xl shadow-[0_12px_36px_-4px_rgba(14,165,233,0.08)] border border-surface-container">
              <div className="flex items-center justify-between pb-space-md border-b border-surface-container/60">
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    Order Summary
                  </h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {activeOutlet?.name || 'Leton Coffee'}
                  </span>
                </div>
                <span className="bg-primary-fixed text-primary px-3 py-1 rounded-full font-label-md text-label-md font-bold">
                  {effectiveCartItems.length} Items
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-space-md py-space-sm max-h-80 overflow-y-auto">
                {effectiveCartItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-space-md">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-xs bg-surface-container">
                      <img
                        className="w-full h-full object-cover"
                        alt={item.product?.name || 'Drink'}
                        src={item.product?.image_url || ''}
                      />
                      <span className="absolute bottom-1 right-1 bg-surface-container-lowest/90 backdrop-blur-xs text-[10px] font-bold text-on-surface px-1 rounded">
                        {item.quantity}x
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-label-lg text-label-lg text-on-surface font-bold truncate">
                          {item.product?.name || 'Drink'}
                        </h4>
                        <span className="font-label-lg text-label-lg text-on-surface font-semibold whitespace-nowrap">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.options?.temperature && (
                          <span className="text-[11px] bg-surface-container-low text-primary px-2 py-0.5 rounded-full">
                            {item.options.temperature}
                          </span>
                        )}
                        {item.options?.sweetness && (
                          <span className="text-[11px] bg-surface-container-low text-on-surface-variant px-2 py-0.5 rounded-full">
                            {item.options.sweetness}
                          </span>
                        )}
                        {(item.options?.toppings || []).map((t) => (
                          <span
                            key={t.id}
                            className="text-[11px] bg-surface-container-low text-on-surface-variant px-2 py-0.5 rounded-full"
                          >
                            +{t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Applied Perks */}
              <div className="mt-space-md pt-space-md border-t border-surface-container/60 space-y-space-xs">
                <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      redeem
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface font-medium">
                      Leton Holographic Sticker Pack
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-primary font-bold">
                    FREE
                  </span>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="mt-space-md pt-space-md border-t border-surface-container/60 space-y-space-xs font-body-sm text-body-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Items Subtotal</span>
                  <span className="text-on-surface font-medium">
                    Rp {cartSubtotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Restaurant Tax (PB1 10%)</span>
                  <span className="text-on-surface font-medium">
                    Rp {cartPb1Tax.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="mt-space-lg pt-space-md bg-surface-container-low/50 rounded-xl p-space-md flex items-center justify-between border border-surface-container">
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                    Total Payment Due
                  </span>
                  <span className="font-label-sm text-label-sm text-primary flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span> Zero
                    Admin Fees
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-headline-lg text-headline-lg font-bold text-primary">
                    Rp {cartTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Master Action Button */}
              <div className="mt-space-lg space-y-space-sm">
                {!paymentProofPreview && !paymentProofFile && (
                  <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold">
                    <span className="material-symbols-outlined text-[18px] text-amber-500">info</span>
                    <span>Wajib upload bukti transfer QRIS di atas untuk menyelesaikan pesanan.</span>
                  </div>
                )}
                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className={`w-full py-3.5 px-space-lg rounded-full font-label-lg text-label-lg font-bold tracking-wide uppercase transition-all active:scale-[0.98] flex items-center justify-center gap-space-sm cursor-pointer disabled:opacity-50 ${
                    !paymentProofPreview && !paymentProofFile
                      ? 'bg-primary-container/80 hover:bg-primary-container text-on-primary'
                      : 'bg-primary-container hover:bg-primary text-on-primary shadow-[0_12px_28px_-4px_rgba(14,165,233,0.4)]'
                  }`}
                  type="button"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Submitting Order to Kitchen...</span>
                    </>
                  ) : (
                    <>
                      <span>VERIFY & PLACE ORDER</span>
                      <span className="material-symbols-outlined text-[20px]">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-space-xs text-on-surface-variant font-label-sm text-[11px] pt-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">
                    encrypted
                  </span>
                  <span>256-Bit SSL Encrypted • Real-time Order Routing to Barista Station</span>
                </div>
              </div>
            </div>

            {/* Barista Live Support Assistance Pill */}
            <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-[0_4px_16px_rgba(14,165,233,0.06)] flex items-center justify-between border border-surface-container">
              <div className="flex items-center gap-space-sm">
                <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">
                    support_agent
                  </span>
                </div>
                <div>
                  <span className="font-label-md text-label-md text-on-surface font-semibold block leading-tight">
                    Need help with payment?
                  </span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant">
                    Barista team on shift at {(activeOutlet?.name || 'Leton Coffee').replace('Leton Coffee — ', '')}
                  </span>
                </div>
              </div>
              <a
                className="px-space-md py-1.5 rounded-full bg-surface-container-low text-primary font-label-sm text-label-sm font-bold hover:bg-primary-fixed transition-colors whitespace-nowrap"
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noreferrer"
              >
                Chat WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
