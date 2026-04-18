(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function n(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(s){if(s.ep)return;s.ep=!0;const r=n(s);fetch(s.href,r)}})();const Se="mc_theme";function U(){const e=localStorage.getItem(Se);return e==="light"||e==="dark"||e==="system"?e:"system"}function X(){const e=U();return e==="light"?"light":e==="dark"?"dark":window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}function Z(e){document.documentElement.setAttribute("data-theme",e);const t=document.querySelector('meta[name="theme-color"]');t&&t.setAttribute("content",e==="light"?"#a0309a":"#3d1040")}function Ge(){Z(X())}function Je(e){const t=e==="light"||e==="dark"||e==="system"?e:"system";localStorage.setItem(Se,t),Z(X())}function Ye(){const e=U(),t=e==="system"?"light":e==="light"?"dark":"system";return Je(t),t}let le=!1;function Ke(){if(le||typeof window>"u"||!window.matchMedia)return;le=!0,window.matchMedia("(prefers-color-scheme: light)").addEventListener("change",()=>{U()==="system"&&Z(X())})}const G='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"',Qe={light:`<svg ${G}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,dark:`<svg ${G}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,system:`<svg ${G}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`};function ce(e,t=!1){const n=U(),i={light:"Thème clair",dark:"Thème sombre",system:"Thème automatique"};e.setAttribute("aria-label",i[n]),e.title=i[n],e.innerHTML=Qe[n],t&&(e.classList.remove("btn-theme--anim"),e.offsetWidth,e.classList.add("btn-theme--anim"))}const Xe="modulepreload",Ze=function(e){return"/miss-contraction/"+e},de={},ke=function(t,n,i){let s=Promise.resolve();if(n&&n.length>0){let m=function(d){return Promise.all(d.map(u=>Promise.resolve(u).then(p=>({status:"fulfilled",value:p}),p=>({status:"rejected",reason:p}))))};var a=m;document.getElementsByTagName("link");const l=document.querySelector("meta[property=csp-nonce]"),c=l?.nonce||l?.getAttribute("nonce");s=m(n.map(d=>{if(d=Ze(d),d in de)return;de[d]=!0;const u=d.endsWith(".css"),p=u?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${p}`))return;const h=document.createElement("link");if(h.rel=u?"stylesheet":Xe,u||(h.as="script"),h.crossOrigin="",h.href=d,c&&h.setAttribute("nonce",c),document.head.appendChild(h),u)return new Promise((b,f)=>{h.addEventListener("load",b),h.addEventListener("error",()=>f(new Error(`Unable to preload CSS for ${d}`)))})}))}function r(l){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=l,window.dispatchEvent(c),!c.defaultPrevented)throw l}return s.then(l=>{for(const c of l||[])c.status==="rejected"&&r(c.reason);return t().catch(r)})};function et(e={}){const{immediate:t=!1,onNeedRefresh:n,onOfflineReady:i,onRegistered:s,onRegisteredSW:r,onRegisterError:a}=e;let l,c,m;const d=async(p=!0)=>{await c,m?.()};async function u(){if("serviceWorker"in navigator){if(l=await ke(async()=>{const{Workbox:p}=await import("./pwa-BIl4cyR9.js");return{Workbox:p}},[]).then(({Workbox:p})=>new p("/miss-contraction/sw.js",{scope:"/miss-contraction/",type:"classic"})).catch(p=>{a?.(p)}),!l)return;m=()=>{l?.messageSkipWaiting()};{let p=!1;const h=()=>{p=!0,l?.addEventListener("controlling",b=>{b.isUpdate&&window.location.reload()}),n?.()};l.addEventListener("installed",b=>{typeof b.isUpdate>"u"?typeof b.isExternal<"u"&&b.isExternal?h():!p&&i?.():b.isUpdate||i?.()}),l.addEventListener("waiting",h)}l.register({immediate:t}).then(p=>{r?r("/miss-contraction/sw.js",p):s?.(p)}).catch(p=>{a?.(p)})}}return c=u(),d}const ue="sw-update-banner";let Me;function tt(){if(document.getElementById(ue))return;const e=document.createElement("div");e.id=ue,e.className="sw-update-banner",e.setAttribute("role","status"),e.innerHTML=`
    <p class="sw-update-banner__text">Une nouvelle version de l'application est disponible.</p>
    <button type="button" class="sw-update-banner__btn">Mettre à jour</button>
  `,document.body.appendChild(e),e.querySelector(".sw-update-banner__btn")?.addEventListener("click",()=>{Me?.(!0)})}function nt(){Me=et({onNeedRefresh(){tt()},onOfflineReady(){}})}const qe="mc_contractions_v1",xe="mc_settings_v1",ee="mc_snooze_until",Ce="mc_export_nudge_dismissed_at",S={maxIntervalMin:5,minDurationSec:45,consecutiveCount:3,notificationsEnabled:!1,statsWindowMinutes:"all",preAlertEnabled:!0,openContractionReminderMin:4,maternityLabel:"",maternityPhone:"",maternityAddress:"",largeMode:!1,keepAwakeDuringContraction:!0,vibrationEnabled:!0,voiceCommandsEnabled:!1,moduleVoiceCommands:!0,moduleMaternityMessage:!0};function it(){try{const e=localStorage.getItem(qe);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(ct):[]}catch{return[]}}function I(e){localStorage.setItem(qe,JSON.stringify(e))}function st(e){return e==="30"||e==="60"||e==="120"||e==="all"?e:S.statsWindowMinutes}function at(){try{const e=localStorage.getItem(xe);if(!e)return{...S};const t=JSON.parse(e);return{maxIntervalMin:B(t.maxIntervalMin,1,30,S.maxIntervalMin),minDurationSec:B(t.minDurationSec,10,180,S.minDurationSec),consecutiveCount:B(t.consecutiveCount,2,12,S.consecutiveCount),notificationsEnabled:!!t.notificationsEnabled,statsWindowMinutes:st(t.statsWindowMinutes),preAlertEnabled:typeof t.preAlertEnabled=="boolean"?t.preAlertEnabled:S.preAlertEnabled,openContractionReminderMin:B(t.openContractionReminderMin,2,30,S.openContractionReminderMin),maternityLabel:typeof t.maternityLabel=="string"?lt(t.maternityLabel):"",maternityPhone:typeof t.maternityPhone=="string"?rt(t.maternityPhone):"",maternityAddress:typeof t.maternityAddress=="string"?ot(t.maternityAddress):"",largeMode:typeof t.largeMode=="boolean"?t.largeMode:S.largeMode,keepAwakeDuringContraction:typeof t.keepAwakeDuringContraction=="boolean"?t.keepAwakeDuringContraction:S.keepAwakeDuringContraction,vibrationEnabled:typeof t.vibrationEnabled=="boolean"?t.vibrationEnabled:S.vibrationEnabled,voiceCommandsEnabled:typeof t.voiceCommandsEnabled=="boolean"?t.voiceCommandsEnabled:S.voiceCommandsEnabled,moduleVoiceCommands:typeof t.moduleVoiceCommands=="boolean"?t.moduleVoiceCommands:S.moduleVoiceCommands,moduleMaternityMessage:typeof t.moduleMaternityMessage=="boolean"?t.moduleMaternityMessage:S.moduleMaternityMessage}}catch{return{...S}}}function pe(e){localStorage.setItem(xe,JSON.stringify(e))}function rt(e){return e.replace(/[^\d+]/g,"").slice(0,20)}function ot(e){return e.replace(/\r\n/g,`
`).trim().slice(0,800)}function lt(e){return e.replace(/\s+/g," ").trim().slice(0,120)}function ct(e){if(typeof e!="object"||e===null)return!1;const t=e;return!(typeof t.id!="string"||typeof t.start!="number"||typeof t.end!="number"||t.end<t.start||t.note!==void 0&&typeof t.note!="string"||t.intensity!==void 0&&(typeof t.intensity!="number"||t.intensity<1||t.intensity>5))}function B(e,t,n,i){const s=typeof e=="number"&&Number.isFinite(e)?e:i;return Math.min(n,Math.max(t,s))}function Ee(){try{const e=Number(localStorage.getItem(ee));return Number.isFinite(e)?e:0}catch{return 0}}function me(e){localStorage.setItem(ee,String(e))}function dt(){localStorage.removeItem(ee)}function Le(e,t,n){if(t==="all"||e.length===0)return e;const s=n-(t==="30"?30:t==="60"?60:120)*60*1e3;return e.filter(r=>r.start>=s)}function ut(e,t){if(e.length<2)return[];const n=[];for(let i=1;i<e.length;i++)n.push(e[i].start-e[i-1].start);return n.slice(-14)}function te(e,t){const n=e.filter(d=>d.end>d.start);if(n.length===0)return"empty";const i=t.consecutiveCount;if(n.length<i){if(n.length>=2){const d=n[n.length-2];if((n[n.length-1].start-d.start)/6e4<=t.maxIntervalMin*1.2)return"approaching"}return"calm"}const s=n.slice(-i),r=s.slice(1).every((d,u)=>{const p=s[u];return(d.start-p.start)/6e4<=t.maxIntervalMin}),a=s.every(d=>(d.end-d.start)/1e3>=t.minDurationSec);if(r&&a)return"match";const l=n[n.length-1],c=n[n.length-2];return(l.start-c.start)/6e4<=t.maxIntervalMin*1.2?"approaching":"calm"}function Ae(e,t){const n=[...e].filter(s=>s.end>s.start).sort((s,r)=>s.start-r.start),i=t.consecutiveCount;if(n.length<i)return null;for(let s=i-1;s<n.length;s++){const r=n.slice(s-i+1,s+1),a=r.slice(1).every((c,m)=>{const d=r[m];return(c.start-d.start)/6e4<=t.maxIntervalMin}),l=r.every(c=>(c.end-c.start)/1e3>=t.minDurationSec);if(a&&l)return r[i-1].end}return null}const $e={home:{documentTitle:"Miss Contraction",breadcrumb:"Accueil"},settings:{documentTitle:"Paramètres — Miss Contraction",breadcrumb:"Paramètres"},message:{documentTitle:"Message maternité — Miss Contraction",breadcrumb:"Message maternité"},table:{documentTitle:"Tableau des contractions — Miss Contraction",breadcrumb:"Tableau des contractions"},maternity:{documentTitle:"Maternité — Miss Contraction",breadcrumb:"Maternité"},midwife:{documentTitle:"Résumé sage-femme — Miss Contraction",breadcrumb:"Résumé sage-femme"}};function pt(e){return $e[e].documentTitle}function he(e){return $e[e].breadcrumb}function mt(){const e=window.location.hash.replace(/^#/,"")||"/",t=e.startsWith("/")?e:`/${e}`;return t==="/parametres"||t==="/settings"?"settings":t==="/message"||t==="/messages"||t==="/sms"?"message":t==="/historique"||t==="/tableau"||t==="/table"?"table":t==="/maternite"||t==="/maternity"?"maternity":t==="/sage-femme"||t==="/resume"||t==="/midwife"?"midwife":"home"}function ht(e){const t=()=>e();return window.addEventListener("hashchange",t),()=>window.removeEventListener("hashchange",t)}function bt(){const e=document.getElementById("main-content")??document.querySelector('.app, main, [role="main"]');e&&(e.hasAttribute("tabindex")||e.setAttribute("tabindex","-1"),e.focus({preventScroll:!0}))}function ft(){const e="/miss-contraction/icons/icon-192.png";return`
    <a class="skip-to-content" href="#main-content">Aller au contenu principal</a>
    <div class="nav-backdrop" id="nav-backdrop" aria-hidden="true"></div>
    <nav class="app-drawer" id="app-drawer" aria-label="Menu principal" aria-hidden="true">
      <div class="drawer-header">
        <div class="drawer-header-brand">
          <img class="drawer-header-logo" src="${e}" width="40" height="40" alt="" decoding="async" />
          <span class="drawer-header-title">Menu</span>
        </div>
        <button type="button" class="drawer-close" id="btn-drawer-close" aria-label="Fermer le menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="drawer-scroll">
        <p class="drawer-section-label" id="drawer-lbl-suivi">Suivi des contractions</p>
        <ul class="drawer-nav" aria-labelledby="drawer-lbl-suivi">
          <li>
            <a class="drawer-link" data-drawer-route="home" href="#/">
              <span class="drawer-link-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </span>
              <span class="drawer-link-label">Accueil</span>
              <span class="drawer-link-arrow" aria-hidden="true">›</span>
            </a>
          </li>
          <li>
            <a class="drawer-link" data-drawer-route="table" href="#/historique">
              <span class="drawer-link-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
              </span>
              <span class="drawer-link-label">Tableau des contractions</span>
              <span class="drawer-link-arrow" aria-hidden="true">›</span>
            </a>
          </li>
          <li>
            <a class="drawer-link" data-drawer-route="midwife" href="#/sage-femme">
              <span class="drawer-link-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
              </span>
              <span class="drawer-link-label">Résumé sage-femme</span>
              <span class="drawer-link-arrow" aria-hidden="true">›</span>
            </a>
          </li>
        </ul>
        <p class="drawer-section-label" id="drawer-lbl-mat">Maternité</p>
        <ul class="drawer-nav" aria-labelledby="drawer-lbl-mat">
          <li>
            <a class="drawer-link" data-drawer-route="maternity" href="#/maternite">
              <span class="drawer-link-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </span>
              <span class="drawer-link-label">Appeler la maternité</span>
              <span class="drawer-link-arrow" aria-hidden="true">›</span>
            </a>
          </li>
          <li id="drawer-item-message">
            <a class="drawer-link" data-drawer-route="message" href="#/message">
              <span class="drawer-link-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </span>
              <span class="drawer-link-label">Message à la maternité</span>
              <span class="drawer-link-arrow" aria-hidden="true">›</span>
            </a>
          </li>
        </ul>
        <p class="drawer-section-label" id="drawer-lbl-app">Application</p>
        <ul class="drawer-nav" aria-labelledby="drawer-lbl-app">
          <li>
            <a class="drawer-link" data-drawer-route="settings" href="#/parametres">
              <span class="drawer-link-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              </span>
              <span class="drawer-link-label">Paramètres et alerte</span>
              <span class="drawer-link-arrow" aria-hidden="true">›</span>
            </a>
          </li>
        </ul>
      </div>
    </nav>

    <main class="app" id="main-content" tabindex="-1">
      <header class="top-bar">
        <div class="top-bar-brand">
          <h1 class="top-bar-h1">
            <span class="top-bar-app-line">
              <img
                class="top-bar-logo"
                src="${e}"
                width="48"
                height="48"
                alt=""
                decoding="async"
              />
              <span class="top-bar-app-name">Miss Contraction</span>
            </span>
          </h1>
          <nav class="top-bar-bc" id="top-bar-bc-nav" aria-label="Fil d'Ariane"></nav>
        </div>
        <button
          type="button"
          class="btn-theme"
          id="btn-theme"
          aria-label="Thème automatique"
          title="Thème automatique"
        >🖥</button>
        <button
          type="button"
          class="hamburger"
          id="btn-menu"
          aria-expanded="false"
          aria-controls="app-drawer"
          aria-label="Ouvrir le menu"
        >
          <span class="hamburger-box" aria-hidden="true">
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </span>
        </button>
      </header>

      <div class="maternity-quick" id="maternity-quick" hidden>
        <a class="maternity-quick__link" id="maternity-quick-link" href="tel:">
          <span class="maternity-quick__icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0f1 22 16.92z"/></svg>
          </span>
          <span class="maternity-quick__body">
            <span class="maternity-quick__title" id="maternity-quick-title">Appeler la maternité</span>
            <span class="maternity-quick__tel" id="maternity-quick-tel"></span>
          </span>
        </a>
      </div>

      <div id="view-home" class="view">
        <p class="subtitle home-intro">
          Suivez la fréquence des contractions et recevez une alerte selon les seuils définis dans les paramètres
          (à valider avec votre sage-femme).
        </p>

        <div class="app-banners" id="app-banners">
          <div class="app-banner app-banner--warn" id="banner-long-open" hidden>
            <p class="app-banner-text" id="banner-long-open-text"></p>
            <button type="button" class="btn btn-ghost btn-small" id="btn-dismiss-long-open">OK</button>
          </div>
          <div class="app-banner app-banner--info banner-undo" id="banner-undo" hidden>
            <div class="banner-undo-top">
              <span class="app-banner-text">Enregistré !</span>
              <div class="banner-undo-intensity" id="undo-intensity-area">
                <span class="banner-undo-intensity-label">Intensité :</span>
                <div class="intensity-picker intensity-picker--mini">
                  <button type="button" class="btn-intensity" data-intensity="1" aria-label="Très faible">1</button>
                  <button type="button" class="btn-intensity" data-intensity="2" aria-label="Faible">2</button>
                  <button type="button" class="btn-intensity" data-intensity="3" aria-label="Moyenne">3</button>
                  <button type="button" class="btn-intensity" data-intensity="4" aria-label="Forte">4</button>
                  <button type="button" class="btn-intensity" data-intensity="5" aria-label="Très forte">5</button>
                </div>
              </div>
              <button type="button" class="btn btn-ghost btn-small" id="btn-undo-add">Annuler</button>
            </div>
          </div>
          <div class="app-banner app-banner--accent" id="banner-pre-alert" hidden>
            <p class="app-banner-text" id="banner-pre-alert-text"></p>
            <button type="button" class="btn btn-ghost btn-small" id="btn-dismiss-pre">Fermer</button>
          </div>
          <div class="app-banner app-banner--muted" id="banner-export-nudge" hidden>
            <span class="app-banner-text">Pensez à exporter une sauvegarde (Partager / Exporter) avant un changement de téléphone.</span>
            <button type="button" class="btn btn-ghost btn-small" id="btn-dismiss-export-nudge">Plus tard</button>
          </div>
        </div>

        <section class="card panel panel-cta" aria-labelledby="action-heading">
          <h2 id="action-heading" class="cta-heading">Enregistrer une contraction</h2>
          <p class="cta-hint">
            Touchez le gros bouton au <strong>début</strong> d'une contraction, puis à nouveau à la <strong>fin</strong>.
          </p>
          <div class="timer" id="timer-block" hidden>
            <p class="timer-label">Contraction en cours</p>
            <div class="timer-circle-container">
              <svg class="timer-circle" viewBox="0 0 200 200" aria-hidden="true">
                <circle class="timer-circle-bg" cx="100" cy="100" r="90"/>
                <circle class="timer-circle-progress" id="timer-circle-progress" cx="100" cy="100" r="90"/>
              </svg>
              <div class="timer-pulse"></div>
              <p class="timer-value" id="timer-value">0:00</p>
            </div>
          </div>
          <div class="actions actions-cta">
            <button type="button" class="btn btn-primary btn-cta btn-cta-enhanced" id="btn-toggle" aria-live="polite">
              Début de contraction
            </button>
          </div>
          <div class="cta-extras">
            <button type="button" class="btn btn-secondary btn-small" id="btn-voice" hidden>
              Commande vocale (début / fin)
            </button>
          </div>
          <p class="hint" id="status-hint"></p>
        </section>

        <section class="card" aria-labelledby="summary-heading">
          <h2 id="summary-heading" class="section-title">Indicateurs récents</h2>
          <div class="stats-enhanced" role="group" aria-label="Synthèse des contractions">
            <div class="stat-card">
              <span class="stat-card-value" id="stat-qty-hour" aria-live="polite">—</span>
              <span class="stat-card-label">Quantité / h</span>
            </div>
            <div class="stat-card">
              <span class="stat-card-value" id="stat-avg-duration" aria-live="polite">—</span>
              <span class="stat-card-label">Durée moyenne</span>
            </div>
            <div class="stat-card">
              <span class="stat-card-value" id="stat-avg-frequency" aria-live="polite">—</span>
              <span class="stat-card-label">Fréquence moyenne</span>
            </div>
          </div>
          <p class="stats-window-label" id="stats-window-label"></p>
          <p class="threshold-badge threshold-badge-enhanced" id="threshold-badge" data-state="empty"></p>
          <dl class="summary summary-extra" id="summary-extra"></dl>
          <div class="chart-block" id="chart-block" hidden>
            <h3 class="chart-title">Intervalles entre débuts (derniers enregistrements)</h3>
            <div class="chart-bars chart-enhanced" id="chart-bars" role="img" aria-label="Barres proportionnelles aux intervalles"></div>
          </div>
        </section>

        <section class="card" aria-labelledby="history-heading">
          <div class="section-head">
            <h2 id="history-heading" class="section-title">Historique</h2>
            <div class="section-actions" role="group" aria-label="Partage et historique">
              <button type="button" class="btn btn-ghost btn-small" id="btn-share" disabled>
                Partager
              </button>
              <button type="button" class="btn btn-ghost btn-small" id="btn-export" disabled>
                Exporter
              </button>
              <button type="button" class="btn btn-ghost btn-small" id="btn-clear-history">
                Effacer l'historique
              </button>
            </div>
          </div>
          <p class="share-export-feedback" id="share-export-feedback" hidden></p>
          <ul class="timeline" id="history-list" role="list"></ul>
          <p class="empty" id="history-empty">Aucune contraction enregistrée pour le moment.</p>
        </section>

        <footer class="footer">
          <p>Cet outil ne remplace pas un avis médical. Appelez la maternité ou le 15 en cas de doute.</p>
          <p>
            <a class="footer-link" href="https://github.com/mister-guiiug/miss-contraction" target="_blank" rel="noopener noreferrer">Code source sur GitHub</a>
            &nbsp;·&nbsp;
            <a class="footer-link" href="https://buymeacoffee.com/mister.guiiug" target="_blank" rel="noopener noreferrer">☕ Buy me a coffee</a>
          </p>
        </footer>
      </div>

      <div id="view-settings" class="view" hidden>
        <div class="settings-page">
          <p class="subtitle settings-page-lead">
            Ajustez l'alerte, le numéro de la maternité et l'affichage. <strong class="settings-page-hint">Pensez à
            enregistrer</strong> pour appliquer les changements.
          </p>

          <nav class="settings-toc" aria-label="Aller à une section">
            <ul class="settings-toc-list">
              <li><a class="settings-toc-link" href="#settings-section-alertes">Alertes</a></li>
              <li><a class="settings-toc-link" href="#settings-section-maternite">Maternité</a></li>
              <li><a class="settings-toc-link" href="#settings-section-stats">Statistiques</a></li>
              <li><a class="settings-toc-link" href="#settings-section-confort">Confort</a></li>
              <li><a class="settings-toc-link" href="#settings-section-modules">Options du menu</a></li>
            </ul>
          </nav>

          <form class="form settings-form" id="form-settings">
            <section
              class="card settings-card"
              id="settings-section-alertes"
              aria-labelledby="settings-heading"
            >
              <h2 id="settings-heading" class="section-title">Alertes</h2>
              <p class="settings-intro">
                L'alerte se déclenche lorsque les <strong id="lbl-n">3</strong> dernières contractions sont espacées
                d'au plus <strong id="lbl-interval">5</strong> minutes et durent chacune au moins
                <strong id="lbl-dur">45</strong> secondes — à valider avec votre sage-femme.
              </p>
              <h3 class="settings-subheading">Seuil</h3>
              <div class="settings-field-grid">
                <label class="field">
                  <span>Écart max. entre débuts (min)</span>
                  <input type="number" name="maxIntervalMin" min="1" max="30" step="1" required />
                </label>
                <label class="field">
                  <span>Durée min. par contraction (s)</span>
                  <input type="number" name="minDurationSec" min="10" max="180" step="5" required />
                </label>
                <label class="field">
                  <span>Contractions consécutives</span>
                  <input type="number" name="consecutiveCount" min="2" max="12" step="1" required />
                </label>
              </div>
              <div class="settings-subsection">
                <h3 class="settings-subheading">Notifications</h3>
                <label class="field field-check">
                  <input type="checkbox" name="preAlertEnabled" id="pre-alert-check" />
                  <span>Pré-alerte si le rythme se resserre (avant le seuil complet)</span>
                </label>
                <div class="field row settings-notify-row">
                  <button type="button" class="btn btn-secondary" id="btn-notify">
                    Autoriser les notifications
                  </button>
                  <span class="notify-status" id="notify-status"></span>
                </div>
                <div class="field snooze-block">
                  <span class="snooze-label">Reporter les alertes</span>
                  <div class="snooze-actions">
                    <button type="button" class="btn btn-secondary btn-small" id="btn-snooze-30" formnovalidate>
                      30 min
                    </button>
                    <button type="button" class="btn btn-secondary btn-small" id="btn-snooze-60" formnovalidate>
                      1 h
                    </button>
                    <button type="button" class="btn btn-ghost btn-small" id="btn-snooze-clear" formnovalidate>
                      Annuler le report
                    </button>
                  </div>
                  <p class="snooze-status" id="snooze-status"></p>
                </div>
              </div>
            </section>

            <section
              class="card settings-card"
              id="settings-section-maternite"
              aria-labelledby="maternity-settings-heading"
            >
              <h2 id="maternity-settings-heading" class="section-title">Maternité</h2>
              <p class="settings-intro settings-intro--tight">
                Utilisés sur la page dédiée « Maternité » et sur le bandeau d'appel rapide en bas de l'écran lorsque le
                numéro est renseigné.
              </p>
              <label class="field field--wide">
                <span>Libellé de la maternité</span>
                <input
                  type="text"
                  name="maternityLabel"
                  maxlength="120"
                  autocomplete="organization"
                  placeholder="ex. Maternité — CHU de Nantes"
                />
              </label>
              <label class="field field--wide">
                <span>Numéro de téléphone</span>
                <input
                  type="tel"
                  name="maternityPhone"
                  inputmode="tel"
                  autocomplete="tel"
                  placeholder="ex. 0123456789"
                  maxlength="20"
                />
              </label>
              <label class="field field--wide">
                <span>Adresse de la maternité</span>
                <textarea
                  name="maternityAddress"
                  id="maternity-address-field"
                  class="settings-textarea"
                  rows="3"
                  maxlength="800"
                  placeholder="Adresse, accès parking, service…"
                  autocomplete="street-address"
                ></textarea>
              </label>
            </section>

            <section class="card settings-card" id="settings-section-stats" aria-labelledby="stats-heading">
              <h2 id="stats-heading" class="section-title">Statistiques et affichage</h2>
              <label class="field field--wide">
                <span>Fenêtre pour moyennes et graphique (accueil)</span>
                <select name="statsWindowMinutes" id="stats-window-select">
                  <option value="all">Toutes les données</option>
                  <option value="30">30 dernières minutes</option>
                  <option value="60">1 dernière heure</option>
                  <option value="120">2 dernières heures</option>
                </select>
              </label>
              <label class="field field-check field-check--spaced">
                <input type="checkbox" name="largeMode" id="large-mode-check" />
                <span>Mode grandes tailles (texte et boutons plus lisibles)</span>
              </label>
            </section>

            <section class="card settings-card" id="settings-section-confort" aria-labelledby="comfort-heading">
              <h2 id="comfort-heading" class="section-title">Confort et saisie</h2>
              <label class="field">
                <span>Rappel si « fin » non pressée après (minutes)</span>
                <input type="number" name="openContractionReminderMin" min="2" max="30" step="1" required />
              </label>
              <label class="field field-check">
                <input type="checkbox" name="keepAwakeDuringContraction" id="keep-awake-check" />
                <span>Garder l'écran allumé pendant une contraction en cours</span>
              </label>
              <label class="field field-check">
                <input type="checkbox" name="vibrationEnabled" id="vibration-check" />
                <span>Vibration courte au début et à la fin (mobile)</span>
              </label>
              <label class="field field-check" id="voice-option-field">
                <input type="checkbox" name="voiceCommandsEnabled" id="voice-check" />
                <span>Afficher le bouton de commande vocale sur l'accueil (expérimental)</span>
              </label>
            </section>

            <section class="card settings-card" id="settings-section-modules" aria-labelledby="features-heading">
              <h2 id="features-heading" class="section-title">Options du menu</h2>
              <p class="settings-intro settings-intro--tight">
                Masquez ce que vous n'utilisez pas : les entrées disparaissent du menu latéral.
              </p>
              <label class="field field-check">
                <input type="checkbox" name="moduleVoiceCommands" id="module-voice-check" />
                <span>Module commande vocale (réglages dans « Confort et saisie »)</span>
              </label>
              <label class="field field-check">
                <input type="checkbox" name="moduleMaternityMessage" id="module-message-check" />
                <span>Message à la maternité / proches (SMS, WhatsApp)</span>
              </label>
            </section>
          </form>

          <p class="settings-save-feedback" id="settings-save-feedback" role="status" aria-live="polite" hidden></p>

          <div class="settings-sticky-actions" aria-label="Enregistrer ou quitter">
            <div class="settings-sticky-row">
              <button type="submit" class="btn btn-primary settings-save-btn" form="form-settings">
                Enregistrer
              </button>
              <a href="#/" class="settings-back-inline">Accueil</a>
            </div>
          </div>
        </div>
      </div>

      <div id="view-maternity" class="view" hidden>
        <p class="subtitle maternity-page-lead">
          Libellé, numéro et adresse sont modifiables dans les paramètres. Appel et itinéraire en un geste.
        </p>
        <section class="card card--maternity-call" aria-labelledby="maternity-call-heading">
          <h2 id="maternity-call-heading" class="section-title">Contacter la maternité</h2>
          <p class="maternity-page-venue" id="maternity-page-venue" hidden></p>
          <div class="maternity-page-phone-block">
            <div class="maternity-page-phone-head">
              <p class="maternity-page-subheading">Numéro</p>
              <span class="maternity-page-readonly-badge">Lecture seule</span>
            </div>
            <p class="maternity-page-phone-line" id="maternity-page-phone-line" hidden></p>
            <p class="maternity-page-phone-placeholder" id="maternity-page-phone-placeholder">
              Aucun numéro enregistré. Indiquez-le dans les
              <a href="#/parametres">paramètres</a>.
            </p>
            <div class="maternity-page-dial-wrap">
              <a class="maternity-page-dial" id="maternity-page-dial-link" href="#/parametres">
                <span class="maternity-page-dial-ring" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </span>
                <span class="maternity-page-dial-label" id="maternity-page-dial-label">Renseigner le numéro</span>
              </a>
            </div>
            <p class="maternity-page-hint" id="maternity-page-hint"></p>
          </div>
          <div class="maternity-page-address-block" id="maternity-page-address-block">
            <div class="maternity-page-address-head">
              <p class="maternity-page-address-heading">Adresse</p>
              <span class="maternity-page-readonly-badge">Lecture seule</span>
            </div>
            <p class="maternity-page-address" id="maternity-page-address" hidden></p>
            <p class="maternity-page-address-placeholder" id="maternity-page-address-placeholder">
              Aucune adresse enregistrée. Indiquez-la dans les
              <a href="#/parametres">paramètres</a>.
            </p>
          </div>
          <div class="maternity-page-maps" id="maternity-page-maps-wrap" hidden>
            <a
              class="btn btn-secondary maternity-page-maps-btn"
              id="maternity-page-maps-link"
              target="_blank"
              rel="noopener noreferrer"
              href="#"
            >
              <span class="maternity-page-maps-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </span>
              <span>Itinéraire dans Maps</span>
            </a>
            <p class="maternity-page-maps-hint">
              Ouvre Google Maps dans un nouvel onglet pour un itinéraire vers l'adresse ci-dessus (position actuelle →
              destination).
            </p>
          </div>
        </section>
        <p class="settings-back-wrap maternity-page-actions">
          <a href="#/parametres" class="btn btn-secondary settings-back-link">Paramètres</a>
          <a href="#/" class="btn btn-ghost settings-back-link">Accueil</a>
        </p>
      </div>

      <div id="view-message" class="view" hidden>
        <p class="subtitle message-page-lead">
          Modèle de SMS ou WhatsApp pour prévenir vos proches que vous partez à la maternité. Adaptez le texte,
          puis copiez-le ou ouvrez directement une application.
        </p>
        <section class="card" aria-labelledby="message-heading">
          <h2 id="message-heading" class="section-title">Votre message</h2>
          <label class="field">
            <span>Personnalisez le texte avant envoi</span>
            <textarea
              id="msg-template"
              class="msg-textarea"
              rows="10"
              spellcheck="true"
              autocomplete="off"
              aria-describedby="msg-hint-block"
            ></textarea>
          </label>
          <p class="msg-feedback" id="msg-feedback" role="status" aria-live="polite"></p>
          <div class="msg-actions" role="group" aria-label="Envoyer ou copier le message">
            <button type="button" class="btn btn-secondary" id="btn-msg-reset">
              Réinitialiser le modèle
            </button>
            <button type="button" class="btn btn-secondary" id="btn-msg-copy">Copier</button>
            <button type="button" class="btn btn-primary" id="btn-msg-whatsapp">
              Ouvrir WhatsApp
            </button>
            <button type="button" class="btn btn-secondary" id="btn-msg-sms">Ouvrir SMS</button>
          </div>
          <p class="msg-hint" id="msg-hint-block">
            WhatsApp et SMS ouvrent l'application par défaut sur téléphone ; sur ordinateur, WhatsApp Web peut
            s'ouvrir dans un nouvel onglet. Si le lien SMS échoue (message très long), utilisez « Copier ».
            Vous pouvez aussi coller le texte dans Signal, e-mail, etc.
          </p>
        </section>
        <p class="settings-back-wrap">
          <a href="#/" class="btn btn-secondary settings-back-link">Retour à l'accueil</a>
        </p>
      </div>

      <div id="view-table" class="view" hidden>
        <p class="subtitle table-page-lead">
          Historique détaillé : pour chaque contraction, la <strong>durée</strong>, l'<strong>intervalle</strong> depuis le
          début de la précédente, et la <strong>fréquence</strong> estimée (contractions par heure) dérivée de cet intervalle.
        </p>
        <section class="card" aria-labelledby="table-heading">
          <h2 id="table-heading" class="section-title">Contractions (ordre chronologique)</h2>
          <div
            class="history-table-wrap"
            role="region"
            aria-label="Tableau défilant sur petit écran"
            tabindex="0"
            hidden
          >
            <table class="history-table">
              <thead>
                <tr>
                  <th scope="col">N°</th>
                  <th scope="col">Début</th>
                  <th scope="col">Durée</th>
                  <th scope="col">Intervalle</th>
                  <th scope="col">Fréquence</th>
                  <th scope="col">Note</th>
                </tr>
              </thead>
              <tbody id="history-table-body"></tbody>
            </table>
          </div>
          <p class="empty" id="history-table-empty">Aucune contraction à afficher.</p>
          <p class="table-footnote">
            <strong>Intervalle</strong> : écart entre le début de cette contraction et celui de la ligne précédente.
            <strong>Fréquence</strong> : ≈ nombre de contractions par heure si le rythme restait identique à cet intervalle.
          </p>
        </section>
        <p class="settings-back-wrap">
          <a href="#/" class="btn btn-secondary settings-back-link">Retour à l'accueil</a>
        </p>
      </div>

      <div id="view-midwife" class="view" hidden>
        <p class="subtitle midwife-page-lead no-print">
          Synthèse courte des <strong>dernières contractions</strong>, des <strong>moyennes</strong> sur la période choisie et,
          si elle a eu lieu, l'<strong>heure à laquelle les seuils d'alerte ont été atteints pour la première fois</strong>
          dans tout l'historique. À imprimer ou enregistrer en PDF depuis le navigateur.
        </p>
        <section class="card midwife-card">
          <h2 class="section-title no-print">Contenu du résumé</h2>
          <label class="field field--wide midwife-field no-print">
            <span>Contractions listées (ordre chronologique)</span>
            <select id="midwife-count-select" class="midwife-select" aria-describedby="midwife-count-hint">
              <option value="6">6 dernières</option>
              <option value="10">10 dernières</option>
              <option value="12" selected>12 dernières</option>
              <option value="20">20 dernières</option>
              <option value="all">Tout l'historique</option>
            </select>
          </label>
          <p class="midwife-hint no-print" id="midwife-count-hint">
            Les moyennes (durée, intervalle, quantité / h) sont calculées <strong>uniquement</strong> sur cette sélection.
            Le « premier seuil atteint » utilise <strong>tout</strong> l'historique enregistré.
          </p>
          <div id="midwife-print-root" class="midwife-print-root" aria-live="polite"></div>
          <p class="midwife-copy-feedback no-print" id="midwife-copy-feedback" role="status" aria-live="polite" hidden></p>
          <div class="midwife-actions no-print" role="group" aria-label="Copier ou imprimer le résumé">
            <button type="button" class="btn btn-secondary" id="btn-midwife-copy">
              Copier le texte
            </button>
            <button type="button" class="btn btn-primary" id="btn-midwife-print">
              Imprimer ou PDF
            </button>
          </div>
          <p class="midwife-print-hint no-print">
            Dans la boîte d'impression, choisissez <strong>Enregistrer au format PDF</strong> si vous voulez un fichier.
          </p>
        </section>
        <p class="settings-back-wrap no-print">
          <a href="#/historique" class="btn btn-ghost settings-back-link">Tableau détaillé</a>
          <a href="#/" class="btn btn-secondary settings-back-link">Accueil</a>
        </p>
      </div>

      <dialog class="edit-dialog" id="edit-contraction-dialog" aria-labelledby="edit-dialog-title">
        <form id="edit-contraction-form" class="edit-dialog-form">
          <h3 id="edit-dialog-title" class="edit-dialog-title">Modifier la contraction</h3>
          <label class="field">
            <span>Début</span>
            <input type="datetime-local" id="edit-start" name="start" step="1" required />
          </label>
          <label class="field">
            <span>Fin</span>
            <input type="datetime-local" id="edit-end" name="end" step="1" required />
          </label>
          <div class="field">
            <span class="field-label">Intensité de la douleur</span>
            <div class="intensity-picker" id="edit-intensity-picker">
              <input type="radio" name="intensity" value="1" id="int-1" class="sr-only" />
              <label for="int-1" class="btn-intensity" title="Très faible">1</label>
              <input type="radio" name="intensity" value="2" id="int-2" class="sr-only" />
              <label for="int-2" class="btn-intensity" title="Faible">2</label>
              <input type="radio" name="intensity" value="3" id="int-3" class="sr-only" />
              <label for="int-3" class="btn-intensity" title="Moyenne">3</label>
              <input type="radio" name="intensity" value="4" id="int-4" class="sr-only" />
              <label for="int-4" class="btn-intensity" title="Forte">4</label>
              <input type="radio" name="intensity" value="5" id="int-5" class="sr-only" />
              <label for="int-5" class="btn-intensity" title="Très forte">5</label>
              <button type="button" class="btn btn-ghost btn-tiny" id="btn-edit-intensity-clear">Effacer</button>
            </div>
          </div>
          <label class="field">
            <span>Note (optionnelle)</span>
            <textarea id="edit-note" name="note" rows="2" maxlength="240" placeholder="Ex. plus intense, repos…"></textarea>
          </label>
          <div class="quick-notes" id="edit-quick-notes">
            <button type="button" class="btn btn-ghost btn-tiny" data-note="Ballon">🎈 Ballon</button>
            <button type="button" class="btn btn-ghost btn-tiny" data-note="Marche">🚶 Marche</button>
            <button type="button" class="btn btn-ghost btn-tiny" data-note="Repos">🛌 Repos</button>
            <button type="button" class="btn btn-ghost btn-tiny" data-note="Douche">🚿 Douche</button>
          </div>
          <p class="edit-dialog-error" id="edit-dialog-error" role="alert"></p>
          <div class="edit-dialog-buttons">
            <button type="button" class="btn btn-secondary" id="edit-dialog-cancel">Annuler</button>
            <button type="submit" class="btn btn-primary">Enregistrer</button>
          </div>
        </form>
      </dialog>

      <!-- Vagues décoratives apaisantes -->
      <div class="wave-container" aria-hidden="true">
        <div class="wave"></div>
        <div class="wave"></div>
        <div class="wave"></div>
      </div>
    </main>
  `}function k(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const o={records:it(),settings:at(),activeStart:null,alertLatch:!1};let N=null,E=null,L=null,z=null,W=null,j=!1,C=null,$=!1,ne=!1,D=null;const De="mc_maternity_message_v1",gt=10080*60*1e3,yt=3e4,Te=`Coucou,

C’est le grand jour pour nous : je pars à la maternité. Les contractions se suivent bien, et c’est cohérent avec ce qu’on s’était dit avec la sage-femme.

J’ai un peu les papillons, mais je me sens prête. Pense fort à nous — je t’envoie des nouvelles dès que je peux.

Je t’embrasse`;function vt(e){e.innerHTML=ft(),qt(e),Ie(e),q(e)}function wt(e,t){e.querySelectorAll("a.drawer-link[data-drawer-route]").forEach(n=>{const s=n.dataset.drawerRoute===t;n.classList.toggle("drawer-link--current",s),s?n.setAttribute("aria-current","page"):n.removeAttribute("aria-current")})}function St(e,t){const n=e.querySelector("#top-bar-bc-nav");if(!n)return;const i=he("home"),s=he(t);t==="home"?n.innerHTML=`<ol class="top-bar-bc-list">
      <li class="top-bar-bc-step" aria-current="page"><span class="top-bar-bc-text">${i}</span></li>
    </ol>`:n.innerHTML=`<ol class="top-bar-bc-list">
      <li class="top-bar-bc-step"><a class="top-bar-bc-link" href="#/">${i}</a></li>
      <li class="top-bar-bc-step" aria-current="page"><span class="top-bar-bc-text">${s}</span></li>
    </ol>`}function Ie(e){let t=mt();t==="message"&&!o.settings.moduleMaternityMessage&&(history.replaceState(null,"",`${window.location.pathname}${window.location.search}#/`),t="home");const n=e.querySelector("#view-home"),i=e.querySelector("#view-settings"),s=e.querySelector("#view-message"),r=e.querySelector("#view-table"),a=e.querySelector("#view-maternity"),l=e.querySelector("#view-midwife");if(n.hidden=t!=="home",i.hidden=t!=="settings",s.hidden=t!=="message",r.hidden=t!=="table",a.hidden=t!=="maternity",l.hidden=t!=="midwife",t==="settings"){window.scrollTo(0,0),E!==null&&(clearTimeout(E),E=null);const c=e.querySelector("#settings-save-feedback");c&&(c.textContent="",c.hidden=!0)}(t==="maternity"||t==="midwife")&&window.scrollTo(0,0),St(e,t),wt(e,t),document.title=pt(t),Ne(e),T(e)}function T(e){const t=e.querySelector("#nav-backdrop"),n=e.querySelector("#app-drawer"),i=e.querySelector("#btn-menu");t.classList.remove("is-open"),n.classList.remove("is-open"),t.setAttribute("aria-hidden","true"),n.setAttribute("aria-hidden","true"),i.setAttribute("aria-expanded","false"),i.classList.remove("hamburger--open"),document.body.style.overflow=""}function kt(e){const t=e.querySelector("#nav-backdrop"),n=e.querySelector("#app-drawer"),i=e.querySelector("#btn-menu");t.classList.add("is-open"),n.classList.add("is-open"),t.setAttribute("aria-hidden","false"),n.setAttribute("aria-hidden","false"),i.setAttribute("aria-expanded","true"),i.classList.add("hamburger--open"),document.body.style.overflow="hidden"}function Mt(e){e.querySelector("#app-drawer").classList.contains("is-open")?T(e):kt(e)}function qt(e){const t=e.querySelector("#btn-toggle"),n=e.querySelector("#btn-clear-history"),i=e.querySelector("#btn-share"),s=e.querySelector("#btn-export"),r=e.querySelector("#form-settings"),a=e.querySelector("#btn-notify");t.addEventListener("click",()=>{o.activeStart===null?ge(e):ye(e)}),n.addEventListener("click",()=>{confirm("Effacer tout l’historique sur cet appareil ?")&&(o.records=[],o.alertLatch=!1,$=!1,Y(e),I(o.records),Ne(e),q(e))}),r.addEventListener("submit",u=>{u.preventDefault();const p=new FormData(r);o.settings.maxIntervalMin=Number(p.get("maxIntervalMin")),o.settings.minDurationSec=Number(p.get("minDurationSec")),o.settings.consecutiveCount=Number(p.get("consecutiveCount"));const h=p.get("statsWindowMinutes");o.settings.statsWindowMinutes=h==="30"||h==="60"||h==="120"||h==="all"?h:"all",o.settings.openContractionReminderMin=Number(p.get("openContractionReminderMin")),o.settings.maternityLabel=String(p.get("maternityLabel")??"").replace(/\s+/g," ").trim().slice(0,120),o.settings.maternityPhone=String(p.get("maternityPhone")??"").replace(/[^\d+]/g,"").slice(0,20),o.settings.maternityAddress=String(p.get("maternityAddress")??"").replace(/\r\n/g,`
`).trim().slice(0,800),o.settings.preAlertEnabled=e.querySelector("#pre-alert-check").checked,o.settings.largeMode=e.querySelector("#large-mode-check").checked,o.settings.keepAwakeDuringContraction=e.querySelector("#keep-awake-check").checked,o.settings.vibrationEnabled=e.querySelector("#vibration-check").checked,o.settings.moduleVoiceCommands=e.querySelector("#module-voice-check").checked,o.settings.moduleMaternityMessage=e.querySelector("#module-message-check").checked,o.settings.voiceCommandsEnabled=e.querySelector("#voice-check").checked,o.settings.moduleVoiceCommands||(o.settings.voiceCommandsEnabled=!1),pe(o.settings),q(e),_t(e)}),e.querySelector("#btn-dismiss-long-open").addEventListener("click",()=>{se(e)}),e.querySelector("#btn-undo-add").addEventListener("click",()=>{if(!C)return;o.records[o.records.length-1]?.id===C.id&&(o.records.pop(),o.alertLatch=!1,$=!1,I(o.records)),Y(e),q(e)}),e.querySelector("#undo-intensity-area").addEventListener("click",u=>{const p=u.target.closest("button[data-intensity]");if(!p||!C)return;const h=Number(p.dataset.intensity),b=o.records[o.records.length-1];b?.id===C.id&&(b.intensity=h,I(o.records),Y(e),q(e))}),e.querySelector("#btn-dismiss-pre").addEventListener("click",()=>{ne=!0,e.querySelector("#banner-pre-alert").hidden=!0}),e.querySelector("#btn-dismiss-export-nudge").addEventListener("click",()=>{try{localStorage.setItem(Ce,String(Date.now()))}catch{}e.querySelector("#banner-export-nudge").hidden=!0}),e.querySelector("#btn-snooze-30").addEventListener("click",()=>{me(Date.now()+1800*1e3),q(e)}),e.querySelector("#btn-snooze-60").addEventListener("click",()=>{me(Date.now()+3600*1e3),q(e)}),e.querySelector("#btn-snooze-clear").addEventListener("click",()=>{dt(),q(e)}),e.querySelector("#btn-voice").addEventListener("click",()=>{const u=e.querySelector("#status-hint"),p=_e();if(!p){u.textContent="Commande vocale non disponible sur ce navigateur.";return}try{D?.stop()}catch{}D=null;const h=new p;h.lang="fr-FR",h.continuous=!1,h.interimResults=!1,h.maxAlternatives=1,h.onresult=b=>{const y=b.results[0]?.[0]?.transcript??"",g=y.toLowerCase();g.includes("début")||g.includes("debut")?o.activeStart===null&&ge(e):g.includes("fin")?o.activeStart!==null&&ye(e):u.textContent=`Entendu : « ${y.trim()||"…"} » — dites « début » ou « fin ».`},h.onerror=()=>{u.textContent="Micro refusé ou erreur — vérifiez les permissions."},h.onend=()=>{D=null},D=h;try{h.start(),u.textContent="Écoute… dites « début » ou « fin »."}catch{u.textContent="Impossible de démarrer l’écoute."}}),a.addEventListener("click",async()=>{if(!("Notification"in window)){K(e,"Non supporté sur ce navigateur.");return}const u=await Notification.requestPermission();o.settings.notificationsEnabled=u==="granted",pe(o.settings),K(e,Bt(u)),q(e)}),i.addEventListener("click",()=>{nn(e)}),s.addEventListener("click",()=>{Ue(),_(e,"Fichier JSON téléchargé.")}),e.querySelector("#midwife-count-select").addEventListener("change",()=>{He(e)}),e.querySelector("#btn-midwife-copy").addEventListener("click",()=>{Xt(e)}),e.querySelector("#btn-midwife-print").addEventListener("click",()=>{window.print()}),Lt(e),At(e);const l=e.querySelector("#btn-menu"),c=e.querySelector("#nav-backdrop"),m=e.querySelector("#app-drawer");l.addEventListener("click",()=>Mt(e)),c.addEventListener("click",()=>T(e)),e.querySelector("#btn-drawer-close").addEventListener("click",()=>{T(e),l.focus()});const d=e.querySelector("#btn-theme");ce(d),d.addEventListener("click",()=>{Ye(),ce(d,!0)}),m.addEventListener("click",u=>{u.target.closest("a.drawer-link")&&T(e)}),ht(()=>{Ie(e),q(e),requestAnimationFrame(()=>bt())}),document.addEventListener("keydown",u=>{if(u.key!=="Escape")return;e.querySelector("#app-drawer")?.classList.contains("is-open")&&(u.preventDefault(),T(e))}),Ct(e),document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&o.activeStart!==null&&o.settings.keepAwakeDuringContraction&&Pe()})}function J(e){return e.querySelector("#msg-template")?.value??""}function A(e,t){const n=e.querySelector("#msg-feedback");n&&(n.textContent=t)}function be(e){try{localStorage.setItem(De,e)}catch{}}function xt(){try{const e=localStorage.getItem(De);if(e!=null&&e.trim()!=="")return e}catch{}return Te}function Ct(e){const t=e.querySelector("#msg-template");if(!t)return;t.value=xt();let n=null;t.addEventListener("input",()=>{n&&clearTimeout(n),n=setTimeout(()=>{n=null,be(t.value)},400)}),e.querySelector("#btn-msg-reset").addEventListener("click",()=>{t.value=Te,be(t.value),A(e,"Modèle par défaut restauré.")}),e.querySelector("#btn-msg-copy").addEventListener("click",async()=>{const i=J(e);if(!i.trim()){A(e,"Le message est vide.");return}try{await navigator.clipboard.writeText(i),A(e,"Message copié dans le presse-papiers.")}catch{A(e,"Copie impossible — sélectionnez le texte manuellement.")}}),e.querySelector("#btn-msg-whatsapp").addEventListener("click",()=>{const i=J(e),s=`https://wa.me/?text=${encodeURIComponent(i)}`;window.open(s,"_blank","noopener,noreferrer"),A(e,"WhatsApp ouvert dans un nouvel onglet (ou l’app sur mobile).")}),e.querySelector("#btn-msg-sms").addEventListener("click",()=>{const i=J(e),s=`sms:?body=${encodeURIComponent(i)}`;window.location.href=s,A(e,"Si rien ne s’ouvre, utilisez « Copier » puis collez dans votre app SMS.")})}function Et(){o.records.sort((e,t)=>e.start-t.start)}function Lt(e){e.querySelector("#history-list").addEventListener("click",n=>{const i=n.target.closest("button[data-action][data-id]");if(!i)return;const s=i.dataset.action,r=i.dataset.id;if(!r||s!=="delete"&&s!=="edit")return;if(s==="delete"){if(!confirm("Supprimer cette contraction de l’historique ?"))return;const l=o.records.findIndex(c=>c.id===r);if(l===-1)return;o.records.splice(l,1),o.alertLatch=!1,I(o.records),q(e);return}const a=o.records.find(l=>l.id===r);a&&$t(e,r,a)})}function At(e){const t=e.querySelector("#edit-contraction-dialog"),n=e.querySelector("#edit-contraction-form"),i=e.querySelector("#edit-start"),s=e.querySelector("#edit-end"),r=e.querySelector("#edit-note"),a=e.querySelector("#edit-dialog-error");e.querySelector("#edit-dialog-cancel").addEventListener("click",()=>{L=null,t.close()}),t.addEventListener("close",()=>{L=null,a.textContent=""}),n.addEventListener("submit",c=>{if(c.preventDefault(),a.textContent="",!L)return;const m=new Date(i.value).getTime(),d=new Date(s.value).getTime();if(Number.isNaN(m)||Number.isNaN(d)){a.textContent="Vérifiez les dates saisies.";return}if(d<m){a.textContent="La fin doit être après le début.";return}const u=o.records.find(f=>f.id===L);if(!u){t.close();return}u.start=m,u.end=d;const p=r.value.trim();p?u.note=p.slice(0,240):delete u.note;const b=new FormData(n).get("intensity");b?u.intensity=Number(b):delete u.intensity,Et(),o.alertLatch=!1,I(o.records),L=null,t.close(),q(e)}),e.querySelector("#btn-edit-intensity-clear").addEventListener("click",()=>{n.querySelectorAll('input[name="intensity"]').forEach(c=>{c.checked=!1})}),e.querySelector("#edit-quick-notes").addEventListener("click",c=>{const m=c.target.closest("button[data-note]");if(!m)return;const d=m.dataset.note||"",u=r.value.trim();u?u.includes(d)||(r.value=`${u}, ${d}`):r.value=d})}function Ne(e){const t=e.querySelector("#edit-contraction-dialog");t?.open&&(L=null,t.close())}function $t(e,t,n){const i=e.querySelector("#edit-contraction-dialog"),s=e.querySelector("#edit-start"),r=e.querySelector("#edit-end"),a=e.querySelector("#edit-note"),l=e.querySelector("#edit-dialog-error");L=t,l.textContent="",s.value=fe(n.start),r.value=fe(n.end),a.value=n.note??"",e.querySelectorAll('input[name="intensity"]').forEach(m=>{m.checked=Number(m.value)===n.intensity}),i.showModal()}function fe(e){const t=new Date(e),n=i=>String(i).padStart(2,"0");return`${t.getFullYear()}-${n(t.getMonth()+1)}-${n(t.getDate())}T${n(t.getHours())}:${n(t.getMinutes())}:${n(t.getSeconds())}`}function Re(){return Date.now()<Ee()}function ie(e){if(o.settings.vibrationEnabled)try{navigator.vibrate?.(e)}catch{}}async function Pe(){if(!(!o.settings.keepAwakeDuringContraction||!navigator.wakeLock))try{z=await navigator.wakeLock.request("screen"),z.addEventListener("release",()=>{z=null})}catch{}}async function Dt(){try{await z?.release()}catch{}z=null}function Fe(){W&&(clearInterval(W),W=null)}function Tt(e){Fe(),j=!1;const t=()=>{if(o.activeStart===null)return;const n=(Date.now()-o.activeStart)/6e4,i=o.settings.openContractionReminderMin;if(n>=i&&!j){j=!0;const s=e.querySelector("#banner-long-open"),r=e.querySelector("#banner-long-open-text");s&&r&&(r.textContent=`Une contraction semble toujours en cours depuis plus de ${i} min. Avez-vous oublié d’appuyer sur « Fin » ?`,s.hidden=!1),ie([70,35,70]),o.settings.notificationsEnabled&&typeof Notification<"u"&&Notification.permission==="granted"&&new Notification("Miss Contraction",{body:"Pensez à indiquer la fin de la contraction si elle est terminée.",tag:"mc-open-reminder"})}};W=setInterval(t,15e3),t()}function se(e){const t=e.querySelector("#banner-long-open");t&&(t.hidden=!0),j=!1}function It(e,t){C&&clearTimeout(C.timeoutId);const n=e.querySelector("#banner-undo");n&&(n.hidden=!1);const i=setTimeout(()=>{C=null;const s=e.querySelector("#banner-undo");s&&(s.hidden=!0)},yt);C={id:t,timeoutId:i}}function Y(e){C&&clearTimeout(C.timeoutId),C=null;const t=e.querySelector("#banner-undo");t&&(t.hidden=!0)}function _e(){const e=window;return e.SpeechRecognition??e.webkitSpeechRecognition??null}function ge(e){o.activeStart=Date.now(),Pe(),se(e),ie(40);const t=e.querySelector("#btn-toggle");t.textContent="Fin de contraction",t.classList.add("btn-danger","recording"),t.classList.remove("btn-primary");const n=e.querySelector("#timer-block");n.hidden=!1,N&&clearInterval(N),N=setInterval(()=>ve(e),1e3),ve(e),e.querySelector("#status-hint").textContent="Appuyez à nouveau à la fin de la contraction.",Tt(e)}function ye(e){if(o.activeStart===null)return;const t=Date.now(),n={id:crypto.randomUUID(),start:o.activeStart,end:t};o.activeStart=null,Dt(),Fe(),se(e),ie([35,50,35]),N&&(clearInterval(N),N=null),o.records.push(n),I(o.records),ne=!1,Nt(),Rt();const i=e.querySelector("#btn-toggle");i.textContent="Début de contraction",i.classList.add("btn-primary"),i.classList.remove("btn-danger","recording"),e.querySelector("#timer-block").hidden=!0,e.querySelector("#status-hint").textContent="",It(e,n.id),q(e)}function ve(e){if(o.activeStart===null)return;const t=Math.floor((Date.now()-o.activeStart)/1e3),n=Math.floor(t/60),i=t%60,s=e.querySelector("#timer-value");s&&(s.textContent=`${n}:${String(i).padStart(2,"0")}`);const r=e.querySelector("#timer-circle-progress");if(r){const l=Math.min(t/60,1),m=2*Math.PI*90*(1-l);r.style.strokeDashoffset=String(m)}}function Nt(){if(Re()||!o.settings.preAlertEnabled)return;if(te(o.records,o.settings)==="match"){$=!1;return}const e=o.records.filter(s=>s.end>s.start);if(e.length<2)return;const t=e[e.length-2],i=(e[e.length-1].start-t.start)/6e4;i>o.settings.maxIntervalMin*1.25&&($=!1),!(i<=0||i>o.settings.maxIntervalMin*1.2)&&o.settings.notificationsEnabled&&(typeof Notification>"u"||Notification.permission!=="granted"||$||($=!0,new Notification("Miss Contraction",{body:"Rythme soutenu : vous vous rapprochez des repères définis avec votre sage-femme.",tag:"mc-prealert"})))}function Rt(){if(Re())return;const{records:e,settings:t}=o,n=t.consecutiveCount;if(e.length<n){we(e);return}const i=e.slice(-n),s=i.slice(1).every((l,c)=>{const m=i[c];return(l.start-m.start)/6e4<=t.maxIntervalMin}),r=i.every(l=>(l.end-l.start)/1e3>=t.minDurationSec);if(we(e),!s||!r||!t.notificationsEnabled||o.alertLatch||typeof Notification>"u"||Notification.permission!=="granted")return;o.alertLatch=!0;const a="/miss-contraction/icons/icon-192.png";new Notification("Miss Contraction",{body:`Les ${n} dernières contractions respectent vos critères. Contactez la maternité selon vos consignes.`,icon:a,tag:"mc-threshold",renotify:!0})}function we(e){if(e.length<2)return;const t=e[e.length-2];(e[e.length-1].start-t.start)/6e4>o.settings.maxIntervalMin&&(o.alertLatch=!1)}function Pt(){try{D?.stop()}catch{}D=null}function Ft(e,t){const n=t.maternityPhone.trim(),i=t.maternityLabel.trim(),s=n?`tel:${n.replace(/\s/g,"")}`:"",r=t.maternityAddress.trim(),a=e.querySelector("#maternity-page-venue");a&&(i?(a.textContent=i,a.hidden=!1):(a.textContent="",a.hidden=!0));const l=e.querySelector("#maternity-quick"),c=e.querySelector("#maternity-quick-link"),m=e.querySelector("#maternity-quick-tel"),d=e.querySelector("#maternity-quick-title"),u=e.querySelector("main.app");if(l&&c&&m&&u)if(n){l.hidden=!1,u.classList.add("app--maternity-quick"),c.href=s;const P=i||"la maternité";c.setAttribute("aria-label",`Appeler ${P} au ${n}`),m.textContent=n,d&&(d.textContent=i?`Appeler ${i}`:"Appeler la maternité")}else l.hidden=!0,u.classList.remove("app--maternity-quick"),c.href="tel:",c.removeAttribute("aria-label"),m.textContent="",d&&(d.textContent="Appeler la maternité");const p=e.querySelector("#maternity-page-address-block"),h=e.querySelector("#maternity-page-address"),b=e.querySelector("#maternity-page-address-placeholder"),f=e.querySelector("#maternity-page-maps-wrap"),y=e.querySelector("#maternity-page-maps-link");if(p&&h&&b&&(r?(h.hidden=!1,h.textContent=r,b.hidden=!0):(h.textContent="",h.hidden=!0,b.hidden=!1)),f&&y)if(r){f.hidden=!1;const P=encodeURIComponent(r);y.href=`https://www.google.com/maps/dir/?api=1&destination=${P}`;const Ve=i||r;y.setAttribute("aria-label",`Ouvrir Google Maps : itinéraire vers ${Ve}`)}else f.hidden=!0,y.href="#",y.removeAttribute("aria-label");const g=e.querySelector("#maternity-page-phone-line"),v=e.querySelector("#maternity-page-phone-placeholder");g&&v&&(n?(g.hidden=!1,g.textContent=n,v.hidden=!0):(g.textContent="",g.hidden=!0,v.hidden=!1));const w=e.querySelector("#maternity-page-dial-link"),x=e.querySelector("#maternity-page-dial-label"),V=e.querySelector("#maternity-page-hint");if(w&&x&&V){w.classList.toggle("maternity-page-dial--ready",!!n);const P=i?`Appeler ${i}`:"Appeler la maternité";n?(w.href=s,x.textContent=P,w.setAttribute("aria-label",i?`Appeler ${i} au ${n}`:`Appeler la maternité au ${n}`),V.textContent=""):(w.href="#/parametres",x.textContent="Renseigner le numéro",w.setAttribute("aria-label","Ouvrir les paramètres pour renseigner le numéro de la maternité"),V.textContent="Enregistrez un numéro dans les paramètres pour lancer l’appel depuis ce bouton.")}}function _t(e){const t=e.querySelector("#settings-save-feedback");t&&(E!==null&&(clearTimeout(E),E=null),t.hidden=!1,t.textContent="Modifications enregistrées.",E=window.setTimeout(()=>{t.textContent="",t.hidden=!0,E=null},3800))}function q(e){const t=o.settings;document.documentElement.classList.toggle("mc-large-mode",t.largeMode),(!t.moduleVoiceCommands||!t.voiceCommandsEnabled)&&Pt(),e.querySelector("#lbl-n").textContent=String(t.consecutiveCount),e.querySelector("#lbl-interval").textContent=String(t.maxIntervalMin),e.querySelector("#lbl-dur").textContent=String(t.minDurationSec);const n=e.querySelector("#form-settings");n&&(n.elements.namedItem("maxIntervalMin").value=String(t.maxIntervalMin),n.elements.namedItem("minDurationSec").value=String(t.minDurationSec),n.elements.namedItem("consecutiveCount").value=String(t.consecutiveCount),n.elements.namedItem("statsWindowMinutes").value=t.statsWindowMinutes,n.elements.namedItem("openContractionReminderMin").value=String(t.openContractionReminderMin),n.elements.namedItem("maternityLabel").value=t.maternityLabel,n.elements.namedItem("maternityPhone").value=t.maternityPhone,n.elements.namedItem("maternityAddress").value=t.maternityAddress,e.querySelector("#pre-alert-check").checked=t.preAlertEnabled,e.querySelector("#large-mode-check").checked=t.largeMode,e.querySelector("#keep-awake-check").checked=t.keepAwakeDuringContraction,e.querySelector("#vibration-check").checked=t.vibrationEnabled,e.querySelector("#module-voice-check").checked=t.moduleVoiceCommands,e.querySelector("#module-message-check").checked=t.moduleMaternityMessage,e.querySelector("#voice-check").checked=t.voiceCommandsEnabled);const i=e.querySelector("#voice-option-field");i&&(i.hidden=!t.moduleVoiceCommands);const s=e.querySelector("#drawer-item-message");s&&(s.hidden=!t.moduleMaternityMessage);const r=e.querySelector("#btn-voice");r&&(r.hidden=!t.moduleVoiceCommands||!t.voiceCommandsEnabled||_e()===null),Ft(e,t),Gt(e),Vt(e),Ut(e),jt(e),K(e,Ot()),zt(e),Yt(e),Jt(e),Zt(e),Kt(e),He(e)}function zt(e){const t=o.records.length>0;e.querySelector("#btn-share").disabled=!t,e.querySelector("#btn-export").disabled=!t}function K(e,t){const n=e.querySelector("#notify-status");n&&(n.textContent=t)}function Ot(){return"Notification"in window?Notification.permission==="granted"?o.settings.notificationsEnabled?"Notifications activées.":"Permission accordée — touchez « Activer les notifications » pour confirmer.":Notification.permission==="denied"?"Notifications refusées dans le navigateur.":"Notifications non encore demandées.":"Notifications non disponibles."}function Bt(e){return e==="granted"?"Notifications activées.":e==="denied"?"Refusé — activez-les dans les paramètres du navigateur.":"Permission non accordée."}function Ht(e,t){const n=t-36e5;return e.filter(i=>i.start>=n).length}function ae(e){if(e.length<2)return null;let t=0;for(let n=1;n<e.length;n++)t+=e[n].start-e[n-1].start;return t/(e.length-1)}function re(e){if(e.length===0)return null;let t=0;for(const n of e)t+=n.end-n.start;return t/e.length}function ze(e){if(e<=0||!Number.isFinite(e))return"—";const t=36e5/e;if(!Number.isFinite(t)||t<=0)return"—";const n=t>=12?0:1;return`≈ ${t.toFixed(n).replace(".",",")} / h`}function R(e){if(!Number.isFinite(e)||e<0)return"—";const t=Math.round(e/1e3),n=Math.floor(t/60),i=t%60;return`${String(n).padStart(2,"0")}:${String(i).padStart(2,"0")}`}function Wt(){const e=o.settings.statsWindowMinutes;return e==="all"?"Moyennes sur toutes les données enregistrées.":`Moyennes sur les ${e==="30"?30:e==="60"?60:120} dernières minutes (début de contraction).`}function jt(e){const t=e.querySelector("#threshold-badge");if(!t)return;const n=te(o.records,o.settings);t.classList.remove("threshold-badge-empty","threshold-badge-calm","threshold-badge-approaching","threshold-badge-match");const i={match:"🏥",approaching:"🎯",calm:"😌",empty:"📊"},s={match:"Les dernières contractions correspondent à vos seuils d’alerte.",approaching:"Rythme soutenu — restez attentive aux consignes de votre sage-femme.",calm:"En dehors du schéma d’alerte configuré (pour l’instant).",empty:"Pas encore assez de données pour comparer aux seuils."};t.dataset.state=n,t.classList.add(`threshold-badge-${n}`),t.innerHTML=`<span class="badge-icon">${i[n]??""}</span> ${s[n]??""}`}function Ut(e){const t=e.querySelector("#banner-pre-alert"),n=e.querySelector("#banner-pre-alert-text");if(!t||!n)return;const i=te(o.records,o.settings);o.settings.preAlertEnabled&&i==="approaching"&&!ne?(n.textContent="Le rythme se resserre par rapport à vos repères. En cas de doute, contactez la maternité selon vos consignes.",t.hidden=!1):t.hidden=!0}function Vt(e){const t=e.querySelector("#banner-export-nudge");if(!t)return;if(o.records.filter(s=>s.end>s.start).length===0){t.hidden=!0;return}let i=0;try{i=Number(localStorage.getItem(Ce))||0}catch{i=0}t.hidden=Date.now()-i<gt}function Gt(e){const t=e.querySelector("#snooze-status");if(!t)return;const n=Ee();if(n<=Date.now()){t.textContent="Aucun report actif.";return}const i=new Date(n);t.textContent=`Alertes reportées jusqu’à ${i.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}.`}function Jt(e){const t=e.querySelector("#chart-block"),n=e.querySelector("#chart-bars"),i=e.querySelector("#stats-window-label");if(i&&(i.textContent=Wt()),!t||!n)return;const s=Date.now(),a=[...o.records.filter(u=>u.end>u.start)].sort((u,p)=>u.start-p.start),l=Le(a,o.settings.statsWindowMinutes,s),c=ut(l);if(n.textContent="",c.length===0){t.hidden=!0;return}t.hidden=!1;const m=Math.max(...c,1),d=l.slice(-c.length-1);c.forEach((u,p)=>{const h=Math.min(100,Math.round(u/m*100)),b=document.createElement("div");b.className="chart-bar-container";const f=d[p+1],y=document.createElement("div");if(y.className="chart-bar-label",f){const x=new Date(f.start);y.textContent=`${x.getHours().toString().padStart(2,"0")}:${x.getMinutes().toString().padStart(2,"0")}`}else y.textContent="—";b.appendChild(y);const g=document.createElement("div");g.className="chart-bar",g.style.width=`${h}%`;const v=d[p+1]?.intensity;if(v&&g.classList.add(`chart-bar--intensity-${v}`),g.title=M(u),b.appendChild(g),v){const x=document.createElement("div");x.className=`chart-bar-intensity chart-bar-intensity--${v}`,x.textContent=String(v),x.title=`Intensité ${v}`,b.appendChild(x)}const w=document.createElement("div");w.className="chart-bar-duration",w.textContent=M(u),b.appendChild(w),n.appendChild(b)})}function Yt(e){const t=e.querySelector("#stat-qty-hour"),n=e.querySelector("#stat-avg-duration"),i=e.querySelector("#stat-avg-frequency"),s=e.querySelector("#summary-extra"),r=Date.now(),a=o.records.filter(v=>v.end>v.start),l=[...a].sort((v,w)=>v.start-w.start),c=Le(l,o.settings.statsWindowMinutes,r),m="—";if(!t||!n||!i)return;if(c.length===0){t.textContent=m,n.textContent=m,i.textContent=m,s.innerHTML="";return}const d=ae(c),u=re(c),p=d!=null&&d>0?String(Math.round(36e5/d)):m;t.textContent=p,n.textContent=u!=null?R(u):m,i.textContent=d!=null?R(d):m;const h=Ht(a,r),b=d!=null?ze(d):m,f=l.length>0?l[l.length-1]:null,y=f?M(f.end-f.start):m;let g=m;if(l.length>=2&&f){const v=l[l.length-2];g=M(f.start-v.start)}s.innerHTML=`
    <dt>Contractions (dernière heure)</dt><dd>${h}</dd>
    <dt>Estimation détaillée</dt><dd>${b}</dd>
    <dt>Dernier intervalle</dt><dd>${g}</dd>
    <dt>Dernière durée</dt><dd>${y}</dd>
  `}const O=new Intl.DateTimeFormat("fr-FR",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}),Q=new Intl.DateTimeFormat("fr-FR",{dateStyle:"full",timeStyle:"short"});function Oe(e){return e==="6"||e==="10"||e==="12"||e==="20"||e==="all"?e:"12"}function Be(e,t){if(t==="all"||e.length===0)return e;const n=Number(t);return!Number.isFinite(n)||n<1?e:e.slice(-Math.min(n,e.length))}function oe(){return[...o.records].filter(e=>e.end>e.start).sort((e,t)=>e.start-t.start)}function Kt(e){const t=e.querySelector("#history-table-body"),n=e.querySelector("#history-table-empty"),i=e.querySelector(".history-table-wrap");if(!t||!n)return;const s=oe();if(t.textContent="",s.length===0){n.hidden=!1,i&&(i.hidden=!0);return}n.hidden=!0,i&&(i.hidden=!1);for(let r=0;r<s.length;r++){const a=s[r],l=document.createElement("tr"),c=r>0?a.start-s[r-1].start:null,m=c!=null?M(c):"—",d=c!=null&&c>0?ze(c):"—",u=document.createElement("th");u.scope="row",u.textContent=String(r+1);const p=document.createElement("td");p.textContent=O.format(a.start);const h=document.createElement("td");h.textContent=M(a.end-a.start);const b=document.createElement("td");b.textContent=m;const f=document.createElement("td");f.textContent=d;const y=document.createElement("td");y.className="history-table-note";const g=a.note?.trim(),v=a.intensity?` [Int. ${a.intensity}]`:"";y.textContent=(g||"—")+v,l.append(u,p,h,b,f,y),t.appendChild(l)}}function Qt(e){const t=e.querySelector("#midwife-count-select"),n=Oe(t?.value??"12"),i=oe(),s=Be(i,n),r=o.settings,a=[],l=new Intl.DateTimeFormat("fr-FR",{dateStyle:"medium",timeStyle:"short"});a.push("Miss Contraction — Résumé pour la sage-femme"),a.push(`Généré le ${l.format(new Date)}`),a.push(""),a.push("Seuils configurés dans l’application :"),a.push(`— ${r.consecutiveCount} contractions consécutives, écart entre débuts ≤ ${r.maxIntervalMin} min, durée ≥ ${r.minDurationSec} s chacune.`),a.push("");const c=Ae(o.records,r);c!=null?a.push(`Première fois où ces critères ont été remplis (sur tout l’historique) : ${Q.format(c)}.`):a.push("Aucun groupe de contractions consécutives n’a encore rempli ces critères dans l’historique enregistré."),a.push("");const m=n==="all"?"tout l’historique":`les ${n} dernières contractions`;if(a.push(`Période du tableau et des moyennes : ${m} (${s.length} contraction(s)).`),a.push(""),s.length===0)return a.push("Aucune contraction dans cette sélection."),a.push(""),a.push("—"),a.push("Données indicatives — ne remplacent pas un avis médical."),a.join(`
`);const d=ae(s),u=re(s),p=d!=null&&d>0?String(Math.round(36e5/d)):"—";a.push("Moyennes sur cette sélection :"),a.push(`— Quantité estimée : ≈ ${p} contraction(s) / h (si le rythme restait constant).`),a.push(`— Durée moyenne : ${u!=null?R(u):"—"} (mm:ss).`),a.push(`— Intervalle moyen entre débuts : ${d!=null?R(d):"—"} (mm:ss).`),a.push(""),a.push("Détail (ordre chronologique) :");for(let h=0;h<s.length;h++){const b=s[h],f=h>0?b.start-s[h-1].start:null,y=f!=null?M(f):"—",g=b.note?.trim(),v=b.intensity?` — intensité : ${b.intensity}`:"";a.push(`${h+1}. ${O.format(b.start)} — durée ${M(b.end-b.start)} — écart depuis précédente : ${y}${v}${g?` — note : ${g}`:""}`)}return a.push(""),a.push("—"),a.push("Données indicatives — ne remplacent pas un avis médical."),a.join(`
`)}function He(e){const t=e.querySelector("#midwife-print-root");if(!t)return;const n=e.querySelector("#midwife-count-select"),i=Oe(n?.value??"12"),s=oe(),r=Be(s,i),a=o.settings,l=Ae(o.records,a),c=i==="all"?"Tout l’historique":`Les ${i} dernières contractions`,m=new Intl.DateTimeFormat("fr-FR",{dateStyle:"medium",timeStyle:"short"});if(r.length===0){t.innerHTML=`
      <div class="midwife-doc">
        <p class="midwife-doc-title">Miss Contraction — Résumé</p>
        <p class="midwife-doc-meta">Généré le ${k(m.format(new Date))}</p>
        <section class="midwife-doc-section">
          <h3 class="midwife-doc-h">Seuils (réglages actuels)</h3>
          <p>${a.consecutiveCount} contractions consécutives, écart entre débuts ≤ ${a.maxIntervalMin} min, durée ≥ ${a.minDurationSec} s chacune.</p>
        </section>
        <section class="midwife-doc-section">
          <h3 class="midwife-doc-h">Premier seuil atteint (tout l’historique)</h3>
          <p>${l!=null?k(Q.format(l)):"Aucun groupe enregistré ne remplit encore ces critères."}</p>
        </section>
        <section class="midwife-doc-section">
          <h3 class="midwife-doc-h">${k(c)}</h3>
          <p class="midwife-empty">Aucune contraction dans cette sélection.</p>
        </section>
        <p class="midwife-doc-disclaimer">Données indicatives — ne remplacent pas un avis médical.</p>
      </div>`;return}const d=ae(r),u=re(r),p=d!=null&&d>0?String(Math.round(36e5/d)):"—",h=r.map((b,f)=>{const y=f>0?b.start-r[f-1].start:null,g=y!=null?M(y):"—",v=b.note?.trim(),w=b.intensity?`[Int. ${b.intensity}] `:"";return`<tr>
        <td>${f+1}</td>
        <td>${k(O.format(b.start))}</td>
        <td>${k(M(b.end-b.start))}</td>
        <td>${k(g)}</td>
        <td>${w}${v?k(v):"—"}</td>
      </tr>`}).join("");t.innerHTML=`
    <div class="midwife-doc">
      <p class="midwife-doc-title">Miss Contraction — Résumé pour la sage-femme</p>
      <p class="midwife-doc-meta">Généré le ${k(m.format(new Date))}</p>
      <section class="midwife-doc-section">
        <h3 class="midwife-doc-h">Seuils (réglages actuels)</h3>
        <p>${a.consecutiveCount} contractions consécutives, écart entre débuts ≤ ${a.maxIntervalMin} min, durée ≥ ${a.minDurationSec} s chacune.</p>
      </section>
      <section class="midwife-doc-section">
        <h3 class="midwife-doc-h">Premier seuil atteint (tout l’historique)</h3>
        <p>${l!=null?k(Q.format(l)):"Aucun groupe enregistré ne remplit encore ces critères."}</p>
        <p class="midwife-doc-note">Instant retenu : fin de la dernière contraction du premier groupe qui satisfait simultanément l’intervalle et la durée configurés.</p>
      </section>
      <section class="midwife-doc-section">
        <h3 class="midwife-doc-h">Moyennes — ${k(c)} (${r.length})</h3>
        <ul class="midwife-doc-stats">
          <li>Quantité estimée : ≈ ${k(p)} contraction(s) / h (rythme constant)</li>
          <li>Durée moyenne : ${u!=null?k(R(u)):"—"} (mm:ss)</li>
          <li>Intervalle moyen entre débuts : ${d!=null?k(R(d)):"—"} (mm:ss)</li>
        </ul>
      </section>
      <section class="midwife-doc-section">
        <h3 class="midwife-doc-h">Détail (ordre chronologique)</h3>
        <div class="midwife-table-wrap">
          <table class="midwife-table">
            <thead>
              <tr>
                <th scope="col">N°</th>
                <th scope="col">Début</th>
                <th scope="col">Durée</th>
                <th scope="col">Écart</th>
                <th scope="col">Note</th>
              </tr>
            </thead>
            <tbody>${h}</tbody>
          </table>
        </div>
      </section>
      <p class="midwife-doc-disclaimer">Données indicatives — ne remplacent pas un avis médical.</p>
    </div>`}async function Xt(e){const t=Qt(e),n=e.querySelector("#midwife-copy-feedback");try{await navigator.clipboard.writeText(t),n&&(n.hidden=!1,n.textContent="Texte copié dans le presse-papiers.",window.setTimeout(()=>{n.hidden=!0,n.textContent=""},3500))}catch{n&&(n.hidden=!1,n.textContent="Copie impossible — utilisez « Imprimer ou PDF » ou copiez le texte affiché.",window.setTimeout(()=>{n.hidden=!0,n.textContent=""},4500))}}function Zt(e){const t=e.querySelector("#history-list"),n=e.querySelector("#history-empty"),i=[...o.records].reverse();if(t.innerHTML="",i.length===0){n.hidden=!1;return}n.hidden=!0;const s=i.length;for(let r=0;r<i.length;r++){const a=i[r],l=document.createElement("li");l.className="timeline-item",r===0&&l.classList.add("timeline-item--latest");const c=s-r,m=r<i.length-1?M(a.start-i[r+1].start):"—",d=new Date(a.start).toISOString(),u=a.intensity?`<span class="timeline-intensity timeline-intensity--${a.intensity}" title="Intensité ${a.intensity}">
           <span class="sr-only">Intensité</span> ${a.intensity}
         </span>`:"";l.innerHTML=`
      <div class="timeline-marker" aria-hidden="true"></div>
      <div class="timeline-body">
        <div class="timeline-time-row">
          <span class="timeline-num" title="Contraction n°${c}">${c}</span>
          <time class="timeline-time" datetime="${d}">${O.format(a.start)}</time>
          ${u}
        </div>
        <p class="timeline-meta">
          <span class="timeline-stat">Durée <strong>${M(a.end-a.start)}</strong></span>
          <span class="timeline-sep" aria-hidden="true">·</span>
          <span class="timeline-stat">Écart <strong>${m}</strong></span>
        </p>
        ${a.note?.trim()?`<p class="timeline-note">${k(a.note.trim())}</p>`:""}
        <div class="timeline-actions">
          <button type="button" class="btn btn-ghost btn-tiny" data-action="edit" data-id="${a.id}" aria-label="Modifier cette contraction">
            Modifier
          </button>
          <button type="button" class="btn btn-ghost btn-tiny timeline-action-danger" data-action="delete" data-id="${a.id}" aria-label="Supprimer cette contraction">
            Supprimer
          </button>
        </div>
      </div>
    `,t.appendChild(l)}}function M(e){if(!Number.isFinite(e)||e<0)return"—";const t=Math.round(e/1e3);if(t<120)return`${t} s`;const n=Math.floor(t/60),i=t%60;return`${n} min ${i} s`}function We(){return{version:1,app:"Miss Contraction",exportedAt:new Date().toISOString(),records:o.records.map(e=>({...e})),settings:{...o.settings}}}function je(){const e=new Date,t=e.getFullYear(),n=String(e.getMonth()+1).padStart(2,"0"),i=String(e.getDate()).padStart(2,"0");return`miss-contraction-${t}-${n}-${i}.json`}function Ue(){const e=We(),t=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),n=URL.createObjectURL(t),i=document.createElement("a");i.href=n,i.download=je(),i.rel="noopener",document.body.appendChild(i),i.click(),i.remove(),URL.revokeObjectURL(n)}function en(){const e=[...o.records].sort((a,l)=>a.start-l.start),t=e.length;if(t===0)return"";const n=new Intl.DateTimeFormat("fr-FR",{dateStyle:"medium",timeStyle:"short"}),i=[];i.push(`Miss Contraction — résumé (${n.format(new Date)})`),i.push(`${t} contraction(s) enregistrée(s).`),i.push(""),i.push("Contractions (ordre chronologique) :");const s=Math.max(0,e.length-12);for(let a=s;a<e.length;a++){const l=e[a],c=a>0?M(l.start-e[a-1].start):"—",m=l.note?.trim()?` — note : ${l.note.trim()}`:"",d=l.intensity?` — intensité : ${l.intensity}`:"";i.push(`• ${O.format(l.start)} — durée ${M(l.end-l.start)} — écart : ${c}${d}${m}`)}const r=o.settings;return i.push(""),i.push(`Seuils d’alerte : ${r.consecutiveCount} contractions, écart ≤ ${r.maxIntervalMin} min, durée ≥ ${r.minDurationSec} s.`),i.push(""),i.push("Données à titre informatif — ne remplacent pas un avis médical."),i.join(`
`)}function tn(){try{const e=JSON.stringify(We(),null,2);return new File([e],je(),{type:"application/json"})}catch{return null}}async function nn(e){if(o.records.length===0)return;const t=en(),n=tn();if(navigator.share)try{if(n&&typeof navigator.canShare=="function"&&navigator.canShare({files:[n]})){await navigator.share({title:"Miss Contraction",text:"Historique des contractions (fichier JSON joint).",files:[n]}),_(e,"Partage effectué.");return}await navigator.share({title:"Miss Contraction",text:t}),_(e,"Partage effectué.");return}catch(i){if(i.name==="AbortError")return}try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(t),_(e,"Résumé copié dans le presse-papiers.");return}}catch{}Ue(),_(e,"Partage indisponible — fichier JSON téléchargé.")}let H=null;function _(e,t){const n=e.querySelector("#share-export-feedback");n&&(H&&clearTimeout(H),n.textContent=t,n.hidden=!1,H=setTimeout(()=>{n.hidden=!0,n.textContent="",H=null},4500))}function sn(e){switch(e.name){case"CLS":return e.value<=.1?"good":e.value<=.25?"needs-improvement":"poor";case"FID":return e.value<=100?"good":e.value<=300?"needs-improvement":"poor";case"FCP":return e.value<=1800?"good":e.value<=3e3?"needs-improvement":"poor";case"LCP":return e.value<=2500?"good":e.value<=4e3?"needs-improvement":"poor";case"TTFB":return e.value<=800?"good":e.value<=1800?"needs-improvement":"poor";default:return"poor"}}function F(e){const t={...e,rating:sn(e)};typeof window.gtag<"u"&&window.gtag("event",e.name,{event_category:"Web Vitals",event_label:e.id,value:Math.round(e.name==="CLS"?e.value*1e3:e.value),non_interaction:!0,custom_map:{metric_rating:t.rating}})}async function an(){if(!(typeof window>"u"))try{const{onCLS:e,onFID:t,onFCP:n,onLCP:i,onTTFB:s}=await ke(async()=>{const{onCLS:r,onFID:a,onFCP:l,onLCP:c,onTTFB:m}=await import("./vendor-KxcImaOG.js");return{onCLS:r,onFID:a,onFCP:l,onLCP:c,onTTFB:m}},[]);e(F),t(F),n(F),i(F),s(F)}catch(e){console.warn("Failed to initialize Web Vitals:",e)}}Ge();Ke();nt();an();vt(document.querySelector("#app"));
//# sourceMappingURL=index-DsFXQFhE.js.map
