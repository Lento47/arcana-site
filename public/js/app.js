// ARCANA — Preact SPA (no # hashes, no deps)
import { h, render } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect, useCallback } from 'https://esm.sh/preact@10.24.3/hooks';

const { createElement: el } = { createElement: h };

// ── Minimal router (History API + Preact state) ──
function useRouter() {
  const [path, setPath] = useState(location.pathname || '/');
  useEffect(() => {
    const onPop = () => setPath(location.pathname);
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);
  const nav = useCallback((url) => {
    history.pushState(null, '', url);
    setPath(url);
    dispatchEvent(new PopStateEvent('popstate'));
  }, []);
  return { path, nav };
}

function scrollTo(id) {
  const t = document.getElementById(id);
  if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function NavLink({ nav, id, children }) {
  const go = (e) => { e.preventDefault(); nav('/'); setTimeout(() => scrollTo(id), 60); };
  return el('a', { href: '/', onClick: go }, children);
}

// ══════════════════════════════════════════
// COMPONENTS
// ══════════════════════════════════════════

function Header({ nav }) {
  return el('header', null,
    el('div', { class: 'wrap nav' },
      el('a', { class: 'brand', href: '/' },
        el('span', { class: 'mark' }, '⛧'), ' ARCANA'
      ),
      el('nav', null,
        el(NavLink, { nav, id: 'models' }, 'Models'),
        el(NavLink, { nav, id: 'system' }, 'System'),
        el(NavLink, { nav, id: 'start' }, 'Start'),
        el(NavLink, { nav, id: 'pricing' }, 'Pricing'),
        el('a', { href: '/changelog' }, 'Changelog'),
        el('a', { class: 'status', href: '/status' }, 'Status'),
        el('a', { href: 'https://github.com/Lento47/arcana' }, 'GitHub'),
      )
    )
  );
}

function Hero() {
  return el('section', { class: 'hero wrap' },
    el('div', { class: 'slash' }, '/'),
    el('h1', null, 'The Terminal Interface For AI Keys'),
    el('p', { class: 'lead' },
      'Chat with ', el('b', null, 'OpenAI, Claude, DeepSeek, OpenRouter, Cerebras, and local models'),
      ' from one terminal. ',
      'Arcana builds a ',
      el('b', null, 'personal knowledge graph'),
      ' from your sessions — wiki-style memory, auto-docs, and linked facts that grow with your work.'
    ),
    el('div', { class: 'actions' },
      el('div', { class: 'cmd' }, el('span', null, '$'), 'npx arcana-ai@latest'),
      el('a', { class: 'btn primary', href: '#', onClick: (e) => { e.preventDefault(); scrollTo('start'); } }, 'Start'),
      el('a', { class: 'btn', href: 'https://github.com/Lento47/arcana' }, 'View source'),
    )
  );
}

function Stats() {
  const items = [
    { n: '174', label: 'Skills' },
    { n: '32', label: 'Providers' },
    { n: '17', label: 'Tools' },
    { n: '4', label: 'Gateways' },
  ];
  return el('div', { class: 'wrap' },
    el('div', { class: 'stats', 'aria-label': 'Arcana product stats' },
      items.map((s) => el('div', { class: 'stat', key: s.label },
        el('strong', null, s.n),
        el('span', null, s.label)
      ))
    )
  );
}

function Models() {
  return el('section', { class: 'wrap', id: 'models' },
    el('div', { class: 'section-head' },
      el('div', null,
        el('div', { class: 'kicker' }, '// Models'),
        el('h2', null, 'One session for any model key.')
      ),
      el('p', null, 'Arcana does not sell a model. It gives your model keys a terminal-native session layer with memory, tools, and scheduled runs.')
    ),
    el('div', { class: 'model-strip' },
      ['openai','anthropic','openrouter','deepseek','cerebras','ollama','local','custom endpoint'].map((p) =>
        el('span', { class: 'pill', key: p }, p)
      )
    )
  );
}

function System() {
  const cards = [
    ['01','Any model key','Add provider keys once. Start sessions against the model that fits the task instead of changing apps.'],
    ['02','Wiki-style memory','Facts, patterns, and mistakes saved as interlinked wiki files. Arcana builds a knowledge graph from your sessions that grows with your work.'],
    ['03','Scoped tools','Run filesystem, shell, git, gateway, and skill tools from explicit profiles. The tool surface is visible.'],
    ['04','Skills on demand','Load specialized instructions only when needed. Keep the base session clean.'],
    ['05','Cron jobs','Schedule recurring prompts, reports, reviews, and checks from the same terminal runtime.'],
    ['06','Chat gateways','Expose sessions through Telegram, Discord, Slack, and WhatsApp when the terminal should not be open.'],
  ];
  return el('section', { class: 'wrap', id: 'system' },
    el('div', { class: 'section-head' },
      el('div', null, el('div', { class: 'kicker' }, '// System'), el('h2', null, 'Everything around the model.')),
      el('p', null, 'OpenRouter sells unified model access. Arcana sits one layer above: the terminal surface where keys, tools, memory, jobs, and gateways meet.')
    ),
    el('div', { class: 'cards' },
      cards.map(([n, h, p]) => el('article', { class: 'card', key: n },
        el('div', { class: 'num' }, n), el('h3', null, h), el('p', null, p)
      ))
    )
  );
}

function Start() {
  const steps = [
    ['1','Install','Run Arcana from npm. Keep it local.','npx arcana-ai@latest'],
    ['2','Activate Pro','Paste the license key from your subscription email.','arcana license activate <key>'],
    ['3','Open a session','Chat, run tools, save memory, or schedule a job.','arcana'],
  ];
  return el('section', { class: 'wrap', id: 'start' },
    el('div', { class: 'section-head' },
      el('div', null, el('div', { class: 'kicker' }, '// Start'), el('h2', null, 'Install. Add key. Run session.')),
      el('p', null, 'No account required for local use. The first run should feel like using a developer tool, not signing up for another workspace.')
    ),
    el('div', { class: 'steps' },
      steps.map(([idx, h, p, code]) => el('article', { class: 'step', key: idx },
        el('div', { class: 'idx' }, idx), el('h3', null, h), el('p', null, p),
        el('code', { class: 'code' }, code)
      ))
    )
  );
}

function Pricing() {
  const plans = [
    { h:'Community', price:'$0', annual:'local use', featured:false,
      items:['one provider key','local sessions','basic memory','local tools','community source'],
      btn: el('a', {class:'btn',href:'https://github.com/Lento47/arcana-community'}, 'Install') },
    { h:'Pro', price:'$19', small:' /mo', annual:'per month', featured:true,
      items:['unlimited provider keys','multi-model rooms','advanced memory search','tool profiles','cost ledger'],
      btn: el(SubscribeBtn, null) },
    { h:'Enterprise', price:'Custom', annual:'per-seat pricing', featured:false,
      items:['encrypted sync','gateway relay','hosted cron relay','cross-machine sessions','team vault','audit log','SLA support'],
      btn: el('a', {class:'btn',href:'mailto:lejzerv@gmail.com?subject=Arcana%20Enterprise'}, 'Contact') },
  ];
  return el('section', { class: 'wrap', id: 'pricing' },
    el('div', { class: 'section-head' },
      el('div', null, el('div',{class:'kicker'},'// Pricing'), el('h2',null,'Free locally. Paid when it becomes a system.')),
      el('p',null,'Model costs stay with your provider. Arcana charges for the terminal interface, session layer, sync, relay, and team surfaces.')
    ),
    el('div', { class: 'pricing' },
      plans.map((p,i) => el('article', {class:'plan'+(p.featured?' featured':''), key:i},
        el('h3',null,p.h),
        el('div',{class:'price'},p.price, p.small && el('small',null,p.small)),
        el('div',{class:'annual'},p.annual),
        el('ul',null, p.items.map((li,j)=>el('li',{key:j},li))),
        p.btn
      ))
    ),
    el('div', { class: 'note mono' },
      'Provider usage is billed separately. Arcana does not need to proxy or resell tokens for local mode. ',
      'Prefer pay-as-you-go? ', el('a',{href:'/credits',style:'color:var(--accent)'},'Buy proxy credits'),
      ' ($1 = 100 credits, min $5) — top up from the web or with ', el('code',null,'arcana proxy buy'), '.'
    )
  );
}

function SubscribeBtn() {
  const [loading, setLoading] = useState(false);
  async function handle(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch('/api/create-sub', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ plan: 'pro_monthly' })
      });
      const d = await r.json();
      if (d.approvalUrl) { window.location.href = d.approvalUrl; return; }
      alert('Failed to create subscription: ' + (d.error || 'unknown'));
    } catch (err) { alert('Network error: ' + err.message); }
    setLoading(false);
  }
  return el('a', { class:'btn primary', href:'#', onClick:handle, style: loading ? 'opacity:.5' : '' },
    loading ? 'Redirecting...' : 'Subscribe →'
  );
}

