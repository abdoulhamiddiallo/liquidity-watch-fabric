import * as Tabs from "@radix-ui/react-tabs";
import { Keyboard, MonitorPlay, Radio, Square } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BoutonTheme } from "@/components/structure/bouton-theme";
import { Horloge } from "@/components/structure/horloge";
import { Marque } from "@/components/structure/marque";
import { RailNavigation } from "@/components/structure/rail-navigation";
import { SECTIONS, type IdSection } from "@/components/structure/sections";
import { Telescripteur } from "@/components/structure/telescripteur";
import { SelecteurSession } from "@/components/veille/selecteurs";
import { SelectionContext, type ContexteSelection } from "@/hooks/selection.context";
import { useSessions } from "@/hooks/use-sessions";
import { PageAnatomie } from "@/pages/page-anatomie";
import { PageMacro } from "@/pages/page-macro";
import { PageMainCourante } from "@/pages/page-main-courante";
import { PageEtalonnage } from "@/pages/page-etalonnage";
import { PagePlateformes } from "@/pages/page-plateformes";
import { PageStablecoins } from "@/pages/page-stablecoins";
import { PageVeille } from "@/pages/page-veille";

/** Durée d'affichage de chaque écran en mode mur (ms), alignée sur l'animation du minuteur. */
const DUREE_ECRAN_MUR = 20_000;

/** Bandeau supérieur : écran courant, choix de la session, mode mur, horloge, thème et téléscripteur. */
function BandeauSuperieur({ section, session, mur, basculerMur }: { section: IdSection; session: string | null; mur: boolean; basculerMur: () => void }) {
    const courante = SECTIONS.find((s) => s.id === section)!;
    return (
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur print:hidden">
            <div className="mx-auto flex w-full max-w-screen-2xl flex-wrap items-center justify-between gap-3 px-4 py-2 lg:px-8">
                <p className="flex items-center gap-2 font-heading text-200 font-semibold uppercase leading-200 tracking-widest text-muted-foreground">
                    <span className="inline-flex h-6 items-center rounded-sm bg-primary px-1.5 font-numeric text-primary-foreground">
                        Écran {courante.voie}
                    </span>
                    {courante.libelle}
                </p>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <SessionsEnTete />
                    <button
                        type="button"
                        onClick={basculerMur}
                        aria-pressed={mur}
                        title="Mode mur : les sept écrans défilent seuls, toutes les 20 secondes (touche M)"
                        className={
                            mur
                                ? "inline-flex h-8 items-center gap-1.5 rounded-lg border border-niveau-detresse bg-niveau-detresse px-2.5 text-200 font-semibold leading-200 text-white shadow-4"
                                : "inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-200 font-semibold leading-200 text-foreground shadow-2 hover:border-highlight hover:text-highlight"
                        }
                    >
                        {mur ? <Square className="icon-size-100" aria-hidden="true" /> : <MonitorPlay className="icon-size-200" aria-hidden="true" />}
                        {mur ? "Arrêter le mur" : "Mode mur"}
                    </button>
                    <Horloge className="inline-flex h-8 items-center rounded-lg bg-board px-2.5 font-numeric text-300 font-bold tracking-widest text-board-foreground shadow-2" />
                    <BoutonTheme />
                </div>
            </div>
            {mur && <div key={section} aria-hidden="true" className="h-0.5 origin-left bg-niveau-detresse animate-minuteur-mur" />}
            {session && <Telescripteur session={session} />}
        </header>
    );
}

function SessionsEnTete() {
    return (
        <SelectionContext.Consumer>
            {(c) =>
                c ? <SelecteurSession sessions={c.sessions} valeur={c.session} onChange={c.choisirSession} chargement={c.chargementSessions} /> : null
            }
        </SelectionContext.Consumer>
    );
}

