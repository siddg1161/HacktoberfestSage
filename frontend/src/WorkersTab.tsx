import React, { useEffect, useState } from "react";
import { api, WorkerProfile } from "./api";
import { useActiveBusiness } from "./businessContext";

export default function WorkersTab() {
  const { business: activeBiz } = useActiveBusiness();
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Field Technician");
  const [pinCode, setPinCode] = useState("1234");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadWorkers = async () => {
    try {
      setLoading(true);
      const list = await api.getWorkers(activeBiz.business_id);
      setWorkers(list);
    } catch (err: any) {
      console.error("Failed to load workers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, [activeBiz.business_id]);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg("Please enter worker name and email address.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      await api.addWorker(activeBiz.business_id, {
        name: name.trim(),
        email: email.trim(),
        role: role.trim() || "Field Technician",
        pin_code: pinCode.trim() || "1234",
      });

      setSuccessMsg(`Technician ${name} added! They can log in with PIN: ${pinCode.trim() || "1234"}`);
      setName("");
      setEmail("");
      setPinCode("1234");
      setShowAddModal(false);
      await loadWorkers();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add worker.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">
              👥 Field Technicians & Staff
            </h2>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {activeBiz.business_name}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Workers receive access through their own email and Better Auth password. No team member passwords are stored or displayed here.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#17221d] hover:bg-[#27362f] text-white text-xs font-bold shadow transition"
        >
          <span>+</span> Add Technician / Worker
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
          ✓ {successMsg}
        </div>
      )}

      {/* Workers Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 text-sm">
          Loading team members...
        </div>
      ) : workers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-sm font-bold text-gray-600">No technicians registered yet for this business.</p>
          <p className="text-xs text-gray-400 mt-1">Click the button above to add your first team member.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((w) => {
            const initials = w.name
              .split(" ")
              .map((p) => p[0])
              .filter(Boolean)
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={w.id}
                className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#d6ff78] text-[#17221d] font-black text-sm flex items-center justify-center">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{w.name}</h3>
                        <p className="text-xs text-gray-500 font-medium">{w.role}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {w.status}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email / Login:</span>
                      <span className="font-semibold text-gray-800 truncate max-w-[180px]">{w.email || w.phone || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Login PIN:</span>
                      <span className="font-mono font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                        {w.pin_code || "1234"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">Trade: {activeBiz.industry}</span>
                  <span className="text-[11px] font-bold text-[#6a841d]">Account access by email</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">
                Add New Technician / Estimator
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWorker} className="mt-4 space-y-3.5">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sameer Khan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Technician Email Address (for Login) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sameer@sharmaelectricals.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Role Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Technician"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  4-Digit Access PIN *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 1234"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">Technician will enter their email and this PIN to log in.</p>
              </div>

              <div className="pt-3 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 text-xs font-bold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#17221d] hover:bg-[#27362f] rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Save Worker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
