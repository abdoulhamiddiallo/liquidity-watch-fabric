import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { lightThemeColors } from "@microsoft/fabric-visuals-core";
import App from "@/App";
import { ThemeContext } from "@/hooks/theme.context";

// Requêtes en cours de chargement : l'interface affiche ses squelettes sans appeler Fabric.
vi.mock("@/hooks/use-semantic-model-query", () => ({
    useSemanticModelQuery: () => ({ data: undefined, isLoading: true, error: undefined, refetch: vi.fn() }),
}));

function rendre() {
    return render(
        <ThemeContext.Provider value={{ isDark: true, toggleTheme: vi.fn(), theme: lightThemeColors }}>
            <App />
        </ThemeContext.Provider>,
    );
}

describe("App", () => {
    it("affiche les sept écrans de la salle de veille", () => {
        rendre();
        for (const libelle of ["Poste de veille", "Anatomie du stress", "Plateformes", "Stablecoins", "Contexte macro", "Main courante", "Étalonnage"]) {
            expect(screen.getByRole("tab", { name: new RegExp(libelle) })).toBeInTheDocument();
        }
        expect(screen.getByText(/modèle sémantique SM_LiquidityWatch/)).toBeInTheDocument();
    });

    it("ouvre l'écran Contexte macro depuis le rail", () => {
        rendre();
        const onglet = screen.getByRole("tab", { name: /Contexte macro/ });
        fireEvent.mouseDown(onglet, { button: 0 });
        fireEvent.click(onglet);
        expect(screen.getByRole("heading", { level: 1, name: "Le contexte macro" })).toBeInTheDocument();
    });

    it("change d'écran avec les touches 1 à 7", () => {
        rendre();
        fireEvent.keyDown(window, { key: "5" });
        expect(screen.getByRole("heading", { level: 1, name: "Le contexte macro" })).toBeInTheDocument();
    });
});
