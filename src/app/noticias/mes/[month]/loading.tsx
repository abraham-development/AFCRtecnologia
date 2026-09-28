/**
 * La pagina de mes es dinamica (Supabase) y Next no la precarga. Con este
 * limite de carga la navegacion responde al instante y la lista llega despues.
 */
export default function NewsMonthLoading() {
  return <div aria-hidden="true" className="shell min-h-[100svh] pt-40 md:pt-48" />;
}
