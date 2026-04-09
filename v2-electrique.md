# MonGarage v2 - Support vehicules electriques

## Contexte
Ajouter le suivi complet des vehicules electriques (et hybrides rechargeables) en complement du suivi thermique existant.

## Suivi energie (remplace carburant)
- kWh/100km au lieu de L/100km
- Historique de charge : date, kWh charges, % depart/arrivee, type (AC lent / AC rapide / DC), station/borne, cout
- Calcul conso reelle entre charges completes (equivalent full-to-full)
- Prix par kWh (domicile vs borne publique vs travail)
- Estimation autonomie restante basee sur conso moyenne

## Suivi batterie
- SoH (State of Health) % - suivi degradation dans le temps
- Capacite nominale vs capacite reelle
- Graphe d'evolution du SoH
- Alerte si degradation anormale (ex: > 5%/an)

## Entretien specifique EV
- Operations a conserver : pneus (usure plus rapide, poids EV), liquide de frein, filtre habitacle, essuie-glaces, amortisseurs
- Operations a supprimer quand type = electrique : vidange, filtre a huile, courroie distribution, bougies, courroie accessoires, AdBlue
- Operations specifiques EV : liquide caloporteur batterie, verification connecteur de charge, mise a jour firmware

## Hybride rechargeable (PHEV)
- Cumul des deux : suivi carburant + suivi charge
- Ratio km electrique / km thermique
- Conso combinee

## Adaptation UI
- Le champ "Type carburant" existe deja (diesel, essence, e85, hybride, electrique)
- Quand type = electrique : masquer section carburant, afficher section energie
- Quand type = hybride : afficher les deux
- Adapter le programme d'entretien constructeur selon le type
- Adapter les stats et graphes (kWh au lieu de L, EUR/kWh au lieu de EUR/L)

## Donnees de reference
- Prix moyens kWh a integrer (equivalent prix diesel INSEE) : [A COMPLETER]
- Programmes entretien constructeur EV courants (Tesla, Renault, Peugeot) : [A COMPLETER]

## Priorite
v2 - apres stabilisation de la v1 actuelle
