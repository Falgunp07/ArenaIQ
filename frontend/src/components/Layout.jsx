import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-slate-50">
      <Navbar />
      <main className="relative z-10 flex-1 w-full">{children}</main>
    </div>
  );
}
