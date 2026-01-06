import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Download, Upload, Edit2, X, Check, Copy } from 'lucide-react';

export default function SistemaCotacao() {
  const [itens, setItens] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [cotacoes, setCotacoes] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('itens');
  
  const [novoItem, setNovoItem] = useState({
    descricao: '',
    unidade: '',
    quantidade: ''
  });
  
  const [novoFornecedor, setNovoFornecedor] = useState({
    nome: '',
    email: '',
    telefone: ''
  });

  const [cotacaoAtual, setCotacaoAtual] = useState({
    fornecedor: '',
    itens: []
  });

  const [editandoItem, setEditandoItem] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const resultItens = await window.storage.get('cotacao-itens');
      const resultFornecedores = await window.storage.get('cotacao-fornecedores');
      const resultCotacoes = await window.storage.get('cotacao-cotacoes');
      
      if (resultItens) setItens(JSON.parse(resultItens.value));
      if (resultFornecedores) setFornecedores(JSON.parse(resultFornecedores.value));
      if (resultCotacoes) setCotacoes(JSON.parse(resultCotacoes.value));
    } catch (error) {
      console.log('Primeira vez carregando dados');
    }
  };

  const salvarDados = async (tipo, dados) => {
    try {
      await window.storage.set(`cotacao-${tipo}`, JSON.stringify(dados));
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const adicionarItem = () => {
    if (novoItem.descricao && novoItem.unidade && novoItem.quantidade) {
      const item = {
        id: Date.now(),
        ...novoItem,
        quantidade: parseFloat(novoItem.quantidade),
        incluirNaCotacao: true
      };
      const novosItens = [...itens, item];
      setItens(novosItens);
      salvarDados('itens', novosItens);
      setNovoItem({ descricao: '', unidade: '', quantidade: '' });
    }
  };

  const removerItem = (id) => {
    const novosItens = itens.filter(item => item.id !== id);
    setItens(novosItens);
    salvarDados('itens', novosItens);
  };

  const toggleIncluirItem = (id) => {
    const novosItens = itens.map(item => 
      item.id === id ? { ...item, incluirNaCotacao: !item.incluirNaCotacao } : item
    );
    setItens(novosItens);
    salvarDados('itens', novosItens);
  };

  const atualizarItem = (id, dadosAtualizados) => {
    const novosItens = itens.map(item => 
      item.id === id ? { ...item, ...dadosAtualizados } : item
    );
    setItens(novosItens);
    salvarDados('itens', novosItens);
    setEditandoItem(null);
  };

  const adicionarFornecedor = () => {
    if (novoFornecedor.nome && novoFornecedor.email) {
      const fornecedor = {
        id: Date.now(),
        ...novoFornecedor
      };
      const novosFornecedores = [...fornecedores, fornecedor];
      setFornecedores(novosFornecedores);
      salvarDados('fornecedores', novosFornecedores);
      setNovoFornecedor({ nome: '', email: '', telefone: '' });
    }
  };

  const removerFornecedor = (id) => {
    const novosFornecedores = fornecedores.filter(f => f.id !== id);
    setFornecedores(novosFornecedores);
    salvarDados('fornecedores', novosFornecedores);
  };

  const getItensSelecionados = () => {
    return itens.filter(item => item.incluirNaCotacao);
  };

  const gerarRelatorioTexto = () => {
    const itensSelecionados = getItensSelecionados();
    const data = new Date().toLocaleDateString('pt-BR');
    let relatorio = `SOLICITAÇÃO DE COTAÇÃO DE PREÇOS\n`;
    relatorio += `Data: ${data}\n`;
    relatorio += `ID da Cotação: ${Date.now()}\n\n`;
    relatorio += `Prezado Fornecedor,\n\n`;
    relatorio += `Solicitamos a cotação dos itens abaixo:\n\n`;
    
    itensSelecionados.forEach((item, index) => {
      relatorio += `[ITEM_${item.id}]\n`;
      relatorio += `Descrição: ${item.descricao}\n`;
      relatorio += `Unidade: ${item.unidade}\n`;
      relatorio += `Quantidade: ${item.quantidade}\n`;
      relatorio += `Preço Unitário: R$ \n`;
      relatorio += `\n`;
    });
    
    relatorio += `\nINSTRUÇÕES PARA PREENCHIMENTO:\n`;
    relatorio += `1. Preencha o preço unitário de cada item após "Preço Unitário: R$ "\n`;
    relatorio += `2. Use apenas números e vírgula/ponto para decimais (ex: 10.50 ou 10,50)\n`;
    relatorio += `3. NÃO altere os códigos [ITEM_XXXXX]\n`;
    relatorio += `4. Salve o arquivo e envie de volta\n\n`;
    relatorio += `Atenciosamente,\n`;
    relatorio += `${new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    
    return relatorio;
  };

  const gerarRelatorioCSV = () => {
    const itensSelecionados = getItensSelecionados();
    let csv = 'ID_ITEM;Descrição;Unidade;Quantidade;Preço Unitário\n';
    
    itensSelecionados.forEach(item => {
      csv += `${item.id};${item.descricao};${item.unidade};${item.quantidade};\n`;
    });
    
    return csv;
  };

  const baixarRelatorioTexto = () => {
    const itensSelecionados = getItensSelecionados();
    if (itensSelecionados.length === 0) {
      alert('Selecione pelo menos um item para incluir na cotação!');
      return;
    }
    const relatorio = gerarRelatorioTexto();
    const blob = new Blob([relatorio], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cotacao_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const baixarRelatorioCSV = () => {
    const itensSelecionados = getItensSelecionados();
    if (itensSelecionados.length === 0) {
      alert('Selecione pelo menos um item para incluir na cotação!');
      return;
    }
    const csv = gerarRelatorioCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cotacao_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copiarRelatorio = () => {
    const itensSelecionados = getItensSelecionados();
    if (itensSelecionados.length === 0) {
      alert('Selecione pelo menos um item para incluir na cotação!');
      return;
    }
    const relatorio = gerarRelatorioTexto();
    navigator.clipboard.writeText(relatorio).then(() => {
      alert('Relatório copiado! Cole em um email ou documento para enviar ao fornecedor.');
    });
  };

  const processarArquivoUpload = async (file, fornecedorId) => {
    const texto = await file.text();
    const linhas = texto.split('\n');
    
    const itensComPreco = [];
    let itemAtual = null;
    
    for (let linha of linhas) {
      linha = linha.trim();
      
      // Detectar início de item
      if (linha.startsWith('[ITEM_')) {
        const match = linha.match(/\[ITEM_(\d+)\]/);
        if (match) {
          const itemId = parseInt(match[1]);
          itemAtual = itens.find(i => i.id === itemId);
          if (itemAtual) {
            itemAtual = { ...itemAtual, preco: 0 };
          }
        }
      }
      
      // Detectar preço
      if (itemAtual && linha.startsWith('Preço Unitário:')) {
        const precoMatch = linha.match(/R\$\s*([\d.,]+)/);
        if (precoMatch) {
          const preco = parseFloat(precoMatch[1].replace(',', '.'));
          if (!isNaN(preco)) {
            itemAtual.preco = preco;
            itensComPreco.push(itemAtual);
            itemAtual = null;
          }
        }
      }
    }

    // Tentar processar CSV se não encontrou itens no formato texto
    if (itensComPreco.length === 0) {
      for (let linha of linhas) {
        const partes = linha.split(';');
        if (partes.length >= 5 && !linha.startsWith('ID_ITEM')) {
          const itemId = parseInt(partes[0]);
          const preco = parseFloat(partes[4].replace(',', '.'));
          
          if (!isNaN(itemId) && !isNaN(preco)) {
            const item = itens.find(i => i.id === itemId);
            if (item) {
              itensComPreco.push({ ...item, preco });
            }
          }
        }
      }
    }

    if (itensComPreco.length > 0) {
      const novaCotacao = {
        id: Date.now(),
        fornecedorId: fornecedorId,
        data: new Date().toISOString(),
        itens: itens.map(item => {
          const itemComPreco = itensComPreco.find(i => i.id === item.id);
          return {
            ...item,
            preco: itemComPreco ? itemComPreco.preco : 0
          };
        })
      };
      
      const novasCotacoes = [...cotacoes, novaCotacao];
      setCotacoes(novasCotacoes);
      salvarDados('cotacoes', novasCotacoes);
      
      alert(`Cotação importada com sucesso! ${itensComPreco.length} itens com preço encontrados.`);
      setAbaAtiva('comparar');
    } else {
      alert('Nenhum preço válido encontrado no arquivo. Verifique o formato.');
    }
  };

  const handleFileUpload = (e, fornecedorId) => {
    const file = e.target.files[0];
    if (file) {
      processarArquivoUpload(file, fornecedorId);
    }
  };

  const registrarCotacao = () => {
    if (cotacaoAtual.fornecedor && cotacaoAtual.itens.length > 0) {
      const novaCotacao = {
        id: Date.now(),
        fornecedorId: cotacaoAtual.fornecedor,
        data: new Date().toISOString(),
        itens: cotacaoAtual.itens
      };
      const novasCotacoes = [...cotacoes, novaCotacao];
      setCotacoes(novasCotacoes);
      salvarDados('cotacoes', novasCotacoes);
      setCotacaoAtual({ fornecedor: '', itens: [] });
      setAbaAtiva('comparar');
    }
  };

  const atualizarPrecoCotacao = (itemId, preco) => {
    const itensAtualizados = cotacaoAtual.itens.map(item =>
      item.id === itemId ? { ...item, preco: parseFloat(preco) || 0 } : item
    );
    setCotacaoAtual({ ...cotacaoAtual, itens: itensAtualizados });
  };

  const iniciarCotacao = (fornecedorId) => {
    const itensSelecionados = getItensSelecionados();
    if (itensSelecionados.length === 0) {
      alert('Selecione pelo menos um item para incluir na cotação!');
      return;
    }
    setCotacaoAtual({
      fornecedor: fornecedorId,
      itens: itensSelecionados.map(item => ({ ...item, preco: 0 }))
    });
  };

  const getMelhorPreco = (itemId) => {
    const precos = cotacoes
      .flatMap(c => c.itens)
      .filter(i => i.id === itemId && i.preco > 0)
      .map(i => i.preco);
    return precos.length > 0 ? Math.min(...precos) : null;
  };

  const selecionarTodos = () => {
    const novosItens = itens.map(item => ({ ...item, incluirNaCotacao: true }));
    setItens(novosItens);
    salvarDados('itens', novosItens);
  };

  const desselecionarTodos = () => {
    const novosItens = itens.map(item => ({ ...item, incluirNaCotacao: false }));
    setItens(novosItens);
    salvarDados('itens', novosItens);
  };

  const itensSelecionados = getItensSelecionados();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <h1 className="text-3xl font-bold text-white">Sistema de Cotação de Preços</h1>
            <p className="text-blue-100 mt-2">Gerencie cotações e compare preços de fornecedores</p>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {['itens', 'fornecedores', 'cotar', 'comparar'].map(aba => (
                <button
                  key={aba}
                  onClick={() => setAbaAtiva(aba)}
                  className={`px-6 py-4 font-medium text-sm ${
                    abaAtiva === aba
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {aba === 'itens' && '📦 Itens'}
                  {aba === 'fornecedores' && '🏢 Fornecedores'}
                  {aba === 'cotar' && '💰 Cotar Preços'}
                  {aba === 'comparar' && '📊 Comparar Cotações'}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {abaAtiva === 'itens' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Itens para Cotação</h2>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold mb-4 text-gray-700">Adicionar Novo Item</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="Descrição do item"
                      value={novoItem.descricao}
                      onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Unidade (un, kg, m)"
                      value={novoItem.unidade}
                      onChange={(e) => setNovoItem({ ...novoItem, unidade: e.target.value })}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Quantidade"
                      value={novoItem.quantidade}
                      onChange={(e) => setNovoItem({ ...novoItem, quantidade: e.target.value })}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      onClick={adicionarItem}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Plus size={20} /> Adicionar
                    </button>
                  </div>
                </div>

                {itens.length > 0 && (
                  <div className="mb-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-gray-700">
                        {itensSelecionados.length} de {itens.length} itens selecionados
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={selecionarTodos}
                        className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                      >
                        Selecionar Todos
                      </button>
                      <button
                        onClick={desselecionarTodos}
                        className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
                      >
                        Desselecionar Todos
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {itens.map(item => (
                    <div key={item.id} className={`bg-white border-2 p-4 rounded-lg transition-all ${
                      item.incluirNaCotacao ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}>
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={item.incluirNaCotacao}
                            onChange={() => toggleIncluirItem(item.id)}
                            className="w-5 h-5 text-blue-600 cursor-pointer"
                          />
                          
                          {editandoItem === item.id ? (
                            <div className="flex-1 grid grid-cols-3 gap-3">
                              <input
                                type="text"
                                defaultValue={item.descricao}
                                onChange={(e) => item.descricao = e.target.value}
                                className="px-3 py-1 border rounded"
                              />
                              <input
                                type="text"
                                defaultValue={item.unidade}
                                onChange={(e) => item.unidade = e.target.value}
                                className="px-3 py-1 border rounded"
                              />
                              <input
                                type="number"
                                defaultValue={item.quantidade}
                                onChange={(e) => item.quantidade = e.target.value}
                                className="px-3 py-1 border rounded"
                              />
                            </div>
                          ) : (
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">{item.descricao}</h4>
                              <p className="text-sm text-gray-600">
                                Quantidade: {item.quantidade} {item.unidade}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {editandoItem === item.id ? (
                            <>
                              <button
                                onClick={() => atualizarItem(item.id, item)}
                                className="text-green-600 hover:text-green-700 p-2"
                              >
                                <Check size={20} />
                              </button>
                              <button
                                onClick={() => setEditandoItem(null)}
                                className="text-gray-600 hover:text-gray-700 p-2"
                              >
                                <X size={20} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditandoItem(item.id)}
                                className="text-blue-600 hover:text-blue-700 p-2"
                              >
                                <Edit2 size={20} />
                              </button>
                              <button
                                onClick={() => removerItem(item.id)}
                                className="text-red-600 hover:text-red-700 p-2"
                              >
                                <Trash2 size={20} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {itens.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3 text-gray-700">Gerar Relatório para Fornecedores</h3>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={baixarRelatorioTexto}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <Download size={20} /> Baixar TXT
                      </button>
                      <button
                        onClick={baixarRelatorioCSV}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Download size={20} /> Baixar CSV
                      </button>
                      <button
                        onClick={copiarRelatorio}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                      >
                        <Copy size={20} /> Copiar Texto
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      💡 Apenas os itens selecionados ({itensSelecionados.length}) serão incluídos no relatório.
                    </p>
                  </div>
                )}
              </div>
            )}

            {abaAtiva === 'fornecedores' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Fornecedores</h2>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold mb-4 text-gray-700">Adicionar Novo Fornecedor</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="Nome do fornecedor"
                      value={novoFornecedor.nome}
                      onChange={(e) => setNovoFornecedor({ ...novoFornecedor, nome: e.target.value })}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="email"
                      placeholder="E-mail"
                      value={novoFornecedor.email}
                      onChange={(e) => setNovoFornecedor({ ...novoFornecedor, email: e.target.value })}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="Telefone"
                      value={novoFornecedor.telefone}
                      onChange={(e) => setNovoFornecedor({ ...novoFornecedor, telefone: e.target.value })}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      onClick={adicionarFornecedor}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Plus size={20} /> Adicionar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fornecedores.map(fornecedor => (
                    <div key={fornecedor.id} className="bg-white border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-800">{fornecedor.nome}</h4>
                          <p className="text-sm text-gray-600 mt-1">📧 {fornecedor.email}</p>
                          {fornecedor.telefone && (
                            <p className="text-sm text-gray-600">📱 {fornecedor.telefone}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removerFornecedor(fornecedor.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {abaAtiva === 'cotar' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Registrar Cotação</h2>
                
                {!cotacaoAtual.fornecedor ? (
                  <div>
                    {itensSelecionados.length === 0 ? (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                        <p className="text-yellow-800">
                          ⚠️ Nenhum item selecionado! Vá até a aba "Itens" e selecione os itens que deseja cotar.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                        <p className="text-green-800">
                          ✓ {itensSelecionados.length} {itensSelecionados.length === 1 ? 'item selecionado' : 'itens selecionados'} para cotação
                        </p>
                      </div>
                    )}
                    
                    <p className="text-gray-600 mb-4">Selecione um fornecedor para registrar a cotação:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {fornecedores.map(fornecedor => (
                        <div key={fornecedor.id} className="bg-white border-2 border-gray-300 p-4 rounded-lg hover:border-blue-600 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold text-gray-800">{fornecedor.nome}</h4>
                              <p className="text-sm text-gray-600">{fornecedor.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => iniciarCotacao(fornecedor.id)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-2"
                            >
                              <Edit2 size={16} /> Digitar Manualmente
                            </button>
                            
                            <label className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center justify-center gap-2 cursor-pointer">
                              <Upload size={16} /> Fazer Upload do Arquivo
                              <input
                                type="file"
                                accept=".txt,.csv"
                                onChange={(e) => handleFileUpload(e, fornecedor.id)}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">💡 Como funciona o Upload:</h4>
                      <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                        <li>Gere o relatório na aba "Itens"</li>
                        <li>Envie o arquivo (TXT ou CSV) para o fornecedor</li>
                        <li>O fornecedor preenche os preços e devolve o arquivo</li>
                        <li>Faça upload do arquivo preenchido aqui</li>
                        <li>Os preços serão importados automaticamente!</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <h3 className="font-semibold text-gray-700">
                        Cotação: {fornecedores.find(f => f.id === cotacaoAtual.fornecedor)?.nome}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {cotacaoAtual.itens.length} {cotacaoAtual.itens.length === 1 ? 'item' : 'itens'} nesta cotação
                      </p>
                    </div>

                    <div className="space-y-3 mb-6">
                      {cotacaoAtual.itens.map(item => (
                        <div key={item.id} className="bg-white border border-gray-200 p-4 rounded-lg">
                          <div className="flex justify-between items-center gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">{item.descricao}</h4>
                              <p className="text-sm text-gray-600">
                                Quantidade: {item.quantidade} {item.unidade}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={item.preco || ''}
                                onChange={(e) => atualizarPrecoCotacao(item.id, e.target.value)}
                                className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={registrarCotacao}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <Check size={20} /> Salvar Cotação
                      </button>
                      <button
                        onClick={() => setCotacaoAtual({ fornecedor: '', itens: [] })}
                        className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                      <p className="font-semibold text-gray-800">
                        Valor Total: R$ {cotacaoAtual.itens.reduce((sum, item) => sum + (item.preco * item.quantidade || 0), 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {abaAtiva === 'comparar' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Comparar Cotações</h2>
                
                {cotacoes.length === 0 ? (
                  <p className="text-gray-600">Nenhuma cotação registrada ainda.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-3 text-left">Item</th>
                          {cotacoes.map(cotacao => (
                            <th key={cotacao.id} className="border p-3 text-center">
                              {fornecedores.find(f => f.id === cotacao.fornecedorId)?.nome}
                            </th>
                          ))}
                          <th className="border p-3 text-center bg-green-100">Melhor Preço</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itens.map(item => {
                          const melhorPreco = getMelhorPreco(item.id);
                          return (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="border p-3">
                                <div className="font-semibold">{item.descricao}</div>
                                <div className="text-sm text-gray-600">
                                  {item.quantidade} {item.unidade}
                                </div>
                              </td>
                              {cotacoes.map(cotacao => {
                                const itemCotacao = cotacao.itens.find(i => i.id === item.id);
                                const preco = itemCotacao?.preco || 0;
                                const isMelhor = preco > 0 && preco === melhorPreco;
                                return (
                                  <td key={cotacao.id} className={`border p-3 text-center ${isMelhor ? 'bg-green-50 font-bold' : ''}`}>
                                    {preco > 0 ? `R$ ${preco.toFixed(2)}` : '-'}
                                  </td>
                                );
                              })}
                              <td className="border p-3 text-center bg-green-50 font-bold">
                                {melhorPreco ? `R$ ${melhorPreco.toFixed(2)}` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-gray-100 font-bold">
                          <td className="border p-3">TOTAL</td>
                          {cotacoes.map(cotacao => (
                            <td key={cotacao.id} className="border p-3 text-center">
                              R$ {cotacao.itens.reduce((sum, item) => sum + (item.preco * item.quantidade || 0), 0).toFixed(2)}
                            </td>
                          ))}
                          <td className="border p-3 text-center bg-green-100">
                            R$ {itens.reduce((sum, item) => {
                              const melhor = getMelhorPreco(item.id);
                              return sum + (melhor ? melhor * item.quantidade : 0);
                            }, 0).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}