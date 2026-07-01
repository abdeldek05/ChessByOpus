import { radarTemplates } from '@/data/radarTemplates'

export function getRadarName(templateId: string): string {
  return radarTemplates.find((template) => template.id === templateId)?.name ?? templateId
}
