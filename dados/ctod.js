// Ensaios de CTOD (ISO 12135:2016) · gerado por Site/ferramentas/importar_ctod.py — não editar à mão.
window.DADOS_CTOD = {
 "gerado": "2026-11-26 17:52",
 "norma": "ISO 12135:2016",
 "fonte": "CTOD/<CP>/<CP>.xlsm (planilha de cálculo ISO 12135) e arquivos da MTS",
 "cps": [
  {
   "cp": "CT16",
   "nome": "CT16 4CL",
   "alvo": 4,
   "orient": "C-L",
   "orient_codigo": "CL",
   "pasta": "CT16 4CL ",
   "planilha": "CT16 4CL /CT16 4CL .xlsm",
   "ensaio": {
    "id_planilha": "CTT.03-R1-6LC",
    "orient_planilha": "L-C",
    "material": "UNS S32750",
    "produto": "Tubo",
    "data": "2026-11-04",
    "operador": "Rodrigo",
    "temp": -50.0,
    "temp_pre": 23.0,
    "dT": 1.0,
    "meio": "Gasoso",
    "encharque": 15.0,
    "controle": "Abertura do entalhe (V)",
    "geometria": "Flexão em três pontos — SE(B)",
    "parametro": "δ — CTOD pontual (6.3)",
    "faces": "Faces planas (BN = B)",
    "cabecalho_planilha": "LPTS-UFC ISO 12135 CTOD - SUPER DUPLEX FASE SIGMA - 23-10-2026 / CT104CL",
    "datas_mts": [
     "2026-11-13"
    ]
   },
   "geom": {
    "B": 14.0,
    "BN": 14.0,
    "W": 14.0,
    "S": 56.0,
    "z": 0.0,
    "am": 5.5,
    "a_o": 8.518062500000001,
    "a_oW": 0.6084330357142858,
    "b_o": 5.481937499999999,
    "pretrinca": 3.018062500000001,
    "a_j": [
     7.107,
     8.181,
     8.743,
     8.952,
     9.002,
     8.93,
     8.829,
     8.325,
     7.258
    ],
    "max_dev": 0.4839374999999997,
    "lim_dev": 0.8518062500000001,
    "min_ext": 1.6070000000000002
   },
   "props": {
    "Rp02": 550.0,
    "Rm": 800.0,
    "E": 200.0,
    "nu": 0.3,
    "Rp02_pre": 550.0
   },
   "registro": {
    "n": 5257.0,
    "Fmax": 5.871682235717773,
    "nFmax": 3729.0,
    "i1": 186.0,
    "i2": 1129.0,
    "kV": 48.52373675521474,
    "R2": 0.9992103270533229,
    "V0": -0.0047643271823099706,
    "ks": 46.097549917454,
    "nd": 1820.0,
    "Fd": 4.391531845092773,
    "FQ": 4.394399520874023,
    "ponto_modo": "Automático — ponto de força máxima (Fmax)",
    "ponto_tipo": "Patamar de força máxima sem pop-in significativo prévio (Fm)",
    "janela": [
     0.1,
     0.5
    ],
    "popin_min": 0.01,
    "popins": [
     {
      "n": 304,
      "F_antes": 0.9471585540771534,
      "F_depois": 0.9375596771240235,
      "queda_pct": 0.010134392929051226,
      "V": 0.014850222214590696,
      "quando": "antes de Fmax (possível pop-in)"
     }
    ],
    "n_ponto": 3729.0
   },
   "calc": {
    "KF": 9.410945889407008,
    "KQ": 41.355456107381514,
    "FmaxFQ": 1.336173965936972,
    "K": 55.25808380013233,
    "Ve": 0.12958997234989522,
    "Vp": 0.06519241894150331,
    "d_el": 0.012630203640858305,
    "rp": 0.20472488729289373,
    "d_pl": 0.013346510620150374,
    "delta": 0.025976714261008678,
    "lim_classe": 0.20955026259595907,
    "classe": "m",
    "simbolo": "δm(14)",
    "FL": 8.013770334374996,
    "Ff1": 3.3056802629296866,
    "Ff2": 3.4002958231881135
   },
   "resultado": {
    "simbolo": "δm(14)",
    "valor": 0.025976714261008678,
    "unidade": "mm",
    "origem": {
     "aba": "Resumo",
     "rotulo": "δ pontual"
    }
   },
   "mts": [
    {
     "arquivo": "CT16 4CL /Crack Size Check Command - Data Acquisition 1 - (Timed).txt",
     "test": "LPTS-UFC ISO 12135 CTOD - SUPER DUPLEX FASE SIGMA - 23-10-2026",
     "run": "CT104CL",
     "data": "11/13/2026 9:47:31 AM",
     "sha256": "96c41492109f4c9d455d3259c963c326320de965089b89111230589987ddbb62"
    },
    {
     "arquivo": "CT16 4CL /Data Acquisition 1 - (Timed).txt",
     "test": "LPTS-UFC ISO 12135 CTOD - SUPER DUPLEX FASE SIGMA - 23-10-2026",
     "run": "CT104CL",
     "data": "11/13/2026 9:47:31 AM",
     "sha256": "5dc82fbf0591ec7c0e33666cb586298e78fff91f3be871d404f819bb9bd64c44"
    },
    {
     "arquivo": "CT16 4CL /Precrack Command - Data Acquisition 1 - (Timed).txt",
     "test": "LPTS-UFC ISO 12135 CTOD - SUPER DUPLEX FASE SIGMA - 23-10-2026",
     "run": "CT104CL",
     "data": "11/13/2026 9:47:31 AM",
     "sha256": "58015b4d65c23e83001e119b1b4ecb77a855d2c6f9155439ba9fdb6325e54229"
    }
   ],
   "imagens": [
    {
     "src": "assets/ctod/CT16/01-medicao.jpg?v=1795726329",
     "arquivo": "CT16 4CL  medida fratura 2.png",
     "tipo": "medicao",
     "titulo": "Superfície de fratura com as nove medidas de a_j",
     "px": [
      2464,
      2427
     ],
     "czi": null
    },
    {
     "src": "assets/ctod/CT16/02-entalhe.jpg?v=1795726329",
     "arquivo": "medida da trinca.png",
     "tipo": "entalhe",
     "titulo": "Vista lateral do entalhe e da trinca",
     "px": [
      2464,
      2427
     ],
     "czi": null
    },
    {
     "src": "assets/ctod/CT16/03-pretrinca.jpg?v=1795726329",
     "arquivo": "medida pre-trinca L1.png",
     "tipo": "pretrinca",
     "titulo": "Pré-trinca por fadiga — face L1",
     "px": [
      2464,
      2427
     ],
     "czi": null
    },
    {
     "src": "assets/ctod/CT16/04-pretrinca.jpg?v=1795726329",
     "arquivo": "medida pre-trinca L2.png",
     "tipo": "pretrinca",
     "titulo": "Pré-trinca por fadiga — face L2",
     "px": [
      2464,
      2427
     ],
     "czi": null
    }
   ],
   "origens": {
    "resultado": "Resumo › 3. Resultados › δ pontual",
    "calc": "Cálculos (seções 9–11)",
    "registro": "Pontos do registro (seções 2 e 3)",
    "geom": "Resumo › 2 e Medições da trinca",
    "props": "Geometria e propriedades › 3",
    "curvas": "Dados do ensaio (F e V corrigidos; deslocamento do atuador com sinal invertido e zero no 1º ponto)"
   }
  },
  {
   "cp": "CT22",
   "nome": "CT22 6CL",
   "alvo": 6,
   "orient": "C-L",
   "orient_codigo": "CL",
   "pasta": "CT22 6CL",
   "planilha": "CT22 6CL/CT22 6CL.xlsm",
   "ensaio": {
    "id_planilha": "CTT.03-R1-6LC",
    "orient_planilha": "L-C",
    "material": "UNS S32750",
    "produto": "Tubo",
    "data": "2026-11-04",
    "operador": "Rodrigo",
    "temp": -50.0,
    "temp_pre": 23.0,
    "dT": 1.0,
    "meio": "Gasoso",
    "encharque": 15.0,
    "controle": "Abertura do entalhe (V)",
    "geometria": "Flexão em três pontos — SE(B)",
    "parametro": "δ — CTOD pontual (6.3)",
    "faces": "Faces planas (BN = B)",
    "cabecalho_planilha": "LPTS-UFC ISO 12135 CTOD - SUPER DUPLEX FASE SIGMA - 23-10-2026 / CT226CL",
    "datas_mts": [
     "2026-11-12"
    ]
   },
   "geom": {
    "B": 14.0,
    "BN": 14.0,
    "W": 14.0,
    "S": 56.0,
    "z": 0.0,
    "am": 5.5,
    "a_o": 8.86525,
    "a_oW": 0.6332321428571428,
    "b_o": 5.13475,
    "pretrinca": 3.3652499999999996,
    "a_j": [
     7.518,
     8.498,
     8.966,
     9.262,
     9.348,
     9.348,
     9.067,
     8.901,
     7.546
    ],
    "max_dev": 0.4827500000000011,
    "lim_dev": 0.886525,
    "min_ext": 2.018
   },
   "props": {
    "Rp02": 550.0,
    "Rm": 800.0,
    "E": 200.0,
    "nu": 0.3,
    "Rp02_pre": 550.0
   },
   "registro": {
    "n": 4618.0,
    "Fmax": 4.781213500976562,
    "nFmax": 3503.0,
    "i1": 156.0,
    "i2": 1074.0,
    "kV": 41.24608335643625,
    "R2": 0.9975489140119024,
    "V0": -0.005596610242560174,
    "ks": 39.18377918861444,
    "nd": 1445.0,
    "Fd": 3.037782104492182,
    "FQ": 3.044412231445312,
    "ponto_modo": "Automático — ponto de força máxima (Fmax)",
    "ponto_tipo": "Patamar de força máxima sem pop-in significativo prévio (Fm)",
    "janela": [
     0.1,
     0.5
    ],
    "popin_min": 0.01,
    "popins": [
     {
      "n": 371,
      "F_antes": 0.990081665039062,
      "F_depois": 0.978072143554692,
      "queda_pct": 0.012129829193328463,
      "V": 0.0181651266757398,
      "quando": "antes de Fmax (possível pop-in)"
     }
    ],
    "n_ponto": 3503.0
   },
   "calc": {
    "KF": 10.404143409588093,
    "KQ": 31.674501453861122,
    "FmaxFQ": 1.5704882051096989,
    "K": 49.74443093601891,
    "Ve": 0.1241328069741088,
    "Vp": 0.0587679623864151,
    "d_el": 0.010235466601477287,
    "rp": 0.1881007221258065,
    "d_pl": 0.011054296162746915,
    "delta": 0.0212897627642242,
    "lim_classe": 0.20782711866331774,
    "classe": "m",
    "simbolo": "δm(14)",
    "FL": 7.030842016666666,
    "Ff1": 2.9002223318750007,
    "Ff2": 3.0756977042924953
   },
   "resultado": {
    "simbolo": "δm(14)",
    "valor": 0.0212897627642242,
    "unidade": "mm",
    "origem": {
     "aba": "Resumo",
     "rotulo": "δ pontual"
    }
   },
   "mts": [
    {
     "arquivo": "CT22 6CL/CT22 6CL/Crack Size Check Command - Data Acquisition 1 - (Timed).txt",
     "test": "LPTS-UFC ISO 12135 CTOD - SUPER DUPLEX FASE SIGMA - 23-10-2026",
     "run": "CT226CL",
     "data": "11/12/2026 2:54:54 PM",
     "sha256": "1c7eb80cbbdc2f47b85ca6b4f11b4a7418862b6d08a48cd0f87ea709779af102"
    },
    {
     "arquivo": "CT22 6CL/CT22 6CL/Data Acquisition 1 - (Timed).txt",
     "test": "LPTS-UFC ISO 12135 CTOD - SUPER DUPLEX FASE SIGMA - 23-10-2026",
     "run": "CT226CL",
     "data": "11/12/2026 2:54:54 PM",
     "sha256": "69b29df8bf604c6ad8a5c6989c0fff07d59a7ea018909c672800cf22364cdc92"
    },
    {
     "arquivo": "CT22 6CL/CT22 6CL/Precrack Command - Data Acquisition 1 - (Timed).txt",
     "test": "LPTS-UFC ISO 12135 CTOD - SUPER DUPLEX FASE SIGMA - 23-10-2026",
     "run": "CT226CL",
     "data": "11/12/2026 2:54:54 PM",
     "sha256": "404007f4c10d05b0542ecdd804134700811f6110f353195ed0a26cd44b8a27ca"
    }
   ],
   "imagens": [
    {
     "src": "assets/ctod/CT22/02-medicao.jpg?v=1795726329",
     "arquivo": "medida fratura _CT226CL.png",
     "tipo": "medicao",
     "titulo": "Superfície de fratura com as nove medidas de a_j",
     "px": [
      2464,
      2427
     ],
     "czi": null
    },
    {
     "src": "assets/ctod/CT22/01-entalhe.jpg?v=1795726329",
     "arquivo": "Image.png",
     "tipo": "entalhe",
     "titulo": "Vista lateral do entalhe e da trinca",
     "px": [
      2464,
      2427
     ],
     "czi": null
    },
    {
     "src": "assets/ctod/CT22/03-pretrinca.jpg?v=1795726329",
     "arquivo": "medida pre-trinca L1.png",
     "tipo": "pretrinca",
     "titulo": "Pré-trinca por fadiga — face L1",
     "px": [
      2464,
      2427
     ],
     "czi": null
    }
   ],
   "origens": {
    "resultado": "Resumo › 3. Resultados › δ pontual",
    "calc": "Cálculos (seções 9–11)",
    "registro": "Pontos do registro (seções 2 e 3)",
    "geom": "Resumo › 2 e Medições da trinca",
    "props": "Geometria e propriedades › 3",
    "curvas": "Dados do ensaio (F e V corrigidos; deslocamento do atuador com sinal invertido e zero no 1º ponto)"
   }
  }
 ],
 "avisos": [
  "CT16 4CL: os arquivos da MTS identificam o ensaio como CT104CL (nome gravado pela máquina); o CP é tratado como CT16 4CL.",
  "CT16 4CL: a planilha identifica o CP como \"CTT.03-R1-6LC\" (aba Resumo), que não corresponde a 4% C-L.",
  "CT16 4CL: data do ensaio na planilha = 2026-11-04; data gravada nos arquivos da MTS = 2026-11-13.",
  "CT16 4CL: orientação na planilha = L-C; pelo nome da pasta = C-L.",
  "CT16 4CL: \"Medida do entalhe.czi\" existe só em .czi (formato Zeiss), sem .png; não exibida. Exporte em PNG para incluir.",
  "CT22 6CL: a planilha identifica o CP como \"CTT.03-R1-6LC\" (aba Resumo), que não corresponde a 6% C-L.",
  "CT22 6CL: data do ensaio na planilha = 2026-11-04; data gravada nos arquivos da MTS = 2026-11-12.",
  "CT22 6CL: orientação na planilha = L-C; pelo nome da pasta = C-L."
 ]
};
