import React from 'react';

export const createContext = <T>() => {
  const ctx = React.createContext<T | undefined>(undefined);

  function useContext() {
    const context = React.useContext(ctx);
    if (!context) {
      throw new Error('useContext must be used within a Provider');
    }
    return context;
  }

  return [ctx.Provider, useContext] as const;
};
