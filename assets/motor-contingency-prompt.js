(()=>{
  const STYLE_ID='ymMotorContingencyStyles';
  if(!document.getElementById(STYLE_ID)){
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      .ai-contingency-btn{border-color:#d7b35a!important;background:#fffaf0!important;color:#76530a!important}
      .contingency-modal{position:fixed;inset:0;z-index:99999;background:rgba(6,24,42,.68);display:grid;place-items:center;padding:16px}
      .contingency-card{width:min(920px,100%);max-height:92vh;display:flex;flex-direction:column;background:#fff;border:1px solid #dfe6ee;border-radius:18px;box-shadow:0 28px 80px rgba(0,0,0,.28);overflow:hidden}
      .contingency-head{padding:14px 16px;background:linear-gradient(135deg,#0a2540,#174c78);color:#fff;display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      .contingency-head b{font:800 12px Montserrat}.contingency-head p{font-size:9px;line-height:1.5;color:#cfdeea;margin:4px 0 0}.contingency-close{border:0;background:rgba(255,255,255,.12);color:#fff;border-radius:9px;width:34px;height:34px;cursor:pointer;font-size:18px}
      .contingency-body{padding:14px 16px;overflow:auto}.contingency-note{font-size:9.5px;line-height:1.5;color:#526b80;background:#fff8e9;border:1px solid #efdfbb;border-radius:10px;padding:9px 10px;margin-bottom:9px}
      .contingency-text{width:100%;min-height:430px;box-sizing:border-box;border:1px solid #ccd8e4;border-radius:12px;padding:12px;font:10px/1.5 Inter,Arial,sans-serif;color:#243f56;background:#fbfcfe;resize:vertical}
      .contingency-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.contingency-actions .ym-btn{flex:0 0 auto}
      @media(max-width:700px){.contingency-modal{padding:8px}.contingency-card{max-height:96vh;border-radius:14px}.contingency-text{min-height:52vh}.contingency-actions .ym-btn{flex:1 1 150px}}
    `;
    document.head.appendChild(s);
  }

  const val=id=>document.getElementById(id)?.value;
  const p8Current=p=>{
    const c=p.p8_code,check={...(p.application_checklist||{})};
    for(let i=1;i<=4;i++){
      const v=val(`pq_${c}_${i}`);
      if(v!==undefined) check['q'+i]=v;
    }
    return{
      p8_code:p.p8_code||'',
      p8_label:p.p8_label||'',
      human_status:p.human_status||'',
      classification:val('pc_'+c)??p.classification??'',
      confidence:val('pf_'+c)??p.confidence??'',
      observation:val('po_'+c)??p.observation??'',
      evidence_summary:val('pe_'+c)??p.evidence_summary??'',
      remaining_validation:val('pr_'+c)??p.remaining_validation??'',
      application_checklist:check
    };
  };
  const pickEntry=e=>({
    p8_code:e?.p8_code||'',
    tipo:e?.ver_field||e?.evidence_type||e?.conclusion_type||'',
    title:e?.title||'',
    statement:e?.statement||'',
    content:e?.content||'',
    classification:e?.classification||'',
    confidence:e?.confidence||'',
    human_status:e?.human_status||'',
    reliability:e?.reliability||'',
    source_type:e?.source_type||'',
    source_ref:e?.source_ref||''
  });
  const pickHyp=h=>({
    id:h?.id||'',
    p8_code:h?.p8_code||'',
    statement:h?.statement||'',
    status:h?.status||'',
    confidence:h?.confidence||'',
    tests:(h?.tests||[]).map(t=>({
      id:t?.id||'',
      test_description:t?.test_description||'',
      method:t?.method||'',
      expected_evidence:t?.expected_evidence||'',
      result_summary:t?.result_summary||'',
      result_classification:t?.result_classification||''
    }))
  });
  function buildContext(hid){
    const b=bundle||{},c=b.case||{},selected=(b.hypotheses||[]).find(h=>h.id===hid);
    if(!selected) throw new Error('Hipótese não encontrada no caso aberto.');
    return{
      caso:{
        business_name:c.business_name||c.client_ref||'',
        client_name:c.client_name||'',
        status:c.status||'',
        destination_short_term:val('dest')??c.destination_short_term??'',
        destination_success_signal:val('signal')??c.destination_success_signal??''
      },
      cobertura_8ps:(b.p8_coverage||[]).map(p8Current),
      mapa_ver:(b.ver_entries||[]).map(pickEntry),
      evidencias:(b.evidence||[]).map(pickEntry),
      hipotese_em_analise:pickHyp(selected),
      outras_hipoteses:(b.hypotheses||[]).filter(h=>h.id!==hid).map(h=>({p8_code:h.p8_code||'',statement:h.statement||'',status:h.status||'',confidence:h.confidence||''})),
      conclusoes_humanas_existentes:(b.conclusions||[]).map(pickEntry)
    };
  }
  function buildPrompt(hid){
    const ctx=buildContext(hid);
    return `Você está atuando como CAMADA DE ANÁLISE ASSISTIDA do MOTOR VOS da YM Marketing & Negócios.\n\nSeu papel é AJUDAR O APLICADOR HUMANO A PENSAR sobre uma hipótese causal já registrada. Você recebe abaixo o Destino, cobertura humana dos 8Ps, mapa VER, evidências, hipótese selecionada, testes e demais informações disponíveis no caso.\n\nREGRAS INVIOLÁVEIS\n1. Você NÃO valida causa, NÃO aprova hipótese, NÃO aprova Gate e NÃO prioriza ORDENAR. A decisão final é humana.\n2. Não trate DISFUNÇÃO como causa. Disfunção é uma condição observada que pode ou não contribuir para o destino.\n3. LACUNA e INCONCLUSIVO são limites de informação, nunca defeitos automáticos.\n4. Use SOMENTE os dados fornecidos. Não invente métricas, comportamento de clientes, perdas, conversões, fatos externos ou evidências que não estejam no caso.\n5. Diferencie claramente EVIDÊNCIA, HIPÓTESE, INFERÊNCIA e DADO AINDA DESCONHECIDO.\n6. Os 8Ps são cobertura de análise; NÃO são score e a menor classificação não deve ser transformada automaticamente em causa.\n7. A investigação busca identificar a causa predominante ou o conjunto de fatores causais prioritários que pode estar impedindo o avanço ao Destino.\n8. Se não houver base suficiente, diga INCONCLUSIVO. “Não sei” e “não verificado” significam que falta informação.\n9. Linguagem em português simples, direta, consultiva e operacional. Evite jargão desnecessário.\n10. Não recomende produto ou serviço da YM nesta etapa. O objetivo é investigação.\n11. Considere a hipótese selecionada dentro do contexto do caso inteiro e verifique se outras informações a sustentam, contradizem ou mostram que ainda é cedo para concluir.\n\nENTREGUE A RESPOSTA NESTA ESTRUTURA\n\nO QUE A IA ESTÁ VENDO\nExplique em 2 a 4 parágrafos curtos o que os dados realmente mostram e conecte a leitura ao Destino.\n\nHIPÓTESE QUE VALE INVESTIGAR\nReescreva a hipótese de forma específica, concreta e compreensível, sem afirmá-la como verdade.\n\nPOR QUE ISSO PODE IMPORTAR\nExplique como a hipótese PODE afetar o Destino, sem afirmar causalidade não provada.\n\nO QUE JÁ TEMOS DE EVIDÊNCIA\nListe somente evidências existentes nos dados fornecidos.\n\nO QUE AINDA PRECISAMOS DESCOBRIR\nListe dados, perguntas ou evidências que ainda faltam para decidir.\n\nA PERGUNTA QUE O TESTE PRECISA RESPONDER\nCrie uma pergunta objetiva que permita testar a hipótese.\n\nCOMO VALIDAR NA PRÁTICA\nDê passos simples e executáveis usando cliente, canais, CRM, documentos, medição ou outras fontes já compatíveis com o caso.\n\nLEITURA PRELIMINAR DA IA\nEscolha somente: SUPORTA, CONTRADIZ ou INCONCLUSIVO. Informe também confiança ALTA, MEDIA ou BAIXA e justifique. Isso é apenas leitura assistida, não decisão humana.\n\nSUGESTÃO PARA O CAMPO “O QUE VOCÊ ENCONTROU?”\nEscreva um texto pronto, em primeira pessoa do aplicador, que eu possa usar como ponto de partida no MOTOR. O texto precisa separar o que os dados já mostram do que ainda depende de validação.\n\nDADOS DO CASO MOTOR VOS\n${JSON.stringify(ctx,null,2)}\n\nAntes de responder, verifique se alguma conclusão está indo além das evidências. Se estiver, rebaixe para hipótese ou INCONCLUSIVO.`;
  }

  function closeModal(){document.getElementById('motorContingencyModal')?.remove()}
  function showModal(prompt,hid){
    closeModal();
    const wrap=document.createElement('div');wrap.id='motorContingencyModal';wrap.className='contingency-modal';
    wrap.innerHTML=`<div class="contingency-card" role="dialog" aria-modal="true" aria-label="Prompt de contingência para ChatGPT"><div class="contingency-head"><div><b>PROMPT DE CONTINGÊNCIA · MOTOR VOS</b><p>Copie e cole no ChatGPT. Nenhuma API de IA é acionada por esta função.</p></div><button class="contingency-close" type="button" aria-label="Fechar">×</button></div><div class="contingency-body"><div class="contingency-note"><b>Contingência manual.</b> O ChatGPT ajuda a interpretar; você continua responsável pela investigação, validação humana, Gate e Ordenar.</div><textarea id="motorContingencyText" class="contingency-text" readonly></textarea><div class="contingency-actions"><button id="motorCopyPrompt" class="ym-btn">Copiar prompt</button><button id="motorClosePrompt" class="ym-btn secondary">Fechar</button></div></div></div>`;
    document.body.appendChild(wrap);
    const ta=document.getElementById('motorContingencyText');ta.value=prompt;
    wrap.querySelector('.contingency-close').onclick=closeModal;document.getElementById('motorClosePrompt').onclick=closeModal;
    wrap.addEventListener('click',e=>{if(e.target===wrap)closeModal()});
    document.getElementById('motorCopyPrompt').onclick=async()=>{
      try{await navigator.clipboard.writeText(prompt);YM.toast('Prompt copiado. Cole no ChatGPT para fazer a análise de contingência.');}
      catch{ta.focus();ta.select();document.execCommand('copy');YM.toast('Prompt copiado. Cole no ChatGPT para fazer a análise de contingência.');}
    };
    setTimeout(()=>ta.focus(),30);
  }
  window.generateChatGPTPrompt=hid=>{try{showModal(buildPrompt(hid),hid)}catch(e){YM.toast(e.message||String(e),true)}};

  function button(hid){const b=document.createElement('button');b.type='button';b.className='ym-btn secondary ai-contingency-btn';b.dataset.contingencyFor=hid;b.textContent='Gerar prompt para ChatGPT';b.onclick=()=>window.generateChatGPTPrompt(hid);return b}
  function ensureButtons(){
    document.querySelectorAll('[data-ai-missing]').forEach(box=>{
      const hid=box.getAttribute('data-ai-missing'),actions=box.querySelector('.ai-actions');
      if(hid&&actions&&!actions.querySelector('[data-contingency-for]'))actions.appendChild(button(hid));
    });
    document.querySelectorAll('.ai-analysis[data-ai-hyp]').forEach(box=>{
      const hid=box.getAttribute('data-ai-hyp'),actions=box.querySelector('.ai-suggest .ai-actions')||box.querySelector('.ai-actions');
      if(hid&&actions&&!actions.querySelector('[data-contingency-for]'))actions.appendChild(button(hid));
    });
  }
  const observer=new MutationObserver(()=>ensureButtons());
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(ensureButtons,120);
})();