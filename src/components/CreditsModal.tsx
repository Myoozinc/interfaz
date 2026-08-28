import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  Check, 
  ShieldCheck, 
  Flame,
  RotateCcw,
  History
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserCredits } from '../types';
import { creditLedger } from '../core/credits/CreditLedger';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credits: UserCredits;
  onAddCredits: (amount: number, planName?: UserCredits['plan']) => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({
  isOpen,
  onClose,
  credits,
  onAddCredits,
}) => {
  const [processingPack, setProcessingPack] = useState<string | null>(null);
  const [transactions, setTransactions] = useState(() => creditLedger.getTransactions());

  if (!isOpen) return null;

  const handlePurchase = (packId: string, creditsAmount: number, plan?: UserCredits['plan']) => {
    setProcessingPack(packId);
    setTimeout(() => {
      onAddCredits(creditsAmount, plan);
      setProcessingPack(null);
      setTransactions(creditLedger.getTransactions());
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#7C3AED', '#A855F7', '#10B981']
      });
      onClose();
    }, 1200);
  };

  const handleResetHistory = () => {
    if (confirm('¿Deseas reiniciar tu historial de transacciones y restablecer tus créditos iniciales a 50?')) {
      creditLedger.resetToInitialState();
      setTransactions(creditLedger.getTransactions());
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-fade-in text-xs font-sans max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Zap className="w-5 h-5 fill-indigo-600 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Saldo de Créditos & Planes NONA
              </h2>
              <p className="text-xs text-slate-500">
                Tienes actualmente <strong className="text-indigo-600">{credits.balance} créditos</strong> disponibles
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetHistory}
              title="Reiniciar saldo e historial"
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-500 hover:text-red-600 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reiniciar a 0</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Pricing Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Free Tier */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nivel Inicial
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1">Gratis</h3>
                <p className="text-[11px] text-slate-500 mt-1">Para probar la plataforma y crear tus primeras apps.</p>
                
                <div className="my-4 pt-3 border-t border-slate-200 space-y-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>50 créditos de bienvenida</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Generador de apps & juegos 3D</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Editor Monaco & Live Preview</span>
                  </div>
                </div>
              </div>

              <button
                disabled
                className="w-full py-2 rounded-xl bg-white text-slate-400 font-semibold border border-slate-200 text-xs"
              >
                Plan Activo
              </button>
            </div>

            {/* Pack 500 Credits */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Recarga Rápida
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1">$5 <span className="text-xs font-normal text-slate-400">USD</span></h3>
                <p className="text-[11px] text-slate-500 mt-1">Pack de 500 créditos sin caducidad.</p>
                
                <div className="my-4 pt-3 border-t border-slate-200 space-y-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+500 Créditos de IA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Generaciones ilimitadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Exportación ZIP completa</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handlePurchase('pack-500', 500)}
                disabled={processingPack === 'pack-500'}
                className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 transition-all shadow-2xs cursor-pointer"
              >
                {processingPack === 'pack-500' ? 'Procesando...' : 'Comprar 500 Créditos'}
              </button>
            </div>

            {/* Pro Subscription */}
            <div className="bg-indigo-50/70 p-4 rounded-2xl border-2 border-indigo-600 shadow-md flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-6 top-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[9px] font-bold uppercase px-8 py-0.5 rotate-45 shadow-xs">
                Popular
              </div>

              <div>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  <Flame className="w-3 h-3 fill-indigo-600" />
                  NONA PRO
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1">$19 <span className="text-xs font-normal text-slate-400">/ mes</span></h3>
                <p className="text-[11px] text-slate-600 mt-1">Acceso total e ilimitado para creadores.</p>
                
                <div className="my-4 pt-3 border-t border-indigo-200 space-y-2 text-[11px] text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600" />
                    <span><strong>Créditos Ilimitados</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Sincronización GitHub / Vercel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Soporte prioritario & Cloud GPU</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handlePurchase('pro-sub', 5000, 'pro')}
                disabled={processingPack === 'pro-sub'}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-xs transition-all cursor-pointer"
              >
                {processingPack === 'pro-sub' ? 'Activando...' : 'Suscribirme a NONA Pro'}
              </button>
            </div>

          </div>

          {/* Ledger Transaction History Log */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-xs">
              <History className="w-3.5 h-3.5 text-indigo-600" />
              Historial de Transacciones de Créditos (v3.0)
            </h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-white p-2 rounded-xl border border-slate-200/80 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-semibold text-slate-800">{tx.reason}</span>
                    <span className="text-[10px] text-slate-400 ml-2">
                      {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold ${tx.amount >= 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                      {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (Saldo: {tx.balanceAfter})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Historial v3.0 auditado en CreditLedger</span>
        </div>

      </div>
    </div>
  );
};
