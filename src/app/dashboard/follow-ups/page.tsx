'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { FollowUp, FollowUpStatus, Customer } from '@/lib/types/database';

interface EnrichedFollowUp extends FollowUp {
  customer?: Customer;
}

export default function DashboardFollowUpsPage() {
  const [followUps, setFollowUps] = useState<EnrichedFollowUp[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState<FollowUpStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [reason, setReason] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadFollowUps() {
      try {
        const [followRes, convRes] = await Promise.all([
          fetch('/api/follow-ups').then((r) => r.json()),
          fetch('/api/conversations').then((r) => r.json()),
        ]);

        if (isMounted && followRes.success && followRes.followUps) {
          setFollowUps(followRes.followUps);
        }
        if (isMounted && convRes.success && convRes.conversations) {
          const custs: Customer[] = convRes.conversations
            .map((c: { customer?: Customer }) => c.customer)
            .filter(Boolean);
          setCustomers(custs);
          if (custs.length > 0) setSelectedCustomerId((prev) => prev || custs[0].id);
        }
      } catch (err) {
        console.error('Failed to load follow-ups:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadFollowUps();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleStatusChange(id: string, newStatus: FollowUpStatus) {
    try {
      const res = await fetch(`/api/follow-ups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }).then((r) => r.json());

      if (res.success && res.followUp) {
        setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f)));
      }
    } catch (err) {
      console.error('Failed to update follow-up status:', err);
    }
  }

  async function handleCreateFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim() || !scheduledDate || submitting) return;

    setSubmitting(true);
    try {
      const scheduledAt = `${scheduledDate} ${scheduledTime}`;
      const res = await fetch('/api/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          reason,
          scheduled_at: scheduledAt,
        }),
      }).then((r) => r.json());

      if (res.success && res.followUp) {
        setFollowUps((prev) => [...prev, res.followUp]);
        setModalOpen(false);
        setReason('');
        setScheduledDate('');
      }
    } catch (err) {
      console.error('Failed to create follow-up task:', err);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredTasks = followUps.filter((f) => (filter === 'ALL' ? true : f.status === filter));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-emerald-700 font-medium text-sm">
          <Sparkles className="h-5 w-5 animate-spin" /> Loading Follow-up Task Scheduler...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" /> Follow-Up Task Scheduler
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Schedule customer check-ins, payment transfers verifications, and size follow-up reminders.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
        {(['ALL', 'PENDING', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
              filter === tab ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-gray-200/80 text-center text-xs text-gray-500">
            No follow-up tasks scheduled.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900">{task.customer?.name || 'Customer'}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    task.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : task.status === 'CANCELLED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {task.status}
                  </span>
                </div>
                <p className="text-xs text-gray-700">{task.reason}</p>
                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-400" /> Scheduled: {task.scheduled_at}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {task.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                      className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-1.5 px-3 rounded-lg border border-emerald-200 transition"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Complete</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(task.id, 'CANCELLED')}
                      className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 py-1.5 px-3 rounded-lg border border-red-200 transition"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Cancel</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-gray-200">
            <h3 className="text-base font-bold text-gray-900">Schedule Follow-up Task</h3>

            <form onSubmit={handleCreateFollowUp} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 py-2.5 px-3 text-xs outline-none focus:border-emerald-600"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || 'Customer'} ({c.channel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Task Reason</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Check bank transfer receipt or confirm size availability"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 py-2 px-3 text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 py-2 px-3 text-xs outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Scheduled Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 py-2 px-3 text-xs outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2 px-4 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reason.trim() || !scheduledDate}
                  className="py-2 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
