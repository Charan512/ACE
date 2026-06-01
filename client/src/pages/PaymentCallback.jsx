import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/useAuthStore';
import BlurText from '../components/react-bits/BlurText';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, fetchUser } = useAuthStore();

  const [status, setStatus] = useState('processing'); // processing, success, failed
  const [errorMsg, setErrorMsg] = useState('');
  
  // Ref to prevent double-firing in strict mode
  const verifiedRef = useRef(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (verifiedRef.current) return;
      verifiedRef.current = true;

      // 1. Get transaction ID (from dev URL or sessionStorage)
      const devTxnId = searchParams.get('txnId');
      const sessionTxnId = sessionStorage.getItem('ace_pending_txn');
      const txnId = devTxnId || sessionTxnId;

      if (!txnId) {
        setStatus('failed');
        setErrorMsg('Transaction ID not found. Please try again.');
        return;
      }

      try {
        // 2. Call backend Status API
        const res = await api.get(`/payments/verify/${txnId}`);
        const result = res.data.data.status; // 'SUCCESS' | 'FAILED' | 'PENDING'

        if (result === 'SUCCESS') {
          // If in DEV mode, the devConfirm route might not have been hit yet
          // because it's a redirect mock. Let's trigger it now.
          if (import.meta.env.DEV && searchParams.get('mode') === 'dev') {
            await api.post('/payments/dev-confirm', {
              merchantTransactionId: txnId,
              purpose: searchParams.get('purpose'),
              guestEmail: searchParams.get('guestEmail'),
              guestName: searchParams.get('guestName')
            });
          }

          // Clear session storage
          sessionStorage.removeItem('ace_pending_txn');
          setStatus('success');
          
          // Refresh user data (if logged in, vault might have updated)
          if (isAuthenticated) {
            await fetchUser();
          }

        } else if (result === 'FAILED') {
          setStatus('failed');
          setErrorMsg('Payment failed or was cancelled.');
          sessionStorage.removeItem('ace_pending_txn');
        } else {
          // PENDING — PhonePe is taking time.
          setStatus('failed');
          setErrorMsg('Payment status is pending. Please check your email for confirmation later.');
          sessionStorage.removeItem('ace_pending_txn');
        }

      } catch (err) {
        console.error('[PaymentCallback] Verification failed:', err);
        setStatus('failed');
        setErrorMsg('Failed to verify payment status. Please contact support.');
      }
    };

    // Add a slight delay for UI polish so it doesn't instantly snap
    const timer = setTimeout(verifyPayment, 1500);
    return () => clearTimeout(timer);
  }, [searchParams, isAuthenticated, fetchUser]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center relative overflow-hidden">
        
        {status === 'processing' && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full animate-pulse"></div>
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Processing Payment</h2>
            <p className="text-slate-500 font-medium">Please wait while we verify your transaction with the bank...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <BlurText 
              text="Payment Successful!" 
              className="text-3xl font-black text-slate-900 mb-2" 
              delay={50} 
            />
            <p className="text-slate-600 mb-8 mt-2">
              Your transaction was completed successfully. Your account has been updated.
            </p>
            <button 
              onClick={() => navigate(isAuthenticated ? '/member/dashboard' : '/login')}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
            >
              Continue to Portal
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Payment Failed</h2>
            <p className="text-slate-600 mb-6">{errorMsg}</p>
            
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 text-amber-700 rounded-xl mb-8 w-full text-left text-sm font-medium border border-amber-100">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>No amount was deducted. If deducted, it will be refunded in 3-5 days.</span>
            </div>

            <button 
              onClick={() => navigate(-1)} // Go back to try again
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
            >
              Go Back & Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;
