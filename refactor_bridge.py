#!/usr/bin/env python3
"""
Script to refactor bridge-interface.tsx by removing duplicate L2 to L1 functions
and replacing them with imported functions from /lib/l2-to-l1/
"""

import re

def refactor_bridge_interface(input_file, output_file):
    with open(input_file, 'r') as f:
        content = f.read()
    
    # 1. Add imports after the existing imports
    old_import = 'import { usePendingTransactionsContext } from "@/contexts/PendingTransactionsContext";'
    new_import = '''import { usePendingTransactionsContext } from "@/contexts/PendingTransactionsContext";
import {
  type MessagePassedEventData,
  type DisputeGameData,
  type ProofData,
  extractMessagePassedEvent,
  waitForDisputeGame,
  generateProof,
  submitProof,
  optimismPortalAbi,
  resolveGame as resolveGameL2ToL1,
  finalizeWithdrawal as finalizeWithdrawalL2ToL1,
} from "@/lib/l2-to-l1";'''
    
    content = content.replace(old_import, new_import)
    
    # 2. Remove duplicate interface definitions
    content = re.sub(
        r'  // Interface for MessagePassed event data\n  interface MessagePassedEventData \{[^}]+\}\n\n  // Interface for DisputeGame data\n  interface DisputeGameData \{[^}]+\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )
    
    # 3. Remove DisputeGameFactory and DisputeGame ABIs
    content = re.sub(
        r'  // DisputeGameFactory ABI\n  const disputeGameFactoryAbi = parseAbi\(\[[^\]]+\]\);\n\n  // DisputeGame ABI\n  const disputeGameAbi = parseAbi\(\[[^\]]+\]\);\n\n',
        '',
        content,
        flags=re.DOTALL
    )
    
    # 4. Remove old waitForDisputeGame function
    content = re.sub(
        r'  // Step 2: Poll DisputeGameFactory for suitable game\n  const waitForDisputeGame = useCallback\(async \(l2BlockNumber: number\): Promise<DisputeGameData> => \{.*?\}, \[disputeGameAbi, disputeGameFactoryAbi\]\);\n\n',
        '',
        content,
        flags=re.DOTALL
    )
    
    # 5. Remove old generateProof function  
    content = re.sub(
        r'  // Step 3: Generate Merkle Proof\n  const generateProof = useCallback\(async \(withdrawalDetails: MessagePassedEventData, l2BlockNumber: number, disputeGame: DisputeGameData\) => \{.*?\}, \[\]\);\n\n',
        '',
        content,
        flags=re.DOTALL
    )
    
    # 6. Remove old optimismPortalAbi definition
    content = re.sub(
        r'  // OptimismPortal ABI for proof submission\n  const optimismPortalAbi = useMemo\(\(\) => \[.*?\] as const, \[\]\);\n\n',
        '',
        content,
        flags=re.DOTALL
    )
    
    # 7. Remove old submitProof function
    content = re.sub(
        r'  // Step 4: Submit Proof to L1\n  const submitProof = useCallback\(async \(withdrawalDetails: MessagePassedEventData, disputeGame: DisputeGameData, proofData: \{.*?\}\) => \{.*?\}, \[chainId, switchChain, writeProofContract, addNotification\]\);\n\n',
        '',
        content,
        flags=re.DOTALL
    )
    
    # 8. Remove old resolveGame function
    content = re.sub(
        r'  // Step 5: Resolve dispute game\n  const resolveGame = useCallback\(async \(gameAddress: string\) => \{.*?\}, \[writeProofContract, finalizeWithdrawal, withdrawalDetails, isResolvingGame, isWithdrawalComplete\]\);\n\n',
        '',
        content,
        flags=re.DOTALL
    )
    
    # 9. Remove old finalizeWithdrawal function
    content = re.sub(
        r'  // Step 6: Finalize withdrawal\n  const finalizeWithdrawal = useCallback\(async \(withdrawalDetails: MessagePassedEventData\): Promise<boolean> => \{.*?\}, \[address, writeProofContract, setIsWithdrawalComplete\]\);\n\n',
        '',
        content,
        flags=re.DOTALL
    )
    
    with open(output_file, 'w') as f:
        f.write(content)
    
    print(f"✅ Refactored bridge interface saved to {output_file}")
    print(f"Removed duplicate L2 to L1 function implementations")

if __name__ == '__main__':
    refactor_bridge_interface(
        'src/components/bridge-interface.tsx',
        'src/components/bridge-interface.tsx.new'
    )

