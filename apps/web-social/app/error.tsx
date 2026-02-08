"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div
            style={{
                display: "flex",
                minHeight: "50vh",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem",
                padding: "1.5rem",
                textAlign: "center",
            }}
        >
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Something went wrong</h2>
            <p style={{ color: "#888", maxWidth: "28rem" }}>
                {error.message || "An unexpected error occurred."}
            </p>
            <button
                type="button"
                onClick={reset}
                style={{
                    padding: "0.5rem 1rem",
                    background: "#000",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                }}
            >
                Try again
            </button>
        </div>
    );
}
