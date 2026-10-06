#!/usr/bin/env python3
"""Gera as páginas públicas de conteúdo a partir dos textos em Markdown.

Formato do arquivo em conteudos/fontes/<slug>.md:

    title: Pergunta que o empresário faz?
    description: Resumo de até ~155 caracteres para o Google.
    slug: minusculas-com-hifens
    category: Categoria curta
    published: AAAA-MM-DD
    modified: AAAA-MM-DD            (opcional)
    seo_title: Título para o Google  (opcional; padrão = title)
    related: slug-1, slug-2          (opcional)
    featured: sim                    (opcional; aparece na home)

    Corpo em Markdown simples:
    ## Subtítulo, ### Sub-subtítulo, - lista, 1. lista numerada,
    **negrito**, [texto](/link), > Na prática: destaque,
    [[CTA]] para um bloco de chamada no meio do texto,
    ## Perguntas frequentes  seguido de  ### Pergunta? + resposta  (vira FAQ no Google).
"""
from datetime import date
from html import escape
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "conteudos" / "fontes"
DOMAIN = "https://ymnegocios.com.br"
REQUIRED = {"title", "description", "slug", "category", "published"}
OPTIONAL = {"modified", "seo_title", "related", "featured"}
OG_IMAGE = DOMAIN + "/assets/img/og-ym.jpg"
VERSION = "20261006-conteudo"

STATIC_URLS = [
    ("/", "weekly", "1.0"), ("/triagem/", "monthly", "0.9"), ("/raio-x-digital/", "monthly", "0.9"),
    ("/quemsomos/", "monthly", "0.8"), ("/perguntas/", "monthly", "0.8"), ("/cdd/", "monthly", "0.7"),
    ("/conteudos/", "weekly", "0.8"), ("/impacto/", "yearly", "0.4"), ("/termos/", "yearly", "0.3"),
]


def inline(text):
    """Escapa o texto e aplica **negrito** e [link](url)."""
    out = escape(text, quote=False)
    out = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", out)

    def link(m):
        label, url = m.group(1), m.group(2)
        external = url.startswith("http") and not url.startswith(DOMAIN)
        attrs = ' target="_blank" rel="noopener"' if external else ""
        return f'<a href="{escape(url, quote=True)}"{attrs}>{label}</a>'
    return re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", link, out)


def plain(text):
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    return re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r"\1", text)


CTA_MID = ('<aside class="article-inline-cta"><p class="eyebrow">Antes de decidir</p>'
           '<p><strong>Não sabe por onde começar?</strong> A avaliação inicial gratuita leva cerca de 4 minutos '
           'e mostra o ponto de partida do seu negócio.</p>'
           '<a class="button" href="/triagem/?utm_source=site&utm_medium=artigo&utm_campaign=cta_meio">Fazer a avaliação gratuita</a></aside>')


def render_markdown(raw):
    blocks, paragraph, bullets, numbered, quote = [], [], [], [], []
    faq, in_faq, current_q = [], False, None

    def flush():
        nonlocal current_q
        if paragraph:
            txt = " ".join(paragraph)
            blocks.append(f"<p>{inline(txt)}</p>")
            if in_faq and current_q is not None:
                current_q["a"].append(plain(txt))
            paragraph.clear()
        if bullets:
            blocks.append("<ul>" + "".join(f"<li>{inline(i)}</li>" for i in bullets) + "</ul>")
            if in_faq and current_q is not None:
                current_q["a"].append(" ".join(plain(i) for i in bullets))
            bullets.clear()
        if numbered:
            blocks.append("<ol>" + "".join(f"<li>{inline(i)}</li>" for i in numbered) + "</ol>")
            if in_faq and current_q is not None:
                current_q["a"].append(" ".join(plain(i) for i in numbered))
            numbered.clear()
        if quote:
            blocks.append('<div class="article-callout">' + "".join(f"<p>{inline(q)}</p>" for q in quote) + "</div>")
            quote.clear()

    for line in raw.splitlines():
        line = line.strip()
        if not line:
            flush()
        elif line == "[[CTA]]":
            flush(); blocks.append(CTA_MID)
        elif line.startswith("## "):
            flush()
            title = line[3:]
            in_faq = title.lower().startswith("perguntas frequentes")
            current_q = None
            blocks.append(f"<h2>{inline(title)}</h2>")
        elif line.startswith("### "):
            flush()
            q = line[4:]
            blocks.append(f"<h3>{inline(q)}</h3>")
            if in_faq:
                current_q = {"q": plain(q), "a": []}
                faq.append(current_q)
        elif line.startswith("- "):
            if paragraph or numbered or quote:
                flush()
            bullets.append(line[2:])
        elif re.match(r"^\d+\.\s", line):
            if paragraph or bullets or quote:
                flush()
            numbered.append(re.sub(r"^\d+\.\s", "", line))
        elif line.startswith("> "):
            if paragraph or bullets or numbered:
                flush()
            quote.append(line[2:])
        else:
            if bullets or numbered or quote:
                flush()
            paragraph.append(line)
    flush()
    return "\n".join(blocks), [f for f in faq if f["a"]]


