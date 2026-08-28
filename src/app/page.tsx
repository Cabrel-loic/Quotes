import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { QuoteApp } from "@/components/QuoteApp";
import { getDateChrome } from "@/lib/date";

export default function Home() {
  const date = getDateChrome();
  return (
    <div id="daybook-root" style={{ minHeight: "100vh", position: "relative" }}>
      <AppErrorBoundary><QuoteApp /></AppErrorBoundary>
      <main className="daybook-shell server-fallback">
        <div className="ambient-background" aria-hidden="true" />
        <section className="quote-stage">
          <header className="date-row"><span>{date.stamp}</span><span>{date.badge}</span></header>
          <blockquote className="quote-card">
            <span className="quote-mark" aria-hidden="true">“</span>
            <p className="quote-text">The unexamined life is not worth living.</p>
            <footer className="quote-author"><span aria-hidden="true" /><cite>Socrates</cite></footer>
          </blockquote>
          <p className="status-message">Loading today’s quote…</p>
        </section>
      </main>
    </div>
  );
}
