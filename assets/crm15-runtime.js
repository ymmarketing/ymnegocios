(() => {
  function loadScript(src, key) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[data-${key}]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.dataset[key] = '1';
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
  }

  loadScript('/assets/crm15-runtime-core.js?v=20260813-1', 'ymRuntimeCore')
    .then(() => Promise.all([
      loadScript('/assets/crm15-kpi-click.js?v=20260813-2', 'ymPipelineKpi'),
      loadScript('/assets/crm15-clients-ui.js?v=20260813-3', 'ymClientsUi'),
      loadScript('/assets/crm15-client-kpi.js?v=20260813-1', 'ymClientKpi')
    ]))
    .catch((error) => console.error('CRM interaction layer', error));
})();
