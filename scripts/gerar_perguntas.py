#!/usr/bin/env python3
"""Gera /perguntas/ — as 50 perguntas que empresários fazem antes de contratar marketing."""
from html import escape
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from gerar_conteudos import head, nav, FOOTER, DOMAIN  # noqa: E402

C = "/conteudos/"
A = {  # atalhos para artigos
    "vale": C + "marketing-digital-vale-a-pena/", "insta": C + "por-que-o-instagram-nao-vende/",
    "site": C + "por-que-meu-site-nao-gera-clientes/", "ag_cons": C + "agencia-ou-consultoria-de-marketing/",
    "func": C + "agencia-ou-funcionario-de-marketing/", "entrega": C + "o-que-agencia-de-marketing-entrega/",
    "custo": C + "quanto-custa-agencia-de-marketing/", "prazo": C + "quanto-tempo-marketing-da-resultado/",
    "medir": C + "como-medir-resultado-do-marketing/", "escolher": C + "como-escolher-agencia-de-marketing/",
    "cons": C + "como-escolher-consultoria-de-marketing/", "perguntas": C + "perguntas-antes-de-contratar-agencia-de-marketing/",
    "contrato": C + "contrato-agencia-de-marketing/", "triagem": "/triagem/", "cdd": "/cdd/", "rx": "/raio-x-digital/",
}

