import { Navigate, Outlet } from "react-router-dom";
import state from "../store";
import { useQueryLogin } from "@/hooks/ReactQuery/useQueryLogin";
import { useSnapshot } from "valtio";
import { useEffect } from "react";

const RequireAuth = () => {
    const { data, isLoading } = useQueryLogin();
    const snap = useSnapshot(state);

    useEffect(() => {
        if (data) {
            state.logged = true
        }
    }, [data]);

    if (isLoading) {
        return null
    }

    if (snap.logged || state.logged || data && window.location.pathname !== "/login") {
        return <Outlet />
    }

    return isLoading ? null : <Navigate to="/login" replace />
};

export default RequireAuth;
