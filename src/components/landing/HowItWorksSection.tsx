const HowItWorksSection = () => {
  const steps = [
    { num: 1, title: "Import Your Data", desc: "Bring your existing candidates, companies, and search history. We handle Crelate, spreadsheets, and more." },
    { num: 2, title: "Connect Your Tools", desc: "Link your calendar, email, and meeting tools with just a few clicks." },
    { num: 3, title: "Start Closing Searches", desc: "Your team sees everything in one place — candidates, jobs, and pipeline metrics unified." },
  ];

  return (
    <section className="py-20 md:py-24 px-4 bg-muted">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 text-foreground">
          Up and Running in Days
        </h2>
        <p className="text-lg md:text-xl text-center text-muted-foreground mb-12 md:mb-16 max-w-2xl mx-auto">
          From scattered data to complete visibility, quickly.
        </p>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map(({ num, title, desc }) => (
            <div key={num} className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground">
                {num}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
              <p className="text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