STAGES = [
    ("problema", "1. Entender o problema", "Antes de pensar em contratar: por que as vendas não vêm?", [
        ("Marketing digital vale a pena para pequenas empresas?", "Vale quando a oferta está clara, o preço dá margem e o atendimento responde rápido. Sem essas três coisas, o investimento gera movimento, mas não necessariamente venda.", "vale"),
        ("Por que minhas vendas não aumentam com o Instagram?", "Normalmente falta clareza sobre o que você vende, prova de que você entrega, um caminho fácil até o contato ou resposta rápida. Seguidores sozinhos não geram vendas.", "insta"),
        ("Como fazer minha empresa aparecer no Google?", "Complete o Google Perfil da Empresa (categoria, horário, fotos, serviços), peça avaliações aos clientes e tenha um site com páginas que respondem às perguntas que as pessoas pesquisam.", "insta"),
        ("Como conseguir mais clientes para minha empresa?", "Descubra de onde vêm os clientes que você já tem e em que ponto os outros desistem. Reforce o canal que funciona e corrija a etapa onde as pessoas param antes de abrir canais novos.", "vale"),
        ("Como divulgar minha empresa na internet?", "Comece pelo básico bem feito: Google Perfil da Empresa completo, um perfil que explique o que você vende e um canal de contato que responda rápido. Depois, teste anúncios com uma verba de aprendizado.", "vale"),
        ("Por que meu anúncio não vende?", "As causas mais comuns são público errado, oferta pouco clara, página ou perfil que não convence e atendimento lento. Confira cada etapa antes de aumentar a verba.", "prazo"),
        ("Como vender mais pelo Instagram?", "Deixe a oferta clara na bio, coloque um botão de WhatsApp com mensagem pronta, fixe depoimentos, responda rápido e publique conteúdo que responde às dúvidas de quem compra.", "insta"),
        ("Preciso mesmo investir em marketing digital?", "Na maioria dos negócios, sim, porque os clientes pesquisam online antes de comprar. O investimento pode começar pequeno e focado nos canais onde o seu cliente decide.", "vale"),
        ("Minha empresa precisa de uma agência de marketing?", "Precisa se você já sabe o que deve ser feito e falta braço para executar. Se ainda não sabe onde está o problema, um diagnóstico antes evita pagar por ações que não resolvem.", "ag_cons"),
    ]),
    ("opcoes", "2. Entender as opções", "Agência, consultoria, freelancer, social media ou funcionário?", [
        ("O que uma agência de marketing faz?", "Planeja e executa ações como conteúdo para redes sociais, anúncios, sites e relatórios. O que ela entrega depende do pacote contratado, que deve estar escrito com quantidade e frequência.", "entrega"),
        ("O que faz uma consultoria de marketing?", "Investiga o negócio, descobre onde a empresa perde clientes e define o que fazer primeiro. O resultado é um diagnóstico e uma ordem de prioridades para quem vai executar.", "ag_cons"),
        ("Qual a diferença entre agência e consultoria de marketing?", "A agência executa (posts, anúncios, sites). A consultoria diagnostica e orienta. A consultoria responde o que fazer e em que ordem; a agência responde como fazer.", "ag_cons"),
        ("Agência ou freelancer de marketing?", "Freelancer é bom para uma tarefa específica e costuma ser mais flexível. Agência reúne várias habilidades. Os dois dependem de alguém dizer o que precisa ser feito.", "ag_cons"),
        ("Contratar funcionário ou agência de marketing?", "Funcionário faz sentido quando há trabalho contínuo e alguém para orientar prioridades. Agência ou especialistas externos atendem um escopo definido sem montar equipe.", "func"),
        ("Agência de marketing ou social media?", "Social media cuida das redes sociais. Agência costuma oferecer um conjunto maior, como anúncios, site e campanhas. Escolha pelo problema que precisa resolver.", "ag_cons"),
        ("Qual profissional devo contratar para cuidar do marketing?", "Depende da etapa que trava suas vendas. Se não sabe qual é, comece por um diagnóstico. Depois contrate quem executa aquela etapa: conteúdo, anúncios, site ou atendimento.", "ag_cons"),
        ("Agência de marketing faz o quê, exatamente?", "Cria e publica conteúdo, configura e otimiza anúncios, acompanha números e ajusta a estratégia. Peça um calendário mensal e uma lista de entregas para saber o que está sendo feito.", "entrega"),
        ("Consultoria de marketing serve para quê?", "Para descobrir onde a empresa perde clientes, tempo e dinheiro, decidir o que fazer primeiro e organizar os indicadores antes de gastar com execução.", "ag_cons"),
    ]),
    ("preco", "3. Preço e retorno", "Quanto custa, quanto investir e quando o retorno aparece.", [
        ("Quanto custa contratar uma agência de marketing?", "Não há preço único: depende do escopo, da complexidade do negócio e do que está incluso. Peça propostas com honorário, verba de mídia, produção e ferramentas separados.", "custo"),
        ("Quanto custa uma consultoria de marketing?", "Costuma ser cobrada por projeto (diagnóstico ou plano) ou por acompanhamento mensal, conforme a profundidade. Na YM, a avaliação inicial é gratuita e o Raio-X Digital custa R$ 97.", "custo"),
        ("Quanto custa marketing digital por mês?", "Varia conforme o que é feito: redes sociais, anúncios, site, produção e acompanhamento têm custos diferentes. Compare propostas pelos componentes, não só pelo valor final.", "custo"),
        ("Quanto custa contratar social media?", "Geralmente é um pacote mensal que muda conforme quantidade de posts, formatos (vídeo custa mais) e número de redes. Confirme se produção e anúncios estão inclusos.", "custo"),
        ("Quanto custa gestão de tráfego pago?", "A gestão é cobrada à parte da verba de anúncios, por valor fixo, porcentagem da verba ou combinação dos dois. Pergunte o modelo e o que muda se a verba aumentar.", "custo"),
        ("Quanto devo investir em anúncios no Google?", "Calcule quanto você pode pagar por um cliente sem perder dinheiro e multiplique pelos clientes que quer por mês. Comece com uma verba que aceita usar como teste por dois ou três meses.", "custo"),
        ("Quanto investir em tráfego pago por mês?", "Use a mesma conta: custo aceitável por cliente vezes clientes desejados. E garanta antes que alguém vai atender rápido quem chamar, senão a verba se perde.", "custo"),
        ("Agência de marketing cobra porcentagem da mídia?", "Algumas cobram porcentagem da verba de anúncios, outras valor fixo e outras combinam. O importante é estar escrito no contrato.", "custo"),
        ("O que está incluso no valor da agência de marketing?", "Somente o que estiver na proposta. Peça a lista de entregas com quantidade, frequência, prazo e responsável, e confirme o que é cobrado à parte.", "entrega"),
        ("Marketing digital dá retorno mesmo?", "Dá, quando a oferta é clara, o atendimento é rápido e os resultados são medidos. Sem isso, o investimento gera movimento, mas não necessariamente venda.", "vale"),
        ("Em quanto tempo o marketing digital começa a dar resultado?", "Anúncios trazem contatos em dias, mas levam de 4 a 8 semanas para se ajustar. Conteúdo, redes e Google levam meses, porque constroem confiança e presença.", "prazo"),
        ("Agência de marketing garante resultado?", "Não deveria garantir vendas, que dependem do seu preço, atendimento e mercado. Deve garantir entregas, transparência e acompanhamento dos indicadores combinados.", "prazo"),
        ("Quanto tempo leva para conseguir clientes com tráfego pago?", "Os primeiros contatos podem vir na primeira semana. Um custo por cliente estável costuma levar algumas semanas de teste e ajuste.", "prazo"),
        ("Como medir o resultado do marketing digital?", "Acompanhe investimento, contatos, custo por contato, taxa de conversão, vendas e custo para conquistar um cliente. Registre a origem de cada contato.", "medir"),
        ("Quais métricas devo acompanhar no marketing?", "As que mostram dinheiro: contatos, custo por contato, conversão, vendas, custo por cliente e retorno. Seguidores e curtidas são contexto, não decisão.", "medir"),
        ("Como calcular o retorno do investimento em marketing?", "Subtraia o investimento da margem gerada pelas vendas vindas do marketing e divida pelo investimento. Use a margem, não o faturamento.", "medir"),
    ]),
    ("confianca", "4. Confiança e riscos", "Como avaliar a agência e se proteger antes de assinar.", [
        ("Como saber se uma agência de marketing é boa?", "Veja se ela entende o seu problema antes de propor, mostra cases com números, põe escopo e relatórios no contrato e não promete resultado garantido.", "escolher"),
        ("Como escolher uma agência de marketing digital?", "Defina o problema, peça pelo menos três propostas, compare com os mesmos critérios e exija contrato com escopo, relatórios e regras de saída.", "escolher"),
        ("Como escolher uma consultoria de marketing?", "Escolha quem entende como sua empresa atrai clientes, transforma interesse em proposta e acompanha resultados, com método, responsabilidades claras e indicadores definidos.", "cons"),
        ("O que perguntar para uma agência de marketing?", "O que precisa saber do seu negócio, o que entrega por mês, o que está incluso no preço, quais indicadores acompanha, como funciona o cancelamento e de quem são as contas.", "perguntas"),
        ("Como analisar o portfólio de uma agência?", "Peça casos parecidos com o seu e pergunte a situação antes, o que foi feito e qual número mudou. Peças bonitas sem resultado mostram estética, não desempenho.", "perguntas"),
        ("Como saber se os cases da agência são verdadeiros?", "Peça para falar com o cliente, confira se a empresa existe e se a agência aparece nas redes do cliente. Desconfie de números altos sem contexto.", "perguntas"),
        ("Agência de marketing é confiável?", "Depende da agência. Consulte CNPJ e reputação, peça referências e não assine sem escopo escrito. Desconfie de pressa para fechar e de promessa de faturamento.", "escolher"),
        ("Como evitar golpe de agência de marketing?", "Confira CNPJ e reputação, desconfie de resultado garantido e de pagamento total adiantado, mantenha as contas no nome da empresa e só assine com escopo escrito.", "contrato"),
        ("Agência de marketing prometeu resultado e não entregou, o que fazer?", "Separe vendas (que ninguém controla sozinho) de entregas combinadas. Registre por escrito o que faltou, peça correção com prazo e, se não houver, use a saída por descumprimento.", "contrato"),
        ("Agência de marketing precisa ter contrato?", "Precisa. O contrato define escopo, valores, relatórios, prazo, cancelamento e propriedade das contas. Sem ele, fica difícil cobrar entregas.", "contrato"),
        ("Contrato com agência de marketing tem fidelidade?", "Muitos têm prazo mínimo. Negocie multa proporcional ao tempo restante e saída sem multa se as entregas combinadas não forem cumpridas.", "contrato"),
        ("Como cancelar contrato com agência de marketing?", "Siga a cláusula de cancelamento, avise por escrito, peça a transferência de acessos e materiais e confirme que você é administrador principal das contas.", "contrato"),
    ]),
    ("contratar", "5. Escolher e contratar", "Checklist final antes de fechar.", [
        ("O que deve estar no contrato de marketing digital?", "Escopo com entregas e prazos, responsabilidades, valores separados, relatórios, prazo e renovação, cancelamento, propriedade das contas e cuidados com dados pessoais.", "contrato"),
        ("Que perguntas fazer antes de contratar uma agência?", "Sobre diagnóstico, entregas, preço, resultados, relatórios e contrato. Use as mesmas perguntas com todas as agências para comparar de forma justa.", "perguntas"),
        ("Como comparar propostas de agências de marketing?", "Organize numa tabela: problema identificado, entregas, preço com componentes separados, indicadores, relatórios e condições de contrato. Compare o que cada uma inclui.", "perguntas"),
        ("Como contratar uma agência de marketing em Belo Horizonte?", "Defina o problema, peça três propostas, compare com os mesmos critérios e exija contrato claro. Prefira quem entende a realidade local: indicação, WhatsApp e Google Perfil da Empresa.", "escolher"),
    ]),
]


