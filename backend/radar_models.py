from pydantic import BaseModel


class RadarSpec(BaseModel):

    model: str
    rangeKm: float
    minRcsM2: float
    ceilingM: float
    rotating: bool = True
    rotationRpm: float
    antennaHeightM: float
    maxElevationDeg: float


# Valeurs publiques constructeur ; minRcsM2=2.0 (cible type chasseur) est NOTRE
# hypothèse de référence, et ceilingM/antennaHeightM restent à confirmer.
PRESETS: dict[str, RadarSpec] = {
    "GM400": RadarSpec(
        model="GM400",
        rangeKm=470.0,
        minRcsM2=2.0,
        ceilingM=30500.0,
        rotationRpm=10.0,
        antennaHeightM=8.0,
        maxElevationDeg=40.0,
    ),
    "GF300": RadarSpec(
        model="GF300",
        rangeKm=400.0,
        minRcsM2=2.0,
        ceilingM=25000.0,
        rotationRpm=60.0,
        antennaHeightM=4.0,
        maxElevationDeg=90.0,
    ),
}


def resolve_radar(model: str, overrides: dict | None = None) -> dict:
    """Fiche complète d'un radar : les défauts du preset, écrasés champ par champ
    par les réglages utilisateur non vides, puis revalidés par Pydantic."""
    merged = PRESETS[model].model_dump()
    for key, value in (overrides or {}).items():
        if value is not None:
            merged[key] = value
    return RadarSpec(**merged).model_dump()


# Les champs "matériel" qu'un preset fournit et qu'un utilisateur peut écraser —
# par opposition aux champs de mission (position, seuil de préavis, id/nom).
HARDWARE_FIELDS = (
    "rangeKm", "ceilingM", "rotating", "rotationRpm",
    "antennaHeightM", "minRcsM2", "maxElevationDeg",
)


def radar_for_engine(data: dict) -> dict:
    """Prépare un radar du payload API pour compute_detection.

    Deux formats cohabitent (strangler pattern, le temps de migrer le front) :
    - NOUVEAU : {"model": "GM400", ...overrides...} → fiche du preset fusionnée
      avec les réglages utilisateur non vides, revalidée.
    - ANCIEN : pas de "model" → les champs passent tels quels ; les None sont
      retirés pour que le moteur retombe sur ses propres défauts (.get).
    Les champs de mission (id, name, latitude, longitude, seuil) traversent
    inchangés dans les deux cas.
    """
    model = data.get("model")
    cleaned = {k: v for k, v in data.items() if v is not None and k != "model"}
    if not model:
        return cleaned
    overrides = {k: data.get(k) for k in HARDWARE_FIELDS}
    resolved = resolve_radar(model, overrides)
    return {**cleaned, **resolved}
