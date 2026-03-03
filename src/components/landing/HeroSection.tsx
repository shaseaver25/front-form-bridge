const HeroSection = ({ onGetStarted, onSeeFeatures }: { onGetStarted: () => void; onSeeFeatures: () => void }) => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center pt-20 px-4 overflow-hidden bg-background">
      {/* Decorative circles - matching AvidEdge's teal/yellow aesthetic */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large yellow circle */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[hsl(45_90%_65%/0.35)]" />
        {/* Teal circle left */}
        <div className="absolute top-[15%] left-[10%] w-[350px] h-[350px] rounded-full bg-[hsl(180_60%_65%/0.3)]" />
        {/* Teal circle right */}
        <div className="absolute top-[20%] right-[5%] w-[300px] h-[300px] rounded-full bg-[hsl(180_60%_65%/0.2)]" />
        {/* Small accent circles */}
        <div className="absolute top-[30%] left-[25%] w-[80px] h-[80px] rounded-full bg-[hsl(180_60%_65%/0.4)]" />
        <div className="absolute top-[60%] right-[20%] w-[60px] h-[60px] rounded-full bg-[hsl(45_90%_65%/0.4)]" />
        <div className="absolute bottom-[25%] left-[15%] w-[40px] h-[40px] rounded-full bg-[hsl(0_0%_70%/0.3)]" />
        {/* Scattered dots */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[hsl(0_0%_60%/0.3)]"
            style={{
              top: `${15 + Math.random() * 70}%`,
              left: `${5 + Math.random() * 90}%`,
            }}
          />
        ))}
        {/* Plus signs */}
        <div className="absolute top-[25%] right-[15%] text-[hsl(0_0%_65%)] text-2xl font-light select-none">+</div>
        <div className="absolute top-[35%] right-[12%] text-[hsl(0_0%_65%)] text-lg font-light select-none">+</div>
        <div className="absolute bottom-[30%] right-[18%] text-[hsl(0_0%_65%)] text-xl font-light select-none">+</div>
        <div className="absolute top-[45%] left-[8%] text-[hsl(0_0%_65%)] text-2xl font-light select-none">+</div>
        {/* Horizontal line across middle */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-[hsl(0_0%_75%/0.4)]" />
      </div>

      {/* Hero content */}
      <div className="container mx-auto max-w-5xl text-center relative z-10">
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-foreground leading-[1.1] tracking-tight mb-8">
          Technology<br />
          Executive Search<br />
          <span className="text-foreground/80">Re:defined</span>
        </h1>
      </div>

      {/* Below-fold intro text */}
      <div className="absolute bottom-12 left-0 right-0 px-4">
        <div className="container mx-auto max-w-6xl grid md:grid-cols-2 gap-8 items-start">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary leading-tight">
            Technology Leadership<br />
            That Advances Business
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            At AvidEdge, we deliver retained executive search with depth, integrity, and unmatched attention to alignment. We don't just fill technology leadership roles, we find the right leader by immersing ourselves in your strategy, culture, and business priorities.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