function Footer() {
  return el('footer', null,
    el('div', { class: 'wrap footer' },
      el('div', null, el('span', { style: 'color:var(--accent)' }, '⛧'), ' ARCANA · Terminal Interface For AI Keys'),
      el('div', { class: 'links' },
        el('a', { href: 'https://github.com/Lento47/arcana' }, 'GitHub'),
        el('a', { href: '/changelog' }, 'Changelog'),
        el('a', { href: '/credits' }, 'Buy Credits'),
        el('a', { href: '/status' }, 'Status'),
        el('a', { href: 'https://otnelhq.com' }, 'OTNEL'),
      )
    )
  );
}

// ══════════════════════════════════════════
// APP
// ══════════════════════════════════════════

function Home() {
  return el('div', null,
    el(Hero),
    el(Stats),
    el(Models),
    el(System),
    el(Start),
    el(Pricing),
  );
}

function App() {
  const { path, nav } = useRouter();
  const isHome = path === '/';
  return el('div', null,
    el(Header, { nav }),
    el('main', null,
      isHome && el(Home),
    ),
    el(Footer),
  );
}

try {
  const root = document.getElementById('root');
  render(el(App), root);
} catch (err) {
  console.error('Arcana SPA render failed:', err);
  // The SSR fallback in #root remains visible, so the page still works.
}
