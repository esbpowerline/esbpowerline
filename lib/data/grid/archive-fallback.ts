// Auto-generated thin fallback — canonical source is public/data/daily/{YYYY-MM-DD}.json
import type { GridDailyData } from './types';

/** Offline/fetch-failure fallback keyed by YYYY-MM-DD. */
export const powerGridArchive: Record<string, GridDailyData> = {
  "2026-05-31": {
      "systemStats": {
        "date": "31 May 2026",
        "dayPeakGen": 11716.03,
        "eveningPeakGen": 14206.5,
        "dayPeakDemand": 11716.03,
        "eveningPeakDemand": 14255.5,
        "minGen": 11105.13,
        "maxGen": 14513.5,
        "totalEnergyGen": 303.6267983,
        "totalEnergyUnserved": 0.641,
        "totalEnergyDemand": 304.268,
        "maxTemp": 36.4,
        "totalGasSuppliedPower": 1142.66,
        "avgProductionCost": 5.523,
        "totalDailyCost": 1677078190
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 157.32,
          "cost": 568408756,
          "unitCost": 3.6131,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 84.51,
          "cost": 555629070,
          "unitCost": 6.575,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 15.89,
          "cost": 265508449,
          "unitCost": 16.7134,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 1.67,
          "cost": 167432,
          "unitCost": 0.1,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 5.01,
          "cost": 80991763,
          "unitCost": 16.1615,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 39.16,
          "cost": 205391268,
          "unitCost": 5.2443,
          "color": "#a855f7"
        },
        {
          "name": "HSD",
          "gen": 0,
          "cost": 0,
          "unitCost": null,
          "color": "#ef4444"
        },
        {
          "name": "Wind",
          "gen": 0.07,
          "cost": 981451,
          "unitCost": 14.71,
          "color": "#22c55e"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 22.48,
          "peakFlow": 931,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 13.13,
          "peakFlow": 746,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.55,
          "peakFlow": 170,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 0,
          "demand": 3795,
          "pct": 0
        },
        {
          "zone": "Chattogram",
          "loadShed": 0,
          "demand": 1342,
          "pct": 0
        },
        {
          "zone": "Khulna",
          "loadShed": 0,
          "demand": 1948,
          "pct": 0
        },
        {
          "zone": "Rajshahi",
          "loadShed": 0,
          "demand": 1609,
          "pct": 0
        },
        {
          "zone": "Cumilla",
          "loadShed": 3,
          "demand": 1569,
          "pct": 0.19
        },
        {
          "zone": "Mymensingh",
          "loadShed": 33,
          "demand": 1289,
          "pct": 2.56
        },
        {
          "zone": "Sylhet",
          "loadShed": 11,
          "demand": 680,
          "pct": 1.62
        },
        {
          "zone": "Barishal",
          "loadShed": 0,
          "demand": 529,
          "pct": 0
        },
        {
          "zone": "Rangpur",
          "loadShed": 0,
          "demand": 1031,
          "pct": 0
        }
      ],
      "dailyOutages": [
        {
          "time": "08:39 - 12:18",
          "plant": "Khulna(C )-Khulna (S)  132kV Ckt-2 Scheduled",
          "load": "HT Outage",
          "reason": "for reduce temperature. and from Khulna(S) 230/132kVend.",
          "full_desc": "Khulna(C )-Khulna (S)  132kV Ckt-2 Scheduled S/D from Khulna (C) end Due to Due to replacement of DS arms for reduce temperature. and from Khulna(S) 230/132kVend."
        },
        {
          "time": "09:46",
          "plant": "Barishal 230/132kV S/S T-4 HT",
          "load": "HT Outage",
          "reason": "Barishal 230/132kV S/S T-4 HT is restored.",
          "full_desc": "Barishal 230/132kV S/S T-4 HT is restored."
        },
        {
          "time": "09:51",
          "plant": "Barishal 230/132kV S/S T-4 LT",
          "load": "HT Outage",
          "reason": "Barishal 230/132kV S/S T-4 LT is restored.",
          "full_desc": "Barishal 230/132kV S/S T-4 LT is restored."
        },
        {
          "time": "10:10 - 12:20",
          "plant": "Kodda 132/33kV S/S Summit 149 MW PS Scheduled S/D",
          "load": "149 MW",
          "reason": "Due to work by Summit",
          "full_desc": "Kodda 132/33kV S/S Summit 149 MW PS Scheduled S/D Due to work by Summit"
        },
        {
          "time": "10:30 - 16:25",
          "plant": "Kaliakoir 400/230/132kV S/S Bibiyana1 Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Disc cleaning",
          "full_desc": "Kaliakoir 400/230/132kV S/S Bibiyana1 Scheduled S/D Due to Disc cleaning"
        },
        {
          "time": "11:11 - 12:55",
          "plant": "Mithapukur 132/33kV S/S TR-1(404T) LT Forced S/D",
          "load": "22.0MW",
          "reason": "Due to Red hot maintenance.",
          "full_desc": "Mithapukur 132/33kV S/S TR-1(404T) LT Forced S/D Due to Red hot maintenance."
        },
        {
          "time": "11:11 - 12:55",
          "plant": "Mithapukur 132/33kV S/S TR-1(404T) HT Forced S/D",
          "load": "22.0MW",
          "reason": "Due to Red hot maintenance.",
          "full_desc": "Mithapukur 132/33kV S/S TR-1(404T) HT Forced S/D Due to Red hot maintenance."
        },
        {
          "time": "11:11 - 17:02",
          "plant": "Shyampur-Shyampur(New) 132kV Ckt-2 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Maintenance work at Shyampur old Substation end",
          "full_desc": "Shyampur-Shyampur(New) 132kV Ckt-2 Scheduled S/D from Shyampur 230/132kV end Due to Maintenance work at Shyampur old Substation end"
        },
        {
          "time": "12:25 - 12:56",
          "plant": "Lalmonirhat-Rangpur 132 kV Ckt-2 Tripped from Lalmonirhat 132/33kV end showing Directional E/F Relay relays. and from Rangpur 132/33kV end showing Distance Relay relays",
          "load": "HT Outage",
          "reason": "Due to Unknown",
          "full_desc": "Lalmonirhat-Rangpur 132 kV Ckt-2 Tripped from Lalmonirhat 132/33kV end showing Directional E/F Relay relays. and from Rangpur 132/33kV end showing Distance Relay relays Due to Unknown"
        },
        {
          "time": "12:25 - 12:41",
          "plant": "Kurigram 132/33kV S/S Transformer T-1 (Tr-403T) LT Tripped showing Over current at 33 kV side relays",
          "load": "29.0MW",
          "reason": "Due to None",
          "full_desc": "Kurigram 132/33kV S/S Transformer T-1 (Tr-403T) LT Tripped showing Over current at 33 kV side relays Due to None"
        },
        {
          "time": "12:25 - 12:41",
          "plant": "Kurigram 132/33kV S/S Transformer T-1 (Tr-403T) HT Tripped showing Over current at 33 kv side relays",
          "load": "29.0MW",
          "reason": "Due to None",
          "full_desc": "Kurigram 132/33kV S/S Transformer T-1 (Tr-403T) HT Tripped showing Over current at 33 kv side relays Due to None"
        },
        {
          "time": "12:25 - 12:41",
          "plant": "Kurigram 132/33kV S/S Transformer T-2 (Tr-413T) HT Tripped showing Over current at 33 kV side relays",
          "load": "29.0MW",
          "reason": "Due to None",
          "full_desc": "Kurigram 132/33kV S/S Transformer T-2 (Tr-413T) HT Tripped showing Over current at 33 kV side relays Due to None"
        },
        {
          "time": "12:25 - 12:41",
          "plant": "Kurigram 132/33kV S/S Transformer T-2 (Tr-413T) LT Tripped showing Over current at 33 kV side relays",
          "load": "29.0MW",
          "reason": "Due to None",
          "full_desc": "Kurigram 132/33kV S/S Transformer T-2 (Tr-413T) LT Tripped showing Over current at 33 kV side relays Due to None"
        },
        {
          "time": "13:41 - 14:14",
          "plant": "Mithapukur-Rangpur Confidence( 100MW ) 132kV Ckt-1 Tripped from Mithapukur 132/33kV end showing R,Y phase operated, DIST/DEF carrier receive, ZCOM trip, 86A relay optd, 86B relay optd, 86LO relay optd. relays.",
          "load": "15.0MW",
          "reason": "Mithapukur-Rangpur Confidence( 100MW ) 132kV Ckt-1 Tripped from Mithapukur 132/33kV end showing R,Y phase operated, DIST/DEF carrier receive, ZCOM trip, 86A relay optd, 86B relay optd, 86LO relay optd. relays.",
          "full_desc": "Mithapukur-Rangpur Confidence( 100MW ) 132kV Ckt-1 Tripped from Mithapukur 132/33kV end showing R,Y phase operated, DIST/DEF carrier receive, ZCOM trip, 86A relay optd, 86B relay optd, 86LO relay optd. relays."
        },
        {
          "time": "15:42 - 16:20",
          "plant": "Kabirpur -Tongi   132kV Ckt-2 Tripped from Tongi 230/132/33kV end showing Siprotec relays.",
          "load": "HT Outage",
          "reason": "Kabirpur -Tongi   132kV Ckt-2 Tripped from Tongi 230/132/33kV end showing Siprotec relays.",
          "full_desc": "Kabirpur -Tongi   132kV Ckt-2 Tripped from Tongi 230/132/33kV end showing Siprotec relays."
        },
        {
          "time": "19:25",
          "plant": "Bhulta-Ghorasal 230 kV Ckt-2",
          "load": "HT Outage",
          "reason": "Bhulta-Ghorasal 230 kV Ckt-2 is restored.",
          "full_desc": "Bhulta-Ghorasal 230 kV Ckt-2 is restored."
        },
        {
          "time": "19:26 - 01:00",
          "plant": "Aftabnagar-Rampura 132kV Ckt-1 Tripped from Ghorashal 230kV end showing Siprotech Distance Relay relays",
          "load": "HT Outage",
          "reason": "Due to Ghorasal PDB AIS Grid End fault and from Ghorashal 230kV end showing Lockout Relay relays Due to Ghorasal PDB AIS Grid End fault",
          "full_desc": "Aftabnagar-Rampura 132kV Ckt-1 Tripped from Ghorashal 230kV end showing Siprotech Distance Relay relays Due to Ghorasal PDB AIS Grid End fault and from Ghorashal 230kV end showing Lockout Relay relays Due to Ghorasal PDB AIS Grid End fault"
        },
        {
          "time": "19:26 - 01:00",
          "plant": "Aftabnagar-Rampura 132kV Ckt-1 Tripped from Ghorashal 230kV end showing Lockout Relay relays",
          "load": "HT Outage",
          "reason": "Due to Ghorasal PDB AIS Grid End fault and from Ghorashal 230kV end showing Siprotech Distance Relay relays Due to Ghorasal PDB AIS Grid End fault",
          "full_desc": "Aftabnagar-Rampura 132kV Ckt-1 Tripped from Ghorashal 230kV end showing Lockout Relay relays Due to Ghorasal PDB AIS Grid End fault and from Ghorashal 230kV end showing Siprotech Distance Relay relays Due to Ghorasal PDB AIS Grid End fault"
        },
        {
          "time": "19:27",
          "plant": "All 230kV and 132kV Ckts and 230/132kV AT-1 and AT-2 transformers of Ghorashal AIS (BPDB) 230/132kV grid S/S",
          "load": "HT Outage",
          "reason": "due to this tripping. Ghorashal GIS-Ishwardi 230kV Ckt-1 also tripped at the same time. Full load interruption is occurring under Ghorashal GIS grid S/S from 19:27 hrs due to this tripping.",
          "full_desc": "All 230kV and 132kV Ckts and 230/132kV AT-1 and AT-2 transformers of Ghorashal AIS (BPDB) 230/132kV grid S/S tripped at 19:27 hrs. Full load interruption occurred under Joydebpur and Pubail 132/33kV grid S/S from 19:27 hrs to 19:36 hrs due to this tripping. Ghorashal GIS-Ishwardi 230kV Ckt-1 also tripped at the same time. Full load interruption is occurring under Ghorashal GIS grid S/S from 19:27 hrs due to this tripping."
        },
        {
          "time": "19:27",
          "plant": "Ghorasal Repowered CCPP Unit-4 Tripped",
          "load": "HT Outage",
          "reason": "Ghorasal Repowered CCPP Unit-4 Tripped",
          "full_desc": "Ghorasal Repowered CCPP Unit-4 Tripped"
        },
        {
          "time": "19:27 - 20:32",
          "plant": "Ghorasal- Ishwardi  230 kV Ckt-1 Tripped from Ishurdi 230/132kV end showing siemens siprotec 7sa87 relays",
          "load": "HT Outage",
          "reason": "Due to A-G fault   <br> 1201Km from Isd Side. <br> Z-2 opdt",
          "full_desc": "Ghorasal- Ishwardi  230 kV Ckt-1 Tripped from Ishurdi 230/132kV end showing siemens siprotec 7sa87 relays Due to A-G fault   <br> 1201Km from Isd Side. <br> Z-2 opdt"
        },
        {
          "time": "19:58 - 20:33",
          "plant": "Ghorasal- Ishwardi  230 kV Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "Due to Ghorasal PDB AIS Grid End fault",
          "full_desc": "Ghorasal- Ishwardi  230 kV Ckt-1 Forced S/D from Ghorashal 230kV end Due to Ghorasal PDB AIS Grid End fault"
        },
        {
          "time": "20:22 - 20:38",
          "plant": "Ghorashal 230kV S/S TARFO-2 HT Forced S/D",
          "load": "60.0MW",
          "reason": "Due to Ghorasal PDB AIS Grid End fault",
          "full_desc": "Ghorashal 230kV S/S TARFO-2 HT Forced S/D Due to Ghorasal PDB AIS Grid End fault"
        },
        {
          "time": "20:27 - 21:18",
          "plant": "Aftabnagar-Rampura 132kV Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "Due to Ghorasal PDB AIS Grid End fault and from Ghorashal 230kV end Due to Ghorasal PDB AIS Grid End fault and from Ghorashal 230kV end Due to Ghorasal PDB AIS Grid End fault",
          "full_desc": "Aftabnagar-Rampura 132kV Ckt-1 Forced S/D from Ghorashal 230kV end Due to Ghorasal PDB AIS Grid End fault and from Ghorashal 230kV end Due to Ghorasal PDB AIS Grid End fault and from Ghorashal 230kV end Due to Ghorasal PDB AIS Grid End fault"
        },
        {
          "time": "20:28 - 21:46",
          "plant": "Ghorasal- Ishwardi  230 kV Ckt-2 Forced",
          "load": "HT Outage",
          "reason": "Due to Ghorasal PDB AIS Grid End fault",
          "full_desc": "Ghorasal- Ishwardi  230 kV Ckt-2 Forced S/D from Ghorashal 230kV end Due to Ghorasal PDB AIS Grid End fault"
        },
        {
          "time": "20:33",
          "plant": "Ghorashal GIS-Ishwardi 230kV Ckt-1",
          "load": "HT Outage",
          "reason": "Ghorashal GIS-Ishwardi 230kV Ckt-1 was switched on.",
          "full_desc": "Ghorashal GIS-Ishwardi 230kV Ckt-1 was switched on."
        },
        {
          "time": "21:55 - 22:24",
          "plant": "Ghorasal- Ishwardi  230 kV Ckt-1 Tripped from Ishurdi 230/132kV end showing siemens siprotech 7SA87 relays",
          "load": "HT Outage",
          "reason": "Due to UNKNOWN",
          "full_desc": "Ghorasal- Ishwardi  230 kV Ckt-1 Tripped from Ishurdi 230/132kV end showing siemens siprotech 7SA87 relays Due to UNKNOWN"
        },
        {
          "time": "22:20",
          "plant": "Aftabnagar-Rampura 132kV Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "Due to Fault at Ghorashal AIS Grid End",
          "full_desc": "Aftabnagar-Rampura 132kV Ckt-1 Forced S/D from Ghorashal 230kV end Due to Fault at Ghorashal AIS Grid End"
        },
        {
          "time": "22:20",
          "plant": "Ghorashal 230kV S/S Ghorashal GIS- AIS Ckt-3 Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to As NLDC SDE instruction",
          "full_desc": "Ghorashal 230kV S/S Ghorashal GIS- AIS Ckt-3 Scheduled S/D Due to As NLDC SDE instruction"
        },
        {
          "time": "01:00",
          "plant": "Aftabnagar-Rampura 132kV Ckt-1",
          "load": "HT Outage",
          "reason": "Aftabnagar-Rampura 132kV Ckt-1 is restored.",
          "full_desc": "Aftabnagar-Rampura 132kV Ckt-1 is restored."
        },
        {
          "time": "01:00",
          "plant": "Aftabnagar-Rampura 132kV Ckt-1",
          "load": "HT Outage",
          "reason": "Aftabnagar-Rampura 132kV Ckt-1 is restored.",
          "full_desc": "Aftabnagar-Rampura 132kV Ckt-1 is restored."
        },
        {
          "time": "01:00",
          "plant": "Aftabnagar-Rampura 132kV Ckt-1",
          "load": "HT Outage",
          "reason": "Aftabnagar-Rampura 132kV Ckt-1 is restored.",
          "full_desc": "Aftabnagar-Rampura 132kV Ckt-1 is restored."
        },
        {
          "time": "01:00",
          "plant": "Aftabnagar-Rampura 132kV Ckt-1",
          "load": "HT Outage",
          "reason": "Aftabnagar-Rampura 132kV Ckt-1 is restored.",
          "full_desc": "Aftabnagar-Rampura 132kV Ckt-1 is restored."
        }
      ],
      "hourlyLoadData": [
        {
          "time": "00:00",
          "generation": 13623,
          "loadShed": 67,
          "demand": 13693.02
        },
        {
          "time": "01:00",
          "generation": 13300,
          "loadShed": 35,
          "demand": 13337
        },
        {
          "time": "02:00",
          "generation": 12999,
          "loadShed": 35,
          "demand": 13036
        },
        {
          "time": "03:00",
          "generation": 12641,
          "loadShed": 25,
          "demand": 12667
        },
        {
          "time": "04:00",
          "generation": 12408,
          "loadShed": 15,
          "demand": 12424
        },
        {
          "time": "05:00",
          "generation": 12128,
          "loadShed": 5,
          "demand": 12133
        },
        {
          "time": "06:00",
          "generation": 11426.78,
          "loadShed": 0,
          "demand": 11426.78
        },
        {
          "time": "07:00",
          "generation": 11391.23,
          "loadShed": 0,
          "demand": 11391.23
        },
        {
          "time": "08:00",
          "generation": 11325.2,
          "loadShed": 0,
          "demand": 11325.2
        },
        {
          "time": "09:00",
          "generation": 11255.85,
          "loadShed": 0,
          "demand": 11255.85
        },
        {
          "time": "10:00",
          "generation": 11105.13,
          "loadShed": 0,
          "demand": 11105.13
        },
        {
          "time": "11:00",
          "generation": 11225.75,
          "loadShed": 0,
          "demand": 11225.75
        },
        {
          "time": "12:00",
          "generation": 11716.03,
          "loadShed": 0,
          "demand": 11716.03
        },
        {
          "time": "13:00",
          "generation": 12280.1,
          "loadShed": 0,
          "demand": 12280.1
        },
        {
          "time": "14:00",
          "generation": 12533.63,
          "loadShed": 0,
          "demand": 12533.63
        },
        {
          "time": "15:00",
          "generation": 12473.11,
          "loadShed": 0,
          "demand": 12473.11
        },
        {
          "time": "16:00",
          "generation": 12207.3,
          "loadShed": 0,
          "demand": 12207.3
        },
        {
          "time": "17:00",
          "generation": 11776.76,
          "loadShed": 0,
          "demand": 11776.76
        },
        {
          "time": "18:00",
          "generation": 11450.79,
          "loadShed": 0,
          "demand": 11450.79
        },
        {
          "time": "19:00",
          "generation": 13112.5,
          "loadShed": 0,
          "demand": 13112.5
        },
        {
          "time": "19:30",
          "generation": 13427.5,
          "loadShed": 191,
          "demand": 13627.5
        },
        {
          "time": "20:00",
          "generation": 13830.5,
          "loadShed": 92,
          "demand": 13926.5
        },
        {
          "time": "21:00",
          "generation": 14206.5,
          "loadShed": 47,
          "demand": 14255.5
        },
        {
          "time": "22:00",
          "generation": 14450.5,
          "loadShed": 163,
          "demand": 14620.5
        },
        {
          "time": "23:00",
          "generation": 14513.5,
          "loadShed": 157,
          "demand": 14677.5
        }
      ],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 462.4,
          "condensate": 303.4,
          "share": 22.1
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 141.1,
          "condensate": 654.3,
          "share": 6.8
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 105,
          "condensate": 38.3,
          "share": 5
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 910.8,
          "condensate": 4702.4,
          "share": 43.6
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 16.4,
          "condensate": 44,
          "share": 0.8
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 452.1,
          "condensate": 11.7,
          "share": 21.7
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 384.3,
          "fertilizer": 73.2,
          "others": 576.3,
          "total": 1033.8
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 227.4,
          "fertilizer": 0,
          "others": 82.6,
          "total": 310
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 33.4,
          "fertilizer": 51,
          "others": 107.5,
          "total": 191.9
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 223.7,
          "fertilizer": 39.3,
          "others": 96.3,
          "total": 359.4
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 154.2,
          "fertilizer": 0,
          "others": 23.9,
          "total": 178.1
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 131.7,
          "fertilizer": 0,
          "others": 3.6,
          "total": 135.4
        }
      ]
    },
  "2026-06-01": {
      "systemStats": {
        "date": "01 Jun 2026",
        "dayPeakGen": 13150.4,
        "eveningPeakGen": 15128.26,
        "dayPeakDemand": 13166.08,
        "eveningPeakDemand": 15281.26,
        "minGen": 12250.89,
        "maxGen": 15178.71,
        "totalEnergyGen": 326.97527476,
        "totalEnergyUnserved": 1.085,
        "totalEnergyDemand": 328.06,
        "maxTemp": 36.3,
        "totalGasSuppliedPower": 1040.72,
        "avgProductionCost": 5.871,
        "totalDailyCost": 1919626033
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 144.21,
          "cost": 515064904,
          "unitCost": 3.5717,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 103.96,
          "cost": 684869776,
          "unitCost": 6.5875,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 21.8,
          "cost": 357970750,
          "unitCost": 16.4239,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 1.98,
          "cost": 198196,
          "unitCost": 0.1,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 4.95,
          "cost": 80441371,
          "unitCost": 16.2656,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 49.99,
          "cost": 279810090,
          "unitCost": 5.5969,
          "color": "#a855f7"
        },
        {
          "name": "HSD",
          "gen": 0,
          "cost": 0,
          "unitCost": null,
          "color": "#ef4444"
        },
        {
          "name": "Wind",
          "gen": 0.09,
          "cost": 1270944,
          "unitCost": 14.71,
          "color": "#22c55e"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 22.55,
          "peakFlow": 933,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 23.66,
          "peakFlow": 1451.76,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.79,
          "peakFlow": 174,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 0,
          "demand": 4333,
          "pct": 0
        },
        {
          "zone": "Chattogram",
          "loadShed": 0,
          "demand": 1384,
          "pct": 0
        },
        {
          "zone": "Khulna",
          "loadShed": 0,
          "demand": 2110,
          "pct": 0
        },
        {
          "zone": "Rajshahi",
          "loadShed": 0,
          "demand": 1721,
          "pct": 0
        },
        {
          "zone": "Cumilla",
          "loadShed": 16,
          "demand": 1628,
          "pct": 0.98
        },
        {
          "zone": "Mymensingh",
          "loadShed": 121,
          "demand": 1318,
          "pct": 9.18
        },
        {
          "zone": "Sylhet",
          "loadShed": 9,
          "demand": 684,
          "pct": 1.32
        },
        {
          "zone": "Barishal",
          "loadShed": 0,
          "demand": 568,
          "pct": 0
        },
        {
          "zone": "Rangpur",
          "loadShed": 0,
          "demand": 1046,
          "pct": 0
        }
      ],
      "dailyOutages": [
        {
          "time": "08:07",
          "plant": "Adani Power Jharkhand Ltd. Unit-1",
          "load": "HT Outage",
          "reason": "Adani Power Jharkhand Ltd. Unit-1 was sync.",
          "full_desc": "Adani Power Jharkhand Ltd. Unit-1 was sync."
        },
        {
          "time": "09:35",
          "plant": "Ghorasal- Ishwardi  230 kV Ckt-2 Project Work",
          "load": "HT Outage",
          "reason": "Ghorasal- Ishwardi  230 kV Ckt-2 Project Work S/D from Ghorashal 230kV end.",
          "full_desc": "Ghorasal- Ishwardi  230 kV Ckt-2 Project Work S/D from Ghorashal 230kV end."
        },
        {
          "time": "09:47",
          "plant": "Ashuganj South 360 MW CCPP ST",
          "load": "360 MW",
          "reason": "Ashuganj South 360 MW CCPP ST was  sync.",
          "full_desc": "Ashuganj South 360 MW CCPP ST was  sync."
        },
        {
          "time": "09:47",
          "plant": "Ashuganj 450 MW CCPP(South) Synchronized with remarks:- ST",
          "load": "450 MW",
          "reason": "Ashuganj 450 MW CCPP(South) Synchronized with remarks:- ST",
          "full_desc": "Ashuganj 450 MW CCPP(South) Synchronized with remarks:- ST"
        },
        {
          "time": "11:18 - 11:44",
          "plant": "Sreemongol 132/33kV S/S 132/33kv T-2 LT Tripped showing Earth fault and over current fault relays",
          "load": "23.0MW",
          "reason": "Due to 33KV bus coupler fault",
          "full_desc": "Sreemongol 132/33kV S/S 132/33kv T-2 LT Tripped showing Earth fault and over current fault relays Due to 33KV bus coupler fault"
        },
        {
          "time": "11:18 - 11:43",
          "plant": "Sreemongol 132/33kV S/S 132/33kv T-3 LT Tripped showing Earth fault and over current relays",
          "load": "23.0MW",
          "reason": "Due to 33KV bus coupler fault",
          "full_desc": "Sreemongol 132/33kV S/S 132/33kv T-3 LT Tripped showing Earth fault and over current relays Due to 33KV bus coupler fault"
        },
        {
          "time": "11:18 - 11:41",
          "plant": "Sreemongol 132/33kV S/S 132/33kv T-3 HT Tripped showing Earth fault and over current relays",
          "load": "23.0MW",
          "reason": "Due to 33KV bus coupler fault",
          "full_desc": "Sreemongol 132/33kV S/S 132/33kv T-3 HT Tripped showing Earth fault and over current relays Due to 33KV bus coupler fault"
        },
        {
          "time": "11:18 - 11:43",
          "plant": "Sreemongol 132/33kV S/S 132/33kv T-2 HT Tripped showing Earth fault and over current relays",
          "load": "23.0MW",
          "reason": "Due to 132KV bus coupler fault",
          "full_desc": "Sreemongol 132/33kV S/S 132/33kv T-2 HT Tripped showing Earth fault and over current relays Due to 132KV bus coupler fault"
        },
        {
          "time": "12:53 - 14:26",
          "plant": "Halishahar 132/33kV S/S Halishahar-Khulshi-Ckt.-3 Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to To remove jute cloth from b phase conductor.",
          "full_desc": "Halishahar 132/33kV S/S Halishahar-Khulshi-Ckt.-3 Scheduled S/D Due to To remove jute cloth from b phase conductor."
        },
        {
          "time": "12:56 - 13:45",
          "plant": "Barishal-Bhandaria 132 kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Bhandaria CT secondary short",
          "full_desc": "Barishal-Bhandaria 132 kV Ckt-1 Scheduled S/D from Barishal 132/33kV end Due to Bhandaria CT secondary short"
        },
        {
          "time": "13:41 - 17:42",
          "plant": "Madunaghat 132/33kV S/S TR-2(517T) HT Forced S/D",
          "load": "HT Outage",
          "reason": "Madunaghat 132/33kV S/S TR-2(517T) HT Forced S/D",
          "full_desc": "Madunaghat 132/33kV S/S TR-2(517T) HT Forced S/D"
        },
        {
          "time": "13:41 - 17:58",
          "plant": "Madunaghat 132/33kV S/S TR-2(517T) LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Emergency high temperature maintenance",
          "full_desc": "Madunaghat 132/33kV S/S TR-2(517T) LT Forced S/D Due to Emergency high temperature maintenance"
        },
        {
          "time": "14:35 - 15:48",
          "plant": "Ramganj 132/33kV S/S Transformer -02 LT Forced S/D",
          "load": "20.0MW",
          "reason": "Due to 33 kV lakshmipur feeder maintenance",
          "full_desc": "Ramganj 132/33kV S/S Transformer -02 LT Forced S/D Due to 33 kV lakshmipur feeder maintenance"
        },
        {
          "time": "16:23",
          "plant": "Ghorasal Repowered CCPP Unit-4 Synchronized",
          "load": "HT Outage",
          "reason": "Ghorasal Repowered CCPP Unit-4 Synchronized",
          "full_desc": "Ghorasal Repowered CCPP Unit-4 Synchronized"
        },
        {
          "time": "16:49 - 17:53",
          "plant": "Chandraghona 132/33kV S/S TR-01(406T) LT Forced S/D",
          "load": "25.0MW",
          "reason": "Chandraghona 132/33kV S/S TR-01(406T) LT Forced S/D",
          "full_desc": "Chandraghona 132/33kV S/S TR-01(406T) LT Forced S/D"
        },
        {
          "time": "16:50 - 17:52",
          "plant": "Chandraghona 132/33kV S/S TR-01(406T) HT Forced S/D",
          "load": "25.0MW",
          "reason": "Due to Wasa 33 kv Feeder high temperature maintenance work under 33kv bus-1",
          "full_desc": "Chandraghona 132/33kV S/S TR-01(406T) HT Forced S/D Due to Wasa 33 kv Feeder high temperature maintenance work under 33kv bus-1"
        },
        {
          "time": "17:55",
          "plant": "Ghorasal Repowered CCPP Unit-4 Shutdown",
          "load": "HT Outage",
          "reason": "Ghorasal Repowered CCPP Unit-4 Shutdown",
          "full_desc": "Ghorasal Repowered CCPP Unit-4 Shutdown"
        },
        {
          "time": "22:24 - 00:19",
          "plant": "Bhulta 132/33kV S/S 132kV BUS Scheduled S/D",
          "load": "40.0MW",
          "reason": "Due to 132 KV Bus DS-126 red hot <br> Shut down taken by Deepok kumar sutradhar, AE Bhulta 132 KV Grid SS",
          "full_desc": "Bhulta 132/33kV S/S 132kV BUS Scheduled S/D Due to 132 KV Bus DS-126 red hot <br> Shut down taken by Deepok kumar sutradhar, AE Bhulta 132 KV Grid SS"
        },
        {
          "time": "22:24 - 00:19",
          "plant": "Bhulta 132/33kV S/S GT1 HT Scheduled S/D",
          "load": "40.0MW",
          "reason": "Due to 132 KV Bus DS-126 red hot <br> Shut down taken by Deepok kumar sutradhar, AE Bhulta 132 KV Grid SS",
          "full_desc": "Bhulta 132/33kV S/S GT1 HT Scheduled S/D Due to 132 KV Bus DS-126 red hot <br> Shut down taken by Deepok kumar sutradhar, AE Bhulta 132 KV Grid SS"
        },
        {
          "time": "23:01 - 00:46",
          "plant": "Chauddagram 132/33kV S/S 132 kv T-1 HT Scheduled S/D",
          "load": "40.0MW",
          "reason": "Due to 33kv bus-1 redhot maintanace work by Md.Masud Miah AGM PBS-4 (O&M).",
          "full_desc": "Chauddagram 132/33kV S/S 132 kv T-1 HT Scheduled S/D Due to 33kv bus-1 redhot maintanace work by Md.Masud Miah AGM PBS-4 (O&M)."
        },
        {
          "time": "23:01 - 00:46",
          "plant": "Chauddagram 132/33kV S/S 132 kv T-1 LT Scheduled S/D",
          "load": "40.0MW",
          "reason": "Due to 33kv bus-1 redhot maintanace work by Md.Masud Miah AGM PBS-4 (O&M).",
          "full_desc": "Chauddagram 132/33kV S/S 132 kv T-1 LT Scheduled S/D Due to 33kv bus-1 redhot maintanace work by Md.Masud Miah AGM PBS-4 (O&M)."
        },
        {
          "time": "06:04 - 07:37",
          "plant": "Hasnabad 230/132kV S/S AUTO TR-2 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 132 kv bus maintenace.",
          "full_desc": "Hasnabad 230/132kV S/S AUTO TR-2 LT Scheduled S/D Due to 132 kv bus maintenace."
        },
        {
          "time": "06:04 - 07:36",
          "plant": "Hasnabad 230/132kV S/S AUTO TR-2 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 132 kv bus maintenace",
          "full_desc": "Hasnabad 230/132kV S/S AUTO TR-2 HT Scheduled S/D Due to 132 kv bus maintenace"
        },
        {
          "time": "06:23",
          "plant": "Hasnabad 132/33kV S/S 132kV Reserve Bus Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Auto TR-2 R.Bus Alignment correction and Red hot maintenance.",
          "full_desc": "Hasnabad 132/33kV S/S 132kV Reserve Bus Scheduled S/D Due to Auto TR-2 R.Bus Alignment correction and Red hot maintenance."
        },
        {
          "time": "07:40",
          "plant": "Hasnabad 230/132kV S/S AUTO TR-3 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 132 KV reserve bus maintenance done",
          "full_desc": "Hasnabad 230/132kV S/S AUTO TR-3 LT Scheduled S/D Due to 132 KV reserve bus maintenance done"
        },
        {
          "time": "07:41",
          "plant": "Hasnabad 230/132kV S/S AUTO TR-3 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 132 KV reserve bus maintenance",
          "full_desc": "Hasnabad 230/132kV S/S AUTO TR-3 HT Scheduled S/D Due to 132 KV reserve bus maintenance"
        }
      ],
      "hourlyLoadData": [
        {
          "time": "00:00",
          "generation": 14464,
          "loadShed": 75,
          "demand": 14542.38
        },
        {
          "time": "01:00",
          "generation": 14277,
          "loadShed": 60,
          "demand": 14340
        },
        {
          "time": "02:00",
          "generation": 13657,
          "loadShed": 65,
          "demand": 13725
        },
        {
          "time": "03:00",
          "generation": 13303,
          "loadShed": 45,
          "demand": 13350
        },
        {
          "time": "04:00",
          "generation": 12965,
          "loadShed": 40,
          "demand": 13007
        },
        {
          "time": "05:00",
          "generation": 12690,
          "loadShed": 40,
          "demand": 12732
        },
        {
          "time": "06:00",
          "generation": 12313.71,
          "loadShed": 45,
          "demand": 12360.71
        },
        {
          "time": "07:00",
          "generation": 12250.89,
          "loadShed": 40,
          "demand": 12292.89
        },
        {
          "time": "08:00",
          "generation": 12304.7,
          "loadShed": 30,
          "demand": 12335.7
        },
        {
          "time": "09:00",
          "generation": 12604.87,
          "loadShed": 15,
          "demand": 12620.87
        },
        {
          "time": "10:00",
          "generation": 12695.71,
          "loadShed": 15,
          "demand": 12711.39
        },
        {
          "time": "11:00",
          "generation": 12840.9,
          "loadShed": 15,
          "demand": 12856.58
        },
        {
          "time": "12:00",
          "generation": 13150.4,
          "loadShed": 15,
          "demand": 13166.08
        },
        {
          "time": "13:00",
          "generation": 13567.7,
          "loadShed": 15,
          "demand": 13583.38
        },
        {
          "time": "14:00",
          "generation": 13558.28,
          "loadShed": 15,
          "demand": 13574.28
        },
        {
          "time": "15:00",
          "generation": 13572.02,
          "loadShed": 17,
          "demand": 13589.79
        },
        {
          "time": "16:00",
          "generation": 13484.4,
          "loadShed": 20,
          "demand": 13505.3
        },
        {
          "time": "17:00",
          "generation": 13217.78,
          "loadShed": 0,
          "demand": 13217.78
        },
        {
          "time": "18:00",
          "generation": 12547.89,
          "loadShed": 0,
          "demand": 12547.89
        },
        {
          "time": "19:00",
          "generation": 14261.94,
          "loadShed": 55,
          "demand": 14318.94
        },
        {
          "time": "19:30",
          "generation": 14892.7,
          "loadShed": 70,
          "demand": 14965.7
        },
        {
          "time": "20:00",
          "generation": 14951.57,
          "loadShed": 90,
          "demand": 15045.57
        },
        {
          "time": "21:00",
          "generation": 15128.26,
          "loadShed": 146,
          "demand": 15281.26
        },
        {
          "time": "22:00",
          "generation": 15141.49,
          "loadShed": 85,
          "demand": 15230.49
        },
        {
          "time": "23:00",
          "generation": 15178.71,
          "loadShed": 142,
          "demand": 15326.71
        }
      ],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 467.9,
          "condensate": 326.7,
          "share": 20.9
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 141.1,
          "condensate": 651,
          "share": 6.3
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 110.5,
          "condensate": 67.7,
          "share": 4.9
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 915.4,
          "condensate": 4880.6,
          "share": 40.9
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 26.9,
          "condensate": 68,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 573.9,
          "condensate": 14.9,
          "share": 25.7
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 283.2,
          "fertilizer": 73.4,
          "others": 702.9,
          "total": 1059.5
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 207.3,
          "fertilizer": 0,
          "others": 84.4,
          "total": 291.8
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 37.3,
          "fertilizer": 51.5,
          "others": 120.8,
          "total": 209.6
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 237.4,
          "fertilizer": 39.1,
          "others": 114.2,
          "total": 390.7
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 156.5,
          "fertilizer": 0,
          "others": 26.8,
          "total": 183.4
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 129.8,
          "fertilizer": 0,
          "others": 3.9,
          "total": 133.7
        }
      ]
    },
  "2026-06-02": {
      "systemStats": {
        "date": "02 Jun 2026",
        "dayPeakGen": 13824.9,
        "eveningPeakGen": 15820.76,
        "dayPeakDemand": null,
        "eveningPeakDemand": 16212.76,
        "minGen": null,
        "maxGen": null,
        "totalEnergyGen": 347.34938775,
        "totalEnergyUnserved": null,
        "totalEnergyDemand": null,
        "maxTemp": null,
        "totalGasSuppliedPower": 940.87,
        "avgProductionCost": 6.486,
        "totalDailyCost": 2252767434
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 130.8,
          "cost": null,
          "unitCost": null,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 111.89,
          "cost": null,
          "unitCost": null,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 37.92,
          "cost": null,
          "unitCost": null,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 2.4,
          "cost": null,
          "unitCost": null,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 4.83,
          "cost": null,
          "unitCost": null,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 59.48,
          "cost": null,
          "unitCost": null,
          "color": "#a855f7"
        },
        {
          "name": "HSD (Diesel)",
          "gen": 0,
          "cost": null,
          "unitCost": null,
          "color": "#ef4444"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 21.76,
          "peakFlow": 904,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 33.85,
          "peakFlow": 1435,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.88,
          "peakFlow": 162,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 14,
          "demand": 4787,
          "pct": 0.3
        },
        {
          "zone": "Chattogram",
          "loadShed": 0,
          "demand": 1501,
          "pct": 0
        },
        {
          "zone": "Cumilla",
          "loadShed": 23,
          "demand": 1679,
          "pct": 1.4
        },
        {
          "zone": "Mymensingh",
          "loadShed": 319,
          "demand": 1473,
          "pct": 21.7
        },
        {
          "zone": "Sylhet",
          "loadShed": 11,
          "demand": 700,
          "pct": 1.6
        },
        {
          "zone": "Khulna",
          "loadShed": 0,
          "demand": 2124,
          "pct": 0
        },
        {
          "zone": "Barishal",
          "loadShed": 0,
          "demand": 462,
          "pct": 0
        },
        {
          "zone": "Rajshahi",
          "loadShed": 0,
          "demand": 1771,
          "pct": 0
        },
        {
          "zone": "Rangpur",
          "loadShed": 8,
          "demand": 1084,
          "pct": 0.7
        }
      ],
      "dailyOutages": [
        {
          "time": "08:39 - 10:28",
          "plant": "Sonargaon 132/33kV S/S Tr-1 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Under ground Cable Heat shrink Ashtha Feed",
          "full_desc": "Sonargaon 132/33kV S/S Tr-1 LT Scheduled S/D Due to Under ground Cable Heat shrink Ashtha Feed"
        },
        {
          "time": "08:39 - 10:27",
          "plant": "Sonargaon 132/33kV S/S Tr-1 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to under ground cable heat shrink work",
          "full_desc": "Sonargaon 132/33kV S/S Tr-1 HT Scheduled S/D Due to under ground cable heat shrink work"
        },
        {
          "time": "08:39 - 10:27",
          "plant": "Sonargaon 132/33kV S/S Tr-1 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to under ground cable heat shrink work",
          "full_desc": "Sonargaon 132/33kV S/S Tr-1 HT Scheduled S/D Due to under ground cable heat shrink work"
        },
        {
          "time": "09:06 - 11:40",
          "plant": "Kushtia 132/33kV S/S T2 LT Forced S/D",
          "load": "HT Outage",
          "reason": "Kushtia 132/33kV S/S T2 LT Forced S/D",
          "full_desc": "Kushtia 132/33kV S/S T2 LT Forced S/D"
        },
        {
          "time": "09:07 - 11:38",
          "plant": "Kushtia 132/33kV S/S T2 HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Red Hot Maintenance",
          "full_desc": "Kushtia 132/33kV S/S T2 HT Forced S/D Due to Red Hot Maintenance"
        },
        {
          "time": "09:29 - 11:24",
          "plant": "Gopalganj 132/33kV S/S Gallamari-2 Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to CB Closing circuit troubling shooting",
          "full_desc": "Gopalganj 132/33kV S/S Gallamari-2 Scheduled S/D Due to CB Closing circuit troubling shooting"
        },
        {
          "time": "10:30 - 13:51",
          "plant": "Chandraghona 132/33kV S/S TR-02(416T) HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to LT bushing melting",
          "full_desc": "Chandraghona 132/33kV S/S TR-02(416T) HT Forced S/D Due to LT bushing melting"
        },
        {
          "time": "10:30 - 13:52",
          "plant": "Chandraghona 132/33kV S/S TR-02(416T) LT Forced S/D",
          "load": "HT Outage",
          "reason": "Chandraghona 132/33kV S/S TR-02(416T) LT Forced S/D",
          "full_desc": "Chandraghona 132/33kV S/S TR-02(416T) LT Forced S/D"
        },
        {
          "time": "10:53",
          "plant": "Hasnabad 132/33kV S/S 132kV Main Bus Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 230/132 kV Auto TR-3  bus D/S maintenance",
          "full_desc": "Hasnabad 132/33kV S/S 132kV Main Bus Scheduled S/D Due to 230/132 kV Auto TR-3  bus D/S maintenance"
        },
        {
          "time": "10:53",
          "plant": "Hasnabad 132/33kV S/S 132kV Reserve Bus",
          "load": "HT Outage",
          "reason": "Hasnabad 132/33kV S/S 132kV Reserve Bus is restored.",
          "full_desc": "Hasnabad 132/33kV S/S 132kV Reserve Bus is restored."
        },
        {
          "time": "11:02 - 12:29",
          "plant": "Manikganj 132/33kV S/S 132/33 kV Transformer GT-3 (50/75 MVA) LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Red hot maintanence",
          "full_desc": "Manikganj 132/33kV S/S 132/33 kV Transformer GT-3 (50/75 MVA) LT Scheduled S/D Due to Red hot maintanence"
        },
        {
          "time": "11:02 - 12:29",
          "plant": "Manikganj 132/33kV S/S 132/33 kV Transformer GT-3 (50/75 MVA) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Red hot maintanence",
          "full_desc": "Manikganj 132/33kV S/S 132/33 kV Transformer GT-3 (50/75 MVA) HT Scheduled S/D Due to Red hot maintanence"
        },
        {
          "time": "12:56",
          "plant": "Sirajgonj 225MW CCPP Unit-1 Shutdown with remarks:- ST",
          "load": "225MW",
          "reason": "Sirajgonj 225MW CCPP Unit-1 Shutdown with remarks:- ST",
          "full_desc": "Sirajgonj 225MW CCPP Unit-1 Shutdown with remarks:- ST"
        },
        {
          "time": "13:21",
          "plant": "Hasnabad 230/132kV S/S AUTO TR-3 LT",
          "load": "HT Outage",
          "reason": "Hasnabad 230/132kV S/S AUTO TR-3 LT is restored.",
          "full_desc": "Hasnabad 230/132kV S/S AUTO TR-3 LT is restored."
        },
        {
          "time": "13:21",
          "plant": "Hasnabad 230/132kV S/S AUTO TR-3 HT",
          "load": "HT Outage",
          "reason": "Hasnabad 230/132kV S/S AUTO TR-3 HT is restored.",
          "full_desc": "Hasnabad 230/132kV S/S AUTO TR-3 HT is restored."
        },
        {
          "time": "13:41",
          "plant": "Sirajganj 225 MW CCPP Unit-1",
          "load": "225 MW",
          "reason": "due to gas shortage",
          "full_desc": "Sirajganj 225 MW CCPP Unit-1 was shutdown due to gas shortage"
        },
        {
          "time": "13:41",
          "plant": "Sirajgonj 225MW CCPP Unit-1 Shutdown with remarks:- GT",
          "load": "225MW",
          "reason": "Sirajgonj 225MW CCPP Unit-1 Shutdown with remarks:- GT",
          "full_desc": "Sirajgonj 225MW CCPP Unit-1 Shutdown with remarks:- GT"
        },
        {
          "time": "14:40 - 18:24",
          "plant": "Hasnabad 230/132kV S/S AUTO TR-1 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Tap changer maintenance",
          "full_desc": "Hasnabad 230/132kV S/S AUTO TR-1 HT Scheduled S/D Due to Tap changer maintenance"
        },
        {
          "time": "14:40 - 18:25",
          "plant": "Hasnabad 230/132kV S/S AUTO TR-1 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Tap changer maintenance",
          "full_desc": "Hasnabad 230/132kV S/S AUTO TR-1 LT Scheduled S/D Due to Tap changer maintenance"
        },
        {
          "time": "15:01 - 16:22",
          "plant": "Sonargaon 132/33kV S/S Tr-1 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to PBS maintenance works",
          "full_desc": "Sonargaon 132/33kV S/S Tr-1 LT Scheduled S/D Due to PBS maintenance works"
        },
        {
          "time": "15:02 - 16:20",
          "plant": "Sonargaon 132/33kV S/S Tr-1 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to PBS maintenance works",
          "full_desc": "Sonargaon 132/33kV S/S Tr-1 HT Scheduled S/D Due to PBS maintenance works"
        },
        {
          "time": "21:00",
          "plant": "120/140 MVA Txr (33 kv Side)",
          "load": "105 MW",
          "reason": "120/140 MVA Txr (33 kv Side) S/D at Bhola ( Borhanuddin) S/S Due Redhot of 33 Charfesson Feeder (PBS). Interruption- 105 MW.",
          "full_desc": "120/140 MVA Txr (33 kv Side) S/D at Bhola ( Borhanuddin) S/S Due Redhot of 33 Charfesson Feeder (PBS). Interruption- 105 MW."
        },
        {
          "time": "21:00",
          "plant": "Evening Peak Generation",
          "load": "15819 MW",
          "reason": "Evening Peak Generation is 15819 MW.",
          "full_desc": "Evening Peak Generation is 15819 MW."
        },
        {
          "time": "21:01 - 02:33",
          "plant": "Bhangura 132/33kV S/S Tr-2(413T) LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Red hot removing 33 kv ds",
          "full_desc": "Bhangura 132/33kV S/S Tr-2(413T) LT Forced S/D Due to Red hot removing 33 kv ds"
        },
        {
          "time": "21:02 - 02:32",
          "plant": "Bhangura 132/33kV S/S Tr-2(413T) HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Red hot removing 33 kv ds",
          "full_desc": "Bhangura 132/33kV S/S Tr-2(413T) HT Forced S/D Due to Red hot removing 33 kv ds"
        },
        {
          "time": "21:10",
          "plant": "Shahjadpur 132/33kV S/S T-2(415T) LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Redhot maintenance",
          "full_desc": "Shahjadpur 132/33kV S/S T-2(415T) LT Forced S/D Due to Redhot maintenance"
        },
        {
          "time": "21:10",
          "plant": "Shahjadpur 132/33kV S/S T-2(415T) HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Redhot maintenance",
          "full_desc": "Shahjadpur 132/33kV S/S T-2(415T) HT Forced S/D Due to Redhot maintenance"
        },
        {
          "time": "22:22",
          "plant": "At Bhola ( Borhanuddin) S/S,120/140 MVA Txr (33 kv Side) S/D",
          "load": "HT Outage",
          "reason": "At Bhola ( Borhanuddin) S/S,120/140 MVA Txr (33 kv Side) S/D  is withdrawn.",
          "full_desc": "At Bhola ( Borhanuddin) S/S,120/140 MVA Txr (33 kv Side) S/D  is withdrawn."
        },
        {
          "time": "23:33 - 02:13",
          "plant": "Haripur-Siddirganj  230kV Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "Due to Red Hot Maintenance.",
          "full_desc": "Haripur-Siddirganj  230kV Ckt-1 Forced S/D from Haripur 230/132kV end Due to Red Hot Maintenance."
        },
        {
          "time": "23:58",
          "plant": "Sirajgonj 225MW CCPP Unit-1, FGMO",
          "load": "225MW",
          "reason": "Sirajgonj 225MW CCPP Unit-1, FGMO is OFF with remarks:-",
          "full_desc": "Sirajgonj 225MW CCPP Unit-1, FGMO is OFF with remarks:-"
        },
        {
          "time": "05:58",
          "plant": "Bhulta-Haripur 132 kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Fault Due to Redhot of DS of Y phase of 132 kV Line.",
          "full_desc": "Bhulta-Haripur 132 kV Ckt-1 Scheduled S/D from Bhulta 132/33kV end Due to Fault Due to Redhot of DS of Y phase of 132 kV Line."
        },
        {
          "time": "07:00",
          "plant": "Minimum generation 13429 MW",
          "load": "13429 MW",
          "reason": "Minimum generation 13429 MW",
          "full_desc": "Minimum generation 13429 MW"
        },
        {
          "time": "07:03",
          "plant": "Kulaura 132/33kV S/S TR-1 AB LT Scheduled",
          "load": "HT Outage",
          "reason": "for Reb-1 feeder Bus DS radhot maintenance",
          "full_desc": "Kulaura 132/33kV S/S TR-1 AB LT Scheduled S/D Due to Reb take this shutdown for Reb-1 feeder Bus DS radhot maintenance"
        },
        {
          "time": "07:04",
          "plant": "Kulaura 132/33kV S/S TR-1 AB HT Scheduled",
          "load": "HT Outage",
          "reason": "for Reb-1 feeder Bus DS radhot maintenance",
          "full_desc": "Kulaura 132/33kV S/S TR-1 AB HT Scheduled S/D Due to Reb take this shutdown for Reb-1 feeder Bus DS radhot maintenance"
        },
        {
          "time": "07:20",
          "plant": "Cumilla(S) 132/33kV S/S TR-2 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33Kv Palpara Feeder Redhot maintenance.",
          "full_desc": "Cumilla(S) 132/33kV S/S TR-2 LT Scheduled S/D Due to 33Kv Palpara Feeder Redhot maintenance."
        },
        {
          "time": "07:21",
          "plant": "Cumilla(S) 132/33kV S/S TR-2 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Redhot maintenance",
          "full_desc": "Cumilla(S) 132/33kV S/S TR-2 HT Scheduled S/D Due to Redhot maintenance"
        },
        {
          "time": "07:46",
          "plant": "Sirajgonj 225MW CCPP Unit-2, FGMO",
          "load": "225MW",
          "reason": "Sirajgonj 225MW CCPP Unit-2, FGMO is OFF with remarks:- Gas Shortage",
          "full_desc": "Sirajgonj 225MW CCPP Unit-2, FGMO is OFF with remarks:- Gas Shortage"
        }
      ],
      "hourlyLoadData": [],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 469.6,
          "condensate": 322.3,
          "share": 19.5
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 140.9,
          "condensate": 645.2,
          "share": 5.8
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 110.5,
          "condensate": 73.2,
          "share": 4.6
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 914.9,
          "condensate": 4898.9,
          "share": 37.9
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 33.7,
          "condensate": 92,
          "share": 1.4
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 744.2,
          "condensate": 19.3,
          "share": 30.8
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 237.7,
          "fertilizer": 72.9,
          "others": 817.8,
          "total": 1128.4
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 206.8,
          "fertilizer": 0,
          "others": 87.9,
          "total": 294.7
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 36.7,
          "fertilizer": 51.8,
          "others": 136.5,
          "total": 224.9
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 231.1,
          "fertilizer": 39.4,
          "others": 117.5,
          "total": 388
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 128.8,
          "fertilizer": 0,
          "others": 28.7,
          "total": 157.5
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 111.2,
          "fertilizer": 0,
          "others": 3.9,
          "total": 115.1
        }
      ],
      "regionalDemandSource": "bpdb-published"
    },
  "2026-06-03": {
      "systemStats": {
        "date": "03 Jun 2026",
        "dayPeakGen": 14553.08,
        "eveningPeakGen": 15870.67,
        "dayPeakDemand": 14871.08,
        "eveningPeakDemand": 16289.67,
        "minGen": 13295.83,
        "maxGen": 15979.83,
        "totalEnergyGen": 356.84943604,
        "totalEnergyUnserved": 5.885,
        "totalEnergyDemand": 362.734,
        "maxTemp": 36.8,
        "totalGasSuppliedPower": 932.1,
        "avgProductionCost": 6.71,
        "totalDailyCost": 2394414168
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 126.56,
          "cost": 448149130,
          "unitCost": 3.541,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 120.82,
          "cost": 796147820,
          "unitCost": 6.5895,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 41.88,
          "cost": 719233566,
          "unitCost": 17.1735,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 2.49,
          "cost": 249314,
          "unitCost": 0.1,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 5.16,
          "cost": 81103635,
          "unitCost": 15.7261,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 59.91,
          "cost": 349149418,
          "unitCost": 5.8278,
          "color": "#a855f7"
        },
        {
          "name": "HSD",
          "gen": 0,
          "cost": 0,
          "unitCost": null,
          "color": "#ef4444"
        },
        {
          "name": "Wind",
          "gen": 0.03,
          "cost": 381283,
          "unitCost": 14.71,
          "color": "#22c55e"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 21.85,
          "peakFlow": 903,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 34.56,
          "peakFlow": 1444.47,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.5,
          "peakFlow": 154,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 13,
          "demand": 5082,
          "pct": 0.26
        },
        {
          "zone": "Chattogram",
          "loadShed": 5,
          "demand": 1530,
          "pct": 0.33
        },
        {
          "zone": "Khulna",
          "loadShed": 0,
          "demand": 2156,
          "pct": 0
        },
        {
          "zone": "Rajshahi",
          "loadShed": 0,
          "demand": 1540,
          "pct": 0
        },
        {
          "zone": "Cumilla",
          "loadShed": 15,
          "demand": 1679,
          "pct": 0.89
        },
        {
          "zone": "Mymensingh",
          "loadShed": 355,
          "demand": 1434,
          "pct": 24.76
        },
        {
          "zone": "Sylhet",
          "loadShed": 10,
          "demand": 699,
          "pct": 1.43
        },
        {
          "zone": "Barishal",
          "loadShed": 3,
          "demand": 557,
          "pct": 0.54
        },
        {
          "zone": "Rangpur",
          "loadShed": 0,
          "demand": 1068,
          "pct": 0
        }
      ],
      "dailyOutages": [
        {
          "time": "08:05",
          "plant": "Bhulta-Haripur 132 kV Ckt-1",
          "load": "HT Outage",
          "reason": "Bhulta-Haripur 132 kV Ckt-1 is restored.",
          "full_desc": "Bhulta-Haripur 132 kV Ckt-1 is restored."
        },
        {
          "time": "08:24 - 09:35",
          "plant": "Shahjibazar 132/33kV S/S TR-04 LT Scheduled",
          "load": "HT Outage",
          "reason": "for Redhot Maintenance.",
          "full_desc": "Shahjibazar 132/33kV S/S TR-04 LT Scheduled S/D Due to Shutdown Taken by PBS for Redhot Maintenance."
        },
        {
          "time": "08:25 - 09:34",
          "plant": "Shahjibazar 132/33kV S/S TR-04 HT Scheduled",
          "load": "HT Outage",
          "reason": "for Redhot Maintenance.",
          "full_desc": "Shahjibazar 132/33kV S/S TR-04 HT Scheduled S/D Due to Shutdown Taken by PBS for Redhot Maintenance."
        },
        {
          "time": "08:32",
          "plant": "Cumilla(S) 132/33kV S/S TR-2 HT",
          "load": "HT Outage",
          "reason": "Cumilla(S) 132/33kV S/S TR-2 HT is restored.",
          "full_desc": "Cumilla(S) 132/33kV S/S TR-2 HT is restored."
        },
        {
          "time": "08:33",
          "plant": "Cumilla(S) 132/33kV S/S TR-2 LT",
          "load": "HT Outage",
          "reason": "Cumilla(S) 132/33kV S/S TR-2 LT is restored.",
          "full_desc": "Cumilla(S) 132/33kV S/S TR-2 LT is restored."
        },
        {
          "time": "09:02",
          "plant": "Kulaura 132/33kV S/S TR-1 AB HT",
          "load": "HT Outage",
          "reason": "Kulaura 132/33kV S/S TR-1 AB HT is restored.",
          "full_desc": "Kulaura 132/33kV S/S TR-1 AB HT is restored."
        },
        {
          "time": "09:04",
          "plant": "Kulaura 132/33kV S/S TR-1 AB LT",
          "load": "HT Outage",
          "reason": "Kulaura 132/33kV S/S TR-1 AB LT is restored.",
          "full_desc": "Kulaura 132/33kV S/S TR-1 AB LT is restored."
        },
        {
          "time": "11:16",
          "plant": "BIPTC S/S 20DF13 Forced S/D",
          "load": "HT Outage",
          "reason": "Due to For corrective maintenance.",
          "full_desc": "BIPTC S/S 20DF13 Forced S/D Due to For corrective maintenance."
        },
        {
          "time": "12:20 - 13:07",
          "plant": "Khulshi-Madunaghat  132kV Ckt-1 Tripped from Khulshi 132/33kV end showing Siemens , Zone-1 fault, R-phase Trip, Distance: 4.6km relays",
          "load": "HT Outage",
          "reason": "Due to Trip from Sholoshahar Grid Sub-station.",
          "full_desc": "Khulshi-Madunaghat  132kV Ckt-1 Tripped from Khulshi 132/33kV end showing Siemens , Zone-1 fault, R-phase Trip, Distance: 4.6km relays Due to Trip from Sholoshahar Grid Sub-station."
        },
        {
          "time": "12:59 - 13:15",
          "plant": "Satkhira 132/33kV S/S Transformer-2 (T-2) HT Tripped showing WTI relays",
          "load": "60.0MW",
          "reason": "Due to Winding temperature trip",
          "full_desc": "Satkhira 132/33kV S/S Transformer-2 (T-2) HT Tripped showing WTI relays Due to Winding temperature trip"
        },
        {
          "time": "12:59 - 13:15",
          "plant": "Satkhira 132/33kV S/S Transformer-2 (T-2) LT Tripped showing WTI relays",
          "load": "60.0MW",
          "reason": "Due to Winding temperature trip",
          "full_desc": "Satkhira 132/33kV S/S Transformer-2 (T-2) LT Tripped showing WTI relays Due to Winding temperature trip"
        },
        {
          "time": "14:24 - 14:30",
          "plant": "Bhaluka 132/33kV S/S 01. Transformer- 01 LT Tripped showing Micom relays.",
          "load": "118.0MW",
          "reason": "Bhaluka 132/33kV S/S 01. Transformer- 01 LT Tripped showing Micom relays.",
          "full_desc": "Bhaluka 132/33kV S/S 01. Transformer- 01 LT Tripped showing Micom relays."
        },
        {
          "time": "14:24 - 14:30",
          "plant": "Bhaluka 132/33kV S/S 02. Transformer- 02 LT Tripped showing Micom relays.",
          "load": "118.0MW",
          "reason": "Bhaluka 132/33kV S/S 02. Transformer- 02 LT Tripped showing Micom relays.",
          "full_desc": "Bhaluka 132/33kV S/S 02. Transformer- 02 LT Tripped showing Micom relays."
        },
        {
          "time": "15:24 - 17:16",
          "plant": "Satkhira 132/33kV S/S Transformer-2 (T-2) HT Tripped showing WTI relays",
          "load": "62.0MW",
          "reason": "Due to Winding temperature trip",
          "full_desc": "Satkhira 132/33kV S/S Transformer-2 (T-2) HT Tripped showing WTI relays Due to Winding temperature trip"
        },
        {
          "time": "15:24 - 17:19",
          "plant": "Satkhira 132/33kV S/S Transformer-2 (T-2) LT Tripped showing WTI relays",
          "load": "62.0MW",
          "reason": "Due to Winding temperature trip",
          "full_desc": "Satkhira 132/33kV S/S Transformer-2 (T-2) LT Tripped showing WTI relays Due to Winding temperature trip"
        },
        {
          "time": "16:24 - 17:27",
          "plant": "Feni 132/33kV S/S T-1(405T) LT Tripped showing O/C,E/F relays",
          "load": "58.0MW",
          "reason": "Due to REB-1 33KV feeder CT blust",
          "full_desc": "Feni 132/33kV S/S T-1(405T) LT Tripped showing O/C,E/F relays Due to REB-1 33KV feeder CT blust"
        },
        {
          "time": "16:43 - 18:03",
          "plant": "Joypurhat 132/33kV S/S Patnitola Ckt.-2 Tripped showing Main protection relay relays",
          "load": "HT Outage",
          "reason": "Due to Due to Storm and thundering",
          "full_desc": "Joypurhat 132/33kV S/S Patnitola Ckt.-2 Tripped showing Main protection relay relays Due to Due to Storm and thundering"
        },
        {
          "time": "16:58",
          "plant": "Payra 1320 MW unit-2",
          "load": "1320 MW",
          "reason": "Payra 1320 MW unit-2 was sync.",
          "full_desc": "Payra 1320 MW unit-2 was sync."
        },
        {
          "time": "17:27",
          "plant": "Feni 132/33kV S/S T-1(405T) LT",
          "load": "HT Outage",
          "reason": "Feni 132/33kV S/S T-1(405T) LT is restored.",
          "full_desc": "Feni 132/33kV S/S T-1(405T) LT is restored."
        },
        {
          "time": "17:34 - 18:58",
          "plant": "Bogura(New)-Naogaon 132 kV Ckt-2 Tripped from Naogaon 132/33kV end showing Distance protection main 01. <br> Lockout relay K861 & K862 relays",
          "load": "HT Outage",
          "reason": "Due to Thundering.  and from Bogura 230/132kV end showing A/R in PROGRESS, CARRIER SEND, FAULT TYPE A to G, RECLOSER LO, <br> A Phase relays.",
          "full_desc": "Bogura(New)-Naogaon 132 kV Ckt-2 Tripped from Naogaon 132/33kV end showing Distance protection main 01. <br> Lockout relay K861 & K862 relays Due to Thundering.  and from Bogura 230/132kV end showing A/R in PROGRESS, CARRIER SEND, FAULT TYPE A to G, RECLOSER LO, <br> A Phase relays."
        },
        {
          "time": "18:23 - 18:55",
          "plant": "Shahjadpur 132/33kV S/S T-4(435T) LT Forced",
          "load": "10.0MW",
          "reason": "for red hot maintenance at BUS DS.",
          "full_desc": "Shahjadpur 132/33kV S/S T-4(435T) LT Forced S/D Due to SD Taken by New Bera 33kv Feeder for red hot maintenance at BUS DS."
        },
        {
          "time": "01:22",
          "plant": "Bogura(New)-Naogaon 132 kV Ckt-1 Tripped from Naogaon 132/33kV end showing Distance relay. relays",
          "load": "HT Outage",
          "reason": "Due to Heavy storm,raining,thundering.",
          "full_desc": "Bogura(New)-Naogaon 132 kV Ckt-1 Tripped from Naogaon 132/33kV end showing Distance relay. relays Due to Heavy storm,raining,thundering."
        },
        {
          "time": "02:50 - 03:30",
          "plant": "Maijdee 132/33kV S/S Tr-02 LT Forced S/D Due to Transformer-2 , 33kv Secendary shutdown",
          "load": "HT Outage",
          "reason": "due to Read Hot Maintenence   33 kV bus source side of BREB. <br>  <br> Noakhali Palli Bidyut Samity will carry out the work.",
          "full_desc": "Maijdee 132/33kV S/S Tr-02 LT Forced S/D Due to Transformer-2 , 33kv Secendary shutdown is required from  due to Read Hot Maintenence   33 kV bus source side of BREB. <br>  <br> Noakhali Palli Bidyut Samity will carry out the work."
        },
        {
          "time": "06:16",
          "plant": "Barishal 132/33kV S/S T-2 (415T) LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Hot point maintenance.",
          "full_desc": "Barishal 132/33kV S/S T-2 (415T) LT Scheduled S/D Due to Hot point maintenance."
        },
        {
          "time": "06:17",
          "plant": "Barishal 132/33kV S/S T-2 (415T) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Hot point maintenance.",
          "full_desc": "Barishal 132/33kV S/S T-2 (415T) HT Scheduled S/D Due to Hot point maintenance."
        },
        {
          "time": "07:24",
          "plant": "Noapara 132/33kV S/S T-1 HT Scheduled S/D",
          "load": "20.0MW",
          "reason": "Due to DUE TO RED HOT MAINTENANCE OF REB-3 FEEDER BY PBS.",
          "full_desc": "Noapara 132/33kV S/S T-1 HT Scheduled S/D Due to DUE TO RED HOT MAINTENANCE OF REB-3 FEEDER BY PBS."
        },
        {
          "time": "07:24",
          "plant": "Noapara 132/33kV S/S T-1 LT Scheduled S/D",
          "load": "20.0MW",
          "reason": "Due to DUE TO RED HOT MAINTENANCE OF REB-3 FEEDER BY PBS.",
          "full_desc": "Noapara 132/33kV S/S T-1 LT Scheduled S/D Due to DUE TO RED HOT MAINTENANCE OF REB-3 FEEDER BY PBS."
        },
        {
          "time": "07:28",
          "plant": "Noapara 132/33kV S/S Bus Section-1 Scheduled S/D",
          "load": "20.0MW",
          "reason": "Due to DUE TO RED HOT MAINTENANCE OF REB-3 FEEDER BY PBS.",
          "full_desc": "Noapara 132/33kV S/S Bus Section-1 Scheduled S/D Due to DUE TO RED HOT MAINTENANCE OF REB-3 FEEDER BY PBS."
        },
        {
          "time": "07:41",
          "plant": "Kishoreganj 132/33kV S/S Tr-3 (424T) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to LA Installation work of 33/0.4 KV Auxiliary T-03.",
          "full_desc": "Kishoreganj 132/33kV S/S Tr-3 (424T) HT Scheduled S/D Due to LA Installation work of 33/0.4 KV Auxiliary T-03."
        },
        {
          "time": "07:42",
          "plant": "Madaripur 132/33kV S/S T2-415T LT Scheduled S/D",
          "load": "25.0MW",
          "reason": "Due to Agoiljhora 33kv feeder source ds problem",
          "full_desc": "Madaripur 132/33kV S/S T2-415T LT Scheduled S/D Due to Agoiljhora 33kv feeder source ds problem"
        },
        {
          "time": "07:42",
          "plant": "Madaripur 132/33kV S/S T2-415T HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Agoiljhora 33kv feeder Ds problem",
          "full_desc": "Madaripur 132/33kV S/S T2-415T HT Scheduled S/D Due to Agoiljhora 33kv feeder Ds problem"
        }
      ],
      "hourlyLoadData": [
        {
          "time": "00:00",
          "generation": 15810.76,
          "loadShed": 391,
          "demand": 16219.36
        },
        {
          "time": "01:00",
          "generation": 15520.76,
          "loadShed": 252,
          "demand": 15783.76
        },
        {
          "time": "02:00",
          "generation": 15162.76,
          "loadShed": 255,
          "demand": 15428.76
        },
        {
          "time": "03:00",
          "generation": 14807.56,
          "loadShed": 245,
          "demand": 15063.56
        },
        {
          "time": "04:00",
          "generation": 14478,
          "loadShed": 220,
          "demand": 14708
        },
        {
          "time": "05:00",
          "generation": 14319,
          "loadShed": 210,
          "demand": 14538
        },
        {
          "time": "06:00",
          "generation": 13612.84,
          "loadShed": 224,
          "demand": 13846.84
        },
        {
          "time": "07:00",
          "generation": 13434.78,
          "loadShed": 236,
          "demand": 13681.78
        },
        {
          "time": "08:00",
          "generation": 13295.83,
          "loadShed": 135,
          "demand": 13436.83
        },
        {
          "time": "09:00",
          "generation": 13504.65,
          "loadShed": 145,
          "demand": 13656.65
        },
        {
          "time": "10:00",
          "generation": 13941.13,
          "loadShed": 80,
          "demand": 14025.13
        },
        {
          "time": "11:00",
          "generation": 14063.45,
          "loadShed": 191,
          "demand": 14263.45
        },
        {
          "time": "12:00",
          "generation": 14553.08,
          "loadShed": 304,
          "demand": 14871.08
        },
        {
          "time": "13:00",
          "generation": 15039.49,
          "loadShed": 196,
          "demand": 15244.49
        },
        {
          "time": "14:00",
          "generation": 15193.19,
          "loadShed": 186,
          "demand": 15387.56
        },
        {
          "time": "15:00",
          "generation": 15189.41,
          "loadShed": 374,
          "demand": 15580.41
        },
        {
          "time": "16:00",
          "generation": 15153.1,
          "loadShed": 208,
          "demand": 15370.1
        },
        {
          "time": "17:00",
          "generation": 14375.03,
          "loadShed": 208,
          "demand": 14592.03
        },
        {
          "time": "18:00",
          "generation": 13447.48,
          "loadShed": 188,
          "demand": 13643.48
        },
        {
          "time": "19:00",
          "generation": 14922.67,
          "loadShed": 233,
          "demand": 15165.67
        },
        {
          "time": "19:30",
          "generation": 15660.3,
          "loadShed": 251,
          "demand": 15922.3
        },
        {
          "time": "20:00",
          "generation": 15506.46,
          "loadShed": 207,
          "demand": 15722.46
        },
        {
          "time": "21:00",
          "generation": 15870.67,
          "loadShed": 401,
          "demand": 16289.67
        },
        {
          "time": "22:00",
          "generation": 15806.4,
          "loadShed": 434,
          "demand": 16260.4
        },
        {
          "time": "23:00",
          "generation": 15979.83,
          "loadShed": 362,
          "demand": 16357.83
        }
      ],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 469.6,
          "condensate": 327.1,
          "share": 18.3
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 140,
          "condensate": 652.6,
          "share": 5.4
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 109,
          "condensate": 71.7,
          "share": 4.2
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 916.9,
          "condensate": 4930.7,
          "share": 35.7
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 33.3,
          "condensate": 95,
          "share": 1.3
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 902.1,
          "condensate": 23.4,
          "share": 35.1
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 239,
          "fertilizer": 73.1,
          "others": 911.1,
          "total": 1223.3
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 209.2,
          "fertilizer": 0,
          "others": 84.7,
          "total": 293.8
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 36.3,
          "fertilizer": 52.1,
          "others": 145.1,
          "total": 233.6
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 234,
          "fertilizer": 39.4,
          "others": 109.1,
          "total": 382.4
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 122.6,
          "fertilizer": 0,
          "others": 26.1,
          "total": 148.7
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 103,
          "fertilizer": 0,
          "others": 4.3,
          "total": 107.3
        }
      ]
    },
  "2026-06-04": {
      "systemStats": {
        "date": "04 Jun 2026",
        "dayPeakGen": 14743.95,
        "eveningPeakGen": 14900.03,
        "dayPeakDemand": 14971.95,
        "eveningPeakDemand": 15275.03,
        "minGen": 13452.95,
        "maxGen": 16015.91,
        "totalEnergyGen": 352.03621357,
        "totalEnergyUnserved": 5.529,
        "totalEnergyDemand": 357.565,
        "maxTemp": 36.8,
        "totalGasSuppliedPower": 934.11,
        "avgProductionCost": 6.4,
        "totalDailyCost": 2253153971
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 127.09,
          "cost": 447545545,
          "unitCost": 3.5215,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 128.57,
          "cost": 844547831,
          "unitCost": 6.5687,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 32.61,
          "cost": 559574372,
          "unitCost": 17.1575,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 2.28,
          "cost": 228395,
          "unitCost": 0.1,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 4.62,
          "cost": 72242314,
          "unitCost": 15.6313,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 56.82,
          "cost": 328514194,
          "unitCost": 5.7816,
          "color": "#a855f7"
        },
        {
          "name": "HSD",
          "gen": 0,
          "cost": 0,
          "unitCost": null,
          "color": "#ef4444"
        },
        {
          "name": "Wind",
          "gen": 0.03,
          "cost": 501316,
          "unitCost": 14.71,
          "color": "#22c55e"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 21.82,
          "peakFlow": 903,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 31.33,
          "peakFlow": 1182.53,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.67,
          "peakFlow": 164,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 12,
          "demand": 5087,
          "pct": 0.24
        },
        {
          "zone": "Chattogram",
          "loadShed": 9,
          "demand": 1591,
          "pct": 0.57
        },
        {
          "zone": "Khulna",
          "loadShed": 0,
          "demand": 1645,
          "pct": 0
        },
        {
          "zone": "Rajshahi",
          "loadShed": 0,
          "demand": 1385,
          "pct": 0
        },
        {
          "zone": "Cumilla",
          "loadShed": 16,
          "demand": 1640,
          "pct": 0.98
        },
        {
          "zone": "Mymensingh",
          "loadShed": 308,
          "demand": 1378,
          "pct": 22.35
        },
        {
          "zone": "Sylhet",
          "loadShed": 10,
          "demand": 637,
          "pct": 1.57
        },
        {
          "zone": "Barishal",
          "loadShed": 4,
          "demand": 568,
          "pct": 0.7
        },
        {
          "zone": "Rangpur",
          "loadShed": 0,
          "demand": 803,
          "pct": 0
        }
      ],
      "dailyOutages": [
        {
          "time": "08:26",
          "plant": "Baroaulia 132/33kV S/S T2(415T) HT",
          "load": "HT Outage",
          "reason": "Baroaulia 132/33kV S/S T2(415T) HT is restored.",
          "full_desc": "Baroaulia 132/33kV S/S T2(415T) HT is restored."
        },
        {
          "time": "08:30 - 08:54",
          "plant": "Kurigram 132/33kV S/S Transformer T-1 (Tr-403T) LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Redhot maintenance of CT Connector nutbolt.",
          "full_desc": "Kurigram 132/33kV S/S Transformer T-1 (Tr-403T) LT Forced S/D Due to Redhot maintenance of CT Connector nutbolt."
        },
        {
          "time": "08:31 - 08:53",
          "plant": "Kurigram 132/33kV S/S Transformer T-1 (Tr-403T) HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Redhot maintenance of CT Connector nutbolt.",
          "full_desc": "Kurigram 132/33kV S/S Transformer T-1 (Tr-403T) HT Forced S/D Due to Redhot maintenance of CT Connector nutbolt."
        },
        {
          "time": "08:34 - 09:38",
          "plant": "Dohazari 132/33kV S/S Power Transformer -T-2 LT Scheduled S/D",
          "load": "63.0MW",
          "reason": "Due to Due to Keranihat 33 kv feeder redhot maintenance. <br> Shutdown taken by <br> Shahidul Islam <br> AGM (Zonal office Satkania) <br> Ctg pbs -01",
          "full_desc": "Dohazari 132/33kV S/S Power Transformer -T-2 LT Scheduled S/D Due to Due to Keranihat 33 kv feeder redhot maintenance. <br> Shutdown taken by <br> Shahidul Islam <br> AGM (Zonal office Satkania) <br> Ctg pbs -01"
        },
        {
          "time": "08:34 - 09:38",
          "plant": "Dohazari 132/33kV S/S Power Transformer -T-2 HT Scheduled S/D",
          "load": "63.0MW",
          "reason": "Due to Due to Keranihat 33 kv feeder redhot maintenance. <br> Shutdown taken by <br> Shahidul Islam <br> AGM (Zonal office Satkania) <br> Ctg pbs -01",
          "full_desc": "Dohazari 132/33kV S/S Power Transformer -T-2 HT Scheduled S/D Due to Due to Keranihat 33 kv feeder redhot maintenance. <br> Shutdown taken by <br> Shahidul Islam <br> AGM (Zonal office Satkania) <br> Ctg pbs -01"
        },
        {
          "time": "08:35",
          "plant": "Barishal 132/33kV S/S T-2 (415T) HT",
          "load": "HT Outage",
          "reason": "Barishal 132/33kV S/S T-2 (415T) HT is restored.",
          "full_desc": "Barishal 132/33kV S/S T-2 (415T) HT is restored."
        },
        {
          "time": "08:36",
          "plant": "Barishal 132/33kV S/S T-2 (415T) LT",
          "load": "HT Outage",
          "reason": "Barishal 132/33kV S/S T-2 (415T) LT is restored.",
          "full_desc": "Barishal 132/33kV S/S T-2 (415T) LT is restored."
        },
        {
          "time": "08:42 - 10:43",
          "plant": "Kishoreganj-Mymensingh  132kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Due to VT alarm Removal purpose.",
          "full_desc": "Kishoreganj-Mymensingh  132kV Ckt-1 Scheduled S/D from Bajitpur 132/33kV end Due to Due to VT alarm Removal purpose."
        },
        {
          "time": "08:42 - 10:43",
          "plant": "Kishoreganj-Mymensingh  132kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Due to VT alarm Removal purpose.",
          "full_desc": "Kishoreganj-Mymensingh  132kV Ckt-1 Scheduled S/D from Bajitpur 132/33kV end Due to Due to VT alarm Removal purpose."
        },
        {
          "time": "08:47",
          "plant": "Bajitpur 132/33kV S/S 132 kV Bus-2 Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Due To Reduce Temparature and Clamp Maintenance.",
          "full_desc": "Bajitpur 132/33kV S/S 132 kV Bus-2 Scheduled S/D Due to Due To Reduce Temparature and Clamp Maintenance."
        },
        {
          "time": "08:50 - 09:16",
          "plant": "Mahasthangarh 132/33kV S/S 416T MTR 2 LT Tripped showing P142 relays",
          "load": "39.0MW",
          "reason": "Due to Durgapur 33 kv feeder fault.",
          "full_desc": "Mahasthangarh 132/33kV S/S 416T MTR 2 LT Tripped showing P142 relays Due to Durgapur 33 kv feeder fault."
        },
        {
          "time": "09:28 - 11:23",
          "plant": "Barishal-Bhandaria 132 kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Shutdown taken by Barishal 132/33 kV Grid SS and from Barishal 132/33kV end Due to High temperature maintenance at different points",
          "full_desc": "Barishal-Bhandaria 132 kV Ckt-1 Scheduled S/D from Bhandaria 132/33kV end Due to Shutdown taken by Barishal 132/33 kV Grid SS and from Barishal 132/33kV end Due to High temperature maintenance at different points"
        },
        {
          "time": "10:02 - 17:01",
          "plant": "Gopalganj(N)-Madaripur   132kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Schedule shutdown and from Gopalganj 400/132kVend.",
          "full_desc": "Gopalganj(N)-Madaripur   132kV Ckt-1 Scheduled S/D from Madaripur 132/33kV end Due to Schedule shutdown and from Gopalganj 400/132kVend."
        },
        {
          "time": "10:03 - 17:01",
          "plant": "Gopalganj(N)-Madaripur   132kV Ckt-2 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Schedule shutdown and from Gopalganj 400/132kVend.",
          "full_desc": "Gopalganj(N)-Madaripur   132kV Ckt-2 Scheduled S/D from Madaripur 132/33kV end Due to Schedule shutdown and from Gopalganj 400/132kVend."
        },
        {
          "time": "10:23",
          "plant": "Madaripur 132/33kV S/S T2-415T LT",
          "load": "HT Outage",
          "reason": "Madaripur 132/33kV S/S T2-415T LT is restored.",
          "full_desc": "Madaripur 132/33kV S/S T2-415T LT is restored."
        },
        {
          "time": "10:23",
          "plant": "Madaripur 132/33kV S/S T2-415T HT",
          "load": "HT Outage",
          "reason": "Madaripur 132/33kV S/S T2-415T HT is restored.",
          "full_desc": "Madaripur 132/33kV S/S T2-415T HT is restored."
        },
        {
          "time": "10:30 - 11:11",
          "plant": "Sylhet 132/33kV S/S Sylhet-90MW P/S Scheduled S/D",
          "load": "90MW",
          "reason": "Due to bird's nest remove.",
          "full_desc": "Sylhet 132/33kV S/S Sylhet-90MW P/S Scheduled S/D Due to bird's nest remove."
        },
        {
          "time": "10:45 - 11:40",
          "plant": "Bajitpur 132/33kV S/S Tr-2(414T) HT Tripped showing RET650 <br> REC650 relays",
          "load": "24.0MW",
          "reason": "Due to OIL SURGED Trip <br> Closed Blocked Signal show",
          "full_desc": "Bajitpur 132/33kV S/S Tr-2(414T) HT Tripped showing RET650 <br> REC650 relays Due to OIL SURGED Trip <br> Closed Blocked Signal show"
        },
        {
          "time": "10:55",
          "plant": "Noapara 132/33kV S/S T-1 HT",
          "load": "HT Outage",
          "reason": "Noapara 132/33kV S/S T-1 HT is restored.",
          "full_desc": "Noapara 132/33kV S/S T-1 HT is restored."
        },
        {
          "time": "10:55",
          "plant": "Noapara 132/33kV S/S T-1 LT",
          "load": "HT Outage",
          "reason": "Noapara 132/33kV S/S T-1 LT is restored.",
          "full_desc": "Noapara 132/33kV S/S T-1 LT is restored."
        },
        {
          "time": "10:56",
          "plant": "Noapara 132/33kV S/S Bus Section-1",
          "load": "HT Outage",
          "reason": "Noapara 132/33kV S/S Bus Section-1 is restored.",
          "full_desc": "Noapara 132/33kV S/S Bus Section-1 is restored."
        },
        {
          "time": "12:22",
          "plant": "BIPTC S/S 20DF13",
          "load": "HT Outage",
          "reason": "BIPTC S/S 20DF13 is restored.",
          "full_desc": "BIPTC S/S 20DF13 is restored."
        },
        {
          "time": "12:26 - 13:45",
          "plant": "Sunamganj 132/33kV S/S Chhatak-Sunamgonj CKT-2 Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Due to broken nest",
          "full_desc": "Sunamganj 132/33kV S/S Chhatak-Sunamgonj CKT-2 Forced S/D Due to Due to broken nest"
        },
        {
          "time": "13:09 - 15:15",
          "plant": "GPH 230/33kV S/S BSRM CKT-1 Forced S/D",
          "load": "HT Outage",
          "reason": "Due to emergency tree trimming needed at mirsorai side .",
          "full_desc": "GPH 230/33kV S/S BSRM CKT-1 Forced S/D Due to emergency tree trimming needed at mirsorai side ."
        },
        {
          "time": "13:11 - 15:16",
          "plant": "BSRM 230/33kV S/S GPH Ispat Ckt. -01 Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Emergency work by Mirshary 230kV",
          "full_desc": "BSRM 230/33kV S/S GPH Ispat Ckt. -01 Forced S/D Due to Emergency work by Mirshary 230kV"
        },
        {
          "time": "15:27",
          "plant": "Matarbari 2*600 MW (CPGCBL) Synchronized with remarks:- U1",
          "load": "600 MW",
          "reason": "Matarbari 2*600 MW (CPGCBL) Synchronized with remarks:- U1",
          "full_desc": "Matarbari 2*600 MW (CPGCBL) Synchronized with remarks:- U1"
        },
        {
          "time": "17:35 - 19:13",
          "plant": "Bogura(New)-Naogaon 132 kV Ckt-1 Tripped from Naogaon 132/33kV end showing Distains Protection Relay relays",
          "load": "HT Outage",
          "reason": "Due to Thunderstorm",
          "full_desc": "Bogura(New)-Naogaon 132 kV Ckt-1 Tripped from Naogaon 132/33kV end showing Distains Protection Relay relays Due to Thunderstorm"
        },
        {
          "time": "17:35 - 18:15",
          "plant": "Joypurhat-Naogaon  132kV Ckt-1 Tripped from Naogaon 132/33kV end showing Main-1 relays",
          "load": "HT Outage",
          "reason": "Due to Over Voltage (Thunderstorm)",
          "full_desc": "Joypurhat-Naogaon  132kV Ckt-1 Tripped from Naogaon 132/33kV end showing Main-1 relays Due to Over Voltage (Thunderstorm)"
        },
        {
          "time": "17:36 - 18:14",
          "plant": "Bogura(New)-Naogaon 132 kV Ckt-2 Tripped from Bogura 230/132kV end showing Distance Protection Trip <br> Zone 1 <br> Fault Location: 27.71 k.m. <br> Type: Phase A to G <br> Fault Current: 3562A relays",
          "load": "HT Outage",
          "reason": "Due to Bad Weather",
          "full_desc": "Bogura(New)-Naogaon 132 kV Ckt-2 Tripped from Bogura 230/132kV end showing Distance Protection Trip <br> Zone 1 <br> Fault Location: 27.71 k.m. <br> Type: Phase A to G <br> Fault Current: 3562A relays Due to Bad Weather"
        },
        {
          "time": "17:52 - 21:01",
          "plant": "Bogura 400/230kV S/S Bogura - Kaliakoir 400 kV Ckt-1 Forced S/D",
          "load": "HT Outage",
          "reason": "Bogura 400/230kV S/S Bogura - Kaliakoir 400 kV Ckt-1 Forced S/D",
          "full_desc": "Bogura 400/230kV S/S Bogura - Kaliakoir 400 kV Ckt-1 Forced S/D"
        },
        {
          "time": "17:52 - 21:01",
          "plant": "Bogura 400/230kV S/S Bogura - Kaliakoir 400 kV Ckt-2 Forced S/D",
          "load": "HT Outage",
          "reason": "Bogura 400/230kV S/S Bogura - Kaliakoir 400 kV Ckt-2 Forced S/D",
          "full_desc": "Bogura 400/230kV S/S Bogura - Kaliakoir 400 kV Ckt-2 Forced S/D"
        },
        {
          "time": "19:22",
          "plant": "Kishoreganj 132/33kV S/S Tr-3 (424T) HT",
          "load": "HT Outage",
          "reason": "Kishoreganj 132/33kV S/S Tr-3 (424T) HT is restored.",
          "full_desc": "Kishoreganj 132/33kV S/S Tr-3 (424T) HT is restored."
        },
        {
          "time": "20:58",
          "plant": "Bogura 400/230kV S/S 400 KV Reactor (125 MVAR) Forced S/D",
          "load": "HT Outage",
          "reason": "Bogura 400/230kV S/S 400 KV Reactor (125 MVAR) Forced S/D",
          "full_desc": "Bogura 400/230kV S/S 400 KV Reactor (125 MVAR) Forced S/D"
        },
        {
          "time": "00:14",
          "plant": "Summit Meghnaghat-2 589 MW CCPP GT",
          "load": "589 MW",
          "reason": "Summit Meghnaghat-2 589 MW CCPP GT was sync.",
          "full_desc": "Summit Meghnaghat-2 589 MW CCPP GT was sync."
        },
        {
          "time": "00:14",
          "plant": "Meghnaghat CCPP(Summit)-2 Synchronized with remarks:- GT",
          "load": "HT Outage",
          "reason": "Meghnaghat CCPP(Summit)-2 Synchronized with remarks:- GT",
          "full_desc": "Meghnaghat CCPP(Summit)-2 Synchronized with remarks:- GT"
        },
        {
          "time": "01:19",
          "plant": "Nutan Biddut CCPP GT-11",
          "load": "HT Outage",
          "reason": "due to offline water wash.",
          "full_desc": "Nutan Biddut CCPP GT-11 was shut down due to offline water wash."
        },
        {
          "time": "02:51",
          "plant": "Patuakhali 1320 MW (RNPL) Unit-1",
          "load": "1320 MW",
          "reason": "due to boiler tube leakage.",
          "full_desc": "Patuakhali 1320 MW (RNPL) Unit-1 was shut down due to boiler tube leakage."
        },
        {
          "time": "03:00",
          "plant": "Summit Meghnaghat-2 589 MW CCPP ST",
          "load": "589 MW",
          "reason": "Summit Meghnaghat-2 589 MW CCPP ST was sync.",
          "full_desc": "Summit Meghnaghat-2 589 MW CCPP ST was sync."
        },
        {
          "time": "03:00",
          "plant": "Meghnaghat CCPP(Summit)-2 Synchronized with remarks:- ST",
          "load": "HT Outage",
          "reason": "Meghnaghat CCPP(Summit)-2 Synchronized with remarks:- ST",
          "full_desc": "Meghnaghat CCPP(Summit)-2 Synchronized with remarks:- ST"
        },
        {
          "time": "05:41",
          "plant": "Savar 132/33kV S/S T-3 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Bushing CT control cable change work.",
          "full_desc": "Savar 132/33kV S/S T-3 HT Scheduled S/D Due to Bushing CT control cable change work."
        },
        {
          "time": "05:41",
          "plant": "Savar 132/33kV S/S T-3 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Bushing CT control cable change work.",
          "full_desc": "Savar 132/33kV S/S T-3 LT Scheduled S/D Due to Bushing CT control cable change work."
        },
        {
          "time": "05:50",
          "plant": "Meghnaghat Summit 335 MW CCPP",
          "load": "335 MW",
          "reason": "Meghnaghat Summit 335 MW CCPP was shutdown.",
          "full_desc": "Meghnaghat Summit 335 MW CCPP was shutdown."
        },
        {
          "time": "05:54",
          "plant": "Mymensingh RPCL-Tangail  132kV Ckt-1 Forced",
          "load": "20.0MW",
          "reason": "Due to OPGW Restringing in Tangail Grid Sub-Station.",
          "full_desc": "Mymensingh RPCL-Tangail  132kV Ckt-1 Forced S/D from Ghatail 132/33kV end Due to OPGW Restringing in Tangail Grid Sub-Station."
        },
        {
          "time": "05:59",
          "plant": "Mymensingh RPCL-Tangail  132kV Ckt-2 Forced",
          "load": "20.0MW",
          "reason": "Due to OPGW Restringing in Tangail Grid Sub-Station.",
          "full_desc": "Mymensingh RPCL-Tangail  132kV Ckt-2 Forced S/D from Ghatail 132/33kV end Due to OPGW Restringing in Tangail Grid Sub-Station."
        },
        {
          "time": "06:00",
          "plant": "Tangail 132/33kV S/S RPCL-2 Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to OPGW Re-conductoring",
          "full_desc": "Tangail 132/33kV S/S RPCL-2 Scheduled S/D Due to OPGW Re-conductoring"
        },
        {
          "time": "06:00",
          "plant": "Tangail 132/33kV S/S RPCL-1 Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to OPGW Re-conductoring",
          "full_desc": "Tangail 132/33kV S/S RPCL-1 Scheduled S/D Due to OPGW Re-conductoring"
        },
        {
          "time": "06:05",
          "plant": "Bagerhat-Bhandaria 132 kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Suspension Disc insulator change of 5 no. Tower.",
          "full_desc": "Bagerhat-Bhandaria 132 kV Ckt-1 Scheduled S/D from Bagerhat 132/33kV end Due to Suspension Disc insulator change of 5 no. Tower."
        },
        {
          "time": "06:18",
          "plant": "Bhulta 132/33kV S/S GT1 HT Scheduled S/D",
          "load": "40.0MW",
          "reason": "Due to Maintenance work at Narsingdi line DS-104 (Substation drawing identification number DS-201S)",
          "full_desc": "Bhulta 132/33kV S/S GT1 HT Scheduled S/D Due to Maintenance work at Narsingdi line DS-104 (Substation drawing identification number DS-201S)"
        },
        {
          "time": "07:11",
          "plant": "JERA Meghnaghat Power Limited 718 MW CCPP",
          "load": "718 MW",
          "reason": "JERA Meghnaghat Power Limited 718 MW CCPP was shut down.",
          "full_desc": "JERA Meghnaghat Power Limited 718 MW CCPP was shut down."
        },
        {
          "time": "07:14",
          "plant": "Jhenaidah 132/33kV S/S Transformer T-1 LT Forced S/D",
          "load": "32.0MW",
          "reason": "Due to Maintainance of 'DS' Y-phase, 33kv T-1A  Redhot.",
          "full_desc": "Jhenaidah 132/33kV S/S Transformer T-1 LT Forced S/D Due to Maintainance of 'DS' Y-phase, 33kv T-1A  Redhot."
        },
        {
          "time": "07:14",
          "plant": "Jhenaidah 132/33kV S/S Transformer T-1 HT Forced S/D",
          "load": "32.0MW",
          "reason": "Due to Maintainance of 'DS' Y-phase, 33kv T-1A  Redhot.",
          "full_desc": "Jhenaidah 132/33kV S/S Transformer T-1 HT Forced S/D Due to Maintainance of 'DS' Y-phase, 33kv T-1A  Redhot."
        }
      ],
      "hourlyLoadData": [
        {
          "time": "00:00",
          "generation": 16015.91,
          "loadShed": 552,
          "demand": 16592.75
        },
        {
          "time": "01:00",
          "generation": 15752.02,
          "loadShed": 349,
          "demand": 16116.73
        },
        {
          "time": "02:00",
          "generation": 15243.67,
          "loadShed": 330,
          "demand": 15588.67
        },
        {
          "time": "03:00",
          "generation": 14912.88,
          "loadShed": 308,
          "demand": 15234.88
        },
        {
          "time": "04:00",
          "generation": 14547.56,
          "loadShed": 283,
          "demand": 14843.56
        },
        {
          "time": "05:00",
          "generation": 14183.44,
          "loadShed": 278,
          "demand": 14474.44
        },
        {
          "time": "06:00",
          "generation": 13711.62,
          "loadShed": 257,
          "demand": 13980.62
        },
        {
          "time": "07:00",
          "generation": 13596.27,
          "loadShed": 235,
          "demand": 13842.27
        },
        {
          "time": "08:00",
          "generation": 13452.95,
          "loadShed": 200,
          "demand": 13661.95
        },
        {
          "time": "09:00",
          "generation": 13680.7,
          "loadShed": 243,
          "demand": 13934.7
        },
        {
          "time": "10:00",
          "generation": 13944.79,
          "loadShed": 186,
          "demand": 14138.79
        },
        {
          "time": "11:00",
          "generation": 14305.44,
          "loadShed": 136,
          "demand": 14447.44
        },
        {
          "time": "12:00",
          "generation": 14743.95,
          "loadShed": 218,
          "demand": 14971.95
        },
        {
          "time": "13:00",
          "generation": 14997.22,
          "loadShed": 77,
          "demand": 15077.22
        },
        {
          "time": "14:00",
          "generation": 15001.97,
          "loadShed": 64,
          "demand": 15068.97
        },
        {
          "time": "15:00",
          "generation": 15147.89,
          "loadShed": 86,
          "demand": 15237.89
        },
        {
          "time": "16:00",
          "generation": 14652.61,
          "loadShed": 256,
          "demand": 14920.13
        },
        {
          "time": "17:00",
          "generation": 13970.71,
          "loadShed": 206,
          "demand": 14185.71
        },
        {
          "time": "18:00",
          "generation": 12975.2,
          "loadShed": 116,
          "demand": 13096.2
        },
        {
          "time": "19:00",
          "generation": 14245.04,
          "loadShed": 242,
          "demand": 14497.93
        },
        {
          "time": "19:30",
          "generation": 14759.99,
          "loadShed": 210,
          "demand": 14978.99
        },
        {
          "time": "20:00",
          "generation": 14881.17,
          "loadShed": 187,
          "demand": 15076.17
        },
        {
          "time": "21:00",
          "generation": 14900.03,
          "loadShed": 359,
          "demand": 15275.03
        },
        {
          "time": "22:00",
          "generation": 14858.25,
          "loadShed": 186,
          "demand": 15052.25
        },
        {
          "time": "23:00",
          "generation": 15048.56,
          "loadShed": 175,
          "demand": 15231.44
        }
      ],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 469.8,
          "condensate": 317.9,
          "share": 18.1
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 140.5,
          "condensate": 651.1,
          "share": 5.4
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 109,
          "condensate": 71.7,
          "share": 4.2
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 918.1,
          "condensate": 4896.3,
          "share": 35.4
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 33.1,
          "condensate": 93,
          "share": 1.3
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 922.2,
          "condensate": 23.9,
          "share": 35.6
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 243.4,
          "fertilizer": 73.5,
          "others": 966,
          "total": 1282.9
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 207,
          "fertilizer": 0,
          "others": 86.7,
          "total": 293.7
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 36.5,
          "fertilizer": 51.9,
          "others": 144.8,
          "total": 233.2
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 242.5,
          "fertilizer": 39.3,
          "others": 111.4,
          "total": 393.2
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 114.6,
          "fertilizer": 0,
          "others": 30.3,
          "total": 144.9
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 103,
          "fertilizer": 0,
          "others": 4.3,
          "total": 107.3
        }
      ]
    },
  "2026-06-05": {
      "systemStats": {
        "date": "05 Jun 2026",
        "dayPeakGen": 12461.11,
        "eveningPeakGen": 14449.5,
        "dayPeakDemand": 12671.11,
        "eveningPeakDemand": 14730.5,
        "minGen": 11765.1,
        "maxGen": 15282.89,
        "totalEnergyGen": 323.86187523,
        "totalEnergyUnserved": 3.708,
        "totalEnergyDemand": 327.57,
        "maxTemp": 33.5,
        "totalGasSuppliedPower": 897.07,
        "avgProductionCost": 5.943,
        "totalDailyCost": 1924576349
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 123.45,
          "cost": 433733467,
          "unitCost": 3.5136,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 117.88,
          "cost": 773624002,
          "unitCost": 6.5626,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 19.49,
          "cost": 329437339,
          "unitCost": 16.8994,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 2.31,
          "cost": 231298,
          "unitCost": 0.1,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 3.75,
          "cost": 58896381,
          "unitCost": 15.6937,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 56.92,
          "cost": 327933659,
          "unitCost": 5.7609,
          "color": "#a855f7"
        },
        {
          "name": "HSD",
          "gen": 0,
          "cost": 0,
          "unitCost": null,
          "color": "#ef4444"
        },
        {
          "name": "Wind",
          "gen": 0.05,
          "cost": 720201,
          "unitCost": 14.71,
          "color": "#22c55e"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 21.84,
          "peakFlow": 906,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 31.92,
          "peakFlow": 1457,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.16,
          "peakFlow": 134,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 12,
          "demand": 4435,
          "pct": 0.27
        },
        {
          "zone": "Chattogram",
          "loadShed": 10,
          "demand": 1496,
          "pct": 0.67
        },
        {
          "zone": "Khulna",
          "loadShed": 0,
          "demand": 1881,
          "pct": 0
        },
        {
          "zone": "Rajshahi",
          "loadShed": 0,
          "demand": 1590,
          "pct": 0
        },
        {
          "zone": "Cumilla",
          "loadShed": 0,
          "demand": 1439,
          "pct": 0
        },
        {
          "zone": "Mymensingh",
          "loadShed": 247,
          "demand": 1321,
          "pct": 18.7
        },
        {
          "zone": "Sylhet",
          "loadShed": 0,
          "demand": 622,
          "pct": 0
        },
        {
          "zone": "Barishal",
          "loadShed": 0,
          "demand": 486,
          "pct": 0
        },
        {
          "zone": "Rangpur",
          "loadShed": 0,
          "demand": 1038,
          "pct": 0
        }
      ],
      "dailyOutages": [
        {
          "time": "08:29 - 13:18",
          "plant": "Madaripur 132/33kV S/S T3-426T HT Forced",
          "load": "HT Outage",
          "reason": "due to restricted earth fault",
          "full_desc": "Madaripur 132/33kV S/S T3-426T HT Forced S/D Due to Differential relay trip due to restricted earth fault"
        },
        {
          "time": "08:29",
          "plant": "Meghnaghat CCPP(Summit)-2 GT Synchronized with remarks:- 00:14 hrs. on 05.06.2026 GT Sync",
          "load": "HT Outage",
          "reason": "Meghnaghat CCPP(Summit)-2 GT Synchronized with remarks:- 00:14 hrs. on 05.06.2026 GT Sync",
          "full_desc": "Meghnaghat CCPP(Summit)-2 GT Synchronized with remarks:- 00:14 hrs. on 05.06.2026 GT Sync"
        },
        {
          "time": "09:17 - 10:30",
          "plant": "Aminbazar 400/230/132kV S/S Bus-1 (400kV) Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to 400kV Rupur bay jumper connection",
          "full_desc": "Aminbazar 400/230/132kV S/S Bus-1 (400kV) Project Work S/D Due to 400kV Rupur bay jumper connection"
        },
        {
          "time": "09:24 - 13:11",
          "plant": "Rangpur-Rangpur Confidence(100MW)  132kV Ckt-1 Scheduled",
          "load": "100MW",
          "reason": "Due to Temperature Rises",
          "full_desc": "Rangpur-Rangpur Confidence(100MW)  132kV Ckt-1 Scheduled S/D from Rangpur 132/33kV end Due to Temperature Rises"
        },
        {
          "time": "09:26",
          "plant": "Bhulta 132/33kV S/S GT1 HT",
          "load": "HT Outage",
          "reason": "Bhulta 132/33kV S/S GT1 HT is restored.",
          "full_desc": "Bhulta 132/33kV S/S GT1 HT is restored."
        },
        {
          "time": "10:03 - 11:22",
          "plant": "Maniknagar 230/132kV S/S Auto Transformer-02 (715T) LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Maniknagar 230/132kV S/S Auto Transformer-02 (715T) LT Scheduled S/D",
          "full_desc": "Maniknagar 230/132kV S/S Auto Transformer-02 (715T) LT Scheduled S/D"
        },
        {
          "time": "10:04 - 11:22",
          "plant": "Maniknagar 230/132kV S/S Auto Transformer-02 (715T) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Maniknagar 230/132kV S/S Auto Transformer-02 (715T) HT Scheduled S/D",
          "full_desc": "Maniknagar 230/132kV S/S Auto Transformer-02 (715T) HT Scheduled S/D"
        },
        {
          "time": "10:07",
          "plant": "Bhulta-Narsingdi 132 kV Ckt-1",
          "load": "HT Outage",
          "reason": "Bhulta-Narsingdi 132 kV Ckt-1 is restored.",
          "full_desc": "Bhulta-Narsingdi 132 kV Ckt-1 is restored."
        },
        {
          "time": "10:16",
          "plant": "Tangail 132/33kV S/S RPCL-1",
          "load": "HT Outage",
          "reason": "Tangail 132/33kV S/S RPCL-1 is restored.",
          "full_desc": "Tangail 132/33kV S/S RPCL-1 is restored."
        },
        {
          "time": "10:17",
          "plant": "Tangail 132/33kV S/S RPCL-2",
          "load": "HT Outage",
          "reason": "Tangail 132/33kV S/S RPCL-2 is restored.",
          "full_desc": "Tangail 132/33kV S/S RPCL-2 is restored."
        },
        {
          "time": "10:27",
          "plant": "Korerhat 400/230/132kV S/S 400kV BUS-2 Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Due to project work",
          "full_desc": "Korerhat 400/230/132kV S/S 400kV BUS-2 Project Work S/D Due to Due to project work"
        },
        {
          "time": "10:32",
          "plant": "Mymensingh RPCL-Tangail  132kV Ckt-2",
          "load": "HT Outage",
          "reason": "Mymensingh RPCL-Tangail  132kV Ckt-2 is restored.",
          "full_desc": "Mymensingh RPCL-Tangail  132kV Ckt-2 is restored."
        },
        {
          "time": "10:32",
          "plant": "Mymensingh RPCL-Tangail  132kV Ckt-1",
          "load": "HT Outage",
          "reason": "Mymensingh RPCL-Tangail  132kV Ckt-1 is restored.",
          "full_desc": "Mymensingh RPCL-Tangail  132kV Ckt-1 is restored."
        },
        {
          "time": "10:45",
          "plant": "Jhenaidah 132/33kV S/S Transformer T-1 HT",
          "load": "HT Outage",
          "reason": "Jhenaidah 132/33kV S/S Transformer T-1 HT is restored.",
          "full_desc": "Jhenaidah 132/33kV S/S Transformer T-1 HT is restored."
        },
        {
          "time": "10:46",
          "plant": "Jhenaidah 132/33kV S/S Transformer T-1 LT",
          "load": "HT Outage",
          "reason": "Jhenaidah 132/33kV S/S Transformer T-1 LT is restored.",
          "full_desc": "Jhenaidah 132/33kV S/S Transformer T-1 LT is restored."
        },
        {
          "time": "10:52 - 12:50",
          "plant": "Bhulta-Haripur 132 kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "Due to For changing DS(203) finger and maintenance riser point(B Phase)",
          "full_desc": "Bhulta-Haripur 132 kV Ckt-1 Scheduled S/D from Bhulta 132/33kV end Due to For changing DS(203) finger and maintenance riser point(B Phase)"
        },
        {
          "time": "11:38 - 12:16",
          "plant": "Maniknagar 132/33kV S/S Kazla Ckt -2 Scheduled",
          "load": "HT Outage",
          "reason": "for main and backup protection relay.. Work by DPDC.",
          "full_desc": "Maniknagar 132/33kV S/S Kazla Ckt -2 Scheduled S/D Due to Dc supply replacement work with new charger /distribution panel for main and backup protection relay.. Work by DPDC."
        },
        {
          "time": "12:01 - 14:15",
          "plant": "Aminbazar 400/230/132kV S/S Bus-2 (400kV) Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to IDRNPP Prihect",
          "full_desc": "Aminbazar 400/230/132kV S/S Bus-2 (400kV) Project Work S/D Due to IDRNPP Prihect"
        },
        {
          "time": "12:20 - 13:09",
          "plant": "Maniknagar 132/33kV S/S Kazla Ckt -1 Scheduled",
          "load": "HT Outage",
          "reason": "due to Dc supply replacement work with new charger /distribution panel for main and backup protection relay.. Work by DPDC..",
          "full_desc": "Maniknagar 132/33kV S/S Kazla Ckt -1 Scheduled S/D Due to 132 kV Kazla Ckt -2 Scheduled S/D due to Dc supply replacement work with new charger /distribution panel for main and backup protection relay.. Work by DPDC.."
        },
        {
          "time": "12:30",
          "plant": "Shahjadpur 132/33kV S/S T-2(415T) HT",
          "load": "HT Outage",
          "reason": "Shahjadpur 132/33kV S/S T-2(415T) HT is restored.",
          "full_desc": "Shahjadpur 132/33kV S/S T-2(415T) HT is restored."
        },
        {
          "time": "12:30",
          "plant": "Shahjadpur 132/33kV S/S T-2(415T) LT",
          "load": "HT Outage",
          "reason": "Shahjadpur 132/33kV S/S T-2(415T) LT is restored.",
          "full_desc": "Shahjadpur 132/33kV S/S T-2(415T) LT is restored."
        },
        {
          "time": "12:30",
          "plant": "Barishal 132/33kV S/S Bus B Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 132kv patuakhali &T3 Bay extention work",
          "full_desc": "Barishal 132/33kV S/S Bus B Scheduled S/D Due to 132kv patuakhali &T3 Bay extention work"
        },
        {
          "time": "12:35",
          "plant": "Barishal 132/33kV S/S Bus A",
          "load": "HT Outage",
          "reason": "Barishal 132/33kV S/S Bus A  is restored.",
          "full_desc": "Barishal 132/33kV S/S Bus A  is restored."
        },
        {
          "time": "12:53",
          "plant": "Bhulta-Narsingdi 132 kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "for backup time so it\u2019s must be shutdown always from bhulta 132KV end.",
          "full_desc": "Bhulta-Narsingdi 132 kV Ckt-1 Scheduled S/D from Bhulta 132/33kV end Due to This line using Only for backup time so it\u2019s must be shutdown always from bhulta 132KV end."
        },
        {
          "time": "13:00",
          "plant": "Bagerhat-Bhandaria 132 kV Ckt-1",
          "load": "HT Outage",
          "reason": "Bagerhat-Bhandaria 132 kV Ckt-1 is restored.",
          "full_desc": "Bagerhat-Bhandaria 132 kV Ckt-1 is restored."
        },
        {
          "time": "13:24 - 14:21",
          "plant": "Feni 132/33kV S/S T-1(405T) LT Tripped showing O/C,E/F relays",
          "load": "34.0MW",
          "reason": "Due to Heavy rain.",
          "full_desc": "Feni 132/33kV S/S T-1(405T) LT Tripped showing O/C,E/F relays Due to Heavy rain."
        },
        {
          "time": "14:52 - 15:07",
          "plant": "Madaripur 132/33kV S/S T1-405T LT Tripped showing Frequency and earth fault relays",
          "load": "32.0MW",
          "reason": "Due to Earth fault,under frequency takerhat 1 feeder",
          "full_desc": "Madaripur 132/33kV S/S T1-405T LT Tripped showing Frequency and earth fault relays Due to Earth fault,under frequency takerhat 1 feeder"
        },
        {
          "time": "14:52 - 15:11",
          "plant": "Madaripur 132/33kV S/S T2-415T LT Tripped showing Frequency,earth fault relays",
          "load": "32.0MW",
          "reason": "Due to Earth fault,under frequency takerhat 1 feeder",
          "full_desc": "Madaripur 132/33kV S/S T2-415T LT Tripped showing Frequency,earth fault relays Due to Earth fault,under frequency takerhat 1 feeder"
        },
        {
          "time": "18:05",
          "plant": "Savar 132/33kV S/S T-3 HT",
          "load": "HT Outage",
          "reason": "Savar 132/33kV S/S T-3 HT is restored.",
          "full_desc": "Savar 132/33kV S/S T-3 HT is restored."
        },
        {
          "time": "18:10",
          "plant": "Savar 132/33kV S/S T-3 LT",
          "load": "HT Outage",
          "reason": "Savar 132/33kV S/S T-3 LT is restored.",
          "full_desc": "Savar 132/33kV S/S T-3 LT is restored."
        },
        {
          "time": "18:44 - 20:41",
          "plant": "Bhulta 132/33kV S/S GT1 HT Scheduled S/D",
          "load": "54.0MW",
          "reason": "Due to For Redhot GT-01 HT side (R phase) bushing and shutdown taken by Deepok Kumar Sutradhar(AE), Bhulta 132 KV Grid substation",
          "full_desc": "Bhulta 132/33kV S/S GT1 HT Scheduled S/D Due to For Redhot GT-01 HT side (R phase) bushing and shutdown taken by Deepok Kumar Sutradhar(AE), Bhulta 132 KV Grid substation"
        },
        {
          "time": "20:37 - 23:03",
          "plant": "Siddhirganj 132/33kV S/S T-1 HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Red Hot 33 kV ACB Breaker Y-Phase Pole",
          "full_desc": "Siddhirganj 132/33kV S/S T-1 HT Forced S/D Due to Red Hot 33 kV ACB Breaker Y-Phase Pole"
        },
        {
          "time": "20:37 - 23:06",
          "plant": "Siddhirganj 132/33kV S/S T-1 LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Red Hot 33 kV ACB Breaker Y-Phase Pole",
          "full_desc": "Siddhirganj 132/33kV S/S T-1 LT Forced S/D Due to Red Hot 33 kV ACB Breaker Y-Phase Pole"
        },
        {
          "time": "22:55 - 23:54",
          "plant": "Chowmuhani 230/132/33kV S/S TR1-415T LT Forced",
          "load": "40.0MW",
          "reason": "for 33kV BUS Loop Red-hot Maintenance",
          "full_desc": "Chowmuhani 230/132/33kV S/S TR1-415T LT Forced S/D Due to 132/33 kV, TR-01 X-former S/D for 33kV BUS Loop Red-hot Maintenance"
        },
        {
          "time": "22:55 - 23:54",
          "plant": "Chowmuhani 230/132/33kV S/S TR1-415T HT Forced S/D",
          "load": "50.0MW",
          "reason": "Due to 33kV BUS Loop Redhot",
          "full_desc": "Chowmuhani 230/132/33kV S/S TR1-415T HT Forced S/D Due to 33kV BUS Loop Redhot"
        },
        {
          "time": "06:58 - 07:14",
          "plant": "Sonargaon 132/33kV S/S Tr-1 LT Tripped showing Trip Relay(MVAJM) relays Due to pbs 33kv side Everest Feeder trip",
          "load": "30.0MW",
          "reason": "due to isolator jumper blast",
          "full_desc": "Sonargaon 132/33kV S/S Tr-1 LT Tripped showing Trip Relay(MVAJM) relays Due to pbs 33kv side Everest Feeder trip due to isolator jumper blast"
        }
      ],
      "hourlyLoadData": [
        {
          "time": "00:00",
          "generation": 15282.89,
          "loadShed": 360,
          "demand": 15659.09
        },
        {
          "time": "01:00",
          "generation": 15224.44,
          "loadShed": 192,
          "demand": 15425.08
        },
        {
          "time": "02:00",
          "generation": 15176.44,
          "loadShed": 182,
          "demand": 15366.63
        },
        {
          "time": "03:00",
          "generation": 14691.22,
          "loadShed": 162,
          "demand": 14860.51
        },
        {
          "time": "04:00",
          "generation": 14244.09,
          "loadShed": 157,
          "demand": 14408.16
        },
        {
          "time": "05:00",
          "generation": 13895.82,
          "loadShed": 152,
          "demand": 14054.66
        },
        {
          "time": "06:00",
          "generation": 13225.46,
          "loadShed": 217,
          "demand": 13452.23
        },
        {
          "time": "07:00",
          "generation": 12743.65,
          "loadShed": 185,
          "demand": 12936.65
        },
        {
          "time": "08:00",
          "generation": 12531.77,
          "loadShed": 204,
          "demand": 12744.95
        },
        {
          "time": "09:00",
          "generation": 12461.11,
          "loadShed": 201,
          "demand": 12671.11
        },
        {
          "time": "10:00",
          "generation": 12361.4,
          "loadShed": 193,
          "demand": 12563.4
        },
        {
          "time": "11:00",
          "generation": 12239.01,
          "loadShed": 90,
          "demand": 12333.01
        },
        {
          "time": "12:00",
          "generation": 12340.06,
          "loadShed": 168,
          "demand": 12516.06
        },
        {
          "time": "13:00",
          "generation": 12671.5,
          "loadShed": 92,
          "demand": 12767.5
        },
        {
          "time": "14:00",
          "generation": 12196.14,
          "loadShed": 65,
          "demand": 12264.14
        },
        {
          "time": "15:00",
          "generation": 12055.95,
          "loadShed": 135,
          "demand": 12196.95
        },
        {
          "time": "16:00",
          "generation": 11929.52,
          "loadShed": 0,
          "demand": 11929.52
        },
        {
          "time": "17:00",
          "generation": 11765.1,
          "loadShed": 0,
          "demand": 11765.1
        },
        {
          "time": "18:00",
          "generation": 11710.95,
          "loadShed": 20,
          "demand": 11731.95
        },
        {
          "time": "19:00",
          "generation": 13240.5,
          "loadShed": 119,
          "demand": 13364.5
        },
        {
          "time": "19:30",
          "generation": 13938,
          "loadShed": 205,
          "demand": 14152.23
        },
        {
          "time": "20:00",
          "generation": 13914,
          "loadShed": 203,
          "demand": 14126.14
        },
        {
          "time": "21:00",
          "generation": 14449.5,
          "loadShed": 269,
          "demand": 14730.5
        },
        {
          "time": "22:00",
          "generation": 14536.6,
          "loadShed": 180,
          "demand": 14724.6
        },
        {
          "time": "23:00",
          "generation": 14669.6,
          "loadShed": 162,
          "demand": 14838.6
        }
      ],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 468,
          "condensate": 332.5,
          "share": 18.5
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 140.2,
          "condensate": 650.6,
          "share": 5.5
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 71.3,
          "condensate": 54.3,
          "share": 2.8
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 916.1,
          "condensate": 4706.4,
          "share": 36.2
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 33.1,
          "condensate": 93,
          "share": 1.3
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 901.7,
          "condensate": 23.4,
          "share": 35.6
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 231,
          "fertilizer": 73.1,
          "others": 959.3,
          "total": 1263.4
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 214.9,
          "fertilizer": 0,
          "others": 86.3,
          "total": 301.2
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 36.7,
          "fertilizer": 51.5,
          "others": 134.2,
          "total": 222.4
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 242.1,
          "fertilizer": 39.4,
          "others": 108.3,
          "total": 389.9
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 113.6,
          "fertilizer": 0,
          "others": 27.7,
          "total": 141.3
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 73.9,
          "fertilizer": 0,
          "others": 3.9,
          "total": 77.8
        }
      ]
    },
  "2026-06-06": {
      "systemStats": {
        "date": "06 Jun 2026",
        "dayPeakGen": 13987.35,
        "eveningPeakGen": 15289.62,
        "dayPeakDemand": null,
        "eveningPeakDemand": 15684.62,
        "minGen": null,
        "maxGen": null,
        "totalEnergyGen": 337.3558542,
        "totalEnergyUnserved": null,
        "totalEnergyDemand": null,
        "maxTemp": null,
        "totalGasSuppliedPower": 881.12,
        "avgProductionCost": 6.33,
        "totalDailyCost": 2135606409
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 121.14,
          "cost": null,
          "unitCost": null,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 121.66,
          "cost": null,
          "unitCost": null,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 30.97,
          "cost": null,
          "unitCost": null,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 2.33,
          "cost": null,
          "unitCost": null,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 3.71,
          "cost": null,
          "unitCost": null,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 57.47,
          "cost": null,
          "unitCost": null,
          "color": "#a855f7"
        },
        {
          "name": "HSD (Diesel)",
          "gen": 0,
          "cost": null,
          "unitCost": null,
          "color": "#ef4444"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 21.71,
          "peakFlow": 905,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 32.46,
          "peakFlow": 1469.62,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.3,
          "peakFlow": 150,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 19,
          "demand": 4908,
          "pct": 0.39
        },
        {
          "zone": "Chattogram",
          "loadShed": 7,
          "demand": 1587,
          "pct": 0.44
        },
        {
          "zone": "Khulna",
          "loadShed": 0,
          "demand": 1731,
          "pct": 0
        },
        {
          "zone": "Rajshahi",
          "loadShed": 0,
          "demand": 1516,
          "pct": 0
        },
        {
          "zone": "Cumilla",
          "loadShed": 2,
          "demand": 1580,
          "pct": 0.13
        },
        {
          "zone": "Mymensingh",
          "loadShed": 340,
          "demand": 1403,
          "pct": 24.23
        },
        {
          "zone": "Sylhet",
          "loadShed": 10,
          "demand": 703,
          "pct": 1.42
        },
        {
          "zone": "Barishal",
          "loadShed": 0,
          "demand": 512,
          "pct": 0
        },
        {
          "zone": "Rangpur",
          "loadShed": 0,
          "demand": 1089,
          "pct": 0
        }
      ],
      "dailyOutages": [
        {
          "time": "09:00",
          "plant": "Meghnaghat 450 MW CCPP (MPL) Shutdown with remarks:- ST",
          "load": "450 MW",
          "reason": "Meghnaghat 450 MW CCPP (MPL) Shutdown with remarks:- ST",
          "full_desc": "Meghnaghat 450 MW CCPP (MPL) Shutdown with remarks:- ST"
        },
        {
          "time": "09:05",
          "plant": "Meghnaghat 450 MW CCPP (MPL) Shutdown with remarks:- GT-2",
          "load": "450 MW",
          "reason": "Meghnaghat 450 MW CCPP (MPL) Shutdown with remarks:- GT-2",
          "full_desc": "Meghnaghat 450 MW CCPP (MPL) Shutdown with remarks:- GT-2"
        },
        {
          "time": "09:05",
          "plant": "Meghnaghat 450 MW CCPP",
          "load": "450 MW",
          "reason": "Meghnaghat 450 MW CCPP was shutdown.",
          "full_desc": "Meghnaghat 450 MW CCPP was shutdown."
        },
        {
          "time": "09:16 - 12:31",
          "plant": "Ashuganj-Kishoreganj 132kV Ckt-2 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Red hot maintenance",
          "full_desc": "Ashuganj-Kishoreganj 132kV Ckt-2 Scheduled S/D from Bajitpur 132/33kV end Due to Red hot maintenance"
        },
        {
          "time": "09:18",
          "plant": "Baghabari-Ishurdi 230 kV Ckt-1 Project Work",
          "load": "HT Outage",
          "reason": "Due to Relay Testing Ishurdi end. and from Ishurdi 230/132kVend.",
          "full_desc": "Baghabari-Ishurdi 230 kV Ckt-1 Project Work S/D from Baghabari 230/132kV end Due to Relay Testing Ishurdi end. and from Ishurdi 230/132kVend."
        },
        {
          "time": "09:53 - 11:54",
          "plant": "Gopalganj 132/33kV S/S Transformer-03 LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Red hot maintenance work of BPBS-2 Feder",
          "full_desc": "Gopalganj 132/33kV S/S Transformer-03 LT Forced S/D Due to Red hot maintenance work of BPBS-2 Feder"
        },
        {
          "time": "09:54 - 11:54",
          "plant": "Gopalganj 132/33kV S/S Transformer-03 HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Red hot maintenance work of BPBuS-2 Feder",
          "full_desc": "Gopalganj 132/33kV S/S Transformer-03 HT Forced S/D Due to Red hot maintenance work of BPBuS-2 Feder"
        },
        {
          "time": "10:06 - 14:12",
          "plant": "Savar 132/33kV S/S T-3 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Control cable changing works",
          "full_desc": "Savar 132/33kV S/S T-3 LT Scheduled S/D Due to Control cable changing works"
        },
        {
          "time": "10:08 - 14:10",
          "plant": "Savar 132/33kV S/S T-3 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Savar 132/33kV S/S T-3 HT Scheduled S/D",
          "full_desc": "Savar 132/33kV S/S T-3 HT Scheduled S/D"
        },
        {
          "time": "10:58 - 12:30",
          "plant": "Chowmuhani 230/132/33kV S/S TR3-435T LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to For 33kV LPBS-1 Feeder BUS Loop Maintenance.",
          "full_desc": "Chowmuhani 230/132/33kV S/S TR3-435T LT Forced S/D Due to For 33kV LPBS-1 Feeder BUS Loop Maintenance."
        },
        {
          "time": "10:58 - 12:30",
          "plant": "Chowmuhani 230/132/33kV S/S TR3-435T HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to For 33kV LPBS-1 Feeder BUS Loop Maintenance.",
          "full_desc": "Chowmuhani 230/132/33kV S/S TR3-435T HT Forced S/D Due to For 33kV LPBS-1 Feeder BUS Loop Maintenance."
        },
        {
          "time": "11:04 - 12:24",
          "plant": "Patuakhali 132/33kV S/S 425T (T-3) HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Red hot maintenance",
          "full_desc": "Patuakhali 132/33kV S/S 425T (T-3) HT Forced S/D Due to Red hot maintenance"
        },
        {
          "time": "11:55",
          "plant": "Bajitpur 132/33kV S/S 132 kV Bus-2",
          "load": "HT Outage",
          "reason": "Bajitpur 132/33kV S/S 132 kV Bus-2 is restored.",
          "full_desc": "Bajitpur 132/33kV S/S 132 kV Bus-2 is restored."
        },
        {
          "time": "12:25",
          "plant": "Patuakhali 132/33kV S/S 425T (T-3) LT",
          "load": "HT Outage",
          "reason": "Patuakhali 132/33kV S/S 425T (T-3) LT is restored.",
          "full_desc": "Patuakhali 132/33kV S/S 425T (T-3) LT is restored."
        },
        {
          "time": "12:55 - 15:54",
          "plant": "Korerhat 400/230/132kV S/S ATR-3(7303T)-Three Ph LT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Project work",
          "full_desc": "Korerhat 400/230/132kV S/S ATR-3(7303T)-Three Ph LT Project Work S/D Due to Project work"
        },
        {
          "time": "12:55",
          "plant": "40 MVA Transformer-3 (TR-3) Charge by 132 kv side at Satkhira Sub-Station.",
          "load": "HT Outage",
          "reason": "40 MVA Transformer-3 (TR-3) Charge by 132 kv side at Satkhira Sub-Station.",
          "full_desc": "40 MVA Transformer-3 (TR-3) Charge by 132 kv side at Satkhira Sub-Station."
        },
        {
          "time": "12:56 - 14:52",
          "plant": "Korerhat 400/230/132kV S/S ATR-3(7303T)-Three Ph HT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Project work",
          "full_desc": "Korerhat 400/230/132kV S/S ATR-3(7303T)-Three Ph HT Project Work S/D Due to Project work"
        },
        {
          "time": "13:13 - 14:22",
          "plant": "Bajitpur 132/33kV S/S Tr-2(414T) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Ret hot maintenance",
          "full_desc": "Bajitpur 132/33kV S/S Tr-2(414T) HT Scheduled S/D Due to Ret hot maintenance"
        },
        {
          "time": "13:45 - 17:15",
          "plant": "Gopalganj 400/132kV S/S 400kV Rooppur Tripped showing Differential relay, C pahse pickup,E/F relays.",
          "load": "HT Outage",
          "reason": "Gopalganj 400/132kV S/S 400kV Rooppur Tripped showing Differential relay, C pahse pickup,E/F relays.",
          "full_desc": "Gopalganj 400/132kV S/S 400kV Rooppur Tripped showing Differential relay, C pahse pickup,E/F relays."
        },
        {
          "time": "13:52",
          "plant": "Satkhira 132/33kV S/S Transformer-3(T-3) HT",
          "load": "HT Outage",
          "reason": "Satkhira 132/33kV S/S Transformer-3(T-3) HT is restored.",
          "full_desc": "Satkhira 132/33kV S/S Transformer-3(T-3) HT is restored."
        },
        {
          "time": "13:57",
          "plant": "Satkhira 132/33kV S/S Transformer-3(T-3) LT",
          "load": "HT Outage",
          "reason": "Satkhira 132/33kV S/S Transformer-3(T-3) LT is restored.",
          "full_desc": "Satkhira 132/33kV S/S Transformer-3(T-3) LT is restored."
        },
        {
          "time": "13:57",
          "plant": "40 MVA Transformer -3(TR-3) 33 kv close at Satkhira S/S.",
          "load": "HT Outage",
          "reason": "40 MVA Transformer -3(TR-3) 33 kv close at Satkhira S/S.",
          "full_desc": "40 MVA Transformer -3(TR-3) 33 kv close at Satkhira S/S."
        },
        {
          "time": "15:43 - 16:20",
          "plant": "Shomvuganj 400/132kV S/S Transformer-3 ( TR-3) HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Oil Leakage",
          "full_desc": "Shomvuganj 400/132kV S/S Transformer-3 ( TR-3) HT Forced S/D Due to Oil Leakage"
        },
        {
          "time": "15:43 - 16:20",
          "plant": "Shomvuganj 400/132kV S/S Transformer-3 ( TR-3) LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Oil Leakage",
          "full_desc": "Shomvuganj 400/132kV S/S Transformer-3 ( TR-3) LT Forced S/D Due to Oil Leakage"
        },
        {
          "time": "15:58",
          "plant": "Korerhat 400/230/132kV S/S 400kV BUS-2",
          "load": "HT Outage",
          "reason": "Korerhat 400/230/132kV S/S 400kV BUS-2 is restored.",
          "full_desc": "Korerhat 400/230/132kV S/S 400kV BUS-2 is restored."
        },
        {
          "time": "16:03 - 16:17",
          "plant": "Benapole 132/33kV S/S Transformer-1(406T) LT Tripped showing O/C and E/F (REF630) relays",
          "load": "HT Outage",
          "reason": "Due to Due to 33 KV Benapole feeder fault(During trial).",
          "full_desc": "Benapole 132/33kV S/S Transformer-1(406T) LT Tripped showing O/C and E/F (REF630) relays Due to Due to 33 KV Benapole feeder fault(During trial)."
        },
        {
          "time": "16:05 - 16:16",
          "plant": "Nawabganj 132/33kV S/S TR-2 LT Tripped showing Overcurrent protection,  BCU, & LOCKOUT RELAY relays Due to 33kv incomer-02 tripped",
          "load": "HT Outage",
          "reason": "due to baruakhali   feeder fault.",
          "full_desc": "Nawabganj 132/33kV S/S TR-2 LT Tripped showing Overcurrent protection,  BCU, & LOCKOUT RELAY relays Due to 33kv incomer-02 tripped due to baruakhali   feeder fault."
        },
        {
          "time": "16:38 - 17:56",
          "plant": "Madaripur 132/33kV S/S T3-426T HT Forced",
          "load": "HT Outage",
          "reason": "due to 33kv Takerhat-2 feeder fault",
          "full_desc": "Madaripur 132/33kV S/S T3-426T HT Forced S/D Due to O/C fault due to 33kv Takerhat-2 feeder fault"
        },
        {
          "time": "16:54 - 17:52",
          "plant": "Madaripur 132/33kV S/S T2-415T LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to O/C and E/F",
          "full_desc": "Madaripur 132/33kV S/S T2-415T LT Forced S/D Due to O/C and E/F"
        },
        {
          "time": "16:54 - 17:40",
          "plant": "Madaripur 132/33kV S/S T1-405T LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to O/C and E/F",
          "full_desc": "Madaripur 132/33kV S/S T1-405T LT Forced S/D Due to O/C and E/F"
        },
        {
          "time": "16:54 - 17:40",
          "plant": "Madaripur 132/33kV S/S T1-405T LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to O/C and E/F",
          "full_desc": "Madaripur 132/33kV S/S T1-405T LT Forced S/D Due to O/C and E/F"
        },
        {
          "time": "18:34",
          "plant": "Ashuganj CCPP 225 MW Synchronized with remarks:- ST",
          "load": "225 MW",
          "reason": "Ashuganj CCPP 225 MW Synchronized with remarks:- ST",
          "full_desc": "Ashuganj CCPP 225 MW Synchronized with remarks:- ST"
        },
        {
          "time": "20:20 - 20:54",
          "plant": "Bhangura 132/33kV S/S Tr-1(403T) LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to RED HOT",
          "full_desc": "Bhangura 132/33kV S/S Tr-1(403T) LT Forced S/D Due to RED HOT"
        },
        {
          "time": "20:22 - 20:52",
          "plant": "Bhangura 132/33kV S/S Tr-1(403T) HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to RED HOT",
          "full_desc": "Bhangura 132/33kV S/S Tr-1(403T) HT Forced S/D Due to RED HOT"
        },
        {
          "time": "21:00",
          "plant": "Evening peak generation:15289 MW",
          "load": "15289 MW",
          "reason": "Evening peak generation:15289 MW",
          "full_desc": "Evening peak generation:15289 MW"
        },
        {
          "time": "22:41",
          "plant": "Shahjibazar 330 MW CCPP GT",
          "load": "330 MW",
          "reason": "Shahjibazar 330 MW CCPP GT was synchronized",
          "full_desc": "Shahjibazar 330 MW CCPP GT was synchronized"
        },
        {
          "time": "23:58",
          "plant": "Bhola 225 MW CCPP GT-1",
          "load": "225 MW",
          "reason": "Bhola 225 MW CCPP GT-1 was synchronized",
          "full_desc": "Bhola 225 MW CCPP GT-1 was synchronized"
        },
        {
          "time": "00:29",
          "plant": "Shahjibazar 330 MW CCPP ST",
          "load": "330 MW",
          "reason": "Shahjibazar 330 MW CCPP ST was synchronized",
          "full_desc": "Shahjibazar 330 MW CCPP ST was synchronized"
        },
        {
          "time": "01:10",
          "plant": "Bhola 225 MW CCPP GT-2",
          "load": "225 MW",
          "reason": "Bhola 225 MW CCPP GT-2 was synchronized",
          "full_desc": "Bhola 225 MW CCPP GT-2 was synchronized"
        },
        {
          "time": "01:59",
          "plant": "Bhola Nutan Biddut BD LTD GT-1 Synchronized with remarks:- GT-11",
          "load": "HT Outage",
          "reason": "Bhola Nutan Biddut BD LTD GT-1 Synchronized with remarks:- GT-11 was started and synchronized to grid at 01:59 hrs. on 07 June 2026.",
          "full_desc": "Bhola Nutan Biddut BD LTD GT-1 Synchronized with remarks:- GT-11 was started and synchronized to grid at 01:59 hrs. on 07 June 2026."
        },
        {
          "time": "02:00",
          "plant": "Shahjibazar 330 MW CCPP ST",
          "load": "330 MW",
          "reason": "due to main steam valve problem",
          "full_desc": "Shahjibazar 330 MW CCPP ST was forced shutdown due to main steam valve problem"
        },
        {
          "time": "02:37",
          "plant": "Shahjibazar 330 MW CCPP ST",
          "load": "330 MW",
          "reason": "Shahjibazar 330 MW CCPP ST was synchronized",
          "full_desc": "Shahjibazar 330 MW CCPP ST was synchronized"
        },
        {
          "time": "06:00",
          "plant": "Minimum generation 13004 MW",
          "load": "13004 MW",
          "reason": "Minimum generation 13004 MW",
          "full_desc": "Minimum generation 13004 MW"
        },
        {
          "time": "07:46",
          "plant": "Barishal 230/132kV S/S T-5 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to red hot maintenance of  33 kVSwarupkathi-1 and Banaripara feeder by Pirojpur PBS",
          "full_desc": "Barishal 230/132kV S/S T-5 LT Scheduled S/D Due to red hot maintenance of  33 kVSwarupkathi-1 and Banaripara feeder by Pirojpur PBS"
        },
        {
          "time": "07:46",
          "plant": "Barishal 230/132kV S/S T-5 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to red hot maintenance of  33 kVSwarupkathi-1 and Banaripara feeder by Pirojpur PBS",
          "full_desc": "Barishal 230/132kV S/S T-5 HT Scheduled S/D Due to red hot maintenance of  33 kVSwarupkathi-1 and Banaripara feeder by Pirojpur PBS"
        }
      ],
      "hourlyLoadData": [],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 469.6,
          "condensate": 324.8,
          "share": 18.4
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 140.2,
          "condensate": 644.6,
          "share": 5.5
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 75.9,
          "condensate": 58.4,
          "share": 3
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 917.2,
          "condensate": 5059.7,
          "share": 35.9
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 32.7,
          "condensate": 95,
          "share": 1.3
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 921.9,
          "condensate": 23.9,
          "share": 36
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 235.6,
          "fertilizer": 73,
          "others": 1030.8,
          "total": 1339.4
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 211.7,
          "fertilizer": 0,
          "others": 88.4,
          "total": 300.1
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 36.6,
          "fertilizer": 52.2,
          "others": 156.5,
          "total": 245.3
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 224.1,
          "fertilizer": 39.5,
          "others": 113.2,
          "total": 376.8
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 111.6,
          "fertilizer": 0,
          "others": 30.3,
          "total": 141.9
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 72.6,
          "fertilizer": 0,
          "others": 3.9,
          "total": 76.5
        }
      ]
    },
  "2026-06-07": {
      "systemStats": {
        "date": "07 Jun 2026",
        "dayPeakGen": 14729.93,
        "eveningPeakGen": 15621.23,
        "dayPeakDemand": null,
        "eveningPeakDemand": 16048.23,
        "minGen": null,
        "maxGen": null,
        "totalEnergyGen": 349.35743445,
        "totalEnergyUnserved": null,
        "totalEnergyDemand": null,
        "maxTemp": null,
        "totalGasSuppliedPower": 900.93,
        "avgProductionCost": 6.556,
        "totalDailyCost": 2290239016
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 121.51,
          "cost": null,
          "unitCost": null,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 126.19,
          "cost": null,
          "unitCost": null,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 36.36,
          "cost": null,
          "unitCost": null,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 2.25,
          "cost": null,
          "unitCost": null,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 4.04,
          "cost": null,
          "unitCost": null,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 58.76,
          "cost": null,
          "unitCost": null,
          "color": "#a855f7"
        },
        {
          "name": "HSD (Diesel)",
          "gen": 0,
          "cost": null,
          "unitCost": null,
          "color": "#ef4444"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 22.49,
          "peakFlow": 931,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 32.64,
          "peakFlow": 1410.03,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.63,
          "peakFlow": 168,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 130,
          "demand": 5517,
          "pct": 2.36
        },
        {
          "zone": "Chattogram",
          "loadShed": 8,
          "demand": 1562,
          "pct": 0.51
        },
        {
          "zone": "Khulna",
          "loadShed": 0,
          "demand": 1797,
          "pct": 0
        },
        {
          "zone": "Rajshahi",
          "loadShed": 0,
          "demand": 1584,
          "pct": 0
        },
        {
          "zone": "Cumilla",
          "loadShed": 8,
          "demand": 1600,
          "pct": 0.5
        },
        {
          "zone": "Mymensingh",
          "loadShed": 231,
          "demand": 1298,
          "pct": 17.8
        },
        {
          "zone": "Sylhet",
          "loadShed": 17,
          "demand": 519,
          "pct": 3.28
        },
        {
          "zone": "Barishal",
          "loadShed": 0,
          "demand": 499,
          "pct": 0
        },
        {
          "zone": "Rangpur",
          "loadShed": 15,
          "demand": 1146,
          "pct": 1.31
        }
      ],
      "dailyOutages": [
        {
          "time": "08:40 - 09:47",
          "plant": "Chowmuhani 230/132/33kV S/S TR1-415T LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to 33 KV Maijdee Feeder Raising Loop Red Hot Maintanence",
          "full_desc": "Chowmuhani 230/132/33kV S/S TR1-415T LT Forced S/D Due to 33 KV Maijdee Feeder Raising Loop Red Hot Maintanence"
        },
        {
          "time": "08:49",
          "plant": "Ashuganj 450 MW CCPP(South) Tripped with remarks:- ST",
          "load": "450 MW",
          "reason": "Ashuganj 450 MW CCPP(South) Tripped with remarks:- ST",
          "full_desc": "Ashuganj 450 MW CCPP(South) Tripped with remarks:- ST"
        },
        {
          "time": "09:12 - 18:27",
          "plant": "Maijdee 132/33kV S/S Chowmuhoni-Maijdee ckt -01 Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to project work",
          "full_desc": "Maijdee 132/33kV S/S Chowmuhoni-Maijdee ckt -01 Scheduled S/D Due to project work"
        },
        {
          "time": "09:13 - 18:27",
          "plant": "Chowmuhani 230/132/33kV S/S Maijdee-01 Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Project work",
          "full_desc": "Chowmuhani 230/132/33kV S/S Maijdee-01 Scheduled S/D Due to Project work"
        },
        {
          "time": "09:18",
          "plant": "Ashuganj 450 MW CCPP(South) Tripped with remarks:- GT",
          "load": "450 MW",
          "reason": "Ashuganj 450 MW CCPP(South) Tripped with remarks:- GT",
          "full_desc": "Ashuganj 450 MW CCPP(South) Tripped with remarks:- GT"
        },
        {
          "time": "09:19",
          "plant": "Satkhira 132/33kV S/S Transformer-3(T-3) LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Due to oil leakage from conservator tank.",
          "full_desc": "Satkhira 132/33kV S/S Transformer-3(T-3) LT Forced S/D Due to Due to oil leakage from conservator tank."
        },
        {
          "time": "09:19",
          "plant": "Satkhira 132/33kV S/S Transformer-3(T-3) HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Due to oil leakage from conservator tank.",
          "full_desc": "Satkhira 132/33kV S/S Transformer-3(T-3) HT Forced S/D Due to Due to oil leakage from conservator tank."
        },
        {
          "time": "09:19",
          "plant": "Ashuganj South 360 MW CCPP tripped.",
          "load": "360 MW",
          "reason": "Ashuganj South 360 MW CCPP tripped.",
          "full_desc": "Ashuganj South 360 MW CCPP tripped."
        },
        {
          "time": "10:40 - 13:31",
          "plant": "Sonargaon 132/33kV S/S OPSL(IEL-2) Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to OPSL end 132KV CB relay faulty signals.",
          "full_desc": "Sonargaon 132/33kV S/S OPSL(IEL-2) Scheduled S/D Due to OPSL end 132KV CB relay faulty signals."
        },
        {
          "time": "10:50",
          "plant": "Hasnabad-Sitalakhya 132kV Ckt-1 Tripped from Hasnabad 132/33kV end showing Distance relay,Over current, Main protection Trip (86T) relays",
          "load": "HT Outage",
          "reason": "Due to The wire on the Shitalakkhya (Y - phase) line broke at From 88 to 91 Tower Spam.",
          "full_desc": "Hasnabad-Sitalakhya 132kV Ckt-1 Tripped from Hasnabad 132/33kV end showing Distance relay,Over current, Main protection Trip (86T) relays Due to The wire on the Shitalakkhya (Y - phase) line broke at From 88 to 91 Tower Spam."
        },
        {
          "time": "10:50 - 11:28",
          "plant": "Hasnabad 132/33kV S/S Fatulla (Pre-Brahmongaon) Tripped showing Distance relay, <br> Over Current relay, <br> Main Protection trip relay relays",
          "load": "HT Outage",
          "reason": "Due to The wire on the Shitalakkhya (Y - phase) line broke at From 88 to 91 Tower Spam.",
          "full_desc": "Hasnabad 132/33kV S/S Fatulla (Pre-Brahmongaon) Tripped showing Distance relay, <br> Over Current relay, <br> Main Protection trip relay relays Due to The wire on the Shitalakkhya (Y - phase) line broke at From 88 to 91 Tower Spam."
        },
        {
          "time": "11:08",
          "plant": "Barishal 230/132kV S/S T-5 HT",
          "load": "HT Outage",
          "reason": "Barishal 230/132kV S/S T-5 HT is restored.",
          "full_desc": "Barishal 230/132kV S/S T-5 HT is restored."
        },
        {
          "time": "11:10",
          "plant": "Barishal 230/132kV S/S T-5 LT",
          "load": "HT Outage",
          "reason": "Barishal 230/132kV S/S T-5 LT is restored.",
          "full_desc": "Barishal 230/132kV S/S T-5 LT is restored."
        },
        {
          "time": "11:30 - 12:45",
          "plant": "Shomvuganj 400/132kV S/S Transformer-3 ( TR-3) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Oil Leakage",
          "full_desc": "Shomvuganj 400/132kV S/S Transformer-3 ( TR-3) HT Scheduled S/D Due to Oil Leakage"
        },
        {
          "time": "11:30 - 12:45",
          "plant": "Shomvuganj 400/132kV S/S Transformer-3 ( TR-3) LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Oil Leakage",
          "full_desc": "Shomvuganj 400/132kV S/S Transformer-3 ( TR-3) LT Scheduled S/D Due to Oil Leakage"
        },
        {
          "time": "11:42",
          "plant": "Hasnabad-Sitalakhya 132kV Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "Due to The wire on the Shitalakkhya (Y - phase) line broke at From 88 to 91 Tower Spam.",
          "full_desc": "Hasnabad-Sitalakhya 132kV Ckt-1 Forced S/D from Hasnabad 132/33kV end Due to The wire on the Shitalakkhya (Y - phase) line broke at From 88 to 91 Tower Spam."
        },
        {
          "time": "12:09",
          "plant": "Ashuganj 450 MW CCPP(South) Synchronized with remarks:- GT",
          "load": "450 MW",
          "reason": "Ashuganj 450 MW CCPP(South) Synchronized with remarks:- GT",
          "full_desc": "Ashuganj 450 MW CCPP(South) Synchronized with remarks:- GT"
        },
        {
          "time": "12:09",
          "plant": "Ashuganj South 360 MW CCPP GT",
          "load": "360 MW",
          "reason": "Ashuganj South 360 MW CCPP GT was sync.",
          "full_desc": "Ashuganj South 360 MW CCPP GT was sync."
        },
        {
          "time": "12:28",
          "plant": "Hasnabad 132/33kV S/S 132kV Main Bus",
          "load": "HT Outage",
          "reason": "Hasnabad 132/33kV S/S 132kV Main Bus is restored.",
          "full_desc": "Hasnabad 132/33kV S/S 132kV Main Bus is restored."
        },
        {
          "time": "12:44",
          "plant": "Shahjibazar 330 MW CCPP",
          "load": "330 MW",
          "reason": "Shahjibazar 330 MW CCPP was shutdown.",
          "full_desc": "Shahjibazar 330 MW CCPP was shutdown."
        },
        {
          "time": "13:57 - 16:10",
          "plant": "Coxsbazar 132/33kV S/S T3 HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to 33kv incomer fire",
          "full_desc": "Coxsbazar 132/33kV S/S T3 HT Forced S/D Due to 33kv incomer fire"
        },
        {
          "time": "15:40",
          "plant": "Coxsbazar 132/33kV S/S 415T-T2 HT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to 33kv  LA installation",
          "full_desc": "Coxsbazar 132/33kV S/S 415T-T2 HT Project Work S/D Due to 33kv  LA installation"
        },
        {
          "time": "16:02 - 16:46",
          "plant": "Madaripur 132/33kV S/S T1-405T LT Tripped showing Over current, Earth fault relays",
          "load": "HT Outage",
          "reason": "Due to Thunderstorm",
          "full_desc": "Madaripur 132/33kV S/S T1-405T LT Tripped showing Over current, Earth fault relays Due to Thunderstorm"
        },
        {
          "time": "16:02 - 16:47",
          "plant": "Madaripur 132/33kV S/S T2-415T LT Tripped showing Over current, Earth fault relays",
          "load": "HT Outage",
          "reason": "Due to Thunderstorm",
          "full_desc": "Madaripur 132/33kV S/S T2-415T LT Tripped showing Over current, Earth fault relays Due to Thunderstorm"
        },
        {
          "time": "16:02",
          "plant": "Chandpur 132/33kV S/S 422T(T-5) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to OLTC oil centrifuging",
          "full_desc": "Chandpur 132/33kV S/S 422T(T-5) HT Scheduled S/D Due to OLTC oil centrifuging"
        },
        {
          "time": "17:43 - 18:32",
          "plant": "Jhenaidah 132/33kV S/S Transformer T-3 LT Tripped showing No Relay operate. relays",
          "load": "HT Outage",
          "reason": "Due to WZPDCL 33kV Magura Feeder Fault.",
          "full_desc": "Jhenaidah 132/33kV S/S Transformer T-3 LT Tripped showing No Relay operate. relays Due to WZPDCL 33kV Magura Feeder Fault."
        },
        {
          "time": "17:54 - 18:59",
          "plant": "Kishoreganj 132/33kV S/S Tr-2 (414T) LT Tripped showing E/F relays.",
          "load": "HT Outage",
          "reason": "Kishoreganj 132/33kV S/S Tr-2 (414T) LT Tripped showing E/F relays.",
          "full_desc": "Kishoreganj 132/33kV S/S Tr-2 (414T) LT Tripped showing E/F relays."
        },
        {
          "time": "17:54 - 18:59",
          "plant": "Kishoreganj 132/33kV S/S Tr-1 (404T) LT Tripped showing E/F relays.",
          "load": "HT Outage",
          "reason": "Kishoreganj 132/33kV S/S Tr-1 (404T) LT Tripped showing E/F relays.",
          "full_desc": "Kishoreganj 132/33kV S/S Tr-1 (404T) LT Tripped showing E/F relays."
        },
        {
          "time": "20:12 - 20:43",
          "plant": "Mahasthangarh 132/33kV S/S 416T MTR 2 LT Tripped showing Micom p142 relays",
          "load": "HT Outage",
          "reason": "Due to PBS 33 kv Kalai feeder fault",
          "full_desc": "Mahasthangarh 132/33kV S/S 416T MTR 2 LT Tripped showing Micom p142 relays Due to PBS 33 kv Kalai feeder fault"
        },
        {
          "time": "23:05",
          "plant": "At Chorfashion SS,T2-33 KV CB",
          "load": "HT Outage",
          "reason": "At Chorfashion SS,T2-33 KV CB is closed.",
          "full_desc": "At Chorfashion SS,T2-33 KV CB is closed."
        },
        {
          "time": "23:28",
          "plant": "Kaliakoir-Tongi  230kV Ckt-2 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Due to flashing on Tower no 96",
          "full_desc": "Kaliakoir-Tongi  230kV Ckt-2 Scheduled S/D from Tongi 230/132/33kV end Due to Due to flashing on Tower no 96"
        },
        {
          "time": "02:14",
          "plant": "Ashuganj 450 MW CCPP(South) Synchronized with remarks:- ST",
          "load": "450 MW",
          "reason": "Ashuganj 450 MW CCPP(South) Synchronized with remarks:- ST",
          "full_desc": "Ashuganj 450 MW CCPP(South) Synchronized with remarks:- ST"
        },
        {
          "time": "05:37",
          "plant": "Jashore 132/33kV S/S T-1 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Repair work of 33/.04 kv 200 kVA Auxiliary transformer",
          "full_desc": "Jashore 132/33kV S/S T-1 LT Scheduled S/D Due to Repair work of 33/.04 kv 200 kVA Auxiliary transformer"
        },
        {
          "time": "05:37",
          "plant": "Jashore 132/33kV S/S T-1 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Repair work of 33/.04 kv 200 kVA Auxiliary transformer",
          "full_desc": "Jashore 132/33kV S/S T-1 HT Scheduled S/D Due to Repair work of 33/.04 kv 200 kVA Auxiliary transformer"
        },
        {
          "time": "05:40",
          "plant": "Coxsbazar 132/33kV S/S 405T-T1 HT Project Work",
          "load": "HT Outage",
          "reason": "for supply separately to incomer 1 from Tr 01 and incomer 2 from Tr 2",
          "full_desc": "Coxsbazar 132/33kV S/S 405T-T1 HT Project Work S/D Due to Tr 01 & Tr 02 shutdown for supply separately to incomer 1 from Tr 01 and incomer 2 from Tr 2"
        },
        {
          "time": "07:23",
          "plant": "Barishal 230/132kV S/S T-4 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33kv Babuganj Feeder R phase Ds problem",
          "full_desc": "Barishal 230/132kV S/S T-4 LT Scheduled S/D Due to 33kv Babuganj Feeder R phase Ds problem"
        },
        {
          "time": "07:24",
          "plant": "Barishal 230/132kV S/S T-4 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33kv  Babuganj Ds problem",
          "full_desc": "Barishal 230/132kV S/S T-4 HT Scheduled S/D Due to 33kv  Babuganj Ds problem"
        }
      ],
      "hourlyLoadData": [],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 470.4,
          "condensate": 331.9,
          "share": 18.1
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 140.4,
          "condensate": 643.1,
          "share": 5.4
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 110.4,
          "condensate": 73.8,
          "share": 4.2
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 915.9,
          "condensate": 4837,
          "share": 35.2
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 32.5,
          "condensate": 95,
          "share": 1.3
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 929.7,
          "condensate": 24.1,
          "share": 35.8
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 231.2,
          "fertilizer": 72.6,
          "others": 1019.3,
          "total": 1323
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 209.1,
          "fertilizer": 0,
          "others": 86.6,
          "total": 295.7
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 36.9,
          "fertilizer": 52.1,
          "others": 159.6,
          "total": 248.7
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 227.4,
          "fertilizer": 39.6,
          "others": 111.7,
          "total": 378.6
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 111,
          "fertilizer": 0,
          "others": 29.9,
          "total": 140.9
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 97.3,
          "fertilizer": 0,
          "others": 4.4,
          "total": 101.7
        }
      ]
    },
  "2026-06-08": {
      "systemStats": {
        "date": "08 Jun 2026",
        "dayPeakGen": 14850.02,
        "eveningPeakGen": 15773.2,
        "dayPeakDemand": null,
        "eveningPeakDemand": 16451.2,
        "minGen": null,
        "maxGen": null,
        "totalEnergyGen": 354.95228448,
        "totalEnergyUnserved": null,
        "totalEnergyDemand": null,
        "maxTemp": null,
        "totalGasSuppliedPower": 909.55,
        "avgProductionCost": 6.64,
        "totalDailyCost": 2357059472
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 121.22,
          "cost": null,
          "unitCost": null,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 130.08,
          "cost": null,
          "unitCost": null,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 38.84,
          "cost": null,
          "unitCost": null,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 1.53,
          "cost": null,
          "unitCost": null,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 4.38,
          "cost": null,
          "unitCost": null,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 58.59,
          "cost": null,
          "unitCost": null,
          "color": "#a855f7"
        },
        {
          "name": "HSD (Diesel)",
          "gen": 0,
          "cost": null,
          "unitCost": null,
          "color": "#ef4444"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 22.54,
          "peakFlow": 932,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 32.09,
          "peakFlow": 1450,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.97,
          "peakFlow": 170,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 150,
          "demand": 6006,
          "pct": 2.5
        },
        {
          "zone": "Chattogram",
          "loadShed": 8,
          "demand": 1505,
          "pct": 0.53
        },
        {
          "zone": "Khulna",
          "loadShed": 0,
          "demand": 1760,
          "pct": 0
        },
        {
          "zone": "Rajshahi",
          "loadShed": 0,
          "demand": 1674,
          "pct": 0
        },
        {
          "zone": "Cumilla",
          "loadShed": 0,
          "demand": 1546,
          "pct": 0
        },
        {
          "zone": "Mymensingh",
          "loadShed": 476,
          "demand": 1506,
          "pct": 31.61
        },
        {
          "zone": "Sylhet",
          "loadShed": 0,
          "demand": 611,
          "pct": 0
        },
        {
          "zone": "Barishal",
          "loadShed": 0,
          "demand": 476,
          "pct": 0
        },
        {
          "zone": "Rangpur",
          "loadShed": 15,
          "demand": 848,
          "pct": 1.77
        }
      ],
      "dailyOutages": [
        {
          "time": "08:10",
          "plant": "Coxsbazar 132/33kV S/S 405T-T1 HT",
          "load": "HT Outage",
          "reason": "Coxsbazar 132/33kV S/S 405T-T1 HT is restored.",
          "full_desc": "Coxsbazar 132/33kV S/S 405T-T1 HT is restored."
        },
        {
          "time": "08:20 - 10:45",
          "plant": "Chowmuhani 230/132/33kV S/S Maijdee-01 Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to 132 kv GIS control Room painting .",
          "full_desc": "Chowmuhani 230/132/33kV S/S Maijdee-01 Project Work S/D Due to 132 kv GIS control Room painting ."
        },
        {
          "time": "09:14 - 10:47",
          "plant": "Maijdee 132/33kV S/S Chowmuhoni-Maijdee ckt -01 Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Due to project work at Chowmuhani 230/132/33 KV Grid.",
          "full_desc": "Maijdee 132/33kV S/S Chowmuhoni-Maijdee ckt -01 Project Work S/D Due to Due to project work at Chowmuhani 230/132/33 KV Grid."
        },
        {
          "time": "09:21",
          "plant": "Barishal 230/132kV S/S T-4 HT",
          "load": "HT Outage",
          "reason": "Barishal 230/132kV S/S T-4 HT is restored.",
          "full_desc": "Barishal 230/132kV S/S T-4 HT is restored."
        },
        {
          "time": "09:23",
          "plant": "Barishal 230/132kV S/S T-4 LT",
          "load": "HT Outage",
          "reason": "Barishal 230/132kV S/S T-4 LT is restored.",
          "full_desc": "Barishal 230/132kV S/S T-4 LT is restored."
        },
        {
          "time": "09:48",
          "plant": "Jashore 132/33kV S/S T-1 HT",
          "load": "HT Outage",
          "reason": "Jashore 132/33kV S/S T-1 HT is restored.",
          "full_desc": "Jashore 132/33kV S/S T-1 HT is restored."
        },
        {
          "time": "09:52",
          "plant": "Jashore 132/33kV S/S T-1 LT",
          "load": "HT Outage",
          "reason": "Jashore 132/33kV S/S T-1 LT is restored.",
          "full_desc": "Jashore 132/33kV S/S T-1 LT is restored."
        },
        {
          "time": "11:11 - 13:32",
          "plant": "Chandraghona-Rangamati 132 kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "due to annual relay testing works. and from Chandraghona 132/33kV end Due to Relay test",
          "full_desc": "Chandraghona-Rangamati 132 kV Ckt-1 Scheduled S/D from Rangamati 132/33kV end Due to Rangamati - Chandraghona Ckt-01 has taken Shutdown due to annual relay testing works. and from Chandraghona 132/33kV end Due to Relay test"
        },
        {
          "time": "11:26 - 18:13",
          "plant": "Barishal 230/132kV S/S ATR-1 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Replacement of WTI & OTI",
          "full_desc": "Barishal 230/132kV S/S ATR-1 LT Scheduled S/D Due to Replacement of WTI & OTI"
        },
        {
          "time": "11:27 - 18:15",
          "plant": "Barishal 230/132kV S/S ATR-1 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Replacement of WTI & OTI",
          "full_desc": "Barishal 230/132kV S/S ATR-1 HT Scheduled S/D Due to Replacement of WTI & OTI"
        },
        {
          "time": "11:34",
          "plant": "Kaliakoir-Tongi  230kV Ckt-2",
          "load": "HT Outage",
          "reason": "Kaliakoir-Tongi  230kV Ckt-2 is restored.",
          "full_desc": "Kaliakoir-Tongi  230kV Ckt-2 is restored."
        },
        {
          "time": "11:51",
          "plant": "Coxsbazar 132/33kV S/S 415T-T2 HT",
          "load": "HT Outage",
          "reason": "Coxsbazar 132/33kV S/S 415T-T2 HT is restored.",
          "full_desc": "Coxsbazar 132/33kV S/S 415T-T2 HT is restored."
        },
        {
          "time": "12:00",
          "plant": "Day Peak Generation: 14847 MW.",
          "load": "14847 MW",
          "reason": "Day Peak Generation: 14847 MW.",
          "full_desc": "Day Peak Generation: 14847 MW."
        },
        {
          "time": "12:39",
          "plant": "Bhulta-Narsingdi 132 kV Ckt-1",
          "load": "HT Outage",
          "reason": "Bhulta-Narsingdi 132 kV Ckt-1 is restored.",
          "full_desc": "Bhulta-Narsingdi 132 kV Ckt-1 is restored."
        },
        {
          "time": "12:44 - 16:00",
          "plant": "Bhulta-Haripur 132 kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "Due to For changing DS(203) finger",
          "full_desc": "Bhulta-Haripur 132 kV Ckt-1 Scheduled S/D from Bhulta 132/33kV end Due to For changing DS(203) finger"
        },
        {
          "time": "13:47 - 14:59",
          "plant": "Khagrachari-Rangamati  132kV Ckt-2 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Panel Realy test and from Rangamati 132/33kV end Due to Rangamati-Khagrachori Ckt-02 has taken Shutdown due annual relay testing works.",
          "full_desc": "Khagrachari-Rangamati  132kV Ckt-2 Scheduled S/D from Khagrachori 132/33kV end Due to Panel Realy test and from Rangamati 132/33kV end Due to Rangamati-Khagrachori Ckt-02 has taken Shutdown due annual relay testing works."
        },
        {
          "time": "14:38 - 20:06",
          "plant": "Hasnabad 132/33kV S/S 33kv Reserve Bus Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Pangaon 33 kv Feeder Reserve Bus D/S maintenance by DPBS-4",
          "full_desc": "Hasnabad 132/33kV S/S 33kv Reserve Bus Scheduled S/D Due to Pangaon 33 kv Feeder Reserve Bus D/S maintenance by DPBS-4"
        },
        {
          "time": "14:55 - 17:57",
          "plant": "Chowmuhani 230/132/33kV S/S TR3-435T HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to TR-03 transformer 33kV VCB R Phase Red-hot Maintenance",
          "full_desc": "Chowmuhani 230/132/33kV S/S TR3-435T HT Forced S/D Due to TR-03 transformer 33kV VCB R Phase Red-hot Maintenance"
        },
        {
          "time": "14:55 - 17:57",
          "plant": "Chowmuhani 230/132/33kV S/S TR3-435T LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to TR-03 transformer 33kV VCB R Phase Red-hot Maintenance.",
          "full_desc": "Chowmuhani 230/132/33kV S/S TR3-435T LT Forced S/D Due to TR-03 transformer 33kV VCB R Phase Red-hot Maintenance."
        },
        {
          "time": "15:00 - 15:29",
          "plant": "Khagrachari-Rangamati  132kV Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "due to annual relay testing works.",
          "full_desc": "Khagrachari-Rangamati  132kV Ckt-1 Forced S/D from Khagrachori 132/33kV end Due to Panel relay test and from Rangamati 132/33kV end Due to Rangamati-Khagrachori Ckt-01 has taken Shutdown due to annual relay testing works."
        },
        {
          "time": "15:31 - 16:04",
          "plant": "Chandraghona-Rangamati 132 kV Ckt-2 Scheduled",
          "load": "HT Outage",
          "reason": "due to annual relay testing works.",
          "full_desc": "Chandraghona-Rangamati 132 kV Ckt-2 Scheduled S/D from Rangamati 132/33kV end Due to Rangamati-Chardraghona Ckt-01 has taken shutdown due to annual relay testing works."
        },
        {
          "time": "16:04",
          "plant": "Bhulta-Narsingdi 132 kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "for backup time so it\u2019s must be shutdown always from bhulta 132KV end.",
          "full_desc": "Bhulta-Narsingdi 132 kV Ckt-1 Scheduled S/D from Bhulta 132/33kV end Due to This line using Only for backup time so it\u2019s must be shutdown always from bhulta 132KV end."
        },
        {
          "time": "18:22 - 18:44",
          "plant": "Panchagar-Thakurgaon  132kV Ckt-1 Tripped from Thakurgaon 132/33kV end showing Distance relays",
          "load": "HT Outage",
          "reason": "Due to Huge thundering and from Panchagarh 132/33kV end showing P442 relays Due to Heavy Rain and Thundering",
          "full_desc": "Panchagar-Thakurgaon  132kV Ckt-1 Tripped from Thakurgaon 132/33kV end showing Distance relays Due to Huge thundering and from Panchagarh 132/33kV end showing P442 relays Due to Heavy Rain and Thundering"
        },
        {
          "time": "18:51 - 19:02",
          "plant": "Benapole 132/33kV S/S Transformer-1(406T) LT Tripped showing O/C, 50 DMT STG-2 relays Due to Due to 33 kv Sharsha and Benapole feeder tripped",
          "load": "HT Outage",
          "reason": "for heavy thunderstorm and rain.",
          "full_desc": "Benapole 132/33kV S/S Transformer-1(406T) LT Tripped showing O/C, 50 DMT STG-2 relays Due to Due to 33 kv Sharsha and Benapole feeder tripped for heavy thunderstorm and rain."
        },
        {
          "time": "20:42 - 22:20",
          "plant": "Lakshmipur 132/33kV S/S Transformer-1 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Fix Red Hot Problem.",
          "full_desc": "Lakshmipur 132/33kV S/S Transformer-1 LT Scheduled S/D Due to Fix Red Hot Problem."
        },
        {
          "time": "20:43 - 22:16",
          "plant": "Lakshmipur 132/33kV S/S Transformer-1 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Fix Red Hot Problem.",
          "full_desc": "Lakshmipur 132/33kV S/S Transformer-1 HT Scheduled S/D Due to Fix Red Hot Problem."
        },
        {
          "time": "21:25",
          "plant": "At Chorfashion SS,T2-33 KV CB",
          "load": "HT Outage",
          "reason": "At Chorfashion SS,T2-33 KV CB is closed.",
          "full_desc": "At Chorfashion SS,T2-33 KV CB is closed."
        },
        {
          "time": "21:37",
          "plant": "Hasnabad-Sitalakhya 132kV Ckt-1",
          "load": "HT Outage",
          "reason": "Hasnabad-Sitalakhya 132kV Ckt-1 is restored.",
          "full_desc": "Hasnabad-Sitalakhya 132kV Ckt-1 is restored."
        },
        {
          "time": "23:55",
          "plant": "Chandpur 132/33kV S/S 422T(T-5) LT",
          "load": "HT Outage",
          "reason": "Chandpur 132/33kV S/S 422T(T-5) LT is restored.",
          "full_desc": "Chandpur 132/33kV S/S 422T(T-5) LT is restored."
        },
        {
          "time": "23:55",
          "plant": "Chandpur 132/33kV S/S 422T(T-5) HT",
          "load": "HT Outage",
          "reason": "Chandpur 132/33kV S/S 422T(T-5) HT is restored.",
          "full_desc": "Chandpur 132/33kV S/S 422T(T-5) HT is restored."
        },
        {
          "time": "00:00 - 00:56",
          "plant": "Chandpur 132/33kV S/S 402T (T-01) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Red hot maintenance by BPDB (CDR-2 DS)",
          "full_desc": "Chandpur 132/33kV S/S 402T (T-01) HT Scheduled S/D Due to Red hot maintenance by BPDB (CDR-2 DS)"
        },
        {
          "time": "00:00 - 00:56",
          "plant": "Chandpur 132/33kV S/S 402T (T-01) LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Red hot maintenance at cdr-2",
          "full_desc": "Chandpur 132/33kV S/S 402T (T-01) LT Scheduled S/D Due to Red hot maintenance at cdr-2"
        },
        {
          "time": "00:00 - 00:56",
          "plant": "Chandpur 132/33kV S/S 33 kV T-1 Section Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Red hot maintenance (CDR-2 DS)  <br> S/D taken by BPDB",
          "full_desc": "Chandpur 132/33kV S/S 33 kV T-1 Section Scheduled S/D Due to Red hot maintenance (CDR-2 DS)  <br> S/D taken by BPDB"
        },
        {
          "time": "01:00",
          "plant": "Chandpur 132/33kV S/S 422T(T-5) LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Chandpur 132/33kV S/S 422T(T-5) LT Scheduled S/D",
          "full_desc": "Chandpur 132/33kV S/S 422T(T-5) LT Scheduled S/D"
        },
        {
          "time": "01:00",
          "plant": "Chandpur 132/33kV S/S 422T(T-5) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to None",
          "full_desc": "Chandpur 132/33kV S/S 422T(T-5) HT Scheduled S/D Due to None"
        },
        {
          "time": "06:00",
          "plant": "Minimum generation 13239 MW",
          "load": "13239 MW",
          "reason": "Minimum generation 13239 MW",
          "full_desc": "Minimum generation 13239 MW"
        },
        {
          "time": "07:16",
          "plant": "Meghnaghat 400/230kV S/S 230kV BUS Section 02 Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Requested by NLDC",
          "full_desc": "Meghnaghat 400/230kV S/S 230kV BUS Section 02 Scheduled S/D Due to Requested by NLDC"
        },
        {
          "time": "07:45",
          "plant": "Meghnaghat 230/132kV S/S Bus2 Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to rad hot maintenance",
          "full_desc": "Meghnaghat 230/132kV S/S Bus2 Scheduled S/D Due to rad hot maintenance"
        }
      ],
      "hourlyLoadData": [],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 470.4,
          "condensate": 333.5,
          "share": 17.7
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 140.4,
          "condensate": 644,
          "share": 5.3
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 111.4,
          "condensate": 74.8,
          "share": 4.2
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 917,
          "condensate": 5009.2,
          "share": 34.6
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 32.5,
          "condensate": 94,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 982.4,
          "condensate": 25.5,
          "share": 37
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 233.9,
          "fertilizer": 73.4,
          "others": 1021.8,
          "total": 1329.1
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 205.1,
          "fertilizer": 0,
          "others": 85.9,
          "total": 291
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 37.3,
          "fertilizer": 52.5,
          "others": 160,
          "total": 249.8
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 232.7,
          "fertilizer": 39.7,
          "others": 114.6,
          "total": 386.9
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 112.3,
          "fertilizer": 0,
          "others": 28.2,
          "total": 140.5
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 99.2,
          "fertilizer": 0,
          "others": 4,
          "total": 103.2
        }
      ]
    },
  "2026-06-09": {
      "systemStats": {
        "date": "09 Jun 2026",
        "dayPeakGen": 14141,
        "eveningPeakGen": 14520,
        "dayPeakDemand": null,
        "eveningPeakDemand": 14707.06,
        "minGen": null,
        "maxGen": null,
        "totalEnergyGen": 342.15150821,
        "totalEnergyUnserved": null,
        "totalEnergyDemand": null,
        "maxTemp": null,
        "totalGasSuppliedPower": 916.72,
        "avgProductionCost": 6.298,
        "totalDailyCost": 2154825895
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 123.09,
          "cost": null,
          "unitCost": null,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 126.03,
          "cost": null,
          "unitCost": null,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 28.6,
          "cost": null,
          "unitCost": null,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 1.45,
          "cost": null,
          "unitCost": null,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 3.5,
          "cost": null,
          "unitCost": null,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 59.12,
          "cost": null,
          "unitCost": null,
          "color": "#a855f7"
        },
        {
          "name": "HSD (Diesel)",
          "gen": 0,
          "cost": null,
          "unitCost": null,
          "color": "#ef4444"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 22.44,
          "peakFlow": 932,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 33.23,
          "peakFlow": 1452,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.45,
          "peakFlow": 128,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 0,
          "demand": 5444,
          "pct": 0
        },
        {
          "zone": "Chattogram",
          "loadShed": 0,
          "demand": 1520,
          "pct": 0
        },
        {
          "zone": "Khulna",
          "loadShed": 0,
          "demand": 1487,
          "pct": 0
        },
        {
          "zone": "Rajshahi",
          "loadShed": 0,
          "demand": 1485,
          "pct": 0
        },
        {
          "zone": "Cumilla",
          "loadShed": 0,
          "demand": 1131,
          "pct": 0
        },
        {
          "zone": "Mymensingh",
          "loadShed": 179,
          "demand": 1253,
          "pct": 14.29
        },
        {
          "zone": "Sylhet",
          "loadShed": 0,
          "demand": 533,
          "pct": 0
        },
        {
          "zone": "Barishal",
          "loadShed": 0,
          "demand": 351,
          "pct": 0
        },
        {
          "zone": "Rangpur",
          "loadShed": 0,
          "demand": 1013,
          "pct": 0
        }
      ],
      "dailyOutages": [
        {
          "time": "08:29 - 08:53",
          "plant": "Niamatpur 132/33kV S/S Transformer-1(407T) LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to PBS auxiliary transformer replace",
          "full_desc": "Niamatpur 132/33kV S/S Transformer-1(407T) LT Forced S/D Due to PBS auxiliary transformer replace"
        },
        {
          "time": "08:30 - 08:53",
          "plant": "Niamatpur 132/33kV S/S Transformer-1(407T) HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to PBS auxiliary transformer replace",
          "full_desc": "Niamatpur 132/33kV S/S Transformer-1(407T) HT Forced S/D Due to PBS auxiliary transformer replace"
        },
        {
          "time": "08:34 - 18:46",
          "plant": "Maijdee 132/33kV S/S Chowmuhoni-Maijdee ckt -01 Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Project work",
          "full_desc": "Maijdee 132/33kV S/S Chowmuhoni-Maijdee ckt -01 Project Work S/D Due to Project work"
        },
        {
          "time": "08:35 - 18:45",
          "plant": "Chowmuhani 230/132/33kV S/S Maijdee-01 Project Work S/D",
          "load": "HT Outage",
          "reason": "Chowmuhani 230/132/33kV S/S Maijdee-01 Project Work S/D",
          "full_desc": "Chowmuhani 230/132/33kV S/S Maijdee-01 Project Work S/D"
        },
        {
          "time": "09:06 - 19:41",
          "plant": "Barguna 132/33kV S/S Transformer-2 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Replacement of Circuit Breaker of T2-A Incomer.",
          "full_desc": "Barguna 132/33kV S/S Transformer-2 LT Scheduled S/D Due to Replacement of Circuit Breaker of T2-A Incomer."
        },
        {
          "time": "09:06 - 19:40",
          "plant": "Barguna 132/33kV S/S Transformer-2 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Replacement of Circuit Breaker of T2-A Incomer",
          "full_desc": "Barguna 132/33kV S/S Transformer-2 HT Scheduled S/D Due to Replacement of Circuit Breaker of T2-A Incomer"
        },
        {
          "time": "09:50 - 12:56",
          "plant": "Niamatpur 132/33kV S/S Transformer-3(426T) LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to T-3 33 kV source bus DS maintenance work",
          "full_desc": "Niamatpur 132/33kV S/S Transformer-3(426T) LT Scheduled S/D Due to T-3 33 kV source bus DS maintenance work"
        },
        {
          "time": "09:51 - 12:55",
          "plant": "Niamatpur 132/33kV S/S Transformer-3(426T) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to T-3 33kv source bus DS maintenance work",
          "full_desc": "Niamatpur 132/33kV S/S Transformer-3(426T) HT Scheduled S/D Due to T-3 33kv source bus DS maintenance work"
        },
        {
          "time": "10:54 - 19:49",
          "plant": "Lalmonirhat-Rangpur 132 kV Ckt-2 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Installation of distance relay",
          "full_desc": "Lalmonirhat-Rangpur 132 kV Ckt-2 Scheduled S/D from Lalmonirhat 132/33kV end Due to Installation of distance relay"
        },
        {
          "time": "11:03",
          "plant": "Satkhira 132/33kV S/S Transformer-3(T-3) HT",
          "load": "HT Outage",
          "reason": "Satkhira 132/33kV S/S Transformer-3(T-3) HT is restored.",
          "full_desc": "Satkhira 132/33kV S/S Transformer-3(T-3) HT is restored."
        },
        {
          "time": "11:06",
          "plant": "Satkhira 132/33kV S/S Transformer-3(T-3) LT",
          "load": "HT Outage",
          "reason": "Satkhira 132/33kV S/S Transformer-3(T-3) LT is restored.",
          "full_desc": "Satkhira 132/33kV S/S Transformer-3(T-3) LT is restored."
        },
        {
          "time": "11:12 - 14:19",
          "plant": "Kaliakoir-Tongi  230kV Ckt-2 Scheduled",
          "load": "HT Outage",
          "reason": "Due to taken by kaliyakair via NLDC",
          "full_desc": "Kaliakoir-Tongi  230kV Ckt-2 Scheduled S/D from Tongi 230/132/33kV end Due to taken by kaliyakair via NLDC"
        },
        {
          "time": "11:16 - 11:43",
          "plant": "Maijdee 132/33kV S/S Tr-02 HT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to project work",
          "full_desc": "Maijdee 132/33kV S/S Tr-02 HT Project Work S/D Due to project work"
        },
        {
          "time": "11:32",
          "plant": "Haripur 230/132kV S/S 132kV Bus Coupler-2 Scheduled S/D",
          "load": "100MW",
          "reason": "Due to 132kV CRP Panel Shifting work from 100MW BPDB Control Room to 230/132kV Grid SS Control Room",
          "full_desc": "Haripur 230/132kV S/S 132kV Bus Coupler-2 Scheduled S/D Due to 132kV CRP Panel Shifting work from 100MW BPDB Control Room to 230/132kV Grid SS Control Room"
        },
        {
          "time": "11:33 - 14:48",
          "plant": "Barishal 230/132kV S/S ATR-2 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to WTI change",
          "full_desc": "Barishal 230/132kV S/S ATR-2 LT Scheduled S/D Due to WTI change"
        },
        {
          "time": "11:34 - 14:50",
          "plant": "Barishal 230/132kV S/S ATR-2 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to WTI change",
          "full_desc": "Barishal 230/132kV S/S ATR-2 HT Scheduled S/D Due to WTI change"
        },
        {
          "time": "11:57 - 12:14",
          "plant": "Maijdee 132/33kV S/S TR-01 HT Project Work",
          "load": "HT Outage",
          "reason": "due to project work",
          "full_desc": "Maijdee 132/33kV S/S TR-01 HT Project Work S/D Due to 132/33 kV Tr-02 HT  S/D due to project work"
        },
        {
          "time": "12:00",
          "plant": "Day Peak Generation: 14131 MW.",
          "load": "14131 MW",
          "reason": "Day Peak Generation: 14131 MW.",
          "full_desc": "Day Peak Generation: 14131 MW."
        },
        {
          "time": "13:03 - 19:57",
          "plant": "Kabirpur -Tongi   132kV Ckt-2 Tripped from Tongi 230/132/33kV end showing OC/EF, RYB ph Trip, d-51.8 km, AR blocked relays. and from Kabirpur 132/33kV end showing Distance Relay relays.",
          "load": "HT Outage",
          "reason": "Kabirpur -Tongi   132kV Ckt-2 Tripped from Tongi 230/132/33kV end showing OC/EF, RYB ph Trip, d-51.8 km, AR blocked relays. and from Kabirpur 132/33kV end showing Distance Relay relays.",
          "full_desc": "Kabirpur -Tongi   132kV Ckt-2 Tripped from Tongi 230/132/33kV end showing OC/EF, RYB ph Trip, d-51.8 km, AR blocked relays. and from Kabirpur 132/33kV end showing Distance Relay relays."
        },
        {
          "time": "13:18",
          "plant": "Ashuganj 450 MW CCPP(South) Tripped with remarks:- ST",
          "load": "450 MW",
          "reason": "Ashuganj 450 MW CCPP(South) Tripped with remarks:- ST",
          "full_desc": "Ashuganj 450 MW CCPP(South) Tripped with remarks:- ST"
        },
        {
          "time": "13:22 - 18:26",
          "plant": "Ashuganj-Brahmanbaria 132kV Ckt-2 Tripped from Brahmanbaria 132/33kV end showing Distance relay relays.",
          "load": "HT Outage",
          "reason": "Ashuganj-Brahmanbaria 132kV Ckt-2 Tripped from Brahmanbaria 132/33kV end showing Distance relay relays.",
          "full_desc": "Ashuganj-Brahmanbaria 132kV Ckt-2 Tripped from Brahmanbaria 132/33kV end showing Distance relay relays."
        },
        {
          "time": "13:30",
          "plant": "Ashuganj 450 MW CCPP(South) Synchronized with remarks:- False SMS ( STG Trip & GT Running ).",
          "load": "450 MW",
          "reason": "Ashuganj 450 MW CCPP(South) Synchronized with remarks:- False SMS ( STG Trip & GT Running ).",
          "full_desc": "Ashuganj 450 MW CCPP(South) Synchronized with remarks:- False SMS ( STG Trip & GT Running )."
        },
        {
          "time": "13:30",
          "plant": "Ashuganj 450 MW CCPP(South) Synchronized with remarks:- False SMS (STG Trip & GT Running).",
          "load": "450 MW",
          "reason": "Ashuganj 450 MW CCPP(South) Synchronized with remarks:- False SMS (STG Trip & GT Running).",
          "full_desc": "Ashuganj 450 MW CCPP(South) Synchronized with remarks:- False SMS (STG Trip & GT Running)."
        },
        {
          "time": "13:40 - 13:41",
          "plant": "Shikalbaha 230/132kV S/S ATR 02 HT Tripped showing FN1 relays",
          "load": "HT Outage",
          "reason": "Due to DC MCB trip.",
          "full_desc": "Shikalbaha 230/132kV S/S ATR 02 HT Tripped showing FN1 relays Due to DC MCB trip."
        },
        {
          "time": "13:41 - 14:02",
          "plant": "Dohazari 132/33kV S/S Power Transformer -T-2 LT Tripped showing No Signal at Relay relays",
          "load": "HT Outage",
          "reason": "Due to Due to Sikalbaha 230 KV Transformer Trip",
          "full_desc": "Dohazari 132/33kV S/S Power Transformer -T-2 LT Tripped showing No Signal at Relay relays Due to Due to Sikalbaha 230 KV Transformer Trip"
        },
        {
          "time": "14:14",
          "plant": "Kaliakoir-Kodda(300MW)  230kV Ckt-1",
          "load": "300MW",
          "reason": "Kaliakoir-Kodda(300MW)  230kV Ckt-1 is restored.",
          "full_desc": "Kaliakoir-Kodda(300MW)  230kV Ckt-1 is restored."
        },
        {
          "time": "15:43",
          "plant": "Meghnaghat 400/230kV S/S 230kV BUS Section 02",
          "load": "HT Outage",
          "reason": "Meghnaghat 400/230kV S/S 230kV BUS Section 02 is restored.",
          "full_desc": "Meghnaghat 400/230kV S/S 230kV BUS Section 02 is restored."
        },
        {
          "time": "15:45",
          "plant": "Meghnaghat 230/132kV S/S Bus2",
          "load": "HT Outage",
          "reason": "Meghnaghat 230/132kV S/S Bus2 is restored.",
          "full_desc": "Meghnaghat 230/132kV S/S Bus2 is restored."
        },
        {
          "time": "15:45",
          "plant": "Meghnaghat 230/132kV S/S Bus2",
          "load": "HT Outage",
          "reason": "Meghnaghat 230/132kV S/S Bus2 is restored.",
          "full_desc": "Meghnaghat 230/132kV S/S Bus2 is restored."
        },
        {
          "time": "16:21 - 19:57",
          "plant": "Kabirpur -Tongi   132kV Ckt-2 Scheduled",
          "load": "HT Outage",
          "reason": "Kabirpur -Tongi   132kV Ckt-2 Scheduled S/D from Tongi 230/132/33kV end.",
          "full_desc": "Kabirpur -Tongi   132kV Ckt-2 Scheduled S/D from Tongi 230/132/33kV end."
        },
        {
          "time": "16:33 - 17:25",
          "plant": "Cumilla(N)-Cumilla(S) 132 kV Ckt-3 Tripped from Cumilla(S) 132/33kV end showing REL670 relays",
          "load": "HT Outage",
          "reason": "Due to Storm",
          "full_desc": "Cumilla(N)-Cumilla(S) 132 kV Ckt-3 Tripped from Cumilla(S) 132/33kV end showing REL670 relays Due to Storm"
        },
        {
          "time": "16:52 - 17:17",
          "plant": "Madaripur 132/33kV S/S T2-415T LT Tripped showing O/C relays",
          "load": "HT Outage",
          "reason": "Due to Due to pbs Agoiljhara fedder CT flash.",
          "full_desc": "Madaripur 132/33kV S/S T2-415T LT Tripped showing O/C relays Due to Due to pbs Agoiljhara fedder CT flash."
        },
        {
          "time": "16:52 - 17:16",
          "plant": "Madaripur 132/33kV S/S T1-405T LT Tripped showing O/C relays",
          "load": "HT Outage",
          "reason": "Due to Due to pbs Agoiljhara fedder CT flash.",
          "full_desc": "Madaripur 132/33kV S/S T1-405T LT Tripped showing O/C relays Due to Due to pbs Agoiljhara fedder CT flash."
        },
        {
          "time": "21:45 - 22:30",
          "plant": "Faridpur 132/33kV S/S 33 KV Bus Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to WZPDCO 33 kv Feeder Red-hot Maintenance. <br> (33 kv Bus section-2, No 132 kv X-former Shutdown)",
          "full_desc": "Faridpur 132/33kV S/S 33 KV Bus Scheduled S/D Due to WZPDCO 33 kv Feeder Red-hot Maintenance. <br> (33 kv Bus section-2, No 132 kv X-former Shutdown)"
        },
        {
          "time": "22:16",
          "plant": "Ashuganj CCPP 225 MW Synchronized with remarks:- ST trip-22:16 on 09.6.26",
          "load": "225 MW",
          "reason": "Ashuganj CCPP 225 MW Synchronized with remarks:- ST trip-22:16 on 09.6.26",
          "full_desc": "Ashuganj CCPP 225 MW Synchronized with remarks:- ST trip-22:16 on 09.6.26"
        },
        {
          "time": "22:16",
          "plant": "Ashuganj CCPP 225 MW Tripped with remarks:- ST",
          "load": "225 MW",
          "reason": "Ashuganj CCPP 225 MW Tripped with remarks:- ST",
          "full_desc": "Ashuganj CCPP 225 MW Tripped with remarks:- ST"
        },
        {
          "time": "22:17",
          "plant": "Ashuganj 225 MW CCPP ST tripped.",
          "load": "225 MW",
          "reason": "Ashuganj 225 MW CCPP ST tripped.",
          "full_desc": "Ashuganj 225 MW CCPP ST tripped."
        },
        {
          "time": "22:31",
          "plant": "SS Power Tripped",
          "load": "HT Outage",
          "reason": "SS Power Tripped",
          "full_desc": "SS Power Tripped"
        },
        {
          "time": "22:31",
          "plant": "SS Power Synchronized with remarks:- u-2 tripped-22:31 on 09.06.26",
          "load": "HT Outage",
          "reason": "SS Power Synchronized with remarks:- u-2 tripped-22:31 on 09.06.26",
          "full_desc": "SS Power Synchronized with remarks:- u-2 tripped-22:31 on 09.06.26"
        },
        {
          "time": "22:31",
          "plant": "SS Power Bashkhali Unit-2 tripped.",
          "load": "HT Outage",
          "reason": "SS Power Bashkhali Unit-2 tripped.",
          "full_desc": "SS Power Bashkhali Unit-2 tripped."
        },
        {
          "time": "22:45",
          "plant": "Daganbhuiyan 132/33kV S/S Transformer-2 LT Tripped showing Main Relay -01 relays",
          "load": "HT Outage",
          "reason": "Due to PBS 33KV side B phase PT Broken & R phase conductor Broken",
          "full_desc": "Daganbhuiyan 132/33kV S/S Transformer-2 LT Tripped showing Main Relay -01 relays Due to PBS 33KV side B phase PT Broken & R phase conductor Broken"
        },
        {
          "time": "00:17",
          "plant": "Ashuganj South 360 MW CCPP ST",
          "load": "360 MW",
          "reason": "Ashuganj South 360 MW CCPP ST was sync.",
          "full_desc": "Ashuganj South 360 MW CCPP ST was sync."
        },
        {
          "time": "00:17",
          "plant": "Ashuganj 450 MW CCPP(South) Synchronized with remarks:- ST",
          "load": "450 MW",
          "reason": "Ashuganj 450 MW CCPP(South) Synchronized with remarks:- ST",
          "full_desc": "Ashuganj 450 MW CCPP(South) Synchronized with remarks:- ST"
        },
        {
          "time": "00:57 - 01:13",
          "plant": "Khagrachori 132/33kV S/S TR-2 LT Tripped showing REF630 relays",
          "load": "HT Outage",
          "reason": "Due to Due to crackdown of Panchari 33 kV bus DS insulator.",
          "full_desc": "Khagrachori 132/33kV S/S TR-2 LT Tripped showing REF630 relays Due to Due to crackdown of Panchari 33 kV bus DS insulator."
        },
        {
          "time": "00:57 - 01:13",
          "plant": "Khagrachori 132/33kV S/S TR-1 LT Tripped showing REF630 relays",
          "load": "HT Outage",
          "reason": "Due to Due to crackdown of Panchari 33 kV bus DS insulator.",
          "full_desc": "Khagrachori 132/33kV S/S TR-1 LT Tripped showing REF630 relays Due to Due to crackdown of Panchari 33 kV bus DS insulator."
        },
        {
          "time": "01:56",
          "plant": "SS Power Synchronized",
          "load": "HT Outage",
          "reason": "SS Power Synchronized",
          "full_desc": "SS Power Synchronized"
        },
        {
          "time": "01:56",
          "plant": "SS Power Bashkhali Unit-2",
          "load": "HT Outage",
          "reason": "SS Power Bashkhali Unit-2 was sync.",
          "full_desc": "SS Power Bashkhali Unit-2 was sync."
        },
        {
          "time": "02:30",
          "plant": "Ashuganj CCPP 225 MW Synchronized with remarks:- ST",
          "load": "225 MW",
          "reason": "Ashuganj CCPP 225 MW Synchronized with remarks:- ST",
          "full_desc": "Ashuganj CCPP 225 MW Synchronized with remarks:- ST"
        },
        {
          "time": "02:30",
          "plant": "Ashuganj 225 MW CCPP ST",
          "load": "225 MW",
          "reason": "Ashuganj 225 MW CCPP ST was sync.",
          "full_desc": "Ashuganj 225 MW CCPP ST was sync."
        },
        {
          "time": "06:15 - 07:02",
          "plant": "Lalmonirhat 132/33kV S/S T-1 (425T) LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to T-01 33KV incoming circuit breaker Red Hot maintenance",
          "full_desc": "Lalmonirhat 132/33kV S/S T-1 (425T) LT Scheduled S/D Due to T-01 33KV incoming circuit breaker Red Hot maintenance"
        },
        {
          "time": "06:16 - 07:01",
          "plant": "Lalmonirhat 132/33kV S/S T-1 (425T) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to T-01 33KV incoming circuit breaker Red Hot maintenance",
          "full_desc": "Lalmonirhat 132/33kV S/S T-1 (425T) HT Scheduled S/D Due to T-01 33KV incoming circuit breaker Red Hot maintenance"
        },
        {
          "time": "06:20",
          "plant": "Barishal 230/132kV S/S T-4 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33 kV bus Section DS, Babuganj & Jhalakathi 33 kV feeder source DS Work. Work done by PBS",
          "full_desc": "Barishal 230/132kV S/S T-4 LT Scheduled S/D Due to 33 kV bus Section DS, Babuganj & Jhalakathi 33 kV feeder source DS Work. Work done by PBS"
        },
        {
          "time": "06:21",
          "plant": "Barishal 230/132kV S/S T-4 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33 kV bus Section DS, Babuganj & Jhalakathi 33 kV feeder source DS Work. Work done by PBS",
          "full_desc": "Barishal 230/132kV S/S T-4 HT Scheduled S/D Due to 33 kV bus Section DS, Babuganj & Jhalakathi 33 kV feeder source DS Work. Work done by PBS"
        },
        {
          "time": "06:21",
          "plant": "Barishal 230/132kV S/S T-5 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33 kV bus Section DS, Babuganj & Jhalakathi 33 kV feeder source DS Work. Work done by PBS",
          "full_desc": "Barishal 230/132kV S/S T-5 HT Scheduled S/D Due to 33 kV bus Section DS, Babuganj & Jhalakathi 33 kV feeder source DS Work. Work done by PBS"
        },
        {
          "time": "06:21",
          "plant": "Barishal 230/132kV S/S T-5 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33 kV bus Section DS, Babuganj & Jhalakathi 33 kV feeder source DS Work. Work done by PBS",
          "full_desc": "Barishal 230/132kV S/S T-5 LT Scheduled S/D Due to 33 kV bus Section DS, Babuganj & Jhalakathi 33 kV feeder source DS Work. Work done by PBS"
        }
      ],
      "hourlyLoadData": [],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 468.2,
          "condensate": 317.5,
          "share": 17.7
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 140.3,
          "condensate": 643.7,
          "share": 5.3
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 109,
          "condensate": 71,
          "share": 4.1
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 916,
          "condensate": 4939.8,
          "share": 34.6
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 32.5,
          "condensate": 95,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 983,
          "condensate": 25.5,
          "share": 37.1
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 233.7,
          "fertilizer": 73.1,
          "others": 1035,
          "total": 1341.8
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 210.5,
          "fertilizer": 0,
          "others": 86.6,
          "total": 297
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 38,
          "fertilizer": 54.7,
          "others": 167.6,
          "total": 260.2
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 235.5,
          "fertilizer": 39.8,
          "others": 115.5,
          "total": 390.9
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 110.8,
          "fertilizer": 0,
          "others": 29.9,
          "total": 140.7
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 100.5,
          "fertilizer": 0,
          "others": 4.6,
          "total": 105.1
        }
      ]
    },
  "2026-06-10": {
      "systemStats": {
        "date": "10 Jun 2026",
        "dayPeakGen": 13966.46,
        "eveningPeakGen": 15203.2,
        "dayPeakDemand": null,
        "eveningPeakDemand": 15393.2,
        "minGen": null,
        "maxGen": null,
        "totalEnergyGen": 331.23059995,
        "totalEnergyUnserved": null,
        "totalEnergyDemand": null,
        "maxTemp": null,
        "totalGasSuppliedPower": 879.17,
        "avgProductionCost": 6.335,
        "totalDailyCost": 2098405760
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 119.85,
          "cost": null,
          "unitCost": null,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 118.94,
          "cost": null,
          "unitCost": null,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 29.55,
          "cost": null,
          "unitCost": null,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 1.38,
          "cost": null,
          "unitCost": null,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 3.13,
          "cost": null,
          "unitCost": null,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 58.22,
          "cost": null,
          "unitCost": null,
          "color": "#a855f7"
        },
        {
          "name": "HSD (Diesel)",
          "gen": 0,
          "cost": null,
          "unitCost": null,
          "color": "#ef4444"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 22.44,
          "peakFlow": 928,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 32.31,
          "peakFlow": 1438,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.48,
          "peakFlow": 164,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 9,
          "demand": 5411,
          "pct": 0.17
        },
        {
          "zone": "Chattogram",
          "loadShed": 0,
          "demand": 1498,
          "pct": 0
        },
        {
          "zone": "Khulna",
          "loadShed": 0,
          "demand": 1678,
          "pct": 0
        },
        {
          "zone": "Rajshahi",
          "loadShed": 0,
          "demand": 1468,
          "pct": 0
        },
        {
          "zone": "Cumilla",
          "loadShed": 0,
          "demand": 1458,
          "pct": 0
        },
        {
          "zone": "Mymensingh",
          "loadShed": 173,
          "demand": 1253,
          "pct": 13.81
        },
        {
          "zone": "Sylhet",
          "loadShed": 0,
          "demand": 556,
          "pct": 0
        },
        {
          "zone": "Barishal",
          "loadShed": 0,
          "demand": 465,
          "pct": 0
        },
        {
          "zone": "Rangpur",
          "loadShed": 0,
          "demand": 1002,
          "pct": 0
        }
      ],
      "dailyOutages": [
        {
          "time": "08:20 - 18:52",
          "plant": "Maijdee 132/33kV S/S Chowmuhoni-Maijdee ckt -02 Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to project work",
          "full_desc": "Maijdee 132/33kV S/S Chowmuhoni-Maijdee ckt -02 Project Work S/D Due to project work"
        },
        {
          "time": "08:25 - 18:51",
          "plant": "Chowmuhani 230/132/33kV S/S Maijdee-02 Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to GIS building outside painting.",
          "full_desc": "Chowmuhani 230/132/33kV S/S Maijdee-02 Project Work S/D Due to GIS building outside painting."
        },
        {
          "time": "08:42",
          "plant": "Barishal 230/132kV S/S T-5 HT",
          "load": "HT Outage",
          "reason": "Barishal 230/132kV S/S T-5 HT is restored.",
          "full_desc": "Barishal 230/132kV S/S T-5 HT is restored."
        },
        {
          "time": "08:44",
          "plant": "Barishal 230/132kV S/S T-5 LT",
          "load": "HT Outage",
          "reason": "Barishal 230/132kV S/S T-5 LT is restored.",
          "full_desc": "Barishal 230/132kV S/S T-5 LT is restored."
        },
        {
          "time": "08:53",
          "plant": "At Bhola Natun Bidyut PP,230 KV Bus-1",
          "load": "HT Outage",
          "reason": "due to Project work.",
          "full_desc": "At Bhola Natun Bidyut PP,230 KV Bus-1 is SD due to Project work."
        },
        {
          "time": "09:13 - 13:14",
          "plant": "Halishahar 132/33kV S/S 405T(TR-1) HT Project Work S/D",
          "load": "HT Outage",
          "reason": "Halishahar 132/33kV S/S 405T(TR-1) HT Project Work S/D",
          "full_desc": "Halishahar 132/33kV S/S 405T(TR-1) HT Project Work S/D"
        },
        {
          "time": "10:12 - 12:26",
          "plant": "Nabinagar 132/33kV S/S T-1 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to \u098f\u09a8\u09be\u09b0\u09cd\u099c\u09bf\u09aa\u09cd\u09af\u09be\u0995 \u0995\u09b0\u09cd\u09a4\u09c3\u0995 \u09e7\u09e9\u09e8/\u09e9\u09e9 \u0995\u09c7\u09ad\u09bf \u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09ab\u09b0\u09ae\u09be\u09b0\u09c7\u09b0 \u09e9\u09e9 \u0995\u09c7\u09ad\u09bf \u09b8\u09be\u0987\u09a1\u09c7 \u09a4\u09be\u09aa\u09ae\u09be\u09a4\u09cd\u09b0\u09be \u09ac\u09c3\u09a6\u09cd\u09a7\u09bf \u099c\u09a8\u09bf\u09a4 \u0995\u09be\u09b0\u09a3\u09c7 \u09ae\u09c7\u09b0\u09be\u09ae\u09a4 \u0995\u09be\u099c\u0964",
          "full_desc": "Nabinagar 132/33kV S/S T-1 LT Scheduled S/D Due to \u098f\u09a8\u09be\u09b0\u09cd\u099c\u09bf\u09aa\u09cd\u09af\u09be\u0995 \u0995\u09b0\u09cd\u09a4\u09c3\u0995 \u09e7\u09e9\u09e8/\u09e9\u09e9 \u0995\u09c7\u09ad\u09bf \u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09ab\u09b0\u09ae\u09be\u09b0\u09c7\u09b0 \u09e9\u09e9 \u0995\u09c7\u09ad\u09bf \u09b8\u09be\u0987\u09a1\u09c7 \u09a4\u09be\u09aa\u09ae\u09be\u09a4\u09cd\u09b0\u09be \u09ac\u09c3\u09a6\u09cd\u09a7\u09bf \u099c\u09a8\u09bf\u09a4 \u0995\u09be\u09b0\u09a3\u09c7 \u09ae\u09c7\u09b0\u09be\u09ae\u09a4 \u0995\u09be\u099c\u0964"
        },
        {
          "time": "10:14 - 12:25",
          "plant": "Nabinagar 132/33kV S/S T-1 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to \u098f\u09a8\u09be\u09b0\u09cd\u099c\u09bf\u09aa\u09cd\u09af\u09be\u0995 \u0995\u09b0\u09cd\u09a4\u09c3\u0995 \u09e7\u09e9\u09e8/\u09e9\u09e9 \u0995\u09c7\u09ad\u09bf \u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09ab\u09b0\u09ae\u09be\u09b0\u09c7\u09b0 \u09e9\u09e9 \u0995\u09c7\u09ad\u09bf \u09b8\u09be\u0987\u09a1\u09c7 \u09a4\u09be\u09aa\u09ae\u09be\u09a4\u09cd\u09b0\u09be \u09ac\u09c3\u09a6\u09cd\u09a7\u09bf \u099c\u09a8\u09bf\u09a4 \u0995\u09be\u09b0\u09a3\u09c7 \u09ae\u09c7\u09b0\u09be\u09ae\u09a4 \u0995\u09be\u099c\u0964",
          "full_desc": "Nabinagar 132/33kV S/S T-1 HT Scheduled S/D Due to \u098f\u09a8\u09be\u09b0\u09cd\u099c\u09bf\u09aa\u09cd\u09af\u09be\u0995 \u0995\u09b0\u09cd\u09a4\u09c3\u0995 \u09e7\u09e9\u09e8/\u09e9\u09e9 \u0995\u09c7\u09ad\u09bf \u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09ab\u09b0\u09ae\u09be\u09b0\u09c7\u09b0 \u09e9\u09e9 \u0995\u09c7\u09ad\u09bf \u09b8\u09be\u0987\u09a1\u09c7 \u09a4\u09be\u09aa\u09ae\u09be\u09a4\u09cd\u09b0\u09be \u09ac\u09c3\u09a6\u09cd\u09a7\u09bf \u099c\u09a8\u09bf\u09a4 \u0995\u09be\u09b0\u09a3\u09c7 \u09ae\u09c7\u09b0\u09be\u09ae\u09a4 \u0995\u09be\u099c\u0964"
        },
        {
          "time": "10:17",
          "plant": "Bheramara CCPP 410MW SD",
          "load": "410MW",
          "reason": "due to gas shortage",
          "full_desc": "Bheramara CCPP 410MW SD due to gas shortage"
        },
        {
          "time": "10:47",
          "plant": "Bhola Nutan Biddut BD LTD ST Tripped with remarks:- STG",
          "load": "HT Outage",
          "reason": "Bhola Nutan Biddut BD LTD ST Tripped with remarks:- STG tripped at 10:47hrs.",
          "full_desc": "Bhola Nutan Biddut BD LTD ST Tripped with remarks:- STG tripped at 10:47hrs."
        },
        {
          "time": "11:05",
          "plant": "Barishal 230/132kV S/S T-4 HT",
          "load": "HT Outage",
          "reason": "Barishal 230/132kV S/S T-4 HT is restored.",
          "full_desc": "Barishal 230/132kV S/S T-4 HT is restored."
        },
        {
          "time": "11:10",
          "plant": "Barishal 230/132kV S/S T-4 LT",
          "load": "HT Outage",
          "reason": "Barishal 230/132kV S/S T-4 LT is restored.",
          "full_desc": "Barishal 230/132kV S/S T-4 LT is restored."
        },
        {
          "time": "11:20 - 18:24",
          "plant": "Daganbhuiyan 132/33kV S/S Transformer-2 LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to maintenance work",
          "full_desc": "Daganbhuiyan 132/33kV S/S Transformer-2 LT Forced S/D Due to maintenance work"
        },
        {
          "time": "11:26 - 12:15",
          "plant": "Hasnabad 132/33kV S/S 132/33kV 424 T-5 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to CT Maintenance Work",
          "full_desc": "Hasnabad 132/33kV S/S 132/33kV 424 T-5 LT Scheduled S/D Due to CT Maintenance Work"
        },
        {
          "time": "11:26 - 12:15",
          "plant": "Hasnabad 132/33kV S/S 132/33kV 424 T-5 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to CT maintenance work",
          "full_desc": "Hasnabad 132/33kV S/S 132/33kV 424 T-5 HT Scheduled S/D Due to CT maintenance work"
        },
        {
          "time": "11:30 - 18:22",
          "plant": "Daganbhuiyan 132/33kV S/S Transformer-2 HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to maintenance work",
          "full_desc": "Daganbhuiyan 132/33kV S/S Transformer-2 HT Forced S/D Due to maintenance work"
        },
        {
          "time": "12:00",
          "plant": "Day Peak Generation: 13966 MW.",
          "load": "13966 MW",
          "reason": "Day Peak Generation: 13966 MW.",
          "full_desc": "Day Peak Generation: 13966 MW."
        },
        {
          "time": "15:49 - 15:58",
          "plant": "Benapole 132/33kV S/S Transformer-2(416T) LT Tripped showing ABB relays",
          "load": "HT Outage",
          "reason": "Due to Due to navaron and sutypur feeder fault",
          "full_desc": "Benapole 132/33kV S/S Transformer-2(416T) LT Tripped showing ABB relays Due to Due to navaron and sutypur feeder fault"
        },
        {
          "time": "16:21",
          "plant": "Fatullah-Shyampur(New) 132 kV Ckt-2",
          "load": "HT Outage",
          "reason": "Fatullah-Shyampur(New) 132 kV Ckt-2 is restored.",
          "full_desc": "Fatullah-Shyampur(New) 132 kV Ckt-2 is restored."
        },
        {
          "time": "17:46 - 19:35",
          "plant": "Satkhira 132/33kV S/S Transformer-3(T-3) HT Forced",
          "load": "HT Outage",
          "reason": "for manually",
          "full_desc": "Satkhira 132/33kV S/S Transformer-3(T-3) HT Forced S/D Due to Due to tap position change for manually"
        },
        {
          "time": "17:46 - 19:37",
          "plant": "Satkhira 132/33kV S/S Transformer-3(T-3) LT Forced",
          "load": "HT Outage",
          "reason": "for manually",
          "full_desc": "Satkhira 132/33kV S/S Transformer-3(T-3) LT Forced S/D Due to Due to tap position change for manually"
        },
        {
          "time": "19:23",
          "plant": "Shaympur-Fatullah ckt-2",
          "load": "HT Outage",
          "reason": "Shaympur-Fatullah ckt-2 was switched ON to load. Now Shaympur (old) grid s/s is taking full load from Shaympur 230/132 kV grid s/s.",
          "full_desc": "Shaympur-Fatullah ckt-2 was switched ON to load. Now Shaympur (old) grid s/s is taking full load from Shaympur 230/132 kV grid s/s."
        },
        {
          "time": "21:00",
          "plant": "Evening peak generation 15203 MW",
          "load": "15203 MW",
          "reason": "Evening peak generation 15203 MW",
          "full_desc": "Evening peak generation 15203 MW"
        },
        {
          "time": "00:09",
          "plant": "SS Power Synchronized with remarks:- This",
          "load": "HT Outage",
          "reason": "SS Power Synchronized with remarks:- This is False SMS ( Actually Unit-1 SD at 00:09hr & Unit-2 Running)",
          "full_desc": "SS Power Synchronized with remarks:- This is False SMS ( Actually Unit-1 SD at 00:09hr & Unit-2 Running)"
        },
        {
          "time": "00:09",
          "plant": "SS Power Shutdown",
          "load": "HT Outage",
          "reason": "SS Power Shutdown",
          "full_desc": "SS Power Shutdown"
        },
        {
          "time": "07:08",
          "plant": "Chandpur 132/33kV S/S 422T(T-5) LT",
          "load": "HT Outage",
          "reason": "Chandpur 132/33kV S/S 422T(T-5) LT is restored.",
          "full_desc": "Chandpur 132/33kV S/S 422T(T-5) LT is restored."
        },
        {
          "time": "07:08",
          "plant": "Chandpur 132/33kV S/S 422T(T-5) HT",
          "load": "HT Outage",
          "reason": "Chandpur 132/33kV S/S 422T(T-5) HT is restored.",
          "full_desc": "Chandpur 132/33kV S/S 422T(T-5) HT is restored."
        },
        {
          "time": "07:10",
          "plant": "Chandpur 132/33kV S/S 402T (T-01) LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Maintenance work of BPDB",
          "full_desc": "Chandpur 132/33kV S/S 402T (T-01) LT Scheduled S/D Due to Maintenance work of BPDB"
        },
        {
          "time": "07:10",
          "plant": "Chandpur 132/33kV S/S 402T (T-01) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Maintenance work of BPDB",
          "full_desc": "Chandpur 132/33kV S/S 402T (T-01) HT Scheduled S/D Due to Maintenance work of BPDB"
        },
        {
          "time": "07:12",
          "plant": "Chandpur 132/33kV S/S 33 kV T-1 Section Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Maitenance work of BPDB",
          "full_desc": "Chandpur 132/33kV S/S 33 kV T-1 Section Scheduled S/D Due to Maitenance work of BPDB"
        },
        {
          "time": "07:18",
          "plant": "Ashuganj-Kishoreganj 132kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "Ashuganj-Kishoreganj 132kV Ckt-1 Scheduled S/D from Bajitpur 132/33kV end.",
          "full_desc": "Ashuganj-Kishoreganj 132kV Ckt-1 Scheduled S/D from Bajitpur 132/33kV end."
        },
        {
          "time": "07:36",
          "plant": "Chowmuhani 230/132/33kV S/S Maijdee-02 Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 132 KV GIS Building Outdoor Painting",
          "full_desc": "Chowmuhani 230/132/33kV S/S Maijdee-02 Scheduled S/D Due to 132 KV GIS Building Outdoor Painting"
        },
        {
          "time": "07:42",
          "plant": "Maijdee 132/33kV S/S Chowmuhoni-Maijdee ckt -02 Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Project work at chowmuhani 230/132/33 KV S/S.",
          "full_desc": "Maijdee 132/33kV S/S Chowmuhoni-Maijdee ckt -02 Project Work S/D Due to Project work at chowmuhani 230/132/33 KV S/S."
        }
      ],
      "hourlyLoadData": [],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 466,
          "condensate": 336.5,
          "share": 17.5
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 140.1,
          "condensate": 647.5,
          "share": 5.3
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 98,
          "condensate": 65.9,
          "share": 3.7
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 916.5,
          "condensate": 4867.1,
          "share": 34.5
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 32.2,
          "condensate": 95,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1003.3,
          "condensate": 26,
          "share": 37.8
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 234,
          "fertilizer": 73.4,
          "others": 1031.2,
          "total": 1338.6
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 204.3,
          "fertilizer": 0,
          "others": 87.9,
          "total": 292.2
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 37.9,
          "fertilizer": 51.3,
          "others": 175.9,
          "total": 265.2
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 239.5,
          "fertilizer": 27,
          "others": 114.7,
          "total": 381.1
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 118.7,
          "fertilizer": 0,
          "others": 30,
          "total": 148.7
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 61.6,
          "fertilizer": 0,
          "others": 4.4,
          "total": 66
        }
      ]
    },
  "2026-06-11": {
      "systemStats": {
        "date": "11 Jun 2026",
        "dayPeakGen": 14464.11,
        "eveningPeakGen": 15068.4,
        "dayPeakDemand": null,
        "eveningPeakDemand": 15556.4,
        "minGen": null,
        "maxGen": null,
        "totalEnergyGen": 338.53868576,
        "totalEnergyUnserved": null,
        "totalEnergyDemand": null,
        "maxTemp": null,
        "totalGasSuppliedPower": 855.5,
        "avgProductionCost": 6.836,
        "totalDailyCost": 2314243766
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 116.32,
          "cost": null,
          "unitCost": null,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 115.99,
          "cost": null,
          "unitCost": null,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 41.32,
          "cost": null,
          "unitCost": null,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 1.08,
          "cost": null,
          "unitCost": null,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 3.63,
          "cost": null,
          "unitCost": null,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 59.75,
          "cost": null,
          "unitCost": null,
          "color": "#a855f7"
        },
        {
          "name": "HSD (Diesel)",
          "gen": 0,
          "cost": null,
          "unitCost": null,
          "color": "#ef4444"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 21.95,
          "peakFlow": 892,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 33.79,
          "peakFlow": 1473,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 4.01,
          "peakFlow": 190,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 172,
          "demand": 5535,
          "pct": 3.11
        },
        {
          "zone": "Chattogram",
          "loadShed": 0,
          "demand": 1491,
          "pct": 0
        },
        {
          "zone": "Khulna",
          "loadShed": 0,
          "demand": 1587,
          "pct": 0
        },
        {
          "zone": "Rajshahi",
          "loadShed": 0,
          "demand": 1391,
          "pct": 0
        },
        {
          "zone": "Cumilla",
          "loadShed": 0,
          "demand": 1550,
          "pct": 0
        },
        {
          "zone": "Mymensingh",
          "loadShed": 295,
          "demand": 1305,
          "pct": 22.61
        },
        {
          "zone": "Sylhet",
          "loadShed": 0,
          "demand": 653,
          "pct": 0
        },
        {
          "zone": "Barishal",
          "loadShed": 0,
          "demand": 500,
          "pct": 0
        },
        {
          "zone": "Rangpur",
          "loadShed": 0,
          "demand": 937,
          "pct": 0
        }
      ],
      "dailyOutages": [
        {
          "time": "08:26",
          "plant": "Chandpur 132/33kV S/S 33 kV T-1 Section",
          "load": "HT Outage",
          "reason": "Chandpur 132/33kV S/S 33 kV T-1 Section is restored.",
          "full_desc": "Chandpur 132/33kV S/S 33 kV T-1 Section is restored."
        },
        {
          "time": "08:28",
          "plant": "Chandpur 132/33kV S/S 402T (T-01) HT",
          "load": "HT Outage",
          "reason": "Chandpur 132/33kV S/S 402T (T-01) HT is restored.",
          "full_desc": "Chandpur 132/33kV S/S 402T (T-01) HT is restored."
        },
        {
          "time": "08:28",
          "plant": "Chandpur 132/33kV S/S 402T (T-01) LT",
          "load": "HT Outage",
          "reason": "Chandpur 132/33kV S/S 402T (T-01) LT is restored.",
          "full_desc": "Chandpur 132/33kV S/S 402T (T-01) LT is restored."
        },
        {
          "time": "08:30",
          "plant": "Chandpur 132/33kV S/S 422T(T-5) LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to OLTC oil centrifuging",
          "full_desc": "Chandpur 132/33kV S/S 422T(T-5) LT Scheduled S/D Due to OLTC oil centrifuging"
        },
        {
          "time": "09:12 - 12:52",
          "plant": "Ishurdi 230/132kV S/S 230 kV Bus 1 Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to loop jumper connection of Transformer T-03 with bus-1",
          "full_desc": "Ishurdi 230/132kV S/S 230 kV Bus 1 Scheduled S/D Due to loop jumper connection of Transformer T-03 with bus-1"
        },
        {
          "time": "09:55 - 12:00",
          "plant": "Muktagacha 132/33kV S/S RPCL-2 Project Work S/D",
          "load": "HT Outage",
          "reason": "Muktagacha 132/33kV S/S RPCL-2 Project Work S/D",
          "full_desc": "Muktagacha 132/33kV S/S RPCL-2 Project Work S/D"
        },
        {
          "time": "11:07",
          "plant": "Ashuganj-Kishoreganj 132kV Ckt-1",
          "load": "HT Outage",
          "reason": "Ashuganj-Kishoreganj 132kV Ckt-1 is restored.",
          "full_desc": "Ashuganj-Kishoreganj 132kV Ckt-1 is restored."
        },
        {
          "time": "12:32 - 13:35",
          "plant": "Kodda 132/33kV S/S Tr-1 (406T) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33 kV Section 01 maintenance by PBS",
          "full_desc": "Kodda 132/33kV S/S Tr-1 (406T) HT Scheduled S/D Due to 33 kV Section 01 maintenance by PBS"
        },
        {
          "time": "12:33 - 13:35",
          "plant": "Kodda 132/33kV S/S Tr-2 (416T) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33kV section 01 maintenance by PBS",
          "full_desc": "Kodda 132/33kV S/S Tr-2 (416T) HT Scheduled S/D Due to 33kV section 01 maintenance by PBS"
        },
        {
          "time": "12:37 - 13:55",
          "plant": "Mymensingh RPCL -Mymensingh  132kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Maintenance work RPCL end.",
          "full_desc": "Mymensingh RPCL -Mymensingh  132kV Ckt-1 Scheduled S/D from Mymensingh 132/33kV end Due to Maintenance work RPCL end."
        },
        {
          "time": "12:40 - 13:31",
          "plant": "Daganbhuiyan 132/33kV S/S Transformer-2 LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Tr-02 33 kv load side Earth Resistence test",
          "full_desc": "Daganbhuiyan 132/33kV S/S Transformer-2 LT Forced S/D Due to Tr-02 33 kv load side Earth Resistence test"
        },
        {
          "time": "12:41 - 13:31",
          "plant": "Daganbhuiyan 132/33kV S/S Transformer-2 HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Tr-02 33 kv Load side Earth Resistence test",
          "full_desc": "Daganbhuiyan 132/33kV S/S Transformer-2 HT Forced S/D Due to Tr-02 33 kv Load side Earth Resistence test"
        },
        {
          "time": "14:06 - 16:13",
          "plant": "Rajbari 132/33kV S/S Transformer-3 LT Tripped showing 86.1& 86.2 relays",
          "load": "HT Outage",
          "reason": "Due to WTI TRIP",
          "full_desc": "Rajbari 132/33kV S/S Transformer-3 LT Tripped showing 86.1& 86.2 relays Due to WTI TRIP"
        },
        {
          "time": "14:06 - 16:07",
          "plant": "Rajbari 132/33kV S/S Transformer-3 HT Tripped showing 86.1&2, 86.3&4 relays",
          "load": "HT Outage",
          "reason": "Due to WTI TRIP",
          "full_desc": "Rajbari 132/33kV S/S Transformer-3 HT Tripped showing 86.1&2, 86.3&4 relays Due to WTI TRIP"
        },
        {
          "time": "15:36",
          "plant": "Faridpur-Rajbari ckt-2",
          "load": "HT Outage",
          "reason": "Faridpur-Rajbari ckt-2 is restored",
          "full_desc": "Faridpur-Rajbari ckt-2 is restored"
        },
        {
          "time": "16:20 - 18:37",
          "plant": "Rajshahi 132/33kV S/S Transformer T-2(415T) HT Tripped showing 86T Lockout Relay. relays",
          "load": "HT Outage",
          "reason": "Due to 33 kV LA Blast (R- Phase)",
          "full_desc": "Rajshahi 132/33kV S/S Transformer T-2(415T) HT Tripped showing 86T Lockout Relay. relays Due to 33 kV LA Blast (R- Phase)"
        },
        {
          "time": "16:20 - 18:38",
          "plant": "Rajshahi 132/33kV S/S Transformer T-2(415T) LT Tripped showing O/C & E/F Relay relays",
          "load": "HT Outage",
          "reason": "Due to 33 kV LA Blast (R- Phase)",
          "full_desc": "Rajshahi 132/33kV S/S Transformer T-2(415T) LT Tripped showing O/C & E/F Relay relays Due to 33 kV LA Blast (R- Phase)"
        },
        {
          "time": "16:30 - 18:38",
          "plant": "Rajshahi 132/33kV S/S Transformer T-2(415T) LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to 33 kV LA Replacement work.",
          "full_desc": "Rajshahi 132/33kV S/S Transformer T-2(415T) LT Forced S/D Due to 33 kV LA Replacement work."
        },
        {
          "time": "16:30 - 18:37",
          "plant": "Rajshahi 132/33kV S/S Transformer T-2(415T) HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to 33 kV LA Replacement work.",
          "full_desc": "Rajshahi 132/33kV S/S Transformer T-2(415T) HT Forced S/D Due to 33 kV LA Replacement work."
        },
        {
          "time": "18:06",
          "plant": "Shahjibazar 132/33kV S/S TR-06 HT",
          "load": "HT Outage",
          "reason": "Shahjibazar 132/33kV S/S TR-06 HT is restored.",
          "full_desc": "Shahjibazar 132/33kV S/S TR-06 HT is restored."
        },
        {
          "time": "18:56",
          "plant": "Tangail 132/33kV S/S Tr-2 HT Tripped showing K50,86X relays",
          "load": "HT Outage",
          "reason": "Due to 132 Kv LA Blast.",
          "full_desc": "Tangail 132/33kV S/S Tr-2 HT Tripped showing K50,86X relays Due to 132 Kv LA Blast."
        },
        {
          "time": "19:53",
          "plant": "Chowmuhani 230/132/33kV S/S Maijdee-02",
          "load": "HT Outage",
          "reason": "Chowmuhani 230/132/33kV S/S Maijdee-02 is restored.",
          "full_desc": "Chowmuhani 230/132/33kV S/S Maijdee-02 is restored."
        },
        {
          "time": "19:54",
          "plant": "Maijdee 132/33kV S/S Chowmuhoni-Maijdee ckt -02",
          "load": "HT Outage",
          "reason": "Maijdee 132/33kV S/S Chowmuhoni-Maijdee ckt -02 is restored.",
          "full_desc": "Maijdee 132/33kV S/S Chowmuhoni-Maijdee ckt -02 is restored."
        },
        {
          "time": "20:00",
          "plant": "Evening Peak Generation: 15068 MW.",
          "load": "15068 MW",
          "reason": "Evening Peak Generation: 15068 MW.",
          "full_desc": "Evening Peak Generation: 15068 MW."
        },
        {
          "time": "21:43 - 22:05",
          "plant": "Bhangura 132/33kV S/S Tr-2(413T) LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to 33 kv cb y phase redhot",
          "full_desc": "Bhangura 132/33kV S/S Tr-2(413T) LT Forced S/D Due to 33 kv cb y phase redhot"
        },
        {
          "time": "21:44 - 22:04",
          "plant": "Bhangura 132/33kV S/S Tr-2(413T) HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to 33 kv cb y phase redhot",
          "full_desc": "Bhangura 132/33kV S/S Tr-2(413T) HT Forced S/D Due to 33 kv cb y phase redhot"
        },
        {
          "time": "21:59 - 23:27",
          "plant": "Chauddagram 132/33kV S/S 132 kv T-1 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33kv bus-1 redhot maintanace work  by Md.Abdul Rohim (junior Engineer feni pbs)",
          "full_desc": "Chauddagram 132/33kV S/S 132 kv T-1 LT Scheduled S/D Due to 33kv bus-1 redhot maintanace work  by Md.Abdul Rohim (junior Engineer feni pbs)"
        },
        {
          "time": "21:59 - 23:27",
          "plant": "Chauddagram 132/33kV S/S 132 kv T-1 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33kv bus-1 redhot maintanace work  by Md.Abdul Rohim (junior Engineer feni pbs).",
          "full_desc": "Chauddagram 132/33kV S/S 132 kv T-1 HT Scheduled S/D Due to 33kv bus-1 redhot maintanace work  by Md.Abdul Rohim (junior Engineer feni pbs)."
        },
        {
          "time": "22:02",
          "plant": "Tangail 132/33kV S/S Tr-2 HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to LA Replacement Work",
          "full_desc": "Tangail 132/33kV S/S Tr-2 HT Forced S/D Due to LA Replacement Work"
        },
        {
          "time": "22:02",
          "plant": "Tangail 132/33kV S/S Tr-2 LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to LA Replacement Work",
          "full_desc": "Tangail 132/33kV S/S Tr-2 LT Forced S/D Due to LA Replacement Work"
        },
        {
          "time": "00:36",
          "plant": "Bhola Notun Bidyut CCPP ST",
          "load": "HT Outage",
          "reason": "Bhola Notun Bidyut CCPP ST was synchronized.",
          "full_desc": "Bhola Notun Bidyut CCPP ST was synchronized."
        },
        {
          "time": "01:51",
          "plant": "Bhola 225 MW CCPP GT-1",
          "load": "225 MW",
          "reason": "due to maintenance purpose.",
          "full_desc": "Bhola 225 MW CCPP GT-1 was shutdown due to maintenance purpose."
        },
        {
          "time": "02:34",
          "plant": "Haripur 412 MW CCPP Shutdown with remarks:- ST",
          "load": "412 MW",
          "reason": "Haripur 412 MW CCPP Shutdown with remarks:- ST",
          "full_desc": "Haripur 412 MW CCPP Shutdown with remarks:- ST"
        },
        {
          "time": "02:41",
          "plant": "Haripur 412 MW CCPP Shutdown with remarks:- GT",
          "load": "412 MW",
          "reason": "Haripur 412 MW CCPP Shutdown with remarks:- GT",
          "full_desc": "Haripur 412 MW CCPP Shutdown with remarks:- GT"
        },
        {
          "time": "03:09",
          "plant": "Siddhirganj 2*120 MW GT-2",
          "load": "120 MW",
          "reason": "Siddhirganj 2*120 MW GT-2 was synchronized.",
          "full_desc": "Siddhirganj 2*120 MW GT-2 was synchronized."
        },
        {
          "time": "06:35",
          "plant": "Chandraghona 132/33kV S/S TR-01(406T) LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33 kv bus loop change",
          "full_desc": "Chandraghona 132/33kV S/S TR-01(406T) LT Scheduled S/D Due to 33 kv bus loop change"
        },
        {
          "time": "06:36",
          "plant": "Chandraghona 132/33kV S/S TR-01(406T) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Chandraghona 132/33kV S/S TR-01(406T) HT Scheduled S/D",
          "full_desc": "Chandraghona 132/33kV S/S TR-01(406T) HT Scheduled S/D"
        },
        {
          "time": "07:00",
          "plant": "Minimum generation 12404 MW.",
          "load": "12404 MW",
          "reason": "Minimum generation 12404 MW.",
          "full_desc": "Minimum generation 12404 MW."
        },
        {
          "time": "07:15",
          "plant": "Mymensingh RPCL-Tangail  132kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "Due to S/D taken by RPCL",
          "full_desc": "Mymensingh RPCL-Tangail  132kV Ckt-1 Scheduled S/D from Muktagacha 132/33kV end Due to S/D taken by RPCL"
        },
        {
          "time": "07:43",
          "plant": "Daganbhuiyan 132/33kV S/S Transformer-2 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Tr-02 33 KV load side PT change & loop jumpering",
          "full_desc": "Daganbhuiyan 132/33kV S/S Transformer-2 LT Scheduled S/D Due to Tr-02 33 KV load side PT change & loop jumpering"
        },
        {
          "time": "07:44",
          "plant": "Daganbhuiyan 132/33kV S/S Transformer-2 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Tr-02 33 KV load side PT change & loop jumpering.",
          "full_desc": "Daganbhuiyan 132/33kV S/S Transformer-2 HT Scheduled S/D Due to Tr-02 33 KV load side PT change & loop jumpering."
        }
      ],
      "hourlyLoadData": [],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 469.5,
          "condensate": 323.2,
          "share": 17.8
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 140.2,
          "condensate": 650.6,
          "share": 5.3
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 85.4,
          "condensate": 58.7,
          "share": 3.2
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 913.9,
          "condensate": 4847.3,
          "share": 34.6
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 32,
          "condensate": 94,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1003,
          "condensate": 26,
          "share": 37.9
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 235.9,
          "fertilizer": 73.2,
          "others": 1063.6,
          "total": 1372.8
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 207.5,
          "fertilizer": 0,
          "others": 86.1,
          "total": 293.6
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 38,
          "fertilizer": 39.7,
          "others": 177.9,
          "total": 255.7
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 224.7,
          "fertilizer": 37.2,
          "others": 114.2,
          "total": 376.1
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 112.1,
          "fertilizer": 0,
          "others": 29.7,
          "total": 141.8
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 48.2,
          "fertilizer": 0,
          "others": 4.3,
          "total": 52.5
        }
      ]
    },
  "2026-06-12": {
      "systemStats": {
        "date": "12 Jun 2026",
        "dayPeakGen": 13213.87,
        "eveningPeakGen": 15007.4,
        "dayPeakDemand": 13363.87,
        "eveningPeakDemand": 15424.4,
        "minGen": 12248.97,
        "maxGen": 15007.4,
        "totalEnergyGen": 325.444341,
        "totalEnergyUnserved": 5.987,
        "totalEnergyDemand": 331.431,
        "maxTemp": 35.1,
        "totalGasSuppliedPower": 874.51,
        "avgProductionCost": 6.708,
        "totalDailyCost": 2183057665
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 118.14,
          "cost": 411529313,
          "unitCost": 3.4834,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 105.77,
          "cost": 706475389,
          "unitCost": 6.6793,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 37.81,
          "cost": 655555195,
          "unitCost": 17.3367,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 0.74,
          "cost": 74112,
          "unitCost": 0.1,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 4.16,
          "cost": 65573908,
          "unitCost": 15.768,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 58.72,
          "cost": 342423465,
          "unitCost": 5.8311,
          "color": "#a855f7"
        },
        {
          "name": "HSD",
          "gen": 0,
          "cost": 0,
          "unitCost": null,
          "color": "#ef4444"
        },
        {
          "name": "Wind",
          "gen": 0.1,
          "cost": 1426281,
          "unitCost": 14.71,
          "color": "#22c55e"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 21.57,
          "peakFlow": 892,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 33.43,
          "peakFlow": 1472,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.72,
          "peakFlow": 160,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 3,
          "demand": 5022,
          "pct": 0.06
        },
        {
          "zone": "Chattogram",
          "loadShed": 0,
          "demand": 1371,
          "pct": 0
        },
        {
          "zone": "Khulna",
          "loadShed": 33,
          "demand": 1907,
          "pct": 1.73
        },
        {
          "zone": "Rajshahi",
          "loadShed": 0,
          "demand": 1558,
          "pct": 0
        },
        {
          "zone": "Cumilla",
          "loadShed": 0,
          "demand": 1382,
          "pct": 0
        },
        {
          "zone": "Mymensingh",
          "loadShed": 347,
          "demand": 1319,
          "pct": 26.31
        },
        {
          "zone": "Sylhet",
          "loadShed": 0,
          "demand": 631,
          "pct": 0
        },
        {
          "zone": "Barishal",
          "loadShed": 0,
          "demand": 512,
          "pct": 0
        },
        {
          "zone": "Rangpur",
          "loadShed": 16,
          "demand": 1009,
          "pct": 1.59
        }
      ],
      "dailyOutages": [
        {
          "time": "08:01 - 12:29",
          "plant": "Siddhirganj 132/33kV S/S T-1 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33 kV Vacuum Integrity Test",
          "full_desc": "Siddhirganj 132/33kV S/S T-1 HT Scheduled S/D Due to 33 kV Vacuum Integrity Test"
        },
        {
          "time": "08:01 - 12:30",
          "plant": "Siddhirganj 132/33kV S/S T-1 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33 kV Vacuum Integrity Test.",
          "full_desc": "Siddhirganj 132/33kV S/S T-1 LT Scheduled S/D Due to 33 kV Vacuum Integrity Test."
        },
        {
          "time": "08:19 - 17:48",
          "plant": "Maijdee 132/33kV S/S Chowmuhoni-Maijdee ckt -02 Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Due to Project Work at Chowmuhoni 230/132/33 KV Grid Substation.",
          "full_desc": "Maijdee 132/33kV S/S Chowmuhoni-Maijdee ckt -02 Project Work S/D Due to Due to Project Work at Chowmuhoni 230/132/33 KV Grid Substation."
        },
        {
          "time": "08:20 - 17:47",
          "plant": "Chowmuhani 230/132/33kV S/S Maijdee-02 Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Building Outside Painting.",
          "full_desc": "Chowmuhani 230/132/33kV S/S Maijdee-02 Project Work S/D Due to Building Outside Painting."
        },
        {
          "time": "08:54",
          "plant": "Rangpur-Rangpur Confidence(100MW)  132kV Ckt-2 Project Work",
          "load": "100MW",
          "reason": "Due to CT and Breaker change from 12/06/2026 to 15/06/2026",
          "full_desc": "Rangpur-Rangpur Confidence(100MW)  132kV Ckt-2 Project Work S/D from Rangpur 132/33kV end Due to CT and Breaker change from 12/06/2026 to 15/06/2026"
        },
        {
          "time": "09:27",
          "plant": "Chandraghona 132/33kV S/S TR-01(406T) LT",
          "load": "HT Outage",
          "reason": "Chandraghona 132/33kV S/S TR-01(406T) LT is restored.",
          "full_desc": "Chandraghona 132/33kV S/S TR-01(406T) LT is restored."
        },
        {
          "time": "09:27",
          "plant": "Chandraghona 132/33kV S/S TR-01(406T) HT",
          "load": "HT Outage",
          "reason": "Chandraghona 132/33kV S/S TR-01(406T) HT is restored.",
          "full_desc": "Chandraghona 132/33kV S/S TR-01(406T) HT is restored."
        },
        {
          "time": "10:38",
          "plant": "Tangail 132/33kV S/S Tr-2 HT",
          "load": "HT Outage",
          "reason": "Tangail 132/33kV S/S Tr-2 HT is restored.",
          "full_desc": "Tangail 132/33kV S/S Tr-2 HT is restored."
        },
        {
          "time": "10:56",
          "plant": "Tangail 132/33kV S/S Tr-2 LT",
          "load": "HT Outage",
          "reason": "Tangail 132/33kV S/S Tr-2 LT is restored.",
          "full_desc": "Tangail 132/33kV S/S Tr-2 LT is restored."
        },
        {
          "time": "12:21",
          "plant": "BSRM 230/33kV S/S 230/33 kV Transformer-1 (125/140 MVA) HT",
          "load": "HT Outage",
          "reason": "BSRM 230/33kV S/S 230/33 kV Transformer-1 (125/140 MVA) HT is restored.",
          "full_desc": "BSRM 230/33kV S/S 230/33 kV Transformer-1 (125/140 MVA) HT is restored."
        },
        {
          "time": "12:22",
          "plant": "BSRM 230/33kV S/S 230/33 kV Transformer-2 (125/140 MVA) HT",
          "load": "HT Outage",
          "reason": "BSRM 230/33kV S/S 230/33 kV Transformer-2 (125/140 MVA) HT is restored.",
          "full_desc": "BSRM 230/33kV S/S 230/33 kV Transformer-2 (125/140 MVA) HT is restored."
        },
        {
          "time": "12:23",
          "plant": "BSRM 230/33kV S/S 230/33 kV Transformer-3 (125/140 MVA) HT",
          "load": "HT Outage",
          "reason": "BSRM 230/33kV S/S 230/33 kV Transformer-3 (125/140 MVA) HT is restored.",
          "full_desc": "BSRM 230/33kV S/S 230/33 kV Transformer-3 (125/140 MVA) HT is restored."
        },
        {
          "time": "12:54 - 14:21",
          "plant": "BSRM 230/33kV S/S 230/33 kV Transformer-1 (125/140 MVA) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to BPDB Meter change",
          "full_desc": "BSRM 230/33kV S/S 230/33 kV Transformer-1 (125/140 MVA) HT Scheduled S/D Due to BPDB Meter change"
        },
        {
          "time": "12:55 - 14:22",
          "plant": "BSRM 230/33kV S/S 230/33 kV Transformer-2 (125/140 MVA) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to BPDB Meter change",
          "full_desc": "BSRM 230/33kV S/S 230/33 kV Transformer-2 (125/140 MVA) HT Scheduled S/D Due to BPDB Meter change"
        },
        {
          "time": "12:56 - 14:23",
          "plant": "BSRM 230/33kV S/S 230/33 kV Transformer-3 (125/140 MVA) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to BPDB Meter change",
          "full_desc": "BSRM 230/33kV S/S 230/33 kV Transformer-3 (125/140 MVA) HT Scheduled S/D Due to BPDB Meter change"
        },
        {
          "time": "13:33",
          "plant": "Bhola Notun Bidyut CCPP GT-11",
          "load": "HT Outage",
          "reason": "Bhola Notun Bidyut CCPP GT-11 was sync.",
          "full_desc": "Bhola Notun Bidyut CCPP GT-11 was sync."
        },
        {
          "time": "13:33",
          "plant": "Bhola Nutan Biddut BD LTD Synchronized with remarks:- GT-11",
          "load": "HT Outage",
          "reason": "Bhola Nutan Biddut BD LTD Synchronized with remarks:- GT-11",
          "full_desc": "Bhola Nutan Biddut BD LTD Synchronized with remarks:- GT-11"
        },
        {
          "time": "14:05",
          "plant": "Daganbhuiyan 132/33kV S/S Transformer-2 LT",
          "load": "HT Outage",
          "reason": "Daganbhuiyan 132/33kV S/S Transformer-2 LT is restored.",
          "full_desc": "Daganbhuiyan 132/33kV S/S Transformer-2 LT is restored."
        },
        {
          "time": "14:05",
          "plant": "Daganbhuiyan 132/33kV S/S Transformer-2 HT",
          "load": "HT Outage",
          "reason": "Daganbhuiyan 132/33kV S/S Transformer-2 HT is restored.",
          "full_desc": "Daganbhuiyan 132/33kV S/S Transformer-2 HT is restored."
        },
        {
          "time": "14:08 - 14:13",
          "plant": "Chowmuhani 230/132/33kV S/S TR1-415T LT Tripped showing instantaneous relays",
          "load": "54.0MW",
          "reason": "Due to Beg-2 33 kv feeder E/F, O/C tripped.",
          "full_desc": "Chowmuhani 230/132/33kV S/S TR1-415T LT Tripped showing instantaneous relays Due to Beg-2 33 kv feeder E/F, O/C tripped."
        },
        {
          "time": "17:33 - 19:58",
          "plant": "Brahmanbaria 132/33kV S/S 401T HT Tripped showing Main Pressure relife",
          "load": "50.0MW",
          "reason": "Brahmanbaria 132/33kV S/S 401T HT Tripped showing Main Pressure relife tripped relays.",
          "full_desc": "Brahmanbaria 132/33kV S/S 401T HT Tripped showing Main Pressure relife tripped relays."
        },
        {
          "time": "17:38",
          "plant": "Mymensingh RPCL-Tangail  132kV Ckt-1",
          "load": "HT Outage",
          "reason": "Mymensingh RPCL-Tangail  132kV Ckt-1 is restored.",
          "full_desc": "Mymensingh RPCL-Tangail  132kV Ckt-1 is restored."
        },
        {
          "time": "20:55 - 22:18",
          "plant": "Srinagar 132/33kV S/S Tr-01 LT Scheduled S/D",
          "load": "20.0MW",
          "reason": "Due to Red Hot Maintenance at 33kv side.",
          "full_desc": "Srinagar 132/33kV S/S Tr-01 LT Scheduled S/D Due to Red Hot Maintenance at 33kv side."
        },
        {
          "time": "20:56 - 22:17",
          "plant": "Srinagar 132/33kV S/S Tr-01 HT Scheduled S/D",
          "load": "20.0MW",
          "reason": "Due to Red Hot Maintenance at 33kv side.",
          "full_desc": "Srinagar 132/33kV S/S Tr-01 HT Scheduled S/D Due to Red Hot Maintenance at 33kv side."
        },
        {
          "time": "21:09 - 21:16",
          "plant": "Chowmuhani 230/132/33kV S/S TR1-415T LT Tripped showing Earth Fault INST. relays",
          "load": "40.0MW",
          "reason": "Due to 33 kV feeder Beg-2 O/C, E/F .",
          "full_desc": "Chowmuhani 230/132/33kV S/S TR1-415T LT Tripped showing Earth Fault INST. relays Due to 33 kV feeder Beg-2 O/C, E/F ."
        },
        {
          "time": "21:58",
          "plant": "BIPTC S/S 20DF23 Tripped showing 87.1 Differential Relay relays",
          "load": "HT Outage",
          "reason": "Due to C1 Unbalance 60/61 instant L2 Trip",
          "full_desc": "BIPTC S/S 20DF23 Tripped showing 87.1 Differential Relay relays Due to C1 Unbalance 60/61 instant L2 Trip"
        },
        {
          "time": "22:22 - 00:55",
          "plant": "Chowmuhani 230/132/33kV S/S TR2-425T LT Forced S/D",
          "load": "20.0MW",
          "reason": "Due to 33 KV L-Bus Red Hot Maintenance",
          "full_desc": "Chowmuhani 230/132/33kV S/S TR2-425T LT Forced S/D Due to 33 KV L-Bus Red Hot Maintenance"
        },
        {
          "time": "23:42",
          "plant": "Bhola Nutan Biddut BD LTD ST Synchronized with remarks:- None",
          "load": "HT Outage",
          "reason": "Bhola Nutan Biddut BD LTD ST Synchronized with remarks:- None",
          "full_desc": "Bhola Nutan Biddut BD LTD ST Synchronized with remarks:- None"
        },
        {
          "time": "00:29 - 04:19",
          "plant": "Lalmonirhat-Rangpur 132 kV Ckt-2 Forced",
          "load": "HT Outage",
          "reason": "Due to Due to Temperature rise",
          "full_desc": "Lalmonirhat-Rangpur 132 kV Ckt-2 Forced S/D from Rangpur 132/33kV end Due to Due to Temperature rise"
        },
        {
          "time": "00:38 - 01:57",
          "plant": "Rangpur 132/33kV S/S T-1(414T) LT Tripped showing No relay operated. relays",
          "load": "50.0MW",
          "reason": "Due to T-1 132 KV PRD trip",
          "full_desc": "Rangpur 132/33kV S/S T-1(414T) LT Tripped showing No relay operated. relays Due to T-1 132 KV PRD trip"
        },
        {
          "time": "00:38 - 01:55",
          "plant": "Rangpur 132/33kV S/S T-1(414T) HT Tripped showing Lock out (86) relay relays",
          "load": "50.0MW",
          "reason": "Due to Due to PRD Trip",
          "full_desc": "Rangpur 132/33kV S/S T-1(414T) HT Tripped showing Lock out (86) relay relays Due to Due to PRD Trip"
        },
        {
          "time": "06:07",
          "plant": "Bheramara P/S-Kustia 132 kV Ckt-1 Project Work",
          "load": "HT Outage",
          "reason": "Due to Kushtia Grid maintenance",
          "full_desc": "Bheramara P/S-Kustia 132 kV Ckt-1 Project Work S/D from Kushtia 132/33kV end. and from Bheramara 230/132kV end Due to Kushtia Grid maintenance"
        },
        {
          "time": "06:12",
          "plant": "Haripur 230/132kV S/S 132kV Main Bus Sec-1 Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to EGCB Bay Jack Bus Changing Work.",
          "full_desc": "Haripur 230/132kV S/S 132kV Main Bus Sec-1 Scheduled S/D Due to EGCB Bay Jack Bus Changing Work."
        },
        {
          "time": "06:18",
          "plant": "Barishal 230/132kV S/S T-5 HT Scheduled S/D",
          "load": "60.0MW",
          "reason": "Due to Replacement of source DS of 33 kV Nobogram Feeder by Jhalokathi PBS.",
          "full_desc": "Barishal 230/132kV S/S T-5 HT Scheduled S/D Due to Replacement of source DS of 33 kV Nobogram Feeder by Jhalokathi PBS."
        },
        {
          "time": "06:18",
          "plant": "Barishal 230/132kV S/S T-5 LT Scheduled S/D",
          "load": "60.0MW",
          "reason": "Due to Replacement of source DS of 33 kV Nobogram Feeder by Jhalokathi PBS.",
          "full_desc": "Barishal 230/132kV S/S T-5 LT Scheduled S/D Due to Replacement of source DS of 33 kV Nobogram Feeder by Jhalokathi PBS."
        },
        {
          "time": "06:23",
          "plant": "Haripur 230/132kV S/S EGCB 412MW Scheduled S/D",
          "load": "412MW",
          "reason": "Due to Jack bus loop change.",
          "full_desc": "Haripur 230/132kV S/S EGCB 412MW Scheduled S/D Due to Jack bus loop change."
        },
        {
          "time": "06:31",
          "plant": "Ghorasal-Joydeb-B   132kV Ckt-2 Scheduled",
          "load": "HT Outage",
          "reason": "Ghorasal-Joydeb-B   132kV Ckt-2 Scheduled S/D from Joydebpur 132/33kV end.",
          "full_desc": "Ghorasal-Joydeb-B   132kV Ckt-2 Scheduled S/D from Joydebpur 132/33kV end."
        },
        {
          "time": "06:31",
          "plant": "Ghorasal-Joydeb-B   132kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "Ghorasal-Joydeb-B   132kV Ckt-1 Scheduled S/D from Joydebpur 132/33kV end.",
          "full_desc": "Ghorasal-Joydeb-B   132kV Ckt-1 Scheduled S/D from Joydebpur 132/33kV end."
        }
      ],
      "hourlyLoadData": [
        {
          "time": "00:00",
          "generation": 14654.76,
          "loadShed": 525,
          "demand": 15203.39
        },
        {
          "time": "01:00",
          "generation": 14393.26,
          "loadShed": 385,
          "demand": 14795.59
        },
        {
          "time": "02:00",
          "generation": 14212.9,
          "loadShed": 279,
          "demand": 14504.46
        },
        {
          "time": "03:00",
          "generation": 13729.2,
          "loadShed": 188,
          "demand": 13925.66
        },
        {
          "time": "04:00",
          "generation": 13341.2,
          "loadShed": 183,
          "demand": 13532.44
        },
        {
          "time": "05:00",
          "generation": 12971,
          "loadShed": 148,
          "demand": 13125.66
        },
        {
          "time": "06:00",
          "generation": 12449.01,
          "loadShed": 191,
          "demand": 12648.61
        },
        {
          "time": "07:00",
          "generation": 12403.85,
          "loadShed": 146,
          "demand": 12556.85
        },
        {
          "time": "08:00",
          "generation": 12248.97,
          "loadShed": 131,
          "demand": 12385.97
        },
        {
          "time": "09:00",
          "generation": 12407.35,
          "loadShed": 121,
          "demand": 12533.8
        },
        {
          "time": "10:00",
          "generation": 12540.05,
          "loadShed": 141,
          "demand": 12687.05
        },
        {
          "time": "11:00",
          "generation": 12684.35,
          "loadShed": 156,
          "demand": 12847.35
        },
        {
          "time": "12:00",
          "generation": 13213.87,
          "loadShed": 144,
          "demand": 13363.87
        },
        {
          "time": "13:00",
          "generation": 14069.32,
          "loadShed": 25,
          "demand": 14095.32
        },
        {
          "time": "14:00",
          "generation": 13329.25,
          "loadShed": 60,
          "demand": 13392.25
        },
        {
          "time": "15:00",
          "generation": 13361.59,
          "loadShed": 101,
          "demand": 13467.59
        },
        {
          "time": "16:00",
          "generation": 12917.76,
          "loadShed": 102,
          "demand": 13024.76
        },
        {
          "time": "17:00",
          "generation": 12341.82,
          "loadShed": 107,
          "demand": 12453.82
        },
        {
          "time": "18:00",
          "generation": 12146.92,
          "loadShed": 112,
          "demand": 12263.92
        },
        {
          "time": "19:00",
          "generation": 13279,
          "loadShed": 168,
          "demand": 13455
        },
        {
          "time": "19:30",
          "generation": 14426.9,
          "loadShed": 175,
          "demand": 14609.9
        },
        {
          "time": "20:00",
          "generation": 14504.9,
          "loadShed": 392,
          "demand": 14914.9
        },
        {
          "time": "21:00",
          "generation": 15007.4,
          "loadShed": 399,
          "demand": 15424.4
        },
        {
          "time": "22:00",
          "generation": 14770.9,
          "loadShed": 845,
          "demand": 15653.9
        },
        {
          "time": "23:00",
          "generation": 14619.9,
          "loadShed": 938,
          "demand": 15599.9
        }
      ],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 468.9,
          "condensate": 333.9,
          "share": 18
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 139.9,
          "condensate": 644,
          "share": 5.4
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 86.5,
          "condensate": 56.2,
          "share": 3.3
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 916.6,
          "condensate": 5007.1,
          "share": 35.2
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31.7,
          "condensate": 94,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 962.7,
          "condensate": 25,
          "share": 36.9
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 232,
          "fertilizer": 73.2,
          "others": 1035.9,
          "total": 1341.1
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 212.3,
          "fertilizer": 0,
          "others": 84.3,
          "total": 296.6
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 38.4,
          "fertilizer": 39.4,
          "others": 156.6,
          "total": 234.4
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 221.2,
          "fertilizer": 39.9,
          "others": 108.5,
          "total": 369.6
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 125.6,
          "fertilizer": 0,
          "others": 26.2,
          "total": 151.8
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 49.5,
          "fertilizer": 0,
          "others": 3.8,
          "total": 53.3
        }
      ]
    },
  "2026-06-13": {
      "systemStats": {
        "date": "13 Jun 2026",
        "dayPeakGen": 13863.2,
        "eveningPeakGen": 15031.7,
        "dayPeakDemand": 14165.2,
        "eveningPeakDemand": 16615.7,
        "minGen": 12690.61,
        "maxGen": 15031.7,
        "totalEnergyGen": 336.66728428,
        "totalEnergyUnserved": 14.75,
        "totalEnergyDemand": 351.417,
        "maxTemp": 34,
        "totalGasSuppliedPower": 865.6,
        "avgProductionCost": 6.851,
        "totalDailyCost": 2306544087
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 119.39,
          "cost": 417370032,
          "unitCost": 3.4957,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 109.17,
          "cost": 728497061,
          "unitCost": 6.6731,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 41.99,
          "cost": 732384105,
          "unitCost": 17.4407,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 0.76,
          "cost": 76098,
          "unitCost": 0.1,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 4.4,
          "cost": 69067173,
          "unitCost": 15.6996,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 60.76,
          "cost": 356311174,
          "unitCost": 5.8645,
          "color": "#a855f7"
        },
        {
          "name": "HSD",
          "gen": 0,
          "cost": 0,
          "unitCost": null,
          "color": "#ef4444"
        },
        {
          "name": "Wind",
          "gen": 0.19,
          "cost": 2838441,
          "unitCost": 14.71,
          "color": "#22c55e"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 21.58,
          "peakFlow": 893,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 35.46,
          "peakFlow": 1480,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.72,
          "peakFlow": 154,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 220,
          "demand": 5635,
          "pct": 3.9
        },
        {
          "zone": "Chattogram",
          "loadShed": 23,
          "demand": 1475,
          "pct": 1.56
        },
        {
          "zone": "Khulna",
          "loadShed": 280,
          "demand": 2020,
          "pct": 13.86
        },
        {
          "zone": "Rajshahi",
          "loadShed": 124,
          "demand": 1553,
          "pct": 7.98
        },
        {
          "zone": "Cumilla",
          "loadShed": 197,
          "demand": 1580,
          "pct": 12.47
        },
        {
          "zone": "Mymensingh",
          "loadShed": 269,
          "demand": 1318,
          "pct": 20.41
        },
        {
          "zone": "Sylhet",
          "loadShed": 102,
          "demand": 690,
          "pct": 14.78
        },
        {
          "zone": "Barishal",
          "loadShed": 130,
          "demand": 560,
          "pct": 23.21
        },
        {
          "zone": "Rangpur",
          "loadShed": 171,
          "demand": 1116,
          "pct": 15.32
        }
      ],
      "dailyOutages": [
        {
          "time": "08:30",
          "plant": "Bhaluka 132/33kV S/S 01. Transformer- 01 HT",
          "load": "HT Outage",
          "reason": "Bhaluka 132/33kV S/S 01. Transformer- 01 HT is restored.",
          "full_desc": "Bhaluka 132/33kV S/S 01. Transformer- 01 HT is restored."
        },
        {
          "time": "08:30",
          "plant": "Bhaluka 132/33kV S/S 02. Transformer- 02 LT",
          "load": "HT Outage",
          "reason": "Bhaluka 132/33kV S/S 02. Transformer- 02 LT is restored.",
          "full_desc": "Bhaluka 132/33kV S/S 02. Transformer- 02 LT is restored."
        },
        {
          "time": "08:41 - 11:06",
          "plant": "Gopalganj 132/33kV S/S Transformer-03 LT Forced S/D",
          "load": "17.0MW",
          "reason": "Due to Bus D's maintenance of Bpbs-1",
          "full_desc": "Gopalganj 132/33kV S/S Transformer-03 LT Forced S/D Due to Bus D's maintenance of Bpbs-1"
        },
        {
          "time": "08:42 - 11:05",
          "plant": "Gopalganj 132/33kV S/S Transformer-03 HT Forced S/D",
          "load": "17.0MW",
          "reason": "Due to Bus D's maintenance of Bpbs-1",
          "full_desc": "Gopalganj 132/33kV S/S Transformer-03 HT Forced S/D Due to Bus D's maintenance of Bpbs-1"
        },
        {
          "time": "08:55",
          "plant": "Barishal 230/132kV S/S T-5 HT",
          "load": "HT Outage",
          "reason": "Barishal 230/132kV S/S T-5 HT is restored.",
          "full_desc": "Barishal 230/132kV S/S T-5 HT is restored."
        },
        {
          "time": "08:57",
          "plant": "Barishal 230/132kV S/S T-5 LT",
          "load": "HT Outage",
          "reason": "Barishal 230/132kV S/S T-5 LT is restored.",
          "full_desc": "Barishal 230/132kV S/S T-5 LT is restored."
        },
        {
          "time": "09:27 - 16:42",
          "plant": "Mymensingh RPCL-Tangail  132kV Ckt-1 Project Work",
          "load": "HT Outage",
          "reason": "Due to Work by RPCL",
          "full_desc": "Mymensingh RPCL-Tangail  132kV Ckt-1 Project Work S/D from Muktagacha 132/33kV end Due to Work by RPCL"
        },
        {
          "time": "11:08 - 13:15",
          "plant": "Bhaluka 132/33kV S/S 02. Transformer- 02 HT Scheduled S/D",
          "load": "30.0MW",
          "reason": "Bhaluka 132/33kV S/S 02. Transformer- 02 HT Scheduled S/D",
          "full_desc": "Bhaluka 132/33kV S/S 02. Transformer- 02 HT Scheduled S/D"
        },
        {
          "time": "11:10 - 17:23",
          "plant": "Feni 230/132kV S/S ATR-3 LT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Training work",
          "full_desc": "Feni 230/132kV S/S ATR-3 LT Project Work S/D Due to Training work"
        },
        {
          "time": "11:12 - 17:22",
          "plant": "Feni 230/132kV S/S ATR-3 HT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Training work",
          "full_desc": "Feni 230/132kV S/S ATR-3 HT Project Work S/D Due to Training work"
        },
        {
          "time": "11:15 - 15:39",
          "plant": "Amnura 132/33kV S/S T-1 (406T) LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Maintenance in LT Bushing, Clearance, ALDC, Bogura.",
          "full_desc": "Amnura 132/33kV S/S T-1 (406T) LT Scheduled S/D Due to Maintenance in LT Bushing, Clearance, ALDC, Bogura."
        },
        {
          "time": "11:16 - 15:39",
          "plant": "Amnura 132/33kV S/S T-1 (406T) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Maintenance in LT Bushing, Clearance, ALDC, Bogura.",
          "full_desc": "Amnura 132/33kV S/S T-1 (406T) HT Scheduled S/D Due to Maintenance in LT Bushing, Clearance, ALDC, Bogura."
        },
        {
          "time": "11:19 - 13:25",
          "plant": "Gopalganj (O) - Gopalgan (N) Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "for  CT maintenance at their end",
          "full_desc": "Gopalganj (O) - Gopalgan (N) Ckt-1 Forced S/D from Gopalganj 132/33kV end Due to CT Y-phase unusual sound trouble and from Gopalganj 400/132kV end Due to Gopalganj 132 KV SS has taken S/D for  CT maintenance at their end"
        },
        {
          "time": "12:43",
          "plant": "Tongi 230/132/33kV S/S Tongi-Tongi 80 MW PS Forced S/D",
          "load": "80 MW",
          "reason": "Tongi 230/132/33kV S/S Tongi-Tongi 80 MW PS Forced S/D",
          "full_desc": "Tongi 230/132/33kV S/S Tongi-Tongi 80 MW PS Forced S/D"
        },
        {
          "time": "12:57",
          "plant": "Ghorasal-Joydeb-B   132kV Ckt-1",
          "load": "HT Outage",
          "reason": "Ghorasal-Joydeb-B   132kV Ckt-1 is restored.",
          "full_desc": "Ghorasal-Joydeb-B   132kV Ckt-1 is restored."
        },
        {
          "time": "12:58",
          "plant": "Ghorasal-Joydeb-B   132kV Ckt-2",
          "load": "HT Outage",
          "reason": "Ghorasal-Joydeb-B   132kV Ckt-2 is restored.",
          "full_desc": "Ghorasal-Joydeb-B   132kV Ckt-2 is restored."
        },
        {
          "time": "13:23 - 13:33",
          "plant": "Khulna (S)-Satkhira 132kV Ckt-1 Tripped from Khulna(S) 230/132kV end showing Distance relay relays. and from Satkhira 132/33kV end showing O/C & E/F and Distance relay. relays",
          "load": "HT Outage",
          "reason": "Due to Phase-c Earth fault.",
          "full_desc": "Khulna (S)-Satkhira 132kV Ckt-1 Tripped from Khulna(S) 230/132kV end showing Distance relay relays. and from Satkhira 132/33kV end showing O/C & E/F and Distance relay. relays Due to Phase-c Earth fault."
        },
        {
          "time": "14:21",
          "plant": "Satkhira 132/33kV S/S Transformer-3(T-3) LT Tripped showing Digfferential &,over current, earth fault relays.",
          "load": "HT Outage",
          "reason": "Satkhira 132/33kV S/S Transformer-3(T-3) LT Tripped showing Digfferential &,over current, earth fault relays.",
          "full_desc": "Satkhira 132/33kV S/S Transformer-3(T-3) LT Tripped showing Digfferential &,over current, earth fault relays."
        },
        {
          "time": "14:21",
          "plant": "Satkhira 132/33kV S/S Transformer-3(T-3) HT Tripped showing differential & overcurrent,earth fault. relays",
          "load": "HT Outage",
          "reason": "Due to differential & overcurrent,earth fault. .",
          "full_desc": "Satkhira 132/33kV S/S Transformer-3(T-3) HT Tripped showing differential & overcurrent,earth fault. relays Due to differential & overcurrent,earth fault. ."
        },
        {
          "time": "15:02 - 18:38",
          "plant": "Shahjibazar 132/33kV S/S TR-04 LT Scheduled S/D",
          "load": "60.0MW",
          "reason": "Due to To connect new TR-06 transformer to the 33 kv bus",
          "full_desc": "Shahjibazar 132/33kV S/S TR-04 LT Scheduled S/D Due to To connect new TR-06 transformer to the 33 kv bus"
        },
        {
          "time": "15:03 - 18:36",
          "plant": "Shahjibazar 132/33kV S/S TR-04 HT Scheduled S/D",
          "load": "60.0MW",
          "reason": "Due to To connect new TR-06 transformer to the 33 kv bus",
          "full_desc": "Shahjibazar 132/33kV S/S TR-04 HT Scheduled S/D Due to To connect new TR-06 transformer to the 33 kv bus"
        },
        {
          "time": "20:05",
          "plant": "Shahjibazar 330 MW CCPP tripped.",
          "load": "330 MW",
          "reason": "Shahjibazar 330 MW CCPP tripped.",
          "full_desc": "Shahjibazar 330 MW CCPP tripped."
        },
        {
          "time": "20:06",
          "plant": "Shahjibazar 132/33kV S/S TR-06 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to To connect  33kv cable with Transformer",
          "full_desc": "Shahjibazar 132/33kV S/S TR-06 HT Scheduled S/D Due to To connect  33kv cable with Transformer"
        },
        {
          "time": "20:33",
          "plant": "Bheramara P/S-Kustia 132 kV Ckt-1",
          "load": "HT Outage",
          "reason": "Bheramara P/S-Kustia 132 kV Ckt-1 is restored.",
          "full_desc": "Bheramara P/S-Kustia 132 kV Ckt-1 is restored."
        },
        {
          "time": "02:15 - 03:00",
          "plant": "Jaldhaka 132/33kV S/S 416T-2 LT Tripped showing Over Current Protection P142 relays.",
          "load": "20.0MW",
          "reason": "Jaldhaka 132/33kV S/S 416T-2 LT Tripped showing Over Current Protection P142 relays.",
          "full_desc": "Jaldhaka 132/33kV S/S 416T-2 LT Tripped showing Over Current Protection P142 relays."
        },
        {
          "time": "02:15 - 02:59",
          "plant": "Jaldhaka 132/33kV S/S 406T-1 LT Tripped showing Over Current Protection P142 relays.",
          "load": "20.0MW",
          "reason": "Jaldhaka 132/33kV S/S 406T-1 LT Tripped showing Over Current Protection P142 relays.",
          "full_desc": "Jaldhaka 132/33kV S/S 406T-1 LT Tripped showing Over Current Protection P142 relays."
        },
        {
          "time": "05:40 - 06:10",
          "plant": "Chattak-Sunamganj 132 kV Ckt-1 Tripped from Sunamganj 132/33kV end showing REL670 relays",
          "load": "5.0MW",
          "reason": "Due to Rainy weather",
          "full_desc": "Chattak-Sunamganj 132 kV Ckt-1 Tripped from Sunamganj 132/33kV end showing REL670 relays Due to Rainy weather"
        },
        {
          "time": "05:40 - 05:59",
          "plant": "Chattak-Sylhet 132 kV Ckt-2 Tripped from Sylhet 132/33kV end showing SOTF, relays.",
          "load": "19.0MW",
          "reason": "Chattak-Sylhet 132 kV Ckt-2 Tripped from Sylhet 132/33kV end showing SOTF, relays.",
          "full_desc": "Chattak-Sylhet 132 kV Ckt-2 Tripped from Sylhet 132/33kV end showing SOTF, relays."
        },
        {
          "time": "05:56 - 06:40",
          "plant": "Kalurghat 132/33kV S/S TRFO-02(516T) LT Tripped showing 33 kv REF 615 Relay relays",
          "load": "10.0MW",
          "reason": "Due to Due to PDB 33kV Feeder-3 ( PDB grid incomer-3) <br> Showing Earth fault & Over current trip.",
          "full_desc": "Kalurghat 132/33kV S/S TRFO-02(516T) LT Tripped showing 33 kv REF 615 Relay relays Due to Due to PDB 33kV Feeder-3 ( PDB grid incomer-3) <br> Showing Earth fault & Over current trip."
        },
        {
          "time": "06:07",
          "plant": "Rangpur 132/33kV S/S T-2 (404T) LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Red hot Maintenance work",
          "full_desc": "Rangpur 132/33kV S/S T-2 (404T) LT Scheduled S/D Due to Red hot Maintenance work"
        },
        {
          "time": "06:08",
          "plant": "Rangpur 132/33kV S/S T-2 (404T) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Red hot Maintenance work",
          "full_desc": "Rangpur 132/33kV S/S T-2 (404T) HT Scheduled S/D Due to Red hot Maintenance work"
        },
        {
          "time": "06:16",
          "plant": "Mymensingh 132/33kV S/S Transformer-3 (424T) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Mymensingh 132/33kV S/S Transformer-3 (424T) HT Scheduled S/D",
          "full_desc": "Mymensingh 132/33kV S/S Transformer-3 (424T) HT Scheduled S/D"
        },
        {
          "time": "06:16",
          "plant": "Mymensingh 132/33kV S/S Transformer-3 (424T) LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Mymensingh 132/33kV S/S Transformer-3 (424T) LT Scheduled S/D",
          "full_desc": "Mymensingh 132/33kV S/S Transformer-3 (424T) LT Scheduled S/D"
        }
      ],
      "hourlyLoadData": [
        {
          "time": "00:00",
          "generation": 14462.9,
          "loadShed": 1347,
          "demand": 15870.52
        },
        {
          "time": "01:00",
          "generation": 14259.32,
          "loadShed": 1056,
          "demand": 15362.84
        },
        {
          "time": "02:00",
          "generation": 14113.9,
          "loadShed": 1012,
          "demand": 15171.9
        },
        {
          "time": "03:00",
          "generation": 13884.9,
          "loadShed": 929,
          "demand": 14855.9
        },
        {
          "time": "04:00",
          "generation": 13670.4,
          "loadShed": 508,
          "demand": 14201.4
        },
        {
          "time": "05:00",
          "generation": 13345.2,
          "loadShed": 152,
          "demand": 13504.2
        },
        {
          "time": "06:00",
          "generation": 12690.61,
          "loadShed": 143,
          "demand": 12839.61
        },
        {
          "time": "07:00",
          "generation": 12871.54,
          "loadShed": 188,
          "demand": 13067.54
        },
        {
          "time": "08:00",
          "generation": 12741.2,
          "loadShed": 178,
          "demand": 12927.2
        },
        {
          "time": "09:00",
          "generation": 12947.14,
          "loadShed": 142,
          "demand": 13095.14
        },
        {
          "time": "10:00",
          "generation": 13109.92,
          "loadShed": 73,
          "demand": 13185.92
        },
        {
          "time": "11:00",
          "generation": 13388.89,
          "loadShed": 134,
          "demand": 13528.92
        },
        {
          "time": "12:00",
          "generation": 13863.2,
          "loadShed": 289,
          "demand": 14165.2
        },
        {
          "time": "13:00",
          "generation": 14164.45,
          "loadShed": 401,
          "demand": 14583.45
        },
        {
          "time": "14:00",
          "generation": 14146.6,
          "loadShed": 425,
          "demand": 14590.6
        },
        {
          "time": "15:00",
          "generation": 14161.97,
          "loadShed": 463,
          "demand": 14645.97
        },
        {
          "time": "16:00",
          "generation": 13987.02,
          "loadShed": 372,
          "demand": 14376.02
        },
        {
          "time": "17:00",
          "generation": 13711.05,
          "loadShed": 175,
          "demand": 13894.05
        },
        {
          "time": "18:00",
          "generation": 13585.18,
          "loadShed": 126,
          "demand": 13716.85
        },
        {
          "time": "19:00",
          "generation": 14520.7,
          "loadShed": 1053,
          "demand": 15620.7
        },
        {
          "time": "19:30",
          "generation": 14727.7,
          "loadShed": 1249,
          "demand": 16032.7
        },
        {
          "time": "20:00",
          "generation": 14914.7,
          "loadShed": 1175,
          "demand": 16142.7
        },
        {
          "time": "21:00",
          "generation": 15031.7,
          "loadShed": 1516,
          "demand": 16615.7
        },
        {
          "time": "22:00",
          "generation": 14888.7,
          "loadShed": 1221,
          "demand": 16164.7
        },
        {
          "time": "23:00",
          "generation": 14829.7,
          "loadShed": 1672,
          "demand": 16576.7
        }
      ],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 468.4,
          "condensate": 344,
          "share": 17.9
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 140.2,
          "condensate": 642.2,
          "share": 5.3
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 93.2,
          "condensate": 61.3,
          "share": 3.6
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 915.9,
          "condensate": 4897.6,
          "share": 34.9
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31.7,
          "condensate": 95,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 972.1,
          "condensate": 25.2,
          "share": 37.1
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 234,
          "fertilizer": 73.2,
          "others": 1067.6,
          "total": 1374.8
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 197.3,
          "fertilizer": 0,
          "others": 88.1,
          "total": 285.4
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 38.2,
          "fertilizer": 40.9,
          "others": 171.8,
          "total": 250.9
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 221.1,
          "fertilizer": 40.1,
          "others": 110.3,
          "total": 371.5
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 127.4,
          "fertilizer": 0,
          "others": 29.3,
          "total": 156.7
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 54.1,
          "fertilizer": 0,
          "others": 4.3,
          "total": 58.4
        }
      ]
    },
  "2026-06-14": {
      "systemStats": {
        "date": "14 Jun 2026",
        "dayPeakGen": 14136.76,
        "eveningPeakGen": 15047.9,
        "dayPeakDemand": null,
        "eveningPeakDemand": 17189.9,
        "minGen": null,
        "maxGen": null,
        "totalEnergyGen": 344.73415076,
        "totalEnergyUnserved": null,
        "totalEnergyDemand": null,
        "maxTemp": null,
        "totalGasSuppliedPower": 880.63,
        "avgProductionCost": 6.89,
        "totalDailyCost": 2375193889
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 119.4,
          "cost": null,
          "unitCost": null,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 116.96,
          "cost": null,
          "unitCost": null,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 42.48,
          "cost": null,
          "unitCost": null,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 1.17,
          "cost": null,
          "unitCost": null,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 4.03,
          "cost": null,
          "unitCost": null,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 60.48,
          "cost": null,
          "unitCost": null,
          "color": "#a855f7"
        },
        {
          "name": "HSD (Diesel)",
          "gen": 0,
          "cost": null,
          "unitCost": null,
          "color": "#ef4444"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 21.83,
          "peakFlow": 903,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 34.8,
          "peakFlow": 1488,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.85,
          "peakFlow": 168,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 403,
          "demand": 5868,
          "pct": 6.87
        },
        {
          "zone": "Chattogram",
          "loadShed": 83,
          "demand": 1462,
          "pct": 5.68
        },
        {
          "zone": "Khulna",
          "loadShed": 297,
          "demand": 2123,
          "pct": 13.99
        },
        {
          "zone": "Rajshahi",
          "loadShed": 361,
          "demand": 1819,
          "pct": 19.85
        },
        {
          "zone": "Cumilla",
          "loadShed": 201,
          "demand": 1601,
          "pct": 12.55
        },
        {
          "zone": "Mymensingh",
          "loadShed": 310,
          "demand": 1409,
          "pct": 22
        },
        {
          "zone": "Sylhet",
          "loadShed": 114,
          "demand": 669,
          "pct": 17.04
        },
        {
          "zone": "Barishal",
          "loadShed": 34,
          "demand": 507,
          "pct": 6.71
        },
        {
          "zone": "Rangpur",
          "loadShed": 247,
          "demand": 1098,
          "pct": 22.5
        }
      ],
      "dailyOutages": [
        {
          "time": "08:32",
          "plant": "Mymensingh 132/33kV S/S Transformer-3 (424T) HT",
          "load": "HT Outage",
          "reason": "Mymensingh 132/33kV S/S Transformer-3 (424T) HT is restored.",
          "full_desc": "Mymensingh 132/33kV S/S Transformer-3 (424T) HT is restored."
        },
        {
          "time": "08:33",
          "plant": "Mymensingh 132/33kV S/S Transformer-3 (424T) LT",
          "load": "HT Outage",
          "reason": "Mymensingh 132/33kV S/S Transformer-3 (424T) LT is restored.",
          "full_desc": "Mymensingh 132/33kV S/S Transformer-3 (424T) LT is restored."
        },
        {
          "time": "08:55 - 09:30",
          "plant": "Bhandaria 132/33kV S/S Transformer-1 LT Tripped showing OC pro. trip relays",
          "load": "HT Outage",
          "reason": "Due to 33kv Bamna  feeder fault",
          "full_desc": "Bhandaria 132/33kV S/S Transformer-1 LT Tripped showing OC pro. trip relays Due to 33kv Bamna  feeder fault"
        },
        {
          "time": "08:55 - 09:30",
          "plant": "Bhandaria 132/33kV S/S Transformer-2 LT Tripped showing OC pro. Trip relays",
          "load": "HT Outage",
          "reason": "Due to 33 kv Bamna feeder fault",
          "full_desc": "Bhandaria 132/33kV S/S Transformer-2 LT Tripped showing OC pro. Trip relays Due to 33 kv Bamna feeder fault"
        },
        {
          "time": "10:15 - 15:50",
          "plant": "BIPTC S/S 20DF23 Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Corrective maintenance work",
          "full_desc": "BIPTC S/S 20DF23 Scheduled S/D Due to Corrective maintenance work"
        },
        {
          "time": "10:20 - 14:45",
          "plant": "Pabna- Shahjadpur  132kV Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "Due to Redhot maintenance",
          "full_desc": "Pabna- Shahjadpur  132kV Ckt-1 Forced S/D from Pabna 132/33kV end Due to Redhot maintenance"
        },
        {
          "time": "10:32 - 14:50",
          "plant": "Pabna- Shahjadpur  132kV Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "Due to Red hot maintenance",
          "full_desc": "Pabna- Shahjadpur  132kV Ckt-1 Forced S/D from Shahjadpur 132/33kV end Due to Red hot maintenance"
        },
        {
          "time": "11:14 - 13:05",
          "plant": "Bogura(New)-Naogaon 132 kV Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "Due to It is necessary to shut down Naogaon Bogura Circuit-1 to remove the kite from the middle of tower number 62-63.",
          "full_desc": "Bogura(New)-Naogaon 132 kV Ckt-1 Forced S/D from Naogaon 132/33kV end Due to It is necessary to shut down Naogaon Bogura Circuit-1 to remove the kite from the middle of tower number 62-63."
        },
        {
          "time": "12:00",
          "plant": "Day Peak Generation",
          "load": "14137 MW",
          "reason": "Day Peak Generation is 14137 MW.",
          "full_desc": "Day Peak Generation is 14137 MW."
        },
        {
          "time": "12:21",
          "plant": "Full interruption",
          "load": "HT Outage",
          "reason": "due to tripping of Bhulta (new) to Bhulta (old) 132 kV ckt. At the same time, Ashuganj (south) - Ghorashal 230 kV ckt-1 tripped showing distance (zone-1, Blue phase).",
          "full_desc": "Full interruption is occurring under Bhulta 132/33 kV grid s/s due to tripping of Bhulta (new) to Bhulta (old) 132 kV ckt. At the same time, Ashuganj (south) - Ghorashal 230 kV ckt-1 tripped showing distance (zone-1, Blue phase)."
        },
        {
          "time": "12:54",
          "plant": "Bhulta (new) to Bhulta (old) 132 kV ckt",
          "load": "HT Outage",
          "reason": "Bhulta (new) to Bhulta (old) 132 kV ckt was switched ON. No interrution is occurring now at Bhulta 132/33 kV grid s/s.",
          "full_desc": "Bhulta (new) to Bhulta (old) 132 kV ckt was switched ON. No interrution is occurring now at Bhulta 132/33 kV grid s/s."
        },
        {
          "time": "13:32",
          "plant": "Matuail-Siddhirganj  132kV Ckt-1",
          "load": "HT Outage",
          "reason": "Matuail-Siddhirganj  132kV Ckt-1 is restored.",
          "full_desc": "Matuail-Siddhirganj  132kV Ckt-1 is restored."
        },
        {
          "time": "13:51",
          "plant": "Ashuganj (south) - Ghorashal 230 kV ckt-1",
          "load": "HT Outage",
          "reason": "Ashuganj (south) - Ghorashal 230 kV ckt-1 was switched ON.",
          "full_desc": "Ashuganj (south) - Ghorashal 230 kV ckt-1 was switched ON."
        },
        {
          "time": "16:08 - 16:23",
          "plant": "Korerhat 400/230/132kV S/S ATR-4(7403T) HT Tripped showing 6MD85 relays",
          "load": "HT Outage",
          "reason": "Due to 33kv TCS fault  test",
          "full_desc": "Korerhat 400/230/132kV S/S ATR-4(7403T) HT Tripped showing 6MD85 relays Due to 33kv TCS fault  test"
        },
        {
          "time": "16:08 - 16:23",
          "plant": "Korerhat 400/230/132kV S/S ATR-4(7403T) LT Tripped showing 6MD85 relays",
          "load": "HT Outage",
          "reason": "Due to 33kv TCS fault test",
          "full_desc": "Korerhat 400/230/132kV S/S ATR-4(7403T) LT Tripped showing 6MD85 relays Due to 33kv TCS fault test"
        },
        {
          "time": "16:14 - 17:21",
          "plant": "Barishal 132/33kV S/S T-2 (415T) LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to WZPDCL Work.",
          "full_desc": "Barishal 132/33kV S/S T-2 (415T) LT Scheduled S/D Due to WZPDCL Work."
        },
        {
          "time": "16:14 - 17:20",
          "plant": "Barishal 132/33kV S/S T-2 (415T) HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to WZPDCL WORK.",
          "full_desc": "Barishal 132/33kV S/S T-2 (415T) HT Scheduled S/D Due to WZPDCL WORK."
        },
        {
          "time": "16:30 - 17:50",
          "plant": "Mithapukur 132/33kV S/S TR-2 (414T) LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to red hot",
          "full_desc": "Mithapukur 132/33kV S/S TR-2 (414T) LT Forced S/D Due to red hot"
        },
        {
          "time": "16:31 - 17:51",
          "plant": "Mithapukur 132/33kV S/S TR-2 (414T) HT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to red hot",
          "full_desc": "Mithapukur 132/33kV S/S TR-2 (414T) HT Project Work S/D Due to red hot"
        },
        {
          "time": "18:44 - 19:18",
          "plant": "Shahjibazar 132/33kV S/S TR-04 LT Scheduled",
          "load": "HT Outage",
          "reason": "for Redhot Maintenance",
          "full_desc": "Shahjibazar 132/33kV S/S TR-04 LT Scheduled S/D Due to Shutdown taken by PBS for Redhot Maintenance"
        },
        {
          "time": "18:45 - 19:13",
          "plant": "Shahjibazar 132/33kV S/S TR-04 HT Scheduled",
          "load": "HT Outage",
          "reason": "for Redhot Maintenance.",
          "full_desc": "Shahjibazar 132/33kV S/S TR-04 HT Scheduled S/D Due to Shutdown Taken By PBS for Redhot Maintenance."
        },
        {
          "time": "21:00",
          "plant": "Evening Peak Generation",
          "load": "15048 MW",
          "reason": "Evening Peak Generation is 15048 MW",
          "full_desc": "Evening Peak Generation is 15048 MW"
        },
        {
          "time": "21:13",
          "plant": "Shahjibazar 132/33kV S/S TR-06 HT",
          "load": "HT Outage",
          "reason": "Shahjibazar 132/33kV S/S TR-06 HT is restored.",
          "full_desc": "Shahjibazar 132/33kV S/S TR-06 HT is restored."
        },
        {
          "time": "21:18 - 22:19",
          "plant": "Haripur 230/132kV S/S Auto TR-1 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Redhot on 132kV CB in Red Phase",
          "full_desc": "Haripur 230/132kV S/S Auto TR-1 LT Scheduled S/D Due to Redhot on 132kV CB in Red Phase"
        },
        {
          "time": "21:21 - 22:19",
          "plant": "Haripur 230/132kV S/S Auto TR-1 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Redhot on 132kV CB in Red phase",
          "full_desc": "Haripur 230/132kV S/S Auto TR-1 HT Scheduled S/D Due to Redhot on 132kV CB in Red phase"
        },
        {
          "time": "22:45 - 00:06",
          "plant": "Chhatak 132/33kV S/S T-1 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Red Hot Maintanance of 33 kv bus",
          "full_desc": "Chhatak 132/33kV S/S T-1 HT Scheduled S/D Due to Red Hot Maintanance of 33 kv bus"
        },
        {
          "time": "22:45 - 00:06",
          "plant": "Chhatak 132/33kV S/S T-1 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Red Hot Maintanance of 33 kv bus",
          "full_desc": "Chhatak 132/33kV S/S T-1 LT Scheduled S/D Due to Red Hot Maintanance of 33 kv bus"
        },
        {
          "time": "22:55",
          "plant": "Siddhirganj 2*120 MW GT-1",
          "load": "120 MW",
          "reason": "Siddhirganj 2*120 MW GT-1 was sync.",
          "full_desc": "Siddhirganj 2*120 MW GT-1 was sync."
        },
        {
          "time": "00:00",
          "plant": "HVDC(Nepal) Running with remarks:- None",
          "load": "HT Outage",
          "reason": "HVDC(Nepal) Running with remarks:- None",
          "full_desc": "HVDC(Nepal) Running with remarks:- None"
        },
        {
          "time": "00:00",
          "plant": "HVDC(Nepal) Synchronized",
          "load": "HT Outage",
          "reason": "HVDC(Nepal) Synchronized",
          "full_desc": "HVDC(Nepal) Synchronized"
        },
        {
          "time": "03:50 - 05:29",
          "plant": "Barapukuria-Saidpur 132 kV Ckt-2 Tripped from Barapukuria 230/132/33kV end showing REL511 relays",
          "load": "HT Outage",
          "reason": "Due to Thundering, storm & rain and from Saidpur 132/33kV end showing Distance relay, C relays.",
          "full_desc": "Barapukuria-Saidpur 132 kV Ckt-2 Tripped from Barapukuria 230/132/33kV end showing REL511 relays Due to Thundering, storm & rain and from Saidpur 132/33kV end showing Distance relay, C relays."
        },
        {
          "time": "04:42 - 04:58",
          "plant": "Ishwardi-Natore  132kV Ckt-2 Tripped from Ishurdi 132/33kV end showing Distance protection relay relays.",
          "load": "HT Outage",
          "reason": "Ishwardi-Natore  132kV Ckt-2 Tripped from Ishurdi 132/33kV end showing Distance protection relay relays.",
          "full_desc": "Ishwardi-Natore  132kV Ckt-2 Tripped from Ishurdi 132/33kV end showing Distance protection relay relays."
        },
        {
          "time": "07:23",
          "plant": "Hasnabad 230/132kV S/S AUTO TR-1 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to ATR-1 132kV side bus DS maintenance, work done by 132kv S/s",
          "full_desc": "Hasnabad 230/132kV S/S AUTO TR-1 HT Scheduled S/D Due to ATR-1 132kV side bus DS maintenance, work done by 132kv S/s"
        },
        {
          "time": "07:23",
          "plant": "Hasnabad 230/132kV S/S AUTO TR-1 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to ATR-1 132kV side bus DS maintenance, work done by 132kv S/s",
          "full_desc": "Hasnabad 230/132kV S/S AUTO TR-1 LT Scheduled S/D Due to ATR-1 132kV side bus DS maintenance, work done by 132kv S/s"
        },
        {
          "time": "07:30",
          "plant": "Haripur 230/132kV S/S 132kV Main Bus Sec-1",
          "load": "HT Outage",
          "reason": "Haripur 230/132kV S/S 132kV Main Bus Sec-1 is restored.",
          "full_desc": "Haripur 230/132kV S/S 132kV Main Bus Sec-1 is restored."
        },
        {
          "time": "08:00",
          "plant": "Kushtia 132/33kV S/S 132 KV Bus-B Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to DWZTGE \u09aa\u09cd\u09b0\u0995\u09b2\u09cd\u09aa\u09c7\u09b0 \u0986\u0993\u09a4\u09be\u09df \u0995\u09c1\u09b7\u09cd\u099f\u09bf\u09df\u09be-\u09ae\u09c7\u09b9\u09c7\u09b0\u09aa\u09c1\u09b0  \u09ac\u09c7 \u098f\u09b0 \u0995\u09be\u099c\u09c7\u09b0 \u099c\u09a8\u09cd\u09af \u09ac\u09be\u09b8 A \u09a5\u09c7\u0995\u09c7 B \u09a4\u09c7 \u09b6\u09bf\u09ab\u099f",
          "full_desc": "Kushtia 132/33kV S/S 132 KV Bus-B Project Work S/D Due to DWZTGE \u09aa\u09cd\u09b0\u0995\u09b2\u09cd\u09aa\u09c7\u09b0 \u0986\u0993\u09a4\u09be\u09df \u0995\u09c1\u09b7\u09cd\u099f\u09bf\u09df\u09be-\u09ae\u09c7\u09b9\u09c7\u09b0\u09aa\u09c1\u09b0  \u09ac\u09c7 \u098f\u09b0 \u0995\u09be\u099c\u09c7\u09b0 \u099c\u09a8\u09cd\u09af \u09ac\u09be\u09b8 A \u09a5\u09c7\u0995\u09c7 B \u09a4\u09c7 \u09b6\u09bf\u09ab\u099f"
        }
      ],
      "hourlyLoadData": [],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 467.5,
          "condensate": 349.5,
          "share": 17.3
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 140.2,
          "condensate": 640,
          "share": 5.2
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 92,
          "condensate": 60,
          "share": 3.4
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 916.6,
          "condensate": 4916.2,
          "share": 33.9
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31.6,
          "condensate": 94,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1055.7,
          "condensate": 27.4,
          "share": 39
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 248.7,
          "fertilizer": 73.3,
          "others": 1085.9,
          "total": 1407.9
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 191.1,
          "fertilizer": 0,
          "others": 89.7,
          "total": 280.8
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 37.8,
          "fertilizer": 40.2,
          "others": 171.2,
          "total": 249.2
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 223.3,
          "fertilizer": 40.2,
          "others": 118.5,
          "total": 381.9
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 124.2,
          "fertilizer": 0,
          "others": 29.5,
          "total": 153.8
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 54.2,
          "fertilizer": 0,
          "others": 4.1,
          "total": 58.4
        }
      ]
    },
  "2026-06-15": {
      "systemStats": {
        "date": "15 Jun 2026",
        "dayPeakGen": 14247.86,
        "eveningPeakGen": 15150.5,
        "dayPeakDemand": null,
        "eveningPeakDemand": 16930.5,
        "minGen": null,
        "maxGen": null,
        "totalEnergyGen": 340.87983799,
        "totalEnergyUnserved": null,
        "totalEnergyDemand": null,
        "maxTemp": null,
        "totalGasSuppliedPower": 892.79,
        "avgProductionCost": 6.612,
        "totalDailyCost": 2253923236
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 121.83,
          "cost": null,
          "unitCost": null,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 115.29,
          "cost": null,
          "unitCost": null,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 35.82,
          "cost": null,
          "unitCost": null,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 1.68,
          "cost": null,
          "unitCost": null,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 3.87,
          "cost": null,
          "unitCost": null,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 62.28,
          "cost": null,
          "unitCost": null,
          "color": "#a855f7"
        },
        {
          "name": "HSD (Diesel)",
          "gen": 0,
          "cost": null,
          "unitCost": null,
          "color": "#ef4444"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 22.45,
          "peakFlow": 930,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 35.22,
          "peakFlow": 1451,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.71,
          "peakFlow": 162,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 250,
          "demand": 5797,
          "pct": 4.31
        },
        {
          "zone": "Chattogram",
          "loadShed": 120,
          "demand": 1580,
          "pct": 7.59
        },
        {
          "zone": "Khulna",
          "loadShed": 210,
          "demand": 2016,
          "pct": 10.42
        },
        {
          "zone": "Rajshahi",
          "loadShed": 209,
          "demand": 1602,
          "pct": 13.05
        },
        {
          "zone": "Cumilla",
          "loadShed": 245,
          "demand": 1613,
          "pct": 15.19
        },
        {
          "zone": "Mymensingh",
          "loadShed": 314,
          "demand": 1408,
          "pct": 22.3
        },
        {
          "zone": "Sylhet",
          "loadShed": 81,
          "demand": 652,
          "pct": 12.42
        },
        {
          "zone": "Barishal",
          "loadShed": 93,
          "demand": 515,
          "pct": 18.06
        },
        {
          "zone": "Rangpur",
          "loadShed": 181,
          "demand": 1118,
          "pct": 16.19
        }
      ],
      "dailyOutages": [
        {
          "time": "08:00",
          "plant": "Kushtia 132/33kV S/S 132 KV Bus-B Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to DWZTGE \u09aa\u09cd\u09b0\u0995\u09b2\u09cd\u09aa\u09c7\u09b0 \u0986\u0993\u09a4\u09be\u09df \u0995\u09c1\u09b7\u09cd\u099f\u09bf\u09df\u09be-\u09ae\u09c7\u09b9\u09c7\u09b0\u09aa\u09c1\u09b0  \u09ac\u09c7 \u098f\u09b0 \u0995\u09be\u099c\u09c7\u09b0 \u099c\u09a8\u09cd\u09af \u09ac\u09be\u09b8 A \u09a5\u09c7\u0995\u09c7 B \u09a4\u09c7 \u09b6\u09bf\u09ab\u099f",
          "full_desc": "Kushtia 132/33kV S/S 132 KV Bus-B Project Work S/D Due to DWZTGE \u09aa\u09cd\u09b0\u0995\u09b2\u09cd\u09aa\u09c7\u09b0 \u0986\u0993\u09a4\u09be\u09df \u0995\u09c1\u09b7\u09cd\u099f\u09bf\u09df\u09be-\u09ae\u09c7\u09b9\u09c7\u09b0\u09aa\u09c1\u09b0  \u09ac\u09c7 \u098f\u09b0 \u0995\u09be\u099c\u09c7\u09b0 \u099c\u09a8\u09cd\u09af \u09ac\u09be\u09b8 A \u09a5\u09c7\u0995\u09c7 B \u09a4\u09c7 \u09b6\u09bf\u09ab\u099f"
        },
        {
          "time": "08:48",
          "plant": "Hasnabad 230/132kV S/S AUTO TR-1 LT",
          "load": "HT Outage",
          "reason": "Hasnabad 230/132kV S/S AUTO TR-1 LT is restored.",
          "full_desc": "Hasnabad 230/132kV S/S AUTO TR-1 LT is restored."
        },
        {
          "time": "08:48",
          "plant": "Hasnabad 230/132kV S/S AUTO TR-1 HT",
          "load": "HT Outage",
          "reason": "Hasnabad 230/132kV S/S AUTO TR-1 HT is restored.",
          "full_desc": "Hasnabad 230/132kV S/S AUTO TR-1 HT is restored."
        },
        {
          "time": "09:29",
          "plant": "Haripur 230/132kV S/S EGCB 412MW",
          "load": "412MW",
          "reason": "Haripur 230/132kV S/S EGCB 412MW is restored.",
          "full_desc": "Haripur 230/132kV S/S EGCB 412MW is restored."
        },
        {
          "time": "11:00",
          "plant": "Day Peak Generation",
          "load": "14247 MW",
          "reason": "Day Peak Generation is 14247 MW.",
          "full_desc": "Day Peak Generation is 14247 MW."
        },
        {
          "time": "12:48",
          "plant": "Tongi 230/132/33kV S/S Tongi-Tongi 80 MW PS",
          "load": "80 MW",
          "reason": "Tongi 230/132/33kV S/S Tongi-Tongi 80 MW PS is restored.",
          "full_desc": "Tongi 230/132/33kV S/S Tongi-Tongi 80 MW PS is restored."
        },
        {
          "time": "12:57 - 13:59",
          "plant": "Goalpara- Khulna (C)  132kV Ckt-2 Tripped from Khulna (C) end showing Distance relays",
          "load": "HT Outage",
          "reason": "Due to Heavy rsin fall & thundering and from Goalpara 132/33kV end showing Distance relay relays Due to Thunderstorme",
          "full_desc": "Goalpara- Khulna (C)  132kV Ckt-2 Tripped from Khulna (C) end showing Distance relays Due to Heavy rsin fall & thundering and from Goalpara 132/33kV end showing Distance relay relays Due to Thunderstorme"
        },
        {
          "time": "14:08 - 14:44",
          "plant": "Barishal(N)-Madaripur 132 kV Ckt-1 Tripped from Barishal 230/132kV end showing REL650 relays.",
          "load": "HT Outage",
          "reason": "Barishal(N)-Madaripur 132 kV Ckt-1 Tripped from Barishal 230/132kV end showing REL650 relays.",
          "full_desc": "Barishal(N)-Madaripur 132 kV Ckt-1 Tripped from Barishal 230/132kV end showing REL650 relays."
        },
        {
          "time": "14:28",
          "plant": "Ghorasal- Ishwardi  230 kV Ckt-2 Tripped from Ishurdi 230/132kV end showing Distance protection relay relays.",
          "load": "HT Outage",
          "reason": "Ghorasal- Ishwardi  230 kV Ckt-2 Tripped from Ishurdi 230/132kV end showing Distance protection relay relays.",
          "full_desc": "Ghorasal- Ishwardi  230 kV Ckt-2 Tripped from Ishurdi 230/132kV end showing Distance protection relay relays."
        },
        {
          "time": "14:46 - 15:01",
          "plant": "Bhandaria 132/33kV S/S Transformer-2 LT Tripped showing 50 O/C DMT relays",
          "load": "HT Outage",
          "reason": "Due to Bamna pbs 33 kv feeder fault",
          "full_desc": "Bhandaria 132/33kV S/S Transformer-2 LT Tripped showing 50 O/C DMT relays Due to Bamna pbs 33 kv feeder fault"
        },
        {
          "time": "14:46 - 15:01",
          "plant": "Bhandaria 132/33kV S/S Transformer-1 LT Tripped showing 50 o/c DMT trip relays",
          "load": "HT Outage",
          "reason": "Due to 33 kv Bamna feeder fault",
          "full_desc": "Bhandaria 132/33kV S/S Transformer-1 LT Tripped showing 50 o/c DMT trip relays Due to 33 kv Bamna feeder fault"
        },
        {
          "time": "15:01 - 17:06",
          "plant": "Barishal 230/132kV S/S T-5 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Maintenance work of source DS of 33 kV Nobogram Feeder by Jhalokathi PBS.",
          "full_desc": "Barishal 230/132kV S/S T-5 LT Scheduled S/D Due to Maintenance work of source DS of 33 kV Nobogram Feeder by Jhalokathi PBS."
        },
        {
          "time": "15:01 - 17:04",
          "plant": "Barishal 230/132kV S/S T-5 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Maintenance work of source DS of 33 kV Nobogram Feeder by Jhalokathi PBS.",
          "full_desc": "Barishal 230/132kV S/S T-5 HT Scheduled S/D Due to Maintenance work of source DS of 33 kV Nobogram Feeder by Jhalokathi PBS."
        },
        {
          "time": "15:33",
          "plant": "Barapukuria PS unit-1",
          "load": "HT Outage",
          "reason": "Barapukuria PS unit-1 was synchronized.",
          "full_desc": "Barapukuria PS unit-1 was synchronized."
        },
        {
          "time": "15:37 - 17:07",
          "plant": "Goalpara- Khulna (C)  132kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Y phase current  missing DS & CB  Goalpara ckt 1",
          "full_desc": "Goalpara- Khulna (C)  132kV Ckt-1 Scheduled S/D from Khulna (C) end Due to Y phase current  missing DS & CB  Goalpara ckt 1"
        },
        {
          "time": "17:27 - 18:33",
          "plant": "Barishal 230/132kV S/S T-4 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 4 incomer 33kv CT Nut bolt titining work purpose",
          "full_desc": "Barishal 230/132kV S/S T-4 HT Scheduled S/D Due to 4 incomer 33kv CT Nut bolt titining work purpose"
        },
        {
          "time": "17:27 - 18:35",
          "plant": "Barishal 230/132kV S/S T-4 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to T-4 incomer 33kv CT Nut bolt titining work purpose.",
          "full_desc": "Barishal 230/132kV S/S T-4 LT Scheduled S/D Due to T-4 incomer 33kv CT Nut bolt titining work purpose."
        },
        {
          "time": "21:00",
          "plant": "Evening Peak Generation",
          "load": "15150 MW",
          "reason": "Evening Peak Generation is 15150 MW",
          "full_desc": "Evening Peak Generation is 15150 MW"
        },
        {
          "time": "05:45",
          "plant": "Rampal 1320 MW (BIFPCL) Shutdown with remarks:- U1",
          "load": "1320 MW",
          "reason": "Rampal 1320 MW (BIFPCL) Shutdown with remarks:- U1",
          "full_desc": "Rampal 1320 MW (BIFPCL) Shutdown with remarks:- U1"
        },
        {
          "time": "05:46",
          "plant": "Rampal 1320 MW (BIFPCL) Synchronized with remarks:- Unit-2 (False sms)",
          "load": "1320 MW",
          "reason": "Rampal 1320 MW (BIFPCL) Synchronized with remarks:- Unit-2 (False sms)",
          "full_desc": "Rampal 1320 MW (BIFPCL) Synchronized with remarks:- Unit-2 (False sms)"
        },
        {
          "time": "05:46",
          "plant": "Rampal 1320 MW (BIFPCL) Synchronized with remarks:- Unit-2",
          "load": "1320 MW",
          "reason": "Rampal 1320 MW (BIFPCL) Synchronized with remarks:- Unit-2",
          "full_desc": "Rampal 1320 MW (BIFPCL) Synchronized with remarks:- Unit-2"
        },
        {
          "time": "06:05 - 06:23",
          "plant": "Cumilla(S) 132/33kV S/S TR-4 LT Tripped showing Do relays",
          "load": "HT Outage",
          "reason": "Due to same as Tr-03",
          "full_desc": "Cumilla(S) 132/33kV S/S TR-4 LT Tripped showing Do relays Due to same as Tr-03"
        },
        {
          "time": "06:05 - 06:23",
          "plant": "Cumilla(S) 132/33kV S/S TR-3 LT Tripped showing REF615, RET650 relays",
          "load": "HT Outage",
          "reason": "Due to PDB Donaitori feeder fault",
          "full_desc": "Cumilla(S) 132/33kV S/S TR-3 LT Tripped showing REF615, RET650 relays Due to PDB Donaitori feeder fault"
        },
        {
          "time": "07:30",
          "plant": "Lakshmipur 132/33kV S/S Transformer-2 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33kV Load Side Redhot Work.",
          "full_desc": "Lakshmipur 132/33kV S/S Transformer-2 LT Scheduled S/D Due to 33kV Load Side Redhot Work."
        }
      ],
      "hourlyLoadData": [],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 465.7,
          "condensate": 351.2,
          "share": 17.3
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 140.8,
          "condensate": 630.4,
          "share": 5.2
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 90.8,
          "condensate": 55.7,
          "share": 3.4
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 915.4,
          "condensate": 4738.8,
          "share": 34
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31.5,
          "condensate": 93,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1050.3,
          "condensate": 27.3,
          "share": 39
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 265,
          "fertilizer": 73.4,
          "others": 1096.1,
          "total": 1434.5
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 184.7,
          "fertilizer": 0,
          "others": 89.4,
          "total": 274.1
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 37.9,
          "fertilizer": 46.7,
          "others": 177,
          "total": 261.5
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 224.7,
          "fertilizer": 40.2,
          "others": 115.8,
          "total": 380.7
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 127.6,
          "fertilizer": 0,
          "others": 29.6,
          "total": 157.2
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 53.7,
          "fertilizer": 0,
          "others": 3.9,
          "total": 57.7
        }
      ]
    },
  "2026-06-16": {
      "systemStats": {
        "date": "16 Jun 2026",
        "dayPeakGen": 13655.83,
        "eveningPeakGen": 14579.39,
        "dayPeakDemand": null,
        "eveningPeakDemand": 17553.39,
        "minGen": null,
        "maxGen": null,
        "totalEnergyGen": 332.42743681,
        "totalEnergyUnserved": null,
        "totalEnergyDemand": null,
        "maxTemp": null,
        "totalGasSuppliedPower": 901.71,
        "avgProductionCost": 6.805,
        "totalDailyCost": 2262197132
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 123.39,
          "cost": null,
          "unitCost": null,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 106.37,
          "cost": null,
          "unitCost": null,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 35.59,
          "cost": null,
          "unitCost": null,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 1.61,
          "cost": null,
          "unitCost": null,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 4.14,
          "cost": null,
          "unitCost": null,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 61.19,
          "cost": null,
          "unitCost": null,
          "color": "#a855f7"
        },
        {
          "name": "HSD (Diesel)",
          "gen": 0,
          "cost": null,
          "unitCost": null,
          "color": "#ef4444"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 22.43,
          "peakFlow": 927,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 34.01,
          "peakFlow": 1471.89,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.84,
          "peakFlow": 182,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 439,
          "demand": 5839,
          "pct": 7.52
        },
        {
          "zone": "Chattogram",
          "loadShed": 186,
          "demand": 1583,
          "pct": 11.75
        },
        {
          "zone": "Khulna",
          "loadShed": 464,
          "demand": 2077,
          "pct": 22.34
        },
        {
          "zone": "Rajshahi",
          "loadShed": 360,
          "demand": 1687,
          "pct": 21.34
        },
        {
          "zone": "Cumilla",
          "loadShed": 398,
          "demand": 1718,
          "pct": 23.17
        },
        {
          "zone": "Mymensingh",
          "loadShed": 448,
          "demand": 1485,
          "pct": 30.17
        },
        {
          "zone": "Sylhet",
          "loadShed": 103,
          "demand": 643,
          "pct": 16.02
        },
        {
          "zone": "Barishal",
          "loadShed": 142,
          "demand": 583,
          "pct": 24.36
        },
        {
          "zone": "Rangpur",
          "loadShed": 306,
          "demand": 1172,
          "pct": 26.11
        }
      ],
      "dailyOutages": [
        {
          "time": "09:17 - 13:03",
          "plant": "Lakshmipur 132/33kV S/S Transformer-2 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33kV load side Redhot work.",
          "full_desc": "Lakshmipur 132/33kV S/S Transformer-2 HT Scheduled S/D Due to 33kV load side Redhot work."
        },
        {
          "time": "10:11 - 15:10",
          "plant": "Goalpara- Khulna (C)  132kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "Due to y phase  0 Amp and from Khulna (C) end Due to S/D ordered by ALDC",
          "full_desc": "Goalpara- Khulna (C)  132kV Ckt-1 Scheduled S/D from Goalpara 132/33kV end Due to y phase  0 Amp and from Khulna (C) end Due to S/D ordered by ALDC"
        },
        {
          "time": "11:45 - 12:53",
          "plant": "Narshingdi 132/33kV S/S T-1 HT Scheduled",
          "load": "HT Outage",
          "reason": "for 33kV bushing B-Phase Oil leakage maintenance work.",
          "full_desc": "Narshingdi 132/33kV S/S T-1 HT Scheduled S/D Due to Tr-1 Transformer shutdown for 33kV bushing B-Phase Oil leakage maintenance work."
        },
        {
          "time": "11:45 - 12:53",
          "plant": "Narshingdi 132/33kV S/S T-1 LT Scheduled",
          "load": "HT Outage",
          "reason": "for 33kV bushing B-Phase Oil leakage maintenance work.",
          "full_desc": "Narshingdi 132/33kV S/S T-1 LT Scheduled S/D Due to Tr-1 Transformer shutdown for 33kV bushing B-Phase Oil leakage maintenance work."
        },
        {
          "time": "13:04",
          "plant": "Lakshmipur 132/33kV S/S Transformer-2 LT",
          "load": "HT Outage",
          "reason": "Lakshmipur 132/33kV S/S Transformer-2 LT is restored.",
          "full_desc": "Lakshmipur 132/33kV S/S Transformer-2 LT is restored."
        },
        {
          "time": "13:34",
          "plant": "Shahjibazar 132/33kV S/S TR-06 LT",
          "load": "HT Outage",
          "reason": "Shahjibazar 132/33kV S/S TR-06 LT is restored.",
          "full_desc": "Shahjibazar 132/33kV S/S TR-06 LT is restored."
        },
        {
          "time": "13:49 - 22:55",
          "plant": "Nabinagar 132/33kV S/S T-1 HT Tripped showing PRD relays Due to T-1 PRD Trip",
          "load": "HT Outage",
          "reason": "due to rain water entered into the PRD Terminal box",
          "full_desc": "Nabinagar 132/33kV S/S T-1 HT Tripped showing PRD relays Due to T-1 PRD Trip due to rain water entered into the PRD Terminal box"
        },
        {
          "time": "13:49 - 22:55",
          "plant": "Nabinagar 132/33kV S/S T-1 LT Tripped showing Intertrip From HV DIFF. relays",
          "load": "HT Outage",
          "reason": "Due to None",
          "full_desc": "Nabinagar 132/33kV S/S T-1 LT Tripped showing Intertrip From HV DIFF. relays Due to None"
        },
        {
          "time": "15:16",
          "plant": "Haripur 412 MW CCPP Synchronized with remarks:- GT",
          "load": "412 MW",
          "reason": "Haripur 412 MW CCPP Synchronized with remarks:- GT",
          "full_desc": "Haripur 412 MW CCPP Synchronized with remarks:- GT"
        },
        {
          "time": "17:26",
          "plant": "Haripur 412 MW CCPP Synchronized with remarks:- ST",
          "load": "412 MW",
          "reason": "Haripur 412 MW CCPP Synchronized with remarks:- ST",
          "full_desc": "Haripur 412 MW CCPP Synchronized with remarks:- ST"
        },
        {
          "time": "17:35",
          "plant": "Rangpur-Rangpur Confidence(100MW)  132kV Ckt-2",
          "load": "100MW",
          "reason": "Rangpur-Rangpur Confidence(100MW)  132kV Ckt-2 is restored.",
          "full_desc": "Rangpur-Rangpur Confidence(100MW)  132kV Ckt-2 is restored."
        },
        {
          "time": "19:10",
          "plant": "RNPL U-1 synch",
          "load": "HT Outage",
          "reason": "RNPL U-1 synch",
          "full_desc": "RNPL U-1 synch"
        },
        {
          "time": "21:00",
          "plant": "Evening peak generation",
          "load": "14579 MW",
          "reason": "Evening peak generation is 14579 MW.",
          "full_desc": "Evening peak generation is 14579 MW."
        },
        {
          "time": "23:01 - 00:18",
          "plant": "Chandraghona-Rangamati 132 kV Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "Due to Y-Phase Line Isolator higg temperature maintenance work",
          "full_desc": "Chandraghona-Rangamati 132 kV Ckt-1 Forced S/D from Chandraghona 132/33kV end Due to Y-Phase Line Isolator higg temperature maintenance work"
        },
        {
          "time": "00:14 - 01:05",
          "plant": "Ashuganj Network s/s 230 kV Bus coupler CB",
          "load": "HT Outage",
          "reason": "Ashuganj Network s/s 230 kV Bus coupler CB tripped showing E/F relay.",
          "full_desc": "Ashuganj Network s/s 230 kV Bus coupler CB tripped showing E/F relay."
        },
        {
          "time": "06:00",
          "plant": "Minimum generation 13421 MW",
          "load": "13421 MW",
          "reason": "Minimum generation 13421 MW",
          "full_desc": "Minimum generation 13421 MW"
        },
        {
          "time": "06:45 - 06:59",
          "plant": "Shahjibazar 132/33kV S/S TR-06 LT Tripped showing None relays",
          "load": "HT Outage",
          "reason": "Due to Bisic and Lakhai Feeder Trip",
          "full_desc": "Shahjibazar 132/33kV S/S TR-06 LT Tripped showing None relays Due to Bisic and Lakhai Feeder Trip"
        },
        {
          "time": "06:45 - 06:59",
          "plant": "Shahjibazar 132/33kV S/S TR-06 HT Tripped showing Over current Relay relays",
          "load": "HT Outage",
          "reason": "Due to Bisic and Lakhai Feeder Trip",
          "full_desc": "Shahjibazar 132/33kV S/S TR-06 HT Tripped showing Over current Relay relays Due to Bisic and Lakhai Feeder Trip"
        }
      ],
      "hourlyLoadData": [],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 467.7,
          "condensate": 355,
          "share": 17.4
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 140.6,
          "condensate": 634.8,
          "share": 5.2
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 91.7,
          "condensate": 53.5,
          "share": 3.4
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 914.4,
          "condensate": 4882.5,
          "share": 34
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31.4,
          "condensate": 94,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1046.4,
          "condensate": 27.2,
          "share": 38.9
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 276.2,
          "fertilizer": 72.7,
          "others": 1099.1,
          "total": 1448
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 182.9,
          "fertilizer": 0,
          "others": 89,
          "total": 271.9
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 38.2,
          "fertilizer": 39.7,
          "others": 176.1,
          "total": 254.1
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 223.1,
          "fertilizer": 40.2,
          "others": 117,
          "total": 380.3
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 129.8,
          "fertilizer": 0,
          "others": 29.2,
          "total": 159
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 53.9,
          "fertilizer": 0,
          "others": 3.9,
          "total": 57.7
        }
      ]
    },
  "2026-06-17": {
      "systemStats": {
        "date": "17 Jun 2026",
        "dayPeakGen": 13880.15,
        "eveningPeakGen": 15461.46,
        "dayPeakDemand": null,
        "eveningPeakDemand": 17328.46,
        "minGen": null,
        "maxGen": null,
        "totalEnergyGen": 340.72479055,
        "totalEnergyUnserved": null,
        "totalEnergyDemand": null,
        "maxTemp": null,
        "totalGasSuppliedPower": 886.55,
        "avgProductionCost": 6.791,
        "totalDailyCost": 2313978161
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 125.27,
          "cost": null,
          "unitCost": null,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 112.55,
          "cost": null,
          "unitCost": null,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 36.14,
          "cost": null,
          "unitCost": null,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 1.29,
          "cost": null,
          "unitCost": null,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 4.1,
          "cost": null,
          "unitCost": null,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 61.2,
          "cost": null,
          "unitCost": null,
          "color": "#a855f7"
        },
        {
          "name": "HSD (Diesel)",
          "gen": 0,
          "cost": null,
          "unitCost": null,
          "color": "#ef4444"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 21.56,
          "peakFlow": 911,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 34.82,
          "peakFlow": 1461.96,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.92,
          "peakFlow": 164,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 112,
          "demand": 5928,
          "pct": 1.89
        },
        {
          "zone": "Chattogram",
          "loadShed": 129,
          "demand": 1629,
          "pct": 7.92
        },
        {
          "zone": "Khulna",
          "loadShed": 475,
          "demand": 2216,
          "pct": 21.44
        },
        {
          "zone": "Rajshahi",
          "loadShed": 229,
          "demand": 1706,
          "pct": 13.42
        },
        {
          "zone": "Cumilla",
          "loadShed": 214,
          "demand": 1504,
          "pct": 14.23
        },
        {
          "zone": "Mymensingh",
          "loadShed": 316,
          "demand": 1373,
          "pct": 23.02
        },
        {
          "zone": "Sylhet",
          "loadShed": 20,
          "demand": 594,
          "pct": 3.37
        },
        {
          "zone": "Barishal",
          "loadShed": 97,
          "demand": 553,
          "pct": 17.54
        },
        {
          "zone": "Rangpur",
          "loadShed": 195,
          "demand": 1186,
          "pct": 16.44
        }
      ],
      "dailyOutages": [
        {
          "time": "09:43",
          "plant": "Gopalganj- Gopalganj(N) 132kV Ckt-2 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Clamp and Loop Change and from Gopalganj 400/132kVend.",
          "full_desc": "Gopalganj- Gopalganj(N) 132kV Ckt-2 Scheduled S/D from Gopalganj 132/33kV end Due to Clamp and Loop Change and from Gopalganj 400/132kVend."
        },
        {
          "time": "10:07 - 15:22",
          "plant": "Ishurdi 230/132kV S/S 230/132 kV T-01 LT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to CB 615B testing",
          "full_desc": "Ishurdi 230/132kV S/S 230/132 kV T-01 LT Project Work S/D Due to CB 615B testing"
        },
        {
          "time": "10:08 - 15:21",
          "plant": "Ishurdi 230/132kV S/S 230/132 kV T-01 HT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to CB 615B testing",
          "full_desc": "Ishurdi 230/132kV S/S 230/132 kV T-01 HT Project Work S/D Due to CB 615B testing"
        },
        {
          "time": "10:40 - 15:48",
          "plant": "BIPTC S/S 20DF23 Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Red hot maintenance of cell",
          "full_desc": "BIPTC S/S 20DF23 Scheduled S/D Due to Red hot maintenance of cell"
        },
        {
          "time": "10:43",
          "plant": "Notun Biddyut- Charfashion-1 Closed.",
          "load": "HT Outage",
          "reason": "Notun Biddyut- Charfashion-1 Closed.",
          "full_desc": "Notun Biddyut- Charfashion-1 Closed."
        },
        {
          "time": "10:44 - 11:15",
          "plant": "Mymensingh RPCL -Mymensingh  132kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "Mymensingh RPCL -Mymensingh  132kV Ckt-1 Scheduled S/D from Mymensingh 132/33kV end.",
          "full_desc": "Mymensingh RPCL -Mymensingh  132kV Ckt-1 Scheduled S/D from Mymensingh 132/33kV end."
        },
        {
          "time": "11:04 - 11:16",
          "plant": "Candpur- Kachua 132kV Ckt-1 Tripped from Chandpur 132/33kV end showing Distance relay relays",
          "load": "HT Outage",
          "reason": "Due to Zone-1 trip",
          "full_desc": "Candpur- Kachua 132kV Ckt-1 Tripped from Chandpur 132/33kV end showing Distance relay relays Due to Zone-1 trip"
        },
        {
          "time": "11:04 - 11:16",
          "plant": "Candpur- Kachua 132kV Ckt-2 Tripped from Chandpur 132/33kV end showing Distance relay relays",
          "load": "HT Outage",
          "reason": "Due to Zone-1 trip",
          "full_desc": "Candpur- Kachua 132kV Ckt-2 Tripped from Chandpur 132/33kV end showing Distance relay relays Due to Zone-1 trip"
        },
        {
          "time": "11:16 - 11:35",
          "plant": "Mymensingh RPCL -Mymensingh  132kV Ckt-2 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Relay testing of RPCL end.",
          "full_desc": "Mymensingh RPCL -Mymensingh  132kV Ckt-2 Scheduled S/D from Mymensingh 132/33kV end Due to Relay testing of RPCL end."
        },
        {
          "time": "15:10",
          "plant": "Aftabnagar-Rampura 132kV Ckt-1",
          "load": "HT Outage",
          "reason": "Aftabnagar-Rampura 132kV Ckt-1 is restored.",
          "full_desc": "Aftabnagar-Rampura 132kV Ckt-1 is restored."
        },
        {
          "time": "15:43 - 19:01",
          "plant": "Bagerhat 132/33kV S/S Transformer-1 (403T) HT Tripped showing Over current relay(51N) <br> O/C B phase Instant. relays",
          "load": "HT Outage",
          "reason": "Due to 33kv B phase Underground cable fault.",
          "full_desc": "Bagerhat 132/33kV S/S Transformer-1 (403T) HT Tripped showing Over current relay(51N) <br> O/C B phase Instant. relays Due to 33kv B phase Underground cable fault."
        },
        {
          "time": "15:43 - 19:08",
          "plant": "Bagerhat 132/33kV S/S Transformer-1 (403T) LT Tripped showing Over current B phase instant relays",
          "load": "HT Outage",
          "reason": "Due to 33kv B phase Underground cable fault.",
          "full_desc": "Bagerhat 132/33kV S/S Transformer-1 (403T) LT Tripped showing Over current B phase instant relays Due to 33kv B phase Underground cable fault."
        },
        {
          "time": "20:15",
          "plant": "Ashuganj-Brahmanbaria 132kV Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "Ashuganj-Brahmanbaria 132kV Ckt-1 Forced S/D from Brahmanbaria 132/33kV end.",
          "full_desc": "Ashuganj-Brahmanbaria 132kV Ckt-1 Forced S/D from Brahmanbaria 132/33kV end."
        },
        {
          "time": "20:30 - 23:25",
          "plant": "Ashuganj-Brahmanbaria 132kV Ckt-2 Tripped from Brahmanbaria 132/33kV end showing Main Protection trip relays.",
          "load": "HT Outage",
          "reason": "Ashuganj-Brahmanbaria 132kV Ckt-2 Tripped from Brahmanbaria 132/33kV end showing Main Protection trip relays.",
          "full_desc": "Ashuganj-Brahmanbaria 132kV Ckt-2 Tripped from Brahmanbaria 132/33kV end showing Main Protection trip relays."
        },
        {
          "time": "20:30 - 20:56",
          "plant": "Shahjibazar 132/33kV S/S BPDB 60 MW Tripped showing C.B Trip Relay, Busbar Three phase Over curent Relay relays Due to Voltage down",
          "load": "60 MW",
          "reason": "for B.Baria-Ashuganj ckt 02 Faut",
          "full_desc": "Shahjibazar 132/33kV S/S BPDB 60 MW Tripped showing C.B Trip Relay, Busbar Three phase Over curent Relay relays Due to Voltage down for B.Baria-Ashuganj ckt 02 Faut"
        },
        {
          "time": "20:58",
          "plant": "Brahmanbaria-Shahjibazar 132 kV Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "Brahmanbaria-Shahjibazar 132 kV Ckt-1 Forced S/D from Brahmanbaria 132/33kV end.",
          "full_desc": "Brahmanbaria-Shahjibazar 132 kV Ckt-1 Forced S/D from Brahmanbaria 132/33kV end."
        },
        {
          "time": "20:58",
          "plant": "Brahmanbaria-Shahjibazar 132 kV Ckt-2 Forced",
          "load": "HT Outage",
          "reason": "Brahmanbaria-Shahjibazar 132 kV Ckt-2 Forced S/D from Brahmanbaria 132/33kV end.",
          "full_desc": "Brahmanbaria-Shahjibazar 132 kV Ckt-2 Forced S/D from Brahmanbaria 132/33kV end."
        },
        {
          "time": "21:00",
          "plant": "Evening Peak Generation",
          "load": "15462 MW",
          "reason": "Evening Peak Generation is 15462 MW.",
          "full_desc": "Evening Peak Generation is 15462 MW."
        },
        {
          "time": "23:27",
          "plant": "Brahmanbaria-Narsinghdi 132 kV Ckt-2 Forced",
          "load": "HT Outage",
          "reason": "Brahmanbaria-Narsinghdi 132 kV Ckt-2 Forced S/D from Brahmanbaria 132/33kV end.",
          "full_desc": "Brahmanbaria-Narsinghdi 132 kV Ckt-2 Forced S/D from Brahmanbaria 132/33kV end."
        },
        {
          "time": "23:33",
          "plant": "Brahmanbaria-Narsinghdi 132 kV Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "Brahmanbaria-Narsinghdi 132 kV Ckt-1 Forced S/D from Brahmanbaria 132/33kV end.",
          "full_desc": "Brahmanbaria-Narsinghdi 132 kV Ckt-1 Forced S/D from Brahmanbaria 132/33kV end."
        },
        {
          "time": "02:39",
          "plant": "SS Power unit-1",
          "load": "HT Outage",
          "reason": "SS Power unit-1 was sync.",
          "full_desc": "SS Power unit-1 was sync."
        },
        {
          "time": "02:39",
          "plant": "SS Power Synchronized with remarks:- U-1",
          "load": "HT Outage",
          "reason": "SS Power Synchronized with remarks:- U-1",
          "full_desc": "SS Power Synchronized with remarks:- U-1"
        },
        {
          "time": "04:06 - 04:35",
          "plant": "Kurigram-Lalmonirhat  132kV Ckt-1 Tripped from Kurigram 132/33kV end showing Distance Z-1, relays",
          "load": "HT Outage",
          "reason": "Due to General Trip, <br> Distance Z-1,",
          "full_desc": "Kurigram-Lalmonirhat  132kV Ckt-1 Tripped from Kurigram 132/33kV end showing Distance Z-1, relays Due to General Trip, <br> Distance Z-1,"
        },
        {
          "time": "04:07 - 04:31",
          "plant": "Kurigram-Rangpur  132kV Ckt-1 Tripped from Rangpur 132/33kV end showing Distance Relay : R phase trip, B phase trip, Zone 1 relays",
          "load": "HT Outage",
          "reason": "Due to Bad weather",
          "full_desc": "Kurigram-Rangpur  132kV Ckt-1 Tripped from Rangpur 132/33kV end showing Distance Relay : R phase trip, B phase trip, Zone 1 relays Due to Bad weather"
        },
        {
          "time": "04:07 - 04:35",
          "plant": "Lalmonirhat-Rangpur 132 kV Ckt-2 Tripped from Rangpur 132/33kV end showing Distance relay : c phase trip, Z2, Z3 relays",
          "load": "HT Outage",
          "reason": "Due to Bad weather",
          "full_desc": "Lalmonirhat-Rangpur 132 kV Ckt-2 Tripped from Rangpur 132/33kV end showing Distance relay : c phase trip, Z2, Z3 relays Due to Bad weather"
        },
        {
          "time": "06:59",
          "plant": "Bogura 400/230kV S/S Bogura - Naogaon 230 kV Ckt-1 Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Jumpering works",
          "full_desc": "Bogura 400/230kV S/S Bogura - Naogaon 230 kV Ckt-1 Project Work S/D Due to Jumpering works"
        },
        {
          "time": "06:59",
          "plant": "Bogura 400/230kV S/S Bogura - Naogaon 230 kV Ckt-2 Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Jumpering works",
          "full_desc": "Bogura 400/230kV S/S Bogura - Naogaon 230 kV Ckt-2 Project Work S/D Due to Jumpering works"
        },
        {
          "time": "07:00",
          "plant": "Minimum generation 13272 MW",
          "load": "13272 MW",
          "reason": "Minimum generation 13272 MW",
          "full_desc": "Minimum generation 13272 MW"
        },
        {
          "time": "07:24 - 07:35",
          "plant": "Nawabganj 132/33kV S/S TR-2 LT Tripped showing Overcurrent protection relay relays.",
          "load": "HT Outage",
          "reason": "Nawabganj 132/33kV S/S TR-2 LT Tripped showing Overcurrent protection relay relays.",
          "full_desc": "Nawabganj 132/33kV S/S TR-2 LT Tripped showing Overcurrent protection relay relays."
        },
        {
          "time": "07:40",
          "plant": "Korerhat 400/230/132kV S/S ATR-4(7403T) LT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Due to project work",
          "full_desc": "Korerhat 400/230/132kV S/S ATR-4(7403T) LT Project Work S/D Due to Due to project work"
        },
        {
          "time": "07:41",
          "plant": "Korerhat 400/230/132kV S/S ATR-4(7403T) HT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Due to project work",
          "full_desc": "Korerhat 400/230/132kV S/S ATR-4(7403T) HT Project Work S/D Due to Due to project work"
        }
      ],
      "hourlyLoadData": [],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 467.7,
          "condensate": 361.9,
          "share": 17.4
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 140.4,
          "condensate": 632.7,
          "share": 5.2
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 91.6,
          "condensate": 59.1,
          "share": 3.4
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 912.1,
          "condensate": 4931.1,
          "share": 33.8
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31.8,
          "condensate": 95,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1051.6,
          "condensate": 27.3,
          "share": 39
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 271.2,
          "fertilizer": 72.9,
          "others": 1092.6,
          "total": 1436.7
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 182,
          "fertilizer": 0,
          "others": 91.4,
          "total": 273.4
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 38.1,
          "fertilizer": 39.6,
          "others": 172.9,
          "total": 250.6
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 222.1,
          "fertilizer": 40.2,
          "others": 113.2,
          "total": 375.5
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 128.1,
          "fertilizer": 0,
          "others": 29.4,
          "total": 157.5
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 54,
          "fertilizer": 0,
          "others": 4,
          "total": 58
        }
      ]
    },
  "2026-06-18": {
      "systemStats": {
        "date": "18 Jun 2026",
        "dayPeakGen": 14101.96,
        "eveningPeakGen": 14783.7,
        "dayPeakDemand": 14351.27,
        "eveningPeakDemand": 14852.7,
        "minGen": 12801.92,
        "maxGen": 14783.7,
        "totalEnergyGen": 334.39110724,
        "totalEnergyUnserved": 10.199,
        "totalEnergyDemand": 344.59,
        "maxTemp": 33.4,
        "totalGasSuppliedPower": 878.23,
        "avgProductionCost": 6.514,
        "totalDailyCost": 2178352952
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 123.14,
          "cost": 425464051,
          "unitCost": 3.4551,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 119.19,
          "cost": 784889327,
          "unitCost": 6.585,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 28.95,
          "cost": 564621657,
          "unitCost": 19.5002,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 0.71,
          "cost": 71064,
          "unitCost": 0.1,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 2.15,
          "cost": 33968125,
          "unitCost": 15.7709,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 59.73,
          "cost": 359387459,
          "unitCost": 6.0166,
          "color": "#a855f7"
        },
        {
          "name": "HSD",
          "gen": 0.33,
          "cost": 7324649,
          "unitCost": 22.3749,
          "color": "#ef4444"
        },
        {
          "name": "Wind",
          "gen": 0.18,
          "cost": 2626617,
          "unitCost": 14.71,
          "color": "#22c55e"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 21.59,
          "peakFlow": 915,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 33.44,
          "peakFlow": 1463.2,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.78,
          "peakFlow": 170,
          "type": "C/B Interconnector (East)"
        },
        {
          "source": "Nepal (via India)",
          "energy": 0.89,
          "peakFlow": 38,
          "type": "C/B Interconnector (Nepal)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 0,
          "demand": 5451,
          "pct": 0
        },
        {
          "zone": "Chattogram",
          "loadShed": 0,
          "demand": 1560,
          "pct": 0
        },
        {
          "zone": "Khulna",
          "loadShed": 0,
          "demand": 1384,
          "pct": 0
        },
        {
          "zone": "Rajshahi",
          "loadShed": 0,
          "demand": 1391,
          "pct": 0
        },
        {
          "zone": "Cumilla",
          "loadShed": 37,
          "demand": 1420,
          "pct": 2.61
        },
        {
          "zone": "Mymensingh",
          "loadShed": 29,
          "demand": 1141,
          "pct": 2.54
        },
        {
          "zone": "Sylhet",
          "loadShed": 0,
          "demand": 566,
          "pct": 0
        },
        {
          "zone": "Barishal",
          "loadShed": 0,
          "demand": 459,
          "pct": 0
        },
        {
          "zone": "Rangpur",
          "loadShed": 0,
          "demand": 1011,
          "pct": 0
        }
      ],
      "dailyOutages": [
        {
          "time": "09:20 - 12:03",
          "plant": "Bhulta-Haripur 230 kV Ckt-2 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Bus-1 Side CT Test by RTS.",
          "full_desc": "Bhulta-Haripur 230 kV Ckt-2 Scheduled S/D from Bhulta 400/230kV end. and from Haripur 230/132kV end Due to Bus-1 Side CT Test by RTS."
        },
        {
          "time": "10:36",
          "plant": "Kushtia 132/33kV S/S 132 KV Bus-B",
          "load": "HT Outage",
          "reason": "Kushtia 132/33kV S/S 132 KV Bus-B is restored.",
          "full_desc": "Kushtia 132/33kV S/S 132 KV Bus-B is restored."
        },
        {
          "time": "10:45 - 12:50",
          "plant": "Shahjibazar 132/33kV S/S TR-04 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to New Olipur 33 Feeder Install.",
          "full_desc": "Shahjibazar 132/33kV S/S TR-04 HT Scheduled S/D Due to New Olipur 33 Feeder Install."
        },
        {
          "time": "10:45 - 12:50",
          "plant": "Shahjibazar 132/33kV S/S TR-04 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to New Olipur5 33 kV feeder Install.",
          "full_desc": "Shahjibazar 132/33kV S/S TR-04 LT Scheduled S/D Due to New Olipur5 33 kV feeder Install."
        },
        {
          "time": "10:55 - 11:56",
          "plant": "Gopalganj 132/33kV S/S Transformer-03 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33 kv energy meter change.",
          "full_desc": "Gopalganj 132/33kV S/S Transformer-03 LT Scheduled S/D Due to 33 kv energy meter change."
        },
        {
          "time": "10:59 - 11:55",
          "plant": "Gopalganj 132/33kV S/S Transformer-03 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33 kv energy meter change.",
          "full_desc": "Gopalganj 132/33kV S/S Transformer-03 HT Scheduled S/D Due to 33 kv energy meter change."
        },
        {
          "time": "11:15 - 11:47",
          "plant": "Tangail 132/33kV S/S Tr-2 HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Removal rope of Kite",
          "full_desc": "Tangail 132/33kV S/S Tr-2 HT Forced S/D Due to Removal rope of Kite"
        },
        {
          "time": "11:16 - 11:47",
          "plant": "Tangail 132/33kV S/S Tr-2 LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Removal rope of Kite",
          "full_desc": "Tangail 132/33kV S/S Tr-2 LT Forced S/D Due to Removal rope of Kite"
        },
        {
          "time": "12:56 - 14:10",
          "plant": "Benapole 132/33kV S/S Transformer-1(406T) LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Due to redhot maintenance of  Tr 1 (33KV) source DS",
          "full_desc": "Benapole 132/33kV S/S Transformer-1(406T) LT Forced S/D Due to Due to redhot maintenance of  Tr 1 (33KV) source DS"
        },
        {
          "time": "12:57 - 14:09",
          "plant": "Benapole 132/33kV S/S Transformer-1(406T) HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Due to redhot maintenance of  Tr 1 (33KV) source DS",
          "full_desc": "Benapole 132/33kV S/S Transformer-1(406T) HT Forced S/D Due to Due to redhot maintenance of  Tr 1 (33KV) source DS"
        },
        {
          "time": "14:22 - 14:40",
          "plant": "Madanganj 132/33kV S/S Madanganj -Summit 55 MW 132 kv Ckt Tripped showing Directional O/C relays",
          "load": "17.0MW",
          "reason": "Due to Heavy rain and storm",
          "full_desc": "Madanganj 132/33kV S/S Madanganj -Summit 55 MW 132 kv Ckt Tripped showing Directional O/C relays Due to Heavy rain and storm"
        },
        {
          "time": "14:22 - 21:38",
          "plant": "Madanganj 132/33kV S/S Madanganj-Fatullah 132KV Ckt Tripped showing Line distance protection, zone-1 trip, <br> General trip relays",
          "load": "HT Outage",
          "reason": "Due to Heavy rain and storm",
          "full_desc": "Madanganj 132/33kV S/S Madanganj-Fatullah 132KV Ckt Tripped showing Line distance protection, zone-1 trip, <br> General trip relays Due to Heavy rain and storm"
        },
        {
          "time": "15:45 - 16:12",
          "plant": "Khulna (S)-Satkhira 132kV Ckt-1 Tripped from Khulna(S) 230/132kV end showing Distance Relay relays. and from Satkhira 132/33kV end showing E/F Relay,Distance Relay relays",
          "load": "HT Outage",
          "reason": "Due to Bad weather",
          "full_desc": "Khulna (S)-Satkhira 132kV Ckt-1 Tripped from Khulna(S) 230/132kV end showing Distance Relay relays. and from Satkhira 132/33kV end showing E/F Relay,Distance Relay relays Due to Bad weather"
        },
        {
          "time": "16:01 - 16:16",
          "plant": "Saidpur 132/33kV S/S TR-01 HT Forced S/D",
          "load": "20MW",
          "reason": "Due to 20MW side breaker work",
          "full_desc": "Saidpur 132/33kV S/S TR-01 HT Forced S/D Due to 20MW side breaker work"
        },
        {
          "time": "16:14 - 20:52",
          "plant": "Fatullah-Shyampur(New) 132 kV Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "Due to Madanganj Breaker was closed at 20:32 as per the instructions of NLDC",
          "full_desc": "Fatullah-Shyampur(New) 132 kV Ckt-1 Forced S/D from Fatullah 132/33kV end Due to Madanganj Breaker was closed at 20:32 as per the instructions of NLDC"
        },
        {
          "time": "16:20",
          "plant": "Bagerhat 132/33kV S/S Transformer-1 (403T) HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to 33kv B (RYB) phase Underground cable fault.",
          "full_desc": "Bagerhat 132/33kV S/S Transformer-1 (403T) HT Forced S/D Due to 33kv B (RYB) phase Underground cable fault."
        },
        {
          "time": "16:20",
          "plant": "Bagerhat 132/33kV S/S Transformer-1 (403T) LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to 33kv B (RYB) phase Underground cable fault.",
          "full_desc": "Bagerhat 132/33kV S/S Transformer-1 (403T) LT Forced S/D Due to 33kv B (RYB) phase Underground cable fault."
        },
        {
          "time": "16:52 - 20:52",
          "plant": "Shyampur-Shyampur(New) 132kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "for connecting Pot Head to Line (Gantry) by Loop. (shutdown taken by DPDC).",
          "full_desc": "Shyampur-Shyampur(New) 132kV Ckt-1 Scheduled S/D from Shyampur 230/132kV end Due to for connecting Pot Head to Line (Gantry) by Loop. (shutdown taken by DPDC)."
        },
        {
          "time": "18:04",
          "plant": "Bogura 400/230kV S/S Bogura - Naogaon 230 kV Ckt-2",
          "load": "HT Outage",
          "reason": "Bogura 400/230kV S/S Bogura - Naogaon 230 kV Ckt-2 is restored.",
          "full_desc": "Bogura 400/230kV S/S Bogura - Naogaon 230 kV Ckt-2 is restored."
        },
        {
          "time": "18:05",
          "plant": "Bogura 400/230kV S/S Bogura - Naogaon 230 kV Ckt-1",
          "load": "HT Outage",
          "reason": "Bogura 400/230kV S/S Bogura - Naogaon 230 kV Ckt-1 is restored.",
          "full_desc": "Bogura 400/230kV S/S Bogura - Naogaon 230 kV Ckt-1 is restored."
        },
        {
          "time": "18:30",
          "plant": "Korerhat 400/230/132kV S/S ATR-4(7403T) HT",
          "load": "HT Outage",
          "reason": "Korerhat 400/230/132kV S/S ATR-4(7403T) HT is restored.",
          "full_desc": "Korerhat 400/230/132kV S/S ATR-4(7403T) HT is restored."
        },
        {
          "time": "18:32",
          "plant": "Korerhat 400/230/132kV S/S ATR-4(7403T) LT",
          "load": "HT Outage",
          "reason": "Korerhat 400/230/132kV S/S ATR-4(7403T) LT is restored.",
          "full_desc": "Korerhat 400/230/132kV S/S ATR-4(7403T) LT is restored."
        },
        {
          "time": "18:48 - 19:34",
          "plant": "Patuakhali 132/33kV S/S UPPL (150MW) 132kV LINE Tripped showing Under voltage relays.",
          "load": "150MW",
          "reason": "Patuakhali 132/33kV S/S UPPL (150MW) 132kV LINE Tripped showing Under voltage relays.",
          "full_desc": "Patuakhali 132/33kV S/S UPPL (150MW) 132kV LINE Tripped showing Under voltage relays."
        },
        {
          "time": "18:49",
          "plant": "Patuakhali-Payra  132kV Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "Due to R-phase burn out and from Patuakhali 132/33kV end showing Over Voltage relays.",
          "full_desc": "Patuakhali-Payra  132kV Ckt-1 Forced S/D from Payra 400/132/33kV end Due to R-phase burn out and from Patuakhali 132/33kV end showing Over Voltage relays."
        },
        {
          "time": "18:51 - 04:51",
          "plant": "Patuakhali-Payra  132kV Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "Due to By aldc khulana",
          "full_desc": "Patuakhali-Payra  132kV Ckt-1 Forced S/D from Patuakhali 132/33kV end Due to By aldc khulana"
        },
        {
          "time": "18:53",
          "plant": "Ishurdi 230/132kV S/S 230/132 kV T-03 HT",
          "load": "HT Outage",
          "reason": "Ishurdi 230/132kV S/S 230/132 kV T-03 HT is restored.",
          "full_desc": "Ishurdi 230/132kV S/S 230/132 kV T-03 HT is restored."
        },
        {
          "time": "18:55",
          "plant": "Ishurdi 230/132kV S/S 230/132 kV T-03 LT",
          "load": "HT Outage",
          "reason": "Ishurdi 230/132kV S/S 230/132 kV T-03 LT is restored.",
          "full_desc": "Ishurdi 230/132kV S/S 230/132 kV T-03 LT is restored."
        },
        {
          "time": "20:32",
          "plant": "Fatullah-Madanganj 132 kV Ckt-2",
          "load": "HT Outage",
          "reason": "Fatullah-Madanganj 132 kV Ckt-2 is restored.",
          "full_desc": "Fatullah-Madanganj 132 kV Ckt-2 is restored."
        },
        {
          "time": "21:35",
          "plant": "Baghabari-Ishurdi 230 kV Ckt-1",
          "load": "HT Outage",
          "reason": "Baghabari-Ishurdi 230 kV Ckt-1 is restored.",
          "full_desc": "Baghabari-Ishurdi 230 kV Ckt-1 is restored."
        },
        {
          "time": "21:35",
          "plant": "Baghabari-Ishurdi 230 kV Ckt-1",
          "load": "HT Outage",
          "reason": "Baghabari-Ishurdi 230 kV Ckt-1 is restored.",
          "full_desc": "Baghabari-Ishurdi 230 kV Ckt-1 is restored."
        },
        {
          "time": "22:48 - 00:33",
          "plant": "Chuadanga 132/33kV S/S 132kV Tr. T1(416T) LT Scheduled S/D",
          "load": "50.0MW",
          "reason": "Due to Red hot maintenance work.",
          "full_desc": "Chuadanga 132/33kV S/S 132kV Tr. T1(416T) LT Scheduled S/D Due to Red hot maintenance work."
        },
        {
          "time": "22:49 - 00:32",
          "plant": "Chuadanga 132/33kV S/S 132kV Tr. T1(416T) HT Scheduled S/D",
          "load": "50.0MW",
          "reason": "Due to Red hot maintenance work.",
          "full_desc": "Chuadanga 132/33kV S/S 132kV Tr. T1(416T) HT Scheduled S/D Due to Red hot maintenance work."
        },
        {
          "time": "03:20",
          "plant": "Payra 400/132/33kV S/S 400/132/33 kV Auto Transformer-01 HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Red Hot maintenance of  Earth wire",
          "full_desc": "Payra 400/132/33kV S/S 400/132/33 kV Auto Transformer-01 HT Forced S/D Due to Red Hot maintenance of  Earth wire"
        },
        {
          "time": "03:21 - 07:23",
          "plant": "Gopalganj(N)-Payra 400KV Ckt-2 Forced",
          "load": "HT Outage",
          "reason": "Due to There is continuous flashing at the overhead lightining protection grounding cable on the top of the tower between Amtoli 2 Line & Payra 1 Line",
          "full_desc": "Gopalganj(N)-Payra 400KV Ckt-2 Forced S/D from Payra 400kV end Due to There is continuous flashing at the overhead lightining protection grounding cable on the top of the tower between Amtoli 2 Line & Payra 1 Line"
        },
        {
          "time": "03:26 - 07:24",
          "plant": "Amtali 400/132kV S/S Amtali - Payra 400 kV Ckt - 2 Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Work at Payra end",
          "full_desc": "Amtali 400/132kV S/S Amtali - Payra 400 kV Ckt - 2 Scheduled S/D Due to Work at Payra end"
        },
        {
          "time": "04:53",
          "plant": "Payra 400/132/33kV S/S 400/132/33 kV Auto Transformer-02 HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to Earth wire red hot of Bpcl gantry",
          "full_desc": "Payra 400/132/33kV S/S 400/132/33 kV Auto Transformer-02 HT Forced S/D Due to Earth wire red hot of Bpcl gantry"
        },
        {
          "time": "06:28",
          "plant": "Halishahar 132/33kV S/S 405T(TR-1) HT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Ct clamp replacement at 33 kv side",
          "full_desc": "Halishahar 132/33kV S/S 405T(TR-1) HT Project Work S/D Due to Ct clamp replacement at 33 kv side"
        }
      ],
      "hourlyLoadData": [
        {
          "time": "00:00",
          "generation": 14607.18,
          "loadShed": 2152,
          "demand": 16856.18
        },
        {
          "time": "01:00",
          "generation": 14238.5,
          "loadShed": 2116,
          "demand": 16449.72
        },
        {
          "time": "02:00",
          "generation": 13969.84,
          "loadShed": 2027,
          "demand": 16088.06
        },
        {
          "time": "03:00",
          "generation": 13874.8,
          "loadShed": 1931,
          "demand": 15892.7
        },
        {
          "time": "04:00",
          "generation": 13747.18,
          "loadShed": 446,
          "demand": 14213.18
        },
        {
          "time": "05:00",
          "generation": 13577.87,
          "loadShed": 167,
          "demand": 13752.39
        },
        {
          "time": "06:00",
          "generation": 13277.6,
          "loadShed": 166,
          "demand": 13450.6
        },
        {
          "time": "07:00",
          "generation": 13272.28,
          "loadShed": 113,
          "demand": 13390.28
        },
        {
          "time": "08:00",
          "generation": 13413.13,
          "loadShed": 0,
          "demand": 13413.13
        },
        {
          "time": "09:00",
          "generation": 13642.12,
          "loadShed": 0,
          "demand": 13642.12
        },
        {
          "time": "10:00",
          "generation": 13850.7,
          "loadShed": 0,
          "demand": 13850.7
        },
        {
          "time": "11:00",
          "generation": 14101.96,
          "loadShed": 24,
          "demand": 14126.96
        },
        {
          "time": "12:00",
          "generation": 13886.27,
          "loadShed": 445,
          "demand": 14351.27
        },
        {
          "time": "13:00",
          "generation": 13689.86,
          "loadShed": 13,
          "demand": 13703.86
        },
        {
          "time": "14:00",
          "generation": 13406.58,
          "loadShed": 35,
          "demand": 13443.58
        },
        {
          "time": "15:00",
          "generation": 13035.05,
          "loadShed": 73,
          "demand": 13111.05
        },
        {
          "time": "16:00",
          "generation": 13026.29,
          "loadShed": 55,
          "demand": 13083.29
        },
        {
          "time": "17:00",
          "generation": 12801.92,
          "loadShed": 45,
          "demand": 12848.92
        },
        {
          "time": "18:00",
          "generation": 12913.09,
          "loadShed": 30,
          "demand": 12944.09
        },
        {
          "time": "19:00",
          "generation": 14226.28,
          "loadShed": 60,
          "demand": 14289.28
        },
        {
          "time": "19:30",
          "generation": 14783.7,
          "loadShed": 66,
          "demand": 14852.7
        },
        {
          "time": "20:00",
          "generation": 14680.89,
          "loadShed": 80,
          "demand": 14764.89
        },
        {
          "time": "21:00",
          "generation": 14749.79,
          "loadShed": 72,
          "demand": 14824.79
        },
        {
          "time": "22:00",
          "generation": 14548.07,
          "loadShed": 74,
          "demand": 14625.07
        },
        {
          "time": "23:00",
          "generation": 14444.58,
          "loadShed": 75,
          "demand": 14522.96
        }
      ],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 474.5,
          "condensate": 362,
          "share": 17.6
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 140.5,
          "condensate": 627.3,
          "share": 5.2
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 92,
          "condensate": 54.7,
          "share": 3.4
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 912.4,
          "condensate": 4916.5,
          "share": 33.8
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31.6,
          "condensate": 94,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1051.4,
          "condensate": 27.3,
          "share": 38.9
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 259.8,
          "fertilizer": 73,
          "others": 1088.9,
          "total": 1421.8
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 193.7,
          "fertilizer": 0,
          "others": 89.5,
          "total": 283.2
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 38.2,
          "fertilizer": 39.1,
          "others": 177.6,
          "total": 255
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 221.2,
          "fertilizer": 40.3,
          "others": 112.1,
          "total": 373.6
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 126.3,
          "fertilizer": 0,
          "others": 30,
          "total": 156.3
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 54.2,
          "fertilizer": 0,
          "others": 3.4,
          "total": 57.6
        }
      ]
    },
  "2026-06-19": {
      "systemStats": {
        "date": "19 Jun 2026",
        "dayPeakGen": 12701.44,
        "eveningPeakGen": 14958.07,
        "dayPeakDemand": 12701.44,
        "eveningPeakDemand": 15057.35,
        "minGen": 11665.13,
        "maxGen": 14998.98,
        "totalEnergyGen": 317.7872035,
        "totalEnergyUnserved": 1.202,
        "totalEnergyDemand": 318.989,
        "maxTemp": 32,
        "totalGasSuppliedPower": 918.04,
        "avgProductionCost": 6.147,
        "totalDailyCost": 1953566977
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 127.08,
          "cost": 442179221,
          "unitCost": 3.4795,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 105.64,
          "cost": 696809582,
          "unitCost": 6.5961,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 22.1,
          "cost": 412545310,
          "unitCost": 18.6674,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 1.86,
          "cost": 186122,
          "unitCost": 0.1,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 3.64,
          "cost": 57514602,
          "unitCost": 15.8075,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 57.25,
          "cost": 341133595,
          "unitCost": 5.9585,
          "color": "#a855f7"
        },
        {
          "name": "HSD",
          "gen": 0,
          "cost": 0,
          "unitCost": null,
          "color": "#ef4444"
        },
        {
          "name": "Wind",
          "gen": 0.22,
          "cost": 3198542,
          "unitCost": 14.71,
          "color": "#22c55e"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 21.65,
          "peakFlow": 915,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 31.17,
          "peakFlow": 1484.87,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.52,
          "peakFlow": 158,
          "type": "C/B Interconnector (East)"
        },
        {
          "source": "Nepal (via India)",
          "energy": 0.89,
          "peakFlow": 38,
          "type": "C/B Interconnector (Nepal)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 0,
          "demand": 5107,
          "pct": 0
        },
        {
          "zone": "Chattogram",
          "loadShed": 0,
          "demand": 1434,
          "pct": 0
        },
        {
          "zone": "Khulna",
          "loadShed": 0,
          "demand": 1718,
          "pct": 0
        },
        {
          "zone": "Rajshahi",
          "loadShed": 0,
          "demand": 1549,
          "pct": 0
        },
        {
          "zone": "Cumilla",
          "loadShed": 0,
          "demand": 1440,
          "pct": 0
        },
        {
          "zone": "Mymensingh",
          "loadShed": 95,
          "demand": 1254,
          "pct": 7.58
        },
        {
          "zone": "Sylhet",
          "loadShed": 0,
          "demand": 587,
          "pct": 0
        },
        {
          "zone": "Barishal",
          "loadShed": 0,
          "demand": 497,
          "pct": 0
        },
        {
          "zone": "Rangpur",
          "loadShed": 0,
          "demand": 954,
          "pct": 0
        }
      ],
      "dailyOutages": [
        {
          "time": "08:16",
          "plant": "Payra 400/132/33kV S/S 400/132/33 kV Auto Transformer-02 HT",
          "load": "HT Outage",
          "reason": "Payra 400/132/33kV S/S 400/132/33 kV Auto Transformer-02 HT is restored.",
          "full_desc": "Payra 400/132/33kV S/S 400/132/33 kV Auto Transformer-02 HT is restored."
        },
        {
          "time": "08:16",
          "plant": "Payra 400/132/33kV S/S 400/132/33 kV Auto Transformer-01 HT",
          "load": "HT Outage",
          "reason": "Payra 400/132/33kV S/S 400/132/33 kV Auto Transformer-01 HT is restored.",
          "full_desc": "Payra 400/132/33kV S/S 400/132/33 kV Auto Transformer-01 HT is restored."
        },
        {
          "time": "08:26 - 17:46",
          "plant": "Patuakhali-Payra  132kV Ckt-2 Forced",
          "load": "HT Outage",
          "reason": "Due to By aldc khulana",
          "full_desc": "Patuakhali-Payra  132kV Ckt-2 Forced S/D from Patuakhali 132/33kV end Due to By aldc khulana"
        },
        {
          "time": "08:56 - 12:34",
          "plant": "Maniknagar 132/33kV S/S Mero Rail - 2 Scheduled",
          "load": "HT Outage",
          "reason": "for main and backup protection relay.. Work by DPDC...",
          "full_desc": "Maniknagar 132/33kV S/S Mero Rail - 2 Scheduled S/D Due to  Dc supply replacement work with new charger /distribution panel for main and backup protection relay.. Work by DPDC..."
        },
        {
          "time": "09:01 - 12:21",
          "plant": "Sonargaon 132/33kV S/S Tr-1 LT Scheduled S/D",
          "load": "40.0MW",
          "reason": "Due to PBS 33 kv Astha feeder cable heat shrink work",
          "full_desc": "Sonargaon 132/33kV S/S Tr-1 LT Scheduled S/D Due to PBS 33 kv Astha feeder cable heat shrink work"
        },
        {
          "time": "09:01 - 12:20",
          "plant": "Sonargaon 132/33kV S/S Tr-1 HT Scheduled S/D",
          "load": "40.0MW",
          "reason": "Due to PBS 33 kv Astha feeder cable heat shrink work",
          "full_desc": "Sonargaon 132/33kV S/S Tr-1 HT Scheduled S/D Due to PBS 33 kv Astha feeder cable heat shrink work"
        },
        {
          "time": "09:01 - 09:14",
          "plant": "Kishoreganj-Mymensingh  132kV Ckt-2 Tripped from Bajitpur 132/33kV end showing REL670 relays",
          "load": "HT Outage",
          "reason": "Due to Z-1,B-phase Trip",
          "full_desc": "Kishoreganj-Mymensingh  132kV Ckt-2 Tripped from Bajitpur 132/33kV end showing REL670 relays Due to Z-1,B-phase Trip"
        },
        {
          "time": "09:04 - 09:36",
          "plant": "Saidpur 132/33kV S/S TR-3 (424T) LT Scheduled S/D",
          "load": "20.0MW",
          "reason": "Due to 33kv parbatipur Nesco feeder Y-phase raiser loop change.",
          "full_desc": "Saidpur 132/33kV S/S TR-3 (424T) LT Scheduled S/D Due to 33kv parbatipur Nesco feeder Y-phase raiser loop change."
        },
        {
          "time": "09:05 - 09:35",
          "plant": "Saidpur 132/33kV S/S TR-3 (424T) HT Scheduled S/D",
          "load": "20.0MW",
          "reason": "Due to 33kv parbatipur Nesco feeder Y-phase raiser loop change.",
          "full_desc": "Saidpur 132/33kV S/S TR-3 (424T) HT Scheduled S/D Due to 33kv parbatipur Nesco feeder Y-phase raiser loop change."
        },
        {
          "time": "09:12",
          "plant": "Brahmanbaria-Shahjibazar 132 kV Ckt-2",
          "load": "HT Outage",
          "reason": "Brahmanbaria-Shahjibazar 132 kV Ckt-2 is restored.",
          "full_desc": "Brahmanbaria-Shahjibazar 132 kV Ckt-2 is restored."
        },
        {
          "time": "09:12",
          "plant": "Brahmanbaria-Shahjibazar 132 kV Ckt-1",
          "load": "HT Outage",
          "reason": "Brahmanbaria-Shahjibazar 132 kV Ckt-1 is restored.",
          "full_desc": "Brahmanbaria-Shahjibazar 132 kV Ckt-1 is restored."
        },
        {
          "time": "09:15 - 10:17",
          "plant": "Dohazari 132/33kV S/S Power Transformer -T-2 LT Scheduled S/D",
          "load": "33.0MW",
          "reason": "Due to Due to keranihat 33 kv feeder Redhot maintenance.",
          "full_desc": "Dohazari 132/33kV S/S Power Transformer -T-2 LT Scheduled S/D Due to Due to keranihat 33 kv feeder Redhot maintenance."
        },
        {
          "time": "09:15 - 10:17",
          "plant": "Dohazari 132/33kV S/S Power Transformer -T-2 HT Scheduled S/D",
          "load": "33.0MW",
          "reason": "Due to Due to keranihat 33 kv feeder Redhot maintenance",
          "full_desc": "Dohazari 132/33kV S/S Power Transformer -T-2 HT Scheduled S/D Due to Due to keranihat 33 kv feeder Redhot maintenance"
        },
        {
          "time": "09:20 - 15:59",
          "plant": "Kaliakoir 400/230/132kV S/S 400/132kV TR-3 LT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Extension of Main Bus-2",
          "full_desc": "Kaliakoir 400/230/132kV S/S 400/132kV TR-3 LT Project Work S/D Due to Extension of Main Bus-2"
        },
        {
          "time": "09:26 - 15:50",
          "plant": "Kaliakoir 400/230/132kV S/S 400/132kV TR-3 HT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Extension of Main Bus-2",
          "full_desc": "Kaliakoir 400/230/132kV S/S 400/132kV TR-3 HT Project Work S/D Due to Extension of Main Bus-2"
        },
        {
          "time": "09:53 - 15:40",
          "plant": "Kaliakoir 400/230/132kV S/S 400kV Bus 2 Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Extension of 400kV Bus-2",
          "full_desc": "Kaliakoir 400/230/132kV S/S 400kV Bus 2 Project Work S/D Due to Extension of 400kV Bus-2"
        },
        {
          "time": "11:33 - 13:07",
          "plant": "Maniknagar 132/33kV S/S Transformer GT-1 HT Scheduled",
          "load": "HT Outage",
          "reason": "for main and backup protection relay Work by DPDC..",
          "full_desc": "Maniknagar 132/33kV S/S Transformer GT-1 HT Scheduled S/D Due to Dc supply replacement work with new charger /distribution panel for main and backup protection relay Work by DPDC.."
        },
        {
          "time": "14:14",
          "plant": "Halishahar 132/33kV S/S 405T(TR-1) HT",
          "load": "HT Outage",
          "reason": "Halishahar 132/33kV S/S 405T(TR-1) HT is restored.",
          "full_desc": "Halishahar 132/33kV S/S 405T(TR-1) HT is restored."
        },
        {
          "time": "14:34",
          "plant": "Ashuganj-Brahmanbaria 132kV Ckt-1",
          "load": "HT Outage",
          "reason": "Ashuganj-Brahmanbaria 132kV Ckt-1 is restored.",
          "full_desc": "Ashuganj-Brahmanbaria 132kV Ckt-1 is restored."
        },
        {
          "time": "15:14",
          "plant": "New Tongi S/S T1(403T) LT",
          "load": "HT Outage",
          "reason": "New Tongi S/S T1(403T) LT is restored.",
          "full_desc": "New Tongi S/S T1(403T) LT is restored."
        },
        {
          "time": "15:16 - 15:56",
          "plant": "Maniknagar 132/33kV S/S Transformer GT-2 HT Scheduled",
          "load": "HT Outage",
          "reason": "for control and relay panel",
          "full_desc": "Maniknagar 132/33kV S/S Transformer GT-2 HT Scheduled S/D Due to New DC connection for control and relay panel"
        },
        {
          "time": "15:44 - 17:45",
          "plant": "Patuakhali-Payra  132kV Ckt-2 Forced",
          "load": "HT Outage",
          "reason": "Due to Red Hot maintenance",
          "full_desc": "Patuakhali-Payra  132kV Ckt-2 Forced S/D from Payra 400/132/33kV end Due to Red Hot maintenance"
        },
        {
          "time": "16:49",
          "plant": "Bagerhat 132/33kV S/S Transformer-1 (403T) HT",
          "load": "HT Outage",
          "reason": "Bagerhat 132/33kV S/S Transformer-1 (403T) HT is restored.",
          "full_desc": "Bagerhat 132/33kV S/S Transformer-1 (403T) HT is restored."
        },
        {
          "time": "16:50",
          "plant": "Bagerhat 132/33kV S/S Transformer-1 (403T) LT",
          "load": "HT Outage",
          "reason": "Bagerhat 132/33kV S/S Transformer-1 (403T) LT is restored.",
          "full_desc": "Bagerhat 132/33kV S/S Transformer-1 (403T) LT is restored."
        },
        {
          "time": "17:54",
          "plant": "Patuakhali-Payra  132kV Ckt-1",
          "load": "HT Outage",
          "reason": "Patuakhali-Payra  132kV Ckt-1 is restored.",
          "full_desc": "Patuakhali-Payra  132kV Ckt-1 is restored."
        },
        {
          "time": "22:52",
          "plant": "Ashuganj 420 MW CCPP (East) GT",
          "load": "420 MW",
          "reason": "Ashuganj 420 MW CCPP (East) GT was sync.",
          "full_desc": "Ashuganj 420 MW CCPP (East) GT was sync."
        },
        {
          "time": "05:24",
          "plant": "Ashuganj 420 MW CCPP (East) ST",
          "load": "420 MW",
          "reason": "Ashuganj 420 MW CCPP (East) ST was sync.",
          "full_desc": "Ashuganj 420 MW CCPP (East) ST was sync."
        },
        {
          "time": "06:52",
          "plant": "Maniknagar-Siddhirganj 230kV Ckt-2 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Repair of sky wire and from Siddhirganj 230/132kV end Due to OPGW Replacement work between 10-13 No tower.",
          "full_desc": "Maniknagar-Siddhirganj 230kV Ckt-2 Scheduled S/D from Maniknagar 230/132kV end Due to Repair of sky wire and from Siddhirganj 230/132kV end Due to OPGW Replacement work between 10-13 No tower."
        }
      ],
      "hourlyLoadData": [
        {
          "time": "00:00",
          "generation": 14449.13,
          "loadShed": 150,
          "demand": 14605.88
        },
        {
          "time": "01:00",
          "generation": 14306.23,
          "loadShed": 131,
          "demand": 14443.13
        },
        {
          "time": "02:00",
          "generation": 13626.6,
          "loadShed": 127,
          "demand": 13759.32
        },
        {
          "time": "03:00",
          "generation": 13183.89,
          "loadShed": 113,
          "demand": 13301.98
        },
        {
          "time": "04:00",
          "generation": 12846.92,
          "loadShed": 92,
          "demand": 12943.06
        },
        {
          "time": "05:00",
          "generation": 12641.58,
          "loadShed": 88,
          "demand": 12733.54
        },
        {
          "time": "06:00",
          "generation": 11960.31,
          "loadShed": 79,
          "demand": 12042.87
        },
        {
          "time": "07:00",
          "generation": 11954.63,
          "loadShed": 47,
          "demand": 12003.75
        },
        {
          "time": "08:00",
          "generation": 12034.57,
          "loadShed": 30,
          "demand": 12065.57
        },
        {
          "time": "09:00",
          "generation": 11911.85,
          "loadShed": 30,
          "demand": 11942.85
        },
        {
          "time": "10:00",
          "generation": 11665.13,
          "loadShed": 0,
          "demand": 11665.13
        },
        {
          "time": "11:00",
          "generation": 12035.93,
          "loadShed": 0,
          "demand": 12035.93
        },
        {
          "time": "12:00",
          "generation": 12701.44,
          "loadShed": 0,
          "demand": 12701.44
        },
        {
          "time": "13:00",
          "generation": 13448.7,
          "loadShed": 0,
          "demand": 13448.7
        },
        {
          "time": "14:00",
          "generation": 13018.56,
          "loadShed": 0,
          "demand": 13018.56
        },
        {
          "time": "15:00",
          "generation": 12930.12,
          "loadShed": 0,
          "demand": 12930.12
        },
        {
          "time": "16:00",
          "generation": 12576.99,
          "loadShed": 0,
          "demand": 12576.99
        },
        {
          "time": "17:00",
          "generation": 12164.86,
          "loadShed": 0,
          "demand": 12164.86
        },
        {
          "time": "18:00",
          "generation": 11961.95,
          "loadShed": 0,
          "demand": 11961.95
        },
        {
          "time": "19:00",
          "generation": 13225.01,
          "loadShed": 0,
          "demand": 13225.01
        },
        {
          "time": "19:30",
          "generation": 14492.37,
          "loadShed": 45,
          "demand": 14539.4
        },
        {
          "time": "20:00",
          "generation": 14431.75,
          "loadShed": 50,
          "demand": 14483.75
        },
        {
          "time": "21:00",
          "generation": 14958.07,
          "loadShed": 95,
          "demand": 15057.35
        },
        {
          "time": "22:00",
          "generation": 14932.57,
          "loadShed": 80,
          "demand": 15016.17
        },
        {
          "time": "23:00",
          "generation": 14998.98,
          "loadShed": 90,
          "demand": 15093.03
        }
      ],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 478.6,
          "condensate": 369,
          "share": 17.7
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 139.9,
          "condensate": 622.4,
          "share": 5.2
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 92.4,
          "condensate": 58.6,
          "share": 3.4
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 910.8,
          "condensate": 4871.1,
          "share": 33.7
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31.5,
          "condensate": 94,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1050.5,
          "condensate": 27.3,
          "share": 38.9
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 275.8,
          "fertilizer": 72.9,
          "others": 1070.5,
          "total": 1419.2
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 211.9,
          "fertilizer": 0,
          "others": 84.4,
          "total": 296.3
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 38.4,
          "fertilizer": 39,
          "others": 147.2,
          "total": 224.6
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 223.3,
          "fertilizer": 40.3,
          "others": 105.3,
          "total": 368.9
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 127.9,
          "fertilizer": 0,
          "others": 26.9,
          "total": 154.8
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 54.2,
          "fertilizer": 0,
          "others": 4.1,
          "total": 58.4
        }
      ]
    },
  "2026-06-20": {
      "systemStats": {
        "date": "20 Jun 2026",
        "dayPeakGen": 13823.66,
        "eveningPeakGen": 15782.47,
        "dayPeakDemand": null,
        "eveningPeakDemand": 17749.16,
        "minGen": null,
        "maxGen": null,
        "totalEnergyGen": 341.5720875,
        "totalEnergyUnserved": null,
        "totalEnergyDemand": null,
        "maxTemp": null,
        "totalGasSuppliedPower": 908.5,
        "avgProductionCost": 6.952,
        "totalDailyCost": 2374775310
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 127.31,
          "cost": null,
          "unitCost": null,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 111.85,
          "cost": null,
          "unitCost": null,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 42.33,
          "cost": null,
          "unitCost": null,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 1.95,
          "cost": null,
          "unitCost": null,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 3.74,
          "cost": null,
          "unitCost": null,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 54.02,
          "cost": null,
          "unitCost": null,
          "color": "#a855f7"
        },
        {
          "name": "HSD (Diesel)",
          "gen": 0,
          "cost": null,
          "unitCost": null,
          "color": "#ef4444"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 14.45,
          "peakFlow": 381,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 34.91,
          "peakFlow": 1475.41,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.75,
          "peakFlow": 166,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 192,
          "demand": 6036,
          "pct": 3.18
        },
        {
          "zone": "Chattogram",
          "loadShed": 86,
          "demand": 1634,
          "pct": 5.26
        },
        {
          "zone": "Khulna",
          "loadShed": 401,
          "demand": 2127,
          "pct": 18.85
        },
        {
          "zone": "Rajshahi",
          "loadShed": 322,
          "demand": 1796,
          "pct": 17.93
        },
        {
          "zone": "Cumilla",
          "loadShed": 325,
          "demand": 1711,
          "pct": 18.99
        },
        {
          "zone": "Mymensingh",
          "loadShed": 322,
          "demand": 1423,
          "pct": 22.63
        },
        {
          "zone": "Sylhet",
          "loadShed": 2,
          "demand": 677,
          "pct": 0.3
        },
        {
          "zone": "Barishal",
          "loadShed": 9,
          "demand": 548,
          "pct": 1.64
        },
        {
          "zone": "Rangpur",
          "loadShed": 223,
          "demand": 1126,
          "pct": 19.8
        }
      ],
      "dailyOutages": [
        {
          "time": "08:47 - 14:43",
          "plant": "Naogaon-Niyamatpur  132kV Ckt-1 Project Work",
          "load": "HT Outage",
          "reason": "Naogaon-Niyamatpur  132kV Ckt-1 Project Work S/D from Niamatpur 132/33kV end.",
          "full_desc": "Naogaon-Niyamatpur  132kV Ckt-1 Project Work S/D from Niamatpur 132/33kV end."
        },
        {
          "time": "08:48 - 14:40",
          "plant": "Niamatpur 132/33kV S/S 132 kV Naogaon ckt-2 Project Work S/D",
          "load": "HT Outage",
          "reason": "Niamatpur 132/33kV S/S 132 kV Naogaon ckt-2 Project Work S/D",
          "full_desc": "Niamatpur 132/33kV S/S 132 kV Naogaon ckt-2 Project Work S/D"
        },
        {
          "time": "08:53 - 10:36",
          "plant": "Pabna 132/33kV S/S T-2 LT Forced S/D",
          "load": "HT Outage",
          "reason": "Pabna 132/33kV S/S T-2 LT Forced S/D",
          "full_desc": "Pabna 132/33kV S/S T-2 LT Forced S/D"
        },
        {
          "time": "08:57 - 10:35",
          "plant": "Pabna 132/33kV S/S T-2 HT Forced S/D",
          "load": "HT Outage",
          "reason": "Pabna 132/33kV S/S T-2 HT Forced S/D",
          "full_desc": "Pabna 132/33kV S/S T-2 HT Forced S/D"
        },
        {
          "time": "09:00 - 14:04",
          "plant": "Shahjibazar 132/33kV S/S TR-06 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Shahjibazar 132/33kV S/S TR-06 LT Scheduled S/D",
          "full_desc": "Shahjibazar 132/33kV S/S TR-06 LT Scheduled S/D"
        },
        {
          "time": "09:02 - 14:03",
          "plant": "Shahjibazar 132/33kV S/S TR-06 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Shahjibazar 132/33kV S/S TR-06 HT Scheduled S/D",
          "full_desc": "Shahjibazar 132/33kV S/S TR-06 HT Scheduled S/D"
        },
        {
          "time": "09:24 - 16:49",
          "plant": "Kaliakoir 400/230/132kV S/S 400/132kV TR-3 HT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to BBK 400kV TL Project work",
          "full_desc": "Kaliakoir 400/230/132kV S/S 400/132kV TR-3 HT Project Work S/D Due to BBK 400kV TL Project work"
        },
        {
          "time": "09:25 - 16:50",
          "plant": "Kaliakoir 400/230/132kV S/S 400/132kV TR-3 LT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to BBK 400 KV Tl Project Work",
          "full_desc": "Kaliakoir 400/230/132kV S/S 400/132kV TR-3 LT Project Work S/D Due to BBK 400 KV Tl Project Work"
        },
        {
          "time": "09:36 - 16:40",
          "plant": "Kaliakoir 400/230/132kV S/S 400kV Bus 2 Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to B B K 400kV  TL Project Work",
          "full_desc": "Kaliakoir 400/230/132kV S/S 400kV Bus 2 Project Work S/D Due to B B K 400kV  TL Project Work"
        },
        {
          "time": "09:57 - 11:31",
          "plant": "Daganbhuiyan 132/33kV S/S Transformer-2 HT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Fuse Check & Change of Auxiliary X-Former -02 of X-former -02",
          "full_desc": "Daganbhuiyan 132/33kV S/S Transformer-2 HT Project Work S/D Due to Fuse Check & Change of Auxiliary X-Former -02 of X-former -02"
        },
        {
          "time": "09:57 - 11:32",
          "plant": "Daganbhuiyan 132/33kV S/S Transformer-2 LT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Auxiliary x-former-02 fuse Check & change of transformer -02",
          "full_desc": "Daganbhuiyan 132/33kV S/S Transformer-2 LT Project Work S/D Due to Auxiliary x-former-02 fuse Check & change of transformer -02"
        },
        {
          "time": "10:30 - 12:30",
          "plant": "Purbasadipur 230/132/33kV S/S AIS Old T-4 Transformer LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Maintenance worj",
          "full_desc": "Purbasadipur 230/132/33kV S/S AIS Old T-4 Transformer LT Scheduled S/D Due to Maintenance worj"
        },
        {
          "time": "10:31 - 12:29",
          "plant": "Purbasadipur 230/132/33kV S/S AIS Old T-4 Transformer HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Maintenance Work",
          "full_desc": "Purbasadipur 230/132/33kV S/S AIS Old T-4 Transformer HT Scheduled S/D Due to Maintenance Work"
        },
        {
          "time": "11:16 - 14:53",
          "plant": "Mahasthangarh 132/33kV S/S 406T MTR1 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to NESCO 33kv feeder redhot",
          "full_desc": "Mahasthangarh 132/33kV S/S 406T MTR1 LT Scheduled S/D Due to NESCO 33kv feeder redhot"
        },
        {
          "time": "11:16 - 19:33",
          "plant": "Korerhat 400/230/132kV S/S ATR-4(7403T) LT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Project Work",
          "full_desc": "Korerhat 400/230/132kV S/S ATR-4(7403T) LT Project Work S/D Due to Project Work"
        },
        {
          "time": "11:17 - 19:31",
          "plant": "Korerhat 400/230/132kV S/S ATR-4(7403T) HT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to Project Work",
          "full_desc": "Korerhat 400/230/132kV S/S ATR-4(7403T) HT Project Work S/D Due to Project Work"
        },
        {
          "time": "11:17 - 14:52",
          "plant": "Mahasthangarh 132/33kV S/S 406T MTR1 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to NESCO 33kv feeder redhot",
          "full_desc": "Mahasthangarh 132/33kV S/S 406T MTR1 HT Scheduled S/D Due to NESCO 33kv feeder redhot"
        },
        {
          "time": "12:00",
          "plant": "Day Peak Generation",
          "load": "13823 MW",
          "reason": "Day Peak Generation is 13823 MW.",
          "full_desc": "Day Peak Generation is 13823 MW."
        },
        {
          "time": "13:50 - 17:47",
          "plant": "Chhatak 132/33kV S/S T-3 LT Scheduled",
          "load": "HT Outage",
          "reason": "for CB replacement of 33KV Companyganj PBS Feeder",
          "full_desc": "Chhatak 132/33kV S/S T-3 LT Scheduled S/D Due to Shutdown for CB replacement of 33KV Companyganj PBS Feeder"
        },
        {
          "time": "13:51 - 17:46",
          "plant": "Chhatak 132/33kV S/S T-3 HT Scheduled",
          "load": "HT Outage",
          "reason": "for CB replacement of 33KV Companyganj PBS Feeder.",
          "full_desc": "Chhatak 132/33kV S/S T-3 HT Scheduled S/D Due to Shutdown for CB replacement of 33KV Companyganj PBS Feeder."
        },
        {
          "time": "15:45 - 16:40",
          "plant": "Kulaura 132/33kV S/S TR-1 AB LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33kv REB-1 feeder bus DS redhot maintenance.shutdown taken by Abdullah al Mamun,AGM Kulaura,PBS",
          "full_desc": "Kulaura 132/33kV S/S TR-1 AB LT Scheduled S/D Due to 33kv REB-1 feeder bus DS redhot maintenance.shutdown taken by Abdullah al Mamun,AGM Kulaura,PBS"
        },
        {
          "time": "15:46 - 16:39",
          "plant": "Kulaura 132/33kV S/S TR-1 AB HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to 33kv REB-1 feeder bus DS redhot maintenance.shutdown taken by Abdullah al Mamun,AGM Kulaura,PBS",
          "full_desc": "Kulaura 132/33kV S/S TR-1 AB HT Scheduled S/D Due to 33kv REB-1 feeder bus DS redhot maintenance.shutdown taken by Abdullah al Mamun,AGM Kulaura,PBS"
        },
        {
          "time": "16:10 - 17:48",
          "plant": "Madanganj 132/33kV S/S BUS Coupler Forced S/D",
          "load": "HT Outage",
          "reason": "Due to 132 kv Haripur ckt-1  R phase Reserve Bus DS  Finger Maintenance work",
          "full_desc": "Madanganj 132/33kV S/S BUS Coupler Forced S/D Due to 132 kv Haripur ckt-1  R phase Reserve Bus DS  Finger Maintenance work"
        },
        {
          "time": "20:08 - 21:18",
          "plant": "Bagerhat-Mongla 132 kV Ckt-2 Project Work",
          "load": "HT Outage",
          "reason": "Due to R Phase Disc insulator change",
          "full_desc": "Bagerhat-Mongla 132 kV Ckt-2 Project Work S/D from Bagerhat 132/33kV end Due to R Phase Disc insulator change"
        },
        {
          "time": "21:00",
          "plant": "Evening Peak Generation",
          "load": "15782 MW",
          "reason": "Evening Peak Generation is 15782 MW.",
          "full_desc": "Evening Peak Generation is 15782 MW."
        },
        {
          "time": "05:30",
          "plant": "Jashore 132/33kV S/S T-1 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to repair work of 33/.4 kv, 200 KVA Auxiliary Transformer.",
          "full_desc": "Jashore 132/33kV S/S T-1 LT Scheduled S/D Due to repair work of 33/.4 kv, 200 KVA Auxiliary Transformer."
        },
        {
          "time": "05:30",
          "plant": "Jashore 132/33kV S/S T-1 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to repair work of 33/.4 kv, 200 KVA Auxiliary Transformer.",
          "full_desc": "Jashore 132/33kV S/S T-1 HT Scheduled S/D Due to repair work of 33/.4 kv, 200 KVA Auxiliary Transformer."
        }
      ],
      "hourlyLoadData": [],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 478.2,
          "condensate": 374.1,
          "share": 17.7
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 139.8,
          "condensate": 633.9,
          "share": 5.2
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 93,
          "condensate": 55.9,
          "share": 3.4
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 908.8,
          "condensate": 4827.4,
          "share": 33.7
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31.4,
          "condensate": 95,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1046.2,
          "condensate": 27.1,
          "share": 38.8
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 268.5,
          "fertilizer": 72.9,
          "others": 1105.2,
          "total": 1446.5
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 210.6,
          "fertilizer": 0,
          "others": 86.6,
          "total": 297.2
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 38.1,
          "fertilizer": 38.7,
          "others": 173.4,
          "total": 250.2
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 221,
          "fertilizer": 40.2,
          "others": 112.5,
          "total": 373.7
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 127.4,
          "fertilizer": 0,
          "others": 29,
          "total": 156.4
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 54.1,
          "fertilizer": 0,
          "others": 4.4,
          "total": 58.5
        }
      ]
    },
  "2026-06-21": {
      "systemStats": {
        "date": "21 Jun 2026",
        "dayPeakGen": 14066.19,
        "eveningPeakGen": 14649.64,
        "dayPeakDemand": 15930.43,
        "eveningPeakDemand": 14695.64,
        "minGen": 12844.11,
        "maxGen": 15034.74,
        "totalEnergyGen": 338.69261397,
        "totalEnergyUnserved": 28.088,
        "totalEnergyDemand": 366.781,
        "maxTemp": 34.2,
        "totalGasSuppliedPower": 902.57,
        "avgProductionCost": 6.864,
        "totalDailyCost": 2324950073
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 124.74,
          "cost": 431952131,
          "unitCost": 3.4627,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 117.61,
          "cost": 774503636,
          "unitCost": 6.5854,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 39.85,
          "cost": 745807057,
          "unitCost": 18.7166,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 2.67,
          "cost": 266924,
          "unitCost": 0.1,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 2.16,
          "cost": 32953239,
          "unitCost": 15.2298,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 51.19,
          "cost": 332554560,
          "unitCost": 6.4965,
          "color": "#a855f7"
        },
        {
          "name": "HSD",
          "gen": 0,
          "cost": 0,
          "unitCost": null,
          "color": "#ef4444"
        },
        {
          "name": "Wind",
          "gen": 0.47,
          "cost": 6912523,
          "unitCost": 14.71,
          "color": "#22c55e"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 11.39,
          "peakFlow": 476,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 35.26,
          "peakFlow": 1479.64,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.62,
          "peakFlow": 122,
          "type": "C/B Interconnector (East)"
        },
        {
          "source": "Nepal (via India)",
          "energy": 0.89,
          "peakFlow": 38,
          "type": "C/B Interconnector (Nepal)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 0,
          "demand": 5376,
          "pct": 0
        },
        {
          "zone": "Chattogram",
          "loadShed": 0,
          "demand": 1491,
          "pct": 0
        },
        {
          "zone": "Khulna",
          "loadShed": 34,
          "demand": 1792,
          "pct": 1.9
        },
        {
          "zone": "Rajshahi",
          "loadShed": 10,
          "demand": 1476,
          "pct": 0.68
        },
        {
          "zone": "Cumilla",
          "loadShed": 0,
          "demand": 1308,
          "pct": 0
        },
        {
          "zone": "Mymensingh",
          "loadShed": 0,
          "demand": 1046,
          "pct": 0
        },
        {
          "zone": "Sylhet",
          "loadShed": 0,
          "demand": 540,
          "pct": 0
        },
        {
          "zone": "Barishal",
          "loadShed": 0,
          "demand": 502,
          "pct": 0
        },
        {
          "zone": "Rangpur",
          "loadShed": 0,
          "demand": 970,
          "pct": 0
        }
      ],
      "dailyOutages": [
        {
          "time": "10:05 - 10:40",
          "plant": "Shahjadpur 132/33kV S/S T-2(415T) LT Forced",
          "load": "8.0MW",
          "reason": "for red hot maintenance",
          "full_desc": "Shahjadpur 132/33kV S/S T-2(415T) LT Forced S/D Due to SD taken by Shahjadpur -01 33Kv feeder for red hot maintenance"
        },
        {
          "time": "10:39",
          "plant": "Jashore 132/33kV S/S T-1 HT",
          "load": "HT Outage",
          "reason": "Jashore 132/33kV S/S T-1 HT is restored.",
          "full_desc": "Jashore 132/33kV S/S T-1 HT is restored."
        },
        {
          "time": "10:40",
          "plant": "Jashore 132/33kV S/S T-1 LT",
          "load": "HT Outage",
          "reason": "Jashore 132/33kV S/S T-1 LT is restored.",
          "full_desc": "Jashore 132/33kV S/S T-1 LT is restored."
        },
        {
          "time": "11:07 - 12:44",
          "plant": "Daganbhuiyan 132/33kV S/S Transformer-2 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to HRC fuse change of auxilary transformer",
          "full_desc": "Daganbhuiyan 132/33kV S/S Transformer-2 LT Scheduled S/D Due to HRC fuse change of auxilary transformer"
        },
        {
          "time": "11:07 - 12:43",
          "plant": "Daganbhuiyan 132/33kV S/S Transformer-2 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to HRC fuse change of auxilary transformer",
          "full_desc": "Daganbhuiyan 132/33kV S/S Transformer-2 HT Scheduled S/D Due to HRC fuse change of auxilary transformer"
        },
        {
          "time": "11:21",
          "plant": "Haripur 412 MW CCPP Tripped with remarks:- ST",
          "load": "412 MW",
          "reason": "Haripur 412 MW CCPP Tripped with remarks:- ST",
          "full_desc": "Haripur 412 MW CCPP Tripped with remarks:- ST"
        },
        {
          "time": "13:11",
          "plant": "Brahmanbaria-Narsinghdi 132 kV Ckt-1",
          "load": "HT Outage",
          "reason": "Brahmanbaria-Narsinghdi 132 kV Ckt-1 is restored.",
          "full_desc": "Brahmanbaria-Narsinghdi 132 kV Ckt-1 is restored."
        },
        {
          "time": "13:11",
          "plant": "Brahmanbaria-Narsinghdi 132 kV Ckt-2",
          "load": "HT Outage",
          "reason": "Brahmanbaria-Narsinghdi 132 kV Ckt-2 is restored.",
          "full_desc": "Brahmanbaria-Narsinghdi 132 kV Ckt-2 is restored."
        },
        {
          "time": "14:01",
          "plant": "Haripur 412 MW CCPP Synchronized with remarks:- STG Sync ( This",
          "load": "412 MW",
          "reason": "Haripur 412 MW CCPP Synchronized with remarks:- STG Sync ( This is False SMS).",
          "full_desc": "Haripur 412 MW CCPP Synchronized with remarks:- STG Sync ( This is False SMS)."
        },
        {
          "time": "14:51 - 15:47",
          "plant": "Bhaluka 132/33kV S/S BR Powergen Ckt- 01 Tripped showing R phase zone 2 relays",
          "load": "63.0MW",
          "reason": "Due to Power plant trip",
          "full_desc": "Bhaluka 132/33kV S/S BR Powergen Ckt- 01 Tripped showing R phase zone 2 relays Due to Power plant trip"
        },
        {
          "time": "15:47 - 17:11",
          "plant": "Faridpur 132/33kV S/S 230kV Faridpur-Gopalganj CKT-2 Scheduled S/D",
          "load": "HT Outage",
          "reason": "Faridpur 132/33kV S/S 230kV Faridpur-Gopalganj CKT-2 Scheduled S/D",
          "full_desc": "Faridpur 132/33kV S/S 230kV Faridpur-Gopalganj CKT-2 Scheduled S/D"
        },
        {
          "time": "15:48 - 17:10",
          "plant": "Gopalganj 400/132kV S/S 230kV Faridpur CKT-02 Forced S/D",
          "load": "HT Outage",
          "reason": "Gopalganj 400/132kV S/S 230kV Faridpur CKT-02 Forced S/D",
          "full_desc": "Gopalganj 400/132kV S/S 230kV Faridpur CKT-02 Forced S/D"
        },
        {
          "time": "16:47",
          "plant": "Haripur 412 MW CCPP Synchronized with remarks:- ST",
          "load": "412 MW",
          "reason": "Haripur 412 MW CCPP Synchronized with remarks:- ST",
          "full_desc": "Haripur 412 MW CCPP Synchronized with remarks:- ST"
        },
        {
          "time": "16:55 - 18:07",
          "plant": "Aminbazar-Manikgonj PP 132kV Ckt-1 Tripped from Aminbazar 400/230/132kV end showing Over Current relays",
          "load": "120.0MW",
          "reason": "Due to Over load",
          "full_desc": "Aminbazar-Manikgonj PP 132kV Ckt-1 Tripped from Aminbazar 400/230/132kV end showing Over Current relays Due to Over load"
        },
        {
          "time": "17:05 - 17:24",
          "plant": "Mahasthangarh 132/33kV S/S 416T MTR 2 LT Tripped showing P 142 relays",
          "load": "38.0MW",
          "reason": "Due to PBS Durgapur 33 kv feeder fault.",
          "full_desc": "Mahasthangarh 132/33kV S/S 416T MTR 2 LT Tripped showing P 142 relays Due to PBS Durgapur 33 kv feeder fault."
        },
        {
          "time": "17:11 - 21:06",
          "plant": "Rampura-Ullon-2  132kV Ckt-2 Tripped from Rampura 230/132kV end showing Distance protection 21/2: Z1 ,CN relays",
          "load": "HT Outage",
          "reason": "Due to Unknown",
          "full_desc": "Rampura-Ullon-2  132kV Ckt-2 Tripped from Rampura 230/132kV end showing Distance protection 21/2: Z1 ,CN relays Due to Unknown"
        },
        {
          "time": "17:23",
          "plant": "Bhandaria- Barishal(N) ckt 1&2 trippedby showing Distance Phase-ABC from Bhandaria end.",
          "load": "HT Outage",
          "reason": "Bhandaria- Barishal(N) ckt 1&2 trippedby showing Distance Phase-ABC from Bhandaria end.",
          "full_desc": "Bhandaria- Barishal(N) ckt 1&2 trippedby showing Distance Phase-ABC from Bhandaria end."
        },
        {
          "time": "17:26",
          "plant": "Madaripur-Shariatpur  132kV Ckt-1 Tripped from Shariatpur 132/33kV end showing Distance Relay (Main Protection). <br> Protection Lockout (Backup Protection) relays",
          "load": "HT Outage",
          "reason": "Due to Distance Trip (Main Protection Operate). <br> Zcom Trip.",
          "full_desc": "Madaripur-Shariatpur  132kV Ckt-1 Tripped from Shariatpur 132/33kV end showing Distance Relay (Main Protection). <br> Protection Lockout (Backup Protection) relays Due to Distance Trip (Main Protection Operate). <br> Zcom Trip."
        },
        {
          "time": "17:34 - 18:21",
          "plant": "Keraniganj-Sreenagar 132kV Ckt-1 Tripped from Keranigonj 230/132/33kV end showing Distance Relay. relays",
          "load": "1.0MW",
          "reason": "Due to Bad weather and thundering.",
          "full_desc": "Keraniganj-Sreenagar 132kV Ckt-1 Tripped from Keranigonj 230/132/33kV end showing Distance Relay. relays Due to Bad weather and thundering."
        },
        {
          "time": "17:34 - 18:45",
          "plant": "Keraniganj-Sreenagar (T at Powerpac 100MW) 132kV Ckt-2 Tripped from Keranigonj 230/132/33kV end showing Distance Relay relays",
          "load": "1.0MW",
          "reason": "Due to Bad weather and thundering.",
          "full_desc": "Keraniganj-Sreenagar (T at Powerpac 100MW) 132kV Ckt-2 Tripped from Keranigonj 230/132/33kV end showing Distance Relay relays Due to Bad weather and thundering."
        },
        {
          "time": "17:34 - 21:14",
          "plant": "Aggreko-keraniganj 132kV Ckt-1 Tripped from Keranigonj 230/132/33kV end showing Distance Relay relays",
          "load": "HT Outage",
          "reason": "Due to Bad weather and thundering.",
          "full_desc": "Aggreko-keraniganj 132kV Ckt-1 Tripped from Keranigonj 230/132/33kV end showing Distance Relay relays Due to Bad weather and thundering."
        },
        {
          "time": "17:35",
          "plant": "Brahmanbaria-Narsinghdi 132 kV Ckt-2 Forced",
          "load": "HT Outage",
          "reason": "Brahmanbaria-Narsinghdi 132 kV Ckt-2 Forced S/D from Brahmanbaria 132/33kV end.",
          "full_desc": "Brahmanbaria-Narsinghdi 132 kV Ckt-2 Forced S/D from Brahmanbaria 132/33kV end."
        },
        {
          "time": "17:35",
          "plant": "Brahmanbaria-Narsinghdi 132 kV Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "Brahmanbaria-Narsinghdi 132 kV Ckt-1 Forced S/D from Brahmanbaria 132/33kV end.",
          "full_desc": "Brahmanbaria-Narsinghdi 132 kV Ckt-1 Forced S/D from Brahmanbaria 132/33kV end."
        },
        {
          "time": "17:46",
          "plant": "Bhandaria- Barishal(N) ckt 1&2",
          "load": "HT Outage",
          "reason": "Bhandaria- Barishal(N) ckt 1&2 is Restored.",
          "full_desc": "Bhandaria- Barishal(N) ckt 1&2 is Restored."
        },
        {
          "time": "17:53 - 18:36",
          "plant": "Aminbazar-Manikgonj PP 132kV Ckt-2 Tripped from Aminbazar 400/230/132kV end showing Distance relays",
          "load": "60.0MW",
          "reason": "Due to Distance Trip",
          "full_desc": "Aminbazar-Manikgonj PP 132kV Ckt-2 Tripped from Aminbazar 400/230/132kV end showing Distance relays Due to Distance Trip"
        },
        {
          "time": "17:56 - 18:24",
          "plant": "Narshingdi 132/33kV S/S T-2 LT Tripped showing Inter trip relays",
          "load": "45.0MW",
          "reason": "Due to Inter trip",
          "full_desc": "Narshingdi 132/33kV S/S T-2 LT Tripped showing Inter trip relays Due to Inter trip"
        },
        {
          "time": "17:56 - 18:22",
          "plant": "Narshingdi 132/33kV S/S T-2 HT Tripped showing 50 relays",
          "load": "45.0MW",
          "reason": "Due to Over current",
          "full_desc": "Narshingdi 132/33kV S/S T-2 HT Tripped showing 50 relays Due to Over current"
        },
        {
          "time": "18:00 - 20:09",
          "plant": "Barishal(N)-Madaripur 132 kV Ckt-2 Tripped from Barishal 230/132kV end showing REL650 relays",
          "load": "HT Outage",
          "reason": "Due to Stormy weather",
          "full_desc": "Barishal(N)-Madaripur 132 kV Ckt-2 Tripped from Barishal 230/132kV end showing REL650 relays Due to Stormy weather"
        },
        {
          "time": "18:19 - 19:02",
          "plant": "Bhaluka 132/33kV S/S BR Powergen Ckt- 02 Tripped showing R phase zone 2,36.3km relays",
          "load": "45.0MW",
          "reason": "Due to power plant trip.",
          "full_desc": "Bhaluka 132/33kV S/S BR Powergen Ckt- 02 Tripped showing R phase zone 2,36.3km relays Due to power plant trip."
        },
        {
          "time": "18:19 - 18:24",
          "plant": "Bhaluka 132/33kV S/S 01. Transformer- 01 LT Tripped showing SPS trip. relays",
          "load": "60.0MW",
          "reason": "Due to BR Power plant trip.",
          "full_desc": "Bhaluka 132/33kV S/S 01. Transformer- 01 LT Tripped showing SPS trip. relays Due to BR Power plant trip."
        },
        {
          "time": "18:19 - 18:24",
          "plant": "Bhaluka 132/33kV S/S 02. Transformer- 02 LT Tripped showing SPS trip. relays",
          "load": "60.0MW",
          "reason": "Due to BR power plant trip.",
          "full_desc": "Bhaluka 132/33kV S/S 02. Transformer- 02 LT Tripped showing SPS trip. relays Due to BR power plant trip."
        },
        {
          "time": "18:19 - 18:24",
          "plant": "Bhaluka 132/33kV S/S 03. Transformer-03 LT Tripped showing SPS trip. relays",
          "load": "19.0MW",
          "reason": "Due to BR Power plant trip.",
          "full_desc": "Bhaluka 132/33kV S/S 03. Transformer-03 LT Tripped showing SPS trip. relays Due to BR Power plant trip."
        },
        {
          "time": "18:19 - 19:01",
          "plant": "Bhaluka 132/33kV S/S BR Powergen Ckt- 01 Tripped showing R phase zone 2,36.7km. relays",
          "load": "45.0MW",
          "reason": "Due to BR Power plant trip.",
          "full_desc": "Bhaluka 132/33kV S/S BR Powergen Ckt- 01 Tripped showing R phase zone 2,36.7km. relays Due to BR Power plant trip."
        },
        {
          "time": "18:33 - 19:29",
          "plant": "Bogura(New)-Naogaon 132 kV Ckt-1 Tripped from Naogaon 132/33kV end showing Distanec relay relays",
          "load": "HT Outage",
          "reason": "Due to Stormy weather",
          "full_desc": "Bogura(New)-Naogaon 132 kV Ckt-1 Tripped from Naogaon 132/33kV end showing Distanec relay relays Due to Stormy weather"
        },
        {
          "time": "18:45",
          "plant": "Keraniganj-Sreenagar (T at Powerpac 100MW) 132kV Ckt-2",
          "load": "100MW",
          "reason": "Keraniganj-Sreenagar (T at Powerpac 100MW) 132kV Ckt-2 is restored.",
          "full_desc": "Keraniganj-Sreenagar (T at Powerpac 100MW) 132kV Ckt-2 is restored."
        },
        {
          "time": "19:32",
          "plant": "Rampal 1320 MW (BIFPCL) Synchronized with remarks:- U1",
          "load": "1320 MW",
          "reason": "Rampal 1320 MW (BIFPCL) Synchronized with remarks:- U1",
          "full_desc": "Rampal 1320 MW (BIFPCL) Synchronized with remarks:- U1"
        },
        {
          "time": "20:10",
          "plant": "Barishal(N)-Madaripur 132 kV Ckt-2 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Tripped line conductor repair work",
          "full_desc": "Barishal(N)-Madaripur 132 kV Ckt-2 Scheduled S/D from Barishal 230/132kV end Due to Tripped line conductor repair work"
        },
        {
          "time": "23:28",
          "plant": "Maniknagar-Siddhirganj 230kV Ckt-2",
          "load": "HT Outage",
          "reason": "Maniknagar-Siddhirganj 230kV Ckt-2 is restored.",
          "full_desc": "Maniknagar-Siddhirganj 230kV Ckt-2 is restored."
        },
        {
          "time": "23:28",
          "plant": "Maniknagar-Siddhirganj 230kV Ckt-2",
          "load": "HT Outage",
          "reason": "Maniknagar-Siddhirganj 230kV Ckt-2 is restored.",
          "full_desc": "Maniknagar-Siddhirganj 230kV Ckt-2 is restored."
        },
        {
          "time": "06:21",
          "plant": "Dhamrai 132/33kV S/S Transformer-1 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Redhot maintenance",
          "full_desc": "Dhamrai 132/33kV S/S Transformer-1 LT Scheduled S/D Due to Redhot maintenance"
        },
        {
          "time": "06:22",
          "plant": "Dhamrai 132/33kV S/S Transformer-1 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Redhot maintenance",
          "full_desc": "Dhamrai 132/33kV S/S Transformer-1 HT Scheduled S/D Due to Redhot maintenance"
        },
        {
          "time": "07:19",
          "plant": "Narail 132/33kV S/S TR2 (413-T) LT Scheduled S/D",
          "load": "7.0MW",
          "reason": "Due to 33kV N6 Feeder Bus Side Red Hot Maintenance.",
          "full_desc": "Narail 132/33kV S/S TR2 (413-T) LT Scheduled S/D Due to 33kV N6 Feeder Bus Side Red Hot Maintenance."
        },
        {
          "time": "07:20",
          "plant": "Narail 132/33kV S/S TR2 (413-T) HT Scheduled S/D",
          "load": "7.0MW",
          "reason": "Due to 33kV N6 Feeder Bus Side Red Hot Maintenance.",
          "full_desc": "Narail 132/33kV S/S TR2 (413-T) HT Scheduled S/D Due to 33kV N6 Feeder Bus Side Red Hot Maintenance."
        },
        {
          "time": "07:51",
          "plant": "Hathazari 230/132/33kV S/S MT-03 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Bushing inspection",
          "full_desc": "Hathazari 230/132/33kV S/S MT-03 HT Scheduled S/D Due to Bushing inspection"
        },
        {
          "time": "07:51",
          "plant": "Hathazari 230/132/33kV S/S MT-03 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Bushing inspection",
          "full_desc": "Hathazari 230/132/33kV S/S MT-03 LT Scheduled S/D Due to Bushing inspection"
        }
      ],
      "hourlyLoadData": [
        {
          "time": "00:00",
          "generation": 14280.08,
          "loadShed": 2709,
          "demand": 17110.99
        },
        {
          "time": "01:00",
          "generation": 14158.12,
          "loadShed": 2519,
          "demand": 16790.48
        },
        {
          "time": "02:00",
          "generation": 13964.28,
          "loadShed": 2445,
          "demand": 16519.31
        },
        {
          "time": "03:00",
          "generation": 14008.76,
          "loadShed": 2261,
          "demand": 16371.51
        },
        {
          "time": "04:00",
          "generation": 13946.97,
          "loadShed": 2141,
          "demand": 16184.32
        },
        {
          "time": "05:00",
          "generation": 13910.21,
          "loadShed": 1948,
          "demand": 15945.87
        },
        {
          "time": "06:00",
          "generation": 13628.13,
          "loadShed": 751,
          "demand": 14413.13
        },
        {
          "time": "07:00",
          "generation": 13877.08,
          "loadShed": 390,
          "demand": 14285.08
        },
        {
          "time": "08:00",
          "generation": 13937.51,
          "loadShed": 319,
          "demand": 14270.51
        },
        {
          "time": "09:00",
          "generation": 14066.19,
          "loadShed": 560,
          "demand": 14651.19
        },
        {
          "time": "10:00",
          "generation": 14052.81,
          "loadShed": 1072,
          "demand": 15172.81
        },
        {
          "time": "11:00",
          "generation": 14040.95,
          "loadShed": 1355,
          "demand": 15456.95
        },
        {
          "time": "12:00",
          "generation": 13951.43,
          "loadShed": 1894,
          "demand": 15930.43
        },
        {
          "time": "13:00",
          "generation": 14202.66,
          "loadShed": 1858,
          "demand": 16144.66
        },
        {
          "time": "14:00",
          "generation": 14035.34,
          "loadShed": 1905,
          "demand": 16026.34
        },
        {
          "time": "15:00",
          "generation": 13597,
          "loadShed": 1901,
          "demand": 15584
        },
        {
          "time": "16:00",
          "generation": 13366.17,
          "loadShed": 1343,
          "demand": 14769.17
        },
        {
          "time": "17:00",
          "generation": 12844.11,
          "loadShed": 358,
          "demand": 13218.11
        },
        {
          "time": "18:00",
          "generation": 12671.44,
          "loadShed": 100,
          "demand": 12775.44
        },
        {
          "time": "19:00",
          "generation": 13613.41,
          "loadShed": 10,
          "demand": 13623.41
        },
        {
          "time": "19:30",
          "generation": 14170,
          "loadShed": 47,
          "demand": 14219
        },
        {
          "time": "20:00",
          "generation": 14170.96,
          "loadShed": 45,
          "demand": 14217.96
        },
        {
          "time": "21:00",
          "generation": 14649.64,
          "loadShed": 44,
          "demand": 14695.64
        },
        {
          "time": "22:00",
          "generation": 14933.73,
          "loadShed": 27,
          "demand": 14961.73
        },
        {
          "time": "23:00",
          "generation": 15034.74,
          "loadShed": 133,
          "demand": 15173.74
        }
      ],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 477.7,
          "condensate": 379,
          "share": 18.2
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 94.2,
          "condensate": 326.1,
          "share": 3.6
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 92,
          "condensate": 54.8,
          "share": 3.5
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 905.5,
          "condensate": 4864.1,
          "share": 34.5
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31.4,
          "condensate": 94,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1022.2,
          "condensate": 0,
          "share": 39
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 260.9,
          "fertilizer": 73.1,
          "others": 1094.8,
          "total": 1428.8
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 210.1,
          "fertilizer": 0,
          "others": 87.4,
          "total": 297.5
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 37.8,
          "fertilizer": 38.4,
          "others": 171.5,
          "total": 247.6
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 220.4,
          "fertilizer": 40.1,
          "others": 117.8,
          "total": 378.3
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 124.1,
          "fertilizer": 0,
          "others": 29.3,
          "total": 153.4
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 54.2,
          "fertilizer": 0,
          "others": 4.6,
          "total": 58.8
        }
      ]
    },
  "2026-06-22": {
      "systemStats": {
        "date": "22 Jun 2026",
        "dayPeakGen": 14171.86,
        "eveningPeakGen": 16154.41,
        "dayPeakDemand": 14610.86,
        "eveningPeakDemand": 16854.11,
        "minGen": 12623.38,
        "maxGen": 16154.41,
        "totalEnergyGen": 343.2675271,
        "totalEnergyUnserved": 7.257,
        "totalEnergyDemand": 350.525,
        "maxTemp": 32.8,
        "totalGasSuppliedPower": 907.35,
        "avgProductionCost": 6.615,
        "totalDailyCost": 2270732586
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 126.76,
          "cost": 437084201,
          "unitCost": 3.448,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 123.3,
          "cost": 816663901,
          "unitCost": 6.6236,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 35.03,
          "cost": 632836198,
          "unitCost": 18.0636,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 2.27,
          "cost": 227438,
          "unitCost": 0.1,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 2.99,
          "cost": 47087758,
          "unitCost": 15.7683,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 52.72,
          "cost": 334044072,
          "unitCost": 6.3357,
          "color": "#a855f7"
        },
        {
          "name": "HSD",
          "gen": 0,
          "cost": 0,
          "unitCost": null,
          "color": "#ef4444"
        },
        {
          "name": "Wind",
          "gen": 0.19,
          "cost": 2789016,
          "unitCost": 14.71,
          "color": "#22c55e"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 14.18,
          "peakFlow": 930,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 34.05,
          "peakFlow": 1485.55,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.58,
          "peakFlow": 168,
          "type": "C/B Interconnector (East)"
        },
        {
          "source": "Nepal (via India)",
          "energy": 0.89,
          "peakFlow": 38,
          "type": "C/B Interconnector (Nepal)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 88,
          "demand": 5861,
          "pct": 1.5
        },
        {
          "zone": "Chattogram",
          "loadShed": 0,
          "demand": 1526,
          "pct": 0
        },
        {
          "zone": "Khulna",
          "loadShed": 31,
          "demand": 1897,
          "pct": 1.63
        },
        {
          "zone": "Rajshahi",
          "loadShed": 0,
          "demand": 1641,
          "pct": 0
        },
        {
          "zone": "Cumilla",
          "loadShed": 110,
          "demand": 1579,
          "pct": 6.97
        },
        {
          "zone": "Mymensingh",
          "loadShed": 241,
          "demand": 1380,
          "pct": 17.46
        },
        {
          "zone": "Sylhet",
          "loadShed": 0,
          "demand": 627,
          "pct": 0
        },
        {
          "zone": "Barishal",
          "loadShed": 0,
          "demand": 528,
          "pct": 0
        },
        {
          "zone": "Rangpur",
          "loadShed": 26,
          "demand": 1002,
          "pct": 2.59
        }
      ],
      "dailyOutages": [
        {
          "time": "08:09",
          "plant": "Dhamrai 132/33kV S/S Transformer-1 HT",
          "load": "HT Outage",
          "reason": "Dhamrai 132/33kV S/S Transformer-1 HT is restored.",
          "full_desc": "Dhamrai 132/33kV S/S Transformer-1 HT is restored."
        },
        {
          "time": "08:10",
          "plant": "Dhamrai 132/33kV S/S Transformer-1 LT",
          "load": "HT Outage",
          "reason": "Dhamrai 132/33kV S/S Transformer-1 LT is restored.",
          "full_desc": "Dhamrai 132/33kV S/S Transformer-1 LT is restored."
        },
        {
          "time": "08:39",
          "plant": "Barishal(N)-Madaripur 132 kV Ckt-2",
          "load": "HT Outage",
          "reason": "Barishal(N)-Madaripur 132 kV Ckt-2 is restored.",
          "full_desc": "Barishal(N)-Madaripur 132 kV Ckt-2 is restored."
        },
        {
          "time": "08:48",
          "plant": "Narail 132/33kV S/S TR2 (413-T) HT",
          "load": "HT Outage",
          "reason": "Narail 132/33kV S/S TR2 (413-T) HT is restored.",
          "full_desc": "Narail 132/33kV S/S TR2 (413-T) HT is restored."
        },
        {
          "time": "08:48",
          "plant": "Hathazari 230/132/33kV S/S MT-03 HT",
          "load": "HT Outage",
          "reason": "Hathazari 230/132/33kV S/S MT-03 HT is restored.",
          "full_desc": "Hathazari 230/132/33kV S/S MT-03 HT is restored."
        },
        {
          "time": "08:48",
          "plant": "Hathazari 230/132/33kV S/S MT-03 LT",
          "load": "HT Outage",
          "reason": "Hathazari 230/132/33kV S/S MT-03 LT is restored.",
          "full_desc": "Hathazari 230/132/33kV S/S MT-03 LT is restored."
        },
        {
          "time": "08:49",
          "plant": "Narail 132/33kV S/S TR2 (413-T) LT",
          "load": "HT Outage",
          "reason": "Narail 132/33kV S/S TR2 (413-T) LT is restored.",
          "full_desc": "Narail 132/33kV S/S TR2 (413-T) LT is restored."
        },
        {
          "time": "09:07 - 10:26",
          "plant": "Srinagar 132/33kV S/S Tr-01 LT Scheduled",
          "load": "20.0MW",
          "reason": "for PBS red hot maintenance.",
          "full_desc": "Srinagar 132/33kV S/S Tr-01 LT Scheduled S/D Due to 33 kv bus -01 shutdown for PBS red hot maintenance."
        },
        {
          "time": "09:08 - 10:24",
          "plant": "Srinagar 132/33kV S/S Tr-01 HT Scheduled",
          "load": "20.0MW",
          "reason": "for PBS red hot maintenance.",
          "full_desc": "Srinagar 132/33kV S/S Tr-01 HT Scheduled S/D Due to 33 kv bus -01 shutdown for PBS red hot maintenance."
        },
        {
          "time": "09:19 - 10:17",
          "plant": "Srinagar 132/33kV S/S 33 kV bus Scheduled",
          "load": "20.0MW",
          "reason": "for PBS red hot maintenance.",
          "full_desc": "Srinagar 132/33kV S/S 33 kV bus Scheduled S/D Due to 33 kv bus -01 shutdown for PBS red hot maintenance."
        },
        {
          "time": "09:20 - 09:59",
          "plant": "Shahjadpur 132/33kV S/S T-2(415T) HT Forced S/D",
          "load": "9.0MW",
          "reason": "Due to Maintenance",
          "full_desc": "Shahjadpur 132/33kV S/S T-2(415T) HT Forced S/D Due to Maintenance"
        },
        {
          "time": "09:20 - 14:58",
          "plant": "Shyampur-Shyampur(New) 132kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "for circuit-1",
          "full_desc": "Shyampur-Shyampur(New) 132kV Ckt-1 Scheduled S/D from Shyampur 230/132kV end Due to Short span jumper opening between Shy-1 & Fat-1 circuit. and from Shyampur 132/33kV end Due to working for circuit-1"
        },
        {
          "time": "09:33",
          "plant": "Fatullah-Shyampur(New) 132 kV Ckt-1 Forced",
          "load": "HT Outage",
          "reason": "Due to By NLDC",
          "full_desc": "Fatullah-Shyampur(New) 132 kV Ckt-1 Forced S/D from Fatullah 132/33kV end Due to By NLDC"
        },
        {
          "time": "10:22 - 12:34",
          "plant": "Chhatak 132/33kV S/S T-1 LT Scheduled",
          "load": "12.0MW",
          "reason": "for 33KV T-1 Bus section red hot maintenance.",
          "full_desc": "Chhatak 132/33kV S/S T-1 LT Scheduled S/D Due to Shutdown for 33KV T-1 Bus section red hot maintenance."
        },
        {
          "time": "10:22 - 12:34",
          "plant": "Chhatak 132/33kV S/S T-1 HT Scheduled",
          "load": "12.0MW",
          "reason": "for 33KV T-1 Bus section red hot maintenance.",
          "full_desc": "Chhatak 132/33kV S/S T-1 HT Scheduled S/D Due to Shutdown for 33KV T-1 Bus section red hot maintenance."
        },
        {
          "time": "10:23 - 14:26",
          "plant": "Khulna(S)-PDB 330MW CCPP 230kV Ckt-1 Scheduled",
          "load": "330MW",
          "reason": "Due to Maintenance Work at power Plant end.",
          "full_desc": "Khulna(S)-PDB 330MW CCPP 230kV Ckt-1 Scheduled S/D from Khulna(S) 230/132kV end Due to Maintenance Work at power Plant end."
        },
        {
          "time": "11:20 - 11:30",
          "plant": "Hathazari 230/132/33kV S/S MT-03 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Bushing Measurement",
          "full_desc": "Hathazari 230/132/33kV S/S MT-03 HT Scheduled S/D Due to Bushing Measurement"
        },
        {
          "time": "14:44",
          "plant": "Brahmanbaria-Narsinghdi 132 kV Ckt-2",
          "load": "HT Outage",
          "reason": "Brahmanbaria-Narsinghdi 132 kV Ckt-2 is restored.",
          "full_desc": "Brahmanbaria-Narsinghdi 132 kV Ckt-2 is restored."
        },
        {
          "time": "14:44",
          "plant": "Brahmanbaria-Narsinghdi 132 kV Ckt-1",
          "load": "HT Outage",
          "reason": "Brahmanbaria-Narsinghdi 132 kV Ckt-1 is restored.",
          "full_desc": "Brahmanbaria-Narsinghdi 132 kV Ckt-1 is restored."
        },
        {
          "time": "15:44 - 17:27",
          "plant": "Daganbhuiyan 132/33kV S/S Transformer-1 HT Forced",
          "load": "HT Outage",
          "reason": "for  Red Hot Maintenance",
          "full_desc": "Daganbhuiyan 132/33kV S/S Transformer-1 HT Forced S/D Due to shutdown for  Red Hot Maintenance"
        },
        {
          "time": "15:47 - 17:30",
          "plant": "Daganbhuiyan 132/33kV S/S Transformer-1 LT Forced",
          "load": "14.0MW",
          "reason": "for  Red Hot Maintenance",
          "full_desc": "Daganbhuiyan 132/33kV S/S Transformer-1 LT Forced S/D Due to shutdown for  Red Hot Maintenance"
        },
        {
          "time": "16:06 - 17:07",
          "plant": "Fenchuganj 230/132/33kV S/S TR-01 HT Scheduled S/D",
          "load": "11.0MW",
          "reason": "Due to PDB Feeder maintenance",
          "full_desc": "Fenchuganj 230/132/33kV S/S TR-01 HT Scheduled S/D Due to PDB Feeder maintenance"
        },
        {
          "time": "16:23 - 16:45",
          "plant": "Chapai 132/33kV S/S T-4 (435T) HT Forced S/D",
          "load": "8.0MW",
          "reason": "Due to Nest Remove",
          "full_desc": "Chapai 132/33kV S/S T-4 (435T) HT Forced S/D Due to Nest Remove"
        },
        {
          "time": "19:02",
          "plant": "Satiya-64 MW Solar132 KV-2 syn.",
          "load": "64 MW",
          "reason": "Satiya-64 MW Solar132 KV-2 syn.",
          "full_desc": "Satiya-64 MW Solar132 KV-2 syn."
        },
        {
          "time": "06:26",
          "plant": "Dhamrai 132/33kV S/S Transformer-1 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Red-hot Maintenance",
          "full_desc": "Dhamrai 132/33kV S/S Transformer-1 LT Scheduled S/D Due to Red-hot Maintenance"
        },
        {
          "time": "06:26",
          "plant": "Dhamrai 132/33kV S/S Transformer-1 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Red-hot Maintenance",
          "full_desc": "Dhamrai 132/33kV S/S Transformer-1 HT Scheduled S/D Due to Red-hot Maintenance"
        }
      ],
      "hourlyLoadData": [
        {
          "time": "00:00",
          "generation": 14867.66,
          "loadShed": 174,
          "demand": 15049.49
        },
        {
          "time": "01:00",
          "generation": 14369.99,
          "loadShed": 197,
          "demand": 14575.86
        },
        {
          "time": "02:00",
          "generation": 13886.39,
          "loadShed": 213,
          "demand": 14108.98
        },
        {
          "time": "03:00",
          "generation": 13620.49,
          "loadShed": 192,
          "demand": 13821.13
        },
        {
          "time": "04:00",
          "generation": 13114.79,
          "loadShed": 186,
          "demand": 13309.16
        },
        {
          "time": "05:00",
          "generation": 12781.57,
          "loadShed": 176,
          "demand": 12965.49
        },
        {
          "time": "06:00",
          "generation": 12623.38,
          "loadShed": 171,
          "demand": 12802.08
        },
        {
          "time": "07:00",
          "generation": 12774.42,
          "loadShed": 223,
          "demand": 13007.42
        },
        {
          "time": "08:00",
          "generation": 12806.47,
          "loadShed": 197,
          "demand": 13012.47
        },
        {
          "time": "09:00",
          "generation": 13134.56,
          "loadShed": 201,
          "demand": 13344.56
        },
        {
          "time": "10:00",
          "generation": 13367.8,
          "loadShed": 278,
          "demand": 13658.8
        },
        {
          "time": "11:00",
          "generation": 13676.68,
          "loadShed": 346,
          "demand": 14038.68
        },
        {
          "time": "12:00",
          "generation": 14171.86,
          "loadShed": 420,
          "demand": 14610.86
        },
        {
          "time": "13:00",
          "generation": 14415.72,
          "loadShed": 405,
          "demand": 14838.72
        },
        {
          "time": "14:00",
          "generation": 14587.64,
          "loadShed": 236,
          "demand": 14834.64
        },
        {
          "time": "15:00",
          "generation": 14723.27,
          "loadShed": 221,
          "demand": 14954.27
        },
        {
          "time": "16:00",
          "generation": 14579.4,
          "loadShed": 148,
          "demand": 14734.4
        },
        {
          "time": "17:00",
          "generation": 14220.97,
          "loadShed": 138,
          "demand": 14364.97
        },
        {
          "time": "18:00",
          "generation": 14179.01,
          "loadShed": 140,
          "demand": 14325.01
        },
        {
          "time": "19:00",
          "generation": 15354.07,
          "loadShed": 213,
          "demand": 15577.07
        },
        {
          "time": "19:30",
          "generation": 15723.11,
          "loadShed": 1082,
          "demand": 16854.11
        },
        {
          "time": "20:00",
          "generation": 15846.44,
          "loadShed": 414,
          "demand": 16279.44
        },
        {
          "time": "21:00",
          "generation": 16154.41,
          "loadShed": 496,
          "demand": 16672.41
        },
        {
          "time": "22:00",
          "generation": 15718.99,
          "loadShed": 636,
          "demand": 16383.61
        },
        {
          "time": "23:00",
          "generation": 15554.84,
          "loadShed": 1236,
          "demand": 16846.46
        }
      ],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 478.7,
          "condensate": 371.8,
          "share": 18.1
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 139.9,
          "condensate": 638,
          "share": 5.3
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 92.4,
          "condensate": 59.3,
          "share": 3.5
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 897.4,
          "condensate": 4702.6,
          "share": 33.9
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31.2,
          "condensate": 93,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1008,
          "condensate": 26.2,
          "share": 38.1
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 267.4,
          "fertilizer": 73.1,
          "others": 1069.8,
          "total": 1410.3
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 206.7,
          "fertilizer": 0,
          "others": 87.4,
          "total": 294.1
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 37.6,
          "fertilizer": 38.5,
          "others": 170,
          "total": 246.1
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 224.5,
          "fertilizer": 40.1,
          "others": 114.4,
          "total": 379
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 126.9,
          "fertilizer": 0,
          "others": 29.2,
          "total": 156
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 54.2,
          "fertilizer": 0,
          "others": 4.3,
          "total": 58.5
        }
      ]
    },
  "2026-06-23": {
      "systemStats": {
        "date": "23 Jun 2026",
        "dayPeakGen": 14580.7,
        "eveningPeakGen": 15506.14,
        "dayPeakDemand": 15596.7,
        "eveningPeakDemand": 17593.14,
        "minGen": 13639.05,
        "maxGen": 15758.04,
        "totalEnergyGen": 351.24831128,
        "totalEnergyUnserved": 23.191,
        "totalEnergyDemand": 374.439,
        "maxTemp": 34.2,
        "totalGasSuppliedPower": 888.38,
        "avgProductionCost": 6.822,
        "totalDailyCost": 2396364493
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 125.96,
          "cost": 434994004,
          "unitCost": 3.4534,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 116,
          "cost": 762477011,
          "unitCost": 6.5733,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 41.42,
          "cost": 764713485,
          "unitCost": 18.4646,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 2.26,
          "cost": 226478,
          "unitCost": 0.1,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 3.33,
          "cost": 51823392,
          "unitCost": 15.585,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 61.88,
          "cost": 374232641,
          "unitCost": 6.0475,
          "color": "#a855f7"
        },
        {
          "name": "HSD",
          "gen": 0.36,
          "cost": 7205521,
          "unitCost": 20.2,
          "color": "#ef4444"
        },
        {
          "name": "Wind",
          "gen": 0.05,
          "cost": 691958,
          "unitCost": 14.71,
          "color": "#22c55e"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 21.88,
          "peakFlow": 902,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 35.01,
          "peakFlow": 1465.08,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 4.08,
          "peakFlow": 174,
          "type": "C/B Interconnector (East)"
        },
        {
          "source": "Nepal (via India)",
          "energy": 0.89,
          "peakFlow": 38,
          "type": "C/B Interconnector (Nepal)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 290,
          "demand": 6049,
          "pct": 4.79
        },
        {
          "zone": "Chattogram",
          "loadShed": 129,
          "demand": 1536,
          "pct": 8.4
        },
        {
          "zone": "Khulna",
          "loadShed": 380,
          "demand": 2123,
          "pct": 17.9
        },
        {
          "zone": "Rajshahi",
          "loadShed": 210,
          "demand": 1727,
          "pct": 12.16
        },
        {
          "zone": "Cumilla",
          "loadShed": 229,
          "demand": 1632,
          "pct": 14.03
        },
        {
          "zone": "Mymensingh",
          "loadShed": 359,
          "demand": 1441,
          "pct": 24.91
        },
        {
          "zone": "Sylhet",
          "loadShed": 128,
          "demand": 714,
          "pct": 17.93
        },
        {
          "zone": "Barishal",
          "loadShed": 116,
          "demand": 582,
          "pct": 19.93
        },
        {
          "zone": "Rangpur",
          "loadShed": 156,
          "demand": 1072,
          "pct": 14.55
        }
      ],
      "dailyOutages": [
        {
          "time": "08:09 - 09:44",
          "plant": "Charfasson 230/33kV S/S Power Transformer-2 LT Scheduled S/D",
          "load": "24.0MW",
          "reason": "Due to CT ratio with burden test.",
          "full_desc": "Charfasson 230/33kV S/S Power Transformer-2 LT Scheduled S/D Due to CT ratio with burden test."
        },
        {
          "time": "08:11 - 09:43",
          "plant": "Charfasson 230/33kV S/S Power Transformer-2 HT Scheduled S/D",
          "load": "24.0MW",
          "reason": "Due to CT Ratio with burden test.",
          "full_desc": "Charfasson 230/33kV S/S Power Transformer-2 HT Scheduled S/D Due to CT Ratio with burden test."
        },
        {
          "time": "08:14",
          "plant": "Dhamrai 132/33kV S/S Transformer-1 LT",
          "load": "HT Outage",
          "reason": "Dhamrai 132/33kV S/S Transformer-1 LT is restored.",
          "full_desc": "Dhamrai 132/33kV S/S Transformer-1 LT is restored."
        },
        {
          "time": "08:14",
          "plant": "Dhamrai 132/33kV S/S Transformer-1 HT",
          "load": "HT Outage",
          "reason": "Dhamrai 132/33kV S/S Transformer-1 HT is restored.",
          "full_desc": "Dhamrai 132/33kV S/S Transformer-1 HT is restored."
        },
        {
          "time": "08:45",
          "plant": "Khulna (S)-Satkhira 132kV Ckt-1 Project Work",
          "load": "HT Outage",
          "reason": "Khulna (S)-Satkhira 132kV Ckt-1 Project Work S/D from Satkhira 132/33kV end. and from Khulna(S) 230/132kVend.",
          "full_desc": "Khulna (S)-Satkhira 132kV Ckt-1 Project Work S/D from Satkhira 132/33kV end. and from Khulna(S) 230/132kVend."
        },
        {
          "time": "09:41",
          "plant": "Baghabari-Ishurdi 230 kV Ckt-2 Project Work",
          "load": "HT Outage",
          "reason": "Due to SS Upgradation and from Ishurdi 230/132kV end Due to Bay equipment upgradation",
          "full_desc": "Baghabari-Ishurdi 230 kV Ckt-2 Project Work S/D from Baghabari 230/132kV end Due to SS Upgradation and from Ishurdi 230/132kV end Due to Bay equipment upgradation"
        },
        {
          "time": "10:13 - 12:00",
          "plant": "Brahmanbaria-Shahjibazar 132 kV Ckt-2 Forced",
          "load": "HT Outage",
          "reason": "Due to Red-hot maintenance and from Shahjibazar 132/33kV end Due to Shutdown taken by B.Baria",
          "full_desc": "Brahmanbaria-Shahjibazar 132 kV Ckt-2 Forced S/D from Brahmanbaria 132/33kV end Due to Red-hot maintenance and from Shahjibazar 132/33kV end Due to Shutdown taken by B.Baria"
        },
        {
          "time": "10:52",
          "plant": "Sherpur 132/33kV S/S Transformer- 03 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Tr-03 132kv energy meter change works.",
          "full_desc": "Sherpur 132/33kV S/S Transformer- 03 LT Scheduled S/D Due to Tr-03 132kv energy meter change works."
        },
        {
          "time": "10:53",
          "plant": "Sherpur 132/33kV S/S Transformer- 03 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Tr-03 132kv energy meter change works.",
          "full_desc": "Sherpur 132/33kV S/S Transformer- 03 HT Scheduled S/D Due to Tr-03 132kv energy meter change works."
        },
        {
          "time": "11:03",
          "plant": "Bajitpur 132/33kV S/S 132 kV Bus-2 Forced S/D",
          "load": "HT Outage",
          "reason": "Bajitpur 132/33kV S/S 132 kV Bus-2 Forced S/D",
          "full_desc": "Bajitpur 132/33kV S/S 132 kV Bus-2 Forced S/D"
        },
        {
          "time": "13:37 - 17:14",
          "plant": "Purbasadipur-Thakurgaon-EPV  132kV Ckt-2 Tripped from Purbasadipur 230/132/33kV end showing Main-1 Diatance relay <br> Main-2 Distance Relay relays.",
          "load": "HT Outage",
          "reason": "Purbasadipur-Thakurgaon-EPV  132kV Ckt-2 Tripped from Purbasadipur 230/132/33kV end showing Main-1 Diatance relay <br> Main-2 Distance Relay relays.",
          "full_desc": "Purbasadipur-Thakurgaon-EPV  132kV Ckt-2 Tripped from Purbasadipur 230/132/33kV end showing Main-1 Diatance relay <br> Main-2 Distance Relay relays."
        },
        {
          "time": "15:10 - 15:17",
          "plant": "Bhaluka 132/33kV S/S 02. Transformer- 02 LT Tripped showing SPS trip. relays",
          "load": "59.0MW",
          "reason": "Due to Fault at BR Powergen end.",
          "full_desc": "Bhaluka 132/33kV S/S 02. Transformer- 02 LT Tripped showing SPS trip. relays Due to Fault at BR Powergen end."
        },
        {
          "time": "15:10 - 15:31",
          "plant": "Bhaluka 132/33kV S/S BR Powergen Ckt- 01 Tripped showing R Phase zone 2 trip. relays",
          "load": "41.0MW",
          "reason": "Due to BR Powergen end fault.",
          "full_desc": "Bhaluka 132/33kV S/S BR Powergen Ckt- 01 Tripped showing R Phase zone 2 trip. relays Due to BR Powergen end fault."
        },
        {
          "time": "15:10 - 15:17",
          "plant": "Bhaluka 132/33kV S/S 01. Transformer- 01 LT Tripped showing SPS trip relays",
          "load": "59.0MW",
          "reason": "Due to Fault at BR Powergen end",
          "full_desc": "Bhaluka 132/33kV S/S 01. Transformer- 01 LT Tripped showing SPS trip relays Due to Fault at BR Powergen end"
        },
        {
          "time": "15:25 - 16:22",
          "plant": "Baroirhat-Feni 132 kV Ckt-2 Scheduled",
          "load": "HT Outage",
          "reason": "Due to For Breaker Gas Refilling. and from Baroirhat 132/33kV end Due to Order by NLDC",
          "full_desc": "Baroirhat-Feni 132 kV Ckt-2 Scheduled S/D from Feni 132/33kV end Due to For Breaker Gas Refilling. and from Baroirhat 132/33kV end Due to Order by NLDC"
        },
        {
          "time": "16:54",
          "plant": "Barapukuria unit-1",
          "load": "HT Outage",
          "reason": "Barapukuria unit-1 was sync.",
          "full_desc": "Barapukuria unit-1 was sync."
        },
        {
          "time": "20:57",
          "plant": "Chandpur CCPP ST",
          "load": "HT Outage",
          "reason": "Chandpur CCPP ST was sync.",
          "full_desc": "Chandpur CCPP ST was sync."
        },
        {
          "time": "21:32",
          "plant": "Barapukuria unit-3",
          "load": "HT Outage",
          "reason": "Barapukuria unit-3 was sync.",
          "full_desc": "Barapukuria unit-3 was sync."
        },
        {
          "time": "01:27 - 02:12",
          "plant": "Chattak-Sunamganj 132 kV Ckt-1 Tripped from Sunamganj 132/33kV end showing REL 670 relays",
          "load": "HT Outage",
          "reason": "Due to Thunderstorm",
          "full_desc": "Chattak-Sunamganj 132 kV Ckt-1 Tripped from Sunamganj 132/33kV end showing REL 670 relays Due to Thunderstorm"
        },
        {
          "time": "06:34",
          "plant": "Jhenaidah 230/132kV S/S 230 kV Bus Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to 230 kV Bus-1 Shutdown (For project work)",
          "full_desc": "Jhenaidah 230/132kV S/S 230 kV Bus Project Work S/D Due to 230 kV Bus-1 Shutdown (For project work)"
        }
      ],
      "hourlyLoadData": [
        {
          "time": "00:00",
          "generation": 15758.04,
          "loadShed": 642,
          "demand": 16428.93
        },
        {
          "time": "01:00",
          "generation": 15664.66,
          "loadShed": 332,
          "demand": 16011.6
        },
        {
          "time": "02:00",
          "generation": 14663.77,
          "loadShed": 948,
          "demand": 15654.43
        },
        {
          "time": "03:00",
          "generation": 14351.22,
          "loadShed": 914,
          "demand": 15306.22
        },
        {
          "time": "04:00",
          "generation": 14243.64,
          "loadShed": 767,
          "demand": 15045.64
        },
        {
          "time": "05:00",
          "generation": 14038.13,
          "loadShed": 635,
          "demand": 14702.13
        },
        {
          "time": "06:00",
          "generation": 13675.92,
          "loadShed": 305,
          "demand": 13994.92
        },
        {
          "time": "07:00",
          "generation": 13639.05,
          "loadShed": 315,
          "demand": 13968.05
        },
        {
          "time": "08:00",
          "generation": 13769.66,
          "loadShed": 285,
          "demand": 14067.66
        },
        {
          "time": "09:00",
          "generation": 13870.65,
          "loadShed": 260,
          "demand": 14142.65
        },
        {
          "time": "10:00",
          "generation": 14345.21,
          "loadShed": 317,
          "demand": 14676.21
        },
        {
          "time": "11:00",
          "generation": 14567.22,
          "loadShed": 468,
          "demand": 15056.22
        },
        {
          "time": "12:00",
          "generation": 14580.7,
          "loadShed": 972,
          "demand": 15596.7
        },
        {
          "time": "13:00",
          "generation": 14430.69,
          "loadShed": 1324,
          "demand": 15814.69
        },
        {
          "time": "14:00",
          "generation": 14211.43,
          "loadShed": 1397,
          "demand": 15671.43
        },
        {
          "time": "15:00",
          "generation": 14213.96,
          "loadShed": 1821,
          "demand": 16116.96
        },
        {
          "time": "16:00",
          "generation": 14138.56,
          "loadShed": 1400,
          "demand": 15601.56
        },
        {
          "time": "17:00",
          "generation": 13981.11,
          "loadShed": 1161,
          "demand": 15194.11
        },
        {
          "time": "18:00",
          "generation": 13949.3,
          "loadShed": 982,
          "demand": 14975.3
        },
        {
          "time": "19:00",
          "generation": 15175.9,
          "loadShed": 1321,
          "demand": 16555.9
        },
        {
          "time": "19:30",
          "generation": 15380.6,
          "loadShed": 1534,
          "demand": 16983.6
        },
        {
          "time": "20:00",
          "generation": 15272.66,
          "loadShed": 1516,
          "demand": 16856.66
        },
        {
          "time": "21:00",
          "generation": 15506.14,
          "loadShed": 1997,
          "demand": 17593.14
        },
        {
          "time": "22:00",
          "generation": 15498.15,
          "loadShed": 1481,
          "demand": 17046.15
        },
        {
          "time": "23:00",
          "generation": 15359.75,
          "loadShed": 1631,
          "demand": 17063.75
        }
      ],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 479.9,
          "condensate": 380,
          "share": 18.2
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 139.9,
          "condensate": 636.8,
          "share": 5.3
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 93.1,
          "condensate": 67.4,
          "share": 3.5
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 895.7,
          "condensate": 4875.7,
          "share": 33.9
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31.4,
          "condensate": 94,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1002.9,
          "condensate": 26,
          "share": 37.9
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 271.5,
          "fertilizer": 73.1,
          "others": 1060.6,
          "total": 1405.3
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 192.7,
          "fertilizer": 0,
          "others": 87.8,
          "total": 280.4
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 37.6,
          "fertilizer": 38.3,
          "others": 168.3,
          "total": 244.3
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 218.7,
          "fertilizer": 40.1,
          "others": 111.7,
          "total": 370.5
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 124.4,
          "fertilizer": 0,
          "others": 29.5,
          "total": 153.8
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 54.1,
          "fertilizer": 0,
          "others": 4.5,
          "total": 58.6
        }
      ]
    },
  "2026-06-24": {
      "systemStats": {
        "date": "24 Jun 2026",
        "dayPeakGen": 14441.07,
        "eveningPeakGen": 15700.01,
        "dayPeakDemand": 15598.07,
        "eveningPeakDemand": 17565.01,
        "minGen": 13478.64,
        "maxGen": 15762.39,
        "totalEnergyGen": 347.06060948,
        "totalEnergyUnserved": 29.581,
        "totalEnergyDemand": 376.642,
        "maxTemp": 32.8,
        "totalGasSuppliedPower": 890.08,
        "avgProductionCost": 6.657,
        "totalDailyCost": 2310311557
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 127.27,
          "cost": 438719200,
          "unitCost": 3.4471,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 120.35,
          "cost": 796389932,
          "unitCost": 6.6171,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 36.08,
          "cost": 663054017,
          "unitCost": 18.3768,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 2.24,
          "cost": 223636,
          "unitCost": 0.1,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 4.06,
          "cost": 65773748,
          "unitCost": 16.1912,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 56.99,
          "cost": 345127206,
          "unitCost": 6.0563,
          "color": "#a855f7"
        },
        {
          "name": "HSD",
          "gen": 0,
          "cost": 0,
          "unitCost": null,
          "color": "#ef4444"
        },
        {
          "name": "Wind",
          "gen": 0.07,
          "cost": 1023816,
          "unitCost": 14.71,
          "color": "#22c55e"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 20.1,
          "peakFlow": 902,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 32.04,
          "peakFlow": 1481.45,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.94,
          "peakFlow": 166,
          "type": "C/B Interconnector (East)"
        },
        {
          "source": "Nepal (via India)",
          "energy": 0.89,
          "peakFlow": 38,
          "type": "C/B Interconnector (Nepal)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 219,
          "demand": 6082,
          "pct": 3.6
        },
        {
          "zone": "Chattogram",
          "loadShed": 31,
          "demand": 1522,
          "pct": 2.04
        },
        {
          "zone": "Khulna",
          "loadShed": 349,
          "demand": 2009,
          "pct": 17.37
        },
        {
          "zone": "Rajshahi",
          "loadShed": 58,
          "demand": 1752,
          "pct": 3.31
        },
        {
          "zone": "Cumilla",
          "loadShed": 342,
          "demand": 1742,
          "pct": 19.63
        },
        {
          "zone": "Mymensingh",
          "loadShed": 449,
          "demand": 1407,
          "pct": 31.91
        },
        {
          "zone": "Sylhet",
          "loadShed": 47,
          "demand": 713,
          "pct": 6.59
        },
        {
          "zone": "Barishal",
          "loadShed": 85,
          "demand": 547,
          "pct": 15.54
        },
        {
          "zone": "Rangpur",
          "loadShed": 205,
          "demand": 1125,
          "pct": 18.22
        }
      ],
      "dailyOutages": [
        {
          "time": "08:17 - 09:03",
          "plant": "Sylhet 132/33kV S/S T2 HT Tripped showing LV E/F, LV O/C and Gen trip relays",
          "load": "61.0MW",
          "reason": "Due to None",
          "full_desc": "Sylhet 132/33kV S/S T2 HT Tripped showing LV E/F, LV O/C and Gen trip relays Due to None"
        },
        {
          "time": "08:17 - 09:06",
          "plant": "Sylhet 132/33kV S/S T2 LT Tripped showing LV E/F, LV O/C and gen trip relays",
          "load": "61.0MW",
          "reason": "Due to None",
          "full_desc": "Sylhet 132/33kV S/S T2 LT Tripped showing LV E/F, LV O/C and gen trip relays Due to None"
        },
        {
          "time": "08:17 - 08:47",
          "plant": "Chattak-Sylhet 132 kV Ckt-2 Tripped from Sylhet 132/33kV end showing Distance relays.",
          "load": "32.0MW",
          "reason": "Chattak-Sylhet 132 kV Ckt-2 Tripped from Sylhet 132/33kV end showing Distance relays.",
          "full_desc": "Chattak-Sylhet 132 kV Ckt-2 Tripped from Sylhet 132/33kV end showing Distance relays."
        },
        {
          "time": "08:38 - 10:27",
          "plant": "Gopalganj 132/33kV S/S Transformer-03 LT Scheduled S/D",
          "load": "14.0MW",
          "reason": "Due to Md.Shakil Agm(A/C) Mollahat zonel office, Bagerhat Pbs. Breaker to ds clamp maintenance (B-Phase).",
          "full_desc": "Gopalganj 132/33kV S/S Transformer-03 LT Scheduled S/D Due to Md.Shakil Agm(A/C) Mollahat zonel office, Bagerhat Pbs. Breaker to ds clamp maintenance (B-Phase)."
        },
        {
          "time": "08:39 - 10:26",
          "plant": "Gopalganj 132/33kV S/S Transformer-03 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Md.Shakil Agm(A/C) Mollahat zonel office, Bagerhat Pbs. Breaker to ds clamp maintenance (B-Phase).",
          "full_desc": "Gopalganj 132/33kV S/S Transformer-03 HT Scheduled S/D Due to Md.Shakil Agm(A/C) Mollahat zonel office, Bagerhat Pbs. Breaker to ds clamp maintenance (B-Phase)."
        },
        {
          "time": "08:55 - 21:13",
          "plant": "Korerhat 400/230/132kV S/S Mirsharai-2 Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to For project work",
          "full_desc": "Korerhat 400/230/132kV S/S Mirsharai-2 Project Work S/D Due to For project work"
        },
        {
          "time": "09:09",
          "plant": "Kaliakoir 400/230/132kV S/S 400/132kV TR-3 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to SAS Testing and Commissioning.",
          "full_desc": "Kaliakoir 400/230/132kV S/S 400/132kV TR-3 HT Scheduled S/D Due to SAS Testing and Commissioning."
        },
        {
          "time": "09:10",
          "plant": "Madunaghat-Meghnaghat 400kV Ckt-1",
          "load": "HT Outage",
          "reason": "Madunaghat-Meghnaghat 400kV Ckt-1 is restored.",
          "full_desc": "Madunaghat-Meghnaghat 400kV Ckt-1 is restored."
        },
        {
          "time": "09:11",
          "plant": "Kaliakoir 400/230/132kV S/S 400/132kV TR-3 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to SAS Testing and Commissioning.",
          "full_desc": "Kaliakoir 400/230/132kV S/S 400/132kV TR-3 LT Scheduled S/D Due to SAS Testing and Commissioning."
        },
        {
          "time": "09:17 - 12:39",
          "plant": "Sherpur(Bogura)-Sirajgonj 132 kV Ckt-2 Scheduled",
          "load": "HT Outage",
          "reason": "Due to Conductor Armoring Work and from Bog-Sherpur 132/33kVend.",
          "full_desc": "Sherpur(Bogura)-Sirajgonj 132 kV Ckt-2 Scheduled S/D from Sirajganj 132/33kV end Due to Conductor Armoring Work and from Bog-Sherpur 132/33kVend."
        },
        {
          "time": "09:29 - 19:07",
          "plant": "Madunaghat-Meghnaghat 400kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "Due to maintenance work",
          "full_desc": "Madunaghat-Meghnaghat 400kV Ckt-1 Scheduled S/D from Meghnaghat 400/230kV end Due to maintenance work"
        },
        {
          "time": "09:30 - 19:09",
          "plant": "Korerhat 400/230/132kV S/S Meghnaghat-1 Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to For project work",
          "full_desc": "Korerhat 400/230/132kV S/S Meghnaghat-1 Project Work S/D Due to For project work"
        },
        {
          "time": "09:54 - 21:17",
          "plant": "Korerhat 400/230/132kV S/S ATR-2(7203T)-Three Ph LT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to For project work",
          "full_desc": "Korerhat 400/230/132kV S/S ATR-2(7203T)-Three Ph LT Project Work S/D Due to For project work"
        },
        {
          "time": "09:54 - 21:15",
          "plant": "Korerhat 400/230/132kV S/S ATR-2(7203T)-Three Ph HT Project Work S/D",
          "load": "HT Outage",
          "reason": "Due to For project work",
          "full_desc": "Korerhat 400/230/132kV S/S ATR-2(7203T)-Three Ph HT Project Work S/D Due to For project work"
        },
        {
          "time": "10:17 - 11:40",
          "plant": "Ishurdi 230/132kV S/S 230 kV Bus 2 Project Work S/D",
          "load": "HT Outage",
          "reason": "Ishurdi 230/132kV S/S 230 kV Bus 2 Project Work S/D",
          "full_desc": "Ishurdi 230/132kV S/S 230 kV Bus 2 Project Work S/D"
        },
        {
          "time": "10:39 - 16:23",
          "plant": "Sherpur 132/33kV S/S Transformer- 03 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to TR-03 132 KV DS box installation works.",
          "full_desc": "Sherpur 132/33kV S/S Transformer- 03 LT Scheduled S/D Due to TR-03 132 KV DS box installation works."
        },
        {
          "time": "10:40 - 16:20",
          "plant": "Sherpur 132/33kV S/S Transformer- 03 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to TR-03 132 KV DS box installation works.",
          "full_desc": "Sherpur 132/33kV S/S Transformer- 03 HT Scheduled S/D Due to TR-03 132 KV DS box installation works."
        },
        {
          "time": "12:23 - 13:06",
          "plant": "Ishurdi 230/132kV S/S 230 kV Bus 1 Project Work S/D",
          "load": "HT Outage",
          "reason": "Ishurdi 230/132kV S/S 230 kV Bus 1 Project Work S/D",
          "full_desc": "Ishurdi 230/132kV S/S 230 kV Bus 1 Project Work S/D"
        },
        {
          "time": "17:10 - 18:25",
          "plant": "Purbasadipur-Thakurgaon-EPV  132kV Ckt-2 Forced",
          "load": "HT Outage",
          "reason": "Due to \u09ac\u09be\u09b8\u09be\u09ac\u09be\u09dc\u09bf\u09b0 \u09aa\u09cd\u09af\u09be\u09a8\u09c7\u09b2 \u09a4\u09c1\u09b2\u09a4\u09c7 \u0997\u09bf\u09df\u09c7 \u0995\u09a8\u09cd\u09a1\u09be\u0995\u09b0 \u099b\u09bf\u09dc\u09c7 \u09ab\u09c7\u09b2\u09c7\u099b\u09c7\u0964 \u09a4\u09be\u0987 \u0986\u09b0\u09cd\u09ae\u09be\u09b0\u09bf\u0982 \u0995\u09b0\u09be\u09b0 \u099c\u09a8\u09cd\u09af \u09b6\u09be\u099f\u09a1\u09be\u0989\u09a8",
          "full_desc": "Purbasadipur-Thakurgaon-EPV  132kV Ckt-2 Forced S/D from Purbasadipur 230/132/33kV end Due to \u09ac\u09be\u09b8\u09be\u09ac\u09be\u09dc\u09bf\u09b0 \u09aa\u09cd\u09af\u09be\u09a8\u09c7\u09b2 \u09a4\u09c1\u09b2\u09a4\u09c7 \u0997\u09bf\u09df\u09c7 \u0995\u09a8\u09cd\u09a1\u09be\u0995\u09b0 \u099b\u09bf\u09dc\u09c7 \u09ab\u09c7\u09b2\u09c7\u099b\u09c7\u0964 \u09a4\u09be\u0987 \u0986\u09b0\u09cd\u09ae\u09be\u09b0\u09bf\u0982 \u0995\u09b0\u09be\u09b0 \u099c\u09a8\u09cd\u09af \u09b6\u09be\u099f\u09a1\u09be\u0989\u09a8"
        },
        {
          "time": "19:26",
          "plant": "Kishoreganj 132/33kV S/S Tr-2 (414T) LT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to T-2 transformer 33 kv side PT oill leakage",
          "full_desc": "Kishoreganj 132/33kV S/S Tr-2 (414T) LT Forced S/D Due to T-2 transformer 33 kv side PT oill leakage"
        },
        {
          "time": "19:26",
          "plant": "Kishoreganj 132/33kV S/S Tr-2 (414T) HT Forced S/D",
          "load": "HT Outage",
          "reason": "Due to T-2 transformer 33 kv side PT oill leakage",
          "full_desc": "Kishoreganj 132/33kV S/S Tr-2 (414T) HT Forced S/D Due to T-2 transformer 33 kv side PT oill leakage"
        },
        {
          "time": "20:17",
          "plant": "Rampal 1320 MW (BIFPCL) Synchronized with remarks:- U1",
          "load": "1320 MW",
          "reason": "Rampal 1320 MW (BIFPCL) Synchronized with remarks:- U1",
          "full_desc": "Rampal 1320 MW (BIFPCL) Synchronized with remarks:- U1"
        },
        {
          "time": "06:00",
          "plant": "Patuakhali-Payra  132kV Ckt-1 Scheduled",
          "load": "HT Outage",
          "reason": "Due to High temperature Maintenance",
          "full_desc": "Patuakhali-Payra  132kV Ckt-1 Scheduled S/D from Payra 400/132/33kV end Due to High temperature Maintenance"
        },
        {
          "time": "07:36",
          "plant": "Purbasadipur 230/132/33kV S/S TR-4 LT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Uthrail 33kv feeder red hot",
          "full_desc": "Purbasadipur 230/132/33kV S/S TR-4 LT Scheduled S/D Due to Uthrail 33kv feeder red hot"
        },
        {
          "time": "07:36",
          "plant": "Purbasadipur 230/132/33kV S/S TR-4 HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Uthrail 33kv feeder red hot",
          "full_desc": "Purbasadipur 230/132/33kV S/S TR-4 HT Scheduled S/D Due to Uthrail 33kv feeder red hot"
        },
        {
          "time": "07:40",
          "plant": "Baroirhat 132/33kV S/S TR-1, 406T HT Scheduled S/D",
          "load": "HT Outage",
          "reason": "Due to Maintenance work",
          "full_desc": "Baroirhat 132/33kV S/S TR-1, 406T HT Scheduled S/D Due to Maintenance work"
        }
      ],
      "hourlyLoadData": [
        {
          "time": "00:00",
          "generation": 14548.3,
          "loadShed": 2529,
          "demand": 17191.3
        },
        {
          "time": "01:00",
          "generation": 14128.64,
          "loadShed": 2461,
          "demand": 16700.64
        },
        {
          "time": "02:00",
          "generation": 13941.78,
          "loadShed": 2296,
          "demand": 16340.78
        },
        {
          "time": "03:00",
          "generation": 13839.06,
          "loadShed": 2182,
          "demand": 16119.06
        },
        {
          "time": "04:00",
          "generation": 13773.64,
          "loadShed": 1910,
          "demand": 15769.64
        },
        {
          "time": "05:00",
          "generation": 13773.77,
          "loadShed": 1115,
          "demand": 14938.95
        },
        {
          "time": "06:00",
          "generation": 13478.64,
          "loadShed": 443,
          "demand": 13941.64
        },
        {
          "time": "07:00",
          "generation": 13753.59,
          "loadShed": 295,
          "demand": 14061.59
        },
        {
          "time": "08:00",
          "generation": 13820.09,
          "loadShed": 272,
          "demand": 14104.09
        },
        {
          "time": "09:00",
          "generation": 14049.82,
          "loadShed": 339,
          "demand": 14403.82
        },
        {
          "time": "10:00",
          "generation": 14215.82,
          "loadShed": 381,
          "demand": 14613.82
        },
        {
          "time": "11:00",
          "generation": 14350.49,
          "loadShed": 545,
          "demand": 14920.49
        },
        {
          "time": "12:00",
          "generation": 14441.07,
          "loadShed": 1107,
          "demand": 15598.07
        },
        {
          "time": "13:00",
          "generation": 14542.36,
          "loadShed": 1214,
          "demand": 15811.36
        },
        {
          "time": "14:00",
          "generation": 14315.95,
          "loadShed": 1540,
          "demand": 15924.95
        },
        {
          "time": "15:00",
          "generation": 14524.73,
          "loadShed": 0,
          "demand": 14524.73
        },
        {
          "time": "16:00",
          "generation": 14453.52,
          "loadShed": 1477,
          "demand": 15996.52
        },
        {
          "time": "17:00",
          "generation": 14197.74,
          "loadShed": 1486,
          "demand": 15750.74
        },
        {
          "time": "18:00",
          "generation": 14234.89,
          "loadShed": 698,
          "demand": 14963.89
        },
        {
          "time": "19:00",
          "generation": 15178.43,
          "loadShed": 1381,
          "demand": 16621.43
        },
        {
          "time": "19:30",
          "generation": 15177.96,
          "loadShed": 1725,
          "demand": 16980.96
        },
        {
          "time": "20:00",
          "generation": 15342.89,
          "loadShed": 1405,
          "demand": 16810.89
        },
        {
          "time": "21:00",
          "generation": 15700.01,
          "loadShed": 1785,
          "demand": 17565.01
        },
        {
          "time": "22:00",
          "generation": 15762.39,
          "loadShed": 1171,
          "demand": 16986.39
        },
        {
          "time": "23:00",
          "generation": 15615.83,
          "loadShed": 1549,
          "demand": 17234.83
        }
      ],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 477.7,
          "condensate": 370,
          "share": 18.1
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 138.6,
          "condensate": 662.7,
          "share": 5.3
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 93.4,
          "condensate": 69.1,
          "share": 3.5
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 895.8,
          "condensate": 4776.5,
          "share": 33.9
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31.4,
          "condensate": 93,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1002.7,
          "condensate": 26,
          "share": 38
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 270.4,
          "fertilizer": 73.1,
          "others": 1054.4,
          "total": 1397.9
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 207.2,
          "fertilizer": 0,
          "others": 88.3,
          "total": 295.4
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 36.6,
          "fertilizer": 38.3,
          "others": 171,
          "total": 246
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 221.1,
          "fertilizer": 40.1,
          "others": 113.1,
          "total": 374.3
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 127.9,
          "fertilizer": 0,
          "others": 29.4,
          "total": 157.3
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 54.2,
          "fertilizer": 0,
          "others": 4.6,
          "total": 58.8
        }
      ]
    },
  "2026-06-25": {
      "systemStats": {
        "date": "25 Jun 2026",
        "dayPeakGen": 13116.69,
        "eveningPeakGen": 15650.06,
        "dayPeakDemand": null,
        "eveningPeakDemand": 16347.06,
        "minGen": null,
        "maxGen": null,
        "totalEnergyGen": 332.33436583,
        "totalEnergyUnserved": null,
        "totalEnergyDemand": null,
        "maxTemp": null,
        "totalGasSuppliedPower": 889.26,
        "avgProductionCost": 6.273,
        "totalDailyCost": 2084685893
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 123.81,
          "cost": null,
          "unitCost": null,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 119.64,
          "cost": null,
          "unitCost": null,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 24.03,
          "cost": null,
          "unitCost": null,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 0.98,
          "cost": null,
          "unitCost": null,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 4.12,
          "cost": null,
          "unitCost": null,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 59.59,
          "cost": null,
          "unitCost": null,
          "color": "#a855f7"
        },
        {
          "name": "HSD (Diesel)",
          "gen": 0,
          "cost": null,
          "unitCost": null,
          "color": "#ef4444"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 21.65,
          "peakFlow": 902,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 33.41,
          "peakFlow": 1483.56,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.62,
          "peakFlow": 152,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 124,
          "demand": 5959,
          "pct": 2.1
        },
        {
          "zone": "Chattogram",
          "loadShed": 0,
          "demand": 1469,
          "pct": 0
        },
        {
          "zone": "Cumilla",
          "loadShed": 111,
          "demand": 1666,
          "pct": 6.7
        },
        {
          "zone": "Mymensingh",
          "loadShed": 282,
          "demand": 1434,
          "pct": 19.7
        },
        {
          "zone": "Sylhet",
          "loadShed": 19,
          "demand": 654,
          "pct": 2.9
        },
        {
          "zone": "Khulna",
          "loadShed": 0,
          "demand": 1788,
          "pct": 0
        },
        {
          "zone": "Barishal",
          "loadShed": 0,
          "demand": 488,
          "pct": 0
        },
        {
          "zone": "Rajshahi",
          "loadShed": 0,
          "demand": 1606,
          "pct": 0
        },
        {
          "zone": "Rangpur",
          "loadShed": 0,
          "demand": 1063,
          "pct": 0
        }
      ],
      "dailyOutages": [
        {
          "time": "12:11 - Khulna (C) S/S Tr-2 415 T HT Tripped showing Inter trip relays Due to 33 kv PBS feeder",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "12:12 - Khulna (C) S/S Tr-2 415 T LT Tripped showing O/C (t) relays Due to 33 kv PBS feeder fault",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "12:10 - Khulna (C) S/S TR-1 425T LT Tripped showing O/C, Ph.-A relays Due to 33 kv PBS feeder",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "17:20 - Kabirpur 132/33kV S/S XFR, T-2 LT Scheduled S/D Due to Red hot maintenance work by",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "17:19 - Kabirpur 132/33kV S/S XFR, T-2 HT Scheduled S/D Due to Red hot maintenance work by",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "15:33 - Munshiganj 132/33kV S/S Transformer-1 LT Tripped showing 81R relays Due to ROCOF Trip",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "15:33 - Munshiganj 132/33kV S/S Transformer-2 LT Tripped showing 81R relays Due to ROCOF trip",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "05:57 - Saidpur 132/33kV S/S TR-3 (424T) LT Tripped showing Non directional O/C&E/F relays Due to",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "05:57 - Saidpur 132/33kV S/S TR-3 (424T) HT Tripped showing Non directional O/C&E/F relays Due to",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        }
      ],
      "hourlyLoadData": [],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 479.9,
          "condensate": 372,
          "share": 18.4
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 137.6,
          "condensate": 613.9,
          "share": 5.3
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 92.4,
          "condensate": 65.2,
          "share": 3.5
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 897.4,
          "condensate": 4650.5,
          "share": 34.4
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31.4,
          "condensate": 93,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 970.6,
          "condensate": 25.2,
          "share": 37.2
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 272.5,
          "fertilizer": 73.6,
          "others": 1062.5,
          "total": 1408.6
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 208.8,
          "fertilizer": 0,
          "others": 89,
          "total": 297.8
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 36.9,
          "fertilizer": 38.6,
          "others": 172.3,
          "total": 247.8
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 222.8,
          "fertilizer": 40.4,
          "others": 114,
          "total": 377.2
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 128.9,
          "fertilizer": 0,
          "others": 29.7,
          "total": 158.6
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 54.6,
          "fertilizer": 0,
          "others": 4.6,
          "total": 59.2
        }
      ],
      "regionalDemandSource": "p1-published"
    },
  "2026-06-26": {
      "systemStats": {
        "date": "26 Jun 2026",
        "dayPeakGen": 13725.37,
        "eveningPeakGen": 15298.25,
        "dayPeakDemand": null,
        "eveningPeakDemand": 18301.25,
        "minGen": null,
        "maxGen": null,
        "totalEnergyGen": 340.18957446,
        "totalEnergyUnserved": null,
        "totalEnergyDemand": null,
        "maxTemp": null,
        "totalGasSuppliedPower": 905.31,
        "avgProductionCost": 6.383,
        "totalDailyCost": 2171540197
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 127.62,
          "cost": null,
          "unitCost": null,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 114.93,
          "cost": null,
          "unitCost": null,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 29.18,
          "cost": null,
          "unitCost": null,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 2.13,
          "cost": null,
          "unitCost": null,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 4.75,
          "cost": null,
          "unitCost": null,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 61.33,
          "cost": null,
          "unitCost": null,
          "color": "#a855f7"
        },
        {
          "name": "HSD (Diesel)",
          "gen": 0,
          "cost": null,
          "unitCost": null,
          "color": "#ef4444"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 21.07,
          "peakFlow": 798,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 35.41,
          "peakFlow": 1476.39,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.94,
          "peakFlow": 154,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 538,
          "demand": 6313.42,
          "pct": 8.5
        },
        {
          "zone": "Chattogram",
          "loadShed": 162,
          "demand": 1635.3,
          "pct": 9.9
        },
        {
          "zone": "Cumilla",
          "loadShed": 343,
          "demand": 1712,
          "pct": 20
        },
        {
          "zone": "Mymensingh",
          "loadShed": 519,
          "demand": 1550,
          "pct": 33.5
        },
        {
          "zone": "Sylhet",
          "loadShed": 247,
          "demand": 784,
          "pct": 31.5
        },
        {
          "zone": "Khulna",
          "loadShed": 375,
          "demand": 2081.4,
          "pct": 18
        },
        {
          "zone": "Barishal",
          "loadShed": 142,
          "demand": 569.6,
          "pct": 24.9
        },
        {
          "zone": "Rajshahi",
          "loadShed": 352,
          "demand": 1891.4,
          "pct": 18.6
        },
        {
          "zone": "Rangpur",
          "loadShed": 196,
          "demand": 1136,
          "pct": 17.3
        }
      ],
      "dailyOutages": [
        {
          "time": "10:34 - Feni 132/33kV S/S T-1(405T) HT Scheduled S/D Due to 33 KV PDB Salauddin Feeder",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "10:34 - Feni 132/33kV S/S T-1(405T) LT Scheduled S/D Due to 33 KV PDB Salauddin Feeder",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "10:56 - Barishal 132/33kV S/S T-1 (405T) LT Scheduled S/D Due to 33 kv Jhallokati Wzpdco feeder",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "10:54 - Barishal 132/33kV S/S T-1 (405T) HT Scheduled S/D Due to 33 kv Jhalokati wzpdco feeder",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "12:20 - Kalurghat 132/33kV S/S TRFO-01(506T) LT Tripped showing REF 615 relays Due to BPDB",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "21:19 - Sylhet_(South) 132/33kV S/S Trafo-2 LT Tripped showing BCPU relay. relays Due to 33 kv",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "21:19 - Sylhet_(South) 132/33kV S/S Trafo-1 LT Tripped showing BCPU relay. relays Due to 33 kv",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "21:25 - Chattak-Sylhet 132 kV Ckt-2 Tripped from Sylhet 132/33kV end showing Distance relays Due",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "21:48 - Sylhet_(South) 132/33kV S/S Trafo-2 LT Forced S/D Due to 33 kv Moglabazar feeder breaker",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "21:47 - Sylhet_(South) 132/33kV S/S Trafo-1 LT Forced S/D Due to 33 kv Moglabazar feeder breaker",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "07:24 - Sonargaon 132/33kV S/S Tr-2 LT Scheduled S/D Due to Due to PBS 33KV bus coupler  bypass",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        }
      ],
      "hourlyLoadData": [],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 480,
          "condensate": 375.1,
          "share": 17.8
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 139.6,
          "condensate": 629.6,
          "share": 5.2
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 91.2,
          "condensate": 52.9,
          "share": 3.4
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 895.4,
          "condensate": 4834.2,
          "share": 33.1
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31.7,
          "condensate": 85,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1066.2,
          "condensate": 27.7,
          "share": 39.4
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 272.2,
          "fertilizer": 73.5,
          "others": 1061.3,
          "total": 1407
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 208.5,
          "fertilizer": 0,
          "others": 88.8,
          "total": 297.3
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 36.8,
          "fertilizer": 38.5,
          "others": 172.1,
          "total": 247.4
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 222.5,
          "fertilizer": 40.3,
          "others": 113.9,
          "total": 376.7
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 128.8,
          "fertilizer": 0,
          "others": 29.6,
          "total": 158.4
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 54.5,
          "fertilizer": 0,
          "others": 4.6,
          "total": 59.1
        }
      ]
    },
  "2026-06-27": {
      "systemStats": {
        "date": "27 Jun 2026",
        "dayPeakGen": 14398.75,
        "eveningPeakGen": 16038.59,
        "dayPeakDemand": null,
        "eveningPeakDemand": 18354.59,
        "minGen": null,
        "maxGen": null,
        "totalEnergyGen": 350.52263338,
        "totalEnergyUnserved": null,
        "totalEnergyDemand": null,
        "maxTemp": null,
        "totalGasSuppliedPower": 891.07,
        "avgProductionCost": 6.44,
        "totalDailyCost": 2257271078
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 126.64,
          "cost": null,
          "unitCost": null,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 123.87,
          "cost": null,
          "unitCost": null,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 32.98,
          "cost": null,
          "unitCost": null,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 2.1,
          "cost": null,
          "unitCost": null,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 3.68,
          "cost": null,
          "unitCost": null,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 61.02,
          "cost": null,
          "unitCost": null,
          "color": "#a855f7"
        },
        {
          "name": "HSD (Diesel)",
          "gen": 0,
          "cost": null,
          "unitCost": null,
          "color": "#ef4444"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 20.78,
          "peakFlow": 798,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 35.49,
          "peakFlow": 1474.73,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.84,
          "peakFlow": 172,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 385,
          "demand": 6205.36,
          "pct": 6.2
        },
        {
          "zone": "Chattogram",
          "loadShed": 122,
          "demand": 1612,
          "pct": 7.6
        },
        {
          "zone": "Cumilla",
          "loadShed": 257,
          "demand": 1748,
          "pct": 14.7
        },
        {
          "zone": "Mymensingh",
          "loadShed": 420,
          "demand": 1513,
          "pct": 27.8
        },
        {
          "zone": "Sylhet",
          "loadShed": 211,
          "demand": 827,
          "pct": 25.5
        },
        {
          "zone": "Khulna",
          "loadShed": 298,
          "demand": 2105.4,
          "pct": 14.2
        },
        {
          "zone": "Barishal",
          "loadShed": 133,
          "demand": 593.5,
          "pct": 22.4
        },
        {
          "zone": "Rajshahi",
          "loadShed": 288,
          "demand": 1925,
          "pct": 15
        },
        {
          "zone": "Rangpur",
          "loadShed": 102,
          "demand": 1108,
          "pct": 9.2
        }
      ],
      "dailyOutages": [
        {
          "time": "15:36 - Niamatpur 132/33kV S/S Transformer-1(407T) LT Tripped showing Master trip relay relays",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "17:05 - Khulna(C )-Khulna (S)  132kV Ckt-2 Scheduled S/D from Khulna (C) end Due to Relay test by",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        }
      ],
      "hourlyLoadData": [],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 478.6,
          "condensate": 374.3,
          "share": 17.7
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 139.7,
          "condensate": 637.5,
          "share": 5.2
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 91.9,
          "condensate": 48.2,
          "share": 3.4
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 896.9,
          "condensate": 4781.6,
          "share": 33.1
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31,
          "condensate": 88,
          "share": 1.1
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1070.7,
          "condensate": 27.8,
          "share": 39.5
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 266.8,
          "fertilizer": 72.1,
          "others": 1040.5,
          "total": 1379.4
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 204.4,
          "fertilizer": 0,
          "others": 87.1,
          "total": 291.5
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 36.1,
          "fertilizer": 37.8,
          "others": 168.7,
          "total": 242.6
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 218.2,
          "fertilizer": 39.5,
          "others": 111.6,
          "total": 369.3
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 126.2,
          "fertilizer": 0,
          "others": 29,
          "total": 155.2
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 53.5,
          "fertilizer": 0,
          "others": 4.5,
          "total": 58
        }
      ]
    },
  "2026-06-28": {
      "systemStats": {
        "date": "28 Jun 2026",
        "dayPeakGen": 14669.72,
        "eveningPeakGen": 16082.14,
        "dayPeakDemand": null,
        "eveningPeakDemand": 16487.88,
        "minGen": null,
        "maxGen": null,
        "totalEnergyGen": 352.9664129,
        "totalEnergyUnserved": null,
        "totalEnergyDemand": null,
        "maxTemp": null,
        "totalGasSuppliedPower": 921.67,
        "avgProductionCost": 6.452,
        "totalDailyCost": 2277177949
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 128.74,
          "cost": null,
          "unitCost": null,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 126.57,
          "cost": null,
          "unitCost": null,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 35.26,
          "cost": null,
          "unitCost": null,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 2.1,
          "cost": null,
          "unitCost": null,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 1.79,
          "cost": null,
          "unitCost": null,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 58.16,
          "cost": null,
          "unitCost": null,
          "color": "#a855f7"
        },
        {
          "name": "HSD (Diesel)",
          "gen": 0,
          "cost": null,
          "unitCost": null,
          "color": "#ef4444"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 19.36,
          "peakFlow": 892,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 34.26,
          "peakFlow": 1427.64,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.62,
          "peakFlow": 156,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [
        {
          "zone": "Dhaka",
          "loadShed": 30,
          "demand": 5991.27,
          "pct": 0.5
        },
        {
          "zone": "Chattogram",
          "loadShed": 0,
          "demand": 1537.2,
          "pct": 0
        },
        {
          "zone": "Cumilla",
          "loadShed": 48,
          "demand": 1541,
          "pct": 3.1
        },
        {
          "zone": "Mymensingh",
          "loadShed": 93,
          "demand": 1217,
          "pct": 7.6
        },
        {
          "zone": "Sylhet",
          "loadShed": 96,
          "demand": 672,
          "pct": 14.3
        },
        {
          "zone": "Khulna",
          "loadShed": 0,
          "demand": 1856.4,
          "pct": 0
        },
        {
          "zone": "Barishal",
          "loadShed": 0,
          "demand": 491,
          "pct": 0
        },
        {
          "zone": "Rajshahi",
          "loadShed": 0,
          "demand": 1513.6,
          "pct": 0
        },
        {
          "zone": "Rangpur",
          "loadShed": 0,
          "demand": 975,
          "pct": 0
        }
      ],
      "dailyOutages": [
        {
          "time": "10:31 - Panchagarh 132/33kV S/S T-2(417T) HT Scheduled S/D Due to Red Hot Maintenance work on",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "10:31 - Panchagarh 132/33kV S/S T-2(417T) LT Scheduled S/D Due to Red Hot Maintenance work on",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "12:56 - Bhulta-Haripur 132 kV Ckt-1 Tripped from Bhulta 132/33kV end showing Impedance Relay",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "17:40 - Lalmonirhat 132/33kV S/S T-2 (415T) LT Forced S/D Due to T-2 33 kV riser DS (R phase)",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "19:57 - Gopalganj 132/33kV S/S T2 LT Tripped showing Instantineous earth fault relays.",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "19:56 - Gopalganj 132/33kV S/S T1 LT Tripped showing Instantineous Earth fault relays Due to Deu",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "23:24 - Chhatak 132/33kV S/S T-1 LT Scheduled S/D Due to For 33kV T-1 Bus DS Red Hot Maintenance",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "23:24 - Chhatak 132/33kV S/S T-1 HT Scheduled S/D Due to For 33kV T-1 Bus DS Red Hot Maintenance",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        }
      ],
      "hourlyLoadData": [
        {
          "time": "00:00",
          "generation": 15036.92,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "01:00",
          "generation": 14432.56,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "02:00",
          "generation": 14192.59,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "03:00",
          "generation": 14068.36,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "04:00",
          "generation": 14229.24,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "05:00",
          "generation": 14213.52,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "06:00",
          "generation": 13786.88,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "07:00",
          "generation": 13577.73,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "08:00",
          "generation": 13732.52,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "09:00",
          "generation": 13960.18,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "10:00",
          "generation": 14122.2,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "11:00",
          "generation": 14254.77,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "12:00",
          "generation": 14669.72,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "13:00",
          "generation": 14500.25,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "14:00",
          "generation": 14363.22,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "15:00",
          "generation": 14100.7,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "16:00",
          "generation": 14454.63,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "17:00",
          "generation": 14268.46,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "18:00",
          "generation": 14221.5,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "19:00",
          "generation": 15661.83,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "20:00",
          "generation": 15879.06,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "21:00",
          "generation": 15913.88,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "22:00",
          "generation": 15821.11,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "23:00",
          "generation": 15990.53,
          "loadShed": null,
          "demand": null
        }
      ],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 478.6,
          "condensate": 374.3,
          "share": 17.7
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 139.7,
          "condensate": 637.5,
          "share": 5.2
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 91.9,
          "condensate": 48.2,
          "share": 3.4
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 896.9,
          "condensate": 4781.6,
          "share": 33.1
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31,
          "condensate": 88,
          "share": 1.1
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1070.7,
          "condensate": 27.8,
          "share": 39.5
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 268.2,
          "fertilizer": 73.3,
          "others": 1093.7,
          "total": 1435.2
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 221.4,
          "fertilizer": 0,
          "others": 88.8,
          "total": 310.2
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 38.1,
          "fertilizer": 38.5,
          "others": 163.7,
          "total": 240.3
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 222,
          "fertilizer": 40.1,
          "others": 111,
          "total": 373
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 124.6,
          "fertilizer": 0,
          "others": 29.8,
          "total": 154.4
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 55.1,
          "fertilizer": 0,
          "others": 4.5,
          "total": 59.6
        }
      ]
    },
  "2026-06-29": {
      "systemStats": {
        "date": "29 Jun 2026",
        "dayPeakGen": 14920,
        "eveningPeakGen": 16152.14,
        "dayPeakDemand": null,
        "eveningPeakDemand": 16726.14,
        "minGen": null,
        "maxGen": null,
        "totalEnergyGen": 358.06819343,
        "totalEnergyUnserved": null,
        "totalEnergyDemand": null,
        "maxTemp": null,
        "totalGasSuppliedPower": 933.78,
        "avgProductionCost": 6.369,
        "totalDailyCost": 2280500601
      },
      "generationData": [
        {
          "name": "Gas",
          "gen": 129.23,
          "cost": null,
          "unitCost": null,
          "color": "#0ea5e9"
        },
        {
          "name": "Coal",
          "gen": 133.76,
          "cost": null,
          "unitCost": null,
          "color": "#64748b"
        },
        {
          "name": "HFO",
          "gen": 30.05,
          "cost": null,
          "unitCost": null,
          "color": "#f97316"
        },
        {
          "name": "Hydro",
          "gen": 2.33,
          "cost": null,
          "unitCost": null,
          "color": "#06b6d4"
        },
        {
          "name": "Solar",
          "gen": 4.04,
          "cost": null,
          "unitCost": null,
          "color": "#eab308"
        },
        {
          "name": "Imports",
          "gen": 58.49,
          "cost": null,
          "unitCost": null,
          "color": "#a855f7"
        },
        {
          "name": "HSD (Diesel)",
          "gen": 0,
          "cost": null,
          "unitCost": null,
          "color": "#ef4444"
        }
      ],
      "borderImportsData": [
        {
          "source": "HVDC Bheramara (India)",
          "energy": 20.63,
          "peakFlow": 904,
          "type": "C/B Interconnector (West)"
        },
        {
          "source": "Adani Godda (India)",
          "energy": 33.44,
          "peakFlow": 1420.78,
          "type": "C/B Interconnector (North)"
        },
        {
          "source": "Tripura Cumilla (India)",
          "energy": 3.51,
          "peakFlow": 144,
          "type": "C/B Interconnector (East)"
        }
      ],
      "regionalDemandData": [],
      "dailyOutages": [
        {
          "time": "19:40 - Barishal-Bhandaria 132 kV Ckt-1 Tripped from Barishal 132/33kV end showing Instt. R",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "20:45 - Ramganj 132/33kV S/S Transformer -02 LT Tripped showing over current relay relays Due to",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        },
        {
          "time": "20:45 - Ramganj 132/33kV S/S Transformer-01 LT Tripped showing over current relay relays Due to",
          "plant": "",
          "load": "HT Outage",
          "reason": "",
          "full_desc": ""
        }
      ],
      "hourlyLoadData": [
        {
          "time": "00:00",
          "generation": 15822.61,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "01:00",
          "generation": 15665.14,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "02:00",
          "generation": 14977.15,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "03:00",
          "generation": 14595.42,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "04:00",
          "generation": 14266.3,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "05:00",
          "generation": 14047.18,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "06:00",
          "generation": 13657.97,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "07:00",
          "generation": 13767.53,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "08:00",
          "generation": 13970.36,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "09:00",
          "generation": 14075.57,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "10:00",
          "generation": 14401.19,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "11:00",
          "generation": 14472.93,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "12:00",
          "generation": 14920,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "13:00",
          "generation": 15146.61,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "14:00",
          "generation": 15049.87,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "15:00",
          "generation": 15094.48,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "16:00",
          "generation": 14703.98,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "17:00",
          "generation": 14424.23,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "18:00",
          "generation": 14145.65,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "19:00",
          "generation": 15376.04,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "20:00",
          "generation": 15914.72,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "21:00",
          "generation": 15809.17,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "22:00",
          "generation": 15708.11,
          "loadShed": null,
          "demand": null
        },
        {
          "time": "23:00",
          "generation": 15824.33,
          "loadShed": null,
          "demand": null
        }
      ],
      "gasProductionData": [
        {
          "company": "BGFCL (Titas, Habiganj, Bakhrabad)",
          "fields": 5,
          "gas": 478.6,
          "condensate": 374.3,
          "share": 17.7
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 139.7,
          "condensate": 637.5,
          "share": 5.2
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 91.9,
          "condensate": 48.2,
          "share": 3.4
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 896.9,
          "condensate": 4781.6,
          "share": 33.1
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31,
          "condensate": 88,
          "share": 1.1
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1070.7,
          "condensate": 27.8,
          "share": 39.5
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 268.2,
          "fertilizer": 73.3,
          "others": 1093.7,
          "total": 1435.2
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 221.4,
          "fertilizer": 0,
          "others": 88.8,
          "total": 310.2
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 38.1,
          "fertilizer": 38.5,
          "others": 163.7,
          "total": 240.3
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 222,
          "fertilizer": 40.1,
          "others": 111,
          "total": 373
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 124.6,
          "fertilizer": 0,
          "others": 29.8,
          "total": 154.4
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 55.1,
          "fertilizer": 0,
          "others": 4.5,
          "total": 59.6
        }
      ],
      "regionalDemandSource": null
    }
};

export function getArchiveFallback(isoDate: string): GridDailyData | null {
  return powerGridArchive[isoDate] ?? null;
}
