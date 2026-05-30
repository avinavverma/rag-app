export default function DashboardLayout({
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
          animation: "bg-drift 30s linear infinite",
        }}
      />

      <div className="absolute inset-0 bg-black/95" />

      <div className="relative z-10">
        {children}
      </div>
    </main>
  );
}