import { useEffect, useRef, useState } from "react";
import DepthCarousel from "./DepthCarousel";

const basePath = import.meta.env.BASE_URL;
const pagePath = (path = "") => `${basePath}${path.replace(/^\/+/, "")}`;
const assetPath = (path) => pagePath(`assets/${path.replace(/^\/+/, "")}`);

const casePages = (folder, start, end) =>
  Array.from({ length: end - start + 1 }, (_, index) => assetPath(`cases/${folder}/page-${String(start + index).padStart(2, "0")}.jpg`));

const projects = [
  { id: "bzm", no: "01", title: "BZM.", subtitle: "让多元户外场景拥有统一表达", scope: "以“连接户外与生活”为核心，统一多品类、多渠道视觉表达", logoHeight: "150px", deliverables: ["品牌定位", "品牌命名", "品牌口号", "品牌设计", "VI规范", "应用延展", "社媒KV", "活动物料"], cover: assetPath("bzm-featured-cover.png"), cursor: assetPath("bzm-hover-cursor.png"), color: "#315cff", gallery: casePages("bzm", 5, 24) },
  { id: "jsc", no: "02", title: "JSC EXP", subtitle: "打破制造品牌的传统边界", scope: "重构品牌定位与视觉语言，推动企业从代工走向自主品牌", logoHeight: "80px", deliverables: ["品牌定位", "品牌命名", "品牌口号", "品牌升级", "VI规范", "包装设计", "应用延展", "空间展厅"], cover: assetPath("jsc-featured-cover.png"), coverPosition: "center bottom", cursor: assetPath("jsc-hover-cursor.png"), color: "#2ce0aa", gallery: casePages("jsc", 26, 51) },
  { id: "soniq", no: "03", title: "SONIQ", subtitle: "品牌主张的IP化识别", scope: "以功能、态度与识别度，塑造新一代户外服饰品牌", logoHeight: "150px", deliverables: ["品牌定位", "品牌命名", "品牌口号", "品牌设计", "VI规范", "服装图案", "包装设计", "社媒KV"], cover: assetPath("soniq-featured-cover.png"), cursor: assetPath("soniq-hover-cursor.png"), color: "#f7f7f2", gallery: casePages("soniq", 53, 60) },
];

function Arrow({ down = false }) { return <span aria-hidden="true">{down ? "↓" : "↗"}</span>; }
function CtaArrow() { return <img src={assetPath("carousel-next.svg")} alt="" aria-hidden="true" />; }

