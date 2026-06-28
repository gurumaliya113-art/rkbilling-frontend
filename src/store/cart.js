import { create } from 'zustand';

/** POS cart state. Each item carries product info + chosen selling price/qty. */
export const useCartStore = create((set, get) => ({
  items: [],
  customer: null,
  customerName: '',
  customerPhone: '',
  paymentMode: 'cash',
  paymentSplit: { cash: 0, upi: 0, card: 0 },
  discount: 0,
  taxPct: 0,

  addItem: (product, sellingPrice) => {
    const items = get().items;
    const existing = items.find((i) => i.product_id === product.id);
    if (existing) {
      set({
        items: items.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      });
      return;
    }
    set({
      items: [
        ...items,
        {
          product_id: product.id,
          product_code: product.product_code,
          product_name: product.name || product.product_code || 'Item',
          product_image: product.images?.[0]?.url || null,
          category: product.category?.name || null,
          brand: product.brand?.name || null,
          color: product.color,
          size: product.size,
          purchase_price: Number(product.purchase_price),
          selling_price: Number(sellingPrice ?? product.selling_price),
          max_stock: product.stock,
          quantity: 1,
        },
      ],
    });
  },

  updateItem: (productId, patch) =>
    set({ items: get().items.map((i) => (i.product_id === productId ? { ...i, ...patch } : i)) }),

  removeItem: (productId) => set({ items: get().items.filter((i) => i.product_id !== productId) }),

  setCustomer: (customer) => set({ customer }),
  setCustomerName: (customerName) => set({ customerName }),
  setCustomerPhone: (customerPhone) => set({ customerPhone }),
  setPaymentMode: (paymentMode) => set({ paymentMode }),
  setPaymentSplit: (paymentSplit) => set({ paymentSplit }),
  setDiscount: (discount) => set({ discount: Number(discount) || 0 }),
  setTaxPct: (taxPct) => set({ taxPct: Number(taxPct) || 0 }),

  subtotal: () => get().items.reduce((s, i) => s + i.selling_price * i.quantity, 0),
  totalProfit: () =>
    get().items.reduce((s, i) => s + (i.selling_price - i.purchase_price) * i.quantity, 0),
  total: () => {
    const sub = get().subtotal();
    const afterDisc = sub - get().discount;
    return afterDisc + (afterDisc * get().taxPct) / 100;
  },

  clear: () =>
    set({
      items: [],
      customer: null,
      customerName: '',
      customerPhone: '',
      paymentMode: 'cash',
      paymentSplit: { cash: 0, upi: 0, card: 0 },
      discount: 0,
      taxPct: 0,
    }),
}));
