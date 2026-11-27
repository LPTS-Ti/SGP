// Ensaios de tração · dados dos CPs e propriedades calculadas.
// Gerado por Site/ferramentas/importar_tracao.py. Campos editáveis na página: largura, espessura, Lc, A, obs.
window.DADOS_TRACAO = {
 "gerado": "2026-11-25 16:27",
 "versao_algoritmo": "1.1",
 "metodo": {
  "E": "Regressão linear σ × ε do extensômetro entre 20 e 80 MPa.",
  "Rp02": "Interseção com a reta de módulo E deslocada de 0,2 %.",
  "Rm": "Força máxima / área inicial S0.",
  "extensometro": "Confiável até o último registro antes da pausa (> 1 s sem registros).",
  "pos_retirada": "ε = ε_ref + [(δ − δ_ref) − C·(F − F_ref)] / Lc, estimada pelo atuador; requer Lc.",
  "A": "Alongamento após fratura medido no CP (ISO 6892-1, anexo H), informado no relatório."
 },
 "cps": [
  {
   "cp": "TR01",
   "alvo": 0,
   "dir": "L",
   "pasta": "TR01 - 0L",
   "test_run": "Test Run 7",
   "data": "11/19/2026 1:59:37 PM",
   "ensaio": "LPTS-UFC-MTS SH Tension Retangular (Extensometer-Actuator) FASE SIGMA-11_11_2026",
   "largura": 5.99,
   "espessura": 5.99,
   "area": 35.8801,
   "Lc": 25.0,
   "A": 49.88,
   "obs": "A remedido no CP (valor corrigido; o relatório MTS indicava 30,0 %).",
   "calc": {
    "S0": 35.8801,
    "E_GPa": 204.2,
    "E_r2": 0.99976,
    "E_janela_MPa": [
     20.0,
     80.0
    ],
    "E_faixa_def": [
     0.011,
     0.0388
    ],
    "E_b": 0.21496553321855982,
    "Rp02": 622.5,
    "Rp02_def": 0.5048,
    "Fp02_kN": 22.3359,
    "Fmax_kN": 29.1796,
    "Rm": 813.3,
    "d_Fmax_mm": 9.0637,
    "sensibilidade": [
     {
      "janela": [
       20.0,
       100.0
      ],
      "E_GPa": 204.5,
      "Rp02": 622.4
     },
     {
      "janela": [
       30.0,
       120.0
      ],
      "E_GPa": 205.0,
      "Rp02": 622.4
     }
    ]
   },
   "mts": {
    "E_GPa": 200.11,
    "Rp02": 623.74805,
    "Rm": 813.25394,
    "Fmax_kN": 29.17963,
    "A": 30.0
   },
   "ref": {
    "i": 3448,
    "t": 173.34440612793,
    "d": 0.727617531083524,
    "F": 24.660125,
    "e": 0.0109426798298955
   },
   "pausas": [
    {
     "t0": 173.34440612793,
     "t1": 205.02375793457,
     "dur": 31.67935180664,
     "dF": -2.508736328125,
     "dd": 0.006386952009052038,
     "de": 0.0026268949732183994
    }
   ],
   "retirada_t": 211.91926574707,
   "arquivos": [
    {
     "nome": "DAQ- Actuator, … - (Timed).txt",
     "sha256": "284069e2134677920eaec361a93fb5d82d97444a7b394ef1707a788c2c294c1d",
     "registros": 3430,
     "t": [
      0.18326823413372,
      171.52165222168
     ]
    },
    {
     "nome": "DAQ- Actuator, … - (Timed)1.txt",
     "sha256": "92b328888cb749e7c02b0a543bb27c4fce0f7e0e5b74cdda077c9352ef118829",
     "registros": 3331,
     "t": [
      172.44499206543,
      370.465972900391
     ]
    },
    {
     "nome": "TR01-0L.xlsx",
     "sha256": "0ae4be98038bc48d11f7f99f9ab0f6101d8ad48e98e7f0a3e335fb4ac27594ed"
    }
   ],
   "registros": 6761,
   "relatorio": "TR01-0L/TR01-0L.xlsx",
   "id": 1
  },
  {
   "cp": "TR02",
   "alvo": 0,
   "dir": "L",
   "pasta": "TR02 - 01",
   "test_run": "Test Run 8",
   "data": "11/19/2026 3:52:15 PM",
   "ensaio": "LPTS-UFC-MTS SH Tension Retangular (Extensometer-Actuator) FASE SIGMA-11_11_2026",
   "largura": 5.99,
   "espessura": 5.99,
   "area": 35.8801,
   "Lc": 25.0,
   "A": 49.12,
   "obs": "A remedido no CP (valor corrigido; o relatório MTS indicava 27,5 %).",
   "calc": {
    "S0": 35.8801,
    "E_GPa": 198.66,
    "E_r2": 0.99977,
    "E_janela_MPa": [
     20.0,
     80.0
    ],
    "E_faixa_def": [
     0.01,
     0.0398
    ],
    "E_b": 0.637140067437975,
    "Rp02": 656.2,
    "Rp02_def": 0.53,
    "Fp02_kN": 23.5433,
    "Fmax_kN": 29.3623,
    "Rm": 818.3,
    "d_Fmax_mm": 8.8196,
    "sensibilidade": [
     {
      "janela": [
       20.0,
       100.0
      ],
      "E_GPa": 198.2,
      "Rp02": 656.1
     },
     {
      "janela": [
       30.0,
       120.0
      ],
      "E_GPa": 198.4,
      "Rp02": 656.1
     }
    ]
   },
   "mts": {
    "E_GPa": 197.06,
    "Rp02": 656.25742,
    "Rm": 818.34485,
    "Fmax_kN": 29.36229,
    "A": 27.5
   },
   "ref": {
    "i": 3449,
    "t": 172.58251953125,
    "d": 0.792582344729453,
    "F": 25.198263671875,
    "e": 0.0111899953335524
   },
   "pausas": [
    {
     "t0": 172.58251953125,
     "t1": 193.81867980957,
     "dur": 21.23616027832,
     "dF": -1.7905917968750025,
     "dd": -0.0020220759324729443,
     "de": 0.0079546626657247
    }
   ],
   "retirada_t": 199.91471862793,
   "arquivos": [
    {
     "nome": "DAQ- Actuator, … - (Timed).txt",
     "sha256": "1390465f6b84678307a5792a4895a5941f3861a409d703bd0e888ee8921f8c6c",
     "registros": 3427,
     "t": [
      0.11507161706686,
      171.30354309082
     ]
    },
    {
     "nome": "DAQ- Actuator, … - (Timed)1.txt",
     "sha256": "a4396565ad15bd716d2fab532bea651d702f84d72bf865bb47e4462a8f906287",
     "registros": 3235,
     "t": [
      171.48323059082,
      354.26416015625
     ]
    },
    {
     "nome": "TR02-0L.xlsx",
     "sha256": "50fcfb1b84ae6626103430d9985bd4892f4c9ceb0e59e4eb2c32a715c762699b"
    }
   ],
   "registros": 6662,
   "relatorio": "TR02-0L/TR02-0L.xlsx",
   "id": 2
  },
  {
   "cp": "TR03",
   "alvo": 0,
   "dir": "L",
   "pasta": "TR03-0L",
   "test_run": "Test Run 9",
   "data": "11/19/2026 4:03:40 PM",
   "ensaio": "LPTS-UFC-MTS SH Tension Retangular (Extensometer-Actuator) FASE SIGMA-11_11_2026",
   "largura": 5.99,
   "espessura": 5.99,
   "area": 35.8801,
   "Lc": 25.0,
   "A": 49.2,
   "obs": "A remedido no CP (valor corrigido; o relatório MTS indicava 30,0 %).",
   "calc": {
    "S0": 35.8801,
    "E_GPa": 201.94,
    "E_r2": 0.99977,
    "E_janela_MPa": [
     20.0,
     80.0
    ],
    "E_faixa_def": [
     0.0095,
     0.0392
    ],
    "E_b": 0.7208005723631551,
    "Rp02": 622.6,
    "Rp02_def": 0.5079,
    "Fp02_kN": 22.3389,
    "Fmax_kN": 29.1845,
    "Rm": 813.4,
    "d_Fmax_mm": 9.1066,
    "sensibilidade": [
     {
      "janela": [
       20.0,
       100.0
      ],
      "E_GPa": 202.2,
      "Rp02": 622.5
     },
     {
      "janela": [
       30.0,
       120.0
      ],
      "E_GPa": 202.4,
      "Rp02": 622.5
     }
    ]
   },
   "mts": {
    "E_GPa": 197.95,
    "Rp02": 623.59237,
    "Rm": 813.38949,
    "Fmax_kN": 29.1845,
    "A": 30.0
   },
   "ref": {
    "i": 3448,
    "t": 172.59782409668,
    "d": 0.761798000894487,
    "F": 24.726634765625,
    "e": 0.0109601374715567
   },
   "pausas": [
    {
     "t0": 172.59782409668,
     "t1": 217.56852722168,
     "dur": 44.970703125,
     "dF": -2.5944140625000003,
     "dd": 0.002090644557029009,
     "de": 0.0008672010153531994
    }
   ],
   "retirada_t": 219.76708984375,
   "arquivos": [
    {
     "nome": "DAQ- Actuator, … - (Timed).txt",
     "sha256": "551426cca7017746bc188049d5112acb33abf33515f18094904177363b4e5145",
     "registros": 3431,
     "t": [
      0.12337239831686,
      171.51171875
     ]
    },
    {
     "nome": "DAQ- Actuator, … - (Timed)1.txt",
     "sha256": "2a90e0b4c497fee16c8335e363f46581acfb076ffbdc7bf3460e4c86f1dd4af5",
     "registros": 3387,
     "t": [
      171.74836730957,
      385.85888671875
     ]
    },
    {
     "nome": "TR03 - 0L.xlsx",
     "sha256": "ce944a90e09c4abf4c6ff3134c27a9ce035a8277051a7d0cb0d2b067ac33410e"
    }
   ],
   "registros": 6818,
   "relatorio": "TR03 -0C/TR03 - 0L.xlsx",
   "id": 3
  },
  {
   "cp": "TR04",
   "alvo": 0,
   "dir": "C",
   "pasta": "TR01 -0L",
   "test_run": "Test Run 1",
   "data": "11/11/2026 10:15:38 AM",
   "ensaio": "LPTS-UFC-MTS SH Tension Retangular (Extensometer-Actuator) FASE SIGMA-11_11_2026",
   "largura": 5.92,
   "espessura": 5.99,
   "area": 35.4608,
   "Lc": 25.0,
   "A": 44.5,
   "obs": "",
   "calc": {
    "S0": 35.4608,
    "E_GPa": 203.99,
    "E_r2": 0.99958,
    "E_janela_MPa": [
     20.0,
     80.0
    ],
    "E_faixa_def": [
     0.01,
     0.0391
    ],
    "E_b": 0.03376869496043147,
    "Rp02": 589.4,
    "Rp02_def": 0.4889,
    "Fp02_kN": 20.8994,
    "Fmax_kN": 28.4921,
    "Rm": 803.5,
    "d_Fmax_mm": 8.682,
    "sensibilidade": [
     {
      "janela": [
       20.0,
       100.0
      ],
      "E_GPa": 203.7,
      "Rp02": 589.3
     },
     {
      "janela": [
       30.0,
       120.0
      ],
      "E_GPa": 204.0,
      "Rp02": 589.4
     }
    ],
    "obs_calc": "Recalculado a partir da curva reduzida do site (dados brutos ausentes da pasta)."
   },
   "mts": {
    "E_GPa": 197.22,
    "Rp02": 589.0903,
    "Rm": 803.48075,
    "Fmax_kN": 28.49207,
    "A": 44.5
   },
   "ref": {
    "i": 3444,
    "t": 173.00407409668,
    "d": 0.809721124824137,
    "F": 23.40229296875,
    "e": 0.0110226720571518
   },
   "pausas": [
    {
     "t0": 173.00407409668,
     "t1": 199.28694152832,
     "dur": 26.28286743164,
     "dF": -2.457582031250002,
     "dd": 0.0025932677090159117,
     "de": 0.001164706423878701
    }
   ],
   "retirada_t": 204.18376159668,
   "arquivos": [
    {
     "nome": "DAQ- Actuator, … - (Timed).txt",
     "sha256": "133aa0af1618760e92c30cc9b48559b587e2831241b66c5575420a15595dda7c",
     "registros": 3429,
     "t": [
      0.18701171875,
      171.47541809082
     ]
    },
    {
     "nome": "DAQ- Actuator, … - (Timed)1.txt",
     "sha256": "38b00da74362d55582d689b26637b62da34e5c9990f7d8ef0e31ee7eb0a17288",
     "registros": 3191,
     "t": [
      172.25456237793,
      357.883636474609
     ]
    },
    {
     "nome": "TR04 - 0C.xlsx",
     "sha256": "2baaa09bf9cae245fe780b9ee3fe8286995561ac4798df1e674988b2b394fb18"
    }
   ],
   "registros": 6620,
   "relatorio": "TR04-0C/TR04 - 0C.xlsx",
   "id": 4
  },
  {
   "cp": "TR05",
   "alvo": 0,
   "dir": "C",
   "pasta": "TR02 -0C",
   "test_run": "Test Run 2",
   "data": "11/11/2026 10:42:28 AM",
   "ensaio": "LPTS-UFC-MTS SH Tension Retangular (Extensometer-Actuator) FASE SIGMA-11_11_2026",
   "largura": 5.92,
   "espessura": 5.99,
   "area": 35.4608,
   "Lc": 25.0,
   "A": 44.5,
   "obs": "",
   "calc": {
    "S0": 35.4608,
    "E_GPa": 197.35,
    "E_r2": 0.99943,
    "E_janela_MPa": [
     20.0,
     80.0
    ],
    "E_faixa_def": [
     0.0104,
     0.0405
    ],
    "E_b": -0.5393895482138198,
    "Rp02": 583.6,
    "Rp02_def": 0.496,
    "Fp02_kN": 20.696,
    "Fmax_kN": 28.2776,
    "Rm": 797.4,
    "d_Fmax_mm": 8.3156,
    "sensibilidade": [
     {
      "janela": [
       20.0,
       100.0
      ],
      "E_GPa": 197.5,
      "Rp02": 583.6
     },
     {
      "janela": [
       30.0,
       120.0
      ],
      "E_GPa": 197.7,
      "Rp02": 583.5
     }
    ]
   },
   "mts": {
    "E_GPa": 191.2,
    "Rp02": 584.60603,
    "Rm": 797.43138,
    "Fmax_kN": 28.27755,
    "A": 44.5
   },
   "ref": {
    "i": 3426,
    "t": 171.37158203125,
    "d": 0.711950240656734,
    "F": 21.67266015625,
    "e": 0.0100002093240619
   },
   "pausas": [
    {
     "t0": 171.37158203125,
     "t1": 172.53596496582,
     "dur": 1.1643829345699999,
     "dF": 0.281132812500001,
     "dd": 0.00433030072599605,
     "de": 0.00010146573185920021
    },
    {
     "t0": 173.23551940918,
     "t1": 245.18864440918,
     "dur": 71.953125,
     "dF": -2.797214843749998,
     "dd": 0.006263668183236981,
     "de": 0.0014799404889345013
    }
   ],
   "retirada_t": 246.43782043457,
   "arquivos": [
    {
     "nome": "DAQ- Actuator, … - (Timed).txt",
     "sha256": "61bbb7da2a3639b78429fbed3f6519578469dafb53ef18ab2faf31fe5796f001",
     "registros": 3427,
     "t": [
      0.18310546875,
      171.37158203125
     ]
    },
    {
     "nome": "DAQ- Actuator, … - (Timed)1.txt",
     "sha256": "4f9b0ca3a0e02b0c825e8b14977747ac5d64619292beb0981c90b95f994d01fe",
     "registros": 3138,
     "t": [
      172.53596496582,
      401.18701171875
     ]
    },
    {
     "nome": "TR05 - 0C.xlsx",
     "sha256": "9a6b87cd2bfa73d318e5768acb91a966310a79bac3bb462879f78fe7a1e6868c"
    }
   ],
   "registros": 6565,
   "relatorio": "TR05-0C/TR05 - 0C.xlsx",
   "id": 5
  },
  {
   "cp": "TR06",
   "alvo": 0,
   "dir": "C",
   "pasta": "TR03 -0C",
   "test_run": "Test Run 3",
   "data": "11/11/2026 10:53:01 AM",
   "ensaio": "LPTS-UFC-MTS SH Tension Retangular (Extensometer-Actuator) FASE SIGMA-11_11_2026",
   "largura": 5.92,
   "espessura": 5.99,
   "area": 35.4608,
   "Lc": 25.0,
   "A": 45.5,
   "obs": "",
   "calc": {
    "S0": 35.4608,
    "E_GPa": 194.7,
    "E_r2": 0.9997,
    "E_janela_MPa": [
     20.0,
     80.0
    ],
    "E_faixa_def": [
     0.0101,
     0.0407
    ],
    "E_b": 0.5395752676797264,
    "Rp02": 576.0,
    "Rp02_def": 0.4956,
    "Fp02_kN": 20.4272,
    "Fmax_kN": 27.9767,
    "Rm": 788.9,
    "d_Fmax_mm": 8.6864,
    "sensibilidade": [
     {
      "janela": [
       20.0,
       100.0
      ],
      "E_GPa": 195.1,
      "Rp02": 575.8
     },
     {
      "janela": [
       30.0,
       120.0
      ],
      "E_GPa": 195.7,
      "Rp02": 575.5
     }
    ]
   },
   "mts": {
    "E_GPa": 185.31,
    "Rp02": 579.11405,
    "Rm": 788.94782,
    "Fmax_kN": 27.97672,
    "A": 45.5
   },
   "ref": {
    "i": 3446,
    "t": 172.43147277832,
    "d": 0.811910489574075,
    "F": 22.93640234375,
    "e": 0.0110069289803505
   },
   "pausas": [
    {
     "t0": 172.43147277832,
     "t1": 196.71565246582,
     "dur": 24.2841796875,
     "dF": -2.384408203125002,
     "dd": 0.0039009610190989807,
     "de": 0.0001816544681787005
    }
   ],
   "retirada_t": 198.46452331543,
   "arquivos": [
    {
     "nome": "DAQ- Actuator, … - (Timed).txt",
     "sha256": "200345e87eb16d326d6346c301a6516cf0c58a04e2889cef23d950bc91153dd8",
     "registros": 3431,
     "t": [
      0.11555989831686,
      171.50390625
     ]
    },
    {
     "nome": "DAQ- Actuator, … - (Timed)1.txt",
     "sha256": "faaf24bcc0dc67fe97f2bdc3d3c374cc74d5541e2295c8ad4062a29a0b9d45ed",
     "registros": 3072,
     "t": [
      171.68196105957,
      349.3662109375
     ]
    },
    {
     "nome": "TR06-0C.xlsx",
     "sha256": "4751a84c1a66eb8ee144c296c9397cb9675e30a4abac8afb1d1acac3f479abfc"
    }
   ],
   "registros": 6503,
   "relatorio": "TR06-0C/TR06-0C.xlsx",
   "id": 6
  },
  {
   "cp": "TR13",
   "alvo": 4,
   "dir": "L",
   "pasta": "TR13 - 4L",
   "test_run": "Test Run 16",
   "data": "11/24/2026 11:11:03 AM",
   "ensaio": "LPTS-UFC-MTS SH Tension Retangular (Extensometer-Actuator) FASE SIGMA-11_11_2026",
   "largura": 5.98,
   "espessura": 5.99,
   "area": 35.8202,
   "Lc": 25.0,
   "A": 39.5,
   "obs": "",
   "calc": {
    "S0": 35.8202,
    "E_GPa": 199.98,
    "E_r2": 0.99969,
    "E_janela_MPa": [
     20.0,
     80.0
    ],
    "E_faixa_def": [
     0.0097,
     0.0394
    ],
    "E_b": 0.8892169976324135,
    "Rp02": 489.9,
    "Rp02_def": 0.4446,
    "Fp02_kN": 17.55,
    "Fmax_kN": 28.805,
    "Rm": 804.2,
    "d_Fmax_mm": 8.5468,
    "sensibilidade": [
     {
      "janela": [
       20.0,
       100.0
      ],
      "E_GPa": 193.7,
      "Rp02": 493.8
     },
     {
      "janela": [
       30.0,
       120.0
      ],
      "E_GPa": 188.7,
      "Rp02": 496.5
     }
    ]
   },
   "mts": {
    "E_GPa": 132.38,
    "Rp02": 528.82042,
    "Rm": 804.15383,
    "Fmax_kN": 28.80495,
    "A": 39.5
   },
   "ref": {
    "i": 3426,
    "t": 171.37321472168,
    "d": 0.604328524786979,
    "F": 20.834458984375,
    "e": 0.0100000416859984
   },
   "pausas": [
    {
     "t0": 171.37321472168,
     "t1": 172.59797668457,
     "dur": 1.2247619628899997,
     "dF": -0.10058007812500236,
     "dd": 0.00041071325540509296,
     "de": 5.13149425388007e-05
    },
    {
     "t0": 173.29753112793,
     "t1": 203.02815246582,
     "dur": 29.73062133789,
     "dF": -2.248859375000002,
     "dd": 0.005733279976994021,
     "de": -4.321429878469986e-05
    }
   ],
   "retirada_t": 207.97492980957,
   "arquivos": [
    {
     "nome": "DAQ- Actuator, … - (Timed).txt",
     "sha256": "34d29b9b52fa4e1181920652e34fdc2cd84c6b737d9a925c43b2705e19e885a5",
     "registros": 3427,
     "t": [
      0.18473307788372,
      171.37321472168
     ]
    },
    {
     "nome": "DAQ- Actuator, … - (Timed)1.txt",
     "sha256": "66e727ad5d3c6d22a730f3b94fdc702b0bd48fc475fe626ac70234a9f814b1a4",
     "registros": 2789,
     "t": [
      172.59797668457,
      341.587890625
     ]
    },
    {
     "nome": "TR13 - 4L.xlsx",
     "sha256": "7521cb78d990b2e324ca2f3ab7be1f7a15a553a7c68d58b33066e17079f4726c"
    }
   ],
   "registros": 6216,
   "relatorio": "TR13 - 4L/TR13 - 4L.xlsx",
   "id": 7
  },
  {
   "cp": "TR14",
   "alvo": 4,
   "dir": "L",
   "pasta": "TR14 - 4L",
   "test_run": "Test Run 17",
   "data": "11/24/2026 11:23:54 AM",
   "ensaio": "LPTS-UFC-MTS SH Tension Retangular (Extensometer-Actuator) FASE SIGMA-11_11_2026",
   "largura": 5.887,
   "espessura": 5.99,
   "area": 35.26313,
   "Lc": 25.0,
   "A": 41.5,
   "obs": "",
   "calc": {
    "S0": 35.26313,
    "E_GPa": 207.1,
    "E_r2": 0.99939,
    "E_janela_MPa": [
     20.0,
     80.0
    ],
    "E_faixa_def": [
     0.0098,
     0.0386
    ],
    "E_b": 0.6348345112288416,
    "Rp02": 506.4,
    "Rp02_def": 0.4442,
    "Fp02_kN": 17.8556,
    "Fmax_kN": 29.0802,
    "Rm": 824.7,
    "d_Fmax_mm": 8.8688,
    "sensibilidade": [
     {
      "janela": [
       20.0,
       100.0
      ],
      "E_GPa": 201.5,
      "Rp02": 510.1
     },
     {
      "janela": [
       30.0,
       120.0
      ],
      "E_GPa": 195.4,
      "Rp02": 513.7
     }
    ]
   },
   "mts": {
    "E_GPa": 141.66,
    "Rp02": 546.48921,
    "Rm": 824.66379,
    "Fmax_kN": 29.08023,
    "A": 41.5
   },
   "ref": {
    "i": 3431,
    "t": 171.560546875,
    "d": 0.614106131251901,
    "F": 21.247009765625,
    "e": 0.0100011806935072
   },
   "pausas": [
    {
     "t0": 171.560546875,
     "t1": 172.56120300293,
     "dur": 1.0006561279300001,
     "dF": 0.31158984375000287,
     "dd": 0.004727276973426897,
     "de": 9.391456842420057e-05
    },
    {
     "t0": 173.8603515625,
     "t1": 208.48779296875,
     "dur": 34.62744140625,
     "dF": -2.513945312499999,
     "dd": 0.0015820842236280441,
     "de": 0.003091203980147901
    }
   ],
   "retirada_t": 213.88427734375,
   "arquivos": [
    {
     "nome": "DAQ- Actuator, … - (Timed).txt",
     "sha256": "b8fbf4714cedf4367b8f807b52de4a2f323134c79b3c97a1787cb843a3a6762b",
     "registros": 3432,
     "t": [
      0.12223307043314,
      171.560546875
     ]
    },
    {
     "nome": "DAQ- Actuator, … - (Timed)1.txt",
     "sha256": "33c48ff3a878031af005df17232e690c0abdabf1d7f658ec8867e5980ae7d4ba",
     "registros": 2995,
     "t": [
      172.56120300293,
      356.7412109375
     ]
    },
    {
     "nome": "TR14 - 4L.xlsx",
     "sha256": "4dc1168905fda0366e132831c6aafbbdddcf1d28c44037be3885b622372425ba"
    }
   ],
   "registros": 6427,
   "relatorio": "TR14 - 4L/TR14 - 4L.xlsx",
   "id": 8
  },
  {
   "cp": "TR15",
   "alvo": 4,
   "dir": "L",
   "pasta": "TR15 - 4L",
   "test_run": "Test Run 18",
   "data": "11/24/2026 11:39:18 AM",
   "ensaio": "LPTS-UFC-MTS SH Tension Retangular (Extensometer-Actuator) FASE SIGMA-11_11_2026",
   "largura": 5.88,
   "espessura": 5.99,
   "area": 35.2212,
   "Lc": 25.0,
   "A": 40.5,
   "obs": "",
   "calc": {
    "S0": 35.2212,
    "E_GPa": 201.36,
    "E_r2": 0.99949,
    "E_janela_MPa": [
     20.0,
     80.0
    ],
    "E_faixa_def": [
     0.0096,
     0.0392
    ],
    "E_b": 0.504629586843537,
    "Rp02": 508.6,
    "Rp02_def": 0.4523,
    "Fp02_kN": 17.9129,
    "Fmax_kN": 28.9536,
    "Rm": 822.1,
    "d_Fmax_mm": 8.4759,
    "sensibilidade": [
     {
      "janela": [
       20.0,
       100.0
      ],
      "E_GPa": 197.8,
      "Rp02": 508.6
     },
     {
      "janela": [
       30.0,
       120.0
      ],
      "E_GPa": 193.7,
      "Rp02": 511.3
     }
    ]
   },
   "mts": {
    "E_GPa": 137.61,
    "Rp02": 547.70541,
    "Rm": 822.05145,
    "Fmax_kN": 28.95364,
    "A": 40.5
   },
   "ref": {
    "i": 3442,
    "t": 172.24072265625,
    "d": 0.649373396299779,
    "F": 22.84134765625,
    "e": 0.0109887039288878
   },
   "pausas": [
    {
     "t0": 172.24072265625,
     "t1": 251.03938293457,
     "dur": 78.79866027832,
     "dF": -2.8573671874999995,
     "dd": 0.005348585546017026,
     "de": 0.004307814873754999
    }
   ],
   "retirada_t": 255.28662109375,
   "arquivos": [
    {
     "nome": "DAQ- Actuator, … - (Timed).txt",
     "sha256": "1ca76e86daeb9d22f83f90a0f9f261d19b3c0fe780a855fe8813de71031caf7a",
     "registros": 3430,
     "t": [
      0.11800130456686,
      171.45637512207
     ]
    },
    {
     "nome": "DAQ- Actuator, … - (Timed)1.txt",
     "sha256": "1ac0cbc5f3eb1a47484bd2d7e1b57970ccb6d8fab5f58b71b635d732bb939f65",
     "registros": 2804,
     "t": [
      171.64111328125,
      390.448577880859
     ]
    },
    {
     "nome": "TR15 - 4L.xlsx",
     "sha256": "631100819d53490bba74cf55fe4f4efc410b443586588fade6a472e8b284b566"
    }
   ],
   "registros": 6234,
   "relatorio": "TR15 - 4L/TR15 - 4L.xlsx",
   "id": 9
  },
  {
   "cp": "TR16",
   "alvo": 4,
   "dir": "C",
   "pasta": "TR16 - 4C",
   "test_run": "Test Run 10",
   "data": "11/23/2026 3:08:37 PM",
   "ensaio": "LPTS-UFC-MTS SH Tension Retangular (Extensometer-Actuator) FASE SIGMA-11_11_2026",
   "largura": 5.82,
   "espessura": 6.02,
   "area": 35.0364,
   "Lc": 25.0,
   "A": 31.0,
   "obs": "",
   "calc": {
    "S0": 35.0364,
    "E_GPa": 194.9,
    "E_r2": 0.99966,
    "E_janela_MPa": [
     20.0,
     80.0
    ],
    "E_faixa_def": [
     0.0105,
     0.0414
    ],
    "E_b": -0.28189495903050577,
    "Rp02": 484.6,
    "Rp02_def": 0.4488,
    "Fp02_kN": 16.9771,
    "Fmax_kN": 27.0501,
    "Rm": 772.1,
    "d_Fmax_mm": 7.8508,
    "sensibilidade": [
     {
      "janela": [
       20.0,
       100.0
      ],
      "E_GPa": 190.6,
      "Rp02": 485.8
     },
     {
      "janela": [
       30.0,
       120.0
      ],
      "E_GPa": 186.5,
      "Rp02": 486.6
     }
    ]
   },
   "mts": {
    "E_GPa": 138.66,
    "Rp02": 511.08772,
    "Rm": 772.05766,
    "Fmax_kN": 27.05012,
    "A": 31.0
   },
   "ref": {
    "i": 3441,
    "t": 172.9462890625,
    "d": 0.667327898554504,
    "F": 21.251896484375,
    "e": 0.0110641866922379
   },
   "pausas": [
    {
     "t0": 172.9462890625,
     "t1": 196.58088684082,
     "dur": 23.63459777832,
     "dF": -2.1421035156249992,
     "dd": 0.00039039878174695897,
     "de": 0.005605740472674299
    }
   ],
   "retirada_t": 201.92741394043,
   "arquivos": [
    {
     "nome": "DAQ- Actuator, … - (Timed).txt",
     "sha256": "fce881c16a55d6b61f2de44562e73a380542f32a06f2dd4521ef4b0710678d42",
     "registros": 3429,
     "t": [
      0.18603515625,
      171.47444152832
     ]
    },
    {
     "nome": "DAQ- Actuator, … - (Timed)1.txt",
     "sha256": "be21e45d23a515a89c95ca4fceba6b0a5482252c940a7d74d76dfedcb8de9887",
     "registros": 2265,
     "t": [
      172.3466796875,
      309.0576171875
     ]
    },
    {
     "nome": "TR16-4C.xlsx",
     "sha256": "1764a71adaf54c53ef4eb887c4bc0aa9eee8a93fdffa43838b0a204de6fe8936"
    }
   ],
   "registros": 5694,
   "relatorio": "TR16 - 4C/TR16-4C.xlsx",
   "id": 10
  },
  {
   "cp": "TR17",
   "alvo": 4,
   "dir": "C",
   "pasta": "TR17 - 4C",
   "test_run": "Test Run 11",
   "data": "11/23/2026 3:38:37 PM",
   "ensaio": "LPTS-UFC-MTS SH Tension Retangular (Extensometer-Actuator) FASE SIGMA-11_11_2026",
   "largura": 5.82,
   "espessura": 6.02,
   "area": 35.0364,
   "Lc": 25.0,
   "A": 38.0,
   "obs": "",
   "calc": {
    "S0": 35.0364,
    "E_GPa": 194.9,
    "E_r2": 0.99978,
    "E_janela_MPa": [
     20.0,
     80.0
    ],
    "E_faixa_def": [
     0.01,
     0.0411
    ],
    "E_b": 0.3065161400194988,
    "Rp02": 484.9,
    "Rp02_def": 0.4487,
    "Fp02_kN": 16.9904,
    "Fmax_kN": 27.4417,
    "Rm": 783.2,
    "d_Fmax_mm": 7.5183,
    "sensibilidade": [
     {
      "janela": [
       20.0,
       100.0
      ],
      "E_GPa": 191.0,
      "Rp02": 486.8
     },
     {
      "janela": [
       30.0,
       120.0
      ],
      "E_GPa": 186.9,
      "Rp02": 489.3
     }
    ]
   },
   "mts": {
    "E_GPa": 137.6,
    "Rp02": 514.25926,
    "Rm": 783.23421,
    "Fmax_kN": 27.44171,
    "A": 38.0
   },
   "ref": {
    "i": 3443,
    "t": 172.29850769043,
    "d": 0.676477269735187,
    "F": 21.3546875,
    "e": 0.0109883937984705
   },
   "pausas": [
    {
     "t0": 172.29850769043,
     "t1": 198.78125,
     "dur": 26.48274230957,
     "dF": -2.2158222656250004,
     "dd": 0.002489774487912988,
     "de": 0.0018526138737797997
    }
   ],
   "retirada_t": 203.52815246582,
   "arquivos": [
    {
     "nome": "DAQ- Actuator, … - (Timed).txt",
     "sha256": "28dfd6c5bacb09c15748683377f3d600af39d4d4e3e3918ac1b9d042effaaeed",
     "registros": 3429,
     "t": [
      0.12255859375,
      171.41096496582
     ]
    },
    {
     "nome": "DAQ- Actuator, … - (Timed)1.txt",
     "sha256": "6670acec5696c73a6415429473aba07ec9edd5ad43d5342f9c9d7ae58dacaa0d",
     "registros": 2322,
     "t": [
      171.59895324707,
      314.006195068359
     ]
    },
    {
     "nome": "TR17-4C.xlsx",
     "sha256": "5c95eba18f6a82efdfefb8b68eaa474e1d7511693b57d0e90c611df06c473839"
    }
   ],
   "registros": 5751,
   "relatorio": "TR17 - 4C/TR17-4C.xlsx",
   "id": 11
  },
  {
   "cp": "TR18",
   "alvo": 4,
   "dir": "C",
   "pasta": "TR18 - 4C",
   "test_run": "Test Run 12",
   "data": "11/23/2026 3:46:30 PM",
   "ensaio": "LPTS-UFC-MTS SH Tension Retangular (Extensometer-Actuator) FASE SIGMA-11_11_2026",
   "largura": 5.82,
   "espessura": 6.02,
   "area": 35.0364,
   "Lc": 25.0,
   "A": 36.0,
   "obs": "",
   "calc": {
    "S0": 35.0364,
    "E_GPa": 198.96,
    "E_r2": 0.99975,
    "E_janela_MPa": [
     20.0,
     80.0
    ],
    "E_faixa_def": [
     0.0102,
     0.0399
    ],
    "E_b": 0.20907156010031946,
    "Rp02": 482.3,
    "Rp02_def": 0.4423,
    "Fp02_kN": 16.8985,
    "Fmax_kN": 27.8812,
    "Rm": 795.8,
    "d_Fmax_mm": 7.9271,
    "sensibilidade": [
     {
      "janela": [
       20.0,
       100.0
      ],
      "E_GPa": 194.8,
      "Rp02": 483.9
     },
     {
      "janela": [
       30.0,
       120.0
      ],
      "E_GPa": 187.9,
      "Rp02": 487.8
     }
    ]
   },
   "mts": {
    "E_GPa": 132.62,
    "Rp02": 519.15678,
    "Rm": 795.77886,
    "Fmax_kN": 27.88123,
    "A": 36.0
   },
   "ref": {
    "i": 3445,
    "t": 172.41162109375,
    "d": 0.675496528856456,
    "F": 21.539380859375,
    "e": 0.0109588345512748
   },
   "pausas": [
    {
     "t0": 172.41162109375,
     "t1": 211.236328125,
     "dur": 38.82470703125,
     "dF": -2.363822265625,
     "dd": 0.004393106792122015,
     "de": 0.001164858229458299
    }
   ],
   "retirada_t": 217.28239440918,
   "arquivos": [
    {
     "nome": "DAQ- Actuator, … - (Timed).txt",
     "sha256": "3de103145f7a7d4f44ff91ef268e908ea0486ae0a053f55147b3ed0f08a6c40f",
     "registros": 3429,
     "t": [
      0.12141927331686,
      171.40983581543
     ]
    },
    {
     "nome": "DAQ- Actuator, … - (Timed)1.txt",
     "sha256": "c5cf6b380ef3656ec6b66fa78239ae2f2570e242b17574179f8c3ce984d53d31",
     "registros": 2413,
     "t": [
      171.61213684082,
      330.908355712891
     ]
    },
    {
     "nome": "TR18 - 4C.xlsx",
     "sha256": "f95cc6bfae9ccae3ce67445d993b0be2f6b93ceb353bcb1be61c58ac9aa159fc"
    }
   ],
   "registros": 5842,
   "relatorio": "TR18 - 4C/TR18 - 4C.xlsx",
   "id": 12
  },
  {
   "cp": "TR19",
   "alvo": 6,
   "dir": "L",
   "pasta": "TR19 - 6L",
   "test_run": "Test Run 20",
   "data": "11/24/2026 12:01:15 PM",
   "ensaio": "LPTS-UFC-MTS SH Tension Retangular (Extensometer-Actuator) FASE SIGMA-11_11_2026",
   "largura": 5.98,
   "espessura": 6.0,
   "area": 35.88,
   "Lc": 25.0,
   "A": 37.5,
   "obs": "",
   "calc": {
    "S0": 35.88,
    "E_GPa": 194.19,
    "E_r2": 0.99953,
    "E_janela_MPa": [
     20.0,
     80.0
    ],
    "E_faixa_def": [
     0.0101,
     0.0409
    ],
    "E_b": 1.1188100950450799,
    "Rp02": 489.9,
    "Rp02_def": 0.4517,
    "Fp02_kN": 17.5772,
    "Fmax_kN": 29.0709,
    "Rm": 810.2,
    "d_Fmax_mm": 7.6389,
    "sensibilidade": [
     {
      "janela": [
       20.0,
       100.0
      ],
      "E_GPa": 189.7,
      "Rp02": 491.7
     },
     {
      "janela": [
       30.0,
       120.0
      ],
      "E_GPa": 184.0,
      "Rp02": 497.6
     }
    ]
   },
   "mts": {
    "E_GPa": 129.83,
    "Rp02": 532.1393,
    "Rm": 810.22707,
    "Fmax_kN": 29.07095,
    "A": 37.5
   },
   "ref": {
    "i": 3445,
    "t": 172.41975402832,
    "d": 0.653114053420722,
    "F": 22.8939375,
    "e": 0.0109717641025782
   },
   "pausas": [
    {
     "t0": 172.41975402832,
     "t1": 204.64875793457,
     "dur": 32.22900390625,
     "dF": -2.5273671875000012,
     "dd": 0.0005121110007169083,
     "de": 0.0016974238678812998
    }
   ],
   "retirada_t": 208.94596862793,
   "arquivos": [
    {
     "nome": "DAQ- Actuator, … - (Timed).txt",
     "sha256": "2ae88261eb0698c8fee4a5c5877e15e737e88634630345b6f933b7abb238f51e",
     "registros": 3431,
     "t": [
      0.1201171875,
      171.50846862793
     ]
    },
    {
     "nome": "DAQ- Actuator, … - (Timed)1.txt",
     "sha256": "1ac60e00bea09b4ba504f1398240369b60e5709782d26bd93e5d8feb12227025",
     "registros": 2513,
     "t": [
      171.72021484375,
      329.41748046875
     ]
    },
    {
     "nome": "TR19 - 6L.xlsx",
     "sha256": "f94c04cd6166050f9e0aae9b291d14ae328152a03d8bce7b4353da349853556d"
    }
   ],
   "registros": 5944,
   "relatorio": "TR19 - 6L/TR19 - 6L.xlsx",
   "id": 13
  },
  {
   "cp": "TR20",
   "alvo": 6,
   "dir": "L",
   "pasta": "TR20 - 6L",
   "test_run": "Test Run 21",
   "data": "11/24/2026 1:26:59 PM",
   "ensaio": "LPTS-UFC-MTS SH Tension Retangular (Extensometer-Actuator) FASE SIGMA-11_11_2026",
   "largura": 5.98,
   "espessura": 6.0,
   "area": 35.88,
   "Lc": 25.0,
   "A": 38.5,
   "obs": "",
   "calc": {
    "S0": 35.88,
    "E_GPa": 200.71,
    "E_r2": 0.99942,
    "E_janela_MPa": [
     20.0,
     80.0
    ],
    "E_faixa_def": [
     0.0101,
     0.0394
    ],
    "E_b": -0.10549243304968074,
    "Rp02": 500.2,
    "Rp02_def": 0.4493,
    "Fp02_kN": 17.9476,
    "Fmax_kN": 28.9869,
    "Rm": 807.9,
    "d_Fmax_mm": 7.5869,
    "sensibilidade": [
     {
      "janela": [
       20.0,
       100.0
      ],
      "E_GPa": 198.1,
      "Rp02": 501.1
     },
     {
      "janela": [
       30.0,
       120.0
      ],
      "E_GPa": 194.4,
      "Rp02": 502.9
     }
    ]
   },
   "mts": {
    "E_GPa": 136.26,
    "Rp02": 536.15143,
    "Rm": 807.8849,
    "Fmax_kN": 28.98691,
    "A": 38.5
   },
   "ref": {
    "i": 3444,
    "t": 172.357421875,
    "d": 0.67116366699338,
    "F": 22.8530390625,
    "e": 0.0110249798744917
   },
   "pausas": [
    {
     "t0": 172.357421875,
     "t1": 224.47346496582,
     "dur": 52.11604309082,
     "dF": -2.7407382812499996,
     "dd": -0.005309469997883065,
     "de": 0.0026732897385954996
    }
   ],
   "retirada_t": 236.46565246582,
   "arquivos": [
    {
     "nome": "DAQ- Actuator, … - (Timed).txt",
     "sha256": "5c7a9a883aefba2558df6bf9b3f714b3e9251b428f194c5cf52139b90674dee9",
     "registros": 3430,
     "t": [
      0.12386067956686,
      171.46223449707
     ]
    },
    {
     "nome": "DAQ- Actuator, … - (Timed)1.txt",
     "sha256": "6d61e6fd6fa9a0e117b6d1d6844411f99de8efac14e4841a36a517a2cf2d0bbb",
     "registros": 2534,
     "t": [
      171.65788269043,
      350.29150390625
     ]
    },
    {
     "nome": "TR20 - 6L.xlsx",
     "sha256": "23e3b0fd4bb1c3ff24a8a6fdc0285d99209ac7abc2d04f88c03fec82ccd6613c"
    }
   ],
   "registros": 5964,
   "relatorio": "TR20 - 6L/TR20 - 6L.xlsx",
   "id": 14
  },
  {
   "cp": "TR21",
   "alvo": 6,
   "dir": "L",
   "pasta": "TR21 - 6L",
   "test_run": "Test Run 22",
   "data": "11/24/2026 1:37:28 PM",
   "ensaio": "LPTS-UFC-MTS SH Tension Retangular (Extensometer-Actuator) FASE SIGMA-11_11_2026",
   "largura": 5.98,
   "espessura": 6.0,
   "area": 35.88,
   "Lc": 25.0,
   "A": 38.0,
   "obs": "",
   "calc": {
    "S0": 35.88,
    "E_GPa": 195.1,
    "E_r2": 0.99897,
    "E_janela_MPa": [
     20.0,
     80.0
    ],
    "E_faixa_def": [
     0.01,
     0.0404
    ],
    "E_b": 1.9963461833146334,
    "Rp02": 480.3,
    "Rp02_def": 0.4451,
    "Fp02_kN": 17.2317,
    "Fmax_kN": 28.8717,
    "Rm": 804.7,
    "d_Fmax_mm": 7.8154,
    "sensibilidade": [
     {
      "janela": [
       20.0,
       100.0
      ],
      "E_GPa": 189.4,
      "Rp02": 483.6
     },
     {
      "janela": [
       30.0,
       120.0
      ],
      "E_GPa": 182.2,
      "Rp02": 488.2
     }
    ]
   },
   "mts": {
    "E_GPa": 126.69,
    "Rp02": 525.02183,
    "Rm": 804.67318,
    "Fmax_kN": 28.87167,
    "A": 38.0
   },
   "ref": {
    "i": 3447,
    "t": 172.53401184082,
    "d": 0.654212781228125,
    "F": 22.5915,
    "e": 0.0110325189307332
   },
   "pausas": [
    {
     "t0": 172.53401184082,
     "t1": 203.51383972168,
     "dur": 30.97982788086,
     "dF": -2.4903417968750006,
     "dd": -0.0017603160813449703,
     "de": 0.002025818452239
    }
   ],
   "retirada_t": 210.45930480957,
   "arquivos": [
    {
     "nome": "DAQ- Actuator, … - (Timed).txt",
     "sha256": "792224fc213013b31f2f5a9305b8ebb49022009dd4ba52e2c7fe4b6bc0505424",
     "registros": 3431,
     "t": [
      0.11897786706686,
      171.50732421875
     ]
    },
    {
     "nome": "DAQ- Actuator, … - (Timed)1.txt",
     "sha256": "b16623c8de6b12abc8ca1bc293bb958696cb034db9de92bb28dd2d458dbafe0b",
     "registros": 2537,
     "t": [
      171.73454284668,
      329.3818359375
     ]
    },
    {
     "nome": "TR21 - 6L.xlsx",
     "sha256": "a5a7834811477d0b26723d3d801dea2524b8fb4421ebd6719a4981f46f44a934"
    }
   ],
   "registros": 5968,
   "relatorio": "TR21 - 6L/TR21 - 6L.xlsx",
   "id": 15
  },
  {
   "cp": "TR22",
   "alvo": 6,
   "dir": "C",
   "pasta": "TR22 - 6C",
   "test_run": "Test Run 13",
   "data": "11/23/2026 3:57:42 PM",
   "ensaio": "LPTS-UFC-MTS SH Tension Retangular (Extensometer-Actuator) FASE SIGMA-11_11_2026",
   "largura": 5.82,
   "espessura": 6.02,
   "area": 35.0364,
   "Lc": 25.0,
   "A": 32.0,
   "obs": "",
   "calc": {
    "S0": 35.0364,
    "E_GPa": 189.83,
    "E_r2": 0.99981,
    "E_janela_MPa": [
     20.0,
     80.0
    ],
    "E_faixa_def": [
     0.0107,
     0.0417
    ],
    "E_b": 0.6800617489195551,
    "Rp02": 489.8,
    "Rp02_def": 0.4577,
    "Fp02_kN": 17.1598,
    "Fmax_kN": 27.2832,
    "Rm": 778.7,
    "d_Fmax_mm": 6.7451,
    "sensibilidade": [
     {
      "janela": [
       20.0,
       100.0
      ],
      "E_GPa": 187.9,
      "Rp02": 490.1
     },
     {
      "janela": [
       30.0,
       120.0
      ],
      "E_GPa": 184.3,
      "Rp02": 492.3
     }
    ]
   },
   "mts": {
    "E_GPa": 138.89,
    "Rp02": 518.93921,
    "Rm": 778.70945,
    "Fmax_kN": 27.28318,
    "A": 32.0
   },
   "ref": {
    "i": 3446,
    "t": 172.46305847168,
    "d": 0.693030771799386,
    "F": 21.59494140625,
    "e": 0.0109128030017018
   },
   "pausas": [
    {
     "t0": 172.46305847168,
     "t1": 199.49543762207,
     "dur": 27.03237915039,
     "dF": -2.2454687500000006,
     "dd": 0.001460430212318009,
     "de": 0.0016255034133791993
    }
   ],
   "retirada_t": 206.94059753418,
   "arquivos": [
    {
     "nome": "DAQ- Actuator, … - (Timed).txt",
     "sha256": "fd56474a69398b20f2ca3b198163925a4b2e330d0f61e4fdccd4bd9cba580d24",
     "registros": 3430,
     "t": [
      0.11751302331686,
      171.45588684082
     ]
    },
    {
     "nome": "DAQ- Actuator, … - (Timed)1.txt",
     "sha256": "016eb29240d69f2fb92cd96ad292ffe664e6f23cbf46f4597ba3313d63eaf814",
     "registros": 2045,
     "t": [
      171.66357421875,
      300.779449462891
     ]
    },
    {
     "nome": "TR22-6C.xlsx",
     "sha256": "b2894a535058fba0e7b063444025d14586ed06847fbc4b6c35a26d125a3c2071"
    }
   ],
   "registros": 5475,
   "relatorio": "TR22 - 6C/TR22-6C.xlsx",
   "id": 16
  },
  {
   "cp": "TR23",
   "alvo": 6,
   "dir": "C",
   "pasta": "TR23 - 6C",
   "test_run": "Test Run 14",
   "data": "11/23/2026 4:06:32 PM",
   "ensaio": "LPTS-UFC-MTS SH Tension Retangular (Extensometer-Actuator) FASE SIGMA-11_11_2026",
   "largura": 5.82,
   "espessura": 6.02,
   "area": 35.0364,
   "Lc": 25.0,
   "A": 31.0,
   "obs": "",
   "calc": {
    "S0": 35.0364,
    "E_GPa": 193.01,
    "E_r2": 0.99964,
    "E_janela_MPa": [
     20.0,
     80.0
    ],
    "E_faixa_def": [
     0.0102,
     0.0414
    ],
    "E_b": 0.8491057081289247,
    "Rp02": 480.2,
    "Rp02_def": 0.4484,
    "Fp02_kN": 16.8247,
    "Fmax_kN": 26.9896,
    "Rm": 770.3,
    "d_Fmax_mm": 7.0006,
    "sensibilidade": [
     {
      "janela": [
       20.0,
       100.0
      ],
      "E_GPa": 189.9,
      "Rp02": 482.7
     },
     {
      "janela": [
       30.0,
       120.0
      ],
      "E_GPa": 185.8,
      "Rp02": 485.7
     }
    ]
   },
   "mts": {
    "E_GPa": 137.54,
    "Rp02": 511.04307,
    "Rm": 770.331,
    "Fmax_kN": 26.98962,
    "A": 31.0
   },
   "ref": {
    "i": 3445,
    "t": 172.41047668457,
    "d": 0.67330157617107,
    "F": 21.277994140625,
    "e": 0.0109436959028244
   },
   "pausas": [
    {
     "t0": 172.41047668457,
     "t1": 197.99382019043,
     "dur": 25.58334350586,
     "dF": -2.1823964843750012,
     "dd": 0.003588269464671945,
     "de": 0.007487883791327499
    }
   ],
   "retirada_t": 202.39094543457,
   "arquivos": [
    {
     "nome": "DAQ- Actuator, … - (Timed).txt",
     "sha256": "d109640b60c8329fc9ba95987f8fe8d494810350fd1d21034babffb774bfa4bb",
     "registros": 3430,
     "t": [
      0.13069660961628,
      171.46907043457
     ]
    },
    {
     "nome": "DAQ- Actuator, … - (Timed)1.txt",
     "sha256": "44ebe7a82ccc4d63cd07439389299c212e928a1bb7dd57d6d574b01fe64a1fbb",
     "registros": 2024,
     "t": [
      171.66096496582,
      298.278472900391
     ]
    },
    {
     "nome": "TR23-6C.xlsx",
     "sha256": "722a9bae4da242c373f868ee9cb313972a69dafb3aa12ef9b0031ccbff4416e8"
    }
   ],
   "registros": 5454,
   "relatorio": "TR23 - 6C/TR23-6C.xlsx",
   "id": 17
  },
  {
   "cp": "TR24",
   "alvo": 6,
   "dir": "C",
   "pasta": "TR24-6C",
   "test_run": "Test Run 15",
   "data": "11/23/2026 4:14:54 PM",
   "ensaio": "LPTS-UFC-MTS SH Tension Retangular (Extensometer-Actuator) FASE SIGMA-11_11_2026",
   "largura": 5.82,
   "espessura": 6.02,
   "area": 35.0364,
   "Lc": 25.0,
   "A": 31.0,
   "obs": "",
   "calc": {
    "S0": 35.0364,
    "E_GPa": 196.63,
    "E_r2": 0.99977,
    "E_janela_MPa": [
     20.0,
     80.0
    ],
    "E_faixa_def": [
     0.0104,
     0.0405
    ],
    "E_b": 0.2211240447701186,
    "Rp02": 491.8,
    "Rp02_def": 0.45,
    "Fp02_kN": 17.2318,
    "Fmax_kN": 27.8574,
    "Rm": 795.1,
    "d_Fmax_mm": 7.5698,
    "sensibilidade": [
     {
      "janela": [
       20.0,
       100.0
      ],
      "E_GPa": 193.6,
      "Rp02": 494.5
     },
     {
      "janela": [
       30.0,
       120.0
      ],
      "E_GPa": 189.7,
      "Rp02": 496.2
     }
    ]
   },
   "mts": {
    "E_GPa": 140.07,
    "Rp02": 520.9363,
    "Rm": 795.09748,
    "Fmax_kN": 27.85735,
    "A": 31.0
   },
   "ref": {
    "i": 3447,
    "t": 173.23860168457,
    "d": 0.688111700583249,
    "F": 21.774125,
    "e": 0.0109749250113964
   },
   "pausas": [
    {
     "t0": 173.23860168457,
     "t1": 197.72265625,
     "dur": 24.48405456543,
     "dF": -2.19205078125,
     "dd": 0.004966335836797953,
     "de": 0.003131871111691
    }
   ],
   "retirada_t": 204.0185546875,
   "arquivos": [
    {
     "nome": "DAQ- Actuator, … - (Timed).txt",
     "sha256": "ce51c0c0b5a8663f8000b20c7c34899f608185e3e9f4165a727d49029ae8560b",
     "registros": 3430,
     "t": [
      0.13216145336628,
      171.47053527832
     ]
    },
    {
     "nome": "DAQ- Actuator, … - (Timed)1.txt",
     "sha256": "606fb82b751d7d9e66ffe7d9f9f449b59892e0633ddef182d45b154e02cebe5c",
     "registros": 2189,
     "t": [
      172.38916015625,
      306.152008056641
     ]
    },
    {
     "nome": "TR24 -6C.xlsx",
     "sha256": "60fb5d3c02d2897827c9a84a9676b2c7b9265125fcff7716e339fb6aff94aa52"
    }
   ],
   "registros": 5619,
   "relatorio": "TR24-6C/TR24 -6C.xlsx",
   "id": 18
  }
 ]
};
