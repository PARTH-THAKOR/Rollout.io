import React, { createContext, useContext, useEffect, useState } from 'react';
import sdk from '@rollout.io/sdk-js';

interface RolloutContextType {
  isInitialized: boolean;
  flags: Record<string, any>;
  getFlag: (key: string, defaultValue: any) => any;
}

const RolloutContext = createContext<RolloutContextType | undefined>(undefined);

export const RolloutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [flags, setFlags] = useState<Record<string, any>>({});

  useEffect(() => {
    const init = async () => {
      try {
        console.log(`Initializing official @rollout.io/sdk-js (v${sdk.version})`);
        
        await sdk.init({
          sdkKey: 'sdk_e5df00b66efd4340a81013e0473e1a58',
          userId: 'user-guest-1',
          baseUrl: window.location.origin + '/gateway', // Routes through Nginx proxy to Gateway
          refreshInterval: 0 // As per latest request
        });
        
        console.log("Official SDK Init Success!");
        setIsInitialized(true);
        setFlags(sdk.flags || {});

        // Debugging global
        (window as any).Rollout = sdk;
      } catch (e: any) {
        console.error("SDK Init Error:", e.message);
      }
    };
    init();
  }, []);

  const getFlag = (key: string, defaultValue: any) => {
    // Correctly calling SDK method for telemetry reporting
    if (sdk && typeof sdk.getFlag === 'function') {
        return sdk.getFlag(key, defaultValue);
    }
    return defaultValue;
  };

  return (
    <RolloutContext.Provider value={{ isInitialized, flags, getFlag }}>
      {children}
    </RolloutContext.Provider>
  );
};

export const useFlag = (key: string, defaultValue: any) => {
  const context = useContext(RolloutContext);
  return context ? context.getFlag(key, defaultValue) : defaultValue;
};
