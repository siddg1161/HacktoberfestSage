import { useState, useEffect } from "react";
import { api, BusinessProfile, WorkerProfile } from "./api";

const BIZ_STORAGE_KEY = "quoteflow_active_business";
const WORKER_STORAGE_KEY = "quoteflow_active_worker";

// Default fallback business
export const DEFAULT_BUSINESS: BusinessProfile = {
  business_id: "biz-electrical",
  business_name: "Sharma Electricals & Automation",
  industry: "Electrical",
  tagline: "Intelligent Electrical, Wiring & Lighting Supplies",
  owner_name: "Ramesh Sharma",
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
      const list = [workspace.business];
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
      console.warn("Could not fetch the authenticated workspace:", e);
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

