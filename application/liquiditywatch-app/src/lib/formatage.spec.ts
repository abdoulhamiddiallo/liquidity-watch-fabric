import { describe, expect, it } from "vitest";
import {
    FORMATS,
    VALEUR_ABSENTE,
    decomposerDate,
    formaterDepart,
    formaterHeure,
    formaterJour,
    formaterValeur,
} from "@/lib/formatage";

/** Normalise les espaces insécables produits par la locale fr-FR. */
const espaces = (s: string) => s.replace(/[\u00a0\u202f]/g, " ");

describe("formaterValeur", () => {
    it("formate les entiers avec des espaces de milliers", () => {
        expect(espaces(formaterValeur(6480, FORMATS.entier))).toBe("6 480");
    });

    it("formate le LSI avec deux décimales", () => {
        expect(espaces(formaterValeur(5.98, FORMATS.lsi))).toBe("5,98");
    });

    it("formate les écarts en points de base", () => {
        expect(espaces(formaterValeur(-84.48, FORMATS.pb))).toBe("-84,5 pb");
        expect(espaces(formaterValeur(-0.6, FORMATS.pbSigne))).toBe("-0,6 pb");
    });

    it("formate le prix plancher en dollars", () => {
        expect(espaces(formaterValeur(0.991552, FORMATS.dollar))).toBe("0,9916 $");
    });

    it("formate la part du temps en pourcentage", () => {
        expect(espaces(formaterValeur(0.24444, FORMATS.pourcentage))).toBe("24 %");
    });

    it("affiche un libellé neutre pour les valeurs absentes", () => {
        expect(formaterValeur(null, FORMATS.entier)).toBe(VALEUR_ABSENTE);
        expect(formaterValeur(undefined, FORMATS.entier)).toBe(VALEUR_ABSENTE);
        expect(formaterValeur(Number.NaN, FORMATS.entier)).toBe(VALEUR_ABSENTE);
    });
});

describe("dates et heures", () => {
    it("décompose une chaîne ISO sans conversion de fuseau", () => {
        expect(decomposerDate("2026-10-30T08:30:00")).toEqual({
            annee: 2026, mois: 10, jour: 30, heures: 8, minutes: 30,
        });
    });

    it("formate un départ prévu en jj/MM HH:mm", () => {
        expect(formaterDepart("2026-10-31T18:15:00")).toBe("31/10 18:15");
        expect(formaterHeure("2026-10-21T06:00:00")).toBe("06:00");
        expect(formaterJour("2026-10-21T06:00:00")).toBe("21/10");
    });

    it("accepte un objet Date", () => {
        expect(formaterDepart(new Date(2026, 9, 21, 7, 5))).toBe("21/10 07:05");
    });

    it("renvoie le libellé neutre pour une valeur illisible", () => {
        expect(formaterDepart("pas une date")).toBe(VALEUR_ABSENTE);
        expect(formaterDepart(null)).toBe(VALEUR_ABSENTE);
    });
});
