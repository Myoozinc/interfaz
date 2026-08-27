import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  Check, 
  ShieldCheck,
  Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserCredits } from '../types';

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

  if (!isOpen) return null;

  const handlePurchase = (packId: string, creditsAmount: number, plan?: UserCredits['plan']) => {
    setProcessingPack(packId);
    setTimeout(() => {
      onAddCredits(creditsAmount, plan);
      setProcessingPack(null);
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#A86B32', '#DFC7B1', '#FAF1E8', '#10B981']
      });
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-[#FAF7F2] border border-[#E7E0D6] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-fade-in text-xs">
        
        {/* Header */}
        <div className="p-6 bg-white border-b border-[#E7E0D6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF1E8] border border-[#DFC7B1] flex items-center justify-center text-[#A86B32]">
              <Zap className="w-5 h-5 fill-[#A86B32]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1C1917]">
                Saldo de Créditos & Planes NONA
              </h2>
              <p className="text-xs text-[#8C827A]">
                Tienes actualmente <strong className="text-[#A86B32]">{credits.balance} créditos</strong> disponibles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#F4EFEA] text-[#8C827A] hover:text-[#1C1917] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pricing Plans Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Free Tier */}
          <div className="bg-white p-4 rounded-2xl border border-[#E7E0D6] shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A]">
                Nivel Inicial
              </span>
              <h3 className="text-lg font-extrabold text-[#1C1917] mt-1">Gratis</h3>
              <p className="text-[11px] text-[#8C827A] mt-1">Para probar la plataforma y tu modelo local.</p>
              
              <div className="my-4 pt-3 border-t border-[#E7E0D6] space-y-2 text-[11px] text-[#57534E]">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>50 créditos de bienvenida</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Acceso a Qwen 3.8</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Editor Monaco & Live Preview</span>
                </div>
              </div>
            </div>

            <button
              disabled
              className="w-full py-2 rounded-xl bg-[#FAF7F2] text-[#8C827A] font-semibold border border-[#E7E0D6]"
            >
              Plan Activo
            </button>
          </div>

          {/* Pack 500 Credits */}
          <div className="bg-white p-4 rounded-2xl border border-[#E7E0D6] shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A86B32]">
                Recarga Rápida
              </span>
              <h3 className="text-lg font-extrabold text-[#1C1917] mt-1">$5 <span className="text-xs font-normal text-[#8C827A]">USD</span></h3>
              <p className="text-[11px] text-[#8C827A] mt-1">Pack de 500 créditos sin caducidad.</p>
              
              <div className="my-4 pt-3 border-t border-[#E7E0D6] space-y-2 text-[11px] text-[#57534E]">
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
              className="w-full py-2 rounded-xl bg-[#FAF1E8] hover:bg-[#F4E2D2] text-[#8F5622] font-semibold border border-[#DFC7B1] transition-all shadow-2xs cursor-pointer"
            >
              {processingPack === 'pack-500' ? 'Procesando...' : 'Comprar 500 Créditos'}
            </button>
          </div>

          {/* Pro Subscription */}
          <div className="bg-[#FAF1E8] p-4 rounded-2xl border-2 border-[#A86B32] shadow-md flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-6 top-3 bg-[#A86B32] text-white text-[9px] font-bold uppercase px-8 py-0.5 rotate-45 shadow-xs">
              Popular
            </div>

            <div>
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#A86B32]">
                <Flame className="w-3 h-3 fill-[#A86B32]" />
                NONA PRO
              </div>
              <h3 className="text-lg font-extrabold text-[#1C1917] mt-1">$19 <span className="text-xs font-normal text-[#8C827A]">/ mes</span></h3>
              <p className="text-[11px] text-[#57534E] mt-1">Acceso total e ilimitado para creadores.</p>
              
              <div className="my-4 pt-3 border-t border-[#DFC7B1] space-y-2 text-[11px] text-[#57534E]">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#A86B32]" />
                  <span><strong>Créditos Ilimitados</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#A86B32]" />
                  <span>Sincronización GitHub / Vercel</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#A86B32]" />
                  <span>Soporte prioritario & Cloud GPU</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePurchase('pro-sub', 5000, 'pro')}
              disabled={processingPack === 'pro-sub'}
              className="w-full py-2 rounded-xl bg-[#A86B32] hover:bg-[#8F5622] text-white font-semibold shadow-xs transition-all cursor-pointer"
            >
              {processingPack === 'pro-sub' ? 'Activando...' : 'Suscribirme a NONA Pro'}
            </button>
          </div>

        </div>

        {/* Footer Security Notice */}
        <div className="p-4 bg-[#F4EFEA] border-t border-[#E7E0D6] flex items-center justify-center gap-2 text-[11px] text-[#8C827A]">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Pagos seguros y encriptados integrados con Stripe Checkout</span>
        </div>

      </div>
    </div>
  );
};
