import { useState, useEffect } from "react";
import { api, BusinessProfile, WorkerProfile } from "./api";
import { authClient } from "./auth-client";

const BIZ_STORAGE_KEY = "quoteflow_active_business";
const WORKER_STORAGE_KEY = "quoteflow_active_worker";

// Default fallback business while loading from database
export const DEFAULT_BUSINESS: BusinessProfile = {
  business_id: "",
  business_name: "My Business",
  industry: "General",
  currency_symbol: "₹",
};

/**
 * Returns the currently cached active business from localStorage or default.
 */
export function getActiveBusiness(): BusinessProfile {
  try {
    const raw = localStorage.getItem(BIZ_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading active business from storage:", e);
  }
  return DEFAULT_BUSINESS;
}

/**
 * Sets the active business in localStorage and dispatches a storage event.
 */
export function setActiveBusiness(biz: BusinessProfile): void {
  try {
    localStorage.setItem(BIZ_STORAGE_KEY, JSON.stringify(biz));
    window.dispatchEvent(new CustomEvent("business-changed", { detail: biz }));
  } catch (e) {
    console.error("Error saving active business:", e);
  }
}

/**
 * Returns the currently logged in technician/worker if any.
 */
export function getActiveWorker(): WorkerProfile | null {
  try {
    const raw = localStorage.getItem(WORKER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading active worker:", e);
  }
  return null;
}

/**
 * Sets the active logged-in worker.
 */
export function setActiveWorker(worker: WorkerProfile | null): void {
  try {
    if (worker) {
      localStorage.setItem(WORKER_STORAGE_KEY, JSON.stringify(worker));
    } else {
      localStorage.removeItem(WORKER_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent("worker-changed", { detail: worker }));
  } catch (e) {
    console.error("Error saving active worker:", e);
  }
}

/**
 * React hook to reactively subscribe to the currently logged in technician across components.
 */
export function useActiveWorker() {
  const [worker, setWorker] = useState<WorkerProfile | null>(() => getActiveWorker());

  useEffect(() => {
    const handleWorkerChange = (e: any) => {
      setWorker(e.detail !== undefined ? e.detail : getActiveWorker());
    };
    window.addEventListener("worker-changed", handleWorkerChange);
    return () => window.removeEventListener("worker-changed", handleWorkerChange);
  }, []);

  const logoutWorker = () => {
    setActiveWorker(null);
    setWorker(null);
  };

  return { worker, logoutWorker };
}

/**
 * Clears both active worker and business from localStorage and terminates Better-Auth session cookie.
 */
export async function clearAllSessions(): Promise<void> {
  try {
    localStorage.removeItem(BIZ_STORAGE_KEY);
    localStorage.removeItem(WORKER_STORAGE_KEY);
    sessionStorage.clear();
    try {
      await authClient.signOut();
    } catch (authErr) {
      console.warn("Better-auth sign-out warning:", authErr);
    }
    window.dispatchEvent(new CustomEvent("business-changed", { detail: DEFAULT_BUSINESS }));
    window.dispatchEvent(new CustomEvent("worker-changed", { detail: null }));
  } catch (e) {
    console.error("Error clearing sessions:", e);
  }
}

/**
 * React hook to subscribe to the active business across any component.
 */
export function useActiveBusiness() {
  const [business, setBusiness] = useState<BusinessProfile>(() => getActiveBusiness());
  const [allBusinesses, setAllBusinesses] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshBusinesses = async () => {
    try {
      setLoading(true);
      const workspace = await api.getMyWorkspace();
      // A session owns exactly one active workspace. This is deliberately not
      // a public business directory: access decisions remain on the server.
      const list = workspace?.business ? [workspace.business] : [];
      setAllBusinesses(list);

      // Verify that current business exists in list, update with fresh DB stats
      const current = getActiveBusiness();
      const matched = list.find((b) => b.business_id === current.business_id);
      if (matched) {
        setBusiness(matched);
        localStorage.setItem(BIZ_STORAGE_KEY, JSON.stringify(matched));
      } else if (list.length > 0) {
        setBusiness(list[0]);
        localStorage.setItem(BIZ_STORAGE_KEY, JSON.stringify(list[0]));
      }
    } catch (e) {
      // User is unauthenticated on the server, reset business state
      setBusiness(DEFAULT_BUSINESS);
      localStorage.removeItem(BIZ_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshBusinesses();

    const handleBizChange = (e: any) => {
      if (e.detail) setBusiness(e.detail);
    };

    window.addEventListener("business-changed", handleBizChange);
    return () => window.removeEventListener("business-changed", handleBizChange);
  }, []);

  const changeBusiness = (biz: BusinessProfile) => {
    setActiveBusiness(biz);
    setBusiness(biz);
  };

  return {
    business,
    allBusinesses,
    loading,
    changeBusiness,
    refreshBusinesses,
  };
}

export function useBusiness() {
  const { business, allBusinesses, loading, changeBusiness, refreshBusinesses } = useActiveBusiness();
  return {
    activeBusiness: business,
    business,
    allBusinesses,
    loading,
    changeBusiness,
    refreshBusinesses,
  };
}

