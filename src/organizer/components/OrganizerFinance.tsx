import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building2,
  DollarSign,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Send,
} from 'lucide-react';
import { PayoutAccount, Payout } from '../../types/database';
import {
  getPayoutAccounts,
  addPayoutAccount,
  getPayouts,
  requestPayout,
  PayoutAccountInput,
} from '../services/organizerService';

interface OrganizerFinanceProps {
  orgId: string;
  totalRevenue: number;
}

export const OrganizerFinance: React.FC<OrganizerFinanceProps> = ({ orgId, totalRevenue }) => {
  const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isRequestPayoutOpen, setIsRequestPayoutOpen] = useState(false);

  const [accountForm, setAccountForm] = useState<PayoutAccountInput>({
    account_type: 'INDIVIDUAL',
    account_holder_name: '',
    bank_name: 'Access Bank',
    bank_code: '044',
    account_number: '',
    business_registration_number: '',
  });

  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!orgId) return;
    const accs = await getPayoutAccounts(orgId);
    setPayoutAccounts(accs);
    if (accs.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accs[0].id);
    }

    const pos = await getPayouts(orgId);
    setPayouts(pos);
  };

  useEffect(() => {
    loadData();
  }, [orgId]);

  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await addPayoutAccount(orgId, accountForm);
    if (res.success) {
      setSuccessMsg('Bank payout account added and verified!');
      setIsAddAccountOpen(false);
      setAccountForm({
        account_type: 'INDIVIDUAL',
        account_holder_name: '',
        bank_name: 'Access Bank',
        bank_code: '044',
        account_number: '',
        business_registration_number: '',
      });
      loadData();
    } else {
      setErrorMsg(res.error || 'Failed to add payout account.');
    }
  };

  const handleRequestPayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (payoutAmount <= 0) {
      setErrorMsg('Payout amount must be greater than zero.');
      return;
    }
    if (!selectedAccountId) {
      setErrorMsg('Please select a verified bank account.');
      return;
    }

    const res = await requestPayout(orgId, selectedAccountId, payoutAmount);
    if (res.success) {
      setSuccessMsg(`Payout request of ₦${payoutAmount.toLocaleString()} submitted successfully!`);
      setIsRequestPayoutOpen(false);
      loadData();
    } else {
      setErrorMsg(res.error || 'Failed to request payout.');
    }
  };

  const pendingPayoutsSum = payouts
    .filter((p) => p.status === 'PENDING')
    .reduce((a, b) => a + Number(b.amount || 0), 0);

  const completedPayoutsSum = payouts
    .filter((p) => p.status === 'PAID')
    .reduce((a, b) => a + Number(b.amount || 0), 0);

  const availableBalance = Math.max(0, totalRevenue - completedPayoutsSum - pendingPayoutsSum);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Finance &amp; Settlements</h2>
          <p className="text-xs text-slate-500 font-medium">
            Bank account linking, ticket revenue withdrawals, and settlement tracking
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAddAccountOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#00b894]" />
            <span>Add Bank Account</span>
          </button>

          <button
            onClick={() => {
              setPayoutAmount(availableBalance);
              setIsRequestPayoutOpen(true);
            }}
            disabled={availableBalance <= 0 || payoutAccounts.length === 0}
            className="bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#00b894]/20 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Request Payout</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#00b894]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-2">
          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
            Total Event Ticket Revenue
          </span>
          <span className="text-2xl font-black text-slate-900 block">
            ₦{totalRevenue.toLocaleString()}
          </span>
          <span className="text-[11px] text-emerald-600 font-bold block">Gross Sales via Paystack</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-2">
          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
            Available for Withdrawal
          </span>
          <span className="text-2xl font-black text-[#00b894] block">
            ₦{availableBalance.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 font-bold block">Net available after payouts</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-2">
          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
            Pending / Processed Payouts
          </span>
          <span className="text-2xl font-black text-amber-600 block">
            ₦{(pendingPayoutsSum + completedPayoutsSum).toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 font-bold block">
            {payouts.length} payout request(s)
          </span>
        </div>
      </div>

      {/* Bank Accounts Section */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-4">
          Linked Settlement Accounts ({payoutAccounts.length})
        </h3>

        {payoutAccounts.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 font-medium">
            No bank accounts linked yet. Click "Add Bank Account" to configure payout destination.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {payoutAccounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-slate-900 block">{acc.account_holder_name}</span>
                  <span className="text-xs font-mono font-bold text-[#00b894] block">
                    {acc.bank_name} — {acc.account_number}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{acc.account_type}</span>
                </div>
                <ShieldCheck className="w-5 h-5 text-[#00b894]" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout History Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-4">
          Payout History ({payouts.length})
        </h3>

        {payouts.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 font-medium">No payout requests submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Requested At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((po) => (
                  <tr key={po.id}>
                    <td className="py-3 font-mono font-bold text-slate-900">{po.reference}</td>
                    <td className="py-3 font-black text-[#00b894]">₦{Number(po.amount).toLocaleString()}</td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          po.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{new Date(po.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Bank Account Modal */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setIsAddAccountOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900">Add Bank Account</h3>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddAccountSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Account Holder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe / Tech Corp Ltd"
                  value={accountForm.account_holder_name}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, account_holder_name: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-xs outline-hidden focus:border-[#00b894]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Bank Name</label>
                <select
                  value={accountForm.bank_name}
                  onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-xs outline-hidden focus:border-[#00b894]"
                >
                  <option value="Access Bank">Access Bank</option>
                  <option value="GTBank">Guaranty Trust Bank (GTB)</option>
                  <option value="Zenith Bank">Zenith Bank</option>
                  <option value="First Bank">First Bank of Nigeria</option>
                  <option value="UBA">United Bank for Africa (UBA)</option>
                  <option value="Kuda Bank">Kuda Microfinance Bank</option>
                  <option value="OPay">OPay</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Account Number (10 Digits)</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="0123456789"
                  value={accountForm.account_number}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, account_number: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-xs outline-hidden font-mono font-bold focus:border-[#00b894]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold py-3 rounded-xl shadow-md shadow-[#00b894]/20 mt-2 cursor-pointer transition-all"
              >
                Save &amp; Verify Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Request Payout Modal */}
      {isRequestPayoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setIsRequestPayoutOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900">Request Revenue Settlement</h3>

            <form onSubmit={handleRequestPayoutSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Destination Bank Account</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-xs outline-hidden focus:border-[#00b894]"
                >
                  {payoutAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bank_name} ({acc.account_number}) - {acc.account_holder_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Payout Amount (NGN)</label>
                <input
                  type="number"
                  required
                  min={100}
                  max={availableBalance}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[#00b894] font-black text-base outline-hidden focus:border-[#00b894]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold py-3 rounded-xl shadow-md shadow-[#00b894]/20 mt-2 cursor-pointer transition-all"
              >
                Submit Settlement Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
