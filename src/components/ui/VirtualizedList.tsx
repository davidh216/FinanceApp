import React, { forwardRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Transaction } from '../../types/financial';
import { TransactionItem } from './TransactionItem';

interface VirtualizedListProps {
  transactions: Transaction[];
  height?: number;
  itemSize?: number;
  className?: string;
  onTransactionClick?: (transaction: Transaction) => void;
}

export const VirtualizedList = forwardRef<List, VirtualizedListProps>(
  ({ 
    transactions, 
    height = 600, 
    itemSize = 80, 
    className = '',
    onTransactionClick 
  }, ref) => {
    
    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const transaction = transactions[index];
      
      return (
        <div style={style} className="px-4">
          <TransactionItem
            transaction={transaction}
            onClick={() => onTransactionClick?.(transaction)}
            className="cursor-pointer hover:bg-gray-50 transition-colors"
          />
        </div>
      );
    };

    if (transactions.length === 0) {
      return (
        <div className={`flex items-center justify-center ${className}`} style={{ height }}>
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500">Try adjusting your filters or date range</p>
          </div>
        </div>
      );
    }

    return (
      <div className={className}>
        <List
          ref={ref}
          height={height}
          itemCount={transactions.length}
          itemSize={itemSize}
          width="100%"
          overscanCount={5}
          className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >
          {Row}
        </List>
      </div>
    );
  }
);

VirtualizedList.displayName = 'VirtualizedList'; 