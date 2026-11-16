//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import { useState, useEffect } from "react";

/** Thème de la salle : nuit par défaut, bascule jour / nuit à la demande. */
export function useAppTheme() {
    // Salle de veille : elle s'ouvre toujours en mode nuit, quel que soit le thème
    // de l'hôte ; le bouton jour / nuit reste le seul maître de la bascule.
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const racine = document.documentElement;
        const appliquer = () => {
            if (racine.classList.contains("dark") !== isDark) racine.classList.toggle("dark", isDark);
            if (racine.style.colorScheme !== (isDark ? "dark" : "light")) racine.style.colorScheme = isDark ? "dark" : "light";
        };
        appliquer();
        // L'hôte Fabric peut réécrire la classe du document : la salle garde le thème choisi.
        const observateur = new MutationObserver(appliquer);
        observateur.observe(racine, { attributes: true, attributeFilter: ["class", "style", "data-appearance"] });
        return () => observateur.disconnect();
    }, [isDark]);

    const toggleTheme = () => setIsDark((prev: boolean) => !prev);

    return { isDark, toggleTheme };
}
