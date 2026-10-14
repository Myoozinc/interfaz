import React, { useState } from 'react';
import { 
  X, 
  Check, 
  ShieldCheck, 
  Flame,
  RotateCcw,
  History
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserCredits } from '../types';
import { creditLedger } from '../core/credits/CreditLedger';
import { NonaLogo } from './NonaLogo';

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
    if (confirm('¿Deseas reiniciar tu historial de transacciones y restablecer tus créditos iniciales a 1,000?')) {
      creditLedger.resetToInitialState();
      setTransactions(creditLedger.getTransactions());
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-raised/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-panel border border-line rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-fade-in text-xs font-sans max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 bg-canvas/80 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <NonaLogo size={32} variant="badge" />
            <div>
              <h2 className="text-base font-extrabold text-fg tracking-tight">
                Saldo de Créditos & Planes NONA
              </h2>
              <p className="text-xs text-muted">
                Tienes actualmente <strong className="text-accent font-bold">{credits.balance} créditos</strong> disponibles
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetHistory}
              title="Reiniciar saldo e historial"
              className="px-2.5 py-1.5 rounded-xl border border-line hover:bg-red-500/10 hover:border-red-500/30 text-muted hover:text-red-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reiniciar a 1,000</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-raised-2 text-muted hover:text-fg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Pricing Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Free Tier */}
            <div className="bg-canvas p-4 rounded-2xl border border-line shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Nivel Inicial
                </span>
                <h3 className="text-lg font-extrabold text-fg mt-1">Gratis</h3>
                <p className="text-[11px] text-muted mt-1">Para probar la plataforma y crear tus primeras apps.</p>
                
                <div className="my-4 pt-3 border-t border-line space-y-2 text-[11px] text-fg-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span><strong>1,000 créditos de bienvenida</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Generador de apps & juegos 3D</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Editor Monaco & Live Preview</span>
                  </div>
                </div>
              </div>

              <button
                disabled
                className="w-full py-2 rounded-xl bg-panel text-muted font-semibold border border-line text-xs"
              >
                Plan Activo
              </button>
            </div>

            {/* Pack 500 Credits */}
            <div className="bg-panel p-4 rounded-2xl border border-line shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                  Recarga Rápida
                </span>
                <h3 className="text-lg font-extrabold text-fg mt-1">$5 <span className="text-xs font-normal text-muted">USD</span></h3>
                <p className="text-[11px] text-muted mt-1">Pack de 500 créditos sin caducidad.</p>
                
                <div className="my-4 pt-3 border-t border-line space-y-2 text-[11px] text-fg-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>+500 Créditos de IA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Generaciones ilimitadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Exportación ZIP completa</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handlePurchase('pack-500', 500)}
                disabled={processingPack === 'pack-500'}
                className="w-full py-2 rounded-xl bg-accent/10 hover:bg-accent/15 text-accent font-semibold border border-accent/30 transition-all shadow-2xs cursor-pointer"
              >
                {processingPack === 'pack-500' ? 'Procesando...' : 'Comprar 500 Créditos'}
              </button>
            </div>

            {/* Pro Subscription */}
            <div className="bg-accent/10 p-4 rounded-2xl border-2 border-accent shadow-md flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-6 top-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[9px] font-bold uppercase px-8 py-0.5 rotate-45 shadow-xs">
                Popular
              </div>

              <div>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                  <Flame className="w-3 h-3 fill-indigo-600" />
                  NONA PRO
                </div>
                <h3 className="text-lg font-extrabold text-fg mt-1">$19 <span className="text-xs font-normal text-muted">/ mes</span></h3>
                <p className="text-[11px] text-fg-2 mt-1">Acceso total e ilimitado para creadores.</p>
                
                <div className="my-4 pt-3 border-t border-accent/30 space-y-2 text-[11px] text-fg-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accent" />
                    <span><strong>Créditos Ilimitados</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accent" />
                    <span>Sincronización GitHub / Vercel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accent" />
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
          <div className="bg-canvas rounded-2xl p-4 border border-line">
            <h4 className="font-bold text-fg mb-2 flex items-center gap-1.5 text-xs">
              <History className="w-3.5 h-3.5 text-accent" />
              Historial de Transacciones de Créditos (v3.5)
            </h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-panel p-2 rounded-xl border border-line/80 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-semibold text-fg">{tx.reason}</span>
                    <span className="text-[10px] text-muted ml-2">
                      {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold ${tx.amount >= 0 ? 'text-emerald-300' : 'text-fg-2'}`}>
                      {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                    </span>
                    <span className="text-[10px] text-muted">
                      (Saldo: {tx.balanceAfter})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-canvas border-t border-line flex items-center justify-center gap-2 text-[11px] text-muted">
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          <span>Historial v3.5 auditado en CreditLedger • 1,000 Créditos Iniciales</span>
        </div>

      </div>
    </div>
  );
};
