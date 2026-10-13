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
