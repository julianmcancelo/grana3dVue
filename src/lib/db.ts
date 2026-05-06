import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { Product, Coupon, Order } from './types';

const PRODUCTS_COL = 'products';
const COUPONS_COL = 'coupons';
const ORDERS_COL = 'orders';

export const firestoreDb = {
  products: {
    getAll: async () => {
      const snap = await getDocs(collection(db, PRODUCTS_COL));
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
    },
    create: async (data: Omit<Product, 'id' | 'createdAt'>) => {
      const ref = await addDoc(collection(db, PRODUCTS_COL), {
        ...data,
        createdAt: new Date().toISOString(),
      });
      return ref.id;
    },
    update: async (id: string, data: Partial<Product>) => {
      await updateDoc(doc(db, PRODUCTS_COL, id), data);
    },
    delete: async (id: string) => {
      await deleteDoc(doc(db, PRODUCTS_COL, id));
    },
  },
  coupons: {
    getAll: async () => {
      const snap = await getDocs(collection(db, COUPONS_COL));
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Coupon[];
    },
    create: async (data: Omit<Coupon, 'id' | 'createdAt'>) => {
      const ref = await addDoc(collection(db, COUPONS_COL), {
        ...data,
        createdAt: new Date().toISOString(),
      });
      return ref.id;
    },
    update: async (id: string, data: Partial<Coupon>) => {
      await updateDoc(doc(db, COUPONS_COL, id), data);
    },
    delete: async (id: string) => {
      await deleteDoc(doc(db, COUPONS_COL, id));
    },
    getByCode: async (code: string) => {
      const q = query(collection(db, COUPONS_COL), where('code', '==', code));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as Coupon;
    },
  },
  orders: {
    getAll: async () => {
      const snap = await getDocs(collection(db, ORDERS_COL));
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
    },
    create: async (data: Omit<Order, 'id' | 'createdAt'>) => {
      const ref = await addDoc(collection(db, ORDERS_COL), {
        ...data,
        createdAt: new Date().toISOString(),
      });
      return ref.id;
    },
    update: async (id: string, data: Partial<Order>) => {
      await updateDoc(doc(db, ORDERS_COL, id), data);
    },
    getById: async (id: string) => {
      const snap = await getDocs(query(collection(db, ORDERS_COL), where('__name__', '==', id)));
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as Order;
    },
  },
};