function App() {
    const [section, setSection] = useState<IdSection>("veille");
    const { sessions, isLoading } = useSessions();
    const [choix, setSession] = useState<string | null>(null);
    const [marche, setMarche] = useState<string | null>(null);

    const [mur, setMur] = useState(false);

    // Mode mur : les écrans s'enchaînent seuls, comme sur un mur de salle de surveillance.
    useEffect(() => {
        if (!mur) return;
        const minuteur = window.setInterval(() => {
            setSection((s) => SECTIONS[(SECTIONS.findIndex((x) => x.id === s) + 1) % SECTIONS.length].id);
        }, DUREE_ECRAN_MUR);
        return () => window.clearInterval(minuteur);
    }, [mur, section]);

    // Raccourcis clavier : 1 à 7 pour les écrans, M pour le mode mur.
    useEffect(() => {
        const surTouche = (e: KeyboardEvent) => {
            const cible = e.target as HTMLElement | null;
            if (e.ctrlKey || e.metaKey || e.altKey || (cible && ["INPUT", "TEXTAREA", "SELECT"].includes(cible.tagName))) return;
            const rang = Number(e.key);
            if (rang >= 1 && rang <= SECTIONS.length) setSection(SECTIONS[rang - 1].id);
            else if (e.key === "m" || e.key === "M") setMur((x) => !x);
        };
        window.addEventListener("keydown", surTouche);
        return () => window.removeEventListener("keydown", surTouche);
    }, []);

    const basculerMur = () => {
        if (!mur) document.documentElement.requestFullscreen?.().catch(() => undefined);
        else if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined);
        setMur(!mur);
    };

    // Tant qu'aucune session n'est choisie, la salle s'ouvre sur la plus récente.
    const session = choix ?? sessions[0]?.libelle ?? null;

    const selection = useMemo<ContexteSelection>(
        () => ({ sessions, chargementSessions: isLoading, session, choisirSession: setSession, marche, choisirMarche: setMarche }),
        [sessions, isLoading, session, marche],
    );

    return (
        <SelectionContext.Provider value={selection}>
            <Tabs.Root
                value={section}
                onValueChange={(valeur) => setSection(valeur as IdSection)}
                orientation="vertical"
                className="flex min-h-full flex-col bg-background lg:flex-row"
            >
                <div className="shrink-0 bg-rail lg:w-72 print:hidden">
                    <aside className="z-40 flex shrink-0 flex-col bg-rail text-rail-foreground lg:sticky lg:top-0 lg:h-screen lg:w-72">
                        <div className="px-4 pb-3 pt-4 lg:px-5 lg:pb-6 lg:pt-6">
                            <Marque />
                        </div>
                        <RailNavigation />
                        <div className="mt-auto hidden px-5 pb-6 lg:block">
                            <div className="rounded-xl border border-rail-muted/30 p-3">
                                <p className="flex items-center gap-2 text-200 font-semibold uppercase leading-200 tracking-widest text-rail-muted">
                                    <Radio className="icon-size-200 text-highlight" aria-hidden="true" />
                                    Chaîne temps réel
                                </p>
                                <p className="mt-1.5 text-200 leading-200 text-rail-foreground/80">
                                    Eventstream, Eventhouse et KQL calculent l'indice ; Activator alerte sur Teams dès qu'un marché passe en détresse.
                                </p>
                            </div>
                            <p className="mt-3 flex items-center gap-2 px-1 text-100 leading-100 text-rail-muted">
                                <Keyboard className="icon-size-200" aria-hidden="true" />
                                <span>
                                    <kbd className="font-numeric text-rail-foreground">1</kbd> à <kbd className="font-numeric text-rail-foreground">7</kbd> écrans ·{" "}
                                    <kbd className="font-numeric text-rail-foreground">M</kbd> mode mur · <kbd className="font-numeric text-rail-foreground">R</kbd> rejeu
                                </span>
                            </p>
                        </div>
                    </aside>
                </div>

                <div className="flex min-w-0 flex-1 flex-col trame-quai">
                    <BandeauSuperieur section={section} session={session} mur={mur} basculerMur={basculerMur} />

                    <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 lg:px-8">
                        <Tabs.Content value="veille" className="focus-visible:outline-none">
                            {session && <PageVeille key={session} />}
                        </Tabs.Content>
                        <Tabs.Content value="anatomie" className="focus-visible:outline-none">
                            {session && <PageAnatomie />}
                        </Tabs.Content>
                        <Tabs.Content value="plateformes" className="focus-visible:outline-none">
                            {session && <PagePlateformes />}
                        </Tabs.Content>
                        <Tabs.Content value="stablecoins" className="focus-visible:outline-none">
                            {session && <PageStablecoins />}
                        </Tabs.Content>
                        <Tabs.Content value="macro" className="focus-visible:outline-none">
                            <PageMacro />
                        </Tabs.Content>
                        <Tabs.Content value="incident" className="focus-visible:outline-none">
                            {session && <PageMainCourante key={session} />}
                        </Tabs.Content>
                        <Tabs.Content value="etalonnage" className="focus-visible:outline-none">
                            {sessions.length > 0 && <PageEtalonnage />}
                        </Tabs.Content>
                    </main>

                    <footer className="border-t border-border print:border-0">
                        <p className="mx-auto w-full max-w-screen-2xl px-4 py-4 text-200 leading-200 text-muted-foreground lg:px-8">
                            Données : modèle sémantique SM_LiquidityWatch, alimenté par l'Eventhouse EH_LiquidityWatch · carnets publics Binance, Kraken, Coinbase · VIX (CBOE), €STR (BCE) · Microsoft Fabric
                        </p>
                    </footer>
                </div>
            </Tabs.Root>
        </SelectionContext.Provider>
    );
}

export default App;
