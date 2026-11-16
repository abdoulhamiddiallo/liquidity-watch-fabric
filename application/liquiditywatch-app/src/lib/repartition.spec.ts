import { describe, expect, it } from "vitest";
import type { DataTable } from "@microsoft/fabric-visuals-core";
import { minutesParNiveau, niveauDuLibelle } from "@/lib/repartition";

describe("répartition par niveau", () => {
    it("reconnaît les libellés du modèle", () => {
        expect(niveauDuLibelle("1 · Calme")).toBe("calme");
        expect(niveauDuLibelle("4 · Détresse")).toBe("detresse");
        expect(niveauDuLibelle(3)).toBeUndefined();
    });

    it("garde les quatre niveaux, zéro compris", () => {
        const table = {
            columns: [{ name: "Niveau" }, { name: "Minutes" }],
            rows: [["1 · Calme", 124], ["2 · Tendu", 1], ["4 · Détresse", 10]],
        } as unknown as DataTable;
        expect(minutesParNiveau(table)).toEqual({ calme: 124, tendu: 1, stress: 0, detresse: 10 });
    });
});
