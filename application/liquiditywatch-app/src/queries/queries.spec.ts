import { describe, expect, it } from "vitest";
import { lireJetonsCouleur } from "@/lib/jetons-couleur";
import { jetonsRestants } from "@/lib/jetons-spec";
import {
    anomaliesQuery, apportsQuery, carteChaleurQuery, ciseauQuery, ecartMinuteQuery, estrQuery, fourchetteMinuteQuery,
    grilleCarnetsQuery, kpiStablesQuery, kpiVeilleQuery, latenceQuery, lsiMinuteQuery, niveauxQuery, vixQuery,
} from "@/queries";

const SESSION = "Session 2 · 16/11 18:10 à 18:54 · test de stress";
const jetons = lireJetonsCouleur((nom) => `#${nom.length.toString(16).padStart(6, "0")}`);

describe("fabriques de requêtes", () => {
    it("filtrent chaque requête de session", () => {
        for (const def of [kpiVeilleQuery({ session: SESSION }), kpiStablesQuery({ session: SESSION }), anomaliesQuery({ session: SESSION })]) {
            expect(def.query).toContain(`TREATAS({"${SESSION}"}, 'Temps'[Session])`);
            expect(def.connection).toBe("liquidite");
        }
    });

    it("ajoutent le filtre de marché quand il est choisi", () => {
        expect(apportsQuery({ session: SESSION, marche: "SOL-USD" }, jetons).query).toContain(`TREATAS({"SOL-USD"}, 'Marché'[Marché])`);
    });

    it("résolvent tous les jetons de couleur des specs", () => {
        const visuels = [
            lsiMinuteQuery({}, jetons), carteChaleurQuery({}, jetons), niveauxQuery({}, jetons), apportsQuery({}, jetons),
            ciseauQuery({}, jetons), latenceQuery({}, jetons), grilleCarnetsQuery({}, jetons), fourchetteMinuteQuery({}, jetons),
            ecartMinuteQuery({}, jetons), vixQuery(jetons), estrQuery(jetons),
        ];
        for (const v of visuels) expect(jetonsRestants(v.vegaLiteSpec)).toEqual([]);
    });

    it("donnent un alias sans crochet à chaque colonne", () => {
        for (const v of [lsiMinuteQuery({}, jetons), anomaliesQuery({})]) {
            for (const meta of Object.values(v.columnMetadata)) expect(meta.name).toMatch(/^[A-Za-z]+$/);
        }
    });

    it("donnent aux marchés l'échelle de couleur du thème", () => {
        const spec = lsiMinuteQuery({}, jetons).vegaLiteSpec as unknown as { layer: { encoding?: { color?: { scale?: { domain: string[] } } } }[] };
        const ligne = spec.layer[spec.layer.length - 1];
        expect(ligne.encoding?.color?.scale?.domain).toEqual(["BTC-USD", "ETH-USD", "SOL-USD"]);
    });
});
