#!/usr/bin/env python3
"""Gera as páginas públicas de conteúdo a partir dos textos em Markdown."""
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


def load_article(path):
    raw = path.read_text(encoding="utf-8")
    metadata, body = raw.split("\n\n", 1)
    fields = dict(line.split(": ", 1) for line in metadata.splitlines())
    if not REQUIRED.issubset(fields) or set(fields) - REQUIRED - {"modified"} or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", fields["slug"]):
        raise ValueError(f"Metadados inválidos em {path}")
    date.fromisoformat(fields["published"])
    fields["modified"] = fields.get("modified", fields["published"])
    date.fromisoformat(fields["modified"])
    if not fields["title"].endswith("?"):
        raise ValueError(f"O título deve responder a uma pergunta: {path}")
    fields["body"] = render_markdown(body)
    return fields


def render_markdown(raw):
    blocks = []
    paragraph = []
    bullets = []

    def flush():
        if paragraph:
            blocks.append(f"<p>{escape(' '.join(paragraph))}</p>")
            paragraph.clear()
        if bullets:
            blocks.append("<ul>" + "".join(f"<li>{escape(item)}</li>" for item in bullets) + "</ul>")
            bullets.clear()

    for line in raw.splitlines():
        line = line.strip()
        if not line:
            flush()
        elif line.startswith("## "):
            flush()
            blocks.append(f"<h2>{escape(line[3:])}</h2>")
        elif line.startswith("- "):
            if paragraph:
                flush()
            bullets.append(line[2:])
        else:
            if bullets:
                flush()
            paragraph.append(line)
    flush()
    return "\n".join(blocks)


def head(title, description, canonical, schema=None):
    data = ""
    if schema:
        data = '<script type="application/ld+json">' + json.dumps(schema, ensure_ascii=False).replace("<", "\\u003c") + "</script>"
    return (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{escape(title)}</title><meta name="description" content="{escape(description, quote=True)}">'
            f'<link rel="canonical" href="{canonical}">'
            '<link rel="preconnect" href="https://fonts.googleapis.com">'
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
            '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet">'
            '<link rel="stylesheet" href="/assets/ym20-public.css">'
            '<link rel="stylesheet" href="/assets/ym20-conteudos.css">'
            '<script src="/assets/ym-analytics.js?v=20260908" defer></script>' + data + '</head><body>')


NAV = ('<header class="nav wrap"><a href="/" aria-label="YM Marketing & Negócios">'
       '<img src="/assets/img/logo-ym-horizontal.webp" alt="YM Marketing & Negócios"></a>'
       '<nav aria-label="Navegação"><a href="/">Início</a><a href="/conteudos/" aria-current="page">Conteúdos</a>'
       '<a class="button small" href="/triagem/">Descobrir meu próximo passo</a></nav></header>')
FOOTER = ('<footer class="wrap footer"><img src="/assets/img/logo-ym-horizontal.webp" alt="YM">'
          '<div><a href="/">Início</a><a href="/conteudos/">Conteúdos</a><a href="/triagem/">Avaliação inicial gratuita</a></div>'
          '<small>YM Marketing & Negócios © 2026 · Marketing certo, na ordem certa.</small></footer></body></html>')


def card(article):
    return (f'<article class="content-card"><span>{escape(article["category"])}</span>'
            f'<h2><a href="/conteudos/{article["slug"]}/">{escape(article["title"])}</a></h2>'
            f'<p>{escape(article["description"])}</p>'
            f'<a class="text-link" href="/conteudos/{article["slug"]}/">Ler conteúdo</a></article>')


def build():
    articles = [load_article(path) for path in sorted(SOURCE.glob("*.md"))]
    if len({item["slug"] for item in articles}) != len(articles):
        raise ValueError("Há slugs duplicados")
    articles.sort(key=lambda item: (item["published"], item["slug"]), reverse=True)
    hub = (head("Conteúdos | YM Marketing & Negócios",
                "Respostas práticas sobre aquisição, marketing, sites e operação para decidir o próximo passo do seu negócio.",
                DOMAIN + "/conteudos/") + NAV +
           '<main><section class="content-hero"><div class="wrap"><p class="eyebrow">Conteúdos YM</p>'
           '<h1>Perguntas de negócio merecem respostas claras.</h1>'
           '<p>Leia sobre aquisição, sites, marketing e operação antes de decidir onde investir.</p></div></section>'
           '<section class="wrap content-list" aria-label="Artigos publicados"><div class="content-grid">' +
           "".join(card(article) for article in articles) +
           '</div></section><section class="closing"><div class="wrap"><h2>Quer descobrir por onde começar na sua empresa?</h2>'
           '<a class="button" href="/triagem/">Descobrir meu próximo passo</a></div></section></main>' + FOOTER)
    (ROOT / "conteudos" / "index.html").write_text(hub, encoding="utf-8")
    for article in articles:
        url = f'{DOMAIN}/conteudos/{article["slug"]}/'
        schema = {"@context": "https://schema.org", "@type": "Article", "headline": article["title"],
                  "description": article["description"], "datePublished": article["published"],
                  "dateModified": article["modified"], "mainEntityOfPage": url,
                  "author": {"@type": "Organization", "name": "YM Marketing & Negócios", "url": DOMAIN}}
        page = (head(article["title"] + " | YM Marketing & Negócios", article["description"], url, schema) + NAV +
                '<main><article><header class="content-hero"><div class="wrap"><p class="eyebrow">' + escape(article["category"]) +
                '</p><h1>' + escape(article["title"]) + '</h1><p class="content-meta">Publicado em <time datetime="' +
                article["published"] + '">' + date.fromisoformat(article["published"]).strftime("%d/%m/%Y") +
                '</time> · YM Marketing & Negócios</p></div></header><div class="wrap article-body">' + article["body"] +
                '</div><div class="wrap article-cta"><h2>Qual etapa da sua jornada precisa de atenção?</h2>'
                '<p>A avaliação inicial gratuita indica um ponto de partida para investigar sua operação.</p>'
                '<a class="button" href="/triagem/">Descobrir meu próximo passo</a></div></article>'
                '<nav class="wrap content-back" aria-label="Voltar aos conteúdos"><a href="/conteudos/">Ver todos os conteúdos</a></nav></main>' + FOOTER)
        output = ROOT / "conteudos" / article["slug"]
        output.mkdir(exist_ok=True)
        (output / "index.html").write_text(page, encoding="utf-8")

    urls = ["/", "/triagem/", "/raio-x-digital/", "/quemsomos/", "/conteudos/"] + [f'/conteudos/{item["slug"]}/' for item in articles]
    xml = ET.Element("urlset", {"xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9"})
    for path in urls:
        item = ET.SubElement(xml, "url")
        ET.SubElement(item, "loc").text = DOMAIN + path
        if path.startswith("/conteudos/") and path != "/conteudos/":
            slug = path.strip("/").split("/")[-1]
            ET.SubElement(item, "lastmod").text = next(article["modified"] for article in articles if article["slug"] == slug)
    ET.indent(xml, space="  ")
    (ROOT / "sitemap.xml").write_bytes(b'<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(xml, encoding="utf-8"))
    (ROOT / "robots.txt").write_text("User-agent: *\nAllow: /\nSitemap: " + DOMAIN + "/sitemap.xml\n", encoding="utf-8")
    print(f"Gerados {len(articles)} artigos, índice e sitemap")


if __name__ == "__main__":
    build()
