import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { TableauKpi } from "@/components/signaletique/tableau-kpi";

// Valeurs réelles de la session du test de stress, mises en forme en fr-FR.
const TUILES = [
    { cle: "pic", libelle: "Pic de stress", valeur: "5,98", niveau: "detresse" as const, colorer: true, note: "à 18:19" },
    { cle: "usdt", libelle: "Pire écart USDT", valeur: "-84,5 pb", niveau: "detresse" as const },
    { cle: "carnets", libelle: "Carnets analysés", valeur: "6 480" },
];

describe("TableauKpi", () => {
    it("affiche chaque valeur en palettes avec son unité séparée", () => {
        render(<TableauKpi titre="Tableau de veille" tuiles={TUILES} chargement={false} nombreAttendu={3} />);
        const tableau = screen.getByRole("region", { name: "Tableau de veille" });
        const tuile = within(tableau).getByText("Pire écart USDT").closest("li")!;
        expect(within(tuile).getByText("pb")).toBeInTheDocument();
        expect(within(tableau).getByText("à 18:19")).toBeInTheDocument();
    });

    it("affiche des squelettes pendant le chargement", () => {
        const { container } = render(<TableauKpi titre="Tableau" tuiles={[]} chargement nombreAttendu={4} />);
        expect(container.querySelectorAll("li")).toHaveLength(4);
    });

    it("affiche un bandeau d'erreur", () => {
        render(<TableauKpi titre="Tableau" tuiles={[]} chargement={false} erreur={new Error("401 Unauthorized")} nombreAttendu={4} />);
        expect(screen.getByRole("alert")).toHaveTextContent("401 Unauthorized");
    });
});
