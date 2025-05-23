# Instruccions per Codex

Aquest fitxer defineix les directrius per qualsevol IA que modifiqui aquest repositori.

## Estil i Estructura
- Tota nova funcionalitat s'ha d'implementar utilitzant **TypeScript** i **React (Next.js 14)**.
- Col·loca el codi dins de la carpeta `src/` seguint l'estructura actual:
  - `src/app` per pàgines de Next.js
  - `src/components` per components reutilitzables
  - `src/lib` per utilitats compartides
- Mantén els estils amb **Tailwind CSS** i segueix els patrons que ja existeixen als components.

## Workflow de Desenvolupament
- Abans de fer un commit s'ha d'executar `npm run lint` per comprovar que no hi ha errors d'estil. Inclou la sortida d'aquest comandament a la secció *Testing* del missatge final.
- Si hi ha tests en el futur, s'han d'executar amb `npm run test`.
- Utilitza missatges de commit curts en català descrivint breument el canvi.

Aquesta guia és d'aplicació a tot el repositori.
