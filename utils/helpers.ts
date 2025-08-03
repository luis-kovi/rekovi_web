// utils/helpers.ts
export function calcularSLA(dataCriacaoStr?: string): number {
  if (!dataCriacaoStr) return 0;
  const dataCriacao = new Date(dataCriacaoStr);
  if (isNaN(dataCriacao.getTime())) return 0;

  const agora = new Date();
  const diffEmMs = agora.getTime() - dataCriacao.getTime();
  const diffEmDias = Math.floor(diffEmMs / (1000 * 60 * 60 * 24));

  return diffEmDias;
}