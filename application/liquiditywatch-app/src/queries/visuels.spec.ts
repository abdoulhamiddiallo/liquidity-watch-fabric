import { readFileSync } from "node:fs";
import { resolve } from "node:path";
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { renderVisualToSvg } from "@microsoft/fabric-visuals/headless";
import type { DataTable } from "@microsoft/fabric-visuals-core";
import { lireJetonsCouleur } from "@/lib/jetons-couleur";
import { toDataTable } from "@/lib/to-data-table";
import {
    apportsQuery, carteChaleurQuery, ciseauQuery, ecartMinuteQuery, estrQuery, fourchetteMinuteQuery, grilleCarnetsQuery,
    latenceQuery, lsiMinuteQuery, niveauxQuery, vixQuery, type DefinitionVisuel,
} from "@/queries";

// Valeurs relevées dans SM_LiquidityWatch (session du test de stress du 16/11/2026), sur quelques minutes.
const css = readFileSync(resolve(__dirname, "../global.css"), "utf8");
const blocSombre = css.slice(css.indexOf(".dark"));
const variables = new Map<string, string>();
for (const bloc of [css, blocSombre]) {
    for (const m of bloc.matchAll(/(--color-[a-z0-9-]+)\s*:\s*([^;]+);/g)) variables.set(m[1], m[2].trim());
}
const jetons = lireJetonsCouleur((nom) => variables.get(nom) ?? "#5b8cff");
const minutes = ["2026-11-16T18:14:00", "2026-11-16T18:17:00", "2026-11-16T18:19:00", "2026-11-16T18:23:00", "2026-11-16T18:30:00"];
const lsiSol = [0.8, 5.93, 5.98, 5.12, 0.02];

function table(def: DefinitionVisuel, colonnes: string[], lignes: unknown[][]): DataTable {
    return toDataTable({ columns: colonnes.map((name) => ({ name })), rows: lignes } as never, def.columnMetadata);
}

async function rendre(def: DefinitionVisuel, data: DataTable) {
    const resultat = await renderVisualToSvg(process.env.APERCU ? ({ ...def.vegaLiteSpec, width: 820, height: 360 } as typeof def.vegaLiteSpec) : def.vegaLiteSpec, { data });
    if (process.env.APERCU) (await import("node:fs")).writeFileSync(`/tmp/apercu-${(def.vegaLiteSpec as { description?: string }).description?.slice(0, 24).replace(/[^a-z]/gi, "_")}.svg`, resultat.svg);
    const erreurs = resultat.diagnostics.filter((d) => d.severity === "error");
    return { erreurs, marques: resultat.renderedDataMarkCount };
}

const CAS: [string, () => [DefinitionVisuel, DataTable]][] = [
    ["LSI minute par minute", () => {
        const d = lsiMinuteQuery({}, jetons);
        return [d, table(d, ["Temps[Heure]", "Marché[Marché]", "[LSI]"], minutes.flatMap((m, i) => [[m, "SOL-USD", lsiSol[i]], [m, "BTC-USD", -0.2]]))];
    }],
    ["carte de chaleur", () => {
        const d = carteChaleurQuery({}, jetons);
        return [d, table(d, ["Marché[Ordre]", "Marché[Marché]", "Temps[Tranche de 5 min]", "[LSI]"], [[3, "SOL-USD", "2026-11-16T18:10:00", 1.26], [3, "SOL-USD", "2026-11-16T18:15:00", 5.98], [1, "BTC-USD", "2026-11-16T18:15:00", 0.39]])];
    }],
    ["niveaux", () => {
        const d = niveauxQuery({}, jetons);
        return [d, table(d, ["LSI[Niveau]", "[Minutes]"], [["1 · Calme", 124], ["2 · Tendu", 1], ["4 · Détresse", 10]])];
    }],
    ["apports", () => {
        const d = apportsQuery({}, jetons);
        return [d, table(d, ["Temps[Heure]", "[Fourchette]", "[Profondeur]", "[Dislocation]", "[Volatilite]"], minutes.map((m, i) => [m, lsiSol[i] * 0.6, 0.3, 0.4, 0.1]))];
    }],
    ["ciseau", () => {
        const d = ciseauQuery({}, jetons);
        return [d, table(d, ["Temps[Heure]", "[Fourchette]", "[Profondeur]"], minutes.map((m, i) => [m, 0.6 + lsiSol[i], 12 - lsiSol[i]]))];
    }],
    ["latence", () => {
        const d = latenceQuery({}, jetons);
        return [d, table(d, ["Plateforme[Ordre]", "Plateforme[Plateforme]", "[Latence]", "[Carnets]"], [[2, "Kraken", 43, 2700], [3, "Coinbase", 83, 2160], [1, "Binance", 242, 1620]])];
    }],
    ["grille des carnets", () => {
        const d = grilleCarnetsQuery({}, jetons);
        return [d, table(d, ["Marché[Ordre]", "Marché[Marché]", "Plateforme[Plateforme]", "[Fourchette]", "[Profondeur]"], [[3, "SOL-USD", "Binance", 7.76, 0.36], [1, "BTC-USD", "Kraken", 0.05, 2.19], [5, "USDC-USD", "Kraken", 1.0, 21.4]])];
    }],
    ["fourchette par plateforme", () => {
        const d = fourchetteMinuteQuery({}, jetons);
        return [d, table(d, ["Temps[Heure]", "Plateforme[Plateforme]", "[Fourchette]"], minutes.flatMap((m, i) => [[m, "Binance", 1 + lsiSol[i] * 2.5], [m, "Kraken", 0.6]]))];
    }],
    ["écart au dollar", () => {
        const d = ecartMinuteQuery({}, jetons);
        return [d, table(d, ["Temps[Heure]", "Carnets[Série]", "[Ecart]"], minutes.flatMap((m, i) => [[m, "USDT · Kraken", -10 - lsiSol[i] * 12.5], [m, "USDC · Kraken", -2.5]]))];
    }],
    ["VIX", () => {
        const d = vixQuery(jetons);
        return [d, table(d, ["VIX[Date]", "[VIX]"], [["2025-04-08T00:00:00", 52.33], ["2026-11-12T00:00:00", 18.7], ["2026-11-13T00:00:00", 19.3]])];
    }],
    ["€STR", () => {
        const d = estrQuery(jetons);
        return [d, table(d, ["Taux €STR[Date]", "[ESTR]"], [["2024-01-02T00:00:00", 3.9], ["2025-06-11T00:00:00", 1.92], ["2026-11-13T00:00:00", 2.437]])];
    }],
];

describe("rendu des visuels", () => {
    it.each(CAS)("%s se dessine sans erreur", async (_, fabrique) => {
        const [def, data] = fabrique();
        const { erreurs, marques } = await rendre(def, data);
        expect(erreurs).toEqual([]);
        expect(marques).toBeGreaterThan(0);
    }, 30000);
});