export function App() {
  const [openProject, setOpenProject] = useState(null);
  const [aboutPageOpen, setAboutPageOpen] = useState(() => window.location.pathname === pagePath("about-me"));
  const [menuOpen, setMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const openingRef = useRef(null);
  const lastScrollRef = useRef(0);
  const project = projects.find((item) => item.id === openProject);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { threshold: 0.12 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [openProject, aboutPageOpen]);

  useEffect(() => {
    let frame = 0;
    const updateOpening = () => {
      const section = openingRef.current;
      if (!section) return;
      const distance = Math.max(section.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / distance));
      section.style.setProperty("--opening-progress", progress.toFixed(3));
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        updateOpening();
        const currentScroll = window.scrollY;
        const scrollDelta = currentScroll - lastScrollRef.current;
        setNavScrolled(currentScroll > 24);
        if (menuOpen || currentScroll <= 160 || scrollDelta < -3) setNavHidden(false);
        else if (scrollDelta > 3) setNavHidden(true);
        lastScrollRef.current = currentScroll;
      });
    };
    updateOpening();
    setNavScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = openProject || aboutPageOpen || menuOpen ? "hidden" : "";
    if (openProject) document.querySelector(".case-scroll")?.scrollTo(0, 0);
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenProject(null);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openProject, aboutPageOpen, menuOpen]);

  useEffect(() => {
    const onPopState = () => setAboutPageOpen(window.location.pathname === pagePath("about-me"));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const openAboutPage = () => {
    window.history.pushState({}, "", pagePath("about-me"));
    setAboutPageOpen(true);
  };

  const closeAboutPage = () => {
    window.history.pushState({}, "", basePath);
    setAboutPageOpen(false);
  };

  const jump = (id) => {
    setMenuOpen(false);
    window.scrollTo({ top: document.getElementById(id)?.offsetTop ?? 0, behavior: "smooth" });
  };

  const moveCursor = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--cursor-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--cursor-y", `${event.clientY - rect.top}px`);
  };

  return <>
    <header className={`nav${navScrolled ? " is-scrolled" : ""}${navHidden ? " is-hidden" : ""}${menuOpen ? " has-open-menu" : ""}`}>
      <button className="wordmark en" onClick={() => jump("home")} aria-label="返回首页">LIU XINYUE®</button>
      <nav className={menuOpen ? "nav-links is-open" : "nav-links"} aria-label="主导航">
        <button className="en" onClick={() => jump("home")}>HOME</button>
        <button className="en" onClick={() => jump("work")}>WORK</button>
        <button className="en" onClick={() => jump("about")}>ABOUT</button>
        <button className="en" onClick={() => jump("talk")}>LET'S TALK</button>
      </nav>
      <button className="menu en" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="打开导航">{menuOpen ? "CLOSE" : "MENU"}</button>
    </header>

    <main>
      <section className="opening" id="home" ref={openingRef}>
        <div className="opening-sticky">
          <div className="opening-title en" aria-label="Portfolio"><span>PORTFOLIO</span></div>
          <div className="opening-meta">
            <p className="en">LIU XINYUE<br />BRAND DESIGNER</p>
            <p>品牌策略 · 视觉识别<br />品牌应用 · 项目推进</p>
            <p>3 年品牌设计经验<br />杭州 · 寻找品牌设计岗位</p>
          </div>
          <button className="opening-scroll en" onClick={() => jump("manifesto")} aria-label="继续浏览">SCROLL <Arrow down /></button>
        </div>
      </section>

      <section className="manifesto light-panel" id="manifesto">
        <p className="manifesto-side" data-reveal>我认为的品牌设计</p>
        <div className="manifesto-main" data-reveal>
          <h1>看懂品牌，<br />找到问题，<br />再把答案做成<span>视觉。</span></h1>
          <div className="manifesto-bottom">
            <p>对我而言，品牌设计不是从风格开始，而是从理解开始。理解产品、用户与业务目标，找到品牌真正需要解决的问题，再通过视觉方向、识别系统与应用规范，把策略转化为可感知、可识别、可落地的品牌资产。</p>
          </div>
        </div>
      </section>

      <section className="work" id="work">
        <div className="section-head" data-reveal>
          <p>我的精选作品</p>
          <div>
            <h2 className="en">SELECTED<br />WORK<span>.</span></h2>
            <p className="work-intro">我从过往项目中筛选出三个代表性案例，分别对应新品牌起盘、传统品牌破界，两类不同的品牌课题。以此呈现我拆解核心问题、锚定策略方向、将视觉落地至真实品牌触点的全链路设计能力。</p>
          </div>
        </div>
        <div className="work-grid">
          <ProjectCard item={projects[0]} className="project-featured" onOpen={setOpenProject} onMove={moveCursor} />
          <ProjectCard item={projects[1]} onOpen={setOpenProject} onMove={moveCursor} />
          <ProjectCard item={projects[2]} onOpen={setOpenProject} onMove={moveCursor} />
        </div>
      </section>

      <OtherWorkDemo />

      <section className="about" id="about">
        <div className="about-title" data-reveal>
          <h2>懂品牌，<br />做落地的<span>设计</span></h2>
          <button className="about-cta cta-button" onClick={openAboutPage}>认识我 <CtaArrow /></button>
        </div>
        <div className="about-copy" data-reveal>
          <p><strong>工业设计背景</strong>，让我习惯从产品与用户出发思考问题；<strong>品牌设计经验</strong>，则让我更关注一套视觉如何回应业务、形成认知，并在不同触点中保持一致。</p>
          <p>我能够参与从前期分析、概念提案、视觉识别到品牌应用的完整流程，也具备项目统筹与团队协作经验。我的优势不是只做某一种风格，而是面对不同的品牌命题，快速找到合适的视觉语言，并把它持续推进到落地。</p>
          <p>目前希望加入一个<strong>重视品牌长期价值、设计判断与落地质量的团队</strong>，在真实业务中，和不同角色一起把品牌想清楚、做完整，也做得更好。</p>
          <div className="about-links">
            <a href={assetPath("刘新月-品牌设计作品集.pdf")} target="_blank" rel="noreferrer">下载 PDF 作品集 <Arrow /></a>
            <a href="mailto:659965306@qq.com">发送邮件 <Arrow /></a>
          </div>
        </div>
      </section>

      <footer id="talk">
        <div className="footer-top"><p className="en">READY FOR THE NEXT CHAPTER.</p><p>品牌策略 · 视觉识别 · 品牌应用</p></div>
        <div className="footer-cta">
          <h2>
            <span className="footer-line footer-line-lead">让我们一起</span>
            <span className="footer-copy">把品牌塑造得更好，<span className="footer-line-accent">让好设计成为增长的一部分。</span></span>
          </h2>
          <a className="footer-contact cta-button" href="mailto:659965306@qq.com" aria-label="发送邮件给刘新月">联系我 <CtaArrow /></a>
        </div>
        <div className="footer-row">
          <span>刘新月 · 品牌设计师</span><a href="tel:13857146121">13857146121（微信同号）</a><span className="en">HANGZHOU, CHINA · © 2026</span>
        </div>
      </footer>
    </main>

    {project && <div className="case-overlay" role="dialog" aria-modal="true" aria-label={`${project.title} 项目详情`}>
      <button className="case-close en" onClick={() => setOpenProject(null)}>CLOSE ×</button>
      <div className="case-scroll">
        <section className="case-opening" style={{ "--case-accent": project.color, "--case-logo-height": project.logoHeight }}>
          <div className="case-opening-top"><span className="en">CASE.{project.no}</span><span className="en">SELECTED WORK / 2026</span></div>
          <div className="case-opening-logo"><img src={project.cursor} alt={`${project.title} Logo`} /></div>
          <div className="case-opening-bottom">
            <div className="case-opening-copy"><h2>{project.subtitle}</h2><p>{project.scope}</p></div>
            <div><small className="en">PROJECT CONTENT</small><ul>{project.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></div>
          </div>
        </section>
        <section className="case-gallery">
          {project.gallery.map((src, index) => <figure className={`case-page${index === 0 ? " case-page-intro" : ""}`} key={src}><img src={src} alt={`${project.title} 案例页面 ${index + 2}`} loading={index < 3 ? "eager" : "lazy"} decoding="async" /></figure>)}
        </section>
        <section className="case-end"><p className="en">END OF CASE.{project.no}</p><button className="en" onClick={() => setOpenProject(null)}>BACK TO WORK ↑</button></section>
      </div>
    </div>}
    {aboutPageOpen && <AboutPage onClose={closeAboutPage} />}
  </>;
}

function OtherWorkDemo() {
  const items = [
    { image: assetPath("01-a2.png"), label: "OTHER WORK 01", alt: "其他作品 01：A2" },
    { image: assetPath("02-xiancha.png"), label: "OTHER WORK 02", alt: "其他作品 02：鲜茶" },
    { image: assetPath("03-mamamiya.png"), label: "OTHER WORK 03", alt: "其他作品 03：Mamamiya" },
    { image: assetPath("04-super-syn.png"), label: "OTHER WORK 04", alt: "其他作品 04：Super Syn" },
    { image: assetPath("05-alusso.png"), label: "OTHER WORK 05", alt: "其他作品 05：Alusso" },
    { image: assetPath("06-vesta.png"), label: "OTHER WORK 06", alt: "其他作品 06：Vesta" },
    { image: assetPath("07-forgood.png"), label: "OTHER WORK 07", alt: "其他作品 07：Forgood" },
    { image: assetPath("08-huaye.png"), label: "OTHER WORK 08", alt: "其他作品 08：Huaye" },
  ];

  return <section className="other-work" aria-labelledby="other-work-title">
    <div className="other-work-head" data-reveal>
      <p>其他作品</p>
      <div><h2 className="en" id="other-work-title">OTHER<br />WORK<span>.</span></h2><p>项目经验横跨消费零售、生活方式、科技硬件与智能制造等领域。我熟悉多元视觉风格与国际设计趋势，更理解品牌定位、用户洞察与业务目标之间的核心逻辑。因此，我的经验能够跨行业迁移，让设计从视觉表达走向系统化的品牌落地。</p></div>
    </div>
    <div className="other-work-stage">
      <DepthCarousel items={items} cardWidth={1000} cardHeight={500} radius={5} depth={105} spread={132} tilt={3} perspective={1900} visibleCards={4} falloff={0.12} blur={3.5} duration={1000} ease="power3.inOut" autoPlay autoPlayDelay={5000} loop showControls showIndicators expandIcon={assetPath("carousel-expand.png")} collapseIcon={assetPath("carousel-collapse.png")} previousIcon={assetPath("carousel-prev.svg")} nextIcon={assetPath("carousel-next.svg")} />
    </div>
  </section>;
}

function AboutPage({ onClose }) {
  return <div className="profile-overlay" role="dialog" aria-modal="true" aria-label="关于刘新月">
    <button className="profile-close en" onClick={onClose}>BACK ×</button>
    <div className="profile-scroll">
      <section className="profile-demo-hero">
        <div className="profile-demo-hi"><span className="en">hi!</span><h1>我是<span>新月</span>：</h1></div>
        <div className="profile-demo-intro">
          <article><h2>策略型视觉创意官</h2><p>毕业于工业设计专业，懂产品、懂视觉、高审美，天马星空的创意+落地可行的全方位思考，擅长一切跟“美+用户”有关的品牌&传播策略设计。</p></article>
          <article><h2>敏捷型项目负责人</h2><p>拥有成熟的项目全流程管控经验，可独立把控设计质量、项目进度与排期，主导完成多个品牌设计项目落地；工作主动负责，应变与执行能力突出，能高效支撑品牌视觉全链路工作。</p></article>
        </div>
        <div className="profile-demo-images profile-marquee" aria-label="工作与学习现场">
          <div className="profile-marquee-track">
            {[0, 1].map((copy) => <div className="profile-marquee-group profile-hero-image-group" key={copy} aria-hidden={copy === 1}><img src={assetPath("about/hero-images-group.png")} alt={copy === 0 ? "工作与学习现场" : ""} /></div>)}
          </div>
        </div>
      </section>

      <section className="profile-demo-section profile-demo-experience">
        <h2 className="profile-demo-section-title">工作经历</h2>
        <div className="profile-demo-section-body">
          <article><div className="profile-demo-job-head"><h3>宁波可点设计有限公司</h3><strong>品牌组长</strong></div><time>2023.06—至今</time><p>· <b>品牌策划&设计：</b>主导品牌项目策略研究与创意设计，深度洞察市场趋势与竞品策略，构建差异化品牌定位与视觉升级思路，负责客户品牌VI体系0-1搭建与落地，把控具体的物料设计执行与交付。<br />· <b>项目经理：</b>负责项目管控，包括项目进度及方向质量把控、客户沟通和提案等。主导项目均按期交付并保持高满意度，成功推动多个品牌与我司达成战略合作。<br />· <b>团队管理：</b>管理5-8人品牌团队，持续优化部门工作流程，使团队平均项目响应效率显著提升。</p></article>
          <article><div className="profile-demo-job-head"><h3>杭州博乐工业设计股份有限公司</h3><strong>设计实习</strong></div><time>2022.07—2023.04</time><p>参与项目团队完成项目全流程工作（调研分析、诊断定位、概念创意、报告撰写、方案提报、落地实施）；参与完成品牌策略方案撰写，在品牌定位、品牌命名、品牌口号等具体工作上提出核心创意。</p></article>
        </div>
      </section>

      <section className="profile-demo-section profile-demo-skills">
        <h2 className="profile-demo-section-title">专业技能</h2>
        <div className="profile-demo-section-body">
          <div className="profile-demo-skill-list"><p>本命工具（日常中最常用的设计工具）　｜ <b>FIGMA</b></p><p>专业设计　｜ <b>PS、AI</b></p><p>动效及剪辑　｜ <b>AE、PR、剪映</b></p><p>建模及渲染　｜ <b>RHINO、KEYSHOT、C4D</b></p><p>AIGC　｜ <b>CODEX、GEMINI、MIDJOURNEY</b></p></div>
          <div className="profile-demo-tools profile-marquee" aria-label="常用设计软件">
            <div className="profile-marquee-track">
              {[0, 1].map((copy) => <div className="profile-marquee-group profile-tool-group" key={copy} aria-hidden={copy === 1}><img src={assetPath("about/tools-group.png")} alt={copy === 0 ? "常用设计软件与 AI 工具" : ""} /></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="profile-demo-section profile-demo-daily">
        <h2 className="profile-demo-section-title">我的日常</h2>
        <div className="profile-demo-section-body"><p className="profile-demo-daily-copy">骑行、徒步、普拉提、扫街，给爱猫铲屎，<br />对很多事情充满好奇与兴趣，爱玩也爱冲。</p></div>
        <div className="profile-demo-daily-images profile-marquee" aria-label="日常生活影像">
          <div className="profile-marquee-track">
            {[0, 1].map((copy) => <div className="profile-marquee-group profile-daily-image-group" key={copy} aria-hidden={copy === 1}>{[["portrait-hike.jpg","徒步"],["bike-sunset.jpg","骑行"],["group-ride.jpg","结伴骑行"],["pilates.jpg","普拉提"],["road-run.jpg","户外运动"]].map(([name, alt]) => <img key={`${copy}-${name}`} src={assetPath(`about/${name}`)} alt={copy === 0 ? alt : ''} />)}</div>)}
          </div>
        </div>
      </section>

      <section className="profile-demo-contact">
        <p className="en">LET'S MAKE SOMETHING CLEAR.</p>
        <h2>联系我<span>。</span></h2>
        <div className="profile-demo-contact-links">
          <a href="tel:13857146121"><small>PHONE</small><strong>138 5714 6121</strong><span>↗</span></a>
          <a href="mailto:659965306@qq.com"><small>EMAIL</small><strong>659965306@qq.com</strong><span>↗</span></a>
        </div>
      </section>
    </div>
  </div>;
}

function ProjectCard({ item, className = "", onOpen, onMove }) {
  return <article className={`project-card ${className}`} data-reveal>
    <button className="project-media" onClick={() => onOpen(item.id)} onPointerMove={onMove} aria-label={`查看 ${item.title} 项目`}>
      <img src={item.cover} alt={`${item.title} 品牌项目封面`} style={item.coverPosition ? { objectPosition: item.coverPosition } : undefined} />
      {item.cursor
        ? <span className="view-pill view-pill-brand"><img src={item.cursor} alt="" /></span>
        : <span className="view-pill en">VIEW <Arrow /></span>}
    </button>
    <div className="project-info">
      <div><span className="en">CASE.{item.no}</span></div>
      <div><p>{item.subtitle}</p><p>{item.scope}</p></div>
    </div>
  </article>;
}