def build():
    total = sum(len(s[3]) for s in STAGES)
    faq_entities, sections = [], []
    for sid, title, sub, items in STAGES:
        rows = []
        for q, a, key in items:
            href = A[key]
            faq_entities.append({"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a + f" Saiba mais em {DOMAIN}{href}"}})
            rows.append(f'<details><summary>{escape(q)}</summary><p>{escape(a)} <a href="{href}">Leia o guia completo →</a></p></details>')
        sections.append(f'<h2 id="{sid}">{escape(title)}</h2><p class="faq-sub">{escape(sub)}</p>' + "".join(rows))
    schema = {"@context": "https://schema.org", "@graph": [
        {"@type": "FAQPage", "@id": DOMAIN + "/perguntas/#faq", "url": DOMAIN + "/perguntas/", "name": "Perguntas antes de contratar marketing",
         "inLanguage": "pt-BR", "publisher": {"@id": DOMAIN + "/#org"}, "mainEntity": faq_entities},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Início", "item": DOMAIN + "/"},
            {"@type": "ListItem", "position": 2, "name": "Perguntas", "item": DOMAIN + "/perguntas/"}]}]}
    toc = "".join(f'<a href="#{sid}">{escape(t)}</a>' for sid, t, _, _ in STAGES)
    html = (head(f"{total} perguntas antes de contratar agência ou consultoria de marketing | YM",
                 "Respostas diretas às perguntas mais buscadas por empresários antes de contratar marketing: preço, prazo, retorno, contrato, agência ou consultoria.",
                 DOMAIN + "/perguntas/", schema) + nav("perguntas") +
            '<main><section class="content-hero"><div class="wrap"><p class="eyebrow">Perguntas frequentes</p>'
            f'<h1>{total} perguntas que todo empresário faz antes de contratar marketing.</h1>'
            '<p>Respostas diretas, organizadas pela ordem em que as dúvidas aparecem: do problema à assinatura do contrato.</p></div></section>'
            '<section class="wrap faq-hub"><nav class="faq-toc" aria-label="Etapas">' + toc + '</nav>' + "".join(sections) +
            '</section><div class="wrap"><div data-ym-newsletter></div></div>'
            '<section class="closing"><div class="wrap"><p class="eyebrow">Ainda com dúvida?</p><h2>Descubra o que o seu negócio precisa resolver primeiro.</h2>'
            '<a class="button" href="/triagem/?utm_source=site&utm_medium=perguntas&utm_campaign=cta_final">Fazer a avaliação gratuita</a></div></section></main>' + FOOTER)
    out = ROOT / "perguntas"
    out.mkdir(exist_ok=True)
    (out / "index.html").write_text(html, encoding="utf-8")
    print(f"/perguntas/ gerada com {total} perguntas")


if __name__ == "__main__":
    build()
