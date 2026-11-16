import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("fusion des classes", () => {
    it("garde la taille du thème quand une couleur de texte suit", () => {
        expect(cn("text-hero-800 font-bold", "text-niveau-detresse")).toBe("text-hero-800 font-bold text-niveau-detresse");
        expect(cn("text-400", "text-muted-foreground")).toBe("text-400 text-muted-foreground");
    });
    it("remplace une taille par une autre", () => {
        expect(cn("text-300", "text-500")).toBe("text-500");
    });
});
