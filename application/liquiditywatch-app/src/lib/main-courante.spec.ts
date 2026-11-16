import { describe, expect, it } from "vitest";
import { construireMainCourante, evenementsAncrage, evenementsPlateformes, ficheIncident } from "@/lib/main-courante";
import { construireRejeu } from "@/lib/rejeu";

const h = (m: string) => `2026-11-16T18:${m}:00`;
const rejeu = construireRejeu([
    { heure: h("14"), marche: "SOL-USD", lsi: 0.12 },
    { heure: h("15"), marche: "SOL-USD", lsi: 3.56 },
    { heure: h("19"), marche: "SOL-USD", lsi: 5.98 },
    { heure: h("24"), marche: "SOL-USD", lsi: 3.36 },
    { heure: h("25"), marche: "SOL-USD", lsi: -0.37 },
    { heure: h("15"), marche: "BTC-USD", lsi: 0.39 },
]);

describe("main courante", () => {
    it("dresse la fiche de l'incident", () => {
        expect(ficheIncident(rejeu)).toEqual({
            debut: "18:15",
            fin: "18:24",
            pic: 5.98,
            picMinute: "18:19",
            picMarche: "SOL-USD",
            minutesDetresse: 3,
            retourCalme: "18:25",
            marchesTouches: ["SOL-USD"],
        });
    });

    it("ne signale aucun incident sous le seuil de détresse", () => {
        expect(ficheIncident(construireRejeu([{ heure: h("10"), marche: "BTC-USD", lsi: 1.2 }]))).toBeNull();
    });

    it("consigne les changements d'état des ancrages", () => {
        const ev = evenementsAncrage([
            { heure: h("14"), serie: "USDT · Kraken", ecart: -9 },
            { heure: h("16"), serie: "USDT · Kraken", ecart: -31 },
            { heure: h("17"), serie: "USDT · Kraken", ecart: -84.5 },
            { heure: h("23"), serie: "USDT · Kraken", ecart: -44 },
            { heure: h("25"), serie: "USDT · Kraken", ecart: -10 },
        ]);
        expect(ev.map((e) => [e.heure, e.titre])).toEqual([
            ["18:16", "USDT · Kraken passe sous surveillance"],
            ["18:17", "USDT · Kraken décroche du dollar"],
            ["18:23", "USDT · Kraken repasse au-dessus du seuil de décrochage"],
            ["18:25", "USDT · Kraken se réancre"],
        ]);
    });

    it("retient la première et la plus forte anomalie", () => {
        const ev = evenementsPlateformes([
            { heure: "2026-11-16T18:20:00", plateforme: "Binance", marche: "SOL-USD", observee: 46.25, habituelle: 1.4, score: 320.8 },
            { heure: "2026-11-16T18:18:00", plateforme: "Binance", marche: "SOL-USD", observee: 39.41, habituelle: 1.4, score: 271.9 },
        ]);
        expect(ev.map((e) => e.heure)).toEqual(["18:18", "18:20"]);
    });

    it("fond toutes les familles dans l'ordre chronologique", () => {
        const ev = construireMainCourante(rejeu, [{ heure: h("16"), serie: "USDT · Kraken", ecart: -9 }, { heure: h("17"), serie: "USDT · Kraken", ecart: -60 }], []);
        expect(ev.map((e) => `${e.heure} ${e.famille}`)).toEqual(["18:15 indice", "18:17 stablecoin", "18:25 indice"]);
    });
});
