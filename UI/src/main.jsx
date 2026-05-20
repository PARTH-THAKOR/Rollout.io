import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/shared.css'
import App from './App.jsx'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 2,        // 2 min — reduced from 5m so fresh data loads faster after login
            gcTime: 1000 * 60 * 10,           // 10 min — unused cache is garbage-collected
            retry: (failureCount, error) => {
                // Never retry auth errors — user needs to re-login
                if (error?.message?.includes('401') || error?.message?.includes('403')) {
                    return false;
                }
                return failureCount < 1;       // Retry other errors once
            },
            refetchOnWindowFocus: false,       // Don't refetch when tab regains focus
        },
    },
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </React.StrictMode>,
)