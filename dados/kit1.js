// Dados do Kit 1 · Quantificação de fase sigma
// Fonte inicial: Docs/Fase_Sigma_Acompanhamento.xlsx, aba KIT1.
// Este arquivo pode ser substituído pelo botão "Salvar arquivo" da página (modo Editar).
// Use null para valor ainda não medido.
window.DADOS_KIT1 = {
  "titulo": "Kit 1 · Quantificação de fase σ",
  "subtitulo": "Comparação entre microscopia óptica (MO), microscopia eletrônica de varredura (MEV · BSE) e ferritoscópio",
  "condicoes": [
    {
      "id": "2", "rotulo": "2%",
      "mo":     { "media": 1.7747, "dp": 0.3448 },
      "mev":    { "media": 1.02, "dp": 0.1173063914 },
      "ferrito":{ "media": 35.67, "dp": null },
      "situacao": "MO: 15 campos (amostra S2 #6)"
    },
    {
      "id": "4", "rotulo": "4%",
      "mo":     { "media": 4.322, "dp": 0.5592 },
      "mev":    { "media": 1.8, "dp": 0.3389977988 },
      "ferrito":{ "media": 33.3, "dp": null },
      "situacao": "MO: 10 campos (amostra S4 #6)"
    },
    {
      "id": "6", "rotulo": "6%",
      "mo":     { "media": 5.89, "dp": 0.3841 },
      "mev":    { "media": 3.829666667, "dp": 1.240157063 },
      "ferrito":{ "media": 30.2, "dp": null },
      "situacao": "MO: média informada pela equipe (5,89 %)"
    }
  ]
};
