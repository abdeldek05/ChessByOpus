// Portée max théorique de la Mesange V2, toutes directions de tir confondues
// (élévation optimale ~81°, vent nul — le vrai tir annule le vent pour suivre
// l'azimut exact, voir backend/simulate.py::_zero_wind). Constante PHYSIQUE
// fixe : ne dépend ni du site ni de la météo, contrairement à l'ancien calcul
// en direct via /simulate/max-range-quick (~17s, plusieurs vols RocketPy
// successifs) — trop lent pour un usage interactif à chaque arrivée sur la
// carte de placement. Mesurée ~46,3 km à 81°, arrondie avec une légère marge
// pour ne jamais sous-estimer la vraie portée physique.
export const ROCKET_MAX_RANGE_KM = 47