def load_article(path):
    raw = path.read_text(encoding="utf-8")
    metadata, body = raw.split("\n\n", 1)
    fields = dict(line.split(": ", 1) for line in metadata.splitlines())
    if not REQUIRED.issubset(fields) or set(fields) - REQUIRED - OPTIONAL or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", fields["slug"]):
        raise ValueError(f"Metadados inválidos em {path}")
    date.fromisoformat(fields["published"])
    fields["modified"] = fields.get("modified", fields["published"])
    date.fromisoformat(fields["modified"])
    if not fields["title"].endswith("?"):
        raise ValueError(f"O título deve responder a uma pergunta: {path}")
    fields["seo_title"] = fields.get("seo_title", fields["title"])
    fields["related"] = [s.strip() for s in fields.get("related", "").split(",") if s.strip()]
    fields["featured"] = fields.get("featured", "").lower() == "sim"
    fields["body"], fields["faq"] = render_markdown(body)
    fields["words"] = len(re.findall(r"\w+", body))
    return fields


def head(title, description, canonical, schema=None, og_type="website", extra=""):
    data = ""
    if schema:
        data = '<script type="application/ld+json">' + json.dumps(schema, ensure_ascii=False).replace("<", "\\u003c") + "</script>"
    t, d = escape(title, quote=True), escape(description, quote=True)
    return (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{escape(title)}</title><meta name="description" content="{d}">'
            f'<link rel="canonical" href="{canonical}">'
            '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">'
            f'<meta property="og:type" content="{og_type}"><meta property="og:locale" content="pt_BR">'
            '<meta property="og:site_name" content="YM Marketing &amp; Negócios">'
            f'<meta property="og:url" content="{canonical}"><meta property="og:title" content="{t}">'
            f'<meta property="og:description" content="{d}"><meta property="og:image" content="{OG_IMAGE}">'
            '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
            f'<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{t}">'
            f'<meta name="twitter:description" content="{d}"><meta name="twitter:image" content="{OG_IMAGE}">'
            '<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" href="/assets/img/ym-app-icon.svg" type="image/svg+xml">'
            '<link rel="apple-touch-icon" href="/apple-touch-icon.png"><meta name="theme-color" content="#0b1533">' + extra +
            '<link rel="preconnect" href="https://fonts.googleapis.com">'
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
            '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet">'
            '<link rel="stylesheet" href="/assets/ym20-public.css?v=20260929-visual1">'
            f'<link rel="stylesheet" href="/assets/ym20-conteudos.css?v={VERSION}">'
            '<script src="/assets/ym-analytics.js?v=20260929-funil1" defer></script>'
            f'<script src="/assets/ym-newsletter.js?v={VERSION}" defer></script>' + data + '</head><body>')


def nav(current):
    def a(href, label, key):
        cur = ' aria-current="page"' if key == current else ""
        return f'<a href="{href}"{cur}>{label}</a>'
    return ('<header class="nav wrap"><a href="/" aria-label="YM Marketing &amp; Negócios, página inicial">'
            '<img src="/assets/img/logo-ym-horizontal.webp" alt="YM Marketing &amp; Negócios" width="160" height="50"></a>'
            '<nav aria-label="Navegação">' + a("/", "Início", "home") + a("/conteudos/", "Conteúdos", "conteudos") +
            a("/perguntas/", "Perguntas", "perguntas") +
            '<a class="button small" href="/triagem/">Avaliação gratuita</a></nav></header>')


FOOTER = ('<footer class="wrap footer"><a href="/" aria-label="Página inicial da YM"><img src="/assets/img/logo-ym-horizontal.webp" alt="YM Marketing &amp; Negócios" width="160" height="50" loading="lazy"></a>'
          '<div><a href="/">Início</a><a href="/conteudos/">Conteúdos</a><a href="/perguntas/">Perguntas frequentes</a>'
          '<a href="/raio-x-digital/">Raio-X Digital</a><a href="/quemsomos/">Quem somos</a><a href="/termos/">Termos e privacidade</a></div>'
          '<small>Marketing certo, na ordem certa.<span class="legal">YM Marketing &amp; Negócios · CNPJ 65.606.945/0001-05 · Belo Horizonte (MG) · WhatsApp (31) 97507-3862 · © 2026</span></small></footer></body></html>')

