import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  DollarSign,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  X,
} from 'lucide-react';
import { PayoutAccount, Payout } from '../../types/database';
import {
  getPayoutAccounts,
  addPayoutAccount,
  getPayouts,
  requestPayout,
  PayoutAccountInput,
} from '../../services/organizerService';

interface OrganizerFinanceProps {
  orgId: string;
  totalRevenue: number;
}

export const OrganizerFinance: React.FC<OrganizerFinanceProps> = ({ orgId, totalRevenue }) => {
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isRequestPayoutOpen, setIsRequestPayoutOpen] = useState(false);

  // Form states
  const [accountForm, setAccountForm] = useState<PayoutAccountInput>({
    account_type: 'INDIVIDUAL',
    account_holder_name: '',
    bank_name: 'Guaranty Trust Bank (GTBank)',
    bank_code: '058',
    account_number: '',
    business_registration_number: '',
  });

  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [accs, pos] = await Promise.all([getPayoutAccounts(orgId), getPayouts(orgId)]);
    setAccounts(accs);
    setPayouts(pos);
    if (accs.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accs[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (orgId) {
      loadData();
    }
  }, [orgId]);

  const paidPayoutsSum = payouts
    .filter((p) => p.status === 'PAID')
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const pendingPayoutsSum = payouts
    .filter((p) => p.status === 'PENDING' || p.status === 'PROCESSING')
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const availableBalance = Math.max(0, totalRevenue - paidPayoutsSum - pendingPayoutsSum);

  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.account_number || !accountForm.account_holder_name) {
      setActionError('Account number and holder name are required.');
      return;
    }

    const res = await addPayoutAccount(orgId, accountForm);
    if (res.success) {
      setIsAddAccountOpen(false);
      setActionError(null);
      loadData();
    } else {
      setActionError(res.error || 'Failed to add bank account.');
    }
  };

  const handleRequestPayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) {
      setActionError('Please select a payout bank account.');
      return;
    }
    if (payoutAmount <= 0 || payoutAmount > availableBalance) {
      setActionError(`Payout amount must be between ₦1 and available balance ${formatMoney(availableBalance)}.`);
      return;
    }

    const res = await requestPayout(orgId, selectedAccountId, payoutAmount);
    if (res.success) {
      setIsRequestPayoutOpen(false);
      setActionError(null);
      loadData();
    } else {
      setActionError(res.error || 'Failed to submit payout request.');
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white">Finance &amp; Payouts</h2>
          <p className="text-xs text-slate-400">
            Manage organizer settlement accounts and withdraw ticket sales revenue
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAddAccountOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs px-4 py-3 rounded-xl transition-colors cursor-pointer"
          >
            Add Bank Account
          </button>

          <button
            onClick={() => {
              setPayoutAmount(availableBalance);
              setIsRequestPayoutOpen(true);
            }}
            disabled={availableBalance <= 0 || accounts.length === 0}
            className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Request Payout</span>
          </button>
        </div>
      </div>

      {/* Balance Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Total Ticket Sales</span>
          <span className="text-2xl sm:text-3xl font-black text-white block">
            {formatMoney(totalRevenue)}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Gross sales generated</span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Available Balance</span>
          <span className="text-2xl sm:text-3xl font-black text-[#00b894] block">
            {formatMoney(availableBalance)}
          </span>
          <span className="text-[11px] text-[#00b894] font-bold">Ready for instant payout request</span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Paid / Pending Payouts</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-300 block">
            {formatMoney(paidPayoutsSum + pendingPayoutsSum)}
          </span>
          <span className="text-[11px] text-amber-400 font-bold">
            {pendingPayoutsSum > 0 ? `${formatMoney(pendingPayoutsSum)} processing` : 'All settled'}
          </span>
        </div>
      </div>

      {/* Payout Accounts Section */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-[#00b894]" />
            <span>Settlement Bank Accounts ({accounts.length})</span>
          </h3>
          <button
            onClick={() => setIsAddAccountOpen(true)}
            className="text-xs font-bold text-[#00b894] hover:underline flex items-center cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Account
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No bank accounts connected yet. Add your bank account to receive payouts.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between space-x-3"
              >
                <div>
                  <span className="block font-bold text-white text-xs">{acc.bank_name}</span>
                  <span className="block font-mono text-slate-300 text-xs mt-0.5">{acc.account_number}</span>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mt-1">
                    {acc.account_holder_name} ({acc.account_type})
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Verified
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payouts History Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-4">Payout Transactions History</h3>

        {payouts.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs">
            No payouts requested yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3 pr-4">Reference</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Date Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 pr-4 font-mono font-bold text-[#00b894]">{p.reference}</td>
                    <td className="py-3 pr-4 font-extrabold text-white">{formatMoney(Number(p.amount))}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{new Date(p.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Bank Account Modal */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setIsAddAccountOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white">Add Settlement Bank Account</h3>

            {actionError && (
              <div className="bg-rose-500/10 text-rose-300 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleAddAccountSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Bank Name</label>
                <input
                  type="text"
                  required
                  value={accountForm.bank_name}
                  onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Account Number</label>
                <input
                  type="text"
                  required
                  placeholder="0123456789"
                  value={accountForm.account_number}
                  onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Account Holder Name</label>
                <input
                  type="text"
                  required
                  placeholder="Official Account Name"
                  value={accountForm.account_holder_name}
                  onChange={(e) => setAccountForm({ ...accountForm, account_holder_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold py-3 rounded-xl shadow-lg mt-2 cursor-pointer"
              >
                Save Bank Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Request Payout Modal */}
      {isRequestPayoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setIsRequestPayoutOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white">Request Payout Withdrawal</h3>

            {actionError && (
              <div className="bg-rose-500/10 text-rose-300 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleRequestPayoutSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Destination Bank Account</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.bank_name} - {a.account_number} ({a.account_holder_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Amount to Withdraw (NGN)</label>
                <input
                  type="number"
                  max={availableBalance}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-extrabold text-sm outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Available for withdrawal: {formatMoney(availableBalance)}
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold py-3 rounded-xl shadow-lg mt-2 cursor-pointer"
              >
                Submit Payout Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
