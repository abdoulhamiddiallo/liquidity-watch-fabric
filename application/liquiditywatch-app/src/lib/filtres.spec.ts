import { describe, expect, it } from "vitest";
import { appliquerFiltres, expressionsFiltres } from "./filtres";

const SESSION = "Session 2 · 16/11 18:10 à 18:54 · test de stress";
const DAX_SC = "EVALUATE SUMMARIZECOLUMNS('Temps'[Heure], /*FILTRES,*/ \"LSI\", [LSI maximal])";
const DAX_CT = "EVALUATE CALCULATETABLE(ROW(\"A\", [LSI maximal]) /*,FILTRES*/)";

describe("filtres de la salle de veille", () => {
    it("laisse la requête intacte sans filtre", () => {
        expect(appliquerFiltres(DAX_SC, {})).toBe(DAX_SC);
    });

    it("insère la session dans SUMMARIZECOLUMNS", () => {
        expect(appliquerFiltres(DAX_SC, { session: SESSION })).toContain(
            `TREATAS({"${SESSION}"}, 'Temps'[Session]), "LSI"`,
        );
    });

    it("insère session et marché à la fin de CALCULATETABLE", () => {
        const dax = appliquerFiltres(DAX_CT, { session: SESSION, marche: "SOL-USD" });
        expect(dax).toContain(`, TREATAS({"${SESSION}"}, 'Temps'[Session]), TREATAS({"SOL-USD"}, 'Marché'[Marché]))`);
    });

    it("échappe les guillemets", () => {
        expect(expressionsFiltres({ marche: 'A"B' })[0]).toBe(`TREATAS({"A""B"}, 'Marché'[Marché])`);
    });

    it("refuse une requête sans jeton quand un filtre est actif", () => {
        expect(() => appliquerFiltres("EVALUATE ROW(\"A\", 1)", { session: SESSION })).toThrow();
    });
});
