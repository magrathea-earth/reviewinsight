import Link from "next/link";

export default function NotFound() {
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
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>404</h1>
            <p style={{ color: "#888" }}>This page could not be found.</p>
            <a
                href="/"
                style={{
                    padding: "0.5rem 1rem",
                    background: "#000",
                    color: "#fff",
                    borderRadius: "0.375rem",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                }}
            >
                Go home
            </a>
        </div>
    );
}
