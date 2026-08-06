# AcartoRevenge

Pluginy dla Revenge (i forków: Kettu, ShiggyCord).

## Instalacja (dla siebie)

1. Otwórz Discord → Ustawienia → Plugins.
2. Wklej link:

```
https://caprined.github.io/AcartoRevenge/HelloAcarto
```

Powinien pojawić się toast "AcartoRevenge działa! 🎉" po otwarciu Discorda.
 
## Rozwój

```
npm install
npm run build
```

Zbudowane pliki lądują w `dist/`. Wypchnięcie na branch `main` uruchamia
GitHub Actions, które builduje wszystko i wystawia na GitHub Pages.

**WAŻNE — jednorazowa konfiguracja repo (musisz zrobić ręcznie na GitHubie):**
1. Ustawienia repo → Pages → Source: ustaw na "Deploy from a branch",
   branch `gh-pages` / `root` (workflow sam utworzy tę gałąź przy pierwszym pushu).
2. Wypełnij swoje prawdziwe Discord ID w `base_manifest.json` i
   `plugins/HelloAcarto/manifest.json` (pole `authors[0].id`).
