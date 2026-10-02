# Side Notes

Prywatne notatki obok edytora. Panel siedzi na activity barze i da się go przeciągnąć na drugi sidebar albo na dół, tak jak inne widoki.

Notatki nie wchodzą do repozytorium. Zostają w prywatnym storage rozszerzenia.

Działa w Cursorze i w VS Code od wersji 1.85.

Kod: https://github.com/michalsmolarek/side-notes

## Funkcje

- Dwa zakresy: **Global** (wspólne dla okien) i **Workspace** (dla otwartego folderu). Bez otwartego folderu Workspace pokazuje krótki komunikat, Global działa dalej.
- Jedna notatka to sam edytor i przycisk **+**. Od dwóch notatek dochodzą karty do przełączania.
- Nowa notatka, zmiana nazwy i usuwanie. Pierwsza nazywa się Note, kolejne Note 2, Note 3 i tak dalej.
- Tryb **Edit** to zwykłe pole tekstu. **Preview** renderuje GitHub Flavored Markdown: nagłówki, listy, listy zadań, tabele, cytaty, linie, linki, obrazki https, kod w linii, bloki kodu z kolorowaniem, przekreślenie i autolinki.
- Surowy HTML w treści nie jest renderowany. Link otwiera się poza panelem.
- Rozmiar czcionki: **A−**, **Reset**, **A+**. Krok 1 px, zakres 10–24. Reset wraca do czcionki motywu. Wybrany rozmiar zostaje po restarcie.
- Zapis jest automatyczny. Nie ma przycisku Save.
- Kolory i font biorą się z motywu edytora.
- Polecenia w Command Palette: **Side Notes: New note** i **Side Notes: Focus Side Notes**.

## Instalacja

Ta sama ścieżka w Cursorze i w VS Code.

1. Weź plik `side-notes-0.1.0.vsix`.
2. Otwórz Command Palette: `Cmd+Shift+P` na macOS, `Ctrl+Shift+P` na Windows i Linux.
3. Uruchom **Extensions: Install from VSIX…**.
4. Wskaż plik.
5. Jeśli ikony nie ma na activity barze, uruchom **Developer: Reload Window**.
6. Kliknij ikonę Side Notes.

## Gdzie leżą notatki

Nic nie jest zapisywane w otwartym projekcie.

- Global: katalog global storage rozszerzenia, `notes/index.json` oraz `notes/{id}.md`
- Workspace: katalog workspace storage rozszerzenia, ten sam układ
- Rozmiar czcionki: `preferences.json` w global storage