AUTHOR = ('<aside class="article-author"><img src="/assets/img/yasmin-hero.webp" alt="Yasmin Menezes" width="72" height="84" loading="lazy">'
          '<div><p><strong>Yasmin Menezes</strong> · Fundadora da YM Marketing &amp; Negócios</p>'
          '<p>Formada em Marketing, com quase 20 anos entre marketing, operações, atendimento e tecnologia. '
          'Criou o Método VOS (Ver, Ordenar e Sustentar) para ajudar empresários a decidir o que fazer primeiro.</p>'
          '<a class="text-link" href="/quemsomos/">Conhecer a YM</a></div></aside>')


def card(article, tag="h2"):
    return (f'<article class="content-card"><span>{escape(article["category"])}</span>'
            f'<{tag}><a href="/conteudos/{article["slug"]}/">{escape(article["title"])}</a></{tag}>'
            f'<p>{escape(article["description"])}</p>'
            f'<a class="text-link" href="/conteudos/{article["slug"]}/">Ler conteúdo</a></article>')


def build():
    articles = [load_article(path) for path in sorted(SOURCE.glob("*.md"))]
    by_slug = {a["slug"]: a for a in articles}
    if len(by_slug) != len(articles):
        raise ValueError("Há slugs duplicados")
    for a in articles:
        for rel in a["related"]:
            if rel not in by_slug:
                raise ValueError(f'Relacionado inexistente "{rel}" em {a["slug"]}')
    articles.sort(key=lambda item: (item["published"], item["slug"]), reverse=True)

    # Índice
    hub_schema = {"@context": "https://schema.org", "@graph": [
        {"@type": "CollectionPage", "url": DOMAIN + "/conteudos/", "name": "Conteúdos YM", "inLanguage": "pt-BR",
         "publisher": {"@id": DOMAIN + "/#org"},
         "hasPart": [{"@type": "Article", "headline": a["title"], "url": f'{DOMAIN}/conteudos/{a["slug"]}/'} for a in articles]},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Início", "item": DOMAIN + "/"},
            {"@type": "ListItem", "position": 2, "name": "Conteúdos", "item": DOMAIN + "/conteudos/"}]}]}
    hub = (head("Conteúdos sobre marketing para empresários | YM Marketing & Negócios",
                "Guias práticos para decidir antes de investir: quanto custa marketing, como escolher agência ou consultoria, prazos, contratos e como medir resultado.",
                DOMAIN + "/conteudos/", hub_schema) + nav("conteudos") +
           '<main><section class="content-hero"><div class="wrap"><p class="eyebrow">Conteúdos YM</p>'
           '<h1>Respostas claras para decidir antes de investir em marketing.</h1>'
           '<p>Quanto custa, quanto tempo leva, como escolher, o que exigir no contrato e como medir resultado. '
           'Guias escritos para quem decide, não para quem é do marketing.</p></div></section>'
           '<section class="wrap content-list" aria-label="Artigos publicados"><div class="content-grid">' +
           "".join(card(a) for a in articles) +
           '</div><p class="content-more"><a class="text-link" href="/perguntas/">Ver as 50 perguntas mais comuns antes de contratar marketing →</a></p></section>'
           '<div class="wrap"><div data-ym-newsletter></div></div>'
           '<section class="closing"><div class="wrap"><h2>Quer descobrir por onde começar na sua empresa?</h2>'
           '<a class="button" href="/triagem/?utm_source=site&utm_medium=conteudos&utm_campaign=hub">Fazer a avaliação gratuita</a></div></section></main>' + FOOTER)
    (ROOT / "conteudos" / "index.html").write_text(hub, encoding="utf-8")

    for article in articles:
        url = f'{DOMAIN}/conteudos/{article["slug"]}/'
        graph = [
            {"@type": "Article", "headline": article["title"], "description": article["description"],
             "datePublished": article["published"], "dateModified": article["modified"], "mainEntityOfPage": url,
             "image": OG_IMAGE, "inLanguage": "pt-BR", "wordCount": article["words"], "articleSection": article["category"],
             "author": {"@type": "Person", "@id": DOMAIN + "/#yasmin", "name": "Yasmin Menezes", "url": DOMAIN + "/quemsomos/"},
             "publisher": {"@type": "Organization", "@id": DOMAIN + "/#org", "name": "YM Marketing & Negócios",
                           "logo": {"@type": "ImageObject", "url": DOMAIN + "/assets/img/icon-512.png"}}},
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Início", "item": DOMAIN + "/"},
                {"@type": "ListItem", "position": 2, "name": "Conteúdos", "item": DOMAIN + "/conteudos/"},
                {"@type": "ListItem", "position": 3, "name": article["title"], "item": url}]},
        ]
        if article["faq"]:
            graph.append({"@type": "FAQPage", "mainEntity": [
                {"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": " ".join(f["a"])}}
                for f in article["faq"]]})
        schema = {"@context": "https://schema.org", "@graph": graph}
        rel = [by_slug[s] for s in article["related"]] or [a for a in articles if a["slug"] != article["slug"]][:3]
        related = ('<section class="wrap article-related" aria-label="Leia também"><h2>Leia também</h2><div class="content-grid">' +
                   "".join(card(r, "h3") for r in rel[:3]) + '</div></section>')
        published_br = date.fromisoformat(article["published"]).strftime("%d/%m/%Y")
        updated = ""
        if article["modified"] != article["published"]:
            updated = ' · Atualizado em <time datetime="' + article["modified"] + '">' + date.fromisoformat(article["modified"]).strftime("%d/%m/%Y") + '</time>'
        page = (head(article["seo_title"] + " | YM Marketing & Negócios", article["description"], url, schema, "article",
                     f'<meta property="article:published_time" content="{article["published"]}"><meta property="article:modified_time" content="{article["modified"]}"><meta property="article:author" content="Yasmin Menezes">') +
                nav("conteudos") +
                '<main><article><header class="content-hero"><div class="wrap">'
                '<nav class="crumbs" aria-label="Você está em"><a href="/">Início</a> › <a href="/conteudos/">Conteúdos</a></nav>'
                '<p class="eyebrow">' + escape(article["category"]) + '</p><h1>' + escape(article["title"]) + '</h1>'
                '<p class="content-meta">Por <a href="/quemsomos/">Yasmin Menezes</a> · Publicado em <time datetime="' +
                article["published"] + '">' + published_br + '</time>' + updated + ' · ' + str(max(1, round(article["words"] / 200))) +
                ' min de leitura</p></div></header><div class="wrap article-body">' + article["body"] + AUTHOR + '</div>'
                '<div class="wrap article-cta"><p class="eyebrow">Próximo passo</p><h2>Descubra o que o seu negócio precisa resolver primeiro.</h2>'
                '<p>A avaliação inicial é gratuita, leva cerca de 4 minutos e indica o ponto de partida antes de qualquer investimento.</p>'
                '<a class="button" href="/triagem/?utm_source=site&utm_medium=artigo&utm_campaign=cta_final">Fazer a avaliação gratuita</a></div>'
                '</article><div class="wrap"><div data-ym-newsletter></div></div>' + related +
                '<nav class="wrap content-back" aria-label="Voltar aos conteúdos"><a href="/conteudos/">Ver todos os conteúdos</a></nav></main>' + FOOTER)
        output = ROOT / "conteudos" / article["slug"]
        output.mkdir(exist_ok=True)
        (output / "index.html").write_text(page, encoding="utf-8")

    # Sitemap (o robots.txt é mantido à mão e não é alterado aqui)
    today = max(a["modified"] for a in articles)
    xml = ET.Element("urlset", {"xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9"})
    for path, freq, prio in STATIC_URLS:
        item = ET.SubElement(xml, "url")
        ET.SubElement(item, "loc").text = DOMAIN + path
        ET.SubElement(item, "lastmod").text = today
        ET.SubElement(item, "changefreq").text = freq
        ET.SubElement(item, "priority").text = prio
    for a in sorted(articles, key=lambda x: x["slug"]):
        item = ET.SubElement(xml, "url")
        ET.SubElement(item, "loc").text = f'{DOMAIN}/conteudos/{a["slug"]}/'
        ET.SubElement(item, "lastmod").text = a["modified"]
        ET.SubElement(item, "changefreq").text = "monthly"
        ET.SubElement(item, "priority").text = "0.7"
    ET.indent(xml, space="  ")
    (ROOT / "sitemap.xml").write_bytes(b'<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(xml, encoding="utf-8"))
    print(f"Gerados {len(articles)} artigos, índice e sitemap")
    for a in articles:
        print(f'  {a["slug"]}: {a["words"]} palavras, FAQ {len(a["faq"])}')


if __name__ == "__main__":
    build()
