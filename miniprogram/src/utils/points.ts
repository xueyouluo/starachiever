export const formatSignedPoints = (points: number): string => {
  if (points > 0) return `+${points}`
  return `${points}`
}
