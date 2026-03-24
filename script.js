const siteContent = {
  meta: {
    name: "Your Name",
    roleLine: "Designer + Developer + Problem Solver",
    title: "I build products that move real business goals.",
    heroCopy:
      "This site highlights your most important projects, measurable outcomes, and the work you want to be known for.",
    aboutTitle: "A practical builder with a strategic lens",
    aboutCopy:
      "Replace this with your story in 3-5 lines. Explain your approach, your strengths, and the kind of work you want more of.",
    contactTitle: "Let us build something useful and beautiful.",
    contactCopy: "Email me at hello@example.com or connect on LinkedIn.",
    contactHref: "mailto:hello@example.com",
    footerText: "© 2026 Your Name. Built with intent."
  },
  metrics: [
    { value: "120%", label: "Revenue lift from product redesign" },
    { value: "8", label: "Major launches led end-to-end" },
    { value: "35K", label: "Monthly users supported" }
  ],
  featuredWork: [
    {
      title: "Platform Revamp",
      copy: "Redesigned a legacy platform into a cleaner, faster experience, reducing drop-off and improving conversion quality.",
      tag: "Product Strategy"
    },
    {
      title: "Growth Engine",
      copy: "Built a campaign and analytics pipeline that gave the team clear signals and increased qualified leads.",
      tag: "Growth"
    },
    {
      title: "Operations Automation",
      copy: "Automated repetitive internal workflows so teams could spend time on high-value decisions instead of manual tasks.",
      tag: "Systems"
    }
  ],
  focusAreas: [
    {
      title: "High-Impact Product Design",
      copy: "Turning broad goals into focused digital products that are intuitive, measurable, and scalable."
    },
    {
      title: "Cross-Functional Delivery",
      copy: "Aligning design, engineering, and business teams around practical execution and clear outcomes."
    },
    {
      title: "Decision-Ready Insights",
      copy: "Building reporting and experimentation loops that make strategic decisions faster and smarter."
    }
  ]
};

function setText(id, text) {
  const node = document.getElementById(id);
  if (node) node.textContent = text;
}

function hydrateBasics() {
  const { meta, metrics } = siteContent;
  document.title = `${meta.name} | Key Work`;
  setText("brand-name", meta.name);
  setText("role-line", meta.roleLine);
  setText("hero-title", meta.title);
  setText("hero-copy", meta.heroCopy);
  setText("about-title", meta.aboutTitle);
  setText("about-copy", meta.aboutCopy);
  setText("contact-title", meta.contactTitle);
  setText("contact-copy", meta.contactCopy);
  setText("footer-text", meta.footerText);

  const contactLink = document.getElementById("contact-link");
  if (contactLink) {
    contactLink.setAttribute("href", meta.contactHref);
  }

  metrics.forEach((metric, index) => {
    setText(`metric-${index + 1}-value`, metric.value);
    setText(`metric-${index + 1}-label`, metric.label);
  });
}

function createCards() {
  const workHost = document.getElementById("work-cards");
  const focusHost = document.getElementById("focus-grid");

  if (workHost) {
    workHost.innerHTML = siteContent.featuredWork
      .map(
        (item) => `
        <article class="card">
          <h3>${item.title}</h3>
          <p>${item.copy}</p>
          <span class="tag">${item.tag}</span>
        </article>
      `
      )
      .join("");
  }

  if (focusHost) {
    focusHost.innerHTML = siteContent.focusAreas
      .map(
        (item) => `
        <article class="focus-item">
          <h3>${item.title}</h3>
          <p>${item.copy}</p>
        </article>
      `
      )
      .join("");
  }
}

function setupRevealAnimations() {
  const sections = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add("show");
          }, index * 90);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  sections.forEach((section) => observer.observe(section));
}

hydrateBasics();
createCards();
setupRevealAnimations();
