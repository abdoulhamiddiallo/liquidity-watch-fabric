import { describe, expect, it } from "vitest";
import { decouperParSession, evaluerSeuil, reglageConseille, seuilSeparateur } from "@/lib/etalonnage";

const M: Record<string, string> = { B: "BTC-USD", E: "ETH-USD", S: "SOL-USD" };
const lire = (texte: string) =>
    texte.split(";").map((x) => {
        const [h, m, v] = x.split("|");
        return { heure: `2026-11-16T${h}:00`, marche: M[m], lsi: Number(v) };
    });

// Extraits réels : début du marché réel (session 1) et cœur du test de stress (session 2).
const reel = lire("15:34|B|4.11;15:34|E|3.92;15:35|B|4.33;15:35|E|2.39;15:36|B|2.56;15:37|B|5.07;15:38|B|3.68;15:39|B|1.42;15:40|B|1.00;15:41|B|2.01;15:42|B|1.46");
const test = lire("18:13|S|-0.35;18:14|S|0.12;18:15|S|3.56;18:16|S|4.83;18:17|S|5.93;18:18|S|5.87;18:19|S|5.98;18:20|S|5.87;18:25|S|-0.37");
const [calme, crise] = decouperParSession([...reel, ...test], [
    { cle: "réel", debut: "2026-11-16T15:34:00", fin: "2026-11-16T16:08:00" },
    { cle: "test", debut: "2026-11-16T18:10:00", fin: "2026-11-16T18:54:00" },
]);

describe("banc d'étalonnage", () => {
    it("range chaque minute dans sa session", () => {
        expect(calme.minutes[0]).toBe("15:34");
        expect(crise.minutes[0]).toBe("18:13");
        expect(Object.keys(crise.marches)).toEqual(["SOL-USD"]);
    });

    it("compte les fausses alertes du réglage actuel", () => {
        const r = evaluerSeuil(calme, 3, 0);
        expect(r.alertes).toBe(3);
        expect(r.premiere).toBe("15:34");
        expect(r.marches).toEqual(["BTC-USD", "ETH-USD"]);
    });

    it("fait taire le marché réel avec une période de chauffe", () => {
        expect(evaluerSeuil(calme, 3, 5).alertes).toBe(0);
        expect(evaluerSeuil(crise, 3, 5).alertes).toBe(1);
        expect(reglageConseille(calme, crise)).toEqual({ seuil: 3, chauffe: 5 });
    });

    it("trouve le seuil qui sépare la crise du bruit sans chauffe", () => {
        expect(seuilSeparateur(calme, crise, 0)).toBe(5.1);
    });
});
