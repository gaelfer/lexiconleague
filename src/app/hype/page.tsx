export default function HypeVideoPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background:
          "radial-gradient(circle at 20% 20%, #1e293b 0%, #0f172a 35%, #080f1a 100%)",
        color: "#f8fafc",
      }}
    >
      <section style={{ width: "100%", maxWidth: 420 }}>
        <h1
          style={{
            margin: "0 0 0.75rem",
            fontSize: "1.5rem",
            lineHeight: 1.2,
            fontWeight: 700,
          }}
        >
          Lexicon League Hype Video
        </h1>
        <p style={{ margin: "0 0 1rem", color: "#94a3b8" }}>
          Remotion render embedded in-site.
        </p>
        <video
          src="/remotion/lexiconleague-hype.mp4"
          controls
          playsInline
          style={{
            width: "100%",
            borderRadius: 18,
            border: "1px solid #334155",
            boxShadow: "0 18px 60px rgba(0, 0, 0, 0.45)",
            background: "#000",
          }}
        />
      </section>
    </main>
  );
}
