import { radarTemplates } from '@/data/radarTemplates'

/**
 * Nom lisible d'un radar depuis son id de template. En repli (id d'un radar
 * retiré/renommé, ex. données d'historique anciennes), on présente le slug
 * proprement plutôt que brut : "giraffe-1x" → "GIRAFFE 1X".
 */
export function getRadarName(templateId: string): string {
  const template = radarTemplates.find((radar) => radar.id === templateId)
  if (template) return template.name
  return templateId.replace(/-/g, ' ').toUpperCase()
}
