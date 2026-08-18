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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 01-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (01.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              11,
              232,
              766
            ],
            "mvar": [
              -44,
              110,
              -108
            ]
          },
          {
            "time": "01:00",
            "mw": [
              7,
              214,
              680
            ],
            "mvar": [
              -40,
              116,
              -86
            ]
          },
          {
            "time": "02:00",
            "mw": [
              9,
              204,
              610
            ],
            "mvar": [
              -42,
              96,
              -86
            ]
          },
          {
            "time": "03:00",
            "mw": [
              10,
              210,
              562
            ],
            "mvar": [
              -41,
              106,
              -66
            ]
          },
          {
            "time": "04:00",
            "mw": [
              10,
              202,
              472
            ],
            "mvar": [
              -37,
              106,
              -54
            ]
          },
          {
            "time": "05:00",
            "mw": [
              12,
              188,
              356
            ],
            "mvar": [
              -35,
              92,
              -32
            ]
          },
          {
            "time": "06:00",
            "mw": [
              28,
              224,
              362
            ],
            "mvar": [
              -33,
              90,
              -16
            ]
          },
          {
            "time": "07:00",
            "mw": [
              22,
              196,
              302
            ],
            "mvar": [
              -34,
              84,
              -22
            ]
          },
          {
            "time": "08:00",
            "mw": [
              44,
              260,
              388
            ],
            "mvar": [
              -33,
              112,
              -14
            ]
          },
          {
            "time": "09:00",
            "mw": [
              44,
              284,
              474
            ],
            "mvar": [
              -33,
              102,
              -18
            ]
          },
          {
            "time": "10:00",
            "mw": [
              67,
              292,
              538
            ],
            "mvar": [
              -33,
              94,
              -8
            ]
          },
          {
            "time": "11:00",
            "mw": [
              69,
              296,
              520
            ],
            "mvar": [
              -34,
              94,
              8
            ]
          },
          {
            "time": "12:00",
            "mw": [
              61,
              294,
              426
            ],
            "mvar": [
              -32,
              102,
              18
            ]
          },
          {
            "time": "13:00",
            "mw": [
              55,
              298,
              418
            ],
            "mvar": [
              -37,
              112,
              -2
            ]
          },
          {
            "time": "14:00",
            "mw": [
              45,
              246,
              440
            ],
            "mvar": [
              -38,
              94,
              -24
            ]
          },
          {
            "time": "15:00",
            "mw": [
              42,
              260,
              460
            ],
            "mvar": [
              -36,
              112,
              -26
            ]
          },
          {
            "time": "16:00",
            "mw": [
              51,
              292,
              636
            ],
            "mvar": [
              -35,
              118,
              -22
            ]
          },
          {
            "time": "17:00",
            "mw": [
              52,
              288,
              688
            ],
            "mvar": [
              -33,
              108,
              -8
            ]
          },
          {
            "time": "18:00",
            "mw": [
              46,
              270,
              586
            ],
            "mvar": [
              -32,
              104,
              -2
            ]
          },
          {
            "time": "18:30",
            "mw": [
              50,
              300,
              648
            ],
            "mvar": [
              -31,
              108,
              24
            ]
          },
          {
            "time": "19:00",
            "mw": [
              29,
              280,
              496
            ],
            "mvar": [
              -36,
              128,
              0
            ]
          },
          {
            "time": "19:30",
            "mw": [
              0,
              216,
              562
            ],
            "mvar": [
              -10,
              102,
              -68
            ]
          },
          {
            "time": "20:00",
            "mw": [
              0,
              218,
              702
            ],
            "mvar": [
              -10,
              102,
              -74
            ]
          },
          {
            "time": "21:00",
            "mw": [
              1,
              254,
              796
            ],
            "mvar": [
              -53,
              140,
              -70
            ]
          },
          {
            "time": "22:00",
            "mw": [
              0,
              258,
              650
            ],
            "mvar": [
              -10,
              122,
              -62
            ]
          },
          {
            "time": "23:00",
            "mw": [
              57,
              208,
              718
            ],
            "mvar": [
              -9,
              100,
              -96
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 879854.55
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 1414000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 1416000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 6700000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 6690000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 17099854.55,
          "import": 0
        },
        "checks": [
          {
            "scope": "Ishurdi-Ghorashal",
            "message": "Ishurdi-Ghorashal: the MW curve integrates to 794,000 kWh but its circuits are metered at 879,855 kWh (0.90x). Both are reproduced as published."
          },
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 5,952,000 kWh but its circuits are metered at 2,830,000 kWh (2.10x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 14800,
        "maxDemandDayMw": 12200,
        "maxGenEveningMw": 14800,
        "totalEnergyGenMkwh": 289.6,
        "maxTempC": 27,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 13300,
            "loadShedMw": 0,
            "demandMw": 13300
          },
          {
            "time": "01:00",
            "generationMw": 13300,
            "loadShedMw": 0,
            "demandMw": 13300
          },
          {
            "time": "02:00",
            "generationMw": 12999,
            "loadShedMw": 0,
            "demandMw": 12999
          },
          {
            "time": "03:00",
            "generationMw": 12641,
            "loadShedMw": 0,
            "demandMw": 12641
          },
          {
            "time": "04:00",
            "generationMw": 12408,
            "loadShedMw": 0,
            "demandMw": 12408
          },
          {
            "time": "05:00",
            "generationMw": 12128,
            "loadShedMw": 0,
            "demandMw": 12128
          },
          {
            "time": "06:00",
            "generationMw": 11423,
            "loadShedMw": 0,
            "demandMw": 11423
          },
          {
            "time": "07:00",
            "generationMw": 11383,
            "loadShedMw": 0,
            "demandMw": 11383
          },
          {
            "time": "08:00",
            "generationMw": 11500,
            "loadShedMw": 0,
            "demandMw": 11500
          },
          {
            "time": "09:00",
            "generationMw": 11550,
            "loadShedMw": 0,
            "demandMw": 11550
          },
          {
            "time": "10:00",
            "generationMw": 11580,
            "loadShedMw": 0,
            "demandMw": 11580
          },
          {
            "time": "11:00",
            "generationMw": 11600,
            "loadShedMw": 0,
            "demandMw": 11600
          },
          {
            "time": "12:00",
            "generationMw": 12200,
            "loadShedMw": 0,
            "demandMw": 12200
          },
          {
            "time": "13:00",
            "generationMw": 12300,
            "loadShedMw": 0,
            "demandMw": 12300
          },
          {
            "time": "14:00",
            "generationMw": 12400,
            "loadShedMw": 0,
            "demandMw": 12400
          },
          {
            "time": "15:00",
            "generationMw": 12550,
            "loadShedMw": 0,
            "demandMw": 12550
          },
          {
            "time": "16:00",
            "generationMw": 12540,
            "loadShedMw": 0,
            "demandMw": 12540
          },
          {
            "time": "17:00",
            "generationMw": 12280,
            "loadShedMw": 0,
            "demandMw": 12280
          },
          {
            "time": "18:00",
            "generationMw": 12000,
            "loadShedMw": 0,
            "demandMw": 12000
          },
          {
            "time": "18:30",
            "generationMw": 12800,
            "loadShedMw": 0,
            "demandMw": 12800
          },
          {
            "time": "19:00",
            "generationMw": 13300,
            "loadShedMw": 0,
            "demandMw": 13300
          },
          {
            "time": "19:30",
            "generationMw": 13880,
            "loadShedMw": 0,
            "demandMw": 13880
          },
          {
            "time": "20:00",
            "generationMw": 14200,
            "loadShedMw": 0,
            "demandMw": 14200
          },
          {
            "time": "21:00",
            "generationMw": 14800,
            "loadShedMw": 0,
            "demandMw": 14800
          },
          {
            "time": "22:00",
            "generationMw": 14500,
            "loadShedMw": 0,
            "demandMw": 14500
          },
          {
            "time": "23:00",
            "generationMw": 14200,
            "loadShedMw": 0,
            "demandMw": 14200
          }
        ],
        "issuedAt": "2026-05-31T10:04:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-05-30",
        "issuedIn": "Daily Report 31-05-2026",
        "targetDay": "2026-05-31",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-05-31T00:00:00+06:00",
          "end": "2026-06-01T00:00:00+06:00",
          "filedAs": "2026-06-01",
          "sourceFile": "Daily Report 01-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-05-31T08:00:00+06:00",
          "end": "2026-06-01T08:00:00+06:00",
          "filedAs": "2026-06-01",
          "publishedLabel": "31 May - 01 June 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (01.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 02-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (02.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              67,
              206,
              796
            ],
            "mvar": [
              -3,
              96,
              -98
            ]
          },
          {
            "time": "01:00",
            "mw": [
              65,
              256,
              1074
            ],
            "mvar": [
              -21,
              114,
              -118
            ]
          },
          {
            "time": "02:00",
            "mw": [
              91,
              292,
              1024
            ],
            "mvar": [
              10,
              130,
              -90
            ]
          },
          {
            "time": "03:00",
            "mw": [
              96,
              324,
              1114
            ],
            "mvar": [
              13,
              144,
              -62
            ]
          },
          {
            "time": "04:00",
            "mw": [
              94,
              304,
              1100
            ],
            "mvar": [
              12,
              130,
              -60
            ]
          },
          {
            "time": "05:00",
            "mw": [
              94,
              288,
              1010
            ],
            "mvar": [
              14,
              130,
              -58
            ]
          },
          {
            "time": "06:00",
            "mw": [
              95,
              300,
              832
            ],
            "mvar": [
              18,
              122,
              -16
            ]
          },
          {
            "time": "07:00",
            "mw": [
              97,
              292,
              776
            ],
            "mvar": [
              20,
              134,
              -4
            ]
          },
          {
            "time": "08:00",
            "mw": [
              108,
              350,
              978
            ],
            "mvar": [
              23,
              138,
              38
            ]
          },
          {
            "time": "09:00",
            "mw": [
              126,
              446,
              1134
            ],
            "mvar": [
              31,
              166,
              88
            ]
          },
          {
            "time": "10:00",
            "mw": [
              134,
              486,
              1214
            ],
            "mvar": [
              34,
              156,
              140
            ]
          },
          {
            "time": "11:00",
            "mw": [
              131,
              454,
              1222
            ],
            "mvar": [
              33,
              102,
              150
            ]
          },
          {
            "time": "12:00",
            "mw": [
              128,
              480,
              1266
            ],
            "mvar": [
              29,
              158,
              164
            ]
          },
          {
            "time": "13:00",
            "mw": [
              126,
              470,
              1394
            ],
            "mvar": [
              23,
              156,
              204
            ]
          },
          {
            "time": "14:00",
            "mw": [
              128,
              470,
              1492
            ],
            "mvar": [
              25,
              162,
              214
            ]
          },
          {
            "time": "15:00",
            "mw": [
              135,
              530,
              1566
            ],
            "mvar": [
              30,
              184,
              222
            ]
          },
          {
            "time": "16:00",
            "mw": [
              132,
              480,
              1506
            ],
            "mvar": [
              28,
              146,
              210
            ]
          },
          {
            "time": "17:00",
            "mw": [
              81,
              460,
              1318
            ],
            "mvar": [
              9,
              130,
              206
            ]
          },
          {
            "time": "18:00",
            "mw": [
              133,
              470,
              1386
            ],
            "mvar": [
              29,
              128,
              138
            ]
          },
          {
            "time": "18:30",
            "mw": [
              136,
              470,
              1472
            ],
            "mvar": [
              31,
              124,
              106
            ]
          },
          {
            "time": "19:00",
            "mw": [
              143,
              510,
              1482
            ],
            "mvar": [
              33,
              148,
              78
            ]
          },
          {
            "time": "19:30",
            "mw": [
              139,
              460,
              1396
            ],
            "mvar": [
              27,
              112,
              10
            ]
          },
          {
            "time": "20:00",
            "mw": [
              139,
              450,
              1344
            ],
            "mvar": [
              31,
              120,
              62
            ]
          },
          {
            "time": "21:00",
            "mw": [
              144,
              480,
              1442
            ],
            "mvar": [
              33,
              128,
              60
            ]
          },
          {
            "time": "22:00",
            "mw": [
              137,
              470,
              1390
            ],
            "mvar": [
              29,
              154,
              52
            ]
          },
          {
            "time": "23:00",
            "mw": [
              142,
              470,
              1424
            ],
            "mvar": [
              37,
              160,
              66
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 2780072.73
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 2448000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 2452000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 14970000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 15000000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 37650072.73,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 9,850,000 kWh but its circuits are metered at 4,900,000 kWh (2.01x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 14550,
        "maxDemandDayMw": 12180,
        "maxGenEveningMw": 14550,
        "totalEnergyGenMkwh": 314.198,
        "maxTempC": 35,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 14400,
            "loadShedMw": 0,
            "demandMw": 14400
          },
          {
            "time": "01:00",
            "generationMw": 14240,
            "loadShedMw": 0,
            "demandMw": 14240
          },
          {
            "time": "02:00",
            "generationMw": 14140,
            "loadShedMw": 0,
            "demandMw": 14140
          },
          {
            "time": "03:00",
            "generationMw": 13930,
            "loadShedMw": 0,
            "demandMw": 13930
          },
          {
            "time": "04:00",
            "generationMw": 13580,
            "loadShedMw": 0,
            "demandMw": 13580
          },
          {
            "time": "05:00",
            "generationMw": 13210,
            "loadShedMw": 0,
            "demandMw": 13210
          },
          {
            "time": "06:00",
            "generationMw": 12238,
            "loadShedMw": 0,
            "demandMw": 12238
          },
          {
            "time": "07:00",
            "generationMw": 11760,
            "loadShedMw": 0,
            "demandMw": 11760
          },
          {
            "time": "08:00",
            "generationMw": 11580,
            "loadShedMw": 0,
            "demandMw": 11580
          },
          {
            "time": "09:00",
            "generationMw": 11460,
            "loadShedMw": 0,
            "demandMw": 11460
          },
          {
            "time": "10:00",
            "generationMw": 11570,
            "loadShedMw": 0,
            "demandMw": 11570
          },
          {
            "time": "11:00",
            "generationMw": 11640,
            "loadShedMw": 0,
            "demandMw": 11640
          },
          {
            "time": "12:00",
            "generationMw": 12180,
            "loadShedMw": 0,
            "demandMw": 12180
          },
          {
            "time": "13:00",
            "generationMw": 12820,
            "loadShedMw": 0,
            "demandMw": 12820
          },
          {
            "time": "14:00",
            "generationMw": 13200,
            "loadShedMw": 0,
            "demandMw": 13200
          },
          {
            "time": "15:00",
            "generationMw": 13180,
            "loadShedMw": 0,
            "demandMw": 13180
          },
          {
            "time": "16:00",
            "generationMw": 13080,
            "loadShedMw": 0,
            "demandMw": 13080
          },
          {
            "time": "17:00",
            "generationMw": 12660,
            "loadShedMw": 0,
            "demandMw": 12660
          },
          {
            "time": "18:00",
            "generationMw": 11900,
            "loadShedMw": 0,
            "demandMw": 11900
          },
          {
            "time": "18:30",
            "generationMw": 12350,
            "loadShedMw": 0,
            "demandMw": 12350
          },
          {
            "time": "19:00",
            "generationMw": 13250,
            "loadShedMw": 0,
            "demandMw": 13250
          },
          {
            "time": "19:30",
            "generationMw": 13710,
            "loadShedMw": 0,
            "demandMw": 13710
          },
          {
            "time": "20:00",
            "generationMw": 14000,
            "loadShedMw": 0,
            "demandMw": 14000
          },
          {
            "time": "21:00",
            "generationMw": 14550,
            "loadShedMw": 0,
            "demandMw": 14550
          },
          {
            "time": "22:00",
            "generationMw": 14780,
            "loadShedMw": 0,
            "demandMw": 14780
          },
          {
            "time": "23:00",
            "generationMw": 14850,
            "loadShedMw": 0,
            "demandMw": 14850
          }
        ],
        "issuedAt": "2026-06-01T09:50:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-05-31",
        "issuedIn": "Daily Report 01-06-2026",
        "targetDay": "2026-06-01",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-01T00:00:00+06:00",
          "end": "2026-06-02T00:00:00+06:00",
          "filedAs": "2026-06-02",
          "sourceFile": "Daily Report 02-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-01T08:00:00+06:00",
          "end": "2026-06-02T08:00:00+06:00",
          "filedAs": "2026-06-02",
          "publishedLabel": "01-02 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (02.06.26).pdf"
        }
      }
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
      "regionalDemandSource": "bpdb-published",
      "sourceFiles": {
        "pgcb": "Daily Report 03-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (03.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              138,
              440,
              1442
            ],
            "mvar": [
              32,
              138,
              46
            ]
          },
          {
            "time": "01:00",
            "mw": [
              137,
              456,
              1420
            ],
            "mvar": [
              32,
              140,
              14
            ]
          },
          {
            "time": "02:00",
            "mw": [
              132,
              420,
              1386
            ],
            "mvar": [
              35,
              130,
              36
            ]
          },
          {
            "time": "03:00",
            "mw": [
              135,
              440,
              1342
            ],
            "mvar": [
              34,
              128,
              46
            ]
          },
          {
            "time": "04:00",
            "mw": [
              134,
              450,
              1384
            ],
            "mvar": [
              33,
              128,
              64
            ]
          },
          {
            "time": "05:00",
            "mw": [
              133,
              450,
              1364
            ],
            "mvar": [
              33,
              128,
              86
            ]
          },
          {
            "time": "06:00",
            "mw": [
              135,
              460,
              1412
            ],
            "mvar": [
              39,
              124,
              116
            ]
          },
          {
            "time": "07:00",
            "mw": [
              136,
              480,
              1442
            ],
            "mvar": [
              40,
              122,
              120
            ]
          },
          {
            "time": "08:00",
            "mw": [
              139,
              560,
              1504
            ],
            "mvar": [
              42,
              142,
              162
            ]
          },
          {
            "time": "09:00",
            "mw": [
              149,
              580,
              1616
            ],
            "mvar": [
              46,
              170,
              242
            ]
          },
          {
            "time": "10:00",
            "mw": [
              155,
              610,
              1720
            ],
            "mvar": [
              45,
              184,
              288
            ]
          },
          {
            "time": "11:00",
            "mw": [
              158,
              580,
              1680
            ],
            "mvar": [
              48,
              184,
              304
            ]
          },
          {
            "time": "12:00",
            "mw": [
              155,
              560,
              1804
            ],
            "mvar": [
              49,
              182,
              310
            ]
          },
          {
            "time": "13:00",
            "mw": [
              155,
              566,
              1798
            ],
            "mvar": [
              47,
              180,
              270
            ]
          },
          {
            "time": "14:00",
            "mw": [
              140,
              484,
              1678
            ],
            "mvar": [
              37,
              140,
              212
            ]
          },
          {
            "time": "15:00",
            "mw": [
              150,
              496,
              1658
            ],
            "mvar": [
              45,
              176,
              210
            ]
          },
          {
            "time": "16:00",
            "mw": [
              146,
              490,
              1602
            ],
            "mvar": [
              41,
              174,
              226
            ]
          },
          {
            "time": "17:00",
            "mw": [
              138,
              480,
              1490
            ],
            "mvar": [
              38,
              160,
              192
            ]
          },
          {
            "time": "18:00",
            "mw": [
              131,
              400,
              1372
            ],
            "mvar": [
              33,
              134,
              168
            ]
          },
          {
            "time": "18:30",
            "mw": [
              137,
              400,
              1456
            ],
            "mvar": [
              38,
              150,
              184
            ]
          },
          {
            "time": "19:00",
            "mw": [
              138,
              364,
              1314
            ],
            "mvar": [
              40,
              136,
              68
            ]
          },
          {
            "time": "19:30",
            "mw": [
              136,
              390,
              1556
            ],
            "mvar": [
              33,
              122,
              34
            ]
          },
          {
            "time": "20:00",
            "mw": [
              130,
              390,
              1616
            ],
            "mvar": [
              28,
              116,
              58
            ]
          },
          {
            "time": "21:00",
            "mw": [
              136,
              360,
              1670
            ],
            "mvar": [
              34,
              104,
              64
            ]
          },
          {
            "time": "22:00",
            "mw": [
              141,
              390,
              1474
            ],
            "mvar": [
              40,
              132,
              70
            ]
          },
          {
            "time": "23:00",
            "mw": [
              137,
              360,
              1454
            ],
            "mvar": [
              38,
              126,
              92
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 3380581.82
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 1672.73
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 2808000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 2817000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 18440000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 18470000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 45917254.55,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 11,241,500 kWh but its circuits are metered at 5,625,000 kWh (2.00x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 15700,
        "maxDemandDayMw": 13160,
        "maxGenEveningMw": 15700,
        "totalEnergyGenMkwh": 328.19,
        "maxTempC": 34,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 14540,
            "loadShedMw": 0,
            "demandMw": 14540
          },
          {
            "time": "01:00",
            "generationMw": 14340,
            "loadShedMw": 0,
            "demandMw": 14340
          },
          {
            "time": "02:00",
            "generationMw": 13720,
            "loadShedMw": 0,
            "demandMw": 13720
          },
          {
            "time": "03:00",
            "generationMw": 13350,
            "loadShedMw": 0,
            "demandMw": 13350
          },
          {
            "time": "04:00",
            "generationMw": 13000,
            "loadShedMw": 0,
            "demandMw": 13000
          },
          {
            "time": "05:00",
            "generationMw": 12730,
            "loadShedMw": 0,
            "demandMw": 12730
          },
          {
            "time": "06:00",
            "generationMw": 12360,
            "loadShedMw": 0,
            "demandMw": 12360
          },
          {
            "time": "07:00",
            "generationMw": 12290,
            "loadShedMw": 0,
            "demandMw": 12290
          },
          {
            "time": "08:00",
            "generationMw": 12330,
            "loadShedMw": 0,
            "demandMw": 12330
          },
          {
            "time": "09:00",
            "generationMw": 12620,
            "loadShedMw": 0,
            "demandMw": 12620
          },
          {
            "time": "10:00",
            "generationMw": 12710,
            "loadShedMw": 0,
            "demandMw": 12710
          },
          {
            "time": "11:00",
            "generationMw": 12850,
            "loadShedMw": 0,
            "demandMw": 12850
          },
          {
            "time": "12:00",
            "generationMw": 13160,
            "loadShedMw": 0,
            "demandMw": 13160
          },
          {
            "time": "13:00",
            "generationMw": 13580,
            "loadShedMw": 0,
            "demandMw": 13580
          },
          {
            "time": "14:00",
            "generationMw": 13680,
            "loadShedMw": 0,
            "demandMw": 13680
          },
          {
            "time": "15:00",
            "generationMw": 13750,
            "loadShedMw": 0,
            "demandMw": 13750
          },
          {
            "time": "16:00",
            "generationMw": 13400,
            "loadShedMw": 0,
            "demandMw": 13400
          },
          {
            "time": "17:00",
            "generationMw": 13000,
            "loadShedMw": 0,
            "demandMw": 13000
          },
          {
            "time": "18:00",
            "generationMw": 13600,
            "loadShedMw": 0,
            "demandMw": 13600
          },
          {
            "time": "18:30",
            "generationMw": 14200,
            "loadShedMw": 0,
            "demandMw": 14200
          },
          {
            "time": "19:00",
            "generationMw": 14800,
            "loadShedMw": 0,
            "demandMw": 14800
          },
          {
            "time": "19:30",
            "generationMw": 15200,
            "loadShedMw": 0,
            "demandMw": 15200
          },
          {
            "time": "20:00",
            "generationMw": 15580,
            "loadShedMw": 0,
            "demandMw": 15580
          },
          {
            "time": "21:00",
            "generationMw": 15700,
            "loadShedMw": 0,
            "demandMw": 15700
          },
          {
            "time": "22:00",
            "generationMw": 15600,
            "loadShedMw": 0,
            "demandMw": 15600
          },
          {
            "time": "23:00",
            "generationMw": 15500,
            "loadShedMw": 0,
            "demandMw": 15500
          }
        ],
        "issuedAt": "2026-06-02T08:21:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-01",
        "issuedIn": "Daily Report 02-06-2026_",
        "targetDay": "2026-06-02",
        "layout": "scenario",
        "issuedFrom": "source-copy"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-02T00:00:00+06:00",
          "end": "2026-06-03T00:00:00+06:00",
          "filedAs": "2026-06-03",
          "sourceFile": "Daily Report 03-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-02T08:00:00+06:00",
          "end": "2026-06-03T08:00:00+06:00",
          "filedAs": "2026-06-03",
          "publishedLabel": "02-03 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (03.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 04-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (04.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              133,
              382,
              1572
            ],
            "mvar": [
              34,
              128,
              108
            ]
          },
          {
            "time": "01:00",
            "mw": [
              130,
              380,
              1552
            ],
            "mvar": [
              36,
              132,
              106
            ]
          },
          {
            "time": "02:00",
            "mw": [
              131,
              352,
              1536
            ],
            "mvar": [
              37,
              144,
              88
            ]
          },
          {
            "time": "03:00",
            "mw": [
              125,
              348,
              1528
            ],
            "mvar": [
              32,
              122,
              66
            ]
          },
          {
            "time": "04:00",
            "mw": [
              133,
              382,
              1574
            ],
            "mvar": [
              37,
              130,
              102
            ]
          },
          {
            "time": "05:00",
            "mw": [
              126,
              392,
              1596
            ],
            "mvar": [
              30,
              140,
              114
            ]
          },
          {
            "time": "06:00",
            "mw": [
              128,
              400,
              1668
            ],
            "mvar": [
              31,
              120,
              120
            ]
          },
          {
            "time": "07:00",
            "mw": [
              135,
              420,
              1514
            ],
            "mvar": [
              39,
              132,
              134
            ]
          },
          {
            "time": "08:00",
            "mw": [
              142,
              460,
              1694
            ],
            "mvar": [
              41,
              150,
              208
            ]
          },
          {
            "time": "09:00",
            "mw": [
              156,
              522,
              1790
            ],
            "mvar": [
              49,
              164,
              260
            ]
          },
          {
            "time": "10:00",
            "mw": [
              166,
              598,
              1960
            ],
            "mvar": [
              54,
              188,
              360
            ]
          },
          {
            "time": "11:00",
            "mw": [
              159,
              578,
              1956
            ],
            "mvar": [
              50,
              196,
              312
            ]
          },
          {
            "time": "12:00",
            "mw": [
              159,
              540,
              1846
            ],
            "mvar": [
              56,
              196,
              324
            ]
          },
          {
            "time": "13:00",
            "mw": [
              166,
              530,
              1826
            ],
            "mvar": [
              59,
              180,
              312
            ]
          },
          {
            "time": "14:00",
            "mw": [
              163,
              520,
              1882
            ],
            "mvar": [
              55,
              174,
              258
            ]
          },
          {
            "time": "15:00",
            "mw": [
              165,
              510,
              1866
            ],
            "mvar": [
              57,
              172,
              274
            ]
          },
          {
            "time": "16:00",
            "mw": [
              175,
              570,
              2006
            ],
            "mvar": [
              64,
              210,
              222
            ]
          },
          {
            "time": "17:00",
            "mw": [
              189,
              570,
              1902
            ],
            "mvar": [
              43,
              192,
              348
            ]
          },
          {
            "time": "18:00",
            "mw": [
              181,
              570,
              1634
            ],
            "mvar": [
              30,
              176,
              296
            ]
          },
          {
            "time": "18:30",
            "mw": [
              185,
              580,
              1648
            ],
            "mvar": [
              31,
              192,
              282
            ]
          },
          {
            "time": "19:00",
            "mw": [
              174,
              590,
              1694
            ],
            "mvar": [
              30,
              206,
              212
            ]
          },
          {
            "time": "19:30",
            "mw": [
              159,
              490,
              1672
            ],
            "mvar": [
              20,
              158,
              188
            ]
          },
          {
            "time": "20:00",
            "mw": [
              154,
              470,
              1616
            ],
            "mvar": [
              20,
              162,
              178
            ]
          },
          {
            "time": "21:00",
            "mw": [
              139,
              430,
              1642
            ],
            "mvar": [
              11,
              136,
              154
            ]
          },
          {
            "time": "22:00",
            "mw": [
              130,
              440,
              1632
            ],
            "mvar": [
              10,
              150,
              134
            ]
          },
          {
            "time": "23:00",
            "mw": [
              137,
              460,
              1720
            ],
            "mvar": [
              15,
              162,
              122
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 3608072.73
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 2843000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 2853000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 20720000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 20770000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 50794072.73,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 11,433,000 kWh but its circuits are metered at 5,696,000 kWh (2.01x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 16220,
        "maxDemandDayMw": 14050,
        "maxGenEveningMw": 16220,
        "totalEnergyGenMkwh": 349.64,
        "maxTempC": 34,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 15570,
            "loadShedMw": 0,
            "demandMw": 15570
          },
          {
            "time": "01:00",
            "generationMw": 15390,
            "loadShedMw": 0,
            "demandMw": 15390
          },
          {
            "time": "02:00",
            "generationMw": 14990,
            "loadShedMw": 0,
            "demandMw": 14990
          },
          {
            "time": "03:00",
            "generationMw": 14680,
            "loadShedMw": 0,
            "demandMw": 14680
          },
          {
            "time": "04:00",
            "generationMw": 14280,
            "loadShedMw": 0,
            "demandMw": 14280
          },
          {
            "time": "05:00",
            "generationMw": 14040,
            "loadShedMw": 0,
            "demandMw": 14040
          },
          {
            "time": "06:00",
            "generationMw": 13330,
            "loadShedMw": 0,
            "demandMw": 13330
          },
          {
            "time": "07:00",
            "generationMw": 13320,
            "loadShedMw": 0,
            "demandMw": 13320
          },
          {
            "time": "08:00",
            "generationMw": 13270,
            "loadShedMw": 0,
            "demandMw": 13270
          },
          {
            "time": "09:00",
            "generationMw": 13350,
            "loadShedMw": 0,
            "demandMw": 13350
          },
          {
            "time": "10:00",
            "generationMw": 13450,
            "loadShedMw": 0,
            "demandMw": 13450
          },
          {
            "time": "11:00",
            "generationMw": 13750,
            "loadShedMw": 0,
            "demandMw": 13750
          },
          {
            "time": "12:00",
            "generationMw": 14050,
            "loadShedMw": 0,
            "demandMw": 14050
          },
          {
            "time": "13:00",
            "generationMw": 14560,
            "loadShedMw": 0,
            "demandMw": 14560
          },
          {
            "time": "14:00",
            "generationMw": 14770,
            "loadShedMw": 0,
            "demandMw": 14770
          },
          {
            "time": "15:00",
            "generationMw": 14990,
            "loadShedMw": 0,
            "demandMw": 14990
          },
          {
            "time": "16:00",
            "generationMw": 14660,
            "loadShedMw": 0,
            "demandMw": 14660
          },
          {
            "time": "17:00",
            "generationMw": 14340,
            "loadShedMw": 0,
            "demandMw": 14340
          },
          {
            "time": "18:00",
            "generationMw": 13670,
            "loadShedMw": 0,
            "demandMw": 13670
          },
          {
            "time": "18:30",
            "generationMw": 14300,
            "loadShedMw": 0,
            "demandMw": 14300
          },
          {
            "time": "19:00",
            "generationMw": 15210,
            "loadShedMw": 0,
            "demandMw": 15210
          },
          {
            "time": "19:30",
            "generationMw": 16070,
            "loadShedMw": 0,
            "demandMw": 16070
          },
          {
            "time": "20:00",
            "generationMw": 16120,
            "loadShedMw": 0,
            "demandMw": 16120
          },
          {
            "time": "21:00",
            "generationMw": 16220,
            "loadShedMw": 0,
            "demandMw": 16220
          },
          {
            "time": "22:00",
            "generationMw": 15930,
            "loadShedMw": 0,
            "demandMw": 15930
          },
          {
            "time": "23:00",
            "generationMw": 15700,
            "loadShedMw": 0,
            "demandMw": 15700
          }
        ],
        "issuedAt": "2026-06-03T08:58:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-02",
        "issuedIn": "Daily Report 03-06-2026",
        "targetDay": "2026-06-03",
        "layout": "scenario",
        "issuedFrom": "source-copy"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-03T00:00:00+06:00",
          "end": "2026-06-04T00:00:00+06:00",
          "filedAs": "2026-06-04",
          "sourceFile": "Daily Report 04-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-03T08:00:00+06:00",
          "end": "2026-06-04T08:00:00+06:00",
          "filedAs": "2026-06-04",
          "publishedLabel": "03-04 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (04.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 05-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (05.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              140,
              440,
              1878
            ],
            "mvar": [
              21,
              152,
              128
            ]
          },
          {
            "time": "01:00",
            "mw": [
              133,
              420,
              1936
            ],
            "mvar": [
              21,
              150,
              124
            ]
          },
          {
            "time": "02:00",
            "mw": [
              136,
              446,
              1814
            ],
            "mvar": [
              23,
              154,
              170
            ]
          },
          {
            "time": "03:00",
            "mw": [
              140,
              466,
              1746
            ],
            "mvar": [
              26,
              162,
              198
            ]
          },
          {
            "time": "04:00",
            "mw": [
              138,
              464,
              1772
            ],
            "mvar": [
              24,
              164,
              196
            ]
          },
          {
            "time": "05:00",
            "mw": [
              149,
              482,
              1902
            ],
            "mvar": [
              30,
              174,
              212
            ]
          },
          {
            "time": "06:00",
            "mw": [
              138,
              430,
              1844
            ],
            "mvar": [
              25,
              144,
              208
            ]
          },
          {
            "time": "07:00",
            "mw": [
              138,
              420,
              1776
            ],
            "mvar": [
              27,
              158,
              216
            ]
          },
          {
            "time": "08:00",
            "mw": [
              148,
              430,
              1776
            ],
            "mvar": [
              36,
              164,
              306
            ]
          },
          {
            "time": "09:00",
            "mw": [
              167,
              460,
              1812
            ],
            "mvar": [
              44,
              156,
              74
            ]
          },
          {
            "time": "10:00",
            "mw": [
              176,
              500,
              1942
            ],
            "mvar": [
              49,
              190,
              368
            ]
          },
          {
            "time": "11:00",
            "mw": [
              186,
              530,
              2028
            ],
            "mvar": [
              50,
              186,
              378
            ]
          },
          {
            "time": "12:00",
            "mw": [
              172,
              490,
              1870
            ],
            "mvar": [
              43,
              150,
              360
            ]
          },
          {
            "time": "13:00",
            "mw": [
              149,
              410,
              1794
            ],
            "mvar": [
              31,
              104,
              290
            ]
          },
          {
            "time": "14:00",
            "mw": [
              143,
              390,
              1736
            ],
            "mvar": [
              32,
              114,
              322
            ]
          },
          {
            "time": "15:00",
            "mw": [
              152,
              460,
              1838
            ],
            "mvar": [
              37,
              168,
              328
            ]
          },
          {
            "time": "16:00",
            "mw": [
              161,
              480,
              1730
            ],
            "mvar": [
              40,
              170,
              320
            ]
          },
          {
            "time": "17:00",
            "mw": [
              179,
              520,
              1676
            ],
            "mvar": [
              48,
              180,
              368
            ]
          },
          {
            "time": "18:00",
            "mw": [
              209,
              610,
              1798
            ],
            "mvar": [
              44,
              166,
              374
            ]
          },
          {
            "time": "18:30",
            "mw": [
              223,
              670,
              1874
            ],
            "mvar": [
              43,
              186,
              382
            ]
          },
          {
            "time": "19:00",
            "mw": [
              210,
              660,
              1920
            ],
            "mvar": [
              45,
              204,
              362
            ]
          },
          {
            "time": "19:30",
            "mw": [
              183,
              510,
              1892
            ],
            "mvar": [
              32,
              150,
              276
            ]
          },
          {
            "time": "20:00",
            "mw": [
              173,
              500,
              1930
            ],
            "mvar": [
              28,
              160,
              266
            ]
          },
          {
            "time": "21:00",
            "mw": [
              163,
              490,
              2030
            ],
            "mvar": [
              31,
              194,
              338
            ]
          },
          {
            "time": "22:00",
            "mw": [
              165,
              500,
              2002
            ],
            "mvar": [
              34,
              182,
              316
            ]
          },
          {
            "time": "23:00",
            "mw": [
              127,
              430,
              1642
            ],
            "mvar": [
              21,
              170,
              264
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 3795418.18
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 1672.73
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 2844000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 2851000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 22000000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 22040000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 53532090.91,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 11,405,500 kWh but its circuits are metered at 5,695,000 kWh (2.00x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 16800,
        "maxDemandDayMw": 14870,
        "maxGenEveningMw": 16800,
        "totalEnergyGenMkwh": 361.43,
        "maxTempC": 35,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 16220,
            "loadShedMw": 0,
            "demandMw": 16220
          },
          {
            "time": "01:00",
            "generationMw": 15780,
            "loadShedMw": 0,
            "demandMw": 15780
          },
          {
            "time": "02:00",
            "generationMw": 15420,
            "loadShedMw": 0,
            "demandMw": 15420
          },
          {
            "time": "03:00",
            "generationMw": 15060,
            "loadShedMw": 0,
            "demandMw": 15060
          },
          {
            "time": "04:00",
            "generationMw": 14700,
            "loadShedMw": 0,
            "demandMw": 14700
          },
          {
            "time": "05:00",
            "generationMw": 14530,
            "loadShedMw": 0,
            "demandMw": 14530
          },
          {
            "time": "06:00",
            "generationMw": 13840,
            "loadShedMw": 0,
            "demandMw": 13840
          },
          {
            "time": "07:00",
            "generationMw": 13680,
            "loadShedMw": 0,
            "demandMw": 13680
          },
          {
            "time": "08:00",
            "generationMw": 13430,
            "loadShedMw": 0,
            "demandMw": 13430
          },
          {
            "time": "09:00",
            "generationMw": 13650,
            "loadShedMw": 0,
            "demandMw": 13650
          },
          {
            "time": "10:00",
            "generationMw": 14020,
            "loadShedMw": 0,
            "demandMw": 14020
          },
          {
            "time": "11:00",
            "generationMw": 14260,
            "loadShedMw": 0,
            "demandMw": 14260
          },
          {
            "time": "12:00",
            "generationMw": 14870,
            "loadShedMw": 0,
            "demandMw": 14870
          },
          {
            "time": "13:00",
            "generationMw": 15240,
            "loadShedMw": 0,
            "demandMw": 15240
          },
          {
            "time": "14:00",
            "generationMw": 15380,
            "loadShedMw": 0,
            "demandMw": 15380
          },
          {
            "time": "15:00",
            "generationMw": 15380,
            "loadShedMw": 0,
            "demandMw": 15380
          },
          {
            "time": "16:00",
            "generationMw": 15070,
            "loadShedMw": 0,
            "demandMw": 15070
          },
          {
            "time": "17:00",
            "generationMw": 14700,
            "loadShedMw": 0,
            "demandMw": 14700
          },
          {
            "time": "18:00",
            "generationMw": 14000,
            "loadShedMw": 0,
            "demandMw": 14000
          },
          {
            "time": "18:30",
            "generationMw": 14800,
            "loadShedMw": 0,
            "demandMw": 14800
          },
          {
            "time": "19:00",
            "generationMw": 15600,
            "loadShedMw": 0,
            "demandMw": 15600
          },
          {
            "time": "19:30",
            "generationMw": 16400,
            "loadShedMw": 0,
            "demandMw": 16400
          },
          {
            "time": "20:00",
            "generationMw": 16500,
            "loadShedMw": 0,
            "demandMw": 16500
          },
          {
            "time": "21:00",
            "generationMw": 16800,
            "loadShedMw": 0,
            "demandMw": 16800
          },
          {
            "time": "22:00",
            "generationMw": 16600,
            "loadShedMw": 0,
            "demandMw": 16600
          },
          {
            "time": "23:00",
            "generationMw": 16700,
            "loadShedMw": 0,
            "demandMw": 16700
          }
        ],
        "issuedAt": "2026-06-04T09:24:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-03",
        "issuedIn": "Daily Report 04-06-2026",
        "targetDay": "2026-06-04",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-04T00:00:00+06:00",
          "end": "2026-06-05T00:00:00+06:00",
          "filedAs": "2026-06-05",
          "sourceFile": "Daily Report 05-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-04T08:00:00+06:00",
          "end": "2026-06-05T08:00:00+06:00",
          "filedAs": "2026-06-05",
          "publishedLabel": "04-05 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (05.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 06-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (06.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              122,
              390,
              1614
            ],
            "mvar": [
              16,
              128,
              210
            ]
          },
          {
            "time": "01:00",
            "mw": [
              116,
              368,
              1530
            ],
            "mvar": [
              22,
              136,
              220
            ]
          },
          {
            "time": "02:00",
            "mw": [
              126,
              410,
              1446
            ],
            "mvar": [
              20,
              150,
              228
            ]
          },
          {
            "time": "03:00",
            "mw": [
              131,
              420,
              1446
            ],
            "mvar": [
              20,
              144,
              216
            ]
          },
          {
            "time": "04:00",
            "mw": [
              130,
              420,
              1488
            ],
            "mvar": [
              19,
              134,
              218
            ]
          },
          {
            "time": "05:00",
            "mw": [
              141,
              440,
              1518
            ],
            "mvar": [
              24,
              130,
              256
            ]
          },
          {
            "time": "06:00",
            "mw": [
              141,
              410,
              1372
            ],
            "mvar": [
              20,
              114,
              236
            ]
          },
          {
            "time": "07:00",
            "mw": [
              131,
              390,
              1200
            ],
            "mvar": [
              18,
              116,
              258
            ]
          },
          {
            "time": "08:00",
            "mw": [
              155,
              420,
              1210
            ],
            "mvar": [
              24,
              116,
              192
            ]
          },
          {
            "time": "09:00",
            "mw": [
              177,
              460,
              1302
            ],
            "mvar": [
              26,
              118,
              330
            ]
          },
          {
            "time": "10:00",
            "mw": [
              191,
              490,
              1310
            ],
            "mvar": [
              29,
              124,
              366
            ]
          },
          {
            "time": "11:00",
            "mw": [
              190,
              480,
              1378
            ],
            "mvar": [
              28,
              116,
              384
            ]
          },
          {
            "time": "12:00",
            "mw": [
              168,
              430,
              1268
            ],
            "mvar": [
              20,
              108,
              392
            ]
          },
          {
            "time": "13:00",
            "mw": [
              124,
              340,
              1120
            ],
            "mvar": [
              6,
              120,
              262
            ]
          },
          {
            "time": "14:00",
            "mw": [
              118,
              364,
              1000
            ],
            "mvar": [
              0,
              124,
              236
            ]
          },
          {
            "time": "15:00",
            "mw": [
              143,
              380,
              1194
            ],
            "mvar": [
              9,
              96,
              294
            ]
          },
          {
            "time": "16:00",
            "mw": [
              140,
              410,
              1130
            ],
            "mvar": [
              8,
              108,
              280
            ]
          },
          {
            "time": "17:00",
            "mw": [
              148,
              430,
              1196
            ],
            "mvar": [
              11,
              110,
              300
            ]
          },
          {
            "time": "18:00",
            "mw": [
              145,
              420,
              1166
            ],
            "mvar": [
              10,
              104,
              270
            ]
          },
          {
            "time": "18:30",
            "mw": [
              134,
              400,
              1150
            ],
            "mvar": [
              7,
              108,
              246
            ]
          },
          {
            "time": "19:00",
            "mw": [
              134,
              420,
              1238
            ],
            "mvar": [
              8,
              140,
              236
            ]
          },
          {
            "time": "19:30",
            "mw": [
              102,
              320,
              1190
            ],
            "mvar": [
              -10,
              110,
              134
            ]
          },
          {
            "time": "20:00",
            "mw": [
              95,
              320,
              1326
            ],
            "mvar": [
              -5,
              120,
              130
            ]
          },
          {
            "time": "21:00",
            "mw": [
              108,
              366,
              1350
            ],
            "mvar": [
              2,
              150,
              184
            ]
          },
          {
            "time": "22:00",
            "mw": [
              103,
              340,
              1336
            ],
            "mvar": [
              4,
              124,
              138
            ]
          },
          {
            "time": "23:00",
            "mw": [
              105,
              360,
              1334
            ],
            "mvar": [
              4,
              130,
              122
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 3286909.09
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 2426000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 2434000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 8146909.09,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 9,628,000 kWh but its circuits are metered at 4,860,000 kWh (1.98x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 14600,
        "maxDemandDayMw": 13200,
        "maxGenEveningMw": 14600,
        "totalEnergyGenMkwh": 355.06,
        "maxTempC": 36,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 16090,
            "loadShedMw": 0,
            "demandMw": 16090
          },
          {
            "time": "01:00",
            "generationMw": 15425.047120418849,
            "loadShedMw": 0,
            "demandMw": 15425.047120418849
          },
          {
            "time": "02:00",
            "generationMw": 15366.575916230366,
            "loadShedMw": 0,
            "demandMw": 15366.575916230366
          },
          {
            "time": "03:00",
            "generationMw": 14860.633507853403,
            "loadShedMw": 0,
            "demandMw": 14860.633507853403
          },
          {
            "time": "04:00",
            "generationMw": 14408.397905759162,
            "loadShedMw": 0,
            "demandMw": 14408.397905759162
          },
          {
            "time": "05:00",
            "generationMw": 14054.162303664922,
            "loadShedMw": 0,
            "demandMw": 14054.162303664922
          },
          {
            "time": "06:00",
            "generationMw": 13459.696335078534,
            "loadShedMw": 0,
            "demandMw": 13459.696335078534
          },
          {
            "time": "07:00",
            "generationMw": 12931.71727748691,
            "loadShedMw": 0,
            "demandMw": 12931.71727748691
          },
          {
            "time": "08:00",
            "generationMw": 12950,
            "loadShedMw": 0,
            "demandMw": 12950
          },
          {
            "time": "09:00",
            "generationMw": 12800,
            "loadShedMw": 0,
            "demandMw": 12800
          },
          {
            "time": "10:00",
            "generationMw": 12980,
            "loadShedMw": 0,
            "demandMw": 12980
          },
          {
            "time": "11:00",
            "generationMw": 13070,
            "loadShedMw": 0,
            "demandMw": 13070
          },
          {
            "time": "12:00",
            "generationMw": 13200,
            "loadShedMw": 0,
            "demandMw": 13200
          },
          {
            "time": "13:00",
            "generationMw": 13562,
            "loadShedMw": 0,
            "demandMw": 13562
          },
          {
            "time": "14:00",
            "generationMw": 13554,
            "loadShedMw": 0,
            "demandMw": 13554
          },
          {
            "time": "15:00",
            "generationMw": 13566,
            "loadShedMw": 0,
            "demandMw": 13566
          },
          {
            "time": "16:00",
            "generationMw": 13480,
            "loadShedMw": 0,
            "demandMw": 13480
          },
          {
            "time": "17:00",
            "generationMw": 13214,
            "loadShedMw": 0,
            "demandMw": 13214
          },
          {
            "time": "18:00",
            "generationMw": 12544,
            "loadShedMw": 0,
            "demandMw": 12544
          },
          {
            "time": "18:30",
            "generationMw": 13859,
            "loadShedMw": 0,
            "demandMw": 13859
          },
          {
            "time": "19:00",
            "generationMw": 14291,
            "loadShedMw": 0,
            "demandMw": 14291
          },
          {
            "time": "19:30",
            "generationMw": 14351,
            "loadShedMw": 0,
            "demandMw": 14351
          },
          {
            "time": "20:00",
            "generationMw": 14527,
            "loadShedMw": 0,
            "demandMw": 14527
          },
          {
            "time": "21:00",
            "generationMw": 14600,
            "loadShedMw": 0,
            "demandMw": 14600
          },
          {
            "time": "22:00",
            "generationMw": 14578,
            "loadShedMw": 0,
            "demandMw": 14578
          },
          {
            "time": "23:00",
            "generationMw": 14300,
            "loadShedMw": 0,
            "demandMw": 14300
          }
        ],
        "issuedAt": "2026-06-05T08:36:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-04",
        "issuedIn": "Daily Report 05-06-2026_",
        "targetDay": "2026-06-05",
        "layout": "scenario",
        "issuedFrom": "source-copy"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-05T00:00:00+06:00",
          "end": "2026-06-06T00:00:00+06:00",
          "filedAs": "2026-06-06",
          "sourceFile": "Daily Report 06-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-05T08:00:00+06:00",
          "end": "2026-06-06T08:00:00+06:00",
          "filedAs": "2026-06-06",
          "publishedLabel": "05-06 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (06.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 07-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (07.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              103,
              352,
              1330
            ],
            "mvar": [
              0,
              131,
              118
            ]
          },
          {
            "time": "01:00",
            "mw": [
              94,
              350,
              1348
            ],
            "mvar": [
              4,
              120,
              116
            ]
          },
          {
            "time": "02:00",
            "mw": [
              99,
              360,
              1400
            ],
            "mvar": [
              9,
              136,
              136
            ]
          },
          {
            "time": "03:00",
            "mw": [
              115,
              390,
              1448
            ],
            "mvar": [
              7,
              134,
              134
            ]
          },
          {
            "time": "04:00",
            "mw": [
              121,
              400,
              1404
            ],
            "mvar": [
              10,
              140,
              158
            ]
          },
          {
            "time": "05:00",
            "mw": [
              126,
              400,
              1404
            ],
            "mvar": [
              13,
              136,
              174
            ]
          },
          {
            "time": "06:00",
            "mw": [
              134,
              390,
              1382
            ],
            "mvar": [
              18,
              130,
              202
            ]
          },
          {
            "time": "07:00",
            "mw": [
              130,
              380,
              1334
            ],
            "mvar": [
              16,
              120,
              188
            ]
          },
          {
            "time": "08:00",
            "mw": [
              148,
              416,
              1344
            ],
            "mvar": [
              27,
              154,
              272
            ]
          },
          {
            "time": "09:00",
            "mw": [
              186,
              506,
              1696
            ],
            "mvar": [
              46,
              172,
              376
            ]
          },
          {
            "time": "10:00",
            "mw": [
              202,
              568,
              1782
            ],
            "mvar": [
              61,
              194,
              398
            ]
          },
          {
            "time": "11:00",
            "mw": [
              208,
              590,
              1942
            ],
            "mvar": [
              63,
              204,
              444
            ]
          },
          {
            "time": "12:00",
            "mw": [
              200,
              552,
              1836
            ],
            "mvar": [
              63,
              166,
              446
            ]
          },
          {
            "time": "13:00",
            "mw": [
              210,
              556,
              1724
            ],
            "mvar": [
              53,
              172,
              420
            ]
          },
          {
            "time": "14:00",
            "mw": [
              242,
              722,
              1716
            ],
            "mvar": [
              56,
              224,
              470
            ]
          },
          {
            "time": "15:00",
            "mw": [
              228,
              590,
              1824
            ],
            "mvar": [
              67,
              214,
              520
            ]
          },
          {
            "time": "16:00",
            "mw": [
              222,
              560,
              1812
            ],
            "mvar": [
              55,
              194,
              492
            ]
          },
          {
            "time": "17:00",
            "mw": [
              197,
              490,
              1764
            ],
            "mvar": [
              25,
              118,
              474
            ]
          },
          {
            "time": "18:00",
            "mw": [
              162,
              410,
              1320
            ],
            "mvar": [
              8,
              112,
              308
            ]
          },
          {
            "time": "18:30",
            "mw": [
              173,
              470,
              1508
            ],
            "mvar": [
              8,
              138,
              356
            ]
          },
          {
            "time": "19:00",
            "mw": [
              171,
              520,
              1642
            ],
            "mvar": [
              9,
              150,
              344
            ]
          },
          {
            "time": "19:30",
            "mw": [
              142,
              410,
              1512
            ],
            "mvar": [
              -2,
              112,
              270
            ]
          },
          {
            "time": "20:00",
            "mw": [
              143,
              430,
              1492
            ],
            "mvar": [
              -4,
              130,
              270
            ]
          },
          {
            "time": "21:00",
            "mw": [
              143,
              440,
              1472
            ],
            "mvar": [
              -1,
              150,
              260
            ]
          },
          {
            "time": "22:00",
            "mw": [
              136,
              440,
              1426
            ],
            "mvar": [
              -5,
              152,
              246
            ]
          },
          {
            "time": "23:00",
            "mw": [
              140,
              470,
              1456
            ],
            "mvar": [
              -4,
              170,
              232
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 3877381.82
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 1672.73
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 2801000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 2810000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 18650000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 18670000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 46810054.55,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 11,311,000 kWh but its circuits are metered at 5,611,000 kWh (2.02x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 15414,
        "maxDemandDayMw": 13800,
        "maxGenEveningMw": 15414,
        "totalEnergyGenMkwh": 308.306,
        "maxTempC": 33,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 13442,
            "loadShedMw": 0,
            "demandMw": 13442
          },
          {
            "time": "01:00",
            "generationMw": 14465,
            "loadShedMw": 0,
            "demandMw": 14465
          },
          {
            "time": "02:00",
            "generationMw": 13949,
            "loadShedMw": 0,
            "demandMw": 13949
          },
          {
            "time": "03:00",
            "generationMw": 13577,
            "loadShedMw": 0,
            "demandMw": 13577
          },
          {
            "time": "04:00",
            "generationMw": 13247,
            "loadShedMw": 0,
            "demandMw": 13247
          },
          {
            "time": "05:00",
            "generationMw": 13052,
            "loadShedMw": 0,
            "demandMw": 13052
          },
          {
            "time": "06:00",
            "generationMw": 12674,
            "loadShedMw": 0,
            "demandMw": 12674
          },
          {
            "time": "07:00",
            "generationMw": 12767,
            "loadShedMw": 0,
            "demandMw": 12767
          },
          {
            "time": "08:00",
            "generationMw": 12992,
            "loadShedMw": 0,
            "demandMw": 12992
          },
          {
            "time": "09:00",
            "generationMw": 13220,
            "loadShedMw": 0,
            "demandMw": 13220
          },
          {
            "time": "10:00",
            "generationMw": 13300,
            "loadShedMw": 0,
            "demandMw": 13300
          },
          {
            "time": "11:00",
            "generationMw": 13700,
            "loadShedMw": 0,
            "demandMw": 13700
          },
          {
            "time": "12:00",
            "generationMw": 13800,
            "loadShedMw": 0,
            "demandMw": 13800
          },
          {
            "time": "13:00",
            "generationMw": 13500,
            "loadShedMw": 0,
            "demandMw": 13500
          },
          {
            "time": "14:00",
            "generationMw": 13600,
            "loadShedMw": 0,
            "demandMw": 13600
          },
          {
            "time": "15:00",
            "generationMw": 13700,
            "loadShedMw": 0,
            "demandMw": 13700
          },
          {
            "time": "16:00",
            "generationMw": 13600,
            "loadShedMw": 0,
            "demandMw": 13600
          },
          {
            "time": "17:00",
            "generationMw": 13400,
            "loadShedMw": 0,
            "demandMw": 13400
          },
          {
            "time": "18:00",
            "generationMw": 13380,
            "loadShedMw": 0,
            "demandMw": 13380
          },
          {
            "time": "18:30",
            "generationMw": 14200,
            "loadShedMw": 0,
            "demandMw": 14200
          },
          {
            "time": "19:00",
            "generationMw": 14900,
            "loadShedMw": 0,
            "demandMw": 14900
          },
          {
            "time": "19:30",
            "generationMw": 15414,
            "loadShedMw": 0,
            "demandMw": 15414
          },
          {
            "time": "20:00",
            "generationMw": 15270,
            "loadShedMw": 0,
            "demandMw": 15270
          },
          {
            "time": "21:00",
            "generationMw": 15380,
            "loadShedMw": 0,
            "demandMw": 15380
          },
          {
            "time": "22:00",
            "generationMw": 15270,
            "loadShedMw": 0,
            "demandMw": 15270
          },
          {
            "time": "23:00",
            "generationMw": 15100,
            "loadShedMw": 0,
            "demandMw": 15100
          }
        ],
        "issuedAt": "2026-06-06T10:15:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-05",
        "issuedIn": "Daily Report 06-06-2026",
        "targetDay": "2026-06-06",
        "layout": "scenario",
        "issuedFrom": "source-copy"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-06T00:00:00+06:00",
          "end": "2026-06-07T00:00:00+06:00",
          "filedAs": "2026-06-07",
          "sourceFile": "Daily Report 07-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-06T08:00:00+06:00",
          "end": "2026-06-07T08:00:00+06:00",
          "filedAs": "2026-06-07",
          "publishedLabel": "06-07 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (07.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 08-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (08.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              146,
              472,
              1484
            ],
            "mvar": [
              -1,
              162,
              238
            ]
          },
          {
            "time": "01:00",
            "mw": [
              127,
              434,
              1400
            ],
            "mvar": [
              -6,
              156,
              246
            ]
          },
          {
            "time": "02:00",
            "mw": [
              128,
              440,
              1390
            ],
            "mvar": [
              -4,
              150,
              256
            ]
          },
          {
            "time": "03:00",
            "mw": [
              138,
              430,
              1428
            ],
            "mvar": [
              3,
              168,
              286
            ]
          },
          {
            "time": "04:00",
            "mw": [
              144,
              450,
              1532
            ],
            "mvar": [
              4,
              164,
              304
            ]
          },
          {
            "time": "05:00",
            "mw": [
              147,
              430,
              1560
            ],
            "mvar": [
              3,
              142,
              290
            ]
          },
          {
            "time": "06:00",
            "mw": [
              143,
              400,
              1398
            ],
            "mvar": [
              5,
              138,
              316
            ]
          },
          {
            "time": "07:00",
            "mw": [
              138,
              390,
              1430
            ],
            "mvar": [
              7,
              138,
              334
            ]
          },
          {
            "time": "08:00",
            "mw": [
              160,
              450,
              1554
            ],
            "mvar": [
              15,
              160,
              376
            ]
          },
          {
            "time": "09:00",
            "mw": [
              196,
              560,
              1834
            ],
            "mvar": [
              37,
              210,
              504
            ]
          },
          {
            "time": "10:00",
            "mw": [
              200,
              570,
              1914
            ],
            "mvar": [
              44,
              218,
              538
            ]
          },
          {
            "time": "11:00",
            "mw": [
              190,
              540,
              1790
            ],
            "mvar": [
              43,
              216,
              552
            ]
          },
          {
            "time": "12:00",
            "mw": [
              187,
              540,
              1728
            ],
            "mvar": [
              50,
              236,
              536
            ]
          },
          {
            "time": "13:00",
            "mw": [
              165,
              520,
              1614
            ],
            "mvar": [
              37,
              204,
              548
            ]
          },
          {
            "time": "14:00",
            "mw": [
              171,
              540,
              1670
            ],
            "mvar": [
              44,
              220,
              586
            ]
          },
          {
            "time": "15:00",
            "mw": [
              191,
              570,
              1858
            ],
            "mvar": [
              65,
              248,
              740
            ]
          },
          {
            "time": "16:00",
            "mw": [
              176,
              490,
              1726
            ],
            "mvar": [
              61,
              220,
              700
            ]
          },
          {
            "time": "17:00",
            "mw": [
              174,
              480,
              1658
            ],
            "mvar": [
              54,
              200,
              622
            ]
          },
          {
            "time": "18:00",
            "mw": [
              188,
              520,
              1588
            ],
            "mvar": [
              21,
              160,
              506
            ]
          },
          {
            "time": "18:30",
            "mw": [
              188,
              490,
              1576
            ],
            "mvar": [
              23,
              132,
              528
            ]
          },
          {
            "time": "19:00",
            "mw": [
              189,
              480,
              1546
            ],
            "mvar": [
              30,
              140,
              476
            ]
          },
          {
            "time": "19:30",
            "mw": [
              162,
              410,
              1546
            ],
            "mvar": [
              24,
              150,
              488
            ]
          },
          {
            "time": "20:00",
            "mw": [
              148,
              410,
              1514
            ],
            "mvar": [
              18,
              156,
              440
            ]
          },
          {
            "time": "21:00",
            "mw": [
              144,
              410,
              1490
            ],
            "mvar": [
              28,
              180,
              462
            ]
          },
          {
            "time": "22:00",
            "mw": [
              142,
              430,
              1560
            ],
            "mvar": [
              23,
              162,
              446
            ]
          },
          {
            "time": "23:00",
            "mw": [
              134,
              450,
              1630
            ],
            "mvar": [
              12,
              180,
              466
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 3864000
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 2813000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 2821000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 19370000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 19410000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 48278000,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 11,372,500 kWh but its circuits are metered at 5,634,000 kWh (2.02x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 16290,
        "maxDemandDayMw": 14870,
        "maxGenEveningMw": 16290,
        "totalEnergyGenMkwh": 359.03,
        "maxTempC": 34,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 16210,
            "loadShedMw": 0,
            "demandMw": 16210
          },
          {
            "time": "01:00",
            "generationMw": 15780,
            "loadShedMw": 0,
            "demandMw": 15780
          },
          {
            "time": "02:00",
            "generationMw": 15420,
            "loadShedMw": 0,
            "demandMw": 15420
          },
          {
            "time": "03:00",
            "generationMw": 15060,
            "loadShedMw": 0,
            "demandMw": 15060
          },
          {
            "time": "04:00",
            "generationMw": 14700,
            "loadShedMw": 0,
            "demandMw": 14700
          },
          {
            "time": "05:00",
            "generationMw": 14530,
            "loadShedMw": 0,
            "demandMw": 14530
          },
          {
            "time": "06:00",
            "generationMw": 13840,
            "loadShedMw": 0,
            "demandMw": 13840
          },
          {
            "time": "07:00",
            "generationMw": 13680,
            "loadShedMw": 0,
            "demandMw": 13680
          },
          {
            "time": "08:00",
            "generationMw": 13430,
            "loadShedMw": 0,
            "demandMw": 13430
          },
          {
            "time": "09:00",
            "generationMw": 13650,
            "loadShedMw": 0,
            "demandMw": 13650
          },
          {
            "time": "10:00",
            "generationMw": 14020,
            "loadShedMw": 0,
            "demandMw": 14020
          },
          {
            "time": "11:00",
            "generationMw": 14260,
            "loadShedMw": 0,
            "demandMw": 14260
          },
          {
            "time": "12:00",
            "generationMw": 14870,
            "loadShedMw": 0,
            "demandMw": 14870
          },
          {
            "time": "13:00",
            "generationMw": 15240,
            "loadShedMw": 0,
            "demandMw": 15240
          },
          {
            "time": "14:00",
            "generationMw": 15380,
            "loadShedMw": 0,
            "demandMw": 15380
          },
          {
            "time": "15:00",
            "generationMw": 15580,
            "loadShedMw": 0,
            "demandMw": 15580
          },
          {
            "time": "16:00",
            "generationMw": 15370,
            "loadShedMw": 0,
            "demandMw": 15370
          },
          {
            "time": "17:00",
            "generationMw": 14590,
            "loadShedMw": 0,
            "demandMw": 14590
          },
          {
            "time": "18:00",
            "generationMw": 13640,
            "loadShedMw": 0,
            "demandMw": 13640
          },
          {
            "time": "18:30",
            "generationMw": 14400,
            "loadShedMw": 0,
            "demandMw": 14400
          },
          {
            "time": "19:00",
            "generationMw": 15160,
            "loadShedMw": 0,
            "demandMw": 15160
          },
          {
            "time": "19:30",
            "generationMw": 15920,
            "loadShedMw": 0,
            "demandMw": 15920
          },
          {
            "time": "20:00",
            "generationMw": 15720,
            "loadShedMw": 0,
            "demandMw": 15720
          },
          {
            "time": "21:00",
            "generationMw": 16290,
            "loadShedMw": 0,
            "demandMw": 16290
          },
          {
            "time": "22:00",
            "generationMw": 16260,
            "loadShedMw": 0,
            "demandMw": 16260
          },
          {
            "time": "23:00",
            "generationMw": 16350,
            "loadShedMw": 0,
            "demandMw": 16350
          }
        ],
        "issuedAt": "2026-06-07T10:21:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-06",
        "issuedIn": "Daily Report 07-06-2026",
        "targetDay": "2026-06-07",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-07T00:00:00+06:00",
          "end": "2026-06-08T00:00:00+06:00",
          "filedAs": "2026-06-08",
          "sourceFile": "Daily Report 08-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-07T08:00:00+06:00",
          "end": "2026-06-08T08:00:00+06:00",
          "filedAs": "2026-06-08",
          "publishedLabel": "07-08 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (08.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 09-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (09.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              142,
              470,
              1678
            ],
            "mvar": [
              15,
              196,
              440
            ]
          },
          {
            "time": "01:00",
            "mw": [
              133,
              454,
              1612
            ],
            "mvar": [
              15,
              196,
              428
            ]
          },
          {
            "time": "02:00",
            "mw": [
              142,
              460,
              1628
            ],
            "mvar": [
              20,
              182,
              436
            ]
          },
          {
            "time": "03:00",
            "mw": [
              141,
              450,
              1598
            ],
            "mvar": [
              19,
              180,
              418
            ]
          },
          {
            "time": "04:00",
            "mw": [
              141,
              450,
              1594
            ],
            "mvar": [
              20,
              180,
              420
            ]
          },
          {
            "time": "05:00",
            "mw": [
              147,
              440,
              1970
            ],
            "mvar": [
              25,
              178,
              448
            ]
          },
          {
            "time": "06:00",
            "mw": [
              142,
              370,
              1426
            ],
            "mvar": [
              27,
              154,
              458
            ]
          },
          {
            "time": "07:00",
            "mw": [
              146,
              380,
              1520
            ],
            "mvar": [
              26,
              142,
              440
            ]
          },
          {
            "time": "08:00",
            "mw": [
              176,
              470,
              1748
            ],
            "mvar": [
              40,
              176,
              548
            ]
          },
          {
            "time": "09:00",
            "mw": [
              203,
              540,
              1834
            ],
            "mvar": [
              59,
              194,
              580
            ]
          },
          {
            "time": "10:00",
            "mw": [
              198,
              530,
              1868
            ],
            "mvar": [
              53,
              190,
              604
            ]
          },
          {
            "time": "11:00",
            "mw": [
              192,
              500,
              1790
            ],
            "mvar": [
              53,
              188,
              600
            ]
          },
          {
            "time": "12:00",
            "mw": [
              178,
              502,
              1684
            ],
            "mvar": [
              45,
              184,
              600
            ]
          },
          {
            "time": "13:00",
            "mw": [
              155,
              410,
              1422
            ],
            "mvar": [
              42,
              168,
              588
            ]
          },
          {
            "time": "14:00",
            "mw": [
              159,
              480,
              1598
            ],
            "mvar": [
              40,
              224,
              590
            ]
          },
          {
            "time": "15:00",
            "mw": [
              156,
              454,
              1550
            ],
            "mvar": [
              44,
              218,
              644
            ]
          },
          {
            "time": "16:00",
            "mw": [
              155,
              460,
              1578
            ],
            "mvar": [
              42,
              208,
              646
            ]
          },
          {
            "time": "17:00",
            "mw": [
              162,
              500,
              1670
            ],
            "mvar": [
              41,
              216,
              660
            ]
          },
          {
            "time": "18:00",
            "mw": [
              178,
              480,
              1612
            ],
            "mvar": [
              54,
              196,
              636
            ]
          },
          {
            "time": "18:30",
            "mw": [
              179,
              500,
              1612
            ],
            "mvar": [
              57,
              196,
              640
            ]
          },
          {
            "time": "19:00",
            "mw": [
              173,
              468,
              1624
            ],
            "mvar": [
              61,
              190,
              626
            ]
          },
          {
            "time": "19:30",
            "mw": [
              171,
              466,
              1734
            ],
            "mvar": [
              57,
              170,
              600
            ]
          },
          {
            "time": "20:00",
            "mw": [
              198,
              540,
              1850
            ],
            "mvar": [
              69,
              202,
              634
            ]
          },
          {
            "time": "21:00",
            "mw": [
              176,
              496,
              1688
            ],
            "mvar": [
              59,
              220,
              600
            ]
          },
          {
            "time": "22:00",
            "mw": [
              191,
              560,
              1788
            ],
            "mvar": [
              54,
              210,
              576
            ]
          },
          {
            "time": "23:00",
            "mw": [
              182,
              520,
              1694
            ],
            "mvar": [
              51,
              210,
              578
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 3987781.82
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 2847000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 2855000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 19940000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 19990000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 49619781.82,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 11,403,000 kWh but its circuits are metered at 5,702,000 kWh (2.00x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 16000,
        "maxDemandDayMw": 14670,
        "maxGenEveningMw": 16000,
        "totalEnergyGenMkwh": 353.97,
        "maxTempC": 34,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 15810,
            "loadShedMw": 0,
            "demandMw": 15810
          },
          {
            "time": "01:00",
            "generationMw": 15580,
            "loadShedMw": 0,
            "demandMw": 15580
          },
          {
            "time": "02:00",
            "generationMw": 15220,
            "loadShedMw": 0,
            "demandMw": 15220
          },
          {
            "time": "03:00",
            "generationMw": 14860,
            "loadShedMw": 0,
            "demandMw": 14860
          },
          {
            "time": "04:00",
            "generationMw": 14500,
            "loadShedMw": 0,
            "demandMw": 14500
          },
          {
            "time": "05:00",
            "generationMw": 14330,
            "loadShedMw": 0,
            "demandMw": 14330
          },
          {
            "time": "06:00",
            "generationMw": 13640,
            "loadShedMw": 0,
            "demandMw": 13640
          },
          {
            "time": "07:00",
            "generationMw": 13480,
            "loadShedMw": 0,
            "demandMw": 13480
          },
          {
            "time": "08:00",
            "generationMw": 13230,
            "loadShedMw": 0,
            "demandMw": 13230
          },
          {
            "time": "09:00",
            "generationMw": 13450,
            "loadShedMw": 0,
            "demandMw": 13450
          },
          {
            "time": "10:00",
            "generationMw": 13820,
            "loadShedMw": 0,
            "demandMw": 13820
          },
          {
            "time": "11:00",
            "generationMw": 14060,
            "loadShedMw": 0,
            "demandMw": 14060
          },
          {
            "time": "12:00",
            "generationMw": 14670,
            "loadShedMw": 0,
            "demandMw": 14670
          },
          {
            "time": "13:00",
            "generationMw": 15040,
            "loadShedMw": 0,
            "demandMw": 15040
          },
          {
            "time": "14:00",
            "generationMw": 15180,
            "loadShedMw": 0,
            "demandMw": 15180
          },
          {
            "time": "15:00",
            "generationMw": 15380,
            "loadShedMw": 0,
            "demandMw": 15380
          },
          {
            "time": "16:00",
            "generationMw": 15170,
            "loadShedMw": 0,
            "demandMw": 15170
          },
          {
            "time": "17:00",
            "generationMw": 14390,
            "loadShedMw": 0,
            "demandMw": 14390
          },
          {
            "time": "18:00",
            "generationMw": 13440,
            "loadShedMw": 0,
            "demandMw": 13440
          },
          {
            "time": "18:30",
            "generationMw": 14300,
            "loadShedMw": 0,
            "demandMw": 14300
          },
          {
            "time": "19:00",
            "generationMw": 14960,
            "loadShedMw": 0,
            "demandMw": 14960
          },
          {
            "time": "19:30",
            "generationMw": 15720,
            "loadShedMw": 0,
            "demandMw": 15720
          },
          {
            "time": "20:00",
            "generationMw": 15850,
            "loadShedMw": 0,
            "demandMw": 15850
          },
          {
            "time": "21:00",
            "generationMw": 16000,
            "loadShedMw": 0,
            "demandMw": 16000
          },
          {
            "time": "22:00",
            "generationMw": 16010,
            "loadShedMw": 0,
            "demandMw": 16010
          },
          {
            "time": "23:00",
            "generationMw": 15900,
            "loadShedMw": 0,
            "demandMw": 15900
          }
        ],
        "issuedAt": "2026-06-08T08:45:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-07",
        "issuedIn": "Daily Report 08-06-2026",
        "targetDay": "2026-06-08",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-08T00:00:00+06:00",
          "end": "2026-06-09T00:00:00+06:00",
          "filedAs": "2026-06-09",
          "sourceFile": "Daily Report 09-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-08T08:00:00+06:00",
          "end": "2026-06-09T08:00:00+06:00",
          "filedAs": "2026-06-09",
          "publishedLabel": "08-09 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (09.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 10-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (10.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              177,
              510,
              1678
            ],
            "mvar": [
              49,
              200,
              572
            ]
          },
          {
            "time": "01:00",
            "mw": [
              164,
              510,
              1700
            ],
            "mvar": [
              38,
              200,
              534
            ]
          },
          {
            "time": "02:00",
            "mw": [
              155,
              480,
              1622
            ],
            "mvar": [
              44,
              190,
              526
            ]
          },
          {
            "time": "03:00",
            "mw": [
              160,
              470,
              1546
            ],
            "mvar": [
              37,
              184,
              516
            ]
          },
          {
            "time": "04:00",
            "mw": [
              174,
              528,
              1630
            ],
            "mvar": [
              39,
              182,
              528
            ]
          },
          {
            "time": "05:00",
            "mw": [
              189,
              558,
              1730
            ],
            "mvar": [
              46,
              184,
              532
            ]
          },
          {
            "time": "06:00",
            "mw": [
              189,
              524,
              1652
            ],
            "mvar": [
              49,
              168,
              534
            ]
          },
          {
            "time": "07:00",
            "mw": [
              189,
              506,
              1688
            ],
            "mvar": [
              48,
              110,
              530
            ]
          },
          {
            "time": "08:00",
            "mw": [
              155,
              518,
              1596
            ],
            "mvar": [
              14,
              136,
              491
            ]
          },
          {
            "time": "09:00",
            "mw": [
              204,
              524,
              1730
            ],
            "mvar": [
              44,
              168,
              600
            ]
          },
          {
            "time": "10:00",
            "mw": [
              196,
              576,
              1838
            ],
            "mvar": [
              37,
              170,
              602
            ]
          },
          {
            "time": "11:00",
            "mw": [
              189,
              532,
              1848
            ],
            "mvar": [
              33,
              122,
              606
            ]
          },
          {
            "time": "12:00",
            "mw": [
              194,
              480,
              1780
            ],
            "mvar": [
              48,
              122,
              602
            ]
          },
          {
            "time": "13:00",
            "mw": [
              174,
              480,
              1746
            ],
            "mvar": [
              30,
              124,
              564
            ]
          },
          {
            "time": "14:00",
            "mw": [
              165,
              488,
              1700
            ],
            "mvar": [
              35,
              146,
              580
            ]
          },
          {
            "time": "15:00",
            "mw": [
              170,
              534,
              1772
            ],
            "mvar": [
              38,
              176,
              622
            ]
          },
          {
            "time": "16:00",
            "mw": [
              162,
              492,
              1596
            ],
            "mvar": [
              34,
              148,
              572
            ]
          },
          {
            "time": "17:00",
            "mw": [
              166,
              516,
              1640
            ],
            "mvar": [
              32,
              150,
              574
            ]
          },
          {
            "time": "18:00",
            "mw": [
              158,
              478,
              1476
            ],
            "mvar": [
              26,
              134,
              520
            ]
          },
          {
            "time": "18:30",
            "mw": [
              179,
              542,
              1660
            ],
            "mvar": [
              27,
              144,
              556
            ]
          },
          {
            "time": "19:00",
            "mw": [
              179,
              536,
              1734
            ],
            "mvar": [
              32,
              168,
              558
            ]
          },
          {
            "time": "19:30",
            "mw": [
              170,
              484,
              1854
            ],
            "mvar": [
              28,
              144,
              500
            ]
          },
          {
            "time": "20:00",
            "mw": [
              154,
              452,
              1852
            ],
            "mvar": [
              22,
              132,
              478
            ]
          },
          {
            "time": "21:00",
            "mw": [
              156,
              480,
              1882
            ],
            "mvar": [
              26,
              170,
              492
            ]
          },
          {
            "time": "22:00",
            "mw": [
              152,
              478,
              1852
            ],
            "mvar": [
              22,
              156,
              466
            ]
          },
          {
            "time": "23:00",
            "mw": [
              166,
              516,
              1912
            ],
            "mvar": [
              23,
              150,
              468
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 4150036.36
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 1672.73
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 3057000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 3066000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 20770000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 20810000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 51854709.09,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 12,181,500 kWh but its circuits are metered at 6,123,000 kWh (1.99x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 16040,
        "maxDemandDayMw": 15090,
        "maxGenEveningMw": 16040,
        "totalEnergyGenMkwh": 348.8,
        "maxTempC": 33,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 15500,
            "loadShedMw": 0,
            "demandMw": 15500
          },
          {
            "time": "01:00",
            "generationMw": 14850,
            "loadShedMw": 0,
            "demandMw": 14850
          },
          {
            "time": "02:00",
            "generationMw": 14190,
            "loadShedMw": 0,
            "demandMw": 14190
          },
          {
            "time": "03:00",
            "generationMw": 13770,
            "loadShedMw": 0,
            "demandMw": 13770
          },
          {
            "time": "04:00",
            "generationMw": 13460,
            "loadShedMw": 0,
            "demandMw": 13460
          },
          {
            "time": "05:00",
            "generationMw": 13170,
            "loadShedMw": 0,
            "demandMw": 13170
          },
          {
            "time": "06:00",
            "generationMw": 12990,
            "loadShedMw": 0,
            "demandMw": 12990
          },
          {
            "time": "07:00",
            "generationMw": 13070,
            "loadShedMw": 0,
            "demandMw": 13070
          },
          {
            "time": "08:00",
            "generationMw": 13280,
            "loadShedMw": 0,
            "demandMw": 13280
          },
          {
            "time": "09:00",
            "generationMw": 13550,
            "loadShedMw": 0,
            "demandMw": 13550
          },
          {
            "time": "10:00",
            "generationMw": 13950,
            "loadShedMw": 0,
            "demandMw": 13950
          },
          {
            "time": "11:00",
            "generationMw": 14200,
            "loadShedMw": 0,
            "demandMw": 14200
          },
          {
            "time": "12:00",
            "generationMw": 15090,
            "loadShedMw": 0,
            "demandMw": 15090
          },
          {
            "time": "13:00",
            "generationMw": 15360,
            "loadShedMw": 0,
            "demandMw": 15360
          },
          {
            "time": "14:00",
            "generationMw": 15410,
            "loadShedMw": 0,
            "demandMw": 15410
          },
          {
            "time": "15:00",
            "generationMw": 15870,
            "loadShedMw": 0,
            "demandMw": 15870
          },
          {
            "time": "16:00",
            "generationMw": 14870,
            "loadShedMw": 0,
            "demandMw": 14870
          },
          {
            "time": "17:00",
            "generationMw": 14440,
            "loadShedMw": 0,
            "demandMw": 14440
          },
          {
            "time": "18:00",
            "generationMw": 13450,
            "loadShedMw": 0,
            "demandMw": 13450
          },
          {
            "time": "18:30",
            "generationMw": 14000,
            "loadShedMw": 0,
            "demandMw": 14000
          },
          {
            "time": "19:00",
            "generationMw": 14780,
            "loadShedMw": 0,
            "demandMw": 14780
          },
          {
            "time": "19:30",
            "generationMw": 15540,
            "loadShedMw": 0,
            "demandMw": 15540
          },
          {
            "time": "20:00",
            "generationMw": 15610,
            "loadShedMw": 0,
            "demandMw": 15610
          },
          {
            "time": "21:00",
            "generationMw": 16040,
            "loadShedMw": 0,
            "demandMw": 16040
          },
          {
            "time": "22:00",
            "generationMw": 15970,
            "loadShedMw": 0,
            "demandMw": 15970
          },
          {
            "time": "23:00",
            "generationMw": 15930,
            "loadShedMw": 0,
            "demandMw": 15930
          }
        ],
        "issuedAt": "2026-06-09T10:33:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-08",
        "issuedIn": "Daily Report 09-06-2026",
        "targetDay": "2026-06-09",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-09T00:00:00+06:00",
          "end": "2026-06-10T00:00:00+06:00",
          "filedAs": "2026-06-10",
          "sourceFile": "Daily Report 10-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-09T08:00:00+06:00",
          "end": "2026-06-10T08:00:00+06:00",
          "filedAs": "2026-06-10",
          "publishedLabel": "09-10 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (10.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 11-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (11.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              162,
              492,
              1876
            ],
            "mvar": [
              21,
              140,
              442
            ]
          },
          {
            "time": "01:00",
            "mw": [
              153,
              470,
              1844
            ],
            "mvar": [
              18,
              138,
              414
            ]
          },
          {
            "time": "02:00",
            "mw": [
              153,
              460,
              1890
            ],
            "mvar": [
              13,
              114,
              414
            ]
          },
          {
            "time": "03:00",
            "mw": [
              147,
              438,
              1756
            ],
            "mvar": [
              15,
              128,
              418
            ]
          },
          {
            "time": "04:00",
            "mw": [
              143,
              392,
              1708
            ],
            "mvar": [
              15,
              116,
              416
            ]
          },
          {
            "time": "05:00",
            "mw": [
              146,
              404,
              1572
            ],
            "mvar": [
              16,
              104,
              406
            ]
          },
          {
            "time": "06:00",
            "mw": [
              150,
              394,
              1545
            ],
            "mvar": [
              13,
              100,
              412
            ]
          },
          {
            "time": "07:00",
            "mw": [
              155,
              406,
              1656
            ],
            "mvar": [
              15,
              100,
              418
            ]
          },
          {
            "time": "08:00",
            "mw": [
              186,
              502,
              1854
            ],
            "mvar": [
              28,
              134,
              532
            ]
          },
          {
            "time": "09:00",
            "mw": [
              219,
              602,
              1920
            ],
            "mvar": [
              51,
              176,
              578
            ]
          },
          {
            "time": "10:00",
            "mw": [
              205,
              582,
              1894
            ],
            "mvar": [
              49,
              170,
              606
            ]
          },
          {
            "time": "11:00",
            "mw": [
              186,
              520,
              1808
            ],
            "mvar": [
              35,
              154,
              560
            ]
          },
          {
            "time": "12:00",
            "mw": [
              182,
              540,
              1810
            ],
            "mvar": [
              44,
              134,
              596
            ]
          },
          {
            "time": "13:00",
            "mw": [
              157,
              470,
              1674
            ],
            "mvar": [
              14,
              88,
              450
            ]
          },
          {
            "time": "14:00",
            "mw": [
              165,
              516,
              1638
            ],
            "mvar": [
              15,
              124,
              460
            ]
          },
          {
            "time": "15:00",
            "mw": [
              185,
              520,
              1786
            ],
            "mvar": [
              39,
              134,
              562
            ]
          },
          {
            "time": "16:00",
            "mw": [
              212,
              570,
              1254
            ],
            "mvar": [
              56,
              146,
              624
            ]
          },
          {
            "time": "17:00",
            "mw": [
              203,
              528,
              1764
            ],
            "mvar": [
              44,
              138,
              574
            ]
          },
          {
            "time": "18:00",
            "mw": [
              190,
              536,
              1796
            ],
            "mvar": [
              32,
              134,
              516
            ]
          },
          {
            "time": "18:30",
            "mw": [
              193,
              554,
              1824
            ],
            "mvar": [
              31,
              124,
              464
            ]
          },
          {
            "time": "19:00",
            "mw": [
              185,
              542,
              1708
            ],
            "mvar": [
              31,
              156,
              458
            ]
          },
          {
            "time": "19:30",
            "mw": [
              149,
              450,
              1548
            ],
            "mvar": [
              11,
              128,
              370
            ]
          },
          {
            "time": "20:00",
            "mw": [
              140,
              424,
              1495
            ],
            "mvar": [
              5,
              116,
              358
            ]
          },
          {
            "time": "21:00",
            "mw": [
              155,
              452,
              1586
            ],
            "mvar": [
              17,
              134,
              390
            ]
          },
          {
            "time": "22:00",
            "mw": [
              155,
              454,
              1598
            ],
            "mvar": [
              15,
              132,
              390
            ]
          },
          {
            "time": "23:00",
            "mw": [
              162,
              484,
              1694
            ],
            "mvar": [
              16,
              138,
              426
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 4091490.91
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 2916000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 2925000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 20910000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 20960000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 51802490.91,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 11,685,000 kWh but its circuits are metered at 5,841,000 kWh (2.00x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 16250,
        "maxDemandDayMw": 15140,
        "maxGenEveningMw": 15796.51,
        "totalEnergyGenMkwh": 354.86451,
        "maxTempC": 37.4,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 15820,
            "loadShedMw": 0,
            "demandMw": 15820
          },
          {
            "time": "01:00",
            "generationMw": 15300,
            "loadShedMw": 0,
            "demandMw": 15300
          },
          {
            "time": "02:00",
            "generationMw": 14940,
            "loadShedMw": 0,
            "demandMw": 14940
          },
          {
            "time": "03:00",
            "generationMw": 14530,
            "loadShedMw": 0,
            "demandMw": 14530
          },
          {
            "time": "04:00",
            "generationMw": 14120,
            "loadShedMw": 0,
            "demandMw": 14120
          },
          {
            "time": "05:00",
            "generationMw": 13860,
            "loadShedMw": 0,
            "demandMw": 13860
          },
          {
            "time": "06:00",
            "generationMw": 13370,
            "loadShedMw": 0,
            "demandMw": 13370
          },
          {
            "time": "07:00",
            "generationMw": 13470,
            "loadShedMw": 0,
            "demandMw": 13470
          },
          {
            "time": "08:00",
            "generationMw": 13480,
            "loadShedMw": 0,
            "demandMw": 13480
          },
          {
            "time": "09:00",
            "generationMw": 13680,
            "loadShedMw": 0,
            "demandMw": 13680
          },
          {
            "time": "10:00",
            "generationMw": 14070,
            "loadShedMw": 0,
            "demandMw": 14070
          },
          {
            "time": "11:00",
            "generationMw": 14410,
            "loadShedMw": 0,
            "demandMw": 14410
          },
          {
            "time": "12:00",
            "generationMw": 15140,
            "loadShedMw": 0,
            "demandMw": 15140
          },
          {
            "time": "13:00",
            "generationMw": 15100,
            "loadShedMw": 0,
            "demandMw": 15100
          },
          {
            "time": "14:00",
            "generationMw": 15160,
            "loadShedMw": 0,
            "demandMw": 15160
          },
          {
            "time": "15:00",
            "generationMw": 15600,
            "loadShedMw": 0,
            "demandMw": 15600
          },
          {
            "time": "16:00",
            "generationMw": 15480,
            "loadShedMw": 0,
            "demandMw": 15480
          },
          {
            "time": "17:00",
            "generationMw": 15090,
            "loadShedMw": 0,
            "demandMw": 15090
          },
          {
            "time": "18:00",
            "generationMw": 14480,
            "loadShedMw": 0,
            "demandMw": 14480
          },
          {
            "time": "18:30",
            "generationMw": 15000,
            "loadShedMw": 0,
            "demandMw": 15000
          },
          {
            "time": "19:00",
            "generationMw": 15580,
            "loadShedMw": 0,
            "demandMw": 15580
          },
          {
            "time": "19:30",
            "generationMw": 16250,
            "loadShedMw": 0,
            "demandMw": 16250
          },
          {
            "time": "20:00",
            "generationMw": 15930,
            "loadShedMw": 0,
            "demandMw": 15930
          },
          {
            "time": "21:00",
            "generationMw": 15910,
            "loadShedMw": 0,
            "demandMw": 15910
          },
          {
            "time": "22:00",
            "generationMw": 15760,
            "loadShedMw": 0,
            "demandMw": 15760
          },
          {
            "time": "23:00",
            "generationMw": 15720,
            "loadShedMw": 0,
            "demandMw": 15720
          }
        ],
        "issuedAt": "2026-06-10T10:37:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-09",
        "issuedIn": "Daily Report 10-06-2026",
        "targetDay": "2026-06-10",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-10T00:00:00+06:00",
          "end": "2026-06-11T00:00:00+06:00",
          "filedAs": "2026-06-11",
          "sourceFile": "Daily Report 11-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-10T08:00:00+06:00",
          "end": "2026-06-11T08:00:00+06:00",
          "filedAs": "2026-06-11",
          "publishedLabel": "10-11 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (11.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 12-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (12.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              168,
              480,
              1700
            ],
            "mvar": [
              19,
              128,
              416
            ]
          },
          {
            "time": "01:00",
            "mw": [
              160,
              452,
              1666
            ],
            "mvar": [
              17,
              114,
              420
            ]
          },
          {
            "time": "02:00",
            "mw": [
              153,
              432,
              1612
            ],
            "mvar": [
              15,
              106,
              404
            ]
          },
          {
            "time": "03:00",
            "mw": [
              169,
              472,
              1726
            ],
            "mvar": [
              24,
              114,
              462
            ]
          },
          {
            "time": "04:00",
            "mw": [
              162,
              458,
              1680
            ],
            "mvar": [
              21,
              100,
              416
            ]
          },
          {
            "time": "05:00",
            "mw": [
              165,
              464,
              1692
            ],
            "mvar": [
              20,
              112,
              412
            ]
          },
          {
            "time": "06:00",
            "mw": [
              171,
              480,
              1672
            ],
            "mvar": [
              24,
              40,
              436
            ]
          },
          {
            "time": "07:00",
            "mw": [
              167,
              496,
              1732
            ],
            "mvar": [
              19,
              102,
              426
            ]
          },
          {
            "time": "08:00",
            "mw": [
              189,
              552,
              1850
            ],
            "mvar": [
              29,
              136,
              502
            ]
          },
          {
            "time": "09:00",
            "mw": [
              211,
              620,
              1952
            ],
            "mvar": [
              46,
              162,
              570
            ]
          },
          {
            "time": "10:00",
            "mw": [
              209,
              560,
              1882
            ],
            "mvar": [
              45,
              140,
              594
            ]
          },
          {
            "time": "11:00",
            "mw": [
              212,
              592,
              1882
            ],
            "mvar": [
              47,
              154,
              618
            ]
          },
          {
            "time": "12:00",
            "mw": [
              193,
              570,
              1866
            ],
            "mvar": [
              39,
              142,
              624
            ]
          },
          {
            "time": "13:00",
            "mw": [
              186,
              588,
              1812
            ],
            "mvar": [
              30,
              128,
              524
            ]
          },
          {
            "time": "14:00",
            "mw": [
              210,
              632,
              2036
            ],
            "mvar": [
              47,
              142,
              616
            ]
          },
          {
            "time": "15:00",
            "mw": [
              228,
              668,
              1942
            ],
            "mvar": [
              60,
              167,
              560
            ]
          },
          {
            "time": "16:00",
            "mw": [
              227,
              650,
              1872
            ],
            "mvar": [
              55,
              182,
              568
            ]
          },
          {
            "time": "17:00",
            "mw": [
              241,
              730,
              2008
            ],
            "mvar": [
              57,
              200,
              644
            ]
          },
          {
            "time": "18:00",
            "mw": [
              224,
              660,
              1856
            ],
            "mvar": [
              51,
              192,
              614
            ]
          },
          {
            "time": "18:30",
            "mw": [
              219,
              674,
              1858
            ],
            "mvar": [
              45,
              192,
              602
            ]
          },
          {
            "time": "19:00",
            "mw": [
              215,
              660,
              1880
            ],
            "mvar": [
              42,
              180,
              576
            ]
          },
          {
            "time": "19:30",
            "mw": [
              179,
              530,
              1774
            ],
            "mvar": [
              22,
              120,
              510
            ]
          },
          {
            "time": "20:00",
            "mw": [
              171,
              506,
              1792
            ],
            "mvar": [
              17,
              106,
              486
            ]
          },
          {
            "time": "21:00",
            "mw": [
              173,
              526,
              1730
            ],
            "mvar": [
              20,
              152,
              484
            ]
          },
          {
            "time": "22:00",
            "mw": [
              170,
              520,
              1690
            ],
            "mvar": [
              14,
              130,
              434
            ]
          },
          {
            "time": "23:00",
            "mw": [
              176,
              562,
              1704
            ],
            "mvar": [
              19,
              174,
              466
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 4548145.45
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 1672.73
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 3346000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 3360000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 21810000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 21850000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 54915818.18,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 13,351,500 kWh but its circuits are metered at 6,706,000 kWh (1.99x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 15650,
        "maxDemandDayMw": 14540,
        "maxGenEveningMw": 15650,
        "totalEnergyGenMkwh": 341.6,
        "maxTempC": 34.3,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 15220,
            "loadShedMw": 0,
            "demandMw": 15220
          },
          {
            "time": "01:00",
            "generationMw": 14700,
            "loadShedMw": 0,
            "demandMw": 14700
          },
          {
            "time": "02:00",
            "generationMw": 14340,
            "loadShedMw": 0,
            "demandMw": 14340
          },
          {
            "time": "03:00",
            "generationMw": 13930,
            "loadShedMw": 0,
            "demandMw": 13930
          },
          {
            "time": "04:00",
            "generationMw": 13520,
            "loadShedMw": 0,
            "demandMw": 13520
          },
          {
            "time": "05:00",
            "generationMw": 13260,
            "loadShedMw": 0,
            "demandMw": 13260
          },
          {
            "time": "06:00",
            "generationMw": 12770,
            "loadShedMw": 0,
            "demandMw": 12770
          },
          {
            "time": "07:00",
            "generationMw": 12870,
            "loadShedMw": 0,
            "demandMw": 12870
          },
          {
            "time": "08:00",
            "generationMw": 12880,
            "loadShedMw": 0,
            "demandMw": 12880
          },
          {
            "time": "09:00",
            "generationMw": 13080,
            "loadShedMw": 0,
            "demandMw": 13080
          },
          {
            "time": "10:00",
            "generationMw": 13470,
            "loadShedMw": 0,
            "demandMw": 13470
          },
          {
            "time": "11:00",
            "generationMw": 13810,
            "loadShedMw": 0,
            "demandMw": 13810
          },
          {
            "time": "12:00",
            "generationMw": 14540,
            "loadShedMw": 0,
            "demandMw": 14540
          },
          {
            "time": "13:00",
            "generationMw": 14500,
            "loadShedMw": 0,
            "demandMw": 14500
          },
          {
            "time": "14:00",
            "generationMw": 14560,
            "loadShedMw": 0,
            "demandMw": 14560
          },
          {
            "time": "15:00",
            "generationMw": 15000,
            "loadShedMw": 0,
            "demandMw": 15000
          },
          {
            "time": "16:00",
            "generationMw": 14880,
            "loadShedMw": 0,
            "demandMw": 14880
          },
          {
            "time": "17:00",
            "generationMw": 14490,
            "loadShedMw": 0,
            "demandMw": 14490
          },
          {
            "time": "18:00",
            "generationMw": 13880,
            "loadShedMw": 0,
            "demandMw": 13880
          },
          {
            "time": "18:30",
            "generationMw": 14200,
            "loadShedMw": 0,
            "demandMw": 14200
          },
          {
            "time": "19:00",
            "generationMw": 14980,
            "loadShedMw": 0,
            "demandMw": 14980
          },
          {
            "time": "19:30",
            "generationMw": 15650,
            "loadShedMw": 0,
            "demandMw": 15650
          },
          {
            "time": "20:00",
            "generationMw": 15330,
            "loadShedMw": 0,
            "demandMw": 15330
          },
          {
            "time": "21:00",
            "generationMw": 15310,
            "loadShedMw": 0,
            "demandMw": 15310
          },
          {
            "time": "22:00",
            "generationMw": 15160,
            "loadShedMw": 0,
            "demandMw": 15160
          },
          {
            "time": "23:00",
            "generationMw": 15120,
            "loadShedMw": 0,
            "demandMw": 15120
          }
        ],
        "issuedAt": "2026-06-11T11:31:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-10",
        "issuedIn": "Daily Report 11-06-2026",
        "targetDay": "2026-06-11",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-11T00:00:00+06:00",
          "end": "2026-06-12T00:00:00+06:00",
          "filedAs": "2026-06-12",
          "sourceFile": "Daily Report 12-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-11T08:00:00+06:00",
          "end": "2026-06-12T08:00:00+06:00",
          "filedAs": "2026-06-12",
          "publishedLabel": "11-12 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (12.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 13-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (13.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              170,
              552,
              1770
            ],
            "mvar": [
              12,
              160,
              428
            ]
          },
          {
            "time": "01:00",
            "mw": [
              167,
              560,
              1810
            ],
            "mvar": [
              10,
              160,
              406
            ]
          },
          {
            "time": "02:00",
            "mw": [
              172,
              592,
              1804
            ],
            "mvar": [
              12,
              152,
              416
            ]
          },
          {
            "time": "03:00",
            "mw": [
              168,
              590,
              1824
            ],
            "mvar": [
              6,
              156,
              416
            ]
          },
          {
            "time": "04:00",
            "mw": [
              175,
              612,
              1870
            ],
            "mvar": [
              9,
              148,
              406
            ]
          },
          {
            "time": "05:00",
            "mw": [
              178,
              610,
              1896
            ],
            "mvar": [
              10,
              128,
              406
            ]
          },
          {
            "time": "06:00",
            "mw": [
              153,
              500,
              1618
            ],
            "mvar": [
              -2,
              88,
              352
            ]
          },
          {
            "time": "07:00",
            "mw": [
              150,
              510,
              1588
            ],
            "mvar": [
              3,
              104,
              362
            ]
          },
          {
            "time": "08:00",
            "mw": [
              163,
              540,
              1710
            ],
            "mvar": [
              2,
              112,
              366
            ]
          },
          {
            "time": "09:00",
            "mw": [
              173,
              620,
              1786
            ],
            "mvar": [
              5,
              166,
              356
            ]
          },
          {
            "time": "10:00",
            "mw": [
              184,
              610,
              1834
            ],
            "mvar": [
              6,
              112,
              396
            ]
          },
          {
            "time": "11:00",
            "mw": [
              184,
              600,
              1818
            ],
            "mvar": [
              8,
              116,
              398
            ]
          },
          {
            "time": "12:00",
            "mw": [
              182,
              580,
              1764
            ],
            "mvar": [
              10,
              120,
              406
            ]
          },
          {
            "time": "13:00",
            "mw": [
              182,
              630,
              1774
            ],
            "mvar": [
              1,
              152,
              396
            ]
          },
          {
            "time": "14:00",
            "mw": [
              182,
              616,
              1774
            ],
            "mvar": [
              6,
              132,
              410
            ]
          },
          {
            "time": "15:00",
            "mw": [
              186,
              620,
              1840
            ],
            "mvar": [
              11,
              146,
              442
            ]
          },
          {
            "time": "16:00",
            "mw": [
              175,
              576,
              1810
            ],
            "mvar": [
              4,
              122,
              400
            ]
          },
          {
            "time": "17:00",
            "mw": [
              172,
              580,
              1832
            ],
            "mvar": [
              4,
              120,
              384
            ]
          },
          {
            "time": "18:00",
            "mw": [
              167,
              560,
              1750
            ],
            "mvar": [
              4,
              108,
              368
            ]
          },
          {
            "time": "18:30",
            "mw": [
              169,
              542,
              1748
            ],
            "mvar": [
              -2,
              102,
              374
            ]
          },
          {
            "time": "19:00",
            "mw": [
              155,
              530,
              1690
            ],
            "mvar": [
              -8,
              104,
              312
            ]
          },
          {
            "time": "19:30",
            "mw": [
              116,
              400,
              1540
            ],
            "mvar": [
              -11,
              86,
              260
            ]
          },
          {
            "time": "20:00",
            "mw": [
              116,
              440,
              1594
            ],
            "mvar": [
              -12,
              100,
              262
            ]
          },
          {
            "time": "21:00",
            "mw": [
              118,
              450,
              1570
            ],
            "mvar": [
              -13,
              110,
              264
            ]
          },
          {
            "time": "22:00",
            "mw": [
              156,
              570,
              1758
            ],
            "mvar": [
              4,
              158,
              342
            ]
          },
          {
            "time": "23:00",
            "mw": [
              167,
              600,
              1806
            ],
            "mvar": [
              4,
              162,
              400
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 3987781.82
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 3397000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 3406000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 21050000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 21080000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 52920781.82,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 13,628,000 kWh but its circuits are metered at 6,803,000 kWh (2.00x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 14730,
        "maxDemandDayMw": 12670,
        "maxGenEveningMw": 14730,
        "totalEnergyGenMkwh": 320.97,
        "maxTempC": 36.5,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 15000,
            "loadShedMw": 0,
            "demandMw": 15000
          },
          {
            "time": "01:00",
            "generationMw": 14920,
            "loadShedMw": 0,
            "demandMw": 14920
          },
          {
            "time": "02:00",
            "generationMw": 14960,
            "loadShedMw": 0,
            "demandMw": 14960
          },
          {
            "time": "03:00",
            "generationMw": 14560,
            "loadShedMw": 0,
            "demandMw": 14560
          },
          {
            "time": "04:00",
            "generationMw": 14100,
            "loadShedMw": 0,
            "demandMw": 14100
          },
          {
            "time": "05:00",
            "generationMw": 13950,
            "loadShedMw": 0,
            "demandMw": 13950
          },
          {
            "time": "06:00",
            "generationMw": 13350,
            "loadShedMw": 0,
            "demandMw": 13350
          },
          {
            "time": "07:00",
            "generationMw": 12930,
            "loadShedMw": 0,
            "demandMw": 12930
          },
          {
            "time": "08:00",
            "generationMw": 12740,
            "loadShedMw": 0,
            "demandMw": 12740
          },
          {
            "time": "09:00",
            "generationMw": 12670,
            "loadShedMw": 0,
            "demandMw": 12670
          },
          {
            "time": "10:00",
            "generationMw": 12560,
            "loadShedMw": 0,
            "demandMw": 12560
          },
          {
            "time": "11:00",
            "generationMw": 12330,
            "loadShedMw": 0,
            "demandMw": 12330
          },
          {
            "time": "12:00",
            "generationMw": 12510,
            "loadShedMw": 0,
            "demandMw": 12510
          },
          {
            "time": "13:00",
            "generationMw": 12760,
            "loadShedMw": 0,
            "demandMw": 12760
          },
          {
            "time": "14:00",
            "generationMw": 12260,
            "loadShedMw": 0,
            "demandMw": 12260
          },
          {
            "time": "15:00",
            "generationMw": 12190,
            "loadShedMw": 0,
            "demandMw": 12190
          },
          {
            "time": "16:00",
            "generationMw": 11930,
            "loadShedMw": 0,
            "demandMw": 11930
          },
          {
            "time": "17:00",
            "generationMw": 11760,
            "loadShedMw": 0,
            "demandMw": 11760
          },
          {
            "time": "18:00",
            "generationMw": 11730,
            "loadShedMw": 0,
            "demandMw": 11730
          },
          {
            "time": "18:30",
            "generationMw": 12600,
            "loadShedMw": 0,
            "demandMw": 12600
          },
          {
            "time": "19:00",
            "generationMw": 13360,
            "loadShedMw": 0,
            "demandMw": 13360
          },
          {
            "time": "19:30",
            "generationMw": 14150,
            "loadShedMw": 0,
            "demandMw": 14150
          },
          {
            "time": "20:00",
            "generationMw": 14120,
            "loadShedMw": 0,
            "demandMw": 14120
          },
          {
            "time": "21:00",
            "generationMw": 14730,
            "loadShedMw": 0,
            "demandMw": 14730
          },
          {
            "time": "22:00",
            "generationMw": 14720,
            "loadShedMw": 0,
            "demandMw": 14720
          },
          {
            "time": "23:00",
            "generationMw": 14830,
            "loadShedMw": 0,
            "demandMw": 14830
          }
        ],
        "issuedAt": "2026-06-12T08:20:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-11",
        "issuedIn": "Daily Report 12-06-2026",
        "targetDay": "2026-06-12",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-12T00:00:00+06:00",
          "end": "2026-06-13T00:00:00+06:00",
          "filedAs": "2026-06-13",
          "sourceFile": "Daily Report 13-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-12T08:00:00+06:00",
          "end": "2026-06-13T08:00:00+06:00",
          "filedAs": "2026-06-13",
          "publishedLabel": "12-13 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (13.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 14-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (14.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              153,
              560,
              1778
            ],
            "mvar": [
              -7,
              140,
              344
            ]
          },
          {
            "time": "01:00",
            "mw": [
              141,
              552,
              1792
            ],
            "mvar": [
              -11,
              144,
              320
            ]
          },
          {
            "time": "02:00",
            "mw": [
              135,
              560,
              1760
            ],
            "mvar": [
              -15,
              148,
              342
            ]
          },
          {
            "time": "03:00",
            "mw": [
              125,
              530,
              1690
            ],
            "mvar": [
              -18,
              116,
              332
            ]
          },
          {
            "time": "04:00",
            "mw": [
              133,
              530,
              1696
            ],
            "mvar": [
              -12,
              104,
              340
            ]
          },
          {
            "time": "05:00",
            "mw": [
              146,
              530,
              1794
            ],
            "mvar": [
              -7,
              88,
              346
            ]
          },
          {
            "time": "06:00",
            "mw": [
              141,
              520,
              1804
            ],
            "mvar": [
              -8,
              104,
              332
            ]
          },
          {
            "time": "07:00",
            "mw": [
              137,
              510,
              1858
            ],
            "mvar": [
              -21,
              108,
              348
            ]
          },
          {
            "time": "08:00",
            "mw": [
              151,
              520,
              1896
            ],
            "mvar": [
              -12,
              130,
              370
            ]
          },
          {
            "time": "09:00",
            "mw": [
              195,
              630,
              2114
            ],
            "mvar": [
              16,
              168,
              520
            ]
          },
          {
            "time": "10:00",
            "mw": [
              215,
              666,
              2080
            ],
            "mvar": [
              39,
              166,
              582
            ]
          },
          {
            "time": "11:00",
            "mw": [
              214,
              646,
              2080
            ],
            "mvar": [
              44,
              168,
              660
            ]
          },
          {
            "time": "12:00",
            "mw": [
              197,
              612,
              1946
            ],
            "mvar": [
              26,
              166,
              576
            ]
          },
          {
            "time": "13:00",
            "mw": [
              172,
              580,
              1882
            ],
            "mvar": [
              10,
              138,
              488
            ]
          },
          {
            "time": "14:00",
            "mw": [
              181,
              600,
              1934
            ],
            "mvar": [
              25,
              164,
              506
            ]
          },
          {
            "time": "15:00",
            "mw": [
              189,
              630,
              1950
            ],
            "mvar": [
              28,
              166,
              542
            ]
          },
          {
            "time": "16:00",
            "mw": [
              176,
              590,
              1902
            ],
            "mvar": [
              23,
              142,
              512
            ]
          },
          {
            "time": "17:00",
            "mw": [
              181,
              590,
              1930
            ],
            "mvar": [
              29,
              134,
              520
            ]
          },
          {
            "time": "18:00",
            "mw": [
              187,
              580,
              1846
            ],
            "mvar": [
              39,
              168,
              520
            ]
          },
          {
            "time": "18:30",
            "mw": [
              187,
              590,
              1876
            ],
            "mvar": [
              37,
              146,
              480
            ]
          },
          {
            "time": "19:00",
            "mw": [
              181,
              610,
              1812
            ],
            "mvar": [
              29,
              154,
              434
            ]
          },
          {
            "time": "19:30",
            "mw": [
              168,
              560,
              1914
            ],
            "mvar": [
              18,
              106,
              428
            ]
          },
          {
            "time": "20:00",
            "mw": [
              171,
              570,
              1904
            ],
            "mvar": [
              22,
              126,
              436
            ]
          },
          {
            "time": "21:00",
            "mw": [
              161,
              550,
              1858
            ],
            "mvar": [
              16,
              112,
              434
            ]
          },
          {
            "time": "22:00",
            "mw": [
              165,
              540,
              1860
            ],
            "mvar": [
              17,
              112,
              444
            ]
          },
          {
            "time": "23:00",
            "mw": [
              154,
              552,
              1786
            ],
            "mvar": [
              9,
              138,
              402
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 4021236.36
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 3423000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 343400
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 22880000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 22950000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 53617636.36,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 13,736,500 kWh but its circuits are metered at 3,766,400 kWh (3.65x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 15680,
        "maxDemandDayMw": 14280,
        "maxGenEveningMw": 15680,
        "totalEnergyGenMkwh": 336.17,
        "maxTempC": 33,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 14620,
            "loadShedMw": 0,
            "demandMw": 14620
          },
          {
            "time": "01:00",
            "generationMw": 14440,
            "loadShedMw": 0,
            "demandMw": 14440
          },
          {
            "time": "02:00",
            "generationMw": 14010,
            "loadShedMw": 0,
            "demandMw": 14010
          },
          {
            "time": "03:00",
            "generationMw": 13610,
            "loadShedMw": 0,
            "demandMw": 13610
          },
          {
            "time": "04:00",
            "generationMw": 13270,
            "loadShedMw": 0,
            "demandMw": 13270
          },
          {
            "time": "05:00",
            "generationMw": 13080,
            "loadShedMw": 0,
            "demandMw": 13080
          },
          {
            "time": "06:00",
            "generationMw": 12800,
            "loadShedMw": 0,
            "demandMw": 12800
          },
          {
            "time": "07:00",
            "generationMw": 12890,
            "loadShedMw": 0,
            "demandMw": 12890
          },
          {
            "time": "08:00",
            "generationMw": 13110,
            "loadShedMw": 0,
            "demandMw": 13110
          },
          {
            "time": "09:00",
            "generationMw": 13350,
            "loadShedMw": 0,
            "demandMw": 13350
          },
          {
            "time": "10:00",
            "generationMw": 13660,
            "loadShedMw": 0,
            "demandMw": 13660
          },
          {
            "time": "11:00",
            "generationMw": 14000,
            "loadShedMw": 0,
            "demandMw": 14000
          },
          {
            "time": "12:00",
            "generationMw": 14280,
            "loadShedMw": 0,
            "demandMw": 14280
          },
          {
            "time": "13:00",
            "generationMw": 14440,
            "loadShedMw": 0,
            "demandMw": 14440
          },
          {
            "time": "14:00",
            "generationMw": 14090,
            "loadShedMw": 0,
            "demandMw": 14090
          },
          {
            "time": "15:00",
            "generationMw": 14540,
            "loadShedMw": 0,
            "demandMw": 14540
          },
          {
            "time": "16:00",
            "generationMw": 14010,
            "loadShedMw": 0,
            "demandMw": 14010
          },
          {
            "time": "17:00",
            "generationMw": 13230,
            "loadShedMw": 0,
            "demandMw": 13230
          },
          {
            "time": "18:00",
            "generationMw": 12530,
            "loadShedMw": 0,
            "demandMw": 12530
          },
          {
            "time": "18:30",
            "generationMw": 13300,
            "loadShedMw": 0,
            "demandMw": 13300
          },
          {
            "time": "19:00",
            "generationMw": 14140,
            "loadShedMw": 0,
            "demandMw": 14140
          },
          {
            "time": "19:30",
            "generationMw": 15030,
            "loadShedMw": 0,
            "demandMw": 15030
          },
          {
            "time": "20:00",
            "generationMw": 15190,
            "loadShedMw": 0,
            "demandMw": 15190
          },
          {
            "time": "21:00",
            "generationMw": 15680,
            "loadShedMw": 0,
            "demandMw": 15680
          },
          {
            "time": "22:00",
            "generationMw": 15580,
            "loadShedMw": 0,
            "demandMw": 15580
          },
          {
            "time": "23:00",
            "generationMw": 15620,
            "loadShedMw": 0,
            "demandMw": 15620
          }
        ],
        "issuedAt": "2026-06-13T10:15:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-12",
        "issuedIn": "Daily Report 13-06-2026_",
        "targetDay": "2026-06-13",
        "layout": "scenario",
        "issuedFrom": "source-copy"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-13T00:00:00+06:00",
          "end": "2026-06-14T00:00:00+06:00",
          "filedAs": "2026-06-14",
          "sourceFile": "Daily Report 14-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-13T08:00:00+06:00",
          "end": "2026-06-14T08:00:00+06:00",
          "filedAs": "2026-06-14",
          "publishedLabel": "13-14 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (14.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 15-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (15.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              150,
              520,
              1844
            ],
            "mvar": [
              3,
              104,
              412
            ]
          },
          {
            "time": "01:00",
            "mw": [
              152,
              540,
              1846
            ],
            "mvar": [
              8,
              134,
              434
            ]
          },
          {
            "time": "02:00",
            "mw": [
              151,
              530,
              1824
            ],
            "mvar": [
              9,
              140,
              424
            ]
          },
          {
            "time": "03:00",
            "mw": [
              152,
              542,
              1830
            ],
            "mvar": [
              8,
              134,
              434
            ]
          },
          {
            "time": "04:00",
            "mw": [
              153,
              546,
              1754
            ],
            "mvar": [
              11,
              150,
              440
            ]
          },
          {
            "time": "05:00",
            "mw": [
              153,
              544,
              1748
            ],
            "mvar": [
              10,
              146,
              424
            ]
          },
          {
            "time": "06:00",
            "mw": [
              156,
              540,
              1748
            ],
            "mvar": [
              17,
              124,
              428
            ]
          },
          {
            "time": "07:00",
            "mw": [
              152,
              526,
              1670
            ],
            "mvar": [
              13,
              124,
              426
            ]
          },
          {
            "time": "08:00",
            "mw": [
              179,
              556,
              1842
            ],
            "mvar": [
              28,
              128,
              530
            ]
          },
          {
            "time": "09:00",
            "mw": [
              204,
              612,
              1928
            ],
            "mvar": [
              52,
              160,
              610
            ]
          },
          {
            "time": "10:00",
            "mw": [
              209,
              630,
              1980
            ],
            "mvar": [
              58,
              176,
              686
            ]
          },
          {
            "time": "11:00",
            "mw": [
              198,
              630,
              1970
            ],
            "mvar": [
              47,
              182,
              694
            ]
          },
          {
            "time": "12:00",
            "mw": [
              191,
              550,
              1842
            ],
            "mvar": [
              47,
              142,
              666
            ]
          },
          {
            "time": "13:00",
            "mw": [
              192,
              540,
              1820
            ],
            "mvar": [
              35,
              110,
              568
            ]
          },
          {
            "time": "14:00",
            "mw": [
              183,
              548,
              1750
            ],
            "mvar": [
              31,
              114,
              558
            ]
          },
          {
            "time": "15:00",
            "mw": [
              199,
              600,
              1896
            ],
            "mvar": [
              45,
              150,
              582
            ]
          },
          {
            "time": "16:00",
            "mw": [
              188,
              570,
              1906
            ],
            "mvar": [
              35,
              134,
              572
            ]
          },
          {
            "time": "17:00",
            "mw": [
              184,
              560,
              1902
            ],
            "mvar": [
              35,
              130,
              564
            ]
          },
          {
            "time": "18:00",
            "mw": [
              172,
              534,
              1840
            ],
            "mvar": [
              32,
              128,
              554
            ]
          },
          {
            "time": "18:30",
            "mw": [
              170,
              524,
              1784
            ],
            "mvar": [
              28,
              120,
              534
            ]
          },
          {
            "time": "19:00",
            "mw": [
              189,
              596,
              1934
            ],
            "mvar": [
              33,
              154,
              536
            ]
          },
          {
            "time": "19:30",
            "mw": [
              165,
              520,
              1818
            ],
            "mvar": [
              23,
              112,
              482
            ]
          },
          {
            "time": "20:00",
            "mw": [
              162,
              514,
              1750
            ],
            "mvar": [
              26,
              108,
              468
            ]
          },
          {
            "time": "21:00",
            "mw": [
              150,
              486,
              1676
            ],
            "mvar": [
              9,
              104,
              402
            ]
          },
          {
            "time": "22:00",
            "mw": [
              141,
              474,
              1598
            ],
            "mvar": [
              4,
              110,
              386
            ]
          },
          {
            "time": "23:00",
            "mw": [
              148,
              510,
              1734
            ],
            "mvar": [
              8,
              126,
              430
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 4108218.18
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 3306000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 3315000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 21790000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 21840000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 54359218.18,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 13,155,000 kWh but its circuits are metered at 6,621,000 kWh (1.99x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 16040,
        "maxDemandDayMw": 15190,
        "maxGenEveningMw": 16040,
        "totalEnergyGenMkwh": 350.1,
        "maxTempC": 34.8,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 14700,
            "loadShedMw": 0,
            "demandMw": 14700
          },
          {
            "time": "01:00",
            "generationMw": 14550,
            "loadShedMw": 0,
            "demandMw": 14550
          },
          {
            "time": "02:00",
            "generationMw": 14390,
            "loadShedMw": 0,
            "demandMw": 14390
          },
          {
            "time": "03:00",
            "generationMw": 13970,
            "loadShedMw": 0,
            "demandMw": 13970
          },
          {
            "time": "04:00",
            "generationMw": 13660,
            "loadShedMw": 0,
            "demandMw": 13660
          },
          {
            "time": "05:00",
            "generationMw": 13370,
            "loadShedMw": 0,
            "demandMw": 13370
          },
          {
            "time": "06:00",
            "generationMw": 13190,
            "loadShedMw": 0,
            "demandMw": 13190
          },
          {
            "time": "07:00",
            "generationMw": 13270,
            "loadShedMw": 0,
            "demandMw": 13270
          },
          {
            "time": "08:00",
            "generationMw": 13480,
            "loadShedMw": 0,
            "demandMw": 13480
          },
          {
            "time": "09:00",
            "generationMw": 13750,
            "loadShedMw": 0,
            "demandMw": 13750
          },
          {
            "time": "10:00",
            "generationMw": 14050,
            "loadShedMw": 0,
            "demandMw": 14050
          },
          {
            "time": "11:00",
            "generationMw": 14300,
            "loadShedMw": 0,
            "demandMw": 14300
          },
          {
            "time": "12:00",
            "generationMw": 15190,
            "loadShedMw": 0,
            "demandMw": 15190
          },
          {
            "time": "13:00",
            "generationMw": 15460,
            "loadShedMw": 0,
            "demandMw": 15460
          },
          {
            "time": "14:00",
            "generationMw": 15510,
            "loadShedMw": 0,
            "demandMw": 15510
          },
          {
            "time": "15:00",
            "generationMw": 15870,
            "loadShedMw": 0,
            "demandMw": 15870
          },
          {
            "time": "16:00",
            "generationMw": 14970,
            "loadShedMw": 0,
            "demandMw": 14970
          },
          {
            "time": "17:00",
            "generationMw": 14540,
            "loadShedMw": 0,
            "demandMw": 14540
          },
          {
            "time": "18:00",
            "generationMw": 13550,
            "loadShedMw": 0,
            "demandMw": 13550
          },
          {
            "time": "18:30",
            "generationMw": 14100,
            "loadShedMw": 0,
            "demandMw": 14100
          },
          {
            "time": "19:00",
            "generationMw": 14780,
            "loadShedMw": 0,
            "demandMw": 14780
          },
          {
            "time": "19:30",
            "generationMw": 15540,
            "loadShedMw": 0,
            "demandMw": 15540
          },
          {
            "time": "20:00",
            "generationMw": 15610,
            "loadShedMw": 0,
            "demandMw": 15610
          },
          {
            "time": "21:00",
            "generationMw": 16040,
            "loadShedMw": 0,
            "demandMw": 16040
          },
          {
            "time": "22:00",
            "generationMw": 15970,
            "loadShedMw": 0,
            "demandMw": 15970
          },
          {
            "time": "23:00",
            "generationMw": 15930,
            "loadShedMw": 0,
            "demandMw": 15930
          }
        ],
        "issuedAt": "2026-06-14T10:21:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-13",
        "issuedIn": "Daily Report 14-06-2026_",
        "targetDay": "2026-06-14",
        "layout": "scenario",
        "issuedFrom": "source-copy"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-14T00:00:00+06:00",
          "end": "2026-06-15T00:00:00+06:00",
          "filedAs": "2026-06-15",
          "sourceFile": "Daily Report 15-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-14T08:00:00+06:00",
          "end": "2026-06-15T08:00:00+06:00",
          "filedAs": "2026-06-15",
          "publishedLabel": "14-15 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (15.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report-16-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (16.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              158,
              524,
              1770
            ],
            "mvar": [
              15,
              120,
              486
            ]
          },
          {
            "time": "01:00",
            "mw": [
              163,
              534,
              1794
            ],
            "mvar": [
              12,
              118,
              476
            ]
          },
          {
            "time": "02:00",
            "mw": [
              160,
              542,
              1752
            ],
            "mvar": [
              9,
              114,
              466
            ]
          },
          {
            "time": "03:00",
            "mw": [
              151,
              528,
              1806
            ],
            "mvar": [
              3,
              114,
              456
            ]
          },
          {
            "time": "04:00",
            "mw": [
              152,
              529,
              1762
            ],
            "mvar": [
              12,
              116,
              430
            ]
          },
          {
            "time": "05:00",
            "mw": [
              154,
              516,
              1784
            ],
            "mvar": [
              15,
              98,
              430
            ]
          },
          {
            "time": "06:00",
            "mw": [
              154,
              500,
              1698
            ],
            "mvar": [
              15,
              88,
              434
            ]
          },
          {
            "time": "07:00",
            "mw": [
              153,
              508,
              1734
            ],
            "mvar": [
              9,
              86,
              440
            ]
          },
          {
            "time": "08:00",
            "mw": [
              175,
              560,
              1876
            ],
            "mvar": [
              25,
              112,
              520
            ]
          },
          {
            "time": "09:00",
            "mw": [
              193,
              590,
              1906
            ],
            "mvar": [
              44,
              150,
              570
            ]
          },
          {
            "time": "10:00",
            "mw": [
              206,
              624,
              1972
            ],
            "mvar": [
              49,
              164,
              614
            ]
          },
          {
            "time": "11:00",
            "mw": [
              190,
              588,
              1972
            ],
            "mvar": [
              35,
              154,
              614
            ]
          },
          {
            "time": "12:00",
            "mw": [
              191,
              608,
              1856
            ],
            "mvar": [
              35,
              160,
              610
            ]
          },
          {
            "time": "13:00",
            "mw": [
              213,
              654,
              1936
            ],
            "mvar": [
              53,
              182,
              624
            ]
          },
          {
            "time": "14:00",
            "mw": [
              203,
              620,
              1942
            ],
            "mvar": [
              38,
              140,
              608
            ]
          },
          {
            "time": "15:00",
            "mw": [
              182,
              592,
              1866
            ],
            "mvar": [
              34,
              120,
              572
            ]
          },
          {
            "time": "16:00",
            "mw": [
              211,
              660,
              2016
            ],
            "mvar": [
              52,
              160,
              604
            ]
          },
          {
            "time": "17:00",
            "mw": [
              209,
              610,
              1904
            ],
            "mvar": [
              56,
              150,
              600
            ]
          },
          {
            "time": "18:00",
            "mw": [
              194,
              582,
              1826
            ],
            "mvar": [
              54,
              160,
              564
            ]
          },
          {
            "time": "18:30",
            "mw": [
              187,
              594,
              1832
            ],
            "mvar": [
              49,
              158,
              498
            ]
          },
          {
            "time": "19:00",
            "mw": [
              190,
              574,
              1884
            ],
            "mvar": [
              48,
              128,
              482
            ]
          },
          {
            "time": "19:30",
            "mw": [
              161,
              502,
              1722
            ],
            "mvar": [
              32,
              92,
              432
            ]
          },
          {
            "time": "20:00",
            "mw": [
              167,
              494,
              1608
            ],
            "mvar": [
              35,
              94,
              378
            ]
          },
          {
            "time": "21:00",
            "mw": [
              151,
              486,
              1608
            ],
            "mvar": [
              18,
              112,
              378
            ]
          },
          {
            "time": "22:00",
            "mw": [
              148,
              496,
              1632
            ],
            "mvar": [
              12,
              112,
              348
            ]
          },
          {
            "time": "23:00",
            "mw": [
              167,
              554,
              1716
            ],
            "mvar": [
              24,
              116,
              406
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 4243709.09
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 3391000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 3397000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 21880000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 21890000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 54801709.09,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 13,480,000 kWh but its circuits are metered at 6,788,000 kWh (1.99x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 16940,
        "maxDemandDayMw": 15450,
        "maxGenEveningMw": 15100,
        "totalEnergyGenMkwh": 342.91,
        "maxTempC": 34,
        "totalLoadShedMw": 1757,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 14500,
            "loadShedMw": 1518,
            "demandMw": 16090
          },
          {
            "time": "01:00",
            "generationMw": 14300,
            "loadShedMw": 1327.45,
            "demandMw": 15690
          },
          {
            "time": "02:00",
            "generationMw": 14200,
            "loadShedMw": 1375.2,
            "demandMw": 15640
          },
          {
            "time": "03:00",
            "generationMw": 13900,
            "loadShedMw": 1403.85,
            "demandMw": 15370
          },
          {
            "time": "04:00",
            "generationMw": 13700,
            "loadShedMw": 1470.7,
            "demandMw": 15240
          },
          {
            "time": "05:00",
            "generationMw": 13490,
            "loadShedMw": 1528,
            "demandMw": 15090
          },
          {
            "time": "06:00",
            "generationMw": 13500,
            "loadShedMw": 1394.3,
            "demandMw": 14960
          },
          {
            "time": "07:00",
            "generationMw": 13590,
            "loadShedMw": 1251.05,
            "demandMw": 14900
          },
          {
            "time": "08:00",
            "generationMw": 13620,
            "loadShedMw": 983.65,
            "demandMw": 14650
          },
          {
            "time": "09:00",
            "generationMw": 13660,
            "loadShedMw": 1040.95,
            "demandMw": 14750
          },
          {
            "time": "10:00",
            "generationMw": 14310,
            "loadShedMw": 563.45,
            "demandMw": 14900
          },
          {
            "time": "11:00",
            "generationMw": 14430,
            "loadShedMw": 592.1,
            "demandMw": 15050
          },
          {
            "time": "12:00",
            "generationMw": 14490,
            "loadShedMw": 916.8,
            "demandMw": 15450
          },
          {
            "time": "13:00",
            "generationMw": 14550,
            "loadShedMw": 1146,
            "demandMw": 15750
          },
          {
            "time": "14:00",
            "generationMw": 14500,
            "loadShedMw": 1241.5,
            "demandMw": 15800
          },
          {
            "time": "15:00",
            "generationMw": 14460,
            "loadShedMw": 1308.35,
            "demandMw": 15830
          },
          {
            "time": "16:00",
            "generationMw": 14270,
            "loadShedMw": 1489.8,
            "demandMw": 15830
          },
          {
            "time": "17:00",
            "generationMw": 14310,
            "loadShedMw": 1165.1,
            "demandMw": 15530
          },
          {
            "time": "18:00",
            "generationMw": 14600,
            "loadShedMw": 1165.1,
            "demandMw": 15820
          },
          {
            "time": "18:30",
            "generationMw": 14630,
            "loadShedMw": 1594.85,
            "demandMw": 16300
          },
          {
            "time": "19:00",
            "generationMw": 14780,
            "loadShedMw": 1957.75,
            "demandMw": 16830
          },
          {
            "time": "19:30",
            "generationMw": 14790,
            "loadShedMw": 1957.75,
            "demandMw": 16840
          },
          {
            "time": "20:00",
            "generationMw": 14800,
            "loadShedMw": 1995.95,
            "demandMw": 16890
          },
          {
            "time": "21:00",
            "generationMw": 15100,
            "loadShedMw": 1757.2,
            "demandMw": 16940
          },
          {
            "time": "22:00",
            "generationMw": 14950,
            "loadShedMw": 1852.7,
            "demandMw": 16890
          },
          {
            "time": "23:00",
            "generationMw": 14900,
            "loadShedMw": 1709.45,
            "demandMw": 16690
          }
        ],
        "issuedAt": "2026-06-15T08:12:00+06:00",
        "areaLoadShedUnread": true,
        "issuedOn": "2026-06-14",
        "issuedIn": "Daily Report 15-06-2026",
        "targetDay": "2026-06-15",
        "layout": "scenario",
        "issuedFrom": "source-copy"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-15T00:00:00+06:00",
          "end": "2026-06-16T00:00:00+06:00",
          "filedAs": "2026-06-16",
          "sourceFile": "Daily Report-16-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-15T08:00:00+06:00",
          "end": "2026-06-16T08:00:00+06:00",
          "filedAs": "2026-06-16",
          "publishedLabel": "15-16 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (16.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 17-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (17.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              186,
              590,
              1852
            ],
            "mvar": [
              37,
              128,
              454
            ]
          },
          {
            "time": "01:00",
            "mw": [
              159,
              520,
              1722
            ],
            "mvar": [
              25,
              104,
              398
            ]
          },
          {
            "time": "02:00",
            "mw": [
              155,
              522,
              1676
            ],
            "mvar": [
              22,
              110,
              396
            ]
          },
          {
            "time": "03:00",
            "mw": [
              153,
              502,
              1632
            ],
            "mvar": [
              22,
              96,
              360
            ]
          },
          {
            "time": "04:00",
            "mw": [
              156,
              514,
              1636
            ],
            "mvar": [
              24,
              104,
              368
            ]
          },
          {
            "time": "05:00",
            "mw": [
              155,
              504,
              1586
            ],
            "mvar": [
              25,
              104,
              382
            ]
          },
          {
            "time": "06:00",
            "mw": [
              134,
              468,
              1268
            ],
            "mvar": [
              15,
              80,
              268
            ]
          },
          {
            "time": "07:00",
            "mw": [
              135,
              470,
              1340
            ],
            "mvar": [
              8,
              64,
              260
            ]
          },
          {
            "time": "08:00",
            "mw": [
              153,
              502,
              1412
            ],
            "mvar": [
              20,
              86,
              326
            ]
          },
          {
            "time": "09:00",
            "mw": [
              194,
              596,
              1640
            ],
            "mvar": [
              38,
              102,
              400
            ]
          },
          {
            "time": "10:00",
            "mw": [
              208,
              630,
              1740
            ],
            "mvar": [
              49,
              120,
              470
            ]
          },
          {
            "time": "11:00",
            "mw": [
              205,
              648,
              1698
            ],
            "mvar": [
              43,
              144,
              480
            ]
          },
          {
            "time": "12:00",
            "mw": [
              211,
              630,
              1764
            ],
            "mvar": [
              52,
              130,
              526
            ]
          },
          {
            "time": "13:00",
            "mw": [
              210,
              618,
              1802
            ],
            "mvar": [
              51,
              134,
              530
            ]
          },
          {
            "time": "14:00",
            "mw": [
              212,
              626,
              1792
            ],
            "mvar": [
              54,
              130,
              524
            ]
          },
          {
            "time": "15:00",
            "mw": [
              211,
              628,
              1774
            ],
            "mvar": [
              51,
              128,
              486
            ]
          },
          {
            "time": "16:00",
            "mw": [
              207,
              610,
              1782
            ],
            "mvar": [
              53,
              130,
              494
            ]
          },
          {
            "time": "17:00",
            "mw": [
              199,
              600,
              1640
            ],
            "mvar": [
              52,
              130,
              476
            ]
          },
          {
            "time": "18:00",
            "mw": [
              196,
              540,
              1566
            ],
            "mvar": [
              51,
              104,
              470
            ]
          },
          {
            "time": "18:30",
            "mw": [
              186,
              550,
              1506
            ],
            "mvar": [
              42,
              114,
              442
            ]
          },
          {
            "time": "19:00",
            "mw": [
              196,
              582,
              1508
            ],
            "mvar": [
              45,
              134,
              416
            ]
          },
          {
            "time": "19:30",
            "mw": [
              168,
              456,
              1358
            ],
            "mvar": [
              35,
              64,
              376
            ]
          },
          {
            "time": "20:00",
            "mw": [
              160,
              456,
              1380
            ],
            "mvar": [
              31,
              64,
              352
            ]
          },
          {
            "time": "21:00",
            "mw": [
              164,
              516,
              1490
            ],
            "mvar": [
              26,
              102,
              368
            ]
          },
          {
            "time": "22:00",
            "mw": [
              161,
              518,
              1532
            ],
            "mvar": [
              21,
              100,
              340
            ]
          },
          {
            "time": "23:00",
            "mw": [
              164,
              556,
              1596
            ],
            "mvar": [
              21,
              88,
              354
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 4280509.09
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 3666000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 3680000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 19320000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 19370000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 50316509.09,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 13,292,000 kWh but its circuits are metered at 7,346,000 kWh (1.81x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 16590,
        "maxDemandDayMw": 14640,
        "maxGenEveningMw": 15150,
        "totalEnergyGenMkwh": 320.74,
        "maxTempC": 34,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 14250,
            "loadShedMw": 1910,
            "demandMw": 16246
          },
          {
            "time": "01:00",
            "generationMw": 14000,
            "loadShedMw": 2170,
            "demandMw": 16260
          },
          {
            "time": "02:00",
            "generationMw": 13950,
            "loadShedMw": 2110,
            "demandMw": 16150
          },
          {
            "time": "03:00",
            "generationMw": 13740,
            "loadShedMw": 2070,
            "demandMw": 15900
          },
          {
            "time": "04:00",
            "generationMw": 13670,
            "loadShedMw": 2040,
            "demandMw": 15800
          },
          {
            "time": "05:00",
            "generationMw": 13550,
            "loadShedMw": 1960,
            "demandMw": 15600
          },
          {
            "time": "06:00",
            "generationMw": 13400,
            "loadShedMw": 1920,
            "demandMw": 15400
          },
          {
            "time": "07:00",
            "generationMw": 13400,
            "loadShedMw": 1630,
            "demandMw": 15100
          },
          {
            "time": "08:00",
            "generationMw": 13350,
            "loadShedMw": 1580,
            "demandMw": 15000
          },
          {
            "time": "09:00",
            "generationMw": 13800,
            "loadShedMw": 1440,
            "demandMw": 15300
          },
          {
            "time": "10:00",
            "generationMw": 13900,
            "loadShedMw": 2074,
            "demandMw": 15567
          },
          {
            "time": "11:00",
            "generationMw": 14170,
            "loadShedMw": 1800,
            "demandMw": 16055
          },
          {
            "time": "12:00",
            "generationMw": 14300,
            "loadShedMw": 1850,
            "demandMw": 16237
          },
          {
            "time": "13:00",
            "generationMw": 14260,
            "loadShedMw": 1900,
            "demandMw": 16250
          },
          {
            "time": "14:00",
            "generationMw": 14160,
            "loadShedMw": 1700,
            "demandMw": 15940
          },
          {
            "time": "15:00",
            "generationMw": 14060,
            "loadShedMw": 1400,
            "demandMw": 15526
          },
          {
            "time": "16:00",
            "generationMw": 13920,
            "loadShedMw": 1050,
            "demandMw": 15010
          },
          {
            "time": "17:00",
            "generationMw": 13930,
            "loadShedMw": 1100,
            "demandMw": 15082
          },
          {
            "time": "18:00",
            "generationMw": 14000,
            "loadShedMw": 1200,
            "demandMw": 15257
          },
          {
            "time": "18:30",
            "generationMw": 14300,
            "loadShedMw": 1300,
            "demandMw": 15661
          },
          {
            "time": "19:00",
            "generationMw": 14490,
            "loadShedMw": 1090,
            "demandMw": 15620
          },
          {
            "time": "19:30",
            "generationMw": 14600,
            "loadShedMw": 1740,
            "demandMw": 16420
          },
          {
            "time": "20:00",
            "generationMw": 14800,
            "loadShedMw": 1230,
            "demandMw": 16080
          },
          {
            "time": "21:00",
            "generationMw": 15150,
            "loadShedMw": 1380,
            "demandMw": 16590
          },
          {
            "time": "22:00",
            "generationMw": 14900,
            "loadShedMw": 1340,
            "demandMw": 16300
          },
          {
            "time": "23:00",
            "generationMw": 14800,
            "loadShedMw": 1780,
            "demandMw": 16660
          }
        ],
        "issuedAt": "2026-06-16T10:50:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-15",
        "issuedIn": "Daily Report-16-06-2026",
        "targetDay": "2026-06-16",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-16T00:00:00+06:00",
          "end": "2026-06-17T00:00:00+06:00",
          "filedAs": "2026-06-17",
          "sourceFile": "Daily Report 17-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-16T08:00:00+06:00",
          "end": "2026-06-17T08:00:00+06:00",
          "filedAs": "2026-06-17",
          "publishedLabel": "16-17 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (17.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 18-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (18.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              175,
              504,
              1712
            ],
            "mvar": [
              42,
              90,
              388
            ]
          },
          {
            "time": "01:00",
            "mw": [
              150,
              492,
              1606
            ],
            "mvar": [
              31,
              98,
              312
            ]
          },
          {
            "time": "02:00",
            "mw": [
              145,
              508,
              1622
            ],
            "mvar": [
              29,
              96,
              338
            ]
          },
          {
            "time": "03:00",
            "mw": [
              158,
              526,
              1674
            ],
            "mvar": [
              19,
              96,
              334
            ]
          },
          {
            "time": "04:00",
            "mw": [
              151,
              530,
              1618
            ],
            "mvar": [
              13,
              106,
              278
            ]
          },
          {
            "time": "05:00",
            "mw": [
              142,
              504,
              1572
            ],
            "mvar": [
              10,
              102,
              262
            ]
          },
          {
            "time": "06:00",
            "mw": [
              143,
              516,
              1586
            ],
            "mvar": [
              10,
              114,
              272
            ]
          },
          {
            "time": "07:00",
            "mw": [
              146,
              516,
              1550
            ],
            "mvar": [
              9,
              118,
              244
            ]
          },
          {
            "time": "08:00",
            "mw": [
              163,
              502,
              1704
            ],
            "mvar": [
              29,
              92,
              376
            ]
          },
          {
            "time": "09:00",
            "mw": [
              194,
              580,
              1794
            ],
            "mvar": [
              46,
              124,
              410
            ]
          },
          {
            "time": "10:00",
            "mw": [
              202,
              602,
              1942
            ],
            "mvar": [
              52,
              116,
              490
            ]
          },
          {
            "time": "11:00",
            "mw": [
              205,
              618,
              1932
            ],
            "mvar": [
              43,
              120,
              500
            ]
          },
          {
            "time": "12:00",
            "mw": [
              200,
              570,
              1990
            ],
            "mvar": [
              32,
              108,
              518
            ]
          },
          {
            "time": "13:00",
            "mw": [
              198,
              570,
              1912
            ],
            "mvar": [
              39,
              108,
              480
            ]
          },
          {
            "time": "14:00",
            "mw": [
              203,
              630,
              1964
            ],
            "mvar": [
              37,
              144,
              466
            ]
          },
          {
            "time": "15:00",
            "mw": [
              193,
              580,
              1914
            ],
            "mvar": [
              31,
              104,
              434
            ]
          },
          {
            "time": "16:00",
            "mw": [
              179,
              520,
              1840
            ],
            "mvar": [
              35,
              90,
              416
            ]
          },
          {
            "time": "17:00",
            "mw": [
              170,
              460,
              1754
            ],
            "mvar": [
              36,
              78,
              400
            ]
          },
          {
            "time": "18:00",
            "mw": [
              154,
              468,
              1676
            ],
            "mvar": [
              37,
              136,
              404
            ]
          },
          {
            "time": "18:30",
            "mw": [
              172,
              580,
              1706
            ],
            "mvar": [
              36,
              160,
              338
            ]
          },
          {
            "time": "19:00",
            "mw": [
              183,
              552,
              1766
            ],
            "mvar": [
              42,
              136,
              354
            ]
          },
          {
            "time": "19:30",
            "mw": [
              172,
              530,
              1768
            ],
            "mvar": [
              35,
              124,
              300
            ]
          },
          {
            "time": "20:00",
            "mw": [
              161,
              510,
              1712
            ],
            "mvar": [
              29,
              120,
              300
            ]
          },
          {
            "time": "21:00",
            "mw": [
              162,
              500,
              1680
            ],
            "mvar": [
              27,
              118,
              306
            ]
          },
          {
            "time": "22:00",
            "mw": [
              149,
              510,
              1618
            ],
            "mvar": [
              19,
              120,
              274
            ]
          },
          {
            "time": "23:00",
            "mw": [
              140,
              460,
              1600
            ],
            "mvar": [
              14,
              104,
              292
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 4034618.18
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 2866000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 2874000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 20860000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 20900000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 51534618.18,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 12,740,500 kWh but its circuits are metered at 5,740,000 kWh (2.22x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 17600,
        "maxDemandDayMw": 16310,
        "maxGenEveningMw": 14950,
        "totalEnergyGenMkwh": 345.24,
        "maxTempC": 35.2,
        "totalLoadShedMw": 2531,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 14300,
            "loadShedMw": 2521.2,
            "demandMw": 16940
          },
          {
            "time": "01:00",
            "generationMw": 14000,
            "loadShedMw": 2435.25,
            "demandMw": 16550
          },
          {
            "time": "02:00",
            "generationMw": 13900,
            "loadShedMw": 2435.25,
            "demandMw": 16450
          },
          {
            "time": "03:00",
            "generationMw": 13890,
            "loadShedMw": 2196.5,
            "demandMw": 16190
          },
          {
            "time": "04:00",
            "generationMw": 13880,
            "loadShedMw": 2072.35,
            "demandMw": 16050
          },
          {
            "time": "05:00",
            "generationMw": 13880,
            "loadShedMw": 1862.25,
            "demandMw": 15830
          },
          {
            "time": "06:00",
            "generationMw": 14000,
            "loadShedMw": 1528,
            "demandMw": 15600
          },
          {
            "time": "07:00",
            "generationMw": 14070,
            "loadShedMw": 1260.6,
            "demandMw": 15390
          },
          {
            "time": "08:00",
            "generationMw": 14160,
            "loadShedMw": 1060.05,
            "demandMw": 15270
          },
          {
            "time": "09:00",
            "generationMw": 14230,
            "loadShedMw": 1279.7,
            "demandMw": 15570
          },
          {
            "time": "10:00",
            "generationMw": 14460,
            "loadShedMw": 1327.45,
            "demandMw": 15850
          },
          {
            "time": "11:00",
            "generationMw": 14590,
            "loadShedMw": 1251.05,
            "demandMw": 15900
          },
          {
            "time": "12:00",
            "generationMw": 14690,
            "loadShedMw": 1547.1,
            "demandMw": 16310
          },
          {
            "time": "13:00",
            "generationMw": 14710,
            "loadShedMw": 1671.25,
            "demandMw": 16460
          },
          {
            "time": "14:00",
            "generationMw": 14570,
            "loadShedMw": 1871.8,
            "demandMw": 16530
          },
          {
            "time": "15:00",
            "generationMw": 14480,
            "loadShedMw": 2101,
            "demandMw": 16680
          },
          {
            "time": "16:00",
            "generationMw": 14320,
            "loadShedMw": 1852.7,
            "demandMw": 16260
          },
          {
            "time": "17:00",
            "generationMw": 14330,
            "loadShedMw": 1709.45,
            "demandMw": 16120
          },
          {
            "time": "18:00",
            "generationMw": 14600,
            "loadShedMw": 1346.55,
            "demandMw": 16010
          },
          {
            "time": "18:30",
            "generationMw": 14590,
            "loadShedMw": 1824.05,
            "demandMw": 16500
          },
          {
            "time": "19:00",
            "generationMw": 14750,
            "loadShedMw": 2225.15,
            "demandMw": 17080
          },
          {
            "time": "19:30",
            "generationMw": 14760,
            "loadShedMw": 2683.55,
            "demandMw": 17570
          },
          {
            "time": "20:00",
            "generationMw": 14800,
            "loadShedMw": 2568.95,
            "demandMw": 17490
          },
          {
            "time": "21:00",
            "generationMw": 14950,
            "loadShedMw": 2530.75,
            "demandMw": 17600
          },
          {
            "time": "22:00",
            "generationMw": 14860,
            "loadShedMw": 2521.2,
            "demandMw": 17500
          },
          {
            "time": "23:00",
            "generationMw": 14820,
            "loadShedMw": 2463.9,
            "demandMw": 17400
          }
        ],
        "issuedAt": "2026-06-17T08:16:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 390,
          "Chattogram": 166,
          "Cumilla": 354,
          "Mymensingh": 398,
          "Sylhet": 92,
          "Khulna": 412,
          "Barishal": 127,
          "Rajshahi": 320,
          "Rangpur": 272
        },
        "issuedOn": "2026-06-16",
        "issuedIn": "Daily Report 17-06-2026",
        "targetDay": "2026-06-17",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-17T00:00:00+06:00",
          "end": "2026-06-18T00:00:00+06:00",
          "filedAs": "2026-06-18",
          "sourceFile": "Daily Report 18-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-17T08:00:00+06:00",
          "end": "2026-06-18T08:00:00+06:00",
          "filedAs": "2026-06-18",
          "publishedLabel": "17-18 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (18.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 19-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (19.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              158,
              520,
              1748
            ],
            "mvar": [
              25,
              122,
              342
            ]
          },
          {
            "time": "01:00",
            "mw": [
              139,
              480,
              1436
            ],
            "mvar": [
              16,
              106,
              226
            ]
          },
          {
            "time": "02:00",
            "mw": [
              128,
              460,
              1626
            ],
            "mvar": [
              10,
              96,
              272
            ]
          },
          {
            "time": "03:00",
            "mw": [
              120,
              442,
              1572
            ],
            "mvar": [
              6,
              92,
              252
            ]
          },
          {
            "time": "04:00",
            "mw": [
              127,
              480,
              1532
            ],
            "mvar": [
              -8,
              90,
              214
            ]
          },
          {
            "time": "05:00",
            "mw": [
              115,
              482,
              1536
            ],
            "mvar": [
              -21,
              82,
              162
            ]
          },
          {
            "time": "06:00",
            "mw": [
              117,
              450,
              1418
            ],
            "mvar": [
              -13,
              92,
              218
            ]
          },
          {
            "time": "07:00",
            "mw": [
              123,
              468,
              1436
            ],
            "mvar": [
              -10,
              104,
              226
            ]
          },
          {
            "time": "08:00",
            "mw": [
              142,
              540,
              1546
            ],
            "mvar": [
              2,
              146,
              312
            ]
          },
          {
            "time": "09:00",
            "mw": [
              166,
              550,
              1590
            ],
            "mvar": [
              28,
              158,
              438
            ]
          },
          {
            "time": "10:00",
            "mw": [
              181,
              550,
              1598
            ],
            "mvar": [
              42,
              144,
              526
            ]
          },
          {
            "time": "11:00",
            "mw": [
              192,
              580,
              1618
            ],
            "mvar": [
              43,
              142,
              590
            ]
          },
          {
            "time": "12:00",
            "mw": [
              168,
              530,
              1660
            ],
            "mvar": [
              27,
              126,
              538
            ]
          },
          {
            "time": "13:00",
            "mw": [
              149,
              500,
              1594
            ],
            "mvar": [
              15,
              138,
              478
            ]
          },
          {
            "time": "14:00",
            "mw": [
              177,
              520,
              1626
            ],
            "mvar": [
              41,
              120,
              512
            ]
          },
          {
            "time": "15:00",
            "mw": [
              227,
              600,
              2018
            ],
            "mvar": [
              54,
              150,
              670
            ]
          },
          {
            "time": "16:00",
            "mw": [
              218,
              620,
              1998
            ],
            "mvar": [
              47,
              146,
              664
            ]
          },
          {
            "time": "17:00",
            "mw": [
              203,
              590,
              1914
            ],
            "mvar": [
              35,
              140,
              592
            ]
          },
          {
            "time": "18:00",
            "mw": [
              183,
              530,
              1768
            ],
            "mvar": [
              28,
              122,
              520
            ]
          },
          {
            "time": "18:30",
            "mw": [
              181,
              530,
              1756
            ],
            "mvar": [
              27,
              120,
              490
            ]
          },
          {
            "time": "19:00",
            "mw": [
              182,
              560,
              1838
            ],
            "mvar": [
              21,
              128,
              426
            ]
          },
          {
            "time": "19:30",
            "mw": [
              163,
              510,
              1754
            ],
            "mvar": [
              18,
              120,
              406
            ]
          },
          {
            "time": "20:00",
            "mw": [
              168,
              530,
              1786
            ],
            "mvar": [
              19,
              116,
              388
            ]
          },
          {
            "time": "21:00",
            "mw": [
              176,
              540,
              1804
            ],
            "mvar": [
              24,
              128,
              414
            ]
          },
          {
            "time": "22:00",
            "mw": [
              155,
              500,
              1636
            ],
            "mvar": [
              27,
              128,
              408
            ]
          },
          {
            "time": "23:00",
            "mw": [
              145,
              470,
              1618
            ],
            "mvar": [
              18,
              116,
              332
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 3828872.73
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 1672.73
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 3096000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 3104000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 20280000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 20420000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 50730545.46,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 12,442,000 kWh but its circuits are metered at 6,200,000 kWh (2.01x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 17600,
        "maxDemandDayMw": 16050,
        "maxGenEveningMw": 15460,
        "totalEnergyGenMkwh": 338.39,
        "maxTempC": 33,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 14600,
            "loadShedMw": 2674,
            "demandMw": 17400
          },
          {
            "time": "01:00",
            "generationMw": 13800,
            "loadShedMw": 2931.85,
            "demandMw": 16870
          },
          {
            "time": "02:00",
            "generationMw": 13600,
            "loadShedMw": 2845.9,
            "demandMw": 16580
          },
          {
            "time": "03:00",
            "generationMw": 13550,
            "loadShedMw": 2645.35,
            "demandMw": 16320
          },
          {
            "time": "04:00",
            "generationMw": 13500,
            "loadShedMw": 2530.75,
            "demandMw": 16150
          },
          {
            "time": "05:00",
            "generationMw": 13600,
            "loadShedMw": 2225.15,
            "demandMw": 15930
          },
          {
            "time": "06:00",
            "generationMw": 13450,
            "loadShedMw": 1833.6,
            "demandMw": 15370
          },
          {
            "time": "07:00",
            "generationMw": 13700,
            "loadShedMw": 1518.45,
            "demandMw": 15290
          },
          {
            "time": "08:00",
            "generationMw": 13700,
            "loadShedMw": 1518.45,
            "demandMw": 15290
          },
          {
            "time": "09:00",
            "generationMw": 13750,
            "loadShedMw": 1623.5,
            "demandMw": 15450
          },
          {
            "time": "10:00",
            "generationMw": 13800,
            "loadShedMw": 1528,
            "demandMw": 15400
          },
          {
            "time": "11:00",
            "generationMw": 13850,
            "loadShedMw": 1613.95,
            "demandMw": 15540
          },
          {
            "time": "12:00",
            "generationMw": 13900,
            "loadShedMw": 2053.25,
            "demandMw": 16050
          },
          {
            "time": "13:00",
            "generationMw": 13900,
            "loadShedMw": 2139.2,
            "demandMw": 16140
          },
          {
            "time": "14:00",
            "generationMw": 14000,
            "loadShedMw": 2158.3,
            "demandMw": 16260
          },
          {
            "time": "15:00",
            "generationMw": 13800,
            "loadShedMw": 2483,
            "demandMw": 16400
          },
          {
            "time": "16:00",
            "generationMw": 13800,
            "loadShedMw": 2101,
            "demandMw": 16000
          },
          {
            "time": "17:00",
            "generationMw": 13640,
            "loadShedMw": 2158.3,
            "demandMw": 15900
          },
          {
            "time": "18:00",
            "generationMw": 13800,
            "loadShedMw": 1910,
            "demandMw": 15800
          },
          {
            "time": "18:30",
            "generationMw": 14400,
            "loadShedMw": 1814.5,
            "demandMw": 16300
          },
          {
            "time": "19:00",
            "generationMw": 15030,
            "loadShedMw": 1690.35,
            "demandMw": 16800
          },
          {
            "time": "19:30",
            "generationMw": 15040,
            "loadShedMw": 2158.3,
            "demandMw": 17300
          },
          {
            "time": "20:00",
            "generationMw": 15380,
            "loadShedMw": 1738.1,
            "demandMw": 17200
          },
          {
            "time": "21:00",
            "generationMw": 15460,
            "loadShedMw": 2043.7,
            "demandMw": 17600
          },
          {
            "time": "22:00",
            "generationMw": 15400,
            "loadShedMw": 1719,
            "demandMw": 17200
          },
          {
            "time": "23:00",
            "generationMw": 15380,
            "loadShedMw": 1929.1,
            "demandMw": 17400
          }
        ],
        "issuedAt": "2026-06-18T10:18:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-17",
        "issuedIn": "Daily Report 18-06-2026",
        "targetDay": "2026-06-18",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-18T00:00:00+06:00",
          "end": "2026-06-19T00:00:00+06:00",
          "filedAs": "2026-06-19",
          "sourceFile": "Daily Report 19-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-18T08:00:00+06:00",
          "end": "2026-06-19T08:00:00+06:00",
          "filedAs": "2026-06-19",
          "publishedLabel": "19-20 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (19.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 20-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (20.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              135,
              460,
              1602
            ],
            "mvar": [
              12,
              114,
              352
            ]
          },
          {
            "time": "01:00",
            "mw": [
              132,
              450,
              1648
            ],
            "mvar": [
              12,
              100,
              346
            ]
          },
          {
            "time": "02:00",
            "mw": [
              129,
              450,
              1638
            ],
            "mvar": [
              9,
              100,
              334
            ]
          },
          {
            "time": "03:00",
            "mw": [
              149,
              478,
              1596
            ],
            "mvar": [
              11,
              98,
              380
            ]
          },
          {
            "time": "04:00",
            "mw": [
              153,
              496,
              1604
            ],
            "mvar": [
              13,
              100,
              388
            ]
          },
          {
            "time": "05:00",
            "mw": [
              156,
              498,
              1556
            ],
            "mvar": [
              14,
              92,
              380
            ]
          },
          {
            "time": "06:00",
            "mw": [
              160,
              478,
              1520
            ],
            "mvar": [
              15,
              66,
              386
            ]
          },
          {
            "time": "07:00",
            "mw": [
              154,
              490,
              1440
            ],
            "mvar": [
              16,
              94,
              364
            ]
          },
          {
            "time": "08:00",
            "mw": [
              156,
              500,
              1434
            ],
            "mvar": [
              17,
              112,
              410
            ]
          },
          {
            "time": "09:00",
            "mw": [
              162,
              510,
              1458
            ],
            "mvar": [
              21,
              132,
              390
            ]
          },
          {
            "time": "10:00",
            "mw": [
              172,
              488,
              1314
            ],
            "mvar": [
              23,
              118,
              404
            ]
          },
          {
            "time": "11:00",
            "mw": [
              189,
              520,
              1420
            ],
            "mvar": [
              26,
              114,
              418
            ]
          },
          {
            "time": "12:00",
            "mw": [
              176,
              480,
              1520
            ],
            "mvar": [
              26,
              128,
              370
            ]
          },
          {
            "time": "13:00",
            "mw": [
              151,
              460,
              1474
            ],
            "mvar": [
              17,
              130,
              342
            ]
          },
          {
            "time": "14:00",
            "mw": [
              179,
              540,
              1568
            ],
            "mvar": [
              27,
              126,
              394
            ]
          },
          {
            "time": "15:00",
            "mw": [
              187,
              570,
              1726
            ],
            "mvar": [
              33,
              136,
              412
            ]
          },
          {
            "time": "16:00",
            "mw": [
              178,
              526,
              1632
            ],
            "mvar": [
              31,
              124,
              428
            ]
          },
          {
            "time": "17:00",
            "mw": [
              170,
              490,
              1536
            ],
            "mvar": [
              26,
              112,
              448
            ]
          },
          {
            "time": "18:00",
            "mw": [
              156,
              440,
              1558
            ],
            "mvar": [
              21,
              90,
              318
            ]
          },
          {
            "time": "18:30",
            "mw": [
              159,
              450,
              1658
            ],
            "mvar": [
              12,
              92,
              406
            ]
          },
          {
            "time": "19:00",
            "mw": [
              141,
              460,
              1552
            ],
            "mvar": [
              3,
              130,
              372
            ]
          },
          {
            "time": "19:30",
            "mw": [
              117,
              400,
              1530
            ],
            "mvar": [
              0,
              130,
              282
            ]
          },
          {
            "time": "20:00",
            "mw": [
              123,
              430,
              1584
            ],
            "mvar": [
              5,
              124,
              300
            ]
          },
          {
            "time": "21:00",
            "mw": [
              119,
              444,
              1582
            ],
            "mvar": [
              1,
              130,
              324
            ]
          },
          {
            "time": "22:00",
            "mw": [
              100,
              410,
              1584
            ],
            "mvar": [
              -4,
              128,
              300
            ]
          },
          {
            "time": "23:00",
            "mw": [
              115,
              460,
              1558
            ],
            "mvar": [
              7,
              154,
              318
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 3661600.06
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 2904000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 2911000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 18550000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 18480000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 46506600.06,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 11,505,500 kWh but its circuits are metered at 5,815,000 kWh (1.98x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 14920,
        "maxDemandDayMw": 12960,
        "maxGenEveningMw": 14920,
        "totalEnergyGenMkwh": 316.65,
        "maxTempC": 36,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 14700,
            "loadShedMw": 0,
            "demandMw": 14700
          },
          {
            "time": "01:00",
            "generationMw": 14290,
            "loadShedMw": 0,
            "demandMw": 14290
          },
          {
            "time": "02:00",
            "generationMw": 14000,
            "loadShedMw": 0,
            "demandMw": 14000
          },
          {
            "time": "03:00",
            "generationMw": 13420,
            "loadShedMw": 0,
            "demandMw": 13420
          },
          {
            "time": "04:00",
            "generationMw": 13030,
            "loadShedMw": 0,
            "demandMw": 13030
          },
          {
            "time": "05:00",
            "generationMw": 12620,
            "loadShedMw": 0,
            "demandMw": 12620
          },
          {
            "time": "06:00",
            "generationMw": 12140,
            "loadShedMw": 0,
            "demandMw": 12140
          },
          {
            "time": "07:00",
            "generationMw": 12050,
            "loadShedMw": 0,
            "demandMw": 12050
          },
          {
            "time": "08:00",
            "generationMw": 11880,
            "loadShedMw": 0,
            "demandMw": 11880
          },
          {
            "time": "09:00",
            "generationMw": 12030,
            "loadShedMw": 0,
            "demandMw": 12030
          },
          {
            "time": "10:00",
            "generationMw": 12180,
            "loadShedMw": 0,
            "demandMw": 12180
          },
          {
            "time": "11:00",
            "generationMw": 12440,
            "loadShedMw": 0,
            "demandMw": 12440
          },
          {
            "time": "12:00",
            "generationMw": 12960,
            "loadShedMw": 0,
            "demandMw": 12960
          },
          {
            "time": "13:00",
            "generationMw": 13700,
            "loadShedMw": 0,
            "demandMw": 13700
          },
          {
            "time": "14:00",
            "generationMw": 12990,
            "loadShedMw": 0,
            "demandMw": 12990
          },
          {
            "time": "15:00",
            "generationMw": 13060,
            "loadShedMw": 0,
            "demandMw": 13060
          },
          {
            "time": "16:00",
            "generationMw": 12620,
            "loadShedMw": 0,
            "demandMw": 12620
          },
          {
            "time": "17:00",
            "generationMw": 12050,
            "loadShedMw": 0,
            "demandMw": 12050
          },
          {
            "time": "18:00",
            "generationMw": 11960,
            "loadShedMw": 0,
            "demandMw": 11960
          },
          {
            "time": "18:30",
            "generationMw": 12350,
            "loadShedMw": 0,
            "demandMw": 12350
          },
          {
            "time": "19:00",
            "generationMw": 12950,
            "loadShedMw": 0,
            "demandMw": 12950
          },
          {
            "time": "19:30",
            "generationMw": 14110,
            "loadShedMw": 0,
            "demandMw": 14110
          },
          {
            "time": "20:00",
            "generationMw": 14410,
            "loadShedMw": 0,
            "demandMw": 14410
          },
          {
            "time": "21:00",
            "generationMw": 14920,
            "loadShedMw": 0,
            "demandMw": 14920
          },
          {
            "time": "22:00",
            "generationMw": 15150,
            "loadShedMw": 0,
            "demandMw": 15150
          },
          {
            "time": "23:00",
            "generationMw": 15100,
            "loadShedMw": 0,
            "demandMw": 15100
          }
        ],
        "issuedAt": "2026-06-19T10:05:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-18",
        "issuedIn": "Daily Report 19-06-2026",
        "targetDay": "2026-06-19",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-19T00:00:00+06:00",
          "end": "2026-06-20T00:00:00+06:00",
          "filedAs": "2026-06-20",
          "sourceFile": "Daily Report 20-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-19T08:00:00+06:00",
          "end": "2026-06-20T08:00:00+06:00",
          "filedAs": "2026-06-20",
          "publishedLabel": "19-20 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (20.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 21-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (21.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              112,
              422,
              1552
            ],
            "mvar": [
              8,
              146,
              300
            ]
          },
          {
            "time": "01:00",
            "mw": [
              118,
              444,
              1548
            ],
            "mvar": [
              12,
              144,
              306
            ]
          },
          {
            "time": "02:00",
            "mw": [
              122,
              454,
              1554
            ],
            "mvar": [
              17,
              146,
              316
            ]
          },
          {
            "time": "03:00",
            "mw": [
              137,
              496,
              1656
            ],
            "mvar": [
              10,
              136,
              312
            ]
          },
          {
            "time": "04:00",
            "mw": [
              146,
              510,
              1720
            ],
            "mvar": [
              15,
              138,
              358
            ]
          },
          {
            "time": "05:00",
            "mw": [
              151,
              510,
              1692
            ],
            "mvar": [
              18,
              140,
              348
            ]
          },
          {
            "time": "06:00",
            "mw": [
              155,
              534,
              1672
            ],
            "mvar": [
              19,
              136,
              360
            ]
          },
          {
            "time": "07:00",
            "mw": [
              152,
              530,
              1672
            ],
            "mvar": [
              18,
              144,
              390
            ]
          },
          {
            "time": "08:00",
            "mw": [
              168,
              560,
              1750
            ],
            "mvar": [
              31,
              156,
              452
            ]
          },
          {
            "time": "09:00",
            "mw": [
              152,
              480,
              1780
            ],
            "mvar": [
              49,
              140,
              480
            ]
          },
          {
            "time": "10:00",
            "mw": [
              166,
              506,
              1752
            ],
            "mvar": [
              49,
              126,
              550
            ]
          },
          {
            "time": "11:00",
            "mw": [
              180,
              580,
              1904
            ],
            "mvar": [
              57,
              162,
              582
            ]
          },
          {
            "time": "12:00",
            "mw": [
              166,
              532,
              1778
            ],
            "mvar": [
              52,
              160,
              562
            ]
          },
          {
            "time": "13:00",
            "mw": [
              159,
              526,
              1678
            ],
            "mvar": [
              48,
              156,
              514
            ]
          },
          {
            "time": "14:00",
            "mw": [
              148,
              512,
              1686
            ],
            "mvar": [
              43,
              160,
              536
            ]
          },
          {
            "time": "15:00",
            "mw": [
              160,
              560,
              1806
            ],
            "mvar": [
              48,
              160,
              542
            ]
          },
          {
            "time": "16:00",
            "mw": [
              148,
              510,
              1782
            ],
            "mvar": [
              48,
              160,
              522
            ]
          },
          {
            "time": "17:00",
            "mw": [
              141,
              480,
              1718
            ],
            "mvar": [
              43,
              160,
              508
            ]
          },
          {
            "time": "18:00",
            "mw": [
              131,
              420,
              1532
            ],
            "mvar": [
              42,
              122,
              510
            ]
          },
          {
            "time": "18:30",
            "mw": [
              123,
              360,
              1540
            ],
            "mvar": [
              42,
              104,
              510
            ]
          },
          {
            "time": "19:00",
            "mw": [
              133,
              420,
              1608
            ],
            "mvar": [
              47,
              150,
              328
            ]
          },
          {
            "time": "19:30",
            "mw": [
              96,
              380,
              1538
            ],
            "mvar": [
              25,
              156,
              448
            ]
          },
          {
            "time": "20:00",
            "mw": [
              100,
              370,
              1514
            ],
            "mvar": [
              45,
              184,
              492
            ]
          },
          {
            "time": "21:00",
            "mw": [
              94,
              370,
              1434
            ],
            "mvar": [
              40,
              178,
              498
            ]
          },
          {
            "time": "22:00",
            "mw": [
              99,
              376,
              1564
            ],
            "mvar": [
              34,
              120,
              412
            ]
          },
          {
            "time": "23:00",
            "mw": [
              111,
              440,
              1656
            ],
            "mvar": [
              35,
              148,
              442
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 3306981.82
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 2857000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 2866000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 20120000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 20160000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 49309981.82,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 11,513,500 kWh but its circuits are metered at 5,723,000 kWh (2.01x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 16610,
        "maxDemandDayMw": 14160,
        "maxGenEveningMw": 14951.66,
        "totalEnergyGenMkwh": 333.69021,
        "maxTempC": 36.4,
        "totalLoadShedMw": 1584,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 14179.66,
            "loadShedMw": 165,
            "demandMw": 14344.66
          },
          {
            "time": "01:00",
            "generationMw": 13763.66,
            "loadShedMw": 180,
            "demandMw": 13943.66
          },
          {
            "time": "02:00",
            "generationMw": 13576.66,
            "loadShedMw": 160,
            "demandMw": 13736.66
          },
          {
            "time": "03:00",
            "generationMw": 13576.66,
            "loadShedMw": 140,
            "demandMw": 13716.66
          },
          {
            "time": "04:00",
            "generationMw": 13488.66,
            "loadShedMw": 95,
            "demandMw": 13583.66
          },
          {
            "time": "05:00",
            "generationMw": 13440.66,
            "loadShedMw": 100,
            "demandMw": 13540.66
          },
          {
            "time": "06:00",
            "generationMw": 12840,
            "loadShedMw": 60,
            "demandMw": 12900
          },
          {
            "time": "07:00",
            "generationMw": 13060,
            "loadShedMw": 90,
            "demandMw": 13150
          },
          {
            "time": "08:00",
            "generationMw": 12920,
            "loadShedMw": 75,
            "demandMw": 12995
          },
          {
            "time": "09:00",
            "generationMw": 13090,
            "loadShedMw": 0,
            "demandMw": 13090
          },
          {
            "time": "10:00",
            "generationMw": 13180,
            "loadShedMw": 0,
            "demandMw": 13180
          },
          {
            "time": "11:00",
            "generationMw": 13520,
            "loadShedMw": 0,
            "demandMw": 13520
          },
          {
            "time": "12:00",
            "generationMw": 14160,
            "loadShedMw": 0,
            "demandMw": 14160
          },
          {
            "time": "13:00",
            "generationMw": 14183.66,
            "loadShedMw": 378.5047,
            "demandMw": 14580
          },
          {
            "time": "14:00",
            "generationMw": 14207.09,
            "loadShedMw": 365.67905,
            "demandMw": 14590
          },
          {
            "time": "15:00",
            "generationMw": 14128.28,
            "loadShedMw": 488.6926,
            "demandMw": 14640
          },
          {
            "time": "16:00",
            "generationMw": 14085.46,
            "loadShedMw": 271.7357,
            "demandMw": 14370
          },
          {
            "time": "17:00",
            "generationMw": 13890,
            "loadShedMw": 0,
            "demandMw": 13890
          },
          {
            "time": "18:00",
            "generationMw": 13710,
            "loadShedMw": 0,
            "demandMw": 13710
          },
          {
            "time": "18:30",
            "generationMw": 14300,
            "loadShedMw": 0,
            "demandMw": 14300
          },
          {
            "time": "19:00",
            "generationMw": 14890.39,
            "loadShedMw": 696.77755,
            "demandMw": 15620
          },
          {
            "time": "19:30",
            "generationMw": 14894.39,
            "loadShedMw": 1084.50755,
            "demandMw": 16030
          },
          {
            "time": "20:00",
            "generationMw": 14903.39,
            "loadShedMw": 1180.96255,
            "demandMw": 16140
          },
          {
            "time": "21:00",
            "generationMw": 14951.66,
            "loadShedMw": 1583.7147,
            "demandMw": 16610
          },
          {
            "time": "22:00",
            "generationMw": 14987.66,
            "loadShedMw": 1119.5847,
            "demandMw": 16160
          },
          {
            "time": "23:00",
            "generationMw": 14956.66,
            "loadShedMw": 1540.7397,
            "demandMw": 16570
          }
        ],
        "issuedAt": "2026-06-20T11:09:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 375,
          "Chattogram": 151,
          "Cumilla": 113,
          "Mymensingh": 218,
          "Sylhet": 32,
          "Khulna": 282,
          "Barishal": 72,
          "Rajshahi": 202,
          "Rangpur": 139
        },
        "issuedOn": "2026-06-19",
        "issuedIn": "Daily Report 20-06-2026",
        "targetDay": "2026-06-20",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-20T00:00:00+06:00",
          "end": "2026-06-21T00:00:00+06:00",
          "filedAs": "2026-06-21",
          "sourceFile": "Daily Report 21-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-20T08:00:00+06:00",
          "end": "2026-06-21T08:00:00+06:00",
          "filedAs": "2026-06-21",
          "publishedLabel": "20-21 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (21.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 22-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (21.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              121,
              460,
              1808
            ],
            "mvar": [
              23,
              116,
              456
            ]
          },
          {
            "time": "01:00",
            "mw": [
              117,
              450,
              1804
            ],
            "mvar": [
              22,
              120,
              458
            ]
          },
          {
            "time": "02:00",
            "mw": [
              120,
              484,
              1734
            ],
            "mvar": [
              14,
              120,
              410
            ]
          },
          {
            "time": "03:00",
            "mw": [
              110,
              460,
              1662
            ],
            "mvar": [
              9,
              116,
              386
            ]
          },
          {
            "time": "04:00",
            "mw": [
              105,
              418,
              1604
            ],
            "mvar": [
              11,
              116,
              370
            ]
          },
          {
            "time": "05:00",
            "mw": [
              101,
              412,
              1596
            ],
            "mvar": [
              10,
              116,
              382
            ]
          },
          {
            "time": "06:00",
            "mw": [
              102,
              408,
              1474
            ],
            "mvar": [
              11,
              116,
              348
            ]
          },
          {
            "time": "07:00",
            "mw": [
              104,
              412,
              1510
            ],
            "mvar": [
              28,
              124,
              380
            ]
          },
          {
            "time": "08:00",
            "mw": [
              119,
              436,
              1642
            ],
            "mvar": [
              35,
              140,
              468
            ]
          },
          {
            "time": "09:00",
            "mw": [
              142,
              496,
              1704
            ],
            "mvar": [
              48,
              168,
              492
            ]
          },
          {
            "time": "10:00",
            "mw": [
              149,
              500,
              1862
            ],
            "mvar": [
              49,
              140,
              532
            ]
          },
          {
            "time": "11:00",
            "mw": [
              153,
              522,
              1804
            ],
            "mvar": [
              56,
              168,
              548
            ]
          },
          {
            "time": "12:00",
            "mw": [
              154,
              440,
              1778
            ],
            "mvar": [
              54,
              124,
              540
            ]
          },
          {
            "time": "13:00",
            "mw": [
              133,
              440,
              1696
            ],
            "mvar": [
              44,
              124,
              506
            ]
          },
          {
            "time": "14:00",
            "mw": [
              145,
              460,
              1784
            ],
            "mvar": [
              48,
              114,
              518
            ]
          },
          {
            "time": "15:00",
            "mw": [
              146,
              460,
              1832
            ],
            "mvar": [
              49,
              130,
              520
            ]
          },
          {
            "time": "16:00",
            "mw": [
              130,
              390,
              1844
            ],
            "mvar": [
              44,
              100,
              558
            ]
          },
          {
            "time": "17:00",
            "mw": [
              108,
              306,
              1686
            ],
            "mvar": [
              35,
              76,
              568
            ]
          },
          {
            "time": "18:00",
            "mw": [
              102,
              326,
              1410
            ],
            "mvar": [
              17,
              74,
              476
            ]
          },
          {
            "time": "18:30",
            "mw": [
              104,
              310,
              1350
            ],
            "mvar": [
              17,
              80,
              452
            ]
          },
          {
            "time": "19:00",
            "mw": [
              83,
              336,
              1440
            ],
            "mvar": [
              7,
              122,
              346
            ]
          },
          {
            "time": "19:30",
            "mw": [
              67,
              340,
              1324
            ],
            "mvar": [
              3,
              106,
              274
            ]
          },
          {
            "time": "20:00",
            "mw": [
              65,
              332,
              1488
            ],
            "mvar": [
              1,
              88,
              336
            ]
          },
          {
            "time": "21:00",
            "mw": [
              66,
              304,
              1454
            ],
            "mvar": [
              11,
              102,
              332
            ]
          },
          {
            "time": "22:00",
            "mw": [
              50,
              296,
              1532
            ],
            "mvar": [
              1,
              100,
              270
            ]
          },
          {
            "time": "23:00",
            "mw": [
              51,
              310,
              1558
            ],
            "mvar": [
              -2,
              104,
              268
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 2621163.64
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 2641000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 2658000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 19780000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 19810000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 47510163.64,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 9,775,500 kWh but its circuits are metered at 5,299,000 kWh (1.84x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 17390,
        "maxDemandDayMw": 15440,
        "maxGenEveningMw": 14700,
        "totalEnergyGenMkwh": 326.63,
        "maxTempC": 31,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 14450,
            "loadShedMw": 2167.85,
            "demandMw": 16720
          },
          {
            "time": "01:00",
            "generationMw": 14158,
            "loadShedMw": 2341.66,
            "demandMw": 16610
          },
          {
            "time": "02:00",
            "generationMw": 13970,
            "loadShedMw": 2263.35,
            "demandMw": 16340
          },
          {
            "time": "03:00",
            "generationMw": 14010,
            "loadShedMw": 1680.8,
            "demandMw": 15770
          },
          {
            "time": "04:00",
            "generationMw": 13950,
            "loadShedMw": 1480.25,
            "demandMw": 15500
          },
          {
            "time": "05:00",
            "generationMw": 13920,
            "loadShedMw": 1308.35,
            "demandMw": 15290
          },
          {
            "time": "06:00",
            "generationMw": 13630,
            "loadShedMw": 1212.85,
            "demandMw": 14900
          },
          {
            "time": "07:00",
            "generationMw": 13880,
            "loadShedMw": 276.95,
            "demandMw": 14170
          },
          {
            "time": "08:00",
            "generationMw": 13937,
            "loadShedMw": 318.96999999999997,
            "demandMw": 14271
          },
          {
            "time": "09:00",
            "generationMw": 14067,
            "loadShedMw": 559.63,
            "demandMw": 14653
          },
          {
            "time": "10:00",
            "generationMw": 13388,
            "loadShedMw": 1014.2099999999999,
            "demandMw": 14450
          },
          {
            "time": "11:00",
            "generationMw": 12920,
            "loadShedMw": 1508.8999999999999,
            "demandMw": 14500
          },
          {
            "time": "12:00",
            "generationMw": 14200,
            "loadShedMw": 1184.2,
            "demandMw": 15440
          },
          {
            "time": "13:00",
            "generationMw": 14700,
            "loadShedMw": 964.55,
            "demandMw": 15710
          },
          {
            "time": "14:00",
            "generationMw": 14700,
            "loadShedMw": 983.65,
            "demandMw": 15730
          },
          {
            "time": "15:00",
            "generationMw": 14700,
            "loadShedMw": 1107.8,
            "demandMw": 15860
          },
          {
            "time": "16:00",
            "generationMw": 14700,
            "loadShedMw": 1060.05,
            "demandMw": 15810
          },
          {
            "time": "17:00",
            "generationMw": 14700,
            "loadShedMw": 582.55,
            "demandMw": 15310
          },
          {
            "time": "18:00",
            "generationMw": 14620,
            "loadShedMw": 553.9,
            "demandMw": 15200
          },
          {
            "time": "18:30",
            "generationMw": 14300,
            "loadShedMw": 1146,
            "demandMw": 15500
          },
          {
            "time": "19:00",
            "generationMw": 14680,
            "loadShedMw": 1661.7,
            "demandMw": 16420
          },
          {
            "time": "19:30",
            "generationMw": 14680,
            "loadShedMw": 2425.7,
            "demandMw": 17220
          },
          {
            "time": "20:00",
            "generationMw": 14700,
            "loadShedMw": 2463.9,
            "demandMw": 17280
          },
          {
            "time": "21:00",
            "generationMw": 14700,
            "loadShedMw": 2568.95,
            "demandMw": 17390
          },
          {
            "time": "22:00",
            "generationMw": 14700,
            "loadShedMw": 2597.6,
            "demandMw": 17420
          },
          {
            "time": "23:00",
            "generationMw": 14700,
            "loadShedMw": 2635.8,
            "demandMw": 17460
          }
        ],
        "issuedAt": "2026-06-21T10:57:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-20",
        "issuedIn": "Daily Report 21-06-2026",
        "targetDay": "2026-06-21",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-21T00:00:00+06:00",
          "end": "2026-06-22T00:00:00+06:00",
          "filedAs": "2026-06-22",
          "sourceFile": "Daily Report 22-06-2026.xlsx"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 23-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (23.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              46,
              306,
              1570
            ],
            "mvar": [
              -3,
              100,
              262
            ]
          },
          {
            "time": "01:00",
            "mw": [
              43,
              272,
              1434
            ],
            "mvar": [
              0,
              86,
              316
            ]
          },
          {
            "time": "02:00",
            "mw": [
              48,
              300,
              1488
            ],
            "mvar": [
              3,
              100,
              326
            ]
          },
          {
            "time": "03:00",
            "mw": [
              81,
              350,
              1642
            ],
            "mvar": [
              16,
              112,
              388
            ]
          },
          {
            "time": "04:00",
            "mw": [
              85,
              362,
              1656
            ],
            "mvar": [
              19,
              110,
              388
            ]
          },
          {
            "time": "05:00",
            "mw": [
              89,
              364,
              1672
            ],
            "mvar": [
              21,
              110,
              392
            ]
          },
          {
            "time": "06:00",
            "mw": [
              88,
              338,
              1598
            ],
            "mvar": [
              23,
              114,
              412
            ]
          },
          {
            "time": "07:00",
            "mw": [
              87,
              356,
              1574
            ],
            "mvar": [
              24,
              128,
              402
            ]
          },
          {
            "time": "08:00",
            "mw": [
              106,
              380,
              1632
            ],
            "mvar": [
              32,
              124,
              476
            ]
          },
          {
            "time": "09:00",
            "mw": [
              137,
              428,
              1822
            ],
            "mvar": [
              47,
              126,
              550
            ]
          },
          {
            "time": "10:00",
            "mw": [
              158,
              500,
              1900
            ],
            "mvar": [
              54,
              146,
              586
            ]
          },
          {
            "time": "11:00",
            "mw": [
              153,
              478,
              1946
            ],
            "mvar": [
              52,
              142,
              592
            ]
          },
          {
            "time": "12:00",
            "mw": [
              144,
              498,
              1854
            ],
            "mvar": [
              42,
              158,
              584
            ]
          },
          {
            "time": "13:00",
            "mw": [
              136,
              490,
              1830
            ],
            "mvar": [
              37,
              156,
              562
            ]
          },
          {
            "time": "14:00",
            "mw": [
              135,
              520,
              1828
            ],
            "mvar": [
              34,
              172,
              544
            ]
          },
          {
            "time": "15:00",
            "mw": [
              143,
              536,
              1914
            ],
            "mvar": [
              45,
              190,
              608
            ]
          },
          {
            "time": "16:00",
            "mw": [
              141,
              518,
              1932
            ],
            "mvar": [
              43,
              170,
              602
            ]
          },
          {
            "time": "17:00",
            "mw": [
              160,
              536,
              1918
            ],
            "mvar": [
              48,
              180,
              642
            ]
          },
          {
            "time": "18:00",
            "mw": [
              152,
              540,
              1726
            ],
            "mvar": [
              39,
              164,
              524
            ]
          },
          {
            "time": "18:30",
            "mw": [
              155,
              540,
              1754
            ],
            "mvar": [
              38,
              154,
              454
            ]
          },
          {
            "time": "19:00",
            "mw": [
              143,
              478,
              1664
            ],
            "mvar": [
              20,
              132,
              404
            ]
          },
          {
            "time": "19:30",
            "mw": [
              106,
              374,
              1476
            ],
            "mvar": [
              8,
              86,
              308
            ]
          },
          {
            "time": "20:00",
            "mw": [
              104,
              372,
              1450
            ],
            "mvar": [
              6,
              96,
              308
            ]
          },
          {
            "time": "21:00",
            "mw": [
              117,
              440,
              1478
            ],
            "mvar": [
              -1,
              130,
              300
            ]
          },
          {
            "time": "22:00",
            "mw": [
              109,
              420,
              1482
            ],
            "mvar": [
              -11,
              106,
              260
            ]
          },
          {
            "time": "23:00",
            "mw": [
              134,
              470,
              1604
            ],
            "mvar": [
              5,
              134,
              352
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 2793454.54
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 2384000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 2378000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 20590000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 20630000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 48775454.54,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 10,324,000 kWh but its circuits are metered at 4,762,000 kWh (2.17x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 17320,
        "maxDemandDayMw": 16050,
        "maxGenEveningMw": 15790,
        "totalEnergyGenMkwh": 342.74,
        "maxTempC": 36.4,
        "totalLoadShedMw": 1461,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 14410,
            "loadShedMw": 2855.45,
            "demandMw": 17400
          },
          {
            "time": "01:00",
            "generationMw": 14160,
            "loadShedMw": 2588.05,
            "demandMw": 16870
          },
          {
            "time": "02:00",
            "generationMw": 13970,
            "loadShedMw": 2492.55,
            "demandMw": 16580
          },
          {
            "time": "03:00",
            "generationMw": 14010,
            "loadShedMw": 2206.05,
            "demandMw": 16320
          },
          {
            "time": "04:00",
            "generationMw": 13950,
            "loadShedMw": 2101,
            "demandMw": 16150
          },
          {
            "time": "05:00",
            "generationMw": 13910,
            "loadShedMw": 1929.1,
            "demandMw": 15930
          },
          {
            "time": "06:00",
            "generationMw": 13630,
            "loadShedMw": 1661.7,
            "demandMw": 15370
          },
          {
            "time": "07:00",
            "generationMw": 13880,
            "loadShedMw": 1346.55,
            "demandMw": 15290
          },
          {
            "time": "08:00",
            "generationMw": 13940,
            "loadShedMw": 1289.25,
            "demandMw": 15290
          },
          {
            "time": "09:00",
            "generationMw": 14070,
            "loadShedMw": 1317.9,
            "demandMw": 15450
          },
          {
            "time": "10:00",
            "generationMw": 14060,
            "loadShedMw": 1279.7,
            "demandMw": 15400
          },
          {
            "time": "11:00",
            "generationMw": 14050,
            "loadShedMw": 1422.95,
            "demandMw": 15540
          },
          {
            "time": "12:00",
            "generationMw": 13960,
            "loadShedMw": 1995.95,
            "demandMw": 16050
          },
          {
            "time": "13:00",
            "generationMw": 14210,
            "loadShedMw": 1843.15,
            "demandMw": 16140
          },
          {
            "time": "14:00",
            "generationMw": 14040,
            "loadShedMw": 2120.1,
            "demandMw": 16260
          },
          {
            "time": "15:00",
            "generationMw": 13910,
            "loadShedMw": 2492.55,
            "demandMw": 16520
          },
          {
            "time": "16:00",
            "generationMw": 13920,
            "loadShedMw": 2377.95,
            "demandMw": 16410
          },
          {
            "time": "17:00",
            "generationMw": 14140,
            "loadShedMw": 1881.35,
            "demandMw": 16110
          },
          {
            "time": "18:00",
            "generationMw": 14020,
            "loadShedMw": 1136.45,
            "demandMw": 15210
          },
          {
            "time": "18:30",
            "generationMw": 14600,
            "loadShedMw": 1241.5,
            "demandMw": 15900
          },
          {
            "time": "19:00",
            "generationMw": 15390,
            "loadShedMw": 1184.2,
            "demandMw": 16630
          },
          {
            "time": "19:30",
            "generationMw": 15420,
            "loadShedMw": 1680.8,
            "demandMw": 17180
          },
          {
            "time": "20:00",
            "generationMw": 15400,
            "loadShedMw": 1575.75,
            "demandMw": 17050
          },
          {
            "time": "21:00",
            "generationMw": 15790,
            "loadShedMw": 1461.15,
            "demandMw": 17320
          },
          {
            "time": "22:00",
            "generationMw": 15020,
            "loadShedMw": 1976.85,
            "demandMw": 17090
          },
          {
            "time": "23:00",
            "generationMw": 14900,
            "loadShedMw": 1948.2,
            "demandMw": 16940
          }
        ],
        "issuedAt": "2026-06-22T09:36:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 450,
          "Chattogram": 160,
          "Cumilla": 191,
          "Mymensingh": 170,
          "Sylhet": 60,
          "Khulna": 120,
          "Barishal": 50,
          "Rajshahi": 150,
          "Rangpur": 110
        },
        "issuedOn": "2026-06-21",
        "issuedIn": "Daily Report 22-06-2026",
        "targetDay": "2026-06-22",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-22T00:00:00+06:00",
          "end": "2026-06-23T00:00:00+06:00",
          "filedAs": "2026-06-23",
          "sourceFile": "Daily Report 23-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-22T08:00:00+06:00",
          "end": "2026-06-23T08:00:00+06:00",
          "filedAs": "2026-06-23",
          "publishedLabel": "22-23 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (23.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 24-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (24.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              127,
              462,
              1588
            ],
            "mvar": [
              -3,
              124,
              266
            ]
          },
          {
            "time": "01:00",
            "mw": [
              120,
              438,
              1542
            ],
            "mvar": [
              -7,
              116,
              244
            ]
          },
          {
            "time": "02:00",
            "mw": [
              136,
              464,
              1614
            ],
            "mvar": [
              17,
              126,
              362
            ]
          },
          {
            "time": "03:00",
            "mw": [
              142,
              482,
              1684
            ],
            "mvar": [
              16,
              124,
              362
            ]
          },
          {
            "time": "04:00",
            "mw": [
              141,
              480,
              1614
            ],
            "mvar": [
              16,
              122,
              360
            ]
          },
          {
            "time": "05:00",
            "mw": [
              143,
              458,
              1602
            ],
            "mvar": [
              20,
              104,
              360
            ]
          },
          {
            "time": "06:00",
            "mw": [
              143,
              464,
              1574
            ],
            "mvar": [
              19,
              106,
              356
            ]
          },
          {
            "time": "07:00",
            "mw": [
              141,
              450,
              1582
            ],
            "mvar": [
              18,
              104,
              352
            ]
          },
          {
            "time": "08:00",
            "mw": [
              165,
              518,
              1652
            ],
            "mvar": [
              29,
              118,
              418
            ]
          },
          {
            "time": "09:00",
            "mw": [
              195,
              590,
              1836
            ],
            "mvar": [
              54,
              154,
              544
            ]
          },
          {
            "time": "10:00",
            "mw": [
              188,
              616,
              1818
            ],
            "mvar": [
              43,
              170,
              544
            ]
          },
          {
            "time": "11:00",
            "mw": [
              186,
              620,
              1898
            ],
            "mvar": [
              36,
              170,
              518
            ]
          },
          {
            "time": "12:00",
            "mw": [
              177,
              570,
              1846
            ],
            "mvar": [
              32,
              144,
              520
            ]
          },
          {
            "time": "13:00",
            "mw": [
              178,
              584,
              1778
            ],
            "mvar": [
              30,
              154,
              544
            ]
          },
          {
            "time": "14:00",
            "mw": [
              185,
              572,
              1810
            ],
            "mvar": [
              40,
              146,
              578
            ]
          },
          {
            "time": "15:00",
            "mw": [
              186,
              530,
              1852
            ],
            "mvar": [
              42,
              128,
              592
            ]
          },
          {
            "time": "16:00",
            "mw": [
              181,
              550,
              1780
            ],
            "mvar": [
              41,
              164,
              578
            ]
          },
          {
            "time": "17:00",
            "mw": [
              171,
              496,
              1584
            ],
            "mvar": [
              43,
              134,
              604
            ]
          },
          {
            "time": "18:00",
            "mw": [
              170,
              500,
              1492
            ],
            "mvar": [
              45,
              140,
              580
            ]
          },
          {
            "time": "18:30",
            "mw": [
              173,
              536,
              1564
            ],
            "mvar": [
              50,
              138,
              576
            ]
          },
          {
            "time": "19:00",
            "mw": [
              161,
              510,
              1628
            ],
            "mvar": [
              35,
              140,
              482
            ]
          },
          {
            "time": "19:30",
            "mw": [
              140,
              440,
              1628
            ],
            "mvar": [
              24,
              108,
              482
            ]
          },
          {
            "time": "20:00",
            "mw": [
              135,
              420,
              1430
            ],
            "mvar": [
              22,
              87,
              404
            ]
          },
          {
            "time": "21:00",
            "mw": [
              128,
              400,
              1448
            ],
            "mvar": [
              15,
              88,
              374
            ]
          },
          {
            "time": "22:00",
            "mw": [
              144,
              470,
              1478
            ],
            "mvar": [
              27,
              130,
              396
            ]
          },
          {
            "time": "23:00",
            "mw": [
              149,
              490,
              1360
            ],
            "mvar": [
              24,
              146,
              402
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 3765309.09
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 19670000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 19710000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 43145309.09,
          "import": 0
        },
        "checks": []
      },
      "forecast": {
        "maxDemandEveningMw": 16870,
        "maxDemandDayMw": 14810,
        "maxGenEveningMw": 16100,
        "totalEnergyGenMkwh": 342.68999,
        "maxTempC": 32,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 15760,
            "loadShedMw": 620.75,
            "demandMw": 16410
          },
          {
            "time": "01:00",
            "generationMw": 15665,
            "loadShedMw": 339.025,
            "demandMw": 16020
          },
          {
            "time": "02:00",
            "generationMw": 14670,
            "loadShedMw": 945.4499999999999,
            "demandMw": 15660
          },
          {
            "time": "03:00",
            "generationMw": 14350,
            "loadShedMw": 916.8,
            "demandMw": 15310
          },
          {
            "time": "04:00",
            "generationMw": 14250,
            "loadShedMw": 764,
            "demandMw": 15050
          },
          {
            "time": "05:00",
            "generationMw": 14040,
            "loadShedMw": 639.85,
            "demandMw": 14710
          },
          {
            "time": "06:00",
            "generationMw": 13680,
            "loadShedMw": 305.59999999999997,
            "demandMw": 14000
          },
          {
            "time": "07:00",
            "generationMw": 13640,
            "loadShedMw": 343.8,
            "demandMw": 14000
          },
          {
            "time": "08:00",
            "generationMw": 13770,
            "loadShedMw": 286.5,
            "demandMw": 14070
          },
          {
            "time": "09:00",
            "generationMw": 13880,
            "loadShedMw": 257.84999999999997,
            "demandMw": 14150
          },
          {
            "time": "10:00",
            "generationMw": 14350,
            "loadShedMw": 305.59999999999997,
            "demandMw": 14670
          },
          {
            "time": "11:00",
            "generationMw": 14400,
            "loadShedMw": 286.5,
            "demandMw": 14700
          },
          {
            "time": "12:00",
            "generationMw": 14500,
            "loadShedMw": 296.05,
            "demandMw": 14810
          },
          {
            "time": "13:00",
            "generationMw": 14600,
            "loadShedMw": 410.65,
            "demandMw": 15030
          },
          {
            "time": "14:00",
            "generationMw": 14600,
            "loadShedMw": 410.65,
            "demandMw": 15030
          },
          {
            "time": "15:00",
            "generationMw": 14650,
            "loadShedMw": 477.5,
            "demandMw": 15150
          },
          {
            "time": "16:00",
            "generationMw": 14400,
            "loadShedMw": 506.15,
            "demandMw": 14930
          },
          {
            "time": "17:00",
            "generationMw": 14300,
            "loadShedMw": 248.29999999999998,
            "demandMw": 14560
          },
          {
            "time": "18:00",
            "generationMw": 14300,
            "loadShedMw": 210.1,
            "demandMw": 14520
          },
          {
            "time": "18:30",
            "generationMw": 14900,
            "loadShedMw": 286.5,
            "demandMw": 15200
          },
          {
            "time": "19:00",
            "generationMw": 15100,
            "loadShedMw": 639.85,
            "demandMw": 15770
          },
          {
            "time": "19:30",
            "generationMw": 15500,
            "loadShedMw": 764,
            "demandMw": 16300
          },
          {
            "time": "20:00",
            "generationMw": 15800,
            "loadShedMw": 811.75,
            "demandMw": 16650
          },
          {
            "time": "21:00",
            "generationMw": 16100,
            "loadShedMw": 735.35,
            "demandMw": 16870
          },
          {
            "time": "22:00",
            "generationMw": 15700,
            "loadShedMw": 200.54999999999998,
            "demandMw": 15910
          },
          {
            "time": "23:00",
            "generationMw": 15400,
            "loadShedMw": 334.25,
            "demandMw": 15750
          }
        ],
        "issuedAt": "2026-06-23T11:11:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-22",
        "issuedIn": "Daily Report 23-06-2026",
        "targetDay": "2026-06-23",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-23T00:00:00+06:00",
          "end": "2026-06-24T00:00:00+06:00",
          "filedAs": "2026-06-24",
          "sourceFile": "Daily Report 24-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-23T08:00:00+06:00",
          "end": "2026-06-24T08:00:00+06:00",
          "filedAs": "2026-06-24",
          "publishedLabel": "23-24 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (24.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 25-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (25.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              117,
              452,
              1629
            ],
            "mvar": [
              33,
              94,
              414
            ]
          },
          {
            "time": "01:00",
            "mw": [
              113,
              450,
              1582
            ],
            "mvar": [
              33,
              102,
              440
            ]
          },
          {
            "time": "02:00",
            "mw": [
              105,
              430,
              1568
            ],
            "mvar": [
              28,
              102,
              406
            ]
          },
          {
            "time": "03:00",
            "mw": [
              96,
              440,
              1554
            ],
            "mvar": [
              23,
              102,
              368
            ]
          },
          {
            "time": "04:00",
            "mw": [
              118,
              454,
              1538
            ],
            "mvar": [
              34,
              112,
              398
            ]
          },
          {
            "time": "05:00",
            "mw": [
              152,
              524,
              1568
            ],
            "mvar": [
              13,
              112,
              404
            ]
          },
          {
            "time": "06:00",
            "mw": [
              141,
              492,
              1430
            ],
            "mvar": [
              9,
              114,
              438
            ]
          },
          {
            "time": "07:00",
            "mw": [
              147,
              510,
              1500
            ],
            "mvar": [
              22,
              140,
              426
            ]
          },
          {
            "time": "08:00",
            "mw": [
              164,
              540,
              1614
            ],
            "mvar": [
              31,
              152,
              538
            ]
          },
          {
            "time": "09:00",
            "mw": [
              185,
              600,
              1770
            ],
            "mvar": [
              45,
              172,
              570
            ]
          },
          {
            "time": "10:00",
            "mw": [
              199,
              640,
              1744
            ],
            "mvar": [
              57,
              190,
              684
            ]
          },
          {
            "time": "11:00",
            "mw": [
              192,
              620,
              1792
            ],
            "mvar": [
              55,
              190,
              680
            ]
          },
          {
            "time": "12:00",
            "mw": [
              181,
              550,
              1710
            ],
            "mvar": [
              40,
              152,
              612
            ]
          },
          {
            "time": "13:00",
            "mw": [
              154,
              510,
              1732
            ],
            "mvar": [
              24,
              150,
              570
            ]
          },
          {
            "time": "14:00",
            "mw": [
              183,
              610,
              1730
            ],
            "mvar": [
              40,
              182,
              600
            ]
          },
          {
            "time": "15:00",
            "mw": [
              177,
              580,
              1758
            ],
            "mvar": [
              38,
              170,
              572
            ]
          },
          {
            "time": "16:00",
            "mw": [
              172,
              550,
              1738
            ],
            "mvar": [
              40,
              176,
              608
            ]
          },
          {
            "time": "17:00",
            "mw": [
              172,
              560,
              1662
            ],
            "mvar": [
              44,
              176,
              624
            ]
          },
          {
            "time": "18:00",
            "mw": [
              159,
              520,
              1544
            ],
            "mvar": [
              40,
              186,
              620
            ]
          },
          {
            "time": "18:30",
            "mw": [
              166,
              530,
              1666
            ],
            "mvar": [
              40,
              166,
              548
            ]
          },
          {
            "time": "19:00",
            "mw": [
              163,
              550,
              1514
            ],
            "mvar": [
              32,
              160,
              424
            ]
          },
          {
            "time": "19:30",
            "mw": [
              137,
              440,
              1516
            ],
            "mvar": [
              18,
              112,
              404
            ]
          },
          {
            "time": "20:00",
            "mw": [
              137,
              460,
              1562
            ],
            "mvar": [
              10,
              116,
              426
            ]
          },
          {
            "time": "21:00",
            "mw": [
              131,
              420,
              1626
            ],
            "mvar": [
              15,
              96,
              466
            ]
          },
          {
            "time": "22:00",
            "mw": [
              125,
              460,
              1672
            ],
            "mvar": [
              -2,
              116,
              420
            ]
          },
          {
            "time": "23:00",
            "mw": [
              138,
              510,
              1738
            ],
            "mvar": [
              6,
              144,
              462
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 3648218.18
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 3046000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 3054000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 20000000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 20040000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 49788218.18,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 12,426,000 kWh but its circuits are metered at 6,100,000 kWh (2.04x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 17590,
        "maxDemandDayMw": 15590,
        "maxGenEveningMw": 15020,
        "totalEnergyGenMkwh": 347.51781,
        "maxTempC": 35.8,
        "totalLoadShedMw": 2454,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 15750,
            "loadShedMw": 639.85,
            "demandMw": 16420
          },
          {
            "time": "01:00",
            "generationMw": 15660,
            "loadShedMw": 334.25,
            "demandMw": 16010
          },
          {
            "time": "02:00",
            "generationMw": 14660,
            "loadShedMw": 945.45,
            "demandMw": 15650
          },
          {
            "time": "03:00",
            "generationMw": 14350,
            "loadShedMw": 907.25,
            "demandMw": 15300
          },
          {
            "time": "04:00",
            "generationMw": 14240,
            "loadShedMw": 764,
            "demandMw": 15040
          },
          {
            "time": "05:00",
            "generationMw": 14030,
            "loadShedMw": 639.85,
            "demandMw": 14700
          },
          {
            "time": "06:00",
            "generationMw": 13670,
            "loadShedMw": 305.6,
            "demandMw": 13990
          },
          {
            "time": "07:00",
            "generationMw": 13630,
            "loadShedMw": 315.15,
            "demandMw": 13960
          },
          {
            "time": "08:00",
            "generationMw": 13760,
            "loadShedMw": 286.5,
            "demandMw": 14060
          },
          {
            "time": "09:00",
            "generationMw": 13890.94,
            "loadShedMw": 237.8523,
            "demandMw": 14140
          },
          {
            "time": "10:00",
            "generationMw": 14171.03,
            "loadShedMw": 476.51635,
            "demandMw": 14670
          },
          {
            "time": "11:00",
            "generationMw": 14282.74,
            "loadShedMw": 732.7333,
            "demandMw": 15050
          },
          {
            "time": "12:00",
            "generationMw": 14425.74,
            "loadShedMw": 1111.8683,
            "demandMw": 15590
          },
          {
            "time": "13:00",
            "generationMw": 14430.59,
            "loadShedMw": 1317.33655,
            "demandMw": 15810
          },
          {
            "time": "14:00",
            "generationMw": 14373.44,
            "loadShedMw": 1238.2148,
            "demandMw": 15670
          },
          {
            "time": "15:00",
            "generationMw": 14255.54,
            "loadShedMw": 1771.0093,
            "demandMw": 16110
          },
          {
            "time": "16:00",
            "generationMw": 14183.69,
            "loadShedMw": 1352.57605,
            "demandMw": 15600
          },
          {
            "time": "17:00",
            "generationMw": 14057.86,
            "loadShedMw": 1081.1937,
            "demandMw": 15190
          },
          {
            "time": "18:00",
            "generationMw": 14646.28,
            "loadShedMw": 309.1526,
            "demandMw": 14970
          },
          {
            "time": "18:30",
            "generationMw": 14648.6,
            "loadShedMw": 813.087,
            "demandMw": 15500
          },
          {
            "time": "19:00",
            "generationMw": 14956.03,
            "loadShedMw": 1522.24135,
            "demandMw": 16550
          },
          {
            "time": "19:30",
            "generationMw": 14963.03,
            "loadShedMw": 1926.20635,
            "demandMw": 16980
          },
          {
            "time": "20:00",
            "generationMw": 14972.03,
            "loadShedMw": 1793.46135,
            "demandMw": 16850
          },
          {
            "time": "21:00",
            "generationMw": 15020.3,
            "loadShedMw": 2454.0635,
            "demandMw": 17590
          },
          {
            "time": "22:00",
            "generationMw": 15056.3,
            "loadShedMw": 2047.2335,
            "demandMw": 17200
          },
          {
            "time": "23:00",
            "generationMw": 15045.3,
            "loadShedMw": 1771.2385,
            "demandMw": 16900
          }
        ],
        "issuedAt": "2026-06-24T09:26:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 360,
          "Chattogram": 160,
          "Cumilla": 280,
          "Mymensingh": 440,
          "Sylhet": 160,
          "Khulna": 460,
          "Barishal": 144,
          "Rajshahi": 260,
          "Rangpur": 190
        },
        "issuedOn": "2026-06-23",
        "issuedIn": "Daily Report 24-06-2026_",
        "targetDay": "2026-06-24",
        "layout": "scenario",
        "issuedFrom": "source-copy"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-24T00:00:00+06:00",
          "end": "2026-06-25T00:00:00+06:00",
          "filedAs": "2026-06-25",
          "sourceFile": "Daily Report 25-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-24T08:00:00+06:00",
          "end": "2026-06-25T08:00:00+06:00",
          "filedAs": "2026-06-25",
          "publishedLabel": "24-25 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (25.06.26).pdf"
        }
      }
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
      "regionalDemandSource": "p1-published",
      "sourceFiles": {
        "pgcb": "Daily Report 26-06-2026.xlsx",
        "petrobangla": "a627934c-a98a-4f72-bc9a-c9fc4fbd767f.pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              155,
              530,
              1832
            ],
            "mvar": [
              16,
              134,
              460
            ]
          },
          {
            "time": "01:00",
            "mw": [
              136,
              540,
              1798
            ],
            "mvar": [
              9,
              136,
              448
            ]
          },
          {
            "time": "02:00",
            "mw": [
              142,
              490,
              1914
            ],
            "mvar": [
              10,
              132,
              454
            ]
          },
          {
            "time": "03:00",
            "mw": [
              143,
              530,
              1934
            ],
            "mvar": [
              8,
              150,
              432
            ]
          },
          {
            "time": "04:00",
            "mw": [
              141,
              540,
              1938
            ],
            "mvar": [
              6,
              146,
              436
            ]
          },
          {
            "time": "05:00",
            "mw": [
              147,
              540,
              1956
            ],
            "mvar": [
              10,
              134,
              456
            ]
          },
          {
            "time": "06:00",
            "mw": [
              143,
              510,
              1814
            ],
            "mvar": [
              12,
              138,
              432
            ]
          },
          {
            "time": "07:00",
            "mw": [
              148,
              520,
              1754
            ],
            "mvar": [
              16,
              134,
              476
            ]
          },
          {
            "time": "08:00",
            "mw": [
              174,
              570,
              1904
            ],
            "mvar": [
              34,
              152,
              588
            ]
          },
          {
            "time": "09:00",
            "mw": [
              206,
              660,
              1986
            ],
            "mvar": [
              59,
              206,
              730
            ]
          },
          {
            "time": "10:00",
            "mw": [
              194,
              650,
              1868
            ],
            "mvar": [
              52,
              208,
              743
            ]
          },
          {
            "time": "11:00",
            "mw": [
              189,
              620,
              1868
            ],
            "mvar": [
              44,
              184,
              716
            ]
          },
          {
            "time": "12:00",
            "mw": [
              178,
              620,
              1818
            ],
            "mvar": [
              35,
              184,
              686
            ]
          },
          {
            "time": "13:00",
            "mw": [
              195,
              650,
              1892
            ],
            "mvar": [
              43,
              196,
              718
            ]
          },
          {
            "time": "14:00",
            "mw": [
              187,
              630,
              1870
            ],
            "mvar": [
              46,
              190,
              748
            ]
          },
          {
            "time": "15:00",
            "mw": [
              187,
              650,
              1922
            ],
            "mvar": [
              45,
              198,
              750
            ]
          },
          {
            "time": "16:00",
            "mw": [
              189,
              610,
              1940
            ],
            "mvar": [
              54,
              190,
              766
            ]
          },
          {
            "time": "17:00",
            "mw": [
              196,
              560,
              1776
            ],
            "mvar": [
              68,
              180,
              796
            ]
          },
          {
            "time": "18:00",
            "mw": [
              193,
              540,
              1694
            ],
            "mvar": [
              65,
              180,
              788
            ]
          },
          {
            "time": "18:30",
            "mw": [
              185,
              540,
              1728
            ],
            "mvar": [
              53,
              150,
              694
            ]
          },
          {
            "time": "19:00",
            "mw": [
              169,
              520,
              1718
            ],
            "mvar": [
              41,
              148,
              604
            ]
          },
          {
            "time": "19:30",
            "mw": [
              141,
              440,
              1712
            ],
            "mvar": [
              26,
              122,
              552
            ]
          },
          {
            "time": "20:00",
            "mw": [
              142,
              470,
              1902
            ],
            "mvar": [
              22,
              118,
              516
            ]
          },
          {
            "time": "21:00",
            "mw": [
              140,
              470,
              1920
            ],
            "mvar": [
              20,
              128,
              488
            ]
          },
          {
            "time": "22:00",
            "mw": [
              148,
              510,
              1950
            ],
            "mvar": [
              18,
              120,
              486
            ]
          },
          {
            "time": "23:00",
            "mw": [
              155,
              540,
              1994
            ],
            "mvar": [
              25,
              160,
              512
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 3994472.73
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 2908268871.46
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 74036581.79
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 3345000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 3354000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 22690000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 22730000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 2964382344.19,
          "import": 74036581.79
        },
        "checks": [
          {
            "scope": "Ishurdi-Ghorashal",
            "message": "Ishurdi-Ghorashal: the MW curve integrates to 3,991,750 kWh but its circuits are metered at 2,912,263,344 kWh (0.00x). Both are reproduced as published."
          },
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 13,452,500 kWh but its circuits are metered at 6,699,000 kWh (2.01x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 17800,
        "maxDemandDayMw": 15300,
        "maxGenEveningMw": 15700,
        "totalEnergyGenMkwh": 349.13,
        "maxTempC": 34,
        "totalLoadShedMw": 2006,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 14820,
            "loadShedMw": 1970,
            "demandMw": 16790
          },
          {
            "time": "01:00",
            "generationMw": 14440,
            "loadShedMw": 1820,
            "demandMw": 16260
          },
          {
            "time": "02:00",
            "generationMw": 14240,
            "loadShedMw": 1760,
            "demandMw": 16000
          },
          {
            "time": "03:00",
            "generationMw": 14130,
            "loadShedMw": 1430,
            "demandMw": 15560
          },
          {
            "time": "04:00",
            "generationMw": 14170,
            "loadShedMw": 870,
            "demandMw": 15040
          },
          {
            "time": "05:00",
            "generationMw": 14170,
            "loadShedMw": 560,
            "demandMw": 14730
          },
          {
            "time": "06:00",
            "generationMw": 13970,
            "loadShedMw": 480,
            "demandMw": 14450
          },
          {
            "time": "07:00",
            "generationMw": 13900,
            "loadShedMw": 0,
            "demandMw": 13900
          },
          {
            "time": "08:00",
            "generationMw": 13850,
            "loadShedMw": 0,
            "demandMw": 13850
          },
          {
            "time": "09:00",
            "generationMw": 14040,
            "loadShedMw": 76.4,
            "demandMw": 14120
          },
          {
            "time": "10:00",
            "generationMw": 14320,
            "loadShedMw": 229.2,
            "demandMw": 14560
          },
          {
            "time": "11:00",
            "generationMw": 14450,
            "loadShedMw": 382,
            "demandMw": 14850
          },
          {
            "time": "12:00",
            "generationMw": 14600,
            "loadShedMw": 668.5,
            "demandMw": 15300
          },
          {
            "time": "13:00",
            "generationMw": 14600,
            "loadShedMw": 926.35,
            "demandMw": 15570
          },
          {
            "time": "14:00",
            "generationMw": 14520,
            "loadShedMw": 916.8,
            "demandMw": 15480
          },
          {
            "time": "15:00",
            "generationMw": 14410,
            "loadShedMw": 1499.35,
            "demandMw": 15980
          },
          {
            "time": "16:00",
            "generationMw": 14340,
            "loadShedMw": 1117.35,
            "demandMw": 15510
          },
          {
            "time": "17:00",
            "generationMw": 14210,
            "loadShedMw": 897.7,
            "demandMw": 15150
          },
          {
            "time": "18:00",
            "generationMw": 14230,
            "loadShedMw": 725.8,
            "demandMw": 14990
          },
          {
            "time": "18:30",
            "generationMw": 14800,
            "loadShedMw": 668.5,
            "demandMw": 15500
          },
          {
            "time": "19:00",
            "generationMw": 15320,
            "loadShedMw": 1241.5,
            "demandMw": 16620
          },
          {
            "time": "19:30",
            "generationMw": 15180,
            "loadShedMw": 1824.05,
            "demandMw": 17090
          },
          {
            "time": "20:00",
            "generationMw": 15340,
            "loadShedMw": 1604.4,
            "demandMw": 17020
          },
          {
            "time": "21:00",
            "generationMw": 15700,
            "loadShedMw": 2005.5,
            "demandMw": 17800
          },
          {
            "time": "22:00",
            "generationMw": 15760,
            "loadShedMw": 1432.5,
            "demandMw": 17260
          },
          {
            "time": "23:00",
            "generationMw": 15600,
            "loadShedMw": 1604.4,
            "demandMw": 17280
          }
        ],
        "issuedAt": "2026-06-25T08:14:00+06:00",
        "areaLoadShedUnread": true,
        "issuedOn": "2026-06-24",
        "issuedIn": "Daily Report 25-06-2026",
        "targetDay": "2026-06-25",
        "layout": "scenario",
        "issuedFrom": "source-copy"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-25T00:00:00+06:00",
          "end": "2026-06-26T00:00:00+06:00",
          "filedAs": "2026-06-26",
          "sourceFile": "Daily Report 26-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-25T08:00:00+06:00",
          "end": "2026-06-26T08:00:00+06:00",
          "filedAs": "2026-06-26",
          "publishedLabel": "25-26 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (26.06.26).pdf"
        }
      }
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
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 27-06-2026.xlsx",
        "petrobangla": "974ce969-8c1e-4b9c-b9b4-281255abe33e.pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              155,
              560,
              2058
            ],
            "mvar": [
              25,
              148,
              470
            ]
          },
          {
            "time": "01:00",
            "mw": [
              148,
              550,
              2072
            ],
            "mvar": [
              13,
              132,
              468
            ]
          },
          {
            "time": "02:00",
            "mw": [
              142,
              550,
              2072
            ],
            "mvar": [
              21,
              148,
              458
            ]
          },
          {
            "time": "03:00",
            "mw": [
              146,
              540,
              2074
            ],
            "mvar": [
              24,
              124,
              460
            ]
          },
          {
            "time": "04:00",
            "mw": [
              157,
              540,
              2094
            ],
            "mvar": [
              23,
              104,
              462
            ]
          },
          {
            "time": "05:00",
            "mw": [
              171,
              560,
              2124
            ],
            "mvar": [
              36,
              124,
              494
            ]
          },
          {
            "time": "06:00",
            "mw": [
              180,
              550,
              2114
            ],
            "mvar": [
              32,
              116,
              506
            ]
          },
          {
            "time": "07:00",
            "mw": [
              164,
              480,
              1832
            ],
            "mvar": [
              25,
              100,
              486
            ]
          },
          {
            "time": "08:00",
            "mw": [
              174,
              520,
              1722
            ],
            "mvar": [
              28,
              96,
              508
            ]
          },
          {
            "time": "09:00",
            "mw": [
              186,
              530,
              1684
            ],
            "mvar": [
              33,
              100,
              516
            ]
          },
          {
            "time": "10:00",
            "mw": [
              195,
              580,
              1784
            ],
            "mvar": [
              36,
              116,
              536
            ]
          },
          {
            "time": "11:00",
            "mw": [
              207,
              610,
              1792
            ],
            "mvar": [
              36,
              126,
              548
            ]
          },
          {
            "time": "12:00",
            "mw": [
              182,
              560,
              1962
            ],
            "mvar": [
              17,
              108,
              514
            ]
          },
          {
            "time": "13:00",
            "mw": [
              162,
              580,
              1982
            ],
            "mvar": [
              12,
              120,
              492
            ]
          },
          {
            "time": "14:00",
            "mw": [
              164,
              590,
              1852
            ],
            "mvar": [
              15,
              130,
              466
            ]
          },
          {
            "time": "15:00",
            "mw": [
              164,
              600,
              1964
            ],
            "mvar": [
              14,
              126,
              472
            ]
          },
          {
            "time": "16:00",
            "mw": [
              161,
              600,
              1972
            ],
            "mvar": [
              16,
              132,
              454
            ]
          },
          {
            "time": "17:00",
            "mw": [
              166,
              600,
              1886
            ],
            "mvar": [
              22,
              140,
              492
            ]
          },
          {
            "time": "18:00",
            "mw": [
              168,
              582,
              1662
            ],
            "mvar": [
              31,
              128,
              486
            ]
          },
          {
            "time": "18:30",
            "mw": [
              170,
              550,
              1692
            ],
            "mvar": [
              31,
              86,
              486
            ]
          },
          {
            "time": "19:00",
            "mw": [
              153,
              546,
              1842
            ],
            "mvar": [
              17,
              152,
              462
            ]
          },
          {
            "time": "19:30",
            "mw": [
              115,
              450,
              1780
            ],
            "mvar": [
              -18,
              96,
              326
            ]
          },
          {
            "time": "20:00",
            "mw": [
              120,
              450,
              1850
            ],
            "mvar": [
              -3,
              102,
              352
            ]
          },
          {
            "time": "21:00",
            "mw": [
              120,
              480,
              2032
            ],
            "mvar": [
              -9,
              110,
              390
            ]
          },
          {
            "time": "22:00",
            "mw": [
              159,
              580,
              2092
            ],
            "mvar": [
              21,
              148,
              474
            ]
          },
          {
            "time": "23:00",
            "mw": [
              162,
              580,
              2032
            ],
            "mvar": [
              16,
              120,
              390
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 3892436.36
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 3300000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 3311000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 10503436.36,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 13,297,000 kWh but its circuits are metered at 6,611,000 kWh (2.01x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 15800,
        "maxDemandDayMw": 13640,
        "maxGenEveningMw": 15800,
        "totalEnergyGenMkwh": 341.3,
        "maxTempC": 34,
        "totalLoadShedMw": 0,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 15900,
            "loadShedMw": 1974.9999999999995,
            "demandMw": 16500
          },
          {
            "time": "01:00",
            "generationMw": 14229,
            "loadShedMw": 1947.0000000000002,
            "demandMw": 16297.06282722513
          },
          {
            "time": "02:00",
            "generationMw": 14119,
            "loadShedMw": 1694.0000000000007,
            "demandMw": 16157.743455497382
          },
          {
            "time": "03:00",
            "generationMw": 14038,
            "loadShedMw": 1265.0000000000007,
            "demandMw": 15811.821989528797
          },
          {
            "time": "04:00",
            "generationMw": 13992,
            "loadShedMw": 1042.0000000000005,
            "demandMw": 15316.607329842933
          },
          {
            "time": "05:00",
            "generationMw": 13682,
            "loadShedMw": 666.9999999999999,
            "demandMw": 14773.099476439791
          },
          {
            "time": "06:00",
            "generationMw": 12854,
            "loadShedMw": 691.0000000000001,
            "demandMw": 13552.429319371728
          },
          {
            "time": "07:00",
            "generationMw": 12642,
            "loadShedMw": 634.9999999999994,
            "demandMw": 13365.560209424084
          },
          {
            "time": "08:00",
            "generationMw": 12545,
            "loadShedMw": 628,
            "demandMw": 13209.921465968586
          },
          {
            "time": "09:00",
            "generationMw": 12551,
            "loadShedMw": 595.9999999999997,
            "demandMw": 13175.083769633507
          },
          {
            "time": "10:00",
            "generationMw": 12404,
            "loadShedMw": 575,
            "demandMw": 13006.094240837696
          },
          {
            "time": "11:00",
            "generationMw": 13050,
            "loadShedMw": 560,
            "demandMw": 13636.387434554974
          },
          {
            "time": "12:00",
            "generationMw": 13640,
            "loadShedMw": 550,
            "demandMw": 14215.916230366493
          },
          {
            "time": "13:00",
            "generationMw": 14300,
            "loadShedMw": 400,
            "demandMw": 14718.848167539267
          },
          {
            "time": "14:00",
            "generationMw": 13860,
            "loadShedMw": 450,
            "demandMw": 14331.204188481675
          },
          {
            "time": "15:00",
            "generationMw": 13760,
            "loadShedMw": 300,
            "demandMw": 14074.13612565445
          },
          {
            "time": "16:00",
            "generationMw": 13400,
            "loadShedMw": 250,
            "demandMw": 13661.780104712041
          },
          {
            "time": "17:00",
            "generationMw": 12970,
            "loadShedMw": 0,
            "demandMw": 12970
          },
          {
            "time": "18:00",
            "generationMw": 12760,
            "loadShedMw": 0,
            "demandMw": 12760
          },
          {
            "time": "18:30",
            "generationMw": 13300,
            "loadShedMw": 0,
            "demandMw": 13300
          },
          {
            "time": "19:00",
            "generationMw": 14010,
            "loadShedMw": 0,
            "demandMw": 14010
          },
          {
            "time": "19:30",
            "generationMw": 15310,
            "loadShedMw": 0,
            "demandMw": 15310
          },
          {
            "time": "20:00",
            "generationMw": 15240,
            "loadShedMw": 0,
            "demandMw": 15240
          },
          {
            "time": "21:00",
            "generationMw": 15800,
            "loadShedMw": 0,
            "demandMw": 15800
          },
          {
            "time": "22:00",
            "generationMw": 15760,
            "loadShedMw": 0,
            "demandMw": 15760
          },
          {
            "time": "23:00",
            "generationMw": 15840,
            "loadShedMw": 0,
            "demandMw": 15840
          }
        ],
        "issuedAt": "2026-06-26T08:37:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 0,
          "Chattogram": 0,
          "Cumilla": 0,
          "Mymensingh": 0,
          "Sylhet": 0,
          "Khulna": 0,
          "Barishal": 0,
          "Rajshahi": 0,
          "Rangpur": 0
        },
        "issuedOn": "2026-06-25",
        "issuedIn": "Daily Report 26-06-2026_",
        "targetDay": "2026-06-26",
        "layout": "scenario",
        "issuedFrom": "source-copy"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-26T00:00:00+06:00",
          "end": "2026-06-27T00:00:00+06:00",
          "filedAs": "2026-06-27",
          "sourceFile": "Daily Report 27-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-26T08:00:00+06:00",
          "end": "2026-06-27T08:00:00+06:00",
          "filedAs": "2026-06-27",
          "publishedLabel": "26-27 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (27.06.26).pdf"
        }
      }
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
          "gas": 479.3,
          "condensate": 382.9,
          "share": 18.1
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 139.4,
          "condensate": 638.9,
          "share": 5.3
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 84.6,
          "condensate": 25.3,
          "share": 3.2
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 894.8,
          "condensate": 4714.8,
          "share": 33.7
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31,
          "condensate": 90,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1025.7,
          "condensate": 0,
          "share": 38.6
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 265.5,
          "fertilizer": 72.6,
          "others": 1096.1,
          "total": 1434.2
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 203.4,
          "fertilizer": 0,
          "others": 86.3,
          "total": 289.7
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 37.7,
          "fertilizer": 38.2,
          "others": 168.1,
          "total": 243.9
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 221.3,
          "fertilizer": 40,
          "others": 110.9,
          "total": 372.2
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 130.3,
          "fertilizer": 0,
          "others": 28.5,
          "total": 158.8
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 53.9,
          "fertilizer": 0,
          "others": 4.2,
          "total": 58
        }
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 28-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (28.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              162,
              520,
              1946
            ],
            "mvar": [
              16,
              92,
              342
            ]
          },
          {
            "time": "01:00",
            "mw": [
              139,
              510,
              2016
            ],
            "mvar": [
              2,
              90,
              354
            ]
          },
          {
            "time": "02:00",
            "mw": [
              134,
              556,
              2040
            ],
            "mvar": [
              10,
              94,
              358
            ]
          },
          {
            "time": "03:00",
            "mw": [
              134,
              554,
              2048
            ],
            "mvar": [
              14,
              104,
              360
            ]
          },
          {
            "time": "04:00",
            "mw": [
              136,
              558,
              2072
            ],
            "mvar": [
              5,
              88,
              356
            ]
          },
          {
            "time": "05:00",
            "mw": [
              147,
              566,
              2120
            ],
            "mvar": [
              11,
              112,
              400
            ]
          },
          {
            "time": "06:00",
            "mw": [
              158,
              586,
              2120
            ],
            "mvar": [
              18,
              118,
              400
            ]
          },
          {
            "time": "07:00",
            "mw": [
              154,
              596,
              2090
            ],
            "mvar": [
              12,
              124,
              430
            ]
          },
          {
            "time": "08:00",
            "mw": [
              187,
              640,
              2118
            ],
            "mvar": [
              33,
              140,
              578
            ]
          },
          {
            "time": "09:00",
            "mw": [
              218,
              666,
              2088
            ],
            "mvar": [
              56,
              148,
              610
            ]
          },
          {
            "time": "10:00",
            "mw": [
              219,
              712,
              1972
            ],
            "mvar": [
              52,
              164,
              566
            ]
          },
          {
            "time": "11:00",
            "mw": [
              217,
              696,
              1960
            ],
            "mvar": [
              48,
              162,
              544
            ]
          },
          {
            "time": "12:00",
            "mw": [
              197,
              640,
              1970
            ],
            "mvar": [
              39,
              154,
              500
            ]
          },
          {
            "time": "13:00",
            "mw": [
              216,
              688,
              2106
            ],
            "mvar": [
              57,
              164,
              560
            ]
          },
          {
            "time": "14:00",
            "mw": [
              193,
              622,
              1970
            ],
            "mvar": [
              45,
              154,
              528
            ]
          },
          {
            "time": "15:00",
            "mw": [
              202,
              656,
              1934
            ],
            "mvar": [
              56,
              172,
              512
            ]
          },
          {
            "time": "16:00",
            "mw": [
              187,
              620,
              1856
            ],
            "mvar": [
              43,
              150,
              514
            ]
          },
          {
            "time": "17:00",
            "mw": [
              180,
              634,
              1852
            ],
            "mvar": [
              37,
              174,
              496
            ]
          },
          {
            "time": "18:00",
            "mw": [
              176,
              616,
              1780
            ],
            "mvar": [
              36,
              136,
              482
            ]
          },
          {
            "time": "18:30",
            "mw": [
              188,
              630,
              1800
            ],
            "mvar": [
              52,
              180,
              526
            ]
          },
          {
            "time": "19:00",
            "mw": [
              180,
              600,
              1736
            ],
            "mvar": [
              45,
              154,
              516
            ]
          },
          {
            "time": "19:30",
            "mw": [
              162,
              550,
              1690
            ],
            "mvar": [
              35,
              120,
              508
            ]
          },
          {
            "time": "20:00",
            "mw": [
              155,
              500,
              1610
            ],
            "mvar": [
              38,
              108,
              478
            ]
          },
          {
            "time": "21:00",
            "mw": [
              131,
              462,
              1600
            ],
            "mvar": [
              37,
              158,
              472
            ]
          },
          {
            "time": "22:00",
            "mw": [
              131,
              460,
              1470
            ],
            "mvar": [
              33,
              162,
              424
            ]
          },
          {
            "time": "23:00",
            "mw": [
              124,
              434,
              1484
            ],
            "mvar": [
              30,
              156,
              434
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 3525000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 3533000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 22410000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 22450000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 51918000,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 14,060,000 kWh but its circuits are metered at 7,058,000 kWh (1.99x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 18040,
        "maxDemandDayMw": 14200,
        "maxGenEveningMw": 15650,
        "totalEnergyGenMkwh": 343.71,
        "maxTempC": 34,
        "totalLoadShedMw": 2282,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 14780,
            "loadShedMw": 630.3,
            "demandMw": 15440
          },
          {
            "time": "01:00",
            "generationMw": 14220,
            "loadShedMw": 955,
            "demandMw": 15220
          },
          {
            "time": "02:00",
            "generationMw": 14110,
            "loadShedMw": 678.05,
            "demandMw": 14820
          },
          {
            "time": "03:00",
            "generationMw": 14030,
            "loadShedMw": 343.8,
            "demandMw": 14390
          },
          {
            "time": "04:00",
            "generationMw": 13990,
            "loadShedMw": 0,
            "demandMw": 13880
          },
          {
            "time": "05:00",
            "generationMw": 13570,
            "loadShedMw": 0,
            "demandMw": 13570
          },
          {
            "time": "06:00",
            "generationMw": 13270,
            "loadShedMw": 0,
            "demandMw": 13270
          },
          {
            "time": "07:00",
            "generationMw": 13640,
            "loadShedMw": 0,
            "demandMw": 13640
          },
          {
            "time": "08:00",
            "generationMw": 13710,
            "loadShedMw": 85.95,
            "demandMw": 13800
          },
          {
            "time": "09:00",
            "generationMw": 13690,
            "loadShedMw": 0,
            "demandMw": 13690
          },
          {
            "time": "10:00",
            "generationMw": 13360,
            "loadShedMw": 0,
            "demandMw": 13360
          },
          {
            "time": "11:00",
            "generationMw": 13760,
            "loadShedMw": 0,
            "demandMw": 13760
          },
          {
            "time": "12:00",
            "generationMw": 14200,
            "loadShedMw": 0,
            "demandMw": 14200
          },
          {
            "time": "13:00",
            "generationMw": 14340,
            "loadShedMw": 200.55,
            "demandMw": 14550
          },
          {
            "time": "14:00",
            "generationMw": 14330,
            "loadShedMw": 286.5,
            "demandMw": 14630
          },
          {
            "time": "15:00",
            "generationMw": 14240,
            "loadShedMw": 993.2,
            "demandMw": 15280
          },
          {
            "time": "16:00",
            "generationMw": 14230,
            "loadShedMw": 1021.85,
            "demandMw": 15300
          },
          {
            "time": "17:00",
            "generationMw": 14220,
            "loadShedMw": 1184.2,
            "demandMw": 15460
          },
          {
            "time": "18:00",
            "generationMw": 15100,
            "loadShedMw": 95.5,
            "demandMw": 15200
          },
          {
            "time": "18:30",
            "generationMw": 15200,
            "loadShedMw": 573,
            "demandMw": 15800
          },
          {
            "time": "19:00",
            "generationMw": 15230,
            "loadShedMw": 1652.15,
            "demandMw": 16960
          },
          {
            "time": "19:30",
            "generationMw": 15340,
            "loadShedMw": 2091.45,
            "demandMw": 17530
          },
          {
            "time": "20:00",
            "generationMw": 15410,
            "loadShedMw": 1900.45,
            "demandMw": 17400
          },
          {
            "time": "21:00",
            "generationMw": 15650,
            "loadShedMw": 2282.45,
            "demandMw": 18040
          },
          {
            "time": "22:00",
            "generationMw": 15360,
            "loadShedMw": 2120.1,
            "demandMw": 17580
          },
          {
            "time": "23:00",
            "generationMw": 15270,
            "loadShedMw": 2196.5,
            "demandMw": 17570
          }
        ],
        "issuedAt": "2026-06-27T10:11:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 440,
          "Chattogram": 220,
          "Cumilla": 322,
          "Mymensingh": 350,
          "Sylhet": 150,
          "Khulna": 200,
          "Barishal": 50,
          "Rajshahi": 300,
          "Rangpur": 250
        },
        "issuedOn": "2026-06-26",
        "issuedIn": "Daily Report 27-06-2026",
        "targetDay": "2026-06-27",
        "layout": "scenario",
        "issuedFrom": "source-copy"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-27T00:00:00+06:00",
          "end": "2026-06-28T00:00:00+06:00",
          "filedAs": "2026-06-28",
          "sourceFile": "Daily Report 28-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-27T08:00:00+06:00",
          "end": "2026-06-28T08:00:00+06:00",
          "filedAs": "2026-06-28",
          "publishedLabel": "27-28 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (28.06.26).pdf"
        }
      }
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
          "gas": 479.1,
          "condensate": 370.4,
          "share": 17.8
        },
        {
          "company": "SGFL (Sylhet, Rashidpur, Kailashtila)",
          "fields": 5,
          "gas": 139.4,
          "condensate": 648.6,
          "share": 5.2
        },
        {
          "company": "BAPEX (Shahbazpur, Srikail, Begumganj)",
          "fields": 9,
          "gas": 89.9,
          "condensate": 43.9,
          "share": 3.3
        },
        {
          "company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
          "fields": 3,
          "gas": 895.7,
          "condensate": 4816.9,
          "share": 33.3
        },
        {
          "company": "Tullow (Bangora)",
          "fields": 1,
          "gas": 31,
          "condensate": 96,
          "share": 1.2
        },
        {
          "company": "RPGCL (R-LNG Import / LNG Terminal)",
          "fields": 0,
          "gas": 1052.2,
          "condensate": 0,
          "share": 39.2
        }
      ],
      "gasDistributionData": [
        {
          "company": "TGTDCL (Dhaka & Mymensingh)",
          "power": 268.4,
          "fertilizer": 72.9,
          "others": 1074.3,
          "total": 1415.6
        },
        {
          "company": "BGDCL (Cumilla & Sylhet)",
          "power": 205.5,
          "fertilizer": 0,
          "others": 86.4,
          "total": 291.9
        },
        {
          "company": "KGDCL (Chattogram)",
          "power": 38.1,
          "fertilizer": 37.7,
          "others": 168,
          "total": 243.8
        },
        {
          "company": "JGTDSL (Sylhet region)",
          "power": 220.2,
          "fertilizer": 40,
          "others": 111.3,
          "total": 371.5
        },
        {
          "company": "PGCL (Rajshahi & Rangpur)",
          "power": 121.4,
          "fertilizer": 0,
          "others": 28.9,
          "total": 150.3
        },
        {
          "company": "SGCL (Barishal & Khulna)",
          "power": 54,
          "fertilizer": 0,
          "others": 4.6,
          "total": 58.6
        }
      ],
      "sourceFiles": {
        "pgcb": "Daily Report 29-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (29.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              154,
              520,
              1628
            ],
            "mvar": [
              41,
              122,
              544
            ]
          },
          {
            "time": "01:00",
            "mw": [
              140,
              500,
              1614
            ],
            "mvar": [
              33,
              106,
              456
            ]
          },
          {
            "time": "02:00",
            "mw": [
              128,
              480,
              1598
            ],
            "mvar": [
              25,
              120,
              436
            ]
          },
          {
            "time": "03:00",
            "mw": [
              140,
              500,
              1620
            ],
            "mvar": [
              18,
              100,
              416
            ]
          },
          {
            "time": "04:00",
            "mw": [
              148,
              524,
              1626
            ],
            "mvar": [
              20,
              114,
              426
            ]
          },
          {
            "time": "05:00",
            "mw": [
              140,
              512,
              1574
            ],
            "mvar": [
              15,
              122,
              430
            ]
          },
          {
            "time": "06:00",
            "mw": [
              137,
              502,
              1574
            ],
            "mvar": [
              14,
              120,
              412
            ]
          },
          {
            "time": "07:00",
            "mw": [
              140,
              498,
              1574
            ],
            "mvar": [
              11,
              102,
              390
            ]
          },
          {
            "time": "08:00",
            "mw": [
              158,
              556,
              1694
            ],
            "mvar": [
              21,
              144,
              470
            ]
          },
          {
            "time": "09:00",
            "mw": [
              186,
              570,
              1846
            ],
            "mvar": [
              41,
              124,
              526
            ]
          },
          {
            "time": "10:00",
            "mw": [
              199,
              580,
              1950
            ],
            "mvar": [
              50,
              120,
              604
            ]
          },
          {
            "time": "11:00",
            "mw": [
              199,
              652,
              1996
            ],
            "mvar": [
              50,
              188,
              626
            ]
          },
          {
            "time": "12:00",
            "mw": [
              179,
              700,
              1942
            ],
            "mvar": [
              25,
              210,
              578
            ]
          },
          {
            "time": "13:00",
            "mw": [
              187,
              650,
              1930
            ],
            "mvar": [
              34,
              190,
              574
            ]
          },
          {
            "time": "14:00",
            "mw": [
              190,
              634,
              1956
            ],
            "mvar": [
              35,
              190,
              562
            ]
          },
          {
            "time": "15:00",
            "mw": [
              190,
              632,
              1948
            ],
            "mvar": [
              42,
              172,
              604
            ]
          },
          {
            "time": "16:00",
            "mw": [
              187,
              616,
              1932
            ],
            "mvar": [
              45,
              176,
              612
            ]
          },
          {
            "time": "17:00",
            "mw": [
              180,
              594,
              1900
            ],
            "mvar": [
              39,
              172,
              582
            ]
          },
          {
            "time": "18:00",
            "mw": [
              167,
              560,
              1770
            ],
            "mvar": [
              34,
              176,
              600
            ]
          },
          {
            "time": "18:30",
            "mw": [
              171,
              524,
              1770
            ],
            "mvar": [
              44,
              180,
              600
            ]
          },
          {
            "time": "19:00",
            "mw": [
              157,
              500,
              1662
            ],
            "mvar": [
              38,
              174,
              576
            ]
          },
          {
            "time": "19:30",
            "mw": [
              141,
              456,
              1710
            ],
            "mvar": [
              25,
              146,
              548
            ]
          },
          {
            "time": "20:00",
            "mw": [
              141,
              474,
              1714
            ],
            "mvar": [
              21,
              160,
              550
            ]
          },
          {
            "time": "21:00",
            "mw": [
              110,
              420,
              1552
            ],
            "mvar": [
              12,
              170,
              478
            ]
          },
          {
            "time": "22:00",
            "mw": [
              98,
              416,
              1520
            ],
            "mvar": [
              11,
              154,
              470
            ]
          },
          {
            "time": "23:00",
            "mw": [
              114,
              492,
              1566
            ],
            "mvar": [
              16,
              188,
              510
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 1609163.66
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 3265000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 3274000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 21190000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 21240000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 50578163.66,
          "import": 0
        },
        "checks": [
          {
            "scope": "Ishurdi-Ghorashal",
            "message": "Ishurdi-Ghorashal: the MW curve integrates to 3,749,500 kWh but its circuits are metered at 1,609,164 kWh (2.33x). Both are reproduced as published."
          },
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 13,049,500 kWh but its circuits are metered at 6,539,000 kWh (2.00x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 17920,
        "maxDemandDayMw": 16050,
        "maxGenEveningMw": 15650,
        "totalEnergyGenMkwh": 343.71,
        "maxTempC": 36.8,
        "totalLoadShedMw": 2397,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 14780,
            "loadShedMw": 2502.1,
            "demandMw": 17400
          },
          {
            "time": "01:00",
            "generationMw": 14220,
            "loadShedMw": 2530.75,
            "demandMw": 16870
          },
          {
            "time": "02:00",
            "generationMw": 14110,
            "loadShedMw": 2358.85,
            "demandMw": 16580
          },
          {
            "time": "03:00",
            "generationMw": 14030,
            "loadShedMw": 2186.95,
            "demandMw": 16320
          },
          {
            "time": "04:00",
            "generationMw": 13990,
            "loadShedMw": 2062.8,
            "demandMw": 16150
          },
          {
            "time": "05:00",
            "generationMw": 13570,
            "loadShedMw": 2253.8,
            "demandMw": 15930
          },
          {
            "time": "06:00",
            "generationMw": 13270,
            "loadShedMw": 2005.5,
            "demandMw": 15370
          },
          {
            "time": "07:00",
            "generationMw": 13640,
            "loadShedMw": 1575.75,
            "demandMw": 15290
          },
          {
            "time": "08:00",
            "generationMw": 13710,
            "loadShedMw": 1508.9,
            "demandMw": 15290
          },
          {
            "time": "09:00",
            "generationMw": 13690,
            "loadShedMw": 1680.8,
            "demandMw": 15450
          },
          {
            "time": "10:00",
            "generationMw": 13360,
            "loadShedMw": 1948.2,
            "demandMw": 15400
          },
          {
            "time": "11:00",
            "generationMw": 13760,
            "loadShedMw": 1699.9,
            "demandMw": 15540
          },
          {
            "time": "12:00",
            "generationMw": 14200,
            "loadShedMw": 1766.75,
            "demandMw": 16050
          },
          {
            "time": "13:00",
            "generationMw": 14340,
            "loadShedMw": 1719,
            "demandMw": 16140
          },
          {
            "time": "14:00",
            "generationMw": 14330,
            "loadShedMw": 1843.15,
            "demandMw": 16260
          },
          {
            "time": "15:00",
            "generationMw": 14240,
            "loadShedMw": 2177.4,
            "demandMw": 16520
          },
          {
            "time": "16:00",
            "generationMw": 14230,
            "loadShedMw": 2081.9,
            "demandMw": 16410
          },
          {
            "time": "17:00",
            "generationMw": 14220,
            "loadShedMw": 1804.95,
            "demandMw": 16110
          },
          {
            "time": "18:00",
            "generationMw": 15100,
            "loadShedMw": 668.5,
            "demandMw": 15800
          },
          {
            "time": "18:30",
            "generationMw": 15200,
            "loadShedMw": 668.5,
            "demandMw": 15900
          },
          {
            "time": "19:00",
            "generationMw": 15230,
            "loadShedMw": 1976.85,
            "demandMw": 17300
          },
          {
            "time": "19:30",
            "generationMw": 15340,
            "loadShedMw": 2444.8,
            "demandMw": 17900
          },
          {
            "time": "20:00",
            "generationMw": 15410,
            "loadShedMw": 2397.05,
            "demandMw": 17920
          },
          {
            "time": "21:00",
            "generationMw": 15650,
            "loadShedMw": 2053.25,
            "demandMw": 17800
          },
          {
            "time": "22:00",
            "generationMw": 15360,
            "loadShedMw": 2139.2,
            "demandMw": 17600
          },
          {
            "time": "23:00",
            "generationMw": 15270,
            "loadShedMw": 2034.15,
            "demandMw": 17400
          }
        ],
        "issuedAt": "2026-06-28T10:13:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 500,
          "Chattogram": 160,
          "Cumilla": 300,
          "Mymensingh": 377,
          "Sylhet": 180,
          "Khulna": 280,
          "Barishal": 140,
          "Rajshahi": 270,
          "Rangpur": 190
        },
        "issuedOn": "2026-06-27",
        "issuedIn": "Daily Report 28-06-2026",
        "targetDay": "2026-06-28",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-28T00:00:00+06:00",
          "end": "2026-06-29T00:00:00+06:00",
          "filedAs": "2026-06-29",
          "sourceFile": "Daily Report 29-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-28T08:00:00+06:00",
          "end": "2026-06-29T08:00:00+06:00",
          "filedAs": "2026-06-29",
          "publishedLabel": "28-29 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (29.06.26).pdf"
        }
      }
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
          "condensate": 0,
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
      "regionalDemandSource": null,
      "sourceFiles": {
        "pgcb": "Daily Report 30-06-2026.xlsx",
        "petrobangla": "Daily-Gas-Intake-Offtake-Report (30.06.26).pdf"
      },
      "ewicData": {
        "corridors": [
          "Ishurdi-Ghorashal",
          "Sirajganj-Sreepur",
          "Gopalganj-Aminbazar"
        ],
        "rows": [
          {
            "time": "00:00",
            "mw": [
              134,
              496,
              1628
            ],
            "mvar": [
              43,
              99,
              544
            ]
          },
          {
            "time": "01:00",
            "mw": [
              117,
              464,
              1660
            ],
            "mvar": [
              34,
              136,
              452
            ]
          },
          {
            "time": "02:00",
            "mw": [
              121,
              476,
              1690
            ],
            "mvar": [
              33,
              140,
              468
            ]
          },
          {
            "time": "03:00",
            "mw": [
              135,
              520,
              1746
            ],
            "mvar": [
              25,
              160,
              438
            ]
          },
          {
            "time": "04:00",
            "mw": [
              133,
              612,
              1710
            ],
            "mvar": [
              0,
              174,
              400
            ]
          },
          {
            "time": "05:00",
            "mw": [
              138,
              550,
              1772
            ],
            "mvar": [
              -1,
              192,
              400
            ]
          },
          {
            "time": "06:00",
            "mw": [
              141,
              620,
              1806
            ],
            "mvar": [
              -1,
              150,
              388
            ]
          },
          {
            "time": "07:00",
            "mw": [
              145,
              610,
              1782
            ],
            "mvar": [
              -5,
              140,
              372
            ]
          },
          {
            "time": "08:00",
            "mw": [
              162,
              620,
              1854
            ],
            "mvar": [
              16,
              160,
              470
            ]
          },
          {
            "time": "09:00",
            "mw": [
              175,
              646,
              1930
            ],
            "mvar": [
              28,
              182,
              532
            ]
          },
          {
            "time": "10:00",
            "mw": [
              181,
              636,
              1884
            ],
            "mvar": [
              34,
              186,
              604
            ]
          },
          {
            "time": "11:00",
            "mw": [
              177,
              624,
              1698
            ],
            "mvar": [
              37,
              220,
              624
            ]
          },
          {
            "time": "12:00",
            "mw": [
              143,
              548,
              1480
            ],
            "mvar": [
              22,
              220,
              556
            ]
          },
          {
            "time": "13:00",
            "mw": [
              147,
              540,
              1442
            ],
            "mvar": [
              20,
              174,
              514
            ]
          },
          {
            "time": "14:00",
            "mw": [
              157,
              516,
              1506
            ],
            "mvar": [
              22,
              170,
              508
            ]
          },
          {
            "time": "15:00",
            "mw": [
              128,
              524,
              1588
            ],
            "mvar": [
              50,
              196,
              568
            ]
          },
          {
            "time": "16:00",
            "mw": [
              128,
              520,
              1724
            ],
            "mvar": [
              50,
              200,
              578
            ]
          },
          {
            "time": "17:00",
            "mw": [
              124,
              506,
              1608
            ],
            "mvar": [
              52,
              184,
              558
            ]
          },
          {
            "time": "18:00",
            "mw": [
              110,
              470,
              1380
            ],
            "mvar": [
              49,
              190,
              524
            ]
          },
          {
            "time": "18:30",
            "mw": [
              131,
              504,
              1432
            ],
            "mvar": [
              35,
              182,
              490
            ]
          },
          {
            "time": "19:00",
            "mw": [
              155,
              484,
              1565
            ],
            "mvar": [
              35,
              204,
              462
            ]
          },
          {
            "time": "19:30",
            "mw": [
              119,
              452,
              1424
            ],
            "mvar": [
              8,
              180,
              338
            ]
          },
          {
            "time": "20:00",
            "mw": [
              125,
              456,
              1512
            ],
            "mvar": [
              14,
              188,
              378
            ]
          },
          {
            "time": "21:00",
            "mw": [
              126,
              462,
              1516
            ],
            "mvar": [
              20,
              186,
              430
            ]
          },
          {
            "time": "22:00",
            "mw": [
              118,
              460,
              1434
            ],
            "mvar": [
              8,
              180,
              372
            ]
          },
          {
            "time": "23:00",
            "mw": [
              133,
              520,
              1570
            ],
            "mvar": [
              4,
              188,
              370
            ]
          }
        ],
        "circuits": [
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Export",
            "energyKwh": 3327054.54
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Export",
            "energyKwh": 0
          },
          {
            "circuit": "Ishurdi-Ghorashal Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Export",
            "energyKwh": 3244000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Export",
            "energyKwh": 3249000
          },
          {
            "circuit": "Sirajganj-Sreepur Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Export",
            "energyKwh": 19660000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-1",
            "direction": "Import",
            "energyKwh": 0
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Export",
            "energyKwh": 19690000
          },
          {
            "circuit": "Gopalganj-Aminbazar Ckt-2",
            "direction": "Import",
            "energyKwh": 0
          }
        ],
        "totals": {
          "export": 49170054.54,
          "import": 0
        },
        "checks": [
          {
            "scope": "Sirajganj-Sreepur",
            "message": "Sirajganj-Sreepur: the MW curve integrates to 12,896,500 kWh but its circuits are metered at 6,493,000 kWh (1.99x). Both are reproduced as published."
          }
        ]
      },
      "forecast": {
        "maxDemandEveningMw": 17890,
        "maxDemandDayMw": 17130,
        "maxGenEveningMw": 16030,
        "totalEnergyGenMkwh": 352.47,
        "maxTempC": 33,
        "totalLoadShedMw": 1404,
        "hourly": [
          {
            "time": "00:00",
            "generationMw": 15200,
            "loadShedMw": 2460,
            "demandMw": 17660
          },
          {
            "time": "01:00",
            "generationMw": 15000,
            "loadShedMw": 2760,
            "demandMw": 17760
          },
          {
            "time": "02:00",
            "generationMw": 14800,
            "loadShedMw": 2830,
            "demandMw": 17630
          },
          {
            "time": "03:00",
            "generationMw": 14500,
            "loadShedMw": 2590,
            "demandMw": 17090
          },
          {
            "time": "04:00",
            "generationMw": 14200,
            "loadShedMw": 1270,
            "demandMw": 15470
          },
          {
            "time": "05:00",
            "generationMw": 14100,
            "loadShedMw": 1240,
            "demandMw": 15340
          },
          {
            "time": "06:00",
            "generationMw": 13920,
            "loadShedMw": 1060,
            "demandMw": 14980
          },
          {
            "time": "07:00",
            "generationMw": 14000,
            "loadShedMw": 640,
            "demandMw": 14640
          },
          {
            "time": "08:00",
            "generationMw": 14100,
            "loadShedMw": 760,
            "demandMw": 14860
          },
          {
            "time": "09:00",
            "generationMw": 14190,
            "loadShedMw": 2110.55,
            "demandMw": 16400
          },
          {
            "time": "10:00",
            "generationMw": 14480,
            "loadShedMw": 2377.95,
            "demandMw": 16970
          },
          {
            "time": "11:00",
            "generationMw": 14150,
            "loadShedMw": 1910,
            "demandMw": 16150
          },
          {
            "time": "12:00",
            "generationMw": 14390,
            "loadShedMw": 2616.7,
            "demandMw": 17130
          },
          {
            "time": "13:00",
            "generationMw": 14450,
            "loadShedMw": 2339.75,
            "demandMw": 16900
          },
          {
            "time": "14:00",
            "generationMw": 14640,
            "loadShedMw": 2349.3,
            "demandMw": 17100
          },
          {
            "time": "15:00",
            "generationMw": 14570,
            "loadShedMw": 2884.1,
            "demandMw": 17590
          },
          {
            "time": "16:00",
            "generationMw": 14410,
            "loadShedMw": 2521.2,
            "demandMw": 17050
          },
          {
            "time": "17:00",
            "generationMw": 14360,
            "loadShedMw": 2377.95,
            "demandMw": 16850
          },
          {
            "time": "18:00",
            "generationMw": 14270,
            "loadShedMw": 1986.4,
            "demandMw": 16350
          },
          {
            "time": "18:30",
            "generationMw": 14750,
            "loadShedMw": 2339.75,
            "demandMw": 17200
          },
          {
            "time": "19:00",
            "generationMw": 15600,
            "loadShedMw": 1976.85,
            "demandMw": 17670
          },
          {
            "time": "19:30",
            "generationMw": 15770,
            "loadShedMw": 2024.6,
            "demandMw": 17890
          },
          {
            "time": "20:00",
            "generationMw": 15660,
            "loadShedMw": 1976.85,
            "demandMw": 17730
          },
          {
            "time": "21:00",
            "generationMw": 16030,
            "loadShedMw": 1403.85,
            "demandMw": 17500
          },
          {
            "time": "22:00",
            "generationMw": 15850,
            "loadShedMw": 1480.25,
            "demandMw": 17400
          },
          {
            "time": "23:00",
            "generationMw": 15600,
            "loadShedMw": 1528,
            "demandMw": 17200
          }
        ],
        "issuedAt": "2026-06-29T08:32:00+06:00",
        "areaLoadShedMw": {
          "Dhaka": 244,
          "Chattogram": 76,
          "Cumilla": 163,
          "Mymensingh": 266,
          "Sylhet": 134,
          "Khulna": 189,
          "Barishal": 84,
          "Rajshahi": 183,
          "Rangpur": 65
        },
        "issuedOn": "2026-06-28",
        "issuedIn": "Daily Report 29-06-2026",
        "targetDay": "2026-06-29",
        "layout": "scenario",
        "issuedFrom": "erp-mirror"
      },
      "observationWindows": {
        "timezone": "+06:00",
        "pgcb": {
          "unit": "energy day",
          "start": "2026-06-29T00:00:00+06:00",
          "end": "2026-06-30T00:00:00+06:00",
          "filedAs": "2026-06-30",
          "sourceFile": "Daily Report 30-06-2026.xlsx"
        },
        "petrobangla": {
          "unit": "gas day",
          "start": "2026-06-29T08:00:00+06:00",
          "end": "2026-06-30T08:00:00+06:00",
          "filedAs": "2026-06-30",
          "publishedLabel": "29-30 Jun, 2026",
          "period": "8.00 to 8.00",
          "sourceFile": "Daily-Gas-Intake-Offtake-Report (30.06.26).pdf"
        }
      }
    }
};

export function getArchiveFallback(isoDate: string): GridDailyData | null {
  return powerGridArchive[isoDate] ?? null;
}
