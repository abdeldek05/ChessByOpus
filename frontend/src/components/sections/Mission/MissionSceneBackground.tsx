import backdrop from '/mission-backdrop.jpg'

/**
 * Fond « écran d'accueil » : une image figée de la scène de lancement (Mesange
 * dressée + radar posé), floutée et assombrie pour laisser le formulaire
 * lisible par-dessus. Purement décoratif — une simple image, aucune scène 3D
 * ni boucle de rendu (aucun coût GPU pendant qu'on règle les cadrans).
 */
export function MissionSceneBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <img
        src={backdrop}
        alt=""
        className="h-full w-full scale-110 object-cover blur-[14px]"
      />
      <div className="absolute inset-0 bg-bg/45" />
    </div>
  )
}
