import { describe, expect, it } from "vitest";
import { niveauAncrage, niveauEtat, niveauLsi, separerUnite } from "./affichage";

describe("affichage", () => {
    it("sépare chiffres et unité", () => {
        expect(separerUnite("-84,5 pb")).toEqual({ chiffres: "-84,5", unite: "pb" });
        expect(separerUnite("SOL-USD")).toEqual({ chiffres: "SOL-USD", unite: "" });
    });

    it("classe le LSI selon les seuils 1, 2 et 3", () => {
        expect(niveauLsi(0.4)).toBe("calme");
        expect(niveauLsi(1)).toBe("tendu");
        expect(niveauLsi(2.5)).toBe("stress");
        expect(niveauLsi(5.98)).toBe("detresse");
        expect(niveauLsi(null)).toBeUndefined();
    });

    it("classe un ancrage selon son pire écart", () => {
        expect(niveauAncrage(-2.5)).toBe("calme");
        expect(niveauAncrage(-25)).toBe("tendu");
        expect(niveauAncrage(-84.48)).toBe("detresse");
        expect(niveauEtat("Décrochage")).toBe("detresse");
    });
});
