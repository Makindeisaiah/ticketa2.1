import React, { useState } from 'react';
import {
  X,
  DollarSign,
  Building,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';

interface WithdrawEarningsModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WithdrawEarningsModal: React.FC<WithdrawEarningsModalProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [bankName, setBankName] = useState('Access Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  // Calculate available revenue
  const totalRevenue = (event.ticket_types || []).reduce((acc: number, tt: any) => {
    return acc + ((Number(tt.quantity_sold) || 0) * (Number(tt.price) || 0));
  }, 0);
  const platformFee = Math.round(totalRevenue * 0.05);
  const availableEarnings = Math.max(0, totalRevenue - platformFee);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      setError('Please enter a valid withdrawal amount.');
      return;
    }
    if (withdrawAmount > availableEarnings) {
      setError(`Withdrawal amount cannot exceed available balance of ₦${availableEarnings.toLocaleString()}`);
      return;
    }
    if (accountNumber.trim().length < 10) {
      setError('Please enter a valid 10-digit NUBAN account number.');
      return;
    }

    setLoading(true);
    setError(null);

    // Simulate instant payout gateway processing
    setTimeout(() => {
      setLoading(false);
      setIsSuccess(true);
      if (onSuccess) onSuccess();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div
        id="withdraw-earnings-modal-dialog"
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Withdraw Earnings</h3>
              <p className="text-xs text-slate-500 font-medium">{event.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#00b894] flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-slate-900">Payout Request Submitted!</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                ₦{Number(amount).toLocaleString()} will be disbursed to your {bankName} account ({accountNumber}) within 1-2 business hours.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#00b894] hover:bg-[#00a383] text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleWithdraw} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Available Balance Box */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block">Available for Payout</span>
                <span className="text-2xl font-black text-[#00b894] tracking-tight block">
                  ₦{availableEarnings.toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAmount(String(availableEarnings))}
                className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors cursor-pointer"
              >
                Max
              </button>
            </div>

            {/* Amount to withdraw */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Withdrawal Amount (₦ NGN) *
              </label>
              <input
                type="number"
                min="1000"
                max={availableEarnings}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:border-[#00b894]"
              />
            </div>

            {/* Bank Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Destination Bank *
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#00b894] cursor-pointer"
                >
                  <option value="Access Bank">Access Bank</option>
                  <option value="GTBank">GTBank (Guaranty Trust Bank)</option>
                  <option value="Zenith Bank">Zenith Bank</option>
                  <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                  <option value="UBA">United Bank for Africa (UBA)</option>
                  <option value="Kuda Bank">Kuda Microfinance Bank</option>
                  <option value="OPay">OPay</option>
                  <option value="Moniepoint">Moniepoint MFB</option>
                  <option value="Stanbic IBTC">Stanbic IBTC Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Number (10 Digits) *
                </label>
                <input
                  type="text"
                  maxLength={10}
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="0123456789"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-[#00b894]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Ticketa Productions Ltd"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-[#00b894]"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || availableEarnings <= 0}
                className="px-5 py-2.5 bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#00b894]/20 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Payout...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Confirm Withdrawal</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
