# MonGarage v2 - Support vehicules electriques

**Statut : TERMINE - deploye 2026-04-09**

## Implemente
- Suivi charges EV : date, km, kWh, cout, SoC depart/arrivee, station, type AC/DC, plein
- Calcul conso kWh/100km (equivalent full-to-full)
- Suivi batterie : SoH %, capacite nominale, graphe degradation SVG, releves historiques
- Alertes degradation (> 5%/an = danger, > 3%/an = warning) et SoH bas (< 70% critique, < 80% warning)
- Section Energie dediee (remplace Carburant pour EV, les deux pour hybride)
- Navigation adaptative : icone/label dynamiques selon type vehicule
- Helpers type vehicule : isElectric(), isHybrid(), isThermal(), hasElectric(), hasThermal()
- Quick actions contextuelles (+ Charge pour EV, + Plein et + Charge pour hybride)
- Programme entretien IA adapte au type (operations EV/hybride/thermique)
- Graphes adaptes : conso kWh/100km, prix EUR/kWh
- Stats combinees pour hybrides (cout carburant + electricite)
- Comparaison multi-vehicules avec types mixtes
- Estimation prochaine charge (date + km)
