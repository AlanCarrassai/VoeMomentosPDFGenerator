document.getElementById('pdfForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const v = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const checked = (id) => { const el = document.getElementById(id); return el ? el.checked : false; };

    const fmtDate = (d) => {
      if (!d) return '—';
      const [yr, m, day] = d.split('-');
      return `${day}/${m}/${yr}`;
    };
    const fmtMoney = (val) => {
      if (!val) return '—';
      return 'R$ ' + parseFloat(val).toFixed(2).replace('.', ',');
    };

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const W = 210;
    const margin = 18;
    let y = 0;

    const blue    = [26, 86, 219];
    const white   = [255, 255, 255];
    const light   = [240, 244, 248];
    const dark    = [26, 32, 44];
    const muted   = [100, 116, 139];
    const divider = [226, 232, 240];

    function setFont(size, style = 'normal', color = dark) {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.setTextColor(...color);
    }

    function sectionTitle(label, yPos) {
      doc.setFillColor(...light);
      doc.rect(margin, yPos, W - margin * 2, 7, 'F');
      doc.setFillColor(...blue);
      doc.rect(margin, yPos, 3, 7, 'F');
      setFont(8, 'bold', blue);
      doc.text(label.toUpperCase(), margin + 6, yPos + 4.8);
      return yPos + 11;
    }

    function row(label, value, yPos, col = 0) {
      const colW = (W - margin * 2) / 2;
      const x = margin + col * colW;
      setFont(7.5, 'normal', muted);
      doc.text(label, x, yPos);
      setFont(9, 'bold', dark);
      doc.text(value || '—', x, yPos + 5);
      return yPos + 11;
    }

    function twoRows(label1, val1, label2, val2, yPos) {
      row(label1, val1, yPos, 0);
      if (label2) row(label2, val2, yPos, 1);
      return yPos + 11;
    }

    function dividerLine(yPos) {
      doc.setDrawColor(...divider);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, W - margin, yPos);
      return yPos + 4;
    }

    // ── HEADER ──────────────────────────────────────────────────────────────
    doc.setFillColor(...blue);
    doc.rect(0, 0, W, 32, 'F');

    setFont(18, 'bold', white);
    doc.text('VoeMomentos', margin, 14);

    setFont(9, 'normal', [180, 200, 240]);
    doc.text('Voucher de Passagem Aerea', margin, 21);

    setFont(8, 'normal', [180, 200, 240]);
    const now = new Date();
    doc.text(`Emitido em: ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`, W - margin, 21, { align: 'right' });

    const cia = v('cia_aerea');
    setFont(10, 'bold', white);
    doc.text(cia || '—', W - margin, 14, { align: 'right' });

    y = 40;

    // ── VOO IDA ─────────────────────────────────────────────────────────────
    y = sectionTitle('Voo - Ida', y);
    y = twoRows('Origem', v('origem_ida'), 'Destino', v('destino_ida'), y);
    y = twoRows('Data', fmtDate(v('data_ida')), 'Horario', v('horario_ida') || '—', y);
    y = twoRows('Numero do Voo', v('numero_voo_ida'), 'Duracao', v('duracao_voo_ida') || '—', y);
    if (checked('conexao_ida')) {
      y = twoRows('Conexao', 'Sim', 'Paradas', v('paradas_ida') || '1', y);
    }
    y = twoRows('Passageiros', v('qtd_pessoas') || '1', '', '', y);
    y = dividerLine(y);

    // ── VOO VOLTA ────────────────────────────────────────────────────────────
    y = sectionTitle('Voo - Volta', y);
    y = twoRows('Origem', v('origem_volta'), 'Destino', v('destino_volta'), y);
    y = twoRows('Data', fmtDate(v('data_volta')), 'Horario', v('horario_volta') || '—', y);
    y = twoRows('Numero do Voo', v('numero_voo_volta'), 'Duracao', v('duracao_voo_volta') || '—', y);
    if (checked('conexao_volta')) {
      y = twoRows('Conexao', 'Sim', 'Paradas', v('paradas_volta') || '1', y);
    }
    y = dividerLine(y);

    // ── BAGAGEM ──────────────────────────────────────────────────────────────
    if (bagagens.length > 0) {
      y = sectionTitle('Bagagem', y);
      bagagens.forEach((bag, i) => {
        y = twoRows('Tipo', bag.tipo || '—', 'Quantidade', bag.qtd, y);
        y = twoRows('Valor', fmtMoney(bag.valor), '', '', y);
        if (i < bagagens.length - 1) {
          doc.setDrawColor(...divider);
          doc.setLineWidth(0.2);
          doc.line(margin, y - 3, W - margin, y - 3);
        }
      });
      y = dividerLine(y);
    }

    // ── VALORES ──────────────────────────────────────────────────────────────
    y = sectionTitle('Valores da Passagem', y);
    y = twoRows('Valor Pix', fmtMoney(v('valor_passagem_pix')), 'Valor Parcelado', fmtMoney(v('valor_passagem_parcelado')), y);
    y = dividerLine(y);

    // ── OBSERVAÇÕES ───────────────────────────────────────────────────────────
    const obs = v('observacoes');
    if (obs) {
      y = sectionTitle('Observacoes', y);
      setFont(9, 'normal', dark);
      const lines = doc.splitTextToSize(obs, W - margin * 2 - 4);
      doc.text(lines, margin + 2, y);
      y += lines.length * 5 + 4;
    }

    // ── FOOTER ────────────────────────────────────────────────────────────────
    const pageH = 297;
    doc.setFillColor(...light);
    doc.rect(0, pageH - 12, W, 12, 'F');
    setFont(7.5, 'normal', muted);
    doc.text('VoeMomentos - Documento gerado automaticamente. Confira os dados com sua companhia aerea.', W / 2, pageH - 5, { align: 'center' });

    const nomeArquivo = `VoeMomentos_${cia || 'voo'}_${fmtDate(v('data_ida')).replace(/\//g,'-')}.pdf`;
    doc.save(nomeArquivo);
  });


  // ── Paradas condicional ───────────────────────────────────────────────────
  function toggleParadas(trecho) {
    const checkbox = document.getElementById('conexao_' + trecho);
    const field = document.getElementById('paradas_' + trecho + '_field');
    field.style.display = checkbox.checked ? 'flex' : 'none';
  }

  // ── Bagagens dinâmicas ────────────────────────────────────────────────────
  let bagagemCounter = 0;

  function adicionarBagagem() {
    bagagemCounter++;
    const id = bagagemCounter;
    const container = document.getElementById('bagagens-container');

    const div = document.createElement('div');
    div.className = 'bagagem-item';
    div.id = 'bagagem-item-' + id;
    div.innerHTML = `
      <div class="bagagem-header">
        <span class="bagagem-label">Bagagem 1</span>
        <button type="button" class="btn-remove" onclick="removerBagagem(${id})">Remover</button>
      </div>
      <div class="form-grid">
        <div class="field">
          <label>Tipo</label>
          <select id="bagagem_tipo_${id}">
            <option value="">Selecione</option>
            <option value="Mochila/Bolsa">Mochila/Bolsa</option>
            <option value="Bagagem de Mão">Bagagem de Mão</option>
            <option value="Bagagem Despachada">Bagagem Despachada</option>
          </select>
        </div>
        <div class="field">
          <label>Quantidade</label>
          <input type="number" id="bagagem_qtd_${id}" min="0" value="1">
        </div>
        <div class="field span2">
          <label>Valor (R$)</label>
          <input type="number" id="bagagem_valor_${id}" min="0" placeholder="0,00">
        </div>
      </div>
    `;
    container.appendChild(div);
    atualizarNumeracao();
  }

  function removerBagagem(id) {
    const el = document.getElementById('bagagem-item-' + id);
    if (el) el.remove();
    atualizarNumeracao();
  }

  function atualizarNumeracao() {
    document.querySelectorAll('.bagagem-item .bagagem-label').forEach((label, i) => {
      label.textContent = 'Bagagem ' + (i + 1);
    });
  }

  // Inicia com uma bagagem
  adicionarBagagem();

  // Coletar bagagens dinâmicas
    const bagagens = [];
    document.querySelectorAll('.bagagem-item').forEach((item) => {
      const idMatch = item.id.match(/bagagem-item-(\d+)/);
      if (!idMatch) return;
      const id = idMatch[1];
      bagagens.push({
        tipo:  v('bagagem_tipo_'  + id),
        qtd:   v('bagagem_qtd_'   + id) || '0',
        valor: v('bagagem_valor_' + id),
      });
    });