export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/pixel_bg.jpeg')",
          animation: "bg-drift 15s linear infinite",
        }}
      />

      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </main>
  );
}