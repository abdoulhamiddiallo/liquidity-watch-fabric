import { describe, expect, it } from "vitest";
import { construireRejeu, estAggravation, libelleMinute, phraseBascule, valeurA } from "@/lib/rejeu";

const points = [
    { heure: "2026-11-16T18:18:00", marche: "SOL-USD", lsi: 1.4 },
    { heure: "2026-11-16T18:18:00", marche: "BTC-USD", lsi: 0.2 },
    { heure: "2026-11-16T18:19:00", marche: "SOL-USD", lsi: 5.98 },
    { heure: "2026-11-16T18:19:00", marche: "BTC-USD", lsi: 0.39 },
    { heure: "2026-11-16T18:20:00", marche: "SOL-USD", lsi: 2.4 },
    { heure: "2026-11-16T18:17:00", marche: "SOL-USD", lsi: 0.3 },
];

describe("rejeu de session", () => {
    it("lit l'heure HH:MM d'un texte ISO", () => {
        expect(libelleMinute("2026-11-16T18:19:00")).toBe("18:19");
        expect(libelleMinute(null)).toBeNull();
    });

    it("ordonne les minutes et calcule le maximum par minute", () => {
        const s = construireRejeu(points);
        expect(s.minutes).toEqual(["18:17", "18:18", "18:19", "18:20"]);
        expect(s.marches).toEqual(["BTC-USD", "SOL-USD"]);
        expect(s.maximum).toEqual([0.3, 1.4, 5.98, 2.4]);
        expect(s.valeurs["BTC-USD"]).toEqual([null, 0.2, 0.39, null]);
    });

    it("garde la dernière valeur connue d'un marché", () => {
        const s = construireRejeu(points);
        expect(valeurA(s, "BTC-USD", 3)).toBe(0.39);
        expect(valeurA(s, "BTC-USD", 0)).toBeNull();
    });

    it("consigne chaque bascule de niveau dans l'ordre", () => {
        const s = construireRejeu(points);
        expect(s.bascules.map((b) => [b.minute, b.de, b.a])).toEqual([
            ["18:18", "calme", "tendu"],
            ["18:19", "tendu", "detresse"],
            ["18:20", "detresse", "stress"],
        ]);
        expect(estAggravation(s.bascules[1])).toBe(true);
        expect(phraseBascule(s.bascules[2])).toBe("SOL-USD redescend de Détresse à Stress");
    });

    it("ignore les lignes incomplètes", () => {
        expect(construireRejeu([{ heure: null, marche: "BTC-USD", lsi: 1 }, { heure: "2026-11-16T18:00:00", marche: "BTC-USD", lsi: "x" }]).minutes).toEqual([]);
    });
});
