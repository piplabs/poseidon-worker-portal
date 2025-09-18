"use client";

interface Token {
  symbol: string;
  name: string;
  balance: string;
  logo: string;
  color: string;
  layer?: string;
}

interface TokenCardProps {
  token: Token;
  amount: string;
  onAmountChange: (amount: string) => void;
  isFrom: boolean;
}

export function TokenCard({
  token,
  amount,
  onAmountChange,
  isFrom,
}: TokenCardProps) {
  return (
    <div className="bg-card text-card-foreground border rounded-xl p-4 space-y-3">
      {/* Token Info Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
            token.layer === 'L1' ? 'token-logo-psdn-l1' : 'token-logo-psdn-l2'
          }`}>
            {token.logo.startsWith('http') ? (
              <img 
                src={token.logo} 
                alt={token.symbol}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              token.logo
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-foreground font-medium">{token.name}</span>
              {token.layer && (
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                  token.layer === 'L1' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                }`}>
                  {token.layer}
                </span>
              )}
            </div>
            <div className="text-muted-foreground text-sm">{token.balance} {token.symbol}</div>
          </div>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <input
          type="text"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="0"
          className="text-2xl font-bold text-foreground border-none shadow-none focus:outline-none p-0 bg-transparent w-full"
          disabled={false}
        />
        {!isFrom && (
          <div className="text-muted-foreground text-sm">Receive {token.symbol}</div>
        )}
      </div>
    </div>
  );
}
