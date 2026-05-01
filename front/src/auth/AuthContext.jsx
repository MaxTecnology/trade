import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useState } from "react";

const AuthContext = createContext({})
const queryClient = new QueryClient()
export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({});

    return (

        <AuthContext.Provider value={{ auth, setAuth }}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </AuthContext.Provider >

    )
};

export default AuthContext;
