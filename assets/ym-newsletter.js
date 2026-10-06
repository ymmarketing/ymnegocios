/* Newsletter YM — formulário de inscrição.
   Uso: <div data-ym-newsletter data-variant="article|band"></div> + este script (defer). */
(function () {
  var ENDPOINT = 'https://srzdikgztpdtwbggwniz.supabase.co/functions/v1/newsletter-subscribe';
  var css = '.ymnl{border-radius:20px;padding:28px;background:#0b1533;color:#fff;margin:40px auto;max-width:760px}' +
    '.ymnl *{box-sizing:border-box}.ymnl .ymnl-k{font:700 12px/1.2 Inter,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#ffb066;margin:0 0 8px}' +
    '.ymnl h2,.ymnl h3{font-family:Montserrat,Inter,Arial,sans-serif;font-size:clamp(22px,2.6vw,28px);line-height:1.15;margin:0 0 8px;color:#fff;letter-spacing:-.02em;text-align:left}' +
    '.ymnl p{margin:0 0 16px;color:#c9cfe6;font-size:16px;line-height:1.55}' +
    '.ymnl form{display:grid;grid-template-columns:1fr 1.4fr auto;gap:10px;align-items:start}' +
    '.ymnl input[type=text],.ymnl input[type=email]{width:100%;padding:13px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.25);background:#fff;color:#0b1533;font:500 15px Inter,Arial,sans-serif}' +
    '.ymnl button{padding:13px 18px;border:0;border-radius:12px;background:#ff7a00;color:#0b1533;font:800 15px Inter,Arial,sans-serif;cursor:pointer;white-space:nowrap}' +
    '.ymnl button[disabled]{opacity:.6;cursor:wait}' +
    '.ymnl label.ymnl-c{grid-column:1/-1;display:flex;gap:9px;align-items:flex-start;font-size:13.5px;line-height:1.45;color:#c9cfe6}' +
    '.ymnl label.ymnl-c input{margin-top:3px;width:16px;height:16px;flex:none}' +
    '.ymnl label.ymnl-c a{color:#fff}.ymnl .ymnl-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}' +
    '.ymnl .ymnl-msg{grid-column:1/-1;font-size:14.5px;margin:2px 0 0;min-height:1em}.ymnl .ymnl-msg.err{color:#ffb4a8}.ymnl .ymnl-msg.ok{color:#9ff0c4}' +
    '.ymnl.done form{display:none}' +
    '@media(max-width:700px){.ymnl{padding:22px;margin:32px 0}.ymnl form{grid-template-columns:1fr}.ymnl button{width:100%}}';
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function track(name, params) { try { if (window.gtag) window.gtag('event', name, params || {}); } catch (e) {} }
  ready(function () {
    var spots = document.querySelectorAll('[data-ym-newsletter]');
    if (!spots.length) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    spots.forEach(function (spot, i) {
      var id = 'ymnl' + i;
      spot.className = (spot.className + ' ymnl').trim();
      spot.innerHTML =
        '<p class="ymnl-k">Newsletter quinzenal · gratuita</p>' +
        '<h2>Uma pergunta de negócio, respondida a cada 15 dias.</h2>' +
        '<p>Receba no seu e-mail respostas práticas sobre marketing, vendas e decisões antes de investir. Sem enrolação e sem lotar sua caixa de entrada.</p>' +
        '<form novalidate>' +
        '<input type="text" name="first_name" autocomplete="given-name" placeholder="Seu primeiro nome" aria-label="Seu primeiro nome" maxlength="60">' +
        '<input type="email" name="email" autocomplete="email" placeholder="Seu melhor e-mail" aria-label="Seu melhor e-mail" required maxlength="254">' +
        '<button type="submit">Quero receber</button>' +
        '<div class="ymnl-hp" aria-hidden="true"><label>Site<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>' +
        '<label class="ymnl-c" for="' + id + 'c"><input id="' + id + 'c" type="checkbox" name="consent"> <span>Aceito receber a newsletter da YM por e-mail e sei que posso cancelar quando quiser. Veja os <a href="/termos/#dados">termos e privacidade</a>.</span></label>' +
        '<p class="ymnl-msg" role="status" aria-live="polite"></p>' +
        '</form>';
      var form = spot.querySelector('form'), msg = spot.querySelector('.ymnl-msg'), btn = spot.querySelector('button');
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var email = form.email.value.trim(), name = form.first_name.value.trim();
        msg.className = 'ymnl-msg'; msg.textContent = '';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.className = 'ymnl-msg err'; msg.textContent = 'Confira o seu e-mail.'; form.email.focus(); return; }
        if (!form.consent.checked) { msg.className = 'ymnl-msg err'; msg.textContent = 'Marque a autorização para receber a newsletter.'; return; }
        btn.disabled = true; btn.textContent = 'Enviando…';
        fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, first_name: name, consent: true, website: form.website.value, source_page: location.pathname }) })
          .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d, s: r.status }; }); })
          .then(function (res) {
            if (!res.ok) throw new Error(res.s === 429 ? 'Muitas tentativas. Tente de novo em alguns minutos.' : 'Não foi possível concluir agora. Tente de novo em instantes.');
            spot.classList.add('done');
            var done = document.createElement('p'); done.className = 'ymnl-msg ok'; done.setAttribute('role', 'status');
            done.textContent = (name ? name + ', inscrição' : 'Inscrição') + ' confirmada! Enviamos um e-mail de boas-vindas. Se não aparecer, olhe a caixa de promoções ou spam.';
            spot.appendChild(done);
            track('newsletter_signup', { page_path: location.pathname });
          })
          .catch(function (err) { msg.className = 'ymnl-msg err'; msg.textContent = err.message; btn.disabled = false; btn.textContent = 'Quero receber'; });
      });
    });
  });
})();
