import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface MaskedBuyRateProps {
  price: number;
  prefix?: string;
  className?: string;
  showIcon?: boolean;
}

export const MaskedBuyRate: React.FC<MaskedBuyRateProps> = ({
  price,
  prefix = "Buy: ",
  className = "",
  showIcon = false,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const formattedPrice = price != null && !isNaN(price) ? `₹${price}` : '₹0';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsRevealed((prev) => !prev);
      }}
      className={`inline-flex items-center gap-0.5 text-[8.5px] text-zinc-500 hover:text-zinc-300 font-normal transition-colors cursor-pointer select-none leading-none opacity-85 hover:opacity-100 ${className}`}
      title={isRevealed ? "Tap to mask Buy Rate" : "Tap to reveal Buy Rate"}
    >
      {prefix && <span className="opacity-75">{prefix}</span>}
      <span className="font-mono tracking-tight">
        {isRevealed ? formattedPrice : "₹•••"}
      </span>
      {showIcon && (
        isRevealed ? (
          <EyeOff className="w-2.5 h-2.5 ml-0.5 text-zinc-500 opacity-60 shrink-0" />
        ) : (
          <Eye className="w-2.5 h-2.5 ml-0.5 text-zinc-500 opacity-40 shrink-0" />
        )
      )}
    </button>
  );
};
