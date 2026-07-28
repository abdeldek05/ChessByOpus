interface AdminStatProps {
  label: string
  value: string
  /** Passe la valeur en rouge d'alerte (échecs, panne). */
  alert?: boolean
}

/**
 * Chiffre clé : label discret au-dessus, grande valeur en display en dessous —
 * même registre que les tuiles de la référence (gros nombre blanc, label fin).
 */
export function AdminStat({ label, value, alert = false }: AdminStatProps) {
  return (
    <div>
      <p className="type-label-tight text-ink-faint">{label}</p>
      <p className={`mt-2 font-display text-readout-lg font-semibold ${alert ? 'text-alert' : 'text-ink'}`}>
        {value}
      </p>
    </div>
  )
}
